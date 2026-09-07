import { useEffect, useState } from 'react';
import {
  getCategories, getNominees, getPricePerVote,
  adminCreateCategory, adminUpdateCategory, adminDeleteCategory,
  adminCreateNominee, adminUpdateNominee, adminDeleteNominee,
  adminUpdatePrice, adminGetAllVotes, adminReconcilePending, adminReconcileFull,
  adminGetEarningsSummary, adminUpdatePlatformFee,
} from '../api';
import { socket } from '../socket';

const SESSION_KEY = 'awards_admin_key';

export default function Admin() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(SESSION_KEY) || '');
  const [unlocked, setUnlocked] = useState(!!sessionStorage.getItem(SESSION_KEY));
  const [keyInput, setKeyInput] = useState('');
  const [authError, setAuthError] = useState('');

  const handleUnlock = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await adminGetAllVotes(keyInput);
      sessionStorage.setItem(SESSION_KEY, keyInput);
      setAdminKey(keyInput);
      setUnlocked(true);
    } catch (err) {
      setAuthError('Invalid admin key.');
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(180deg, var(--color-green-deep) 0%, var(--color-green-mid) 100%)' }}>
        <form onSubmit={handleUnlock} className="bg-white rounded-xl p-8 w-full max-w-sm shadow-2xl" style={{ border: '1px solid #E2E0D5' }}>
          <h1 className="font-display text-2xl mb-1" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>Admin access</h1>
          <p className="text-xs mb-5" style={{ color: 'var(--color-ink-soft)' }}>Enter the admin key to manage categories, nominees, and earnings.</p>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Admin key"
            className="w-full rounded-md px-3 py-2 mb-3"
            style={{ background: 'var(--color-paper)', border: '1px solid #E2E0D5', color: 'var(--color-ink)' }}
          />
          {authError && <p className="text-red-600 text-sm mb-3">{authError}</p>}
          <button type="submit" className="w-full text-white font-medium rounded-md py-2 text-sm hover:opacity-90"
            style={{ background: 'var(--color-green-deep)' }}>
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return <AdminDashboard adminKey={adminKey} onLogout={() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
  }} />;
}

function AdminDashboard({ adminKey, onLogout }) {
  const [tab, setTab] = useState('overview');
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'categories', label: 'Categories' },
    { id: 'nominees', label: 'Nominees' },
    { id: 'price', label: 'Vote price & fee' },
    { id: 'transactions', label: 'Transactions' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-paper)' }}>
      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl" style={{ color: 'var(--color-green-deep)', fontWeight: 600 }}>Admin dashboard</h1>
            <span
              className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium"
              style={{
                background: connected ? 'rgba(31,157,85,0.12)' : 'rgba(220,38,38,0.1)',
                color: connected ? 'var(--color-green-deep)' : '#DC2626',
              }}
            >
              <span className="live-dot" style={{ background: connected ? 'var(--color-emerald)' : '#DC2626' }} />
              {connected ? 'Live' : 'Reconnecting…'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md" style={{ background: 'var(--color-ink)' }}>
              <span className="text-[10px] uppercase tracking-wide text-white/60">by</span>
              <img src="/images/proxafrica-logo.png" alt="ProxAfrica" className="h-3.5 w-auto" />
            </div>
            <button onClick={onLogout} className="text-sm hover:underline" style={{ color: 'var(--color-ink-soft)' }}>Log out</button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b overflow-x-auto" style={{ borderColor: '#E2E0D5' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 text-sm font-medium -mb-px border-b-2 transition whitespace-nowrap"
              style={{
                borderColor: tab === t.id ? 'var(--color-green-deep)' : 'transparent',
                color: tab === t.id ? 'var(--color-green-deep)' : 'var(--color-ink-soft)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab adminKey={adminKey} />}
        {tab === 'categories' && <CategoriesTab adminKey={adminKey} />}
        {tab === 'nominees' && <NomineesTab adminKey={adminKey} />}
        {tab === 'price' && <PriceTab adminKey={adminKey} />}
        {tab === 'transactions' && <TransactionsTab adminKey={adminKey} />}
      </div>
    </div>
  );
}

// ---- Overview: the colorful earnings + payment-health dashboard ----
function OverviewTab({ adminKey }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => adminGetEarningsSummary(adminKey).then(setSummary).finally(() => setLoading(false));

  useEffect(() => {
    load();
    const onUpdate = () => load();
    socket.on('earnings:updated', onUpdate);
    socket.on('vote:updated', onUpdate);
    return () => {
      socket.off('earnings:updated', onUpdate);
      socket.off('vote:updated', onUpdate);
    };
  }, [adminKey]);

  if (loading || !summary) {
    return (
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton rounded-2xl" style={{ height: 110 }} />)}
      </div>
    );
  }

  const naira = (kobo) => `₦${(kobo / 100).toLocaleString()}`;

  const cards = [
    {
      label: 'Total votes cast', value: summary.total_votes.toLocaleString(), icon: '🗳️',
      color: 'var(--color-admin-purple)', soft: 'var(--color-admin-purple-soft)',
    },
    {
      label: 'Total collected', value: naira(summary.total_collected_kobo), icon: '💰',
      color: 'var(--color-admin-blue)', soft: 'var(--color-admin-blue-soft)',
    },
    {
      label: 'Organizer earned', value: naira(summary.organizer_earned_kobo), icon: '🏆',
      color: 'var(--color-green-deep)', soft: 'rgba(31,157,85,0.12)',
    },
    {
      label: 'ProxAfrica fee', value: naira(summary.platform_fee_kobo), icon: '⚡',
      color: 'var(--color-admin-coral)', soft: 'var(--color-admin-coral-soft)',
    },
  ];

  const health = [
    { label: 'Confirmed', value: summary.confirmed_count, color: 'var(--color-green-deep)', soft: 'rgba(31,157,85,0.12)' },
    { label: 'Auto-reconciling', value: summary.pending_count, color: 'var(--color-admin-amber)', soft: 'var(--color-admin-amber-soft)' },
    { label: 'Failed (declined)', value: summary.failed_count, color: 'var(--color-admin-coral)', soft: 'var(--color-admin-coral-soft)' },
  ];

  const feePercent = summary.platform_fee_percent;

  return (
    <div>
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {cards.map(c => (
          <div key={c.label} className="stat-card" style={{ background: c.soft }}>
            <div className="stat-card-icon" style={{ background: 'white' }}>{c.icon}</div>
            <p className="text-[12px] mb-1" style={{ color: 'var(--color-ink-soft)' }}>{c.label}</p>
            <p className="font-mono-tally text-xl font-semibold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1.3fr_1fr]">
        <div className="ballot-stub rounded-xl">
          <div className="ballot-stub-content py-4 pr-5">
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-ink)' }}>Payment health</p>
            <div className="grid gap-2">
              {health.map(h => (
                <div key={h.label} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: h.soft }}>
                  <span className="text-sm" style={{ color: 'var(--color-ink)' }}>{h.label}</span>
                  <span className="font-mono-tally font-semibold" style={{ color: h.color }}>{h.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ballot-stub rounded-xl">
          <div className="ballot-stub-content py-4 pr-5">
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-ink)' }}>Per ₦100 vote split</p>
            <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${100 - feePercent}%`, background: 'var(--color-emerald)' }} />
              <div style={{ width: `${feePercent}%`, background: 'var(--color-admin-coral)' }} />
            </div>
            <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--color-ink-soft)' }}>
              <span>Organizer ₦{(100 - feePercent).toFixed(0)}</span>
              <span>ProxAfrica ₦{feePercent.toFixed(0)}</span>
            </div>
            <p className="text-[11px] mt-3" style={{ color: 'var(--color-ink-soft)' }}>
              Adjust the fee % in "Vote price &amp; fee". Changes only apply to votes confirmed afterward.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoriesTab({ adminKey }) {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const load = () => getCategories().then(setCategories);
  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!newName.trim()) return;
    try {
      await adminCreateCategory(adminKey, newName.trim());
      setNewName('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add category');
    }
  };

  const toggleOpen = async (c) => {
    await adminUpdateCategory(adminKey, c.id, { is_open: !c.is_open });
    load();
  };

  const remove = async (c) => {
    if (!confirm(`Delete "${c.name}"? This also deletes all its nominees and votes.`)) return;
    await adminDeleteCategory(adminKey, c.id);
    load();
  };

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded-md px-3 py-2 text-sm"
          style={{ background: 'white', border: '1px solid #E2E0D5', color: 'var(--color-ink)' }}
        />
        <button type="submit" className="text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90"
          style={{ background: 'var(--color-green-deep)' }}>
          Add category
        </button>
      </form>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="grid gap-2">
        {categories.map(c => (
          <div key={c.id} className="ballot-stub rounded-lg flex items-center justify-between">
            <div className="ballot-stub-content py-3 pr-4 flex items-center justify-between w-full">
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{c.name}</span>
                <span className="text-xs ml-2 font-mono-tally" style={{ color: 'var(--color-ink-soft)' }}>
                  #{c.id} · {c.nominee_count} nominees
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    background: c.is_open ? 'rgba(31,157,85,0.12)' : 'rgba(220,38,38,0.1)',
                    color: c.is_open ? 'var(--color-green-deep)' : '#DC2626',
                  }}
                >
                  {c.is_open ? 'Open' : 'Closed'}
                </span>
                <button onClick={() => toggleOpen(c)} className="text-xs hover:underline" style={{ color: 'var(--color-ink-soft)' }}>
                  {c.is_open ? 'Close' : 'Reopen'}
                </button>
                <button onClick={() => remove(c)} className="text-xs text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NomineesTab({ adminKey }) {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [nominees, setNominees] = useState([]);
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { getCategories().then(setCategories); }, []);

  const loadNominees = (catId) => {
    if (!catId) { setNominees([]); return; }
    getNominees(catId).then(setNominees);
  };

  useEffect(() => { loadNominees(categoryId); }, [categoryId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!categoryId) return setError('Choose a category first.');
    if (!name.trim()) return setError('Nominee name is required.');
    try {
      await adminCreateNominee(adminKey, { category_id: categoryId, name: name.trim(), photo_url: photoUrl.trim() || null });
      setName('');
      setPhotoUrl('');
      loadNominees(categoryId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add nominee');
    }
  };

  const remove = async (n) => {
    if (!confirm(`Delete nominee "${n.name}"? This also deletes their votes.`)) return;
    await adminDeleteNominee(adminKey, n.id);
    loadNominees(categoryId);
  };

  return (
    <div>
      <div className="mb-5">
        <label className="text-xs block mb-1" style={{ color: 'var(--color-ink-soft)' }}>Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-md px-3 py-2 text-sm"
          style={{ background: 'white', border: '1px solid #E2E0D5', color: 'var(--color-ink)' }}
        >
          <option value="">Select a category…</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {categoryId && (
        <>
          <form onSubmit={handleAdd} className="grid gap-2 mb-6 sm:flex">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nominee name"
              className="flex-1 rounded-md px-3 py-2 text-sm"
              style={{ background: 'white', border: '1px solid #E2E0D5', color: 'var(--color-ink)' }}
            />
            <input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Photo URL (optional)"
              className="flex-1 rounded-md px-3 py-2 text-sm"
              style={{ background: 'white', border: '1px solid #E2E0D5', color: 'var(--color-ink)' }}
            />
            <button type="submit" className="text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 whitespace-nowrap"
              style={{ background: 'var(--color-green-deep)' }}>
              Add nominee
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

          <div className="grid gap-2">
            {nominees.map(n => (
              <div key={n.id} className="ballot-stub rounded-lg flex items-center justify-between">
                <div className="ballot-stub-content py-3 pr-4 flex items-center justify-between w-full">
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>{n.name}</span>
                    <span className="text-xs ml-2 font-mono-tally" style={{ color: 'var(--color-green-deep)' }}>
                      {n.total_votes} votes
                    </span>
                  </div>
                  <button onClick={() => remove(n)} className="text-xs text-red-600 hover:underline">Delete</button>
                </div>
              </div>
            ))}
            {nominees.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>No nominees yet in this category.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PriceTab({ adminKey }) {
  const [price, setPrice] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [feePercent, setFeePercent] = useState('');
  const [feeSaved, setFeeSaved] = useState(false);
  const [feeError, setFeeError] = useState('');

  useEffect(() => {
    getPricePerVote().then(p => setPrice(p.price_per_vote_naira));
  }, []);

  useEffect(() => {
    import('../api').then(({ getPlatformFee }) => getPlatformFee().then(f => setFeePercent(f.platform_fee_percent)));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      await adminUpdatePrice(adminKey, parseFloat(price));
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update price');
    }
  };

  const handleFeeSave = async (e) => {
    e.preventDefault();
    setFeeError('');
    setFeeSaved(false);
    try {
      await adminUpdatePlatformFee(adminKey, parseFloat(feePercent));
      setFeeSaved(true);
    } catch (err) {
      setFeeError(err.response?.data?.error || 'Failed to update platform fee');
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 max-w-xl">
      <form onSubmit={handleSave}>
        <label className="text-xs block mb-1" style={{ color: 'var(--color-ink-soft)' }}>Price per vote (₦)</label>
        <input
          type="number" min="1" step="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-md px-3 py-2 text-sm mb-3"
          style={{ background: 'white', border: '1px solid #E2E0D5', color: 'var(--color-ink)' }}
        />
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {saved && <p className="text-sm mb-3" style={{ color: 'var(--color-green-deep)' }}>Price updated.</p>}
        <button type="submit" className="text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90"
          style={{ background: 'var(--color-green-deep)' }}>
          Save price
        </button>
      </form>

      <form onSubmit={handleFeeSave}>
        <label className="text-xs block mb-1" style={{ color: 'var(--color-ink-soft)' }}>ProxAfrica platform fee (%)</label>
        <input
          type="number" min="0" max="100" step="1"
          value={feePercent}
          onChange={(e) => setFeePercent(e.target.value)}
          className="w-full rounded-md px-3 py-2 text-sm mb-3"
          style={{ background: 'white', border: '1px solid var(--color-admin-coral)', color: 'var(--color-ink)' }}
        />
        {feeError && <p className="text-red-600 text-sm mb-3">{feeError}</p>}
        {feeSaved && <p className="text-sm mb-3" style={{ color: 'var(--color-admin-coral)' }}>Fee updated. Applies to new payments only.</p>}
        <button type="submit" className="text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90"
          style={{ background: 'var(--color-admin-coral)' }}>
          Save fee %
        </button>
      </form>
    </div>
  );
}

function TransactionsTab({ adminKey }) {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);
  const [fullReconciling, setFullReconciling] = useState(false);

  const load = () => {
    setLoading(true);
    adminGetAllVotes(adminKey).then(setVotes).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const onUpdate = () => load();
    socket.on('vote:updated', onUpdate);
    return () => socket.off('vote:updated', onUpdate);
  }, [adminKey]);

  const handleReconcile = async () => {
    setReconciling(true);
    setReconcileResult(null);
    try {
      const result = await adminReconcilePending(adminKey);
      setReconcileResult(result);
      load();
    } catch (err) {
      setReconcileResult({ error: err.response?.data?.error || 'Reconcile failed' });
    } finally {
      setReconciling(false);
    }
  };

  const handleFullReconcile = async () => {
    setFullReconciling(true);
    setReconcileResult(null);
    try {
      const result = await adminReconcileFull(adminKey);
      setReconcileResult(result);
      load();
    } catch (err) {
      setReconcileResult({ error: err.response?.data?.error || 'Full reconcile failed' });
    } finally {
      setFullReconciling(false);
    }
  };

  const pendingCount = votes.filter(v => v.status === 'pending').length;
  const totalRevenue = votes.filter(v => v.status === 'success').reduce((sum, v) => sum + v.amount_paid, 0) / 100;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <p className="text-sm font-mono-tally" style={{ color: 'var(--color-green-deep)' }}>
          Total confirmed revenue: ₦{totalRevenue.toLocaleString()}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleReconcile}
            disabled={reconciling || pendingCount === 0}
            className="text-white text-xs font-medium px-3 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--color-green-deep)' }}
          >
            {reconciling ? 'Checking…' : `Reconcile ${pendingCount} pending`}
          </button>
          <button
            onClick={handleFullReconcile}
            disabled={fullReconciling}
            className="text-white text-xs font-medium px-3 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--color-admin-blue)' }}
            title="Cross-checks EVERY Paystack transaction against the database, including any missing entirely"
          >
            {fullReconciling ? 'Syncing with Paystack…' : 'Full sync with Paystack'}
          </button>
        </div>
      </div>

      <p className="text-[11px] mb-4" style={{ color: 'var(--color-ink-soft)' }}>
        Note: an automatic background job already re-checks any payment stuck pending for 3+ minutes every 90 seconds —
        these buttons are just a manual backup, not required for normal operation.
      </p>

      {reconcileResult && !reconcileResult.error && (
        <p className="text-xs mb-4 px-3 py-2 rounded-md" style={{ background: 'rgba(31,157,85,0.1)', color: 'var(--color-green-deep)' }}>
          {reconcileResult.fetchedFromPaystack !== undefined
            ? `Fetched ${reconcileResult.fetchedFromPaystack} from Paystack · Updated ${reconcileResult.updated} · Inserted ${reconcileResult.inserted} · Unchanged ${reconcileResult.unchanged}`
            : `Checked ${reconcileResult.checked} · Confirmed ${reconcileResult.confirmed} · Failed ${reconcileResult.failed} · Still pending ${reconcileResult.stillPending}`}
        </p>
      )}
      {reconcileResult?.error && (
        <p className="text-xs mb-4 text-red-600">{reconcileResult.error}</p>
      )}

      {loading && <p className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>Loading transactions…</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: '#E2E0D5', color: 'var(--color-ink-soft)' }}>
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Category</th>
              <th className="py-2 pr-3">Nominee</th>
              <th className="py-2 pr-3">Voter</th>
              <th className="py-2 pr-3">Votes</th>
              <th className="py-2 pr-3">Amount</th>
              <th className="py-2 pr-3">Split (org / fee)</th>
              <th className="py-2 pr-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {votes.map(v => (
              <tr key={v.id} className="border-b" style={{ borderColor: '#F0EEE5' }}>
                <td className="py-2 pr-3 whitespace-nowrap" style={{ color: 'var(--color-ink-soft)' }}>
                  {new Date(v.created_at).toLocaleString()}
                </td>
                <td className="py-2 pr-3">{v.category_name}</td>
                <td className="py-2 pr-3">{v.nominee_name}</td>
                <td className="py-2 pr-3">{v.voter_name || '—'} {v.voter_phone ? `(${v.voter_phone})` : ''}</td>
                <td className="py-2 pr-3 font-mono-tally">{v.vote_count}</td>
                <td className="py-2 pr-3 font-mono-tally">₦{(v.amount_paid / 100).toLocaleString()}</td>
                <td className="py-2 pr-3 font-mono-tally text-xs" style={{ color: 'var(--color-ink-soft)' }}>
                  {v.status === 'success'
                    ? `₦${(v.organizer_payout_kobo / 100).toLocaleString()} / ₦${(v.platform_fee_kobo / 100).toLocaleString()}`
                    : '—'}
                </td>
                <td className="py-2 pr-3">
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      background: v.status === 'success' ? 'rgba(31,157,85,0.12)' : v.status === 'failed' ? 'var(--color-admin-coral-soft)' : 'var(--color-admin-amber-soft)',
                      color: v.status === 'success' ? 'var(--color-green-deep)' : v.status === 'failed' ? 'var(--color-admin-coral)' : 'var(--color-admin-amber)',
                    }}
                    title={v.status === 'failed' ? (v.failure_reason || '') : ''}
                  >
                    {v.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && votes.length === 0 && (
          <p className="text-sm mt-3" style={{ color: 'var(--color-ink-soft)' }}>No transactions yet.</p>
        )}
      </div>
    </div>
  );
}

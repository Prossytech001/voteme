import { useEffect, useState } from 'react';
import {
  getCategories, getNominees, getPricePerVote,
  adminCreateCategory, adminUpdateCategory, adminDeleteCategory,
  adminCreateNominee, adminUpdateNominee, adminDeleteNominee,
  adminUpdatePrice, adminGetAllVotes, adminReconcilePending,
} from '../api';

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
      // Cheap way to validate the key: try a harmless admin call
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
          <p className="text-xs mb-5" style={{ color: 'var(--color-ink-soft)' }}>Enter the admin key to manage categories and nominees.</p>
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
  const [tab, setTab] = useState('categories');

  const tabs = [
    { id: 'categories', label: 'Categories' },
    { id: 'nominees', label: 'Nominees' },
    { id: 'price', label: 'Vote price' },
    { id: 'transactions', label: 'Transactions' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-paper)' }}>
      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl" style={{ color: 'var(--color-green-deep)', fontWeight: 600 }}>Admin dashboard</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md" style={{ background: 'var(--color-ink)' }}>
              <span className="text-[10px] uppercase tracking-wide text-white/60">by</span>
              <img src="/images/proxafrica-logo.png" alt="ProxAfrica" className="h-3.5 w-auto" />
            </div>
            <button onClick={onLogout} className="text-sm hover:underline" style={{ color: 'var(--color-ink-soft)' }}>Log out</button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: '#E2E0D5' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 text-sm font-medium -mb-px border-b-2 transition"
              style={{
                borderColor: tab === t.id ? 'var(--color-green-deep)' : 'transparent',
                color: tab === t.id ? 'var(--color-green-deep)' : 'var(--color-ink-soft)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'categories' && <CategoriesTab adminKey={adminKey} />}
        {tab === 'nominees' && <NomineesTab adminKey={adminKey} />}
        {tab === 'price' && <PriceTab adminKey={adminKey} />}
        {tab === 'transactions' && <TransactionsTab adminKey={adminKey} />}
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

  useEffect(() => {
    getPricePerVote().then(p => setPrice(p.price_per_vote_naira));
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

  return (
    <form onSubmit={handleSave} className="max-w-xs">
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
  );
}

function TransactionsTab({ adminKey }) {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);

  const load = () => {
    setLoading(true);
    adminGetAllVotes(adminKey).then(setVotes).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [adminKey]);

  const handleReconcile = async () => {
    setReconciling(true);
    setReconcileResult(null);
    try {
      const result = await adminReconcilePending(adminKey);
      setReconcileResult(result);
      load(); // refresh the table to show updated statuses
    } catch (err) {
      setReconcileResult({ error: err.response?.data?.error || 'Reconcile failed' });
    } finally {
      setReconciling(false);
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
        <button
          onClick={handleReconcile}
          disabled={reconciling || pendingCount === 0}
          className="text-white text-xs font-medium px-3 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--color-green-deep)' }}
        >
          {reconciling ? 'Checking with Paystack…' : `Reconcile ${pendingCount} pending payment${pendingCount === 1 ? '' : 's'}`}
        </button>
      </div>

      {reconcileResult && !reconcileResult.error && (
        <p className="text-xs mb-4 px-3 py-2 rounded-md" style={{ background: 'rgba(31,157,85,0.1)', color: 'var(--color-green-deep)' }}>
          Checked {reconcileResult.checked} · Confirmed {reconcileResult.confirmed} · Failed {reconcileResult.failed} · Still pending {reconcileResult.stillPending}
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
                <td className="py-2 pr-3">
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      background: v.status === 'success' ? 'rgba(31,157,85,0.12)' : v.status === 'failed' ? 'rgba(220,38,38,0.1)' : 'rgba(201,162,39,0.15)',
                      color: v.status === 'success' ? 'var(--color-green-deep)' : v.status === 'failed' ? '#DC2626' : '#8a6d1a',
                    }}
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

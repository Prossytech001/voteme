import { useEffect, useState } from 'react';
import { getCategories, getNominees, adminManualCredit, adminGetManualCredits } from '../../api';

export default function ManualCreditPanel({ adminKey }) {
  const [categories, setCategories] = useState([]);
  const [nomineesByCategory, setNomineesByCategory] = useState({});
  const [nomineeId, setNomineeId] = useState('');
  const [voteCount, setVoteCount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [credits, setCredits] = useState([]);
  const [loadingCredits, setLoadingCredits] = useState(true);

  useEffect(() => {
    getCategories().then(async (cats) => {
      setCategories(cats);
      const results = await Promise.all(cats.map(c => getNominees(c.id)));
      const map = {};
      cats.forEach((c, i) => { map[c.id] = results[i]; });
      setNomineesByCategory(map);
    });
    loadCredits();
  }, []);

  const loadCredits = () => {
    setLoadingCredits(true);
    adminGetManualCredits(adminKey).then(setCredits).finally(() => setLoadingCredits(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomineeId || !voteCount || Number(voteCount) < 1) {
      setMessage({ type: 'error', text: 'Pick a nominee and enter a vote count of at least 1.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await adminManualCredit(adminKey, { nominee_id: nomineeId, vote_count: Number(voteCount), reason: reason || null });
      setMessage({ type: 'success', text: `Credited ${voteCount} vote(s) successfully.` });
      setVoteCount('');
      setReason('');
      loadCredits();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to credit votes.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ballot-stub rounded-xl">
      <div className="ballot-stub-content py-5 px-5">
        <h3 className="text-base font-medium mb-1" style={{ color: 'var(--color-ink)' }}>Manual vote credit</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--color-ink-soft)' }}>
          Adds votes directly without a Paystack payment. Counts toward public totals, excluded from revenue figures, logged below.
        </p>

        <form onSubmit={handleSubmit} className="grid gap-2 mb-6 sm:flex sm:items-end">
          <div className="flex-1">
            <label className="text-xs block mb-1" style={{ color: 'var(--color-ink-soft)' }}>Nominee</label>
            <select
              value={nomineeId}
              onChange={(e) => setNomineeId(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ background: 'white', border: '1px solid #E2E0D5', color: 'var(--color-ink)' }}
            >
              <option value="">Select nominee</option>
              {categories.map(c => (
                <optgroup key={c.id} label={c.name}>
                  {(nomineesByCategory[c.id] || []).map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--color-ink-soft)' }}>Vote count</label>
            <input
              type="number" min="1"
              value={voteCount}
              onChange={(e) => setVoteCount(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ background: 'white', border: '1px solid #E2E0D5', color: 'var(--color-ink)' }}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs block mb-1" style={{ color: 'var(--color-ink-soft)' }}>Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. offline/cash votes"
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ background: 'white', border: '1px solid #E2E0D5', color: 'var(--color-ink)' }}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            style={{ background: 'var(--color-green-deep)' }}
          >
            {submitting ? 'Crediting…' : 'Credit votes'}
          </button>
        </form>

        {message && (
          <p className="text-sm mb-4" style={{ color: message.type === 'error' ? '#DC2626' : 'var(--color-green-deep)' }}>
            {message.text}
          </p>
        )}

        <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-ink)' }}>Manual credit history</h4>
        {loadingCredits ? (
          <p className="text-xs" style={{ color: 'var(--color-ink-soft)' }}>Loading…</p>
        ) : credits.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--color-ink-soft)' }}>No manual credits yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: '#E2E0D5', color: 'var(--color-ink-soft)' }}>
                  <th className="py-2 pr-3">Nominee</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">Votes</th>
                  <th className="py-2 pr-3">Reason</th>
                  <th className="py-2 pr-3">By</th>
                  <th className="py-2 pr-3">When</th>
                </tr>
              </thead>
              <tbody>
                {credits.map(c => (
                  <tr key={c.id} className="border-b" style={{ borderColor: '#F0EEE5' }}>
                    <td className="py-2 pr-3">{c.nominee_name}</td>
                    <td className="py-2 pr-3">{c.category_name}</td>
                    <td className="py-2 pr-3">{c.vote_count}</td>
                    <td className="py-2 pr-3">{c.credit_reason || '—'}</td>
                    <td className="py-2 pr-3">{c.credited_by}</td>
                    <td className="py-2 pr-3">{new Date(c.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
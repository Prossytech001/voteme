import { useState } from 'react';
import { initiateVote } from '../api';

export default function VoteModal({ nominee, pricePerVote, onClose }) {
  const [voteCount, setVoteCount] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const total = voteCount * pricePerVote;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) return setError('Email is required for payment.');
    setSubmitting(true);
    try {
      const { authorization_url } = await initiateVote({
        nominee_id: nominee.id,
        vote_count: voteCount,
        voter_name: name,
        voter_phone: phone,
        voter_email: email,
      });
      window.location.href = authorization_url;
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Try again.');
      setSubmitting(false);
    }
  };

  const inputStyle = {
    background: 'var(--color-paper)',
    border: '1px solid #E2E0D5',
    color: 'var(--color-ink)',
  };

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center px-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl"
        style={{ border: '1px solid #E2E0D5' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-xl mb-1" style={{ color: 'var(--color-ink)', fontWeight: 600 }}>
          Vote for {nominee.name}
        </h2>
        {nominee.category_name && (
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--color-ink-soft)' }}>
            {nominee.category_name}
          </p>
        )}
        <p className="text-xs font-mono-tally mb-5" style={{ color: 'var(--color-green-deep)' }}>
          ₦{pricePerVote} per vote
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs" style={{ color: 'var(--color-ink-soft)' }}>Number of votes</label>
            <input
              type="number" min="1" value={voteCount}
              onChange={(e) => setVoteCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full mt-1 rounded-md px-3 py-2 focus:outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--color-ink-soft)' }}>Your name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 rounded-md px-3 py-2 focus:outline-none focus:ring-2" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--color-ink-soft)' }}>Phone number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full mt-1 rounded-md px-3 py-2 focus:outline-none focus:ring-2" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs" style={{ color: 'var(--color-ink-soft)' }}>Email (required for payment)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full mt-1 rounded-md px-3 py-2 focus:outline-none focus:ring-2" style={inputStyle} />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <p className="text-sm pt-1" style={{ color: 'var(--color-ink)' }}>
            Total: <span className="font-mono-tally font-semibold" style={{ color: 'var(--color-green-deep)' }}>₦{total}</span>
          </p>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-md py-2 text-sm"
              style={{ border: '1px solid #D8D5C8', color: 'var(--color-ink-soft)' }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 text-white font-medium rounded-md py-2 text-sm disabled:opacity-50 hover:opacity-90"
              style={{ background: 'var(--color-green-deep)' }}>
              {submitting ? 'Redirecting…' : 'Pay & Vote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

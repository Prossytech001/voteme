import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getNominees, getCategories } from '../api';

const POLL_INTERVAL_MS = 8000;

export default function Results() {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const timerRef = useRef(null);

  const load = async (isFirstLoad) => {
    try {
      const [cats, noms] = await Promise.all([getCategories(), getNominees(categoryId)]);
      setCategory(cats.find(c => String(c.id) === String(categoryId)) || null);
      setNominees(noms);
      setUpdatedAt(new Date());
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    timerRef.current = setInterval(() => load(false), POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [categoryId]);

  const totalVotes = nominees.reduce((sum, n) => sum + n.total_votes, 0);
  const maxVotes = Math.max(...nominees.map(n => n.total_votes), 1);

  const medal = (rank) => {
    if (rank === 0) return { label: '1st', bg: 'linear-gradient(135deg, #F1D888, #C9A227)', ring: '#C9A227' };
    if (rank === 1) return { label: '2nd', bg: 'linear-gradient(135deg, #E7E7E7, #B7B7B7)', ring: '#B7B7B7' };
    if (rank === 2) return { label: '3rd', bg: 'linear-gradient(135deg, #E3B48A, #B8763F)', ring: '#B8763F' };
    return null;
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, var(--color-green-deep) 0%, var(--color-green-mid) 200px, var(--color-paper) 200px)' }}>
      <div className="max-w-2xl mx-auto px-5 pt-10 pb-20">
        <Link to="/vote" className="text-white/80 text-sm hover:text-white inline-block mb-6">← All categories</Link>

        <div className="text-center mb-2">
          <p className="uppercase tracking-[0.2em] text-[11px] text-white/75 mb-2">Live results · updated automatically</p>
          <h1 className="font-display text-white text-3xl sm:text-4xl leading-tight" style={{ fontWeight: 600 }}>
            {category ? category.name : 'Loading…'}
          </h1>
          <p className="text-sm text-white/85 mt-2 font-mono-tally">
            {totalVotes.toLocaleString()} vote{totalVotes === 1 ? '' : 's'} cast so far
          </p>
        </div>

        <div className="mt-10 grid gap-3">
          {loading && <p className="text-center text-sm text-white/80">Loading results…</p>}

          {nominees.map((n, i) => {
            const pct = totalVotes > 0 ? (n.total_votes / totalVotes) * 100 : 0;
            const barWidth = (n.total_votes / maxVotes) * 100;
            const m = medal(i);

            return (
              <div key={n.id} className="ballot-stub rounded-lg shadow-sm">
                <div className="ballot-stub-content py-4 pr-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {m ? (
                        <span
                          className="flex items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
                          style={{ width: 30, height: 30, background: m.bg, border: `2px solid ${m.ring}` }}
                        >
                          {i + 1}
                        </span>
                      ) : (
                        <span
                          className="flex items-center justify-center rounded-full text-[11px] font-mono-tally"
                          style={{ width: 30, height: 30, color: 'var(--color-ink-soft)', border: '1px solid #E2E0D5' }}
                        >
                          {i + 1}
                        </span>
                      )}
                      <span className="font-display text-[16px]" style={{ color: 'var(--color-ink)', fontWeight: 500 }}>
                        {n.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono-tally text-[15px] font-semibold" style={{ color: 'var(--color-green-deep)' }}>
                        {n.total_votes.toLocaleString()}
                      </div>
                      <div className="font-mono-tally text-[11px]" style={{ color: 'var(--color-ink-soft)' }}>
                        {pct.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#EDEBE1' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${barWidth}%`,
                        background: m ? m.bg : 'linear-gradient(90deg, var(--color-green-mid), var(--color-emerald))',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && nominees.length === 0 && (
            <p className="text-center text-sm" style={{ color: 'var(--color-ink-soft)' }}>No nominees in this category yet.</p>
          )}
        </div>

        {updatedAt && (
          <p className="text-center text-xs mt-8" style={{ color: 'var(--color-ink-soft)' }}>
            Last updated {updatedAt.toLocaleTimeString()} · refreshes every {POLL_INTERVAL_MS / 1000}s
          </p>
        )}

        <div className="text-center mt-4">
          <Link to={`/category/${categoryId}`} className="text-sm font-medium hover:underline" style={{ color: 'var(--color-green-deep)' }}>
            Go to voting →
          </Link>
        </div>
      </div>
    </div>
  );
}

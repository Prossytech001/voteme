import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getNominees, getPricePerVote } from '../api';
import VoteModal from '../components/VoteModal';

export default function NomineeList() {
  const { categoryId } = useParams();
  const [nominees, setNominees] = useState([]);
  const [price, setPrice] = useState(100);
  const [loading, setLoading] = useState(true);
  const [activeNominee, setActiveNominee] = useState(null);

  const load = () => {
    Promise.all([getNominees(categoryId), getPricePerVote()]).then(([n, p]) => {
      setNominees(n);
      setPrice(p.price_per_vote_naira);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [categoryId]);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, var(--color-green-deep) 0%, var(--color-green-mid) 160px, var(--color-paper) 160px)' }}>
      <div className="max-w-2xl mx-auto px-5 pt-10 pb-16">
        <Link to="/vote" className="text-white/80 text-sm hover:text-white inline-block mb-8">← Back to categories</Link>

        <h1 className="font-display text-white text-3xl mb-1" style={{ fontWeight: 600 }}>Nominees</h1>
        <div className="flex items-center justify-between mb-10">
          <p className="text-sm text-white/85 font-mono-tally">₦{price} per vote</p>
          <Link to={`/results/${categoryId}`} className="text-xs font-medium px-3 py-1.5 rounded-full hover:opacity-90"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
            View live results →
          </Link>
        </div>

        {loading && <p className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>Loading…</p>}

        <div className="grid gap-3">
          {nominees.map((n) => (
            <div key={n.id} className="ballot-stub rounded-lg flex items-center justify-between shadow-sm">
              <div className="ballot-stub-content py-4 pr-4 flex items-center justify-between w-full">
                <div>
                  <p className="font-display text-[17px]" style={{ color: 'var(--color-ink)', fontWeight: 500 }}>{n.name}</p>
                  <p className="text-xs font-mono-tally mt-0.5" style={{ color: 'var(--color-green-deep)' }}>
                    {n.total_votes} vote{n.total_votes === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveNominee(n)}
                  className="text-white text-sm font-medium px-4 py-2 rounded-md transition hover:opacity-90"
                  style={{ background: 'var(--color-green-deep)' }}
                >
                  Vote
                </button>
              </div>
            </div>
          ))}
        </div>

        {activeNominee && (
          <VoteModal
            nominee={activeNominee}
            pricePerVote={price}
            onClose={() => setActiveNominee(null)}
          />
        )}
      </div>
    </div>
  );
}


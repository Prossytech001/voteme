import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../api';

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, var(--color-green-deep) 0%, var(--color-green-mid) 220px, var(--color-paper) 220px)' }}>
      <div className="max-w-2xl mx-auto px-5 pt-14 pb-16">

        <header className="text-center mb-3">
          <div className="seal mx-auto mb-4">
            <span className="font-display text-gold text-lg" style={{ color: 'var(--color-gold)' }}>A</span>
          </div>
          <p className="uppercase tracking-[0.2em] text-[11px] text-white/80 mb-3">
            Office of the Director of Social · ASSESS, UNIZIK
          </p>
          <h1 className="font-display text-white text-4xl sm:text-5xl leading-tight" style={{ fontWeight: 600 }}>
            Dinner &amp; Awards Night
          </h1>
          <div className="hairline-gold my-4" />
          <p className="text-sm text-white/85">Cast your vote in each category below</p>
        </header>

        <div className="mt-10">
          {loading && (
            <p className="text-center text-sm" style={{ color: 'var(--color-ink-soft)' }}>Loading categories…</p>
          )}

          <div className="grid gap-3">
            {categories.map((c, i) => (
              <div
                key={c.id}
                className="ballot-stub rounded-lg shadow-sm hover:shadow-md transition group"
              >
                <div className="ballot-stub-content py-4 pr-5 flex items-center justify-between w-full gap-3">
                  <Link to={`/category/${c.id}`} className="flex-1 min-w-0">
                    <span className="font-display text-[17px] block truncate" style={{ color: 'var(--color-ink)', fontWeight: 500 }}>
                      {c.name}
                    </span>
                    <span
                      className="font-mono-tally text-xs"
                      style={{ color: 'var(--color-ink-soft)' }}
                    >
                      {c.nominee_count} nominee{c.nominee_count === 1 ? '' : 's'}
                    </span>
                  </Link>
                  <Link
                    to={`/results/${c.id}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap hover:opacity-90"
                    style={{ background: 'rgba(11,93,52,0.08)', color: 'var(--color-green-deep)' }}
                  >
                    Results
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

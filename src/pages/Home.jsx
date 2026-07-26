import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getNominees, getPricePerVote } from '../api';
import VoteModal from '../components/VoteModal';

// Fixed countdown target — same for every visitor, does NOT reset on refresh.
// Edit this line to change when the countdown hits zero.
const COUNTDOWN_TARGET = new Date('2026-07-26T17:00:00');

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [nomineesByCategory, setNomineesByCategory] = useState({});
  const [price, setPrice] = useState(100);
  const [loading, setLoading] = useState(true);
  const [activeNominee, setActiveNominee] = useState(null);

  useEffect(() => {
    (async () => {
      const [cats, priceData] = await Promise.all([getCategories(), getPricePerVote()]);
      setCategories(cats);
      setPrice(priceData.price_per_vote_naira);

      const results = await Promise.all(cats.map(c => getNominees(c.id)));
      const map = {};
      cats.forEach((c, i) => { map[c.id] = results[i]; });
      setNomineesByCategory(map);
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ background: 'var(--color-paper)', minHeight: '100vh' }}>
      <Hero />

      <div className="max-w-3xl mx-auto px-4 py-10 w-full">
        {loading ? (
          <div className="grid gap-10 min-w-0">
            {[1, 2, 3].map((i) => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-10 min-w-0">
            {categories.map((c) => (
              <CategorySection
                key={c.id}
                category={c}
                nominees={nomineesByCategory[c.id] || []}
                onVote={(n) => setActiveNominee({ ...n, category_name: c.name })}
              />
            ))}
          </div>
        )}
      </div>

      {activeNominee && (
        <VoteModal
          nominee={activeNominee}
          pricePerVote={price}
          onClose={() => setActiveNominee(null)}
        />
      )}
    </div>
  );
}

function Hero() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(t);
  }, []);

  function getTimeLeft() {
    const diff = Math.max(0, COUNTDOWN_TARGET.getTime() - Date.now());
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      mins: Math.floor((diff / (1000 * 60)) % 60),
      secs: Math.floor((diff / 1000) % 60),
    };
  }

  const units = [
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.mins },
    { label: 'Secs', value: timeLeft.secs },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Flyer background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/event-banner.jpeg')" }}
      />
      {/* Dark overlay so white/gold text stays legible over the photo */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(160deg, rgba(11,22,15,0.75) 0%, rgba(11,22,15,0.55) 60%, rgba(11,22,15,0.85) 100%)' }}
      />

      <div className="max-w-3xl mx-auto px-5 pt-14 pb-10 text-center relative z-10">
        <div className="seal mx-auto mb-5">
          <span className="font-display text-lg" style={{ color: 'var(--color-gold)' }}>A</span>
        </div>
        <p className="uppercase tracking-[0.2em] text-[11px] text-white/80 mb-3">
          Office of the Director of Social · ASSESS, UNIZIK
        </p>
        <h1 className="font-display text-white text-4xl sm:text-5xl leading-tight mb-2" style={{ fontWeight: 600 }}>
          Dinner &amp; Awards Night
        </h1>
        <p className="text-sm text-white/85 max-w-md mx-auto mb-8">
          Cast your vote for your favorite nominee in every category — results update live for everyone to see.
        </p>

        <div className="flex justify-center gap-3 sm:gap-5">
          {units.map((u) => (
            <div key={u.label} className="flex flex-col items-center">
              <div
                className="w-16 sm:w-20 rounded-lg py-3 font-mono-tally text-2xl sm:text-3xl font-semibold"
                style={{ background: '#C9A227', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                {String(u.value).padStart(2, '0')}
              </div>
              <span className="text-[10px] uppercase tracking-wide text-white/70 mt-1.5">{u.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* decorative fade so the page below eases out of the green */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16"
        style={{ background: 'linear-gradient(180deg, transparent, var(--color-paper))' }}
      />
    </div>
  );
}

function CategorySkeleton() {
  return (
    <section className="min-w-0 w-full">
      <div
        className="flex items-center justify-between rounded-full mb-4 pl-6 pr-2 py-2"
        style={{ background: '#F5F5F1' }}
      >
        <div className="skeleton rounded-md h-4 w-40" />
        <div className="shrink-0 rounded-full bg-white shadow-sm" style={{ width: 40, height: 40 }} />
      </div>

      <div className="flex gap-3 overflow-x-hidden px-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="ballot-stub rounded-lg shrink-0" style={{ width: 168 }}>
            <div className="ballot-stub-content p-3">
              <div className="skeleton w-full h-28 rounded-md mb-2" />
              <div className="skeleton h-3 w-4/5 rounded mb-2" />
              <div className="skeleton h-1.5 w-full rounded-full mb-2" />
              <div className="flex justify-between">
                <div className="skeleton h-2.5 w-8 rounded" />
                <div className="skeleton h-2.5 w-12 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategorySection({ category, nominees, onVote }) {
  const totalVotes = useMemo(() => nominees.reduce((s, n) => s + n.total_votes, 0), [nominees]);

  return (
    <section className="min-w-0 w-full">
      <Link
        to={`/results/${category.id}`}
        className="flex items-center justify-between rounded-full mb-4 pl-6 pr-2 py-2 hover:bg-[#F0F0EC] transition"
        style={{ background: '#F5F5F1' }}
      >
        <span
          className="text-sm sm:text-base uppercase tracking-wide truncate"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', fontWeight: 500, letterSpacing: '0.03em' }}
        >
          {category.name}
        </span>
        <span
          className="shrink-0 flex items-center justify-center rounded-full bg-white shadow-sm"
          style={{ width: 40, height: 40 }}
        >
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L7 7L1 13" stroke="var(--color-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>

      {nominees.length === 0 ? (
        <p className="text-sm px-1" style={{ color: 'var(--color-ink-soft)' }}>No nominees yet.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scrollbar-thin">
          {nominees.map((n) => {
            const pct = totalVotes > 0 ? (n.total_votes / totalVotes) * 100 : 0;
            return (
              <NomineeCard key={n.id} nominee={n} percentage={pct} onClick={() => onVote(n)} />
            );
          })}
        </div>
      )}
    </section>
  );
}

function NomineeCard({ nominee, percentage, onClick }) {
  const initials = nominee.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <button
      onClick={onClick}
      className="ballot-stub rounded-lg shrink-0 snap-start text-left shadow-sm hover:shadow-md transition"
      style={{ width: 168 }}
    >
      <div className="ballot-stub-content p-3">
        {nominee.photo_url ? (
          <img
            src={nominee.photo_url}
            alt={nominee.name}
            className="w-full h-28 object-cover rounded-md mb-2"
          />
        ) : (
          <div
            className="w-full h-28 rounded-md mb-2 flex items-center justify-center font-display text-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(11,93,52,0.1), rgba(201,162,39,0.12))', color: 'var(--color-green-deep)' }}
          >
            {initials}
          </div>
        )}
        <p className="font-display text-[13px] leading-snug mb-1 line-clamp-2" style={{ color: 'var(--color-ink)', fontWeight: 500 }}>
          {nominee.name}
        </p>
        <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: '#EDEBE1' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, var(--color-green-mid), var(--color-emerald))' }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="font-mono-tally text-[11px] font-semibold" style={{ color: 'var(--color-green-deep)' }}>
            {percentage.toFixed(1)}%
          </span>
          <span className="font-mono-tally text-[10px]" style={{ color: 'var(--color-ink-soft)' }}>
            {nominee.total_votes} votes
          </span>
        </div>
      </div>
    </button>
  );
}

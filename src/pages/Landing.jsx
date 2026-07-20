import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Flyer background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/event-banner.jpeg')" }}
      />
      {/* Dark overlay for text legibility */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(11,22,15,0.55) 0%, rgba(11,22,15,0.7) 60%, rgba(11,22,15,0.9) 100%)' }}
      />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-6 py-10 text-center">

        {/* Powered-by badge with ProxAfrica logo */}
        <div className="flex items-center gap-2 text-white/70 text-xs">
          <span className="uppercase tracking-widest">Powered by</span>
          <img src="/images/proxafrica-logo.png" alt="ProxAfrica" className="h-5 w-auto" />
        </div>

        {/* Hero content */}
        <div className="max-w-sm mx-auto">
          <div className="seal mx-auto mb-6">
            <span className="font-display text-lg" style={{ color: 'var(--color-gold)' }}>A</span>
          </div>
          <p className="uppercase tracking-[0.2em] text-[11px] text-white/80 mb-3">
            Office of the Director of Social · ASSESS, UNIZIK
          </p>
          <h1 className="font-display text-white text-4xl sm:text-5xl leading-tight mb-4" style={{ fontWeight: 600 }}>
            Dinner &amp; Awards Night
          </h1>
          <p className="text-sm text-white/85 mb-10">
            Vote for your favorite nominees across every award category. Every vote counts — and results update live for everyone to see.
          </p>

          <button
            onClick={() => navigate('/vote')}
            className="w-full sm:w-auto px-10 py-3.5 rounded-full font-semibold text-sm shadow-lg hover:opacity-90 transition"
            style={{ background: 'var(--color-gold)', color: '#1a1310' }}
          >
            Vote Now
          </button>
        </div>

        {/* Bottom spacer / footer credit */}
        <div className="flex items-center gap-2 text-[11px] text-white/50">
          <span>Built and powered by</span>
          <img src="/images/proxafrica-logo.png" alt="ProxAfrica" className="h-4 w-auto opacity-90" />
        </div>
      </div>
    </div>
  );
}

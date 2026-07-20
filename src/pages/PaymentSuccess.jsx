import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { verifyPayment } from '../api';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const reference = params.get('reference') || params.get('trxref');
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    if (!reference) { setStatus('error'); return; }
    verifyPayment(reference)
      .then((res) => setStatus(res.status))
      .catch(() => setStatus('error'));
  }, [reference]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(180deg, var(--color-green-deep) 0%, var(--color-green-mid) 100%)' }}>
      <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md w-full text-center" style={{ border: '1px solid #E2E0D5' }}>
        {status === 'checking' && (
          <p className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>Confirming your payment…</p>
        )}
        {status === 'success' && (
          <>
            <div className="seal mx-auto mb-4">
              <span style={{ color: 'var(--color-gold)' }}>✓</span>
            </div>
            <h1 className="font-display text-2xl mb-2" style={{ color: 'var(--color-green-deep)', fontWeight: 600 }}>
              Vote confirmed
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>Thank you — your votes have been counted.</p>
          </>
        )}
        {(status === 'failed' || status === 'error') && (
          <>
            <h1 className="font-display text-2xl mb-2 text-red-600" style={{ fontWeight: 600 }}>Payment not confirmed</h1>
            <p className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>
              If money was deducted, contact the organizers with your reference: {reference}
            </p>
          </>
        )}
        <Link to="/vote" className="inline-block mt-6 text-sm hover:underline" style={{ color: 'var(--color-green-deep)' }}>
          ← Back to categories
        </Link>
      </div>
    </div>
  );
}

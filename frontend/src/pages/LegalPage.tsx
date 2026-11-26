import { Link } from 'react-router-dom';

interface LegalPageProps {
  type: 'privacy' | 'terms';
}

export function LegalPage({ type }: LegalPageProps) {
  const isPrivacy = type === 'privacy';

  return (
    <article className="mx-auto max-w-[680px] py-12 pb-24 space-y-8">
      <Link to="/" className="btn-ghost">
        ← Back to overview
      </Link>

      <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 sm:p-8 space-y-6">
        <p className="font-mono caption-3 uppercase tracking-wider text-spark-lime">
          SparkZ legal documentation
        </p>
        <h1 className="heading-3 text-pure-white">
          {isPrivacy ? 'Privacy policy' : 'Terms of service'}
        </h1>

        {isPrivacy ? (
          <div className="space-y-4 body-6 text-pure-white/75">
            <p>
              SparkZ stores only the account and order data required to authenticate your session, reserve component stock, and fulfill shipments: your email address, full name, phone number, and shipping address snapshot.
            </p>
            <p>
              Authentication tokens are issued and verified by Supabase Auth. Row level security is enabled across all PostgreSQL tables, and all data access runs exclusively through the SparkZ NestJS API.
            </p>
            <p>
              No payment card secrets or third party advertising trackers are stored by SparkZ.
            </p>
          </div>
        ) : (
          <div className="space-y-4 body-6 text-pure-white/75">
            <p>
              SparkZ is an educational and portfolio electronic components platform. All component specifications, manufacturer part numbers, and datasheets are provided for engineering reference and order verification.
            </p>
            <p>
              Inventory quantities are locked atomically at checkout. Orders in PENDING or PROCESSING status may be cancelled to restore reserved stock back to the live catalog.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

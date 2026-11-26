import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-[680px] py-20 text-center space-y-6">
      <div className="inline-flex items-center gap-2 rounded-lg border border-[#28364F] bg-[#131C2E] px-3 py-1 font-mono caption-3 text-spark-lime">
        HTTP 404 · UNROUTED TRACE
      </div>
      <h1 className="heading-2 text-pure-white">
        This circuit path does not exist.
      </h1>
      <p className="body-2 text-pure-white/70">
        The component page or route you requested could not be found. Return to the live catalog to search active microcontrollers, sensors, and passives.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <Link to="/catalog" className="btn-primary">
          Browse live catalog
        </Link>
        <Link to="/" className="btn-ghost">
          Back to overview
        </Link>
      </div>
    </div>
  );
}

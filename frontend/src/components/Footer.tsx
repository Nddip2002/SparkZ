import { Link } from 'react-router-dom';

const CURRENT_YEAR = new Date().getFullYear();

interface FooterProps {
  bgPaused?: boolean;
  onToggleBgPaused?: () => void;
}

export function Footer({ bgPaused = false, onToggleBgPaused }: FooterProps) {
  return (
    <footer className="relative z-10 mt-auto bg-[#131C2E] py-12 text-pure-white/70">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#28364F] bg-[#1A253A] p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-spark-lime font-mono caption-3 text-[#0B111E]">
                  SZ
                </span>
                <span className="title-2 text-pure-white">
                  Spark<span className="text-spark-lime">Z</span>
                </span>
              </div>
              <p className="body-6 text-pure-white/60">
                Genuine electronic components, microcontrollers, passives, and development boards with atomic stock locking and full manufacturer datasheets.
              </p>
            </div>

            <div>
              <h4 className="title-4 text-pure-white">Component catalog</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    to="/catalog?category=Microcontrollers"
                    className="caption-2 text-pure-white/70 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-spark-lime"
                  >
                    Microcontrollers and SoCs
                  </Link>
                </li>
                <li>
                  <Link
                    to="/catalog?category=Sensors"
                    className="caption-2 text-pure-white/70 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-spark-lime"
                  >
                    Sensors and environmental ICs
                  </Link>
                </li>
                <li>
                  <Link
                    to="/catalog?category=Power%20Management"
                    className="caption-2 text-pure-white/70 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-spark-lime"
                  >
                    Power and voltage regulators
                  </Link>
                </li>
                <li>
                  <Link
                    to="/catalog?category=Passives"
                    className="caption-2 text-pure-white/70 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-spark-lime"
                  >
                    Surface mount passives
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="title-4 text-pure-white">Account and orders</h4>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    to="/catalog?inStock=true"
                    className="caption-2 text-pure-white/70 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-spark-lime"
                  >
                    Live in stock inventory
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cart"
                    className="caption-2 text-pure-white/70 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-spark-lime"
                  >
                    Active shopping cart
                  </Link>
                </li>
                <li>
                  <Link
                    to="/orders"
                    className="caption-2 text-pure-white/70 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-spark-lime"
                  >
                    Order history and tracking
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="title-4 text-pure-white">Architecture and policies</h4>
              <p className="mt-3 caption-2 text-pure-white/60">
                Powered by React 19, Tailwind CSS v4, NestJS 12, Prisma 7, and Supabase PostgreSQL.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#28364F] bg-[#131C2E] px-3 py-1 font-mono caption-4 text-spark-lime">
                <span className="h-2 w-2 rounded-full bg-spark-lime" />
                API status: operational
              </div>
              {onToggleBgPaused && (
                <div className="mt-3">
                  <button type="button" onClick={onToggleBgPaused} className="btn-ghost">
                    {bgPaused ? 'Play background motion' : 'Pause background motion'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-lg border border-[#28364F] bg-[#131C2E] p-4 sm:flex-row">
            <p className="caption-5 text-pure-white/50">
              © {CURRENT_YEAR} SparkZ Electronics Platform. Educational and portfolio project.
            </p>
            <div className="flex items-center gap-6">
              <Link
                to="/privacy"
                className="caption-4 text-pure-white/60 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-spark-lime"
              >
                Privacy policy
              </Link>
              <Link
                to="/terms"
                className="caption-4 text-pure-white/60 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-spark-lime"
              >
                Terms of service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

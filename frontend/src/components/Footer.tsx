const CURRENT_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-onyx-surface py-12 text-sm text-pure-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-spark-lime font-mono text-sm font-black text-onyx">
                ⚡
              </span>
              <span className="text-lg font-bold text-pure-white">
                Spark<span className="text-spark-lime">Z</span>
              </span>
            </div>
            <p className="text-xs text-pure-white/60">
              High-performance electronic components, microcontrollers, passives, and development boards for builders and engineers.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-pure-white">Catalog</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>Microcontrollers & SoCs</li>
              <li>Sensors & Transducers</li>
              <li>Power & Voltage Regulators</li>
              <li>Passives & Connectors</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-pure-white">Engineering Resources</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>Interactive Datasheet Viewer</li>
              <li>Pinout Diagrams & CAD Footprints</li>
              <li>Component Availability API</li>
              <li>Order Tracking</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-pure-white">System Architecture</h4>
            <p className="mt-3 text-xs text-pure-white/60">
              Built on React + Tailwind v4 + NestJS + Prisma 7 + Supabase PostgreSQL.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-spark-lime/30 bg-spark-lime/10 px-3 py-1 text-xs text-spark-lime font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-spark-lime animate-pulse" />
              API Status: Operational
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-6 text-center text-xs text-pure-white/40">
          © {CURRENT_YEAR} SparkZ Electronics Platform. Educational & Portfolio Project.
        </div>
      </div>
    </footer>
  );
}

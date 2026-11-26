import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useProducts } from '../api/queries';
import { ProductCard } from '../components/ProductCard';
import { TaglineReveal } from '../components/TaglineReveal';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../auth/useAuth';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { formatPrice } from '../lib/format';

const EASE_CURVE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'How does SparkZ guarantee that in stock parts will not fail at checkout?',
    a: 'Every checkout runs inside an isolated PostgreSQL transaction with conditional row locking. If the requested quantity exceeds remaining inventory, the transaction aborts before order creation so stock never drops below zero.',
  },
  {
    q: 'Are all microcontrollers, sensors, and passives sourced from authorized manufacturers?',
    a: 'Yes. Every component is listed with its exact Manufacturer Part Number (MPN), factory SKU, and direct manufacturer PDF datasheet so your team can verify package markings and electrical ratings before ordering.',
  },
  {
    q: 'Is there a minimum order quantity for prototype or university lab runs?',
    a: 'No. You can order a single microcontroller or voltage regulator for breadboard bringup, or up to 999 units per line item for production pilot builds.',
  },
  {
    q: 'Can I search and filter components by technical attributes and package specifications?',
    a: 'Yes. Technical parameters such as supply voltage, clock speed, flash capacity, interface bus, and SMD package footprint are stored in an indexed JSONB column and displayed in a high contrast specification table on every product page.',
  },
  {
    q: 'How is shipping calculated across orders?',
    a: 'Orders with a subtotal of ₹999 or higher qualify automatically for free express shipping. Orders below ₹999 carry a flat ₹99 shipping fee calculated directly by the server.',
  },
  {
    q: 'How do order cancellations affect reserved component inventory?',
    a: 'When an order in PENDING or PROCESSING status is cancelled, the backend atomically increments each line item quantity back into live product stock and invalidates the catalog cache.',
  },
  {
    q: 'Do I need an account to browse datasheets and live inventory counts?',
    a: 'No. The full catalog, JSONB specification tables, live stock quantities, and PDF datasheets are publicly accessible. You only sign in when adding items to your cart or placing an order.',
  },
];

export function HomePage() {
  const { configured } = useAuth();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [authOpen, setAuthOpen] = useState(false);
  const [activeSpecIdx, setActiveSpecIdx] = useState(0);
  const { data: featured, isLoading } = useProducts({ pageSize: 8 });

  const totalCatalogCount = featured?.total ?? 6;
  const heroProducts = featured?.items.slice(0, 4) ?? [];
  const activeHeroProduct = heroProducts[activeSpecIdx] ?? heroProducts[0];

  const revealProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 32 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.15 },
        transition: { duration: 0.65, ease: EASE_CURVE },
      };

  return (
    <div className="space-y-24 pb-24">
      {/* =====================================================================
          1. THREE.JS 3D SILICON HERO SECTOR (SKILL.md A2, A4, A5, B5)
          - Left column: High-contrast solid readout panel with #FFFFFF -> #9B9B9B
            hero heading, single primary CTA, and live proof signals.
          - Center/Right viewport: Open 3D WebGL stage showcasing the rotating
            SPARKZ SZ-32X QFP-56 processor and racing 3D bus signals, paired with
            an interactive live component telemetry selector dock.
         ===================================================================== */}
      <section className="pt-6 sm:pt-10">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Left Hero Pitch Card — Solid high-contrast #131C2E surface so text is 100% crisp */}
          <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 sm:p-8 space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#28364F] bg-[#1A253A] px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-spark-lime" />
              <span className="font-mono caption-3 text-spark-lime">
                WEBGL 3D SILICON STAGE · ATOMIC STOCK
              </span>
            </div>

            <h1 className="heading-1 hero-heading-gradient max-w-[680px]">
              Genuine electronic components
              <br />
              with guaranteed live stock
              <br />
              for hardware builders.
            </h1>

            <p className="body-2 max-w-[680px] text-pure-white/80">
              Source factory authentic microcontrollers, sensors, regulators, and passives backed by full PDF datasheets and PostgreSQL row locked inventory that never oversells at checkout.
            </p>

            {/* Quick Category Pills for Customer-Friendly Discovery */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Microcontrollers', cat: 'Microcontrollers' },
                { label: 'Sensors', cat: 'Sensors' },
                { label: 'Power Management', cat: 'Power Management' },
                { label: 'Passives', cat: 'Passives' },
              ].map((pill) => (
                <Link
                  key={pill.cat}
                  to={`/catalog?category=${encodeURIComponent(pill.cat)}`}
                  className="rounded-lg border border-[#28364F] bg-[#1A253A] px-3 py-1 font-mono caption-4 text-pure-white/80 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-spark-lime hover:text-spark-lime"
                >
                  {pill.label}
                </Link>
              ))}
            </div>

            {/* Single Primary CTA above the fold (SKILL.md A4/A8) */}
            <div className="pt-2">
              <Link to="/catalog" className="btn-primary">
                <span>Browse live catalog</span>
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 256 256"
                  className="h-4 w-4 fill-current"
                >
                  <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
                </svg>
              </Link>
            </div>

            {/* Proof Signal Bar */}
            <div className="grid grid-cols-3 gap-3 rounded-lg border border-[#28364F] bg-[#1A253A] p-4">
              <div>
                <span className="font-mono title-2 text-spark-lime block">
                  {totalCatalogCount}
                </span>
                <span className="caption-5 text-pure-white/60">
                  Live SKUs indexed
                </span>
              </div>
              <div>
                <span className="font-mono title-2 text-pure-white block">
                  100%
                </span>
                <span className="caption-5 text-pure-white/60">
                  Atomic stock lock
                </span>
              </div>
              <div>
                <span className="font-mono title-2 text-pure-white block">
                  ₹999+
                </span>
                <span className="caption-5 text-pure-white/60">
                  Free express shipping
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Open 3D Chip Viewport Window + Interactive Component Inspector */}
          <div className="space-y-4 lg:col-span-5">
            {/* 3D Stage HUD Header */}
            <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-spark-lime" />
                  <span className="font-mono caption-3 text-spark-lime">
                    3D SILICON CORE · SZ-32X QFP-56
                  </span>
                </div>
                <span className="rounded-md border border-[#28364F] bg-[#1A253A] px-2 py-0.5 font-mono caption-5 text-pure-white/70">
                  60 FPS WEBGL
                </span>
              </div>
              <p className="mt-1 caption-5 text-pure-white/60">
                Move your pointer or scroll to inspect the 3D BGA/QFP escape routing behind this page.
              </p>
            </div>

            {/* Open window gap on desktop so the 3D Three.js QFP-56 Microcontroller shines unobstructed */}
            <div className="hidden lg:block h-44" aria-hidden="true" />

            {/* Interactive Live Silicon Inspector Dock */}
            <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-2">
              <div className="rounded-lg border border-[#28364F] bg-[#1A253A] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono caption-3 text-spark-lime">
                    LIVE COMPONENT INSPECTOR
                  </span>
                  <span className="font-mono caption-5 text-pure-white/60">
                    JSONB SPECS
                  </span>
                </div>

                {isLoading ? (
                  <div className="h-36 animate-pulse rounded-lg border border-[#28364F] bg-[#22304A]" />
                ) : (
                  <>
                    {/* Component Selector Tabs */}
                    <div className="flex flex-wrap gap-2">
                      {heroProducts.map((item, idx) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveSpecIdx(idx)}
                          className={`rounded-md border px-2 py-1 font-mono caption-4 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                            activeSpecIdx === idx
                              ? 'border-spark-lime bg-[#0F2537] text-spark-lime'
                              : 'border-[#28364F] bg-[#131C2E] text-pure-white/70 hover:text-pure-white'
                          }`}
                        >
                          {item.mpn}
                        </button>
                      ))}
                    </div>

                    {/* Active Component Readout Card */}
                    {activeHeroProduct && (
                      <Link
                        to={`/products/${activeHeroProduct.slug}`}
                        className="block rounded-lg border border-[#28364F] bg-[#131C2E] p-4 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-spark-lime space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono caption-3 text-pure-white">
                            {activeHeroProduct.manufacturer}
                          </span>
                          <span className="rounded-md border border-spark-lime/40 bg-[#0F2537] px-2 py-0.5 font-mono caption-4 text-spark-lime">
                            {activeHeroProduct.stockQuantity} in stock
                          </span>
                        </div>

                        <p className="title-3 text-pure-white line-clamp-1">
                          {activeHeroProduct.name}
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(activeHeroProduct.specifications || {})
                            .slice(0, 4)
                            .map(([k, v]) => (
                              <div
                                key={k}
                                className="rounded-md border border-[#28364F] bg-[#1A253A] px-2 py-1"
                              >
                                <span className="caption-5 text-pure-white/50 block capitalize">
                                  {k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                                </span>
                                <span className="font-mono caption-3 text-pure-white truncate block">
                                  {String(v)}
                                </span>
                              </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="font-mono body-1 text-spark-lime">
                            {formatPrice(activeHeroProduct.unitPrice)}
                          </span>
                          <span className="caption-3 text-pure-white/80">
                            Inspect datasheet →
                          </span>
                        </div>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. PROBLEM TO SOLUTION & BENEFITS (SKILL.md A2 #6 & #7, A6 #2)
         ===================================================================== */}
      <motion.section {...revealProps} className="space-y-8">
        <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 sm:p-8 max-w-[680px] space-y-3">
          <p className="font-mono caption-3 uppercase tracking-wider text-spark-lime">
            Why hardware teams switch to SparkZ
          </p>
          <h2 className="heading-3 text-pure-white">
            Stop losing build weeks to phantom stock and unverified marketplace silicon.
          </h2>
          <p className="body-3 text-pure-white/75">
            Generic component brokers list stale spreadsheet quantities and ship unverified parts without datasheets. SparkZ locks real warehouse rows at checkout and indexes every electrical specification.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Benefit 1 */}
          <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#28364F] bg-[#1A253A] text-spark-lime">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-5 w-5 fill-current">
                <path d="M208,40H48A16,16,0,0,0,32,56v58.78c0,89.61,75.82,119.34,91,124.39a15.53,15.53,0,0,0,10,0c15.2-5.05,91-34.78,91-124.39V56A16,16,0,0,0,208,40Zm-34.34,69.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
              </svg>
            </div>
            <h3 className="title-1 text-pure-white">
              Zero overselling at checkout
            </h3>
            <p className="body-6 text-pure-white/75">
              <strong className="text-pure-white">Conditional SQL row locks</strong> — stock quantities decrement inside an isolated database transaction so your build never stalls on surprise backorders.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#28364F] bg-[#1A253A] text-spark-lime">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-5 w-5 fill-current">
                <path d="M232,104a8,8,0,0,0-8-8H208V56a16,16,0,0,0-16-16H160V24a8,8,0,0,0-16,0V40H112V24a8,8,0,0,0-16,0V40H64A16,16,0,0,0,48,56V96H32a8,8,0,0,0,0,16H48v32H32a8,8,0,0,0,0,16H48v40a16,16,0,0,0,16,16H96v16a8,8,0,0,0,16,0V216h32v16a8,8,0,0,0,16,0V216h32a16,16,0,0,0,16-16V160h16a8,8,0,0,0,0-16H208V112h16A8,8,0,0,0,232,104ZM160,152a8,8,0,0,1-8,8H104a8,8,0,0,1-8-8V104a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8Z" />
              </svg>
            </div>
            <h3 className="title-1 text-pure-white">
              Factory MPN traceability
            </h3>
            <p className="body-6 text-pure-white/75">
              <strong className="text-pure-white">Verified manufacturer part numbers</strong> — every SKU links directly to its official PDF datasheet from Espressif, STMicroelectronics, Raspberry Pi, Bosch, or Yageo.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#28364F] bg-[#1A253A] text-spark-lime">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-5 w-5 fill-current">
                <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM152,168H104a8,8,0,0,1,0-16h48a8,8,0,0,1,0,16Zm0-32H104a8,8,0,0,1,0-16h48a8,8,0,0,1,0,16Zm0-48V44l44,44Z" />
              </svg>
            </div>
            <h3 className="title-1 text-pure-white">
              JSONB parametric specs
            </h3>
            <p className="body-6 text-pure-white/75">
              <strong className="text-pure-white">High contrast datasheet tables</strong> — inspect exact operating voltage, clock frequency, flash size, and SMD package dimensions before committing to a PCB footprint.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#28364F] bg-[#1A253A] text-spark-lime">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className="h-5 w-5 fill-current">
                <path d="M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.35,44L178.57,92.29l-80.35-44Zm0,88L47.65,76,81.56,57.43l80.35,44Zm88,55.85h0l-80,43.79V133.83l32-17.51V152a8,8,0,0,0,16,0V107.56l32-17.51v85.76Z" />
              </svg>
            </div>
            <h3 className="title-1 text-pure-white">
              Prototype friendly quantities
            </h3>
            <p className="body-6 text-pure-white/75">
              <strong className="text-pure-white">Single unit to 999 unit lines</strong> — order 1 MCU for lab bringup or full packs with flat ₹99 shipping and free express shipping on orders over ₹999.
            </p>
          </div>
        </div>
      </motion.section>

      {/* =====================================================================
          MANDATORY TAGLINE REVEAL SECTION (SKILL.md B11)
         ===================================================================== */}
      <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] px-6">
        <TaglineReveal
          lines={[
            'Every component on SparkZ is backed by an official manufacturer datasheet',
            'and locked in real time by PostgreSQL transactions',
            'so your hardware build never stalls on phantom inventory.',
          ]}
        />
      </div>

      {/* =====================================================================
          LIVE FEATURED CATALOG PREVIEW
         ===================================================================== */}
      <motion.section {...revealProps} className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-[#28364F] bg-[#131C2E] p-6">
          <div className="space-y-1">
            <p className="font-mono caption-3 uppercase tracking-wider text-spark-lime">
              Live database catalog
            </p>
            <h2 className="heading-4 text-pure-white">
              Ready to ship silicon and passives
            </h2>
          </div>
          <Link to="/catalog" className="btn-ghost">
            View all {totalCatalogCount} components
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl border border-[#28364F] bg-[#131C2E]"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured?.items.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onRequireAuth={() => setAuthOpen(true)}
              />
            ))}
          </div>
        )}
      </motion.section>

      {/* =====================================================================
          3. HOW IT WORKS — 3 STEPS (SKILL.md A2 #8, A6 #3)
         ===================================================================== */}
      <motion.section {...revealProps} className="space-y-8">
        <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 max-w-[680px] space-y-2">
          <p className="font-mono caption-3 uppercase tracking-wider text-spark-lime">
            How SparkZ works
          </p>
          <h2 className="heading-3 text-pure-white">
            From schematic specification to locked order in three steps.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 space-y-3">
            <span className="inline-flex rounded-md border border-[#28364F] bg-[#1A253A] px-2 py-1 font-mono caption-3 text-spark-lime">
              STEP 01
            </span>
            <h3 className="title-1 text-pure-white">
              Filter by MPN or category
            </h3>
            <p className="body-6 text-pure-white/75">
              Query the edge cached catalog by part number, SKU, manufacturer, or live in stock status in milliseconds.
            </p>
          </div>

          <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 space-y-3">
            <span className="inline-flex rounded-md border border-[#28364F] bg-[#1A253A] px-2 py-1 font-mono caption-3 text-spark-lime">
              STEP 02
            </span>
            <h3 className="title-1 text-pure-white">
              Verify JSONB specs and PDF datasheet
            </h3>
            <p className="body-6 text-pure-white/75">
              Review the high contrast pure white specification table and open the official manufacturer PDF datasheet directly on the part page.
            </p>
          </div>

          <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 space-y-3">
            <span className="inline-flex rounded-md border border-[#28364F] bg-[#1A253A] px-2 py-1 font-mono caption-3 text-spark-lime">
              STEP 03
            </span>
            <h3 className="title-1 text-pure-white">
              Lock stock atomically at checkout
            </h3>
            <p className="body-6 text-pure-white/75">
              Complete checkout in a single database transaction that reserves your exact quantity and issues an immutable SZ-YYYY-NNNN order record.
            </p>
          </div>
        </div>
      </motion.section>

      {/* =====================================================================
          4. SOCIAL PROOF & RISK REVERSAL (SKILL.md A2 #9 & #11, A6 #4, B8)
         ===================================================================== */}
      <motion.section {...revealProps} className="space-y-8">
        <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 sm:p-8 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-mono caption-3 uppercase tracking-wider text-spark-lime">
                Verified manufacturers in catalog
              </p>
              <h2 className="heading-5 text-pure-white">
                Authentic silicon from original semiconductor makers
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'Espressif Systems',
                'STMicroelectronics',
                'Raspberry Pi',
                'Bosch Sensortec',
                'Advanced Monolithic Systems',
                'Yageo',
              ].map((mfr) => (
                <Link
                  key={mfr}
                  to={`/catalog?manufacturer=${encodeURIComponent(mfr)}`}
                  className="rounded-lg border border-[#28364F] bg-[#1A253A] px-3 py-2 font-mono caption-4 text-pure-white/85 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-spark-lime hover:text-spark-lime"
                >
                  {mfr}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-[#28364F] bg-[#1A253A] p-6 space-y-3">
              <p className="font-mono caption-3 text-spark-lime">
                ENGINEERING FEEDBACK
              </p>
              <p className="body-3 text-pure-white/80">
                {'{{testimonial_primary}}'}
              </p>
              <p className="caption-2 text-pure-white/50">
                {'{{customer_name_1}}'} · {'{{customer_role_1}}'}
              </p>
            </div>

            <div className="rounded-lg border border-[#28364F] bg-[#1A253A] p-6 space-y-3">
              <p className="font-mono caption-3 text-spark-lime">
                RISK REVERSAL GUARANTEE
              </p>
              <p className="body-2 text-pure-white">
                Instant order cancellation and automatic restock before shipment, plus free express shipping on every order of ₹999 or more.
              </p>
              <p className="caption-2 text-pure-white/60">
                No minimum order quantity · Server verified pricing · {'{{warranty_terms}}'}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* =====================================================================
          5. FAQ — 7 QUESTIONS (SKILL.md A2 #10, A6 #5)
         ===================================================================== */}
      <motion.section {...revealProps} className="space-y-8">
        <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 max-w-[680px] space-y-2">
          <p className="font-mono caption-3 uppercase tracking-wider text-spark-lime">
            Frequently asked questions
          </p>
          <h2 className="heading-3 text-pure-white">
            Technical answers before you place a component order.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FAQ_ITEMS.map((item) => (
            <div
              key={item.q}
              className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 space-y-2"
            >
              <h3 className="title-2 text-pure-white">{item.q}</h3>
              <p className="body-6 text-pure-white/75">{item.a}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* =====================================================================
          6. FINAL CTA — IDENTICAL PRIMARY ACTION TO HERO (SKILL.md A2 #12, A6 #6)
         ===================================================================== */}
      <motion.section {...revealProps}>
        <div className="rounded-2xl border border-[#28364F] bg-[#131C2E] p-8 sm:p-12 text-center space-y-6">
          <p className="font-mono caption-3 uppercase tracking-wider text-spark-lime">
            Ready for board bringup
          </p>
          <h2 className="heading-2 mx-auto max-w-[680px] text-pure-white">
            Source verified electronic components
            <br />
            with locked live stock today.
          </h2>
          <p className="body-2 mx-auto max-w-[680px] text-pure-white/75">
            Browse all {totalCatalogCount} live components with full PDF datasheets, JSONB specifications, and free express shipping on orders over ₹999.
          </p>
          <div className="pt-2">
            <Link to="/catalog" className="btn-primary">
              <span>Browse live catalog</span>
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 256"
                className="h-4 w-4 fill-current"
              >
                <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
              </svg>
            </Link>
          </div>
        </div>
      </motion.section>

      {authOpen && (
        <AuthModal
          configured={configured}
          onClose={() => setAuthOpen(false)}
        />
      )}
    </div>
  );
}

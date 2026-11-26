import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';

interface TaglineRevealProps {
  lines: string[];
}

/**
 * Mandatory Tagline Reveal Section (SKILL.md B11) — Zero React Re-Render Architecture:
 * - Updates word opacities directly on DOM nodes inside a requestAnimationFrame callback
 *   when activeCount changes, avoiding React component re-renders during scroll.
 */
export function TaglineReveal({ lines }: TaglineRevealProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLElement | null>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const spans = wordRefs.current;
    const total = spans.length;

    if (prefersReducedMotion) {
      for (let i = 0; i < total; i++) {
        const s = spans[i];
        if (s) s.style.opacity = '1';
      }
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    let rafId = 0;
    let isVisible = false;
    let lastCount = -1;

    const updateProgress = () => {
      rafId = 0;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const startY = vh * 0.82;
      const endY = vh * 0.28;
      const progress = Math.max(0, Math.min(1, (startY - rect.top) / (startY - endY)));
      const nextCount = Math.round(progress * total);

      if (nextCount === lastCount) return;
      lastCount = nextCount;

      for (let i = 0; i < total; i++) {
        const s = spans[i];
        if (s) {
          s.style.opacity = i < nextCount ? '1' : '0.3';
        }
      }
    };

    const onScroll = () => {
      if (!isVisible || rafId !== 0) return;
      rafId = window.requestAnimationFrame(updateProgress);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isVisible = entry.isIntersecting;
        if (isVisible) {
          updateProgress();
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    observer.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
    };
  }, [prefersReducedMotion, lines]);

  const splitLines = lines.map((line) => line.split(' '));
  const lineOffsets = splitLines.map((_, idx) =>
    splitLines.slice(0, idx).reduce((sum, arr) => sum + arr.length, 0),
  );

  return (
    <section
      ref={containerRef}
      aria-label="Core engineering promise"
      className="py-16 sm:py-20"
    >
      <div className="mx-auto max-w-[680px]">
        <p className="caption-3 uppercase tracking-wider text-spark-lime mb-4">
          Verified silicon guarantee
        </p>
        <h2 className="heading-2 text-pure-white">
          {splitLines.map((words, lIdx) => (
            <span key={lIdx} className="block">
              {words.map((word, wIdx) => {
                const flatIdx = (lineOffsets[lIdx] ?? 0) + wIdx;
                return (
                  <span
                    key={`${lIdx}-${wIdx}`}
                    ref={(node) => {
                      wordRefs.current[flatIdx] = node;
                    }}
                    style={{ opacity: prefersReducedMotion ? 1 : 0.3 }}
                    className="inline-block transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  >
                    {word}
                    {wIdx < words.length - 1 ? '\u00A0' : ''}
                  </span>
                );
              })}
            </span>
          ))}
        </h2>
      </div>
    </section>
  );
}

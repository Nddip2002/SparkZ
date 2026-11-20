import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useFinePointer, usePrefersReducedMotion } from '../hooks/useMediaQuery';

export function CustomCursor() {
  const isFinePointer = useFinePointer();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Mouse coords tracked with MotionValues to avoid React re-renders on mousemove (60 FPS rule)
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth spring physics for cursor ring
  const springConfig = { damping: 28, stiffness: 350, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Only bind listeners and attach active class if fine pointer & no reduced motion
    if (!isFinePointer || prefersReducedMotion) {
      document.documentElement.classList.remove('has-custom-cursor');
      return;
    }

    document.documentElement.classList.add('has-custom-cursor');

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, [isFinePointer, prefersReducedMotion, mouseX, mouseY]);

  if (!isFinePointer || prefersReducedMotion) {
    return null;
  }

  return (
    <>
      {/* Central dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-50 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-spark-lime"
        style={{
          x: mouseX,
          y: mouseY,
        }}
      />
      {/* Outer trailing ring */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-50 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-spark-lime/60"
        style={{
          x: smoothX,
          y: smoothY,
        }}
      />
    </>
  );
}

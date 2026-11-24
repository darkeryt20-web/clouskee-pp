import {MouseEvent, ReactNode, useRef} from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';

interface Tilt3DCardProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  maxTiltDeg?: number;
  glareOpacity?: number;
  scaleOnHover?: number;
  enable3DChildren?: boolean;
  shimmerOnHover?: boolean;
}

export function Tilt3DCard({
  children,
  className = '',
  innerClassName = '',
  maxTiltDeg = 7,
  glareOpacity = 0.18,
  scaleOnHover = 1.012,
  enable3DChildren = false,
  shimmerOnHover = true,
}: Tilt3DCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rawScale = useMotionValue(1);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareAlpha = useMotionValue(0);

  const springConfig = {stiffness: 240, damping: 24, mass: 0.6};
  const rotateX = useSpring(rawRotateX, springConfig);
  const rotateY = useSpring(rawRotateY, springConfig);
  const scale = useSpring(rawScale, {stiffness: 260, damping: 24});
  const smoothGlareAlpha = useSpring(glareAlpha, {stiffness: 220, damping: 26});

  const glareBackground = useMotionTemplate`radial-gradient(360px circle at ${glareX}% ${glareY}%, rgba(192, 132, 252, ${smoothGlareAlpha}), rgba(139, 92, 246, 0) 70%)`;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const clampedX = Math.max(0, Math.min(1, px));
    const clampedY = Math.max(0, Math.min(1, py));

    rawRotateY.set((clampedX - 0.5) * 2 * maxTiltDeg);
    rawRotateX.set((0.5 - clampedY) * 2 * maxTiltDeg);
    rawScale.set(scaleOnHover);
    glareX.set(clampedX * 100);
    glareY.set(clampedY * 100);
    glareAlpha.set(glareOpacity);
  };

  const handleMouseLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    rawScale.set(1);
    glareAlpha.set(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group ${className}`}
      style={{perspective: '1400px'}}
    >
      <motion.div
        style={
          prefersReducedMotion
            ? undefined
            : {
                rotateX,
                rotateY,
                scale,
                transformStyle: enable3DChildren ? 'preserve-3d' : undefined,
              }
        }
        className={`relative h-full w-full will-change-transform ${innerClassName}`}
      >
        {children}

        {/* Hover Shimmer Sweep Overlay */}
        {!prefersReducedMotion && shimmerOnHover && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] z-20"
          >
            <div className="group-hover-shimmer absolute inset-y-0 left-0 w-1/2 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
          </div>
        )}

        {/* Subtle Pointer Specular Glare Overlay */}
        {!prefersReducedMotion && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] z-20"
            style={{background: glareBackground}}
          />
        )}
      </motion.div>
    </div>
  );
}

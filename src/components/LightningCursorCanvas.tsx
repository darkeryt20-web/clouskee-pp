import {RefObject, useEffect, useRef} from 'react';

interface LightningCursorCanvasProps {
  enabled: boolean;
  color: string;
  isPreview: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
}

interface Point {
  x: number;
  y: number;
}

interface TrailPoint extends Point {
  time: number;
}

interface LightningBolt {
  points: Point[];
  branches: Point[][];
  createdAt: number;
  lifeMs: number;
  width: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  createdAt: number;
  lifeMs: number;
  size: number;
}

interface Shockwave {
  x: number;
  y: number;
  createdAt: number;
  lifeMs: number;
  maxRadius: number;
  isPrimaryFlash: boolean;
}

function buildJaggedSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  segments: number,
  maxOffset: number,
): Point[] {
  const pts: Point[] = [{x: x1, y: y1}];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const envelope = Math.sin(t * Math.PI);
    const jitter = (Math.random() - 0.5) * 2 * maxOffset * envelope;
    pts.push({
      x: x1 + dx * t + nx * jitter,
      y: y1 + dy * t + ny * jitter,
    });
  }
  pts.push({x: x2, y: y2});
  return pts;
}

function buildBoltWithBranches(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  segments: number,
  maxOffset: number,
  branchCount: number,
): {points: Point[]; branches: Point[][]} {
  const points = buildJaggedSegment(x1, y1, x2, y2, segments, maxOffset);
  const branches: Point[][] = [];
  const baseAngle = Math.atan2(y2 - y1, x2 - x1);
  const totalDist = Math.hypot(x2 - x1, y2 - y1);

  for (let b = 0; b < branchCount; b++) {
    if (points.length < 3) break;
    const anchorIdx = 1 + Math.floor(Math.random() * (points.length - 2));
    const anchor = points[anchorIdx];
    const side = Math.random() < 0.5 ? -1 : 1;
    const branchAngle = baseAngle + side * (0.45 + Math.random() * 0.65);
    const branchLen = Math.max(12, totalDist * (0.3 + Math.random() * 0.35));
    const bx = anchor.x + Math.cos(branchAngle) * branchLen;
    const by = anchor.y + Math.sin(branchAngle) * branchLen;
    branches.push(
      buildJaggedSegment(anchor.x, anchor.y, bx, by, 4, maxOffset * 0.65),
    );
  }

  return {points, branches};
}

export function LightningCursorCanvas({
  enabled,
  color,
  isPreview,
  containerRef,
}: LightningCursorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colorRef = useRef(color);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;

    const trail: TrailPoint[] = [];
    const bolts: LightningBolt[] = [];
    const sparks: Spark[] = [];
    const shockwaves: Shockwave[] = [];
    const pointer = {
      x: 0,
      y: 0,
      active: false,
      lastMoveTime: 0,
      lastBoltX: 0,
      lastBoltY: 0,
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (isPreview && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        width = Math.max(1, Math.floor(rect.width));
        height = Math.max(1, Math.floor(rect.height));
      } else {
        width = Math.max(1, window.innerWidth);
        height = Math.max(1, window.innerHeight);
      }
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    let resizeObserver: ResizeObserver | null = null;
    if (isPreview && containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(containerRef.current);
    } else {
      window.addEventListener('resize', resize);
    }

    const toLocalCoords = (clientX: number, clientY: number): Point => {
      if (isPreview && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        return {
          x: clientX - rect.left,
          y: clientY - rect.top,
        };
      }
      return {x: clientX, y: clientY};
    };

    const spawnMoveLightning = (x: number, y: number, now: number) => {
      const distSinceLast = Math.hypot(
        x - pointer.lastBoltX,
        y - pointer.lastBoltY,
      );
      if (distSinceLast < 4) return;

      pointer.lastBoltX = x;
      pointer.lastBoltY = y;

      // Connect from recent trail anchor to active pointer
      if (trail.length >= 2) {
        const lookbackIdx = Math.max(0, trail.length - 1 - Math.min(4, trail.length - 1));
        const anchor = trail[lookbackIdx];
        const segLen = Math.hypot(x - anchor.x, y - anchor.y);
        if (segLen >= 6) {
          const primary = buildBoltWithBranches(
            anchor.x,
            anchor.y,
            x,
            y,
            Math.min(10, Math.max(5, Math.floor(segLen / 10))),
            Math.min(18, Math.max(7, segLen * 0.28)),
            Math.random() < 0.65 ? 1 : 2,
          );
          bolts.push({
            ...primary,
            createdAt: now,
            lifeMs: 170 + Math.random() * 90,
            width: 1.75,
          });
        }
      }

      // Faint surrounding micro-tendrils around the glowing core
      if (Math.random() < 0.75) {
        const angle = Math.random() * Math.PI * 2;
        const reach = (isPreview ? 18 : 26) + Math.random() * 24;
        const tendril = buildBoltWithBranches(
          x,
          y,
          x + Math.cos(angle) * reach,
          y + Math.sin(angle) * reach,
          5,
          9,
          1,
        );
        bolts.push({
          ...tendril,
          createdAt: now,
          lifeMs: 130 + Math.random() * 80,
          width: 1.15,
        });
      }

      // Floating spark particles
      const sparkCount = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 28 + Math.random() * 75;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          createdAt: now,
          lifeMs: 200 + Math.random() * 180,
          size: 1.1 + Math.random() * 1.4,
        });
      }
    };

    const spawnClickDischarge = (x: number, y: number, now: number) => {
      const boltCount = 10 + Math.floor(Math.random() * 5);
      const baseRadius = isPreview ? 62 : 95;

      for (let i = 0; i < boltCount; i++) {
        const baseAngle =
          (i / boltCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
        const reach = baseRadius * (0.68 + Math.random() * 0.55);
        const endX = x + Math.cos(baseAngle) * reach;
        const endY = y + Math.sin(baseAngle) * reach;
        const bolt = buildBoltWithBranches(
          x,
          y,
          endX,
          endY,
          7,
          16,
          Math.random() < 0.8 ? 2 : 1,
        );
        bolts.push({
          ...bolt,
          createdAt: now,
          lifeMs: 320 + Math.random() * 140,
          width: 2.1,
        });
      }

      // Expanding concentric shockwave rings (radar pulse + primary white flash)
      shockwaves.push(
        {
          x,
          y,
          createdAt: now,
          lifeMs: 380,
          maxRadius: isPreview ? 72 : 105,
          isPrimaryFlash: true,
        },
        {
          x,
          y,
          createdAt: now + 35,
          lifeMs: 440,
          maxRadius: isPreview ? 102 : 148,
          isPrimaryFlash: false,
        },
        {
          x,
          y,
          createdAt: now + 75,
          lifeMs: 490,
          maxRadius: isPreview ? 130 : 188,
          isPrimaryFlash: false,
        },
      );

      // Radial burst sparks
      for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 90 + Math.random() * 190;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          createdAt: now,
          lifeMs: 280 + Math.random() * 200,
          size: 1.4 + Math.random() * 1.8,
        });
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const now = performance.now();
      const pos = toLocalCoords(e.clientX, e.clientY);
      pointer.x = pos.x;
      pointer.y = pos.y;
      pointer.active = true;
      pointer.lastMoveTime = now;

      if (e.pointerType !== 'touch') {
        trail.push({x: pos.x, y: pos.y, time: now});
        if (trail.length > 14) trail.shift();
        spawnMoveLightning(pos.x, pos.y, now);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const now = performance.now();
      const pos = toLocalCoords(e.clientX, e.clientY);
      pointer.x = pos.x;
      pointer.y = pos.y;
      pointer.active = true;
      pointer.lastMoveTime = now;
      spawnClickDischarge(pos.x, pos.y, now);
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      trail.length = 0;
    };

    const previewEl = isPreview ? containerRef.current : null;
    const targetEl: Window | HTMLElement = previewEl ?? window;

    targetEl.addEventListener(
      'pointermove',
      handlePointerMove as EventListener,
      {passive: true},
    );
    targetEl.addEventListener(
      'pointerdown',
      handlePointerDown as EventListener,
      {passive: true},
    );
    if (previewEl) {
      previewEl.addEventListener('pointerleave', handlePointerLeave);
    } else {
      document.documentElement.addEventListener(
        'mouseleave',
        handlePointerLeave,
      );
    }

    const strokePolyline = (pts: Point[]) => {
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();
    };

    let lastFrameTime = performance.now();

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
      lastFrameTime = now;
      const activeColor = colorRef.current || '#f43f5e';

      ctx.clearRect(0, 0, width, height);

      // Prune stale trail points (> 180ms)
      while (trail.length > 0 && now - trail[0].time > 180) {
        trail.shift();
      }

      // Draw expanding concentric shockwaves & click center flash
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        const elapsed = now - sw.createdAt;
        if (elapsed < 0) continue;
        const progress = elapsed / sw.lifeMs;
        if (progress >= 1) {
          shockwaves.splice(i, 1);
          continue;
        }

        const easeOut = 1 - Math.pow(1 - progress, 3);
        const radius = Math.max(4, sw.maxRadius * easeOut);
        const alpha = (1 - progress) * (sw.isPrimaryFlash ? 0.9 : 0.65);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = sw.isPrimaryFlash ? 2.4 * (1 - progress * 0.6) : 1.5;
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Subtle inner white ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Bright white-hot center flash on primary ring
        if (sw.isPrimaryFlash && progress < 0.45) {
          const flashAlpha = (1 - progress / 0.45) * 0.92;
          const flashRadius = 26 * (1 - progress);
          const grad = ctx.createRadialGradient(
            sw.x,
            sw.y,
            0,
            sw.x,
            sw.y,
            Math.max(4, flashRadius),
          );
          grad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
          grad.addColorStop(0.45, `${activeColor}cc`);
          grad.addColorStop(1, `${activeColor}00`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, Math.max(4, flashRadius), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw electric lightning bolts + branches
      for (let i = bolts.length - 1; i >= 0; i--) {
        const bolt = bolts[i];
        const progress = (now - bolt.createdAt) / bolt.lifeMs;
        if (progress >= 1) {
          bolts.splice(i, 1);
          continue;
        }

        const alpha = Math.pow(1 - progress, 1.3);

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Outer electric colored glow pass
        ctx.globalAlpha = alpha * 0.95;
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = bolt.width * 2.1;
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 14;
        strokePolyline(bolt.points);
        for (const br of bolt.branches) {
          ctx.lineWidth = bolt.width * 1.45;
          strokePolyline(br);
        }

        // Inner white-hot core pass
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(0.75, bolt.width * 0.65);
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 4;
        strokePolyline(bolt.points);
        for (const br of bolt.branches) {
          ctx.lineWidth = Math.max(0.6, bolt.width * 0.45);
          strokePolyline(br);
        }

        ctx.restore();
      }

      // Draw & update floating sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        const progress = (now - sp.createdAt) / sp.lifeMs;
        if (progress >= 1) {
          sparks.splice(i, 1);
          continue;
        }

        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vx *= 0.93;
        sp.vy *= 0.93;

        const alpha = 1 - progress;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size * (1 - progress * 0.45), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Active glowing electric core at pointer
      if (pointer.active && now - pointer.lastMoveTime < 350) {
        const coreAlpha = Math.max(
          0.25,
          1 - (now - pointer.lastMoveTime) / 350,
        );
        ctx.save();
        ctx.globalAlpha = coreAlpha;
        const grad = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          16,
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(0.35, `${activeColor}cc`);
        grad.addColorStop(1, `${activeColor}00`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', resize);
      }
      targetEl.removeEventListener(
        'pointermove',
        handlePointerMove as EventListener,
      );
      targetEl.removeEventListener(
        'pointerdown',
        handlePointerDown as EventListener,
      );
      if (previewEl) {
        previewEl.removeEventListener('pointerleave', handlePointerLeave);
      } else {
        document.documentElement.removeEventListener(
          'mouseleave',
          handlePointerLeave,
        );
      }
      ctx.clearRect(0, 0, width, height);
    };
  }, [enabled, isPreview, containerRef]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`${
        isPreview ? 'absolute inset-0' : 'fixed inset-0'
      } z-[65] pointer-events-none w-full h-full`}
    />
  );
}

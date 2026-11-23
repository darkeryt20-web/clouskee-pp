import {RefObject, useEffect, useRef} from 'react';

interface LightningCursorCanvasProps {
  enabled: boolean;
  color: string;
  trailLength?: number;
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

function clampTrailLength(value: number | undefined): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return 120;
  return Math.min(300, Math.max(30, Math.round(num)));
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

/**
 * Extracts a clean path slice from the trail walking backwards from the active
 * pointer up to `maxLength` pixels, interpolating the exact tail endpoint.
 */
function sliceTrailByArcLength(
  trail: TrailPoint[],
  maxLength: number,
): {spine: Point[]; totalLength: number} {
  if (trail.length < 2) {
    return {spine: [], totalLength: 0};
  }

  const reversed: Point[] = [{x: trail[trail.length - 1].x, y: trail[trail.length - 1].y}];
  let accumulated = 0;

  for (let i = trail.length - 2; i >= 0; i--) {
    const curr = trail[i];
    const next = trail[i + 1];
    const segLen = Math.hypot(next.x - curr.x, next.y - curr.y);
    if (segLen < 0.5) continue;

    if (accumulated + segLen >= maxLength) {
      const remaining = maxLength - accumulated;
      const ratio = remaining / segLen;
      reversed.push({
        x: next.x + (curr.x - next.x) * ratio,
        y: next.y + (curr.y - next.y) * ratio,
      });
      accumulated = maxLength;
      break;
    }

    reversed.push({x: curr.x, y: curr.y});
    accumulated += segLen;
  }

  if (reversed.length < 2 || accumulated < 6) {
    return {spine: [], totalLength: 0};
  }

  reversed.reverse();
  return {spine: reversed, totalLength: accumulated};
}

/**
 * Resamples the path into evenly spaced points and constructs a single primary
 * jagged lightning bolt plus 1 to 3 subtle, thin secondary side forks.
 */
function buildSingleTrailBolt(
  spine: Point[],
  totalLength: number,
  isPreview: boolean,
): {mainPoints: Point[]; forks: Point[][]} {
  if (spine.length < 2 || totalLength < 6) {
    return {mainPoints: [], forks: []};
  }

  const targetStep = isPreview ? 11 : 14;
  const steps = Math.min(22, Math.max(4, Math.round(totalLength / targetStep)));

  // Build cumulative arc lengths along spine
  const cumLengths: number[] = [0];
  for (let i = 1; i < spine.length; i++) {
    cumLengths.push(
      cumLengths[i - 1] +
        Math.hypot(spine[i].x - spine[i - 1].x, spine[i].y - spine[i - 1].y),
    );
  }
  const actualTotal = cumLengths[cumLengths.length - 1] || 1;

  // Resample evenly
  const resampled: Point[] = [];
  let segCursor = 0;
  for (let s = 0; s <= steps; s++) {
    const targetDist = (s / steps) * actualTotal;
    while (
      segCursor < cumLengths.length - 2 &&
      cumLengths[segCursor + 1] < targetDist
    ) {
      segCursor++;
    }
    const d0 = cumLengths[segCursor];
    const d1 = cumLengths[segCursor + 1];
    const span = d1 - d0 || 1;
    const t = Math.min(1, Math.max(0, (targetDist - d0) / span));
    resampled.push({
      x: spine[segCursor].x + (spine[segCursor + 1].x - spine[segCursor].x) * t,
      y: spine[segCursor].y + (spine[segCursor + 1].y - spine[segCursor].y) * t,
    });
  }

  // Displace interior points perpendicularly for crisp electric jaggedness
  const maxJitter = Math.min(
    isPreview ? 8 : 11,
    Math.max(4, actualTotal * 0.09),
  );
  const mainPoints: Point[] = [resampled[0]];
  for (let i = 1; i < resampled.length - 1; i++) {
    const prev = resampled[i - 1];
    const next = resampled[i + 1];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const t = i / (resampled.length - 1);
    // Taper to 0 at both tail and pointer head so tip aligns tightly with cursor
    const envelope = Math.sin(t * Math.PI);
    const offset = (Math.random() - 0.5) * 2 * maxJitter * envelope;
    mainPoints.push({
      x: resampled[i].x + nx * offset,
      y: resampled[i].y + ny * offset,
    });
  }
  mainPoints.push(resampled[resampled.length - 1]);

  // Spawn only 1 to 3 subtle, thin secondary side-branches (forks)
  const forks: Point[][] = [];
  if (mainPoints.length >= 5) {
    const desiredForks =
      actualTotal < 55 ? 1 : actualTotal < 130 ? 2 : 2 + (Math.random() < 0.6 ? 1 : 0);
    const startIdx = 1;
    const endIdx = mainPoints.length - 2;
    const usableCount = Math.max(1, endIdx - startIdx + 1);

    for (let f = 0; f < desiredForks; f++) {
      // Spread forks across distinct sections of the primary bolt
      const zoneStart = startIdx + Math.floor((f / desiredForks) * usableCount);
      const zoneEnd = Math.min(
        endIdx,
        startIdx + Math.floor(((f + 1) / desiredForks) * usableCount),
      );
      const anchorIdx =
        zoneStart +
        Math.floor(Math.random() * Math.max(1, zoneEnd - zoneStart + 1));
      const anchor = mainPoints[anchorIdx];
      const nextPt = mainPoints[Math.min(mainPoints.length - 1, anchorIdx + 1)];
      const prevPt = mainPoints[Math.max(0, anchorIdx - 1)];
      const tangentAngle = Math.atan2(
        nextPt.y - prevPt.y,
        nextPt.x - prevPt.x,
      );

      // Fork splits off at a light forward/side angle
      const side = f % 2 === 0 ? 1 : -1;
      const forkAngle = tangentAngle + side * (0.42 + Math.random() * 0.48);
      const forkLen =
        Math.min(isPreview ? 24 : 34, Math.max(12, actualTotal * 0.18)) *
        (0.75 + Math.random() * 0.45);

      const forkEndX = anchor.x + Math.cos(forkAngle) * forkLen;
      const forkEndY = anchor.y + Math.sin(forkAngle) * forkLen;
      forks.push(buildJaggedSegment(anchor.x, anchor.y, forkEndX, forkEndY, 3, 4.5));
    }
  }

  return {mainPoints, forks};
}

export function LightningCursorCanvas({
  enabled,
  color,
  trailLength = 120,
  isPreview,
  containerRef,
}: LightningCursorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colorRef = useRef(color);
  const trailLengthRef = useRef(clampTrailLength(trailLength));

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    trailLengthRef.current = clampTrailLength(trailLength);
  }, [trailLength]);

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
    const clickBolts: LightningBolt[] = [];
    const sparks: Spark[] = [];
    const shockwaves: Shockwave[] = [];
    const pointer = {
      x: 0,
      y: 0,
      active: false,
      lastMoveTime: 0,
    };

    // Cached single movement bolt + 1-3 thin forks refreshed on a crisp crackle cadence
    let cachedMoveBolt: {
      mainPoints: Point[];
      forks: Point[][];
      lastCrackleAt: number;
    } = {
      mainPoints: [],
      forks: [],
      lastCrackleAt: 0,
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

    const refreshSingleMoveBolt = (now: number, force = false) => {
      if (!force && now - cachedMoveBolt.lastCrackleAt < 34) {
        return;
      }
      const {spine, totalLength} = sliceTrailByArcLength(
        trail,
        trailLengthRef.current,
      );
      if (spine.length < 2) {
        cachedMoveBolt = {mainPoints: [], forks: [], lastCrackleAt: now};
        return;
      }
      const {mainPoints, forks} = buildSingleTrailBolt(
        spine,
        totalLength,
        isPreview,
      );
      cachedMoveBolt = {
        mainPoints,
        forks,
        lastCrackleAt: now,
      };
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
        clickBolts.push({
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
        const last = trail[trail.length - 1];
        if (!last || Math.hypot(pos.x - last.x, pos.y - last.y) >= 2.5) {
          trail.push({x: pos.x, y: pos.y, time: now});
          if (trail.length > 48) trail.shift();
          refreshSingleMoveBolt(now, true);
        }
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
      cachedMoveBolt = {mainPoints: [], forks: [], lastCrackleAt: 0};
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

      // Prune stale trail points (> 220ms) so the bolt retracts and fades when resting
      let pruned = false;
      while (trail.length > 0 && now - trail[0].time > 220) {
        trail.shift();
        pruned = true;
      }

      const idleMs = now - pointer.lastMoveTime;
      if (pointer.active && trail.length >= 2 && idleMs < 220) {
        if (pruned || now - cachedMoveBolt.lastCrackleAt >= 36) {
          refreshSingleMoveBolt(now, true);
        }
      } else if (cachedMoveBolt.mainPoints.length > 0) {
        cachedMoveBolt = {mainPoints: [], forks: [], lastCrackleAt: now};
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

      // Draw single primary movement lightning bolt + 1-3 thin sparse side forks
      if (cachedMoveBolt.mainPoints.length >= 2 && idleMs < 220) {
        const moveAlpha = Math.max(0, Math.min(1, 1 - idleMs / 220));

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 1-3 subtle thin secondary side forks
        if (cachedMoveBolt.forks.length > 0) {
          ctx.globalAlpha = moveAlpha * 0.55;
          ctx.strokeStyle = activeColor;
          ctx.lineWidth = 1.6;
          ctx.shadowColor = activeColor;
          ctx.shadowBlur = 8;
          for (const fork of cachedMoveBolt.forks) {
            strokePolyline(fork);
          }

          ctx.globalAlpha = moveAlpha * 0.65;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.65;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 2;
          for (const fork of cachedMoveBolt.forks) {
            strokePolyline(fork);
          }
        }

        // Primary main bolt colored outer glow
        ctx.globalAlpha = moveAlpha * 0.95;
        ctx.strokeStyle = activeColor;
        ctx.lineWidth = 3.2;
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 14;
        strokePolyline(cachedMoveBolt.mainPoints);

        // Primary main bolt crisp white-hot core
        ctx.globalAlpha = moveAlpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.25;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 5;
        strokePolyline(cachedMoveBolt.mainPoints);

        ctx.restore();
      }

      // Draw radial click discharge lightning bolts
      for (let i = clickBolts.length - 1; i >= 0; i--) {
        const bolt = clickBolts[i];
        const progress = (now - bolt.createdAt) / bolt.lifeMs;
        if (progress >= 1) {
          clickBolts.splice(i, 1);
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

      // Draw & update burst sparks
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
      if (pointer.active && idleMs < 260) {
        const coreAlpha = Math.max(0, 1 - idleMs / 260);
        ctx.save();
        ctx.globalAlpha = coreAlpha;
        const grad = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          14,
        );
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(0.35, `${activeColor}cc`);
        grad.addColorStop(1, `${activeColor}00`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 14, 0, Math.PI * 2);
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

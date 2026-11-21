"use client";

import { useLayoutEffect, useRef, useState } from "react";

const pitchStrokes = [
  { path: "M180 72a32 32 0 1 1 0 64a32 32 0 1 1 0-64", delay: 160, duration: 350 },
  { path: "M180 104V6", delay: 470, duration: 220 },
  { path: "M180 104v98", delay: 470, duration: 220 },
  { path: "M19 104V12Q19 6 25 6H335Q341 6 341 12V104", delay: 680, duration: 510 },
  { path: "M341 104v92q0 6-6 6H25q-6 0-6-6v-92", delay: 680, duration: 510 },
  { path: "M19 48h59v112H19", delay: 1110, duration: 325 },
  { path: "M341 48h-59v112h59", delay: 1110, duration: 325 },
  { path: "M19 80h20v48H19", delay: 1340, duration: 235 },
  { path: "M341 80h-20v48h20", delay: 1340, duration: 235 },
  { path: "M78 82a31 31 0 0 1 0 44", delay: 1450, duration: 245 },
  { path: "M282 82a31 31 0 0 0 0 44", delay: 1450, duration: 245 },
  { path: "M19 14q8 0 8-8", delay: 1580, duration: 120 },
  { path: "M333 6q0 8 8 8", delay: 1580, duration: 120 },
  { path: "M19 194q8 0 8 8", delay: 1580, duration: 120 },
  { path: "M333 202q0-8 8-8", delay: 1580, duration: 120 },
  { path: "M341 90h10v28h-10", delay: 1580, duration: 120 },
  { path: "M19 90H9v28h10", delay: 1580, duration: 120 },
];

const shots = [
  { path: "M44 141C83 150 110 53 156 81S222 145 271 112Q297 91 347 104", direction: 1 },
  { path: "M64 48Q135 34 200 57T282 54L347 96", direction: 1 },
  { path: "M282 155Q216 190 159 155T83 151Q49 143 13 112", direction: -1 },
  { path: "M289 38L235 72Q199 104 164 68Q120 34 86 61L13 96", direction: -1 },
  { path: "M137 164Q179 171 200 129Q215 98 256 89Q306 75 347 111", direction: 1 },
];

const shotDuration = 1450;
const burstDuration = 780;
const replayDuration = 3600;
const sparks = Array.from({ length: 12 }, (_, index) => {
  const angle = index * Math.PI / 6;
  const radius = 14 + (index % 3) * 6;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
});

export function MiniPitch() {
  const root = useRef<SVGSVGElement>(null);
  const tracer = useRef<SVGCircleElement>(null);
  const [paused, setPaused] = useState(false);

  useLayoutEffect(() => {
    const svg = root.current;
    const ball = tracer.current;
    if (!svg || !ball) return;

    const paths = Array.from(svg.querySelectorAll<SVGPathElement>(".world-cup-stroke"));
    const shotPaths = Array.from(svg.querySelectorAll<SVGPathElement>(".world-cup-shot"));
    const particles = svg.querySelectorAll<SVGCircleElement>(".world-cup-spark");
    const trail = svg.querySelectorAll<SVGCircleElement>(".world-cup-trail");
    const shotLengths = shotPaths.map((path) => path.getTotalLength());
    const lengths = paths.map((path) => path.getTotalLength());
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const end = Math.max(...pitchStrokes.map(({ delay, duration }) => delay + duration));
    let frame = 0;
    let start: number | undefined;
    let fieldBuilt = false;
    let mountedAt: number | undefined;
    let elapsedBeforePause = 0;

    function showField() {
      paths.forEach((path) => {
        path.style.removeProperty("stroke-dashoffset");
        path.style.removeProperty("visibility");
      });
    }

    function finish() {
      cancelAnimationFrame(frame);
      showField();
      ball!.setAttribute("visibility", "hidden");
      particles.forEach((spark) => spark.setAttribute("opacity", "0"));
      trail.forEach((dot) => dot.setAttribute("opacity", "0"));
    }

    function replay(elapsed: number) {
      const replayTime = elapsed - end;
      const shotIndex = Math.floor(replayTime / replayDuration) % shots.length;
      const shot = shotPaths[shotIndex];
      const direction = shots[shotIndex].direction;
      const phase = replayTime % replayDuration;
      const rolling = phase < shotDuration;
      const progress = Math.min(1, phase / shotDuration);
      function position(fraction: number) {
        return shot.getPointAtLength(shotLengths[shotIndex] * (0.66 * fraction + 0.34 * fraction ** 4));
      }
      const tip = position(progress);
      ball!.setAttribute("cx", String(tip.x));
      ball!.setAttribute("cy", String(tip.y));
      ball!.setAttribute("r", String(3.8 + Math.sin(progress * Math.PI * 5) * 0.65));
      ball!.setAttribute("visibility", rolling ? "visible" : "hidden");
      trail.forEach((dot, index) => {
        const previous = progress - (index + 1) * 0.014;
        const point = position(Math.max(0, previous));
        dot.setAttribute("cx", String(point.x));
        dot.setAttribute("cy", String(point.y));
        dot.setAttribute("opacity", String(rolling && previous > 0 ? 0.48 - index * 0.12 : 0));
      });

      const burst = Math.max(0, Math.min(1, (phase - shotDuration) / burstDuration));
      particles.forEach((spark, index) => {
        const spread = 1 - (1 - burst) ** 2;
        spark.setAttribute("cx", String(tip.x - direction * 8 + sparks[index].x * spread));
        spark.setAttribute("cy", String(tip.y + sparks[index].y * spread + 8 * burst ** 2));
        spark.setAttribute("opacity", String(!rolling && burst < 1 ? (1 - burst) ** 2 : 0));
      });
    }

    function draw(now: number) {
      start ??= now;
      const elapsed = now - start;
      if (elapsed >= end) {
        if (!fieldBuilt) {
          showField();
          fieldBuilt = true;
        }
        replay(elapsed);
        frame = requestAnimationFrame(draw);
        return;
      }
      let tip: DOMPoint | undefined;
      paths.forEach((path, index) => {
        const { delay, duration } = pitchStrokes[index];
        const fraction = Math.max(0, Math.min(1, (elapsed - delay) / duration));
        const progress = 1 - (1 - fraction) ** 2;
        path.style.visibility = fraction === 0 ? "hidden" : "visible";
        path.style.strokeDashoffset = String(1 - progress);
        if (fraction > 0 && fraction < 1) tip = path.getPointAtLength(lengths[index] * progress);
      });

      if (tip) {
        ball!.setAttribute("cx", String(tip.x));
        ball!.setAttribute("cy", String(tip.y));
      }
      ball!.setAttribute("visibility", tip ? "visible" : "hidden");
      frame = requestAnimationFrame(draw);
    }

    let visible = false;
    function refresh() {
      cancelAnimationFrame(frame);
      const now = performance.now();
      if (mountedAt !== undefined) elapsedBeforePause += now - mountedAt;
      mountedAt = undefined;
      if (paused || (document.documentElement.dataset.motion === "system" && preference.matches)) {
        finish();
      } else if (visible && !document.hidden) {
        mountedAt = now;
        start = now - elapsedBeforePause;
        frame = requestAnimationFrame(draw);
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      refresh();
    });
    observer.observe(svg);
    document.addEventListener("visibilitychange", refresh);
    preference.addEventListener("change", refresh);
    window.addEventListener("scout-motion-change", refresh);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", refresh);
      preference.removeEventListener("change", refresh);
      window.removeEventListener("scout-motion-change", refresh);
      finish();
    };
  }, [paused]);

  return (
    <>
    <svg ref={root} aria-hidden="true" className="world-cup-pitch" viewBox="0 0 360 208">
      <defs>
        <radialGradient id="overview-pitch-glow">
          <stop stopColor="#93ee44" stopOpacity=".10" />
          <stop offset="1" stopColor="#93ee44" stopOpacity="0" />
        </radialGradient>
        <pattern id="overview-pitch-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0v20" fill="none" stroke="#bcf182" strokeOpacity=".08" />
        </pattern>
      </defs>
      <rect width="360" height="208" fill="url(#overview-pitch-glow)" />
      <rect width="360" height="208" fill="url(#overview-pitch-grid)" opacity=".55" />
      <circle className="world-cup-kickoff" cx="180" cy="104" r="3.4" fill="currentColor" />
      {pitchStrokes.map(({ path }) => (
        <path key={path} className="world-cup-stroke" d={path} pathLength="1" />
      ))}
      {shots.map(({ path }) => (
        <path key={path} className="world-cup-shot" d={path} fill="none" />
      ))}
      {[2.7, 2, 1.3].map((radius) => (
        <circle key={radius} className="world-cup-trail" r={radius} fill="#c2e49c" opacity="0" />
      ))}
      <circle ref={tracer} className="world-cup-ball" r="3" visibility="hidden" />
      {sparks.map((_, index) => (
        <circle key={index} className="world-cup-spark" r={index % 2 ? 1.4 : 2}
          fill={index % 2 ? "#e4ffb9" : "#ffd580"} opacity="0" />
      ))}
    </svg>
    <button className="link-button world-cup-replay-toggle" type="button"
      onClick={() => setPaused((value) => !value)}>
      {paused ? "Reiniciar animação do campo" : "Pausar animação do campo"}
    </button>
    </>
  );
}

"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

const groups = ".grid, .split, .stats-grid";
const easeOut = "cubic-bezier(.2, .65, .3, 1)";

export function PageEntrance({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const page = root.current;
    if (!page || typeof page.animate !== "function") return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const flow = page.firstElementChild?.matches(".stack") ? page.firstElementChild : page;
    const title = flow.querySelector(".page-head");
    const cards = Array.from(flow.children).flatMap((element) => {
      if (element === title || element.hasAttribute("hidden")) return [];
      return element.matches(groups) ? Array.from(element.children) : [element];
    });
    let animations: Animation[] = [];
    let frame = 0;

    function reset() {
      cancelAnimationFrame(frame);
      for (const animation of animations) animation.cancel();
      animations = [];
    }

    function start() {
      if (document.visibilityState !== "visible") return;
      const reduced = document.documentElement.dataset.motion === "system" && preference.matches;
      if (reduced) return;
      const timing = { duration: 504, easing: easeOut, fill: "backwards" } as const;
      if (title) {
        animations.push(title.animate(
          [{ opacity: 0.12, transform: "translateY(20px)" }, { opacity: 1, transform: "none" }],
          timing,
        ));
      }
      cards.forEach((card, index) => {
        animations.push(card.animate(
          [{ opacity: 0.08, transform: "translateY(32px)" }, { opacity: 1, transform: "none" }],
          { ...timing, delay: (index + 1) * 43.2 },
        ));
      });
      // Hold the first pose through a paint, even when the route commit is expensive.
      for (const animation of animations) animation.pause();
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          for (const animation of animations) animation.play();
        });
      });
    }

    if (document.visibilityState === "visible") start();
    else document.addEventListener("visibilitychange", start, { once: true });
    function onPreferenceChange() {
      if (document.documentElement.dataset.motion === "system" && preference.matches) reset();
    }
    preference.addEventListener("change", onPreferenceChange);
    window.addEventListener("scout-motion-change", onPreferenceChange);
    return () => {
      document.removeEventListener("visibilitychange", start);
      preference.removeEventListener("change", onPreferenceChange);
      window.removeEventListener("scout-motion-change", onPreferenceChange);
      reset();
    };
  }, []);

  return <div className="scout-page-enter" ref={root}>{children}</div>;
}

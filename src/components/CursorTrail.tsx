import { useEffect, useRef, useState } from "react";

const opacities = [0.50, 0.38, 0.26, 0.16, 0.08];
const fadeDuration = 120;

export function CursorTrail() {
  const [enabled, setEnabled] = useState(() => typeof window !== "undefined"
    && window.matchMedia("(pointer: fine)").matches
    && !window.matchMedia("(pointer: coarse)").matches
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const overlay = useRef<HTMLDivElement>(null);
  const ghosts = useRef<HTMLDivElement>(null);
  const arrows = useRef<(SVGSVGElement | null)[]>([]);
  const pointer = useRef({ x: 0, y: 0 });
  const previousPointer = useRef({ x: 0, y: 0 });
  const positions = useRef(opacities.map(() => ({ x: 0, y: 0 })));

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(fine.matches && !coarse.matches && !reducedMotion.matches);
    const queries = [fine, coarse, reducedMotion];
    queries.forEach(query => query.addEventListener("change", update));
    update();
    return () => queries.forEach(query => query.removeEventListener("change", update));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    let initialized = false;
    let opacity = 0;
    let fadeFrom = 0;
    let lastMovement = 0;
    const pulses = new Map<HTMLSpanElement, ReturnType<typeof setTimeout>>();

    function paint(index: number) {
      const position = positions.current[index];
      // The SVG hotspot is (1, 1), so compensate to place its tip at the anchor.
      arrows.current[index]?.style.setProperty("transform", `translate3d(${position.x - 1}px, ${position.y - 1}px, 0)`);
    }

    function collapse() {
      positions.current.forEach((position, index) => {
        position.x = pointer.current.x;
        position.y = pointer.current.y;
        paint(index);
      });
    }

    function animate(time: number) {
      frame = 0;
      const distance = Math.hypot(pointer.current.x - previousPointer.current.x, pointer.current.y - previousPointer.current.y);
      previousPointer.current.x = pointer.current.x;
      previousPointer.current.y = pointer.current.y;
      if (distance > 0.01) {
        opacity += (Math.min(1, distance / 4) - opacity) * 0.65;
        fadeFrom = opacity;
        lastMovement = time;
      } else {
        opacity = fadeFrom * Math.max(0, 1 - (time - lastMovement) / fadeDuration);
      }

      let target = pointer.current;
      positions.current.forEach((position, index) => {
        const factor = index === 0 ? 0.45 : 0.35;
        position.x += (target.x - position.x) * factor;
        position.y += (target.y - position.y) * factor;
        paint(index);
        target = position;
      });
      if (ghosts.current) ghosts.current.style.opacity = String(opacity);
      if (opacity > 0) {
        frame = requestAnimationFrame(animate);
      } else {
        // Once invisible, collapse and sleep instead of animating hidden arrows.
        collapse();
      }
    }

    function removePulse(pulse: HTMLSpanElement) {
      clearTimeout(pulses.get(pulse));
      pulses.delete(pulse);
      pulse.remove();
    }

    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      initialized = false;
      opacity = 0;
      fadeFrom = 0;
      if (ghosts.current) ghosts.current.style.opacity = "0";
      pulses.forEach((_timer, pulse) => removePulse(pulse));
    }

    function move(event: PointerEvent) {
      if (event.pointerType !== "mouse") { reset(); return; }
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
      if (!initialized) {
        // Emit from the first real hotspot, never from the viewport origin.
        collapse();
        previousPointer.current.x = event.clientX;
        previousPointer.current.y = event.clientY;
        initialized = true;
      }
      if (!frame) frame = requestAnimationFrame(animate);
    }

    function click(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !overlay.current) return;
      const pulse = document.createElement("span");
      pulse.className = "cursor-trail__pulse";
      pulse.style.left = `${event.clientX}px`;
      pulse.style.top = `${event.clientY}px`;
      pulse.addEventListener("animationend", () => removePulse(pulse), { once: true });
      pulses.set(pulse, setTimeout(() => removePulse(pulse), 340));
      overlay.current.appendChild(pulse);
    }

    function leave(event: PointerEvent) { if (event.relatedTarget === null) reset(); }
    function visibility() { if (document.hidden) reset(); }
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", click, { passive: true, capture: true });
    window.addEventListener("pointerout", leave);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      reset();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", click, true);
      window.removeEventListener("pointerout", leave);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div ref={overlay} className="cursor-trail" aria-hidden="true">
    <div ref={ghosts} className="cursor-trail__ghosts">
      {opacities.map((opacity, index) => <svg key={index} ref={node => { arrows.current[index] = node; }}
        className="cursor-trail__arrow" width="24" height="24" viewBox="0 0 24 24" focusable="false"
        style={{ opacity, zIndex: opacities.length - index }}>
        <path d="M1 1V19L6 14.5L10 23L14 21L10 13H18Z"/>
      </svg>)}
    </div>
  </div>;
}

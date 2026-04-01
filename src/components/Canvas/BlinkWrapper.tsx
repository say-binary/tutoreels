"use client";

import { useRef, useEffect } from "react";
import { Group } from "react-konva";
import type Konva from "konva";

/**
 * Wraps children in a Group that blinks (oscillates opacity) when blink=true.
 * Uses Konva node directly for performance — no React re-renders.
 */
export function BlinkGroup({
  blink,
  speed = 2,
  children,
}: {
  blink: boolean;
  speed?: number;
  children: React.ReactNode;
}) {
  const groupRef = useRef<Konva.Group>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!blink || !groupRef.current) {
      if (groupRef.current) groupRef.current.opacity(1);
      return;
    }

    const start = performance.now();
    const animate = (now: number) => {
      if (!groupRef.current) return;
      const elapsed = (now - start) / 1000;
      const t = Math.sin(elapsed * speed * Math.PI * 2) * 0.5 + 0.5;
      groupRef.current.opacity(0.25 + t * 0.75);
      groupRef.current.getLayer()?.batchDraw();
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [blink, speed]);

  return (
    <Group ref={groupRef}>
      {children}
    </Group>
  );
}

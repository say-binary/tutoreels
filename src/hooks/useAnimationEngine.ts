"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AnimationEngine, type ComputedAssetState } from "@/engine/AnimationEngine";
import { Clock } from "@/engine/Clock";
import type { SceneGraph } from "@/types/sceneGraph";

export function useAnimationEngine(sceneGraph: SceneGraph | null) {
  const engineRef = useRef<AnimationEngine | null>(null);
  const clockRef = useRef<Clock | null>(null);

  const [states, setStates] = useState<Map<string, ComputedAssetState>>(
    new Map()
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const [duration, setDuration] = useState(0);

  const tick = useCallback(
    (time: number) => {
      if (!engineRef.current) return;
      const computed = engineRef.current.computeStates(time);
      setStates(computed);
      setCurrentTime(time);
      if (clockRef.current && time >= clockRef.current.duration) {
        setPlaying(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!sceneGraph) {
      engineRef.current = null;
      clockRef.current?.destroy();
      clockRef.current = null;
      setStates(new Map());
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const engine = new AnimationEngine(sceneGraph);
    engineRef.current = engine;

    // Calculate effective duration from timeline entries
    // Use the later of: metadata.duration OR last timeline event end + 2s buffer
    let lastEnd = 0;
    for (const entry of sceneGraph.timeline) {
      const end = entry.startTime + entry.duration;
      if (end > lastEnd) lastEnd = end;
    }
    const effectiveDuration = lastEnd + 2; // 2s viewing buffer after last animation
    // Use metadata duration only if it's close to effective; otherwise use effective
    const dur = Math.abs(sceneGraph.metadata.duration - effectiveDuration) > 5
      ? effectiveDuration
      : sceneGraph.metadata.duration;
    setDuration(dur);

    const clock = new Clock(dur, tick);
    clockRef.current?.destroy();
    clockRef.current = clock;

    // Compute initial state
    tick(0);

    return () => {
      clock.destroy();
    };
  }, [sceneGraph, tick]);

  const play = useCallback(() => {
    clockRef.current?.play();
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    clockRef.current?.pause();
    setPlaying(false);
  }, []);

  const reset = useCallback(() => {
    clockRef.current?.reset();
    setPlaying(false);
    setCurrentTime(0);
  }, []);

  const seek = useCallback((time: number) => {
    clockRef.current?.seek(time);
  }, []);

  const setSpeed = useCallback((s: number) => {
    clockRef.current?.setSpeed(s);
    setSpeedState(s);
  }, []);

  return {
    states,
    currentTime,
    duration,
    playing,
    speed,
    play,
    pause,
    reset,
    seek,
    setSpeed,
  };
}

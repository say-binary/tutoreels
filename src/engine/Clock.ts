export type ClockCallback = (currentTime: number) => void;

export class Clock {
  private _currentTime = 0;
  private _duration: number;
  private _speed = 1;
  private _playing = false;
  private _lastFrameTime = 0;
  private _rafId: number | null = null;
  private _onTick: ClockCallback;

  constructor(duration: number, onTick: ClockCallback) {
    this._duration = duration;
    this._onTick = onTick;
  }

  get currentTime() {
    return this._currentTime;
  }
  get duration() {
    return this._duration;
  }
  get speed() {
    return this._speed;
  }
  get playing() {
    return this._playing;
  }

  play() {
    if (this._playing) return;
    if (this._currentTime >= this._duration) {
      this._currentTime = 0;
    }
    this._playing = true;
    this._lastFrameTime = performance.now();
    this._scheduleFrame();
  }

  pause() {
    this._playing = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  reset() {
    this.pause();
    this._currentTime = 0;
    this._onTick(0);
  }

  seek(time: number) {
    this._currentTime = Math.max(0, Math.min(time, this._duration));
    this._onTick(this._currentTime);
  }

  setSpeed(speed: number) {
    this._speed = speed;
  }

  setDuration(duration: number) {
    this._duration = duration;
    if (this._currentTime > duration) {
      this._currentTime = duration;
    }
  }

  destroy() {
    this.pause();
  }

  private _scheduleFrame() {
    this._rafId = requestAnimationFrame((now) => this._frame(now));
  }

  private _frame(now: number) {
    if (!this._playing) return;

    const delta = (now - this._lastFrameTime) / 1000;
    this._lastFrameTime = now;
    this._currentTime += delta * this._speed;

    if (this._currentTime >= this._duration) {
      this._currentTime = this._duration;
      this._playing = false;
      this._onTick(this._currentTime);
      return;
    }

    this._onTick(this._currentTime);
    this._scheduleFrame();
  }
}

// ⚡ TIME WARP INJECTOR
// This script overrides the page's time functions so the game thinks time moves faster

(function() {
  const SPEED_MULTIPLIER = window.__TIME_WARP_SPEED__ || 10;
  const startRealTime = Date.now();
  const startFakeTime = startRealTime;

  // ─── Override Date ───────────────────────────────────────────────
  const OriginalDate = window.Date;

  function getFakeNow() {
    const elapsed = OriginalDate.now() - startRealTime;
    return startFakeTime + elapsed * SPEED_MULTIPLIER;
  }

  class FakeDate extends OriginalDate {
    constructor(...args) {
      if (args.length === 0) {
        super(getFakeNow());
      } else {
        super(...args);
      }
    }

    static now() {
      return getFakeNow();
    }

    static parse(...args) {
      return OriginalDate.parse(...args);
    }

    static UTC(...args) {
      return OriginalDate.UTC(...args);
    }
  }

  // Copy all static methods and prototype
  Object.setPrototypeOf(FakeDate, OriginalDate);
  Object.setPrototypeOf(FakeDate.prototype, OriginalDate.prototype);

  window.Date = FakeDate;

  // ─── Override setTimeout ─────────────────────────────────────────
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;
  const originalClearTimeout = window.clearTimeout;
  const originalClearInterval = window.clearInterval;

  window.setTimeout = function(fn, delay, ...args) {
    const fasterDelay = delay != null ? delay / SPEED_MULTIPLIER : 0;
    return originalSetTimeout(fn, fasterDelay, ...args);
  };

  window.setInterval = function(fn, delay, ...args) {
    const fasterDelay = delay != null ? delay / SPEED_MULTIPLIER : 0;
    return originalSetInterval(fn, fasterDelay, ...args);
  };

  window.clearTimeout = originalClearTimeout;
  window.clearInterval = originalClearInterval;

  // ─── Override performance.now ────────────────────────────────────
  const originalPerformanceNow = performance.now.bind(performance);
  const perfStart = originalPerformanceNow();

  Object.defineProperty(window.performance, 'now', {
    value: function() {
      const realElapsed = originalPerformanceNow() - perfStart;
      return perfStart + realElapsed * SPEED_MULTIPLIER;
    },
    writable: true,
    configurable: true
  });

  // ─── requestAnimationFrame speed boost ──────────────────────────
  // Some games use rAF delta time — we fake that too
  const originalRAF = window.requestAnimationFrame;
  let lastRealTime = null;
  let fakeTime = performance.now() / SPEED_MULTIPLIER; // real start

  // Signal that time warp is active
  window.__TIME_WARP_ACTIVE__ = true;
  window.__TIME_WARP_MULTIPLIER__ = SPEED_MULTIPLIER;

  console.log(`%c⚡ TIME WARP ACTIVE — Speed: ${SPEED_MULTIPLIER}x`, 
    'color: #00ffcc; font-size: 14px; font-weight: bold; background: #000; padding: 4px 10px; border-radius: 4px;');
})();

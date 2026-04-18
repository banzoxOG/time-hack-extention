// Background service worker for Time Warp extension

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "injectTimeWarp") {
    const tabId = sender.tab ? sender.tab.id : message.tabId;
    const speed = message.speed || 10;

    chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: "MAIN", // Run in page's main world to override its globals
      func: injectTimeWarpCode,
      args: [speed]
    }).then(() => {
      sendResponse({ success: true });
    }).catch(err => {
      sendResponse({ success: false, error: err.message });
    });

    return true; // Keep message channel open for async response
  }

  if (message.action === "removeTimeWarp") {
    const tabId = message.tabId;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: "MAIN",
      func: () => {
        window.__TIME_WARP_ACTIVE__ = false;
        console.log('%c⏹ TIME WARP STOPPED — Reload the page to fully reset.', 
          'color: #ff6666; font-size: 13px; font-weight: bold;');
      }
    }).then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false }));
    return true;
  }
});

function injectTimeWarpCode(SPEED_MULTIPLIER) {
  // Prevent double injection
  if (window.__TIME_WARP_ACTIVE__) {
    console.log(`%c⚡ Time Warp already active at ${window.__TIME_WARP_MULTIPLIER__}x`, 
      'color: #ffcc00; font-size: 13px;');
    return;
  }

  const OriginalDate = window.Date;
  const startRealTime = OriginalDate.now();
  const startFakeTime = startRealTime;

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
    static now() { return getFakeNow(); }
    static parse(...a) { return OriginalDate.parse(...a); }
    static UTC(...a) { return OriginalDate.UTC(...a); }
  }
  Object.setPrototypeOf(FakeDate, OriginalDate);
  Object.setPrototypeOf(FakeDate.prototype, OriginalDate.prototype);
  window.Date = FakeDate;

  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;

  window.setTimeout = function(fn, delay, ...args) {
    return originalSetTimeout(fn, delay != null ? delay / SPEED_MULTIPLIER : 0, ...args);
  };
  window.setInterval = function(fn, delay, ...args) {
    return originalSetInterval(fn, delay != null ? delay / SPEED_MULTIPLIER : 0, ...args);
  };

  const originalPerfNow = performance.now.bind(performance);
  const perfStart = originalPerfNow();
  Object.defineProperty(window.performance, 'now', {
    value: function() {
      return perfStart + (originalPerfNow() - perfStart) * SPEED_MULTIPLIER;
    },
    writable: true, configurable: true
  });

  window.__TIME_WARP_ACTIVE__ = true;
  window.__TIME_WARP_MULTIPLIER__ = SPEED_MULTIPLIER;

  console.log(`%c⚡ TIME WARP ACTIVE — Speed: ${SPEED_MULTIPLIER}x`, 
    'color: #00ffcc; font-size: 14px; font-weight: bold; background: #111; padding: 4px 10px; border-radius: 4px;');
}

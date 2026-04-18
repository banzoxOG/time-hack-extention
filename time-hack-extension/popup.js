// Popup logic for Time Warp extension

const speedSlider = document.getElementById('speedSlider');
const speedDisplay = document.getElementById('speedDisplay');
const activateBtn = document.getElementById('activateBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const presetBtns = document.querySelectorAll('.preset-btn');

let currentSpeed = 10;
let isActive = false;

// Load saved state
chrome.storage.local.get(['speed', 'active'], (data) => {
  if (data.speed) {
    currentSpeed = data.speed;
    speedSlider.value = currentSpeed;
    speedDisplay.textContent = currentSpeed;
    updateSliderFill();
  }
  if (data.active) {
    setActiveState(true);
  }
  updatePresetHighlight();
});

// Slider input
speedSlider.addEventListener('input', () => {
  currentSpeed = parseInt(speedSlider.value);
  speedDisplay.textContent = currentSpeed;
  updateSliderFill();
  updatePresetHighlight();
  chrome.storage.local.set({ speed: currentSpeed });
});

function updateSliderFill() {
  const min = parseInt(speedSlider.min);
  const max = parseInt(speedSlider.max);
  const pct = ((currentSpeed - min) / (max - min)) * 100;
  speedSlider.style.setProperty('--pct', pct + '%');
}

function updatePresetHighlight() {
  presetBtns.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.speed) === currentSpeed);
  });
}

// Preset buttons
presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentSpeed = parseInt(btn.dataset.speed);
    speedSlider.value = currentSpeed;
    speedDisplay.textContent = currentSpeed;
    updateSliderFill();
    updatePresetHighlight();
    chrome.storage.local.set({ speed: currentSpeed });
  });
});

// Activate
activateBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.runtime.sendMessage({
    action: "injectTimeWarp",
    tabId: tab.id,
    speed: currentSpeed
  }, (response) => {
    if (response && response.success) {
      setActiveState(true);
      chrome.storage.local.set({ active: true, speed: currentSpeed });
    } else {
      statusText.innerHTML = '<span style="color:#ff4466">ERROR — Try reloading the page first</span>';
    }
  });
});

// Stop
stopBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.runtime.sendMessage({ action: "removeTimeWarp", tabId: tab.id }, () => {
    setActiveState(false);
    chrome.storage.local.set({ active: false });
  });
});

function setActiveState(active) {
  isActive = active;
  if (active) {
    statusDot.className = 'status-dot active';
    statusText.innerHTML = `ACTIVE — <span>${currentSpeed}×</span> speed on this tab`;
    activateBtn.style.display = 'none';
    stopBtn.style.display = 'block';
  } else {
    statusDot.className = 'status-dot inactive';
    statusText.innerHTML = 'INACTIVE — Click ACTIVATE';
    activateBtn.style.display = 'block';
    stopBtn.style.display = 'none';
  }
}

updateSliderFill();

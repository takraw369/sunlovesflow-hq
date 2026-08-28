(() => {
  const STORAGE_KEY = 'slf.wantReturnQuest.v1';
  const DAY = 1;
  const form = document.querySelector('#noticeForm');
  const entry = document.querySelector('#noticeText');
  const saveButton = document.querySelector('#saveButton');
  const formScreen = document.querySelector('#formScreen');
  const doneScreen = document.querySelector('#doneScreen');
  const summaryText = document.querySelector('#summaryText');
  const summarySignal = document.querySelector('#summarySignal');
  const summaryIntensity = document.querySelector('#summaryIntensity');
  const editButton = document.querySelector('#editButton');
  const resetButton = document.querySelector('#resetButton');

  let selectedSignal = '';
  let selectedIntensity = null;

  const signalButtons = [...document.querySelectorAll('[data-signal]')];
  const scaleButtons = [...document.querySelectorAll('[data-intensity]')];

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (_) {
      return {};
    }
  }

  function writeState(next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function params() {
    const p = new URLSearchParams(location.search);
    return {
      source: p.get('source') || null,
      campaign: p.get('campaign') || null,
      ref: p.get('ref') || null
    };
  }

  function setActive(buttons, active) {
    buttons.forEach((button) => {
      button.classList.toggle('is-active', button === active);
      button.setAttribute('aria-pressed', button === active ? 'true' : 'false');
    });
  }

  function validate() {
    const ok = entry.value.trim().length > 0 && selectedSignal && selectedIntensity !== null;
    saveButton.disabled = !ok;
  }

  function renderDone(day1) {
    formScreen.classList.add('is-hidden');
    doneScreen.classList.remove('is-hidden');
    summaryText.textContent = day1.notice;
    summarySignal.textContent = day1.signal;
    summaryIntensity.textContent = `${day1.intensity} / 4`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  signalButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedSignal = button.dataset.signal;
      setActive(signalButtons, button);
      validate();
    });
  });

  scaleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectedIntensity = Number(button.dataset.intensity);
      setActive(scaleButtons, button);
      validate();
    });
  });

  entry.addEventListener('input', validate);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (saveButton.disabled) return;

    const state = readState();
    const day1 = {
      notice: entry.value.trim(),
      signal: selectedSignal,
      intensity: selectedIntensity,
      completedAt: new Date().toISOString(),
      route: location.pathname,
      attribution: params()
    };

    const next = {
      ...state,
      version: 1,
      series: 'want-return',
      currentDay: Math.max(Number(state.currentDay || 1), 1),
      lastCompletedDay: Math.max(Number(state.lastCompletedDay || 0), DAY),
      days: { ...(state.days || {}), day1 }
    };
    writeState(next);

    window.dispatchEvent(new CustomEvent('slf:quest-event', {
      detail: { quest: 'want-return', day: DAY, event: 'complete', payload: day1 }
    }));

    renderDone(day1);
  });

  editButton.addEventListener('click', () => {
    doneScreen.classList.add('is-hidden');
    formScreen.classList.remove('is-hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  resetButton.addEventListener('click', () => {
    const state = readState();
    if (state.days) delete state.days.day1;
    state.lastCompletedDay = 0;
    writeState(state);
    entry.value = '';
    selectedSignal = '';
    selectedIntensity = null;
    setActive(signalButtons, null);
    setActive(scaleButtons, null);
    doneScreen.classList.add('is-hidden');
    formScreen.classList.remove('is-hidden');
    validate();
  });

  const existing = readState()?.days?.day1;
  if (existing) {
    entry.value = existing.notice || '';
    selectedSignal = existing.signal || '';
    selectedIntensity = Number.isFinite(existing.intensity) ? existing.intensity : null;
    const signal = signalButtons.find((b) => b.dataset.signal === selectedSignal);
    const intensity = scaleButtons.find((b) => Number(b.dataset.intensity) === selectedIntensity);
    if (signal) setActive(signalButtons, signal);
    if (intensity) setActive(scaleButtons, intensity);
    validate();
    renderDone(existing);
  } else {
    validate();
  }
})();

(() => {
  const ENDPOINT = 'https://qydbtholbwbuwiswmqsr.supabase.co/functions/v1/voice-submit';
  const FLOW_TOKEN_KEY = 'slf.flowAccessToken.v1';
  const INSTALLATION_KEY = 'slf.installationId.v1';

  const TYPE_CONFIG = [
    { key: 'praise', label: 'よかった', icon: '◎', placeholder: 'どこが良かった？' },
    { key: 'friction', label: '困った', icon: '△', placeholder: 'どこで止まった・分かりにくかった？' },
    { key: 'request', label: '欲しい', icon: '＋', placeholder: 'こんなのが欲しい、を教えてください。' },
    { key: 'outcome', label: '変わった', icon: '↗', placeholder: '何がどう変わった？' },
  ];

  function getInstallationId() {
    let id = localStorage.getItem(INSTALLATION_KEY);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(INSTALLATION_KEY, id);
    }
    return id;
  }

  function eventId(targetKey) {
    const base = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return `voice:${targetKey}:${base}`.slice(0, 180);
  }

  function injectStyles() {
    if (document.getElementById('slf-voice-style')) return;
    const style = document.createElement('style');
    style.id = 'slf-voice-style';
    style.textContent = `
      .slf-voice{margin-top:24px;padding:18px;border:1px solid rgba(148,163,184,.22);border-radius:18px;background:rgba(15,23,42,.48);backdrop-filter:blur(8px)}
      .slf-voice__eyebrow{margin:0 0 6px;font-size:11px;letter-spacing:.14em;font-weight:700;opacity:.62}
      .slf-voice__title{margin:0;font-size:17px;line-height:1.45}
      .slf-voice__lead{margin:7px 0 14px;font-size:13px;line-height:1.65;opacity:.72}
      .slf-voice__types{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .slf-voice__type{appearance:none;border:1px solid rgba(148,163,184,.24);border-radius:12px;padding:11px 10px;background:rgba(255,255,255,.04);color:inherit;font:inherit;font-weight:700;cursor:pointer;text-align:left;transition:.18s ease}
      .slf-voice__type:hover,.slf-voice__type:focus-visible{background:rgba(255,255,255,.08);outline:none}
      .slf-voice__type[aria-pressed="true"]{border-color:rgba(96,165,250,.72);background:rgba(59,130,246,.14)}
      .slf-voice__icon{display:inline-block;min-width:22px;opacity:.75}
      .slf-voice__detail{display:none;margin-top:12px}
      .slf-voice__detail.is-open{display:block}
      .slf-voice__textarea{width:100%;min-height:92px;box-sizing:border-box;resize:vertical;border:1px solid rgba(148,163,184,.24);border-radius:12px;padding:12px 13px;background:rgba(2,6,23,.36);color:inherit;font:inherit;line-height:1.6}
      .slf-voice__textarea:focus{outline:none;border-color:rgba(96,165,250,.72)}
      .slf-voice__row{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-top:10px;flex-wrap:wrap}
      .slf-voice__consent{display:flex;gap:7px;align-items:center;font-size:12px;opacity:.78;cursor:pointer}
      .slf-voice__send{appearance:none;border:0;border-radius:999px;padding:10px 16px;background:#fff;color:#0f172a;font:inherit;font-weight:800;cursor:pointer}
      .slf-voice__send:disabled{opacity:.45;cursor:default}
      .slf-voice__status{margin:10px 0 0;font-size:12px;line-height:1.5;opacity:.72}
      .slf-voice.is-sent .slf-voice__types,.slf-voice.is-sent .slf-voice__detail{display:none}
      @media (min-width:560px){.slf-voice__types{grid-template-columns:repeat(4,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);
  }

  function mount(options = {}) {
    const root = typeof options.root === 'string' ? document.querySelector(options.root) : options.root;
    if (!root || root.querySelector('[data-slf-voice]')) return null;

    injectStyles();

    const targetType = options.targetType || 'page';
    const targetKey = options.targetKey || location.pathname;
    const source = options.source || 'web';
    const title = options.title || 'この体験を一緒に育てる';
    const lead = options.lead || '感じたことを1つだけ。改善や次のQuestづくりに使います。';

    const shell = document.createElement('section');
    shell.className = 'slf-voice';
    shell.dataset.slfVoice = '1';
    shell.innerHTML = `
      <p class="slf-voice__eyebrow">VOICE</p>
      <h3 class="slf-voice__title"></h3>
      <p class="slf-voice__lead"></p>
      <div class="slf-voice__types" role="group" aria-label="フィードバック種別"></div>
      <div class="slf-voice__detail">
        <textarea class="slf-voice__textarea" maxlength="5000"></textarea>
        <div class="slf-voice__row">
          <label class="slf-voice__consent"><input type="checkbox" /> 匿名で紹介してもOK</label>
          <button class="slf-voice__send" type="button">VOICEを送る</button>
        </div>
      </div>
      <p class="slf-voice__status" aria-live="polite"></p>
    `;

    shell.querySelector('.slf-voice__title').textContent = title;
    shell.querySelector('.slf-voice__lead').textContent = lead;

    const typesRoot = shell.querySelector('.slf-voice__types');
    const detail = shell.querySelector('.slf-voice__detail');
    const textarea = shell.querySelector('.slf-voice__textarea');
    const consent = shell.querySelector('.slf-voice__consent input');
    const send = shell.querySelector('.slf-voice__send');
    const status = shell.querySelector('.slf-voice__status');
    let selected = null;

    TYPE_CONFIG.forEach((type) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'slf-voice__type';
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = `<span class="slf-voice__icon">${type.icon}</span>${type.label}`;
      button.addEventListener('click', () => {
        selected = type;
        typesRoot.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        detail.classList.add('is-open');
        textarea.placeholder = type.placeholder;
        textarea.focus({ preventScroll: true });
      });
      typesRoot.appendChild(button);
    });

    send.addEventListener('click', async () => {
      if (!selected) return;
      const body = textarea.value.trim() || selected.label;
      send.disabled = true;
      status.textContent = '送信中…';

      const token = localStorage.getItem(FLOW_TOKEN_KEY);
      const payload = {
        targetType,
        targetKey,
        feedbackType: selected.key,
        body,
        source,
        clientEventId: eventId(targetKey),
        publicConsent: consent.checked ? 'anonymous_public' : 'private',
        targetUrl: location.href,
        pageTitle: document.title,
        occurredAt: new Date().toISOString(),
        metadata: {
          installation_id: getInstallationId(),
          ...(options.metadata || {}),
        },
      };

      try {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'x-flow-token': token } : {}),
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`voice_${response.status}`);
        shell.classList.add('is-sent');
        status.textContent = 'ありがとう。あなたのVOICEを次の改善につなげます。';
      } catch (_) {
        send.disabled = false;
        status.textContent = '送信できませんでした。通信状況を確認して、もう一度お試しください。';
      }
    });

    root.appendChild(shell);
    return shell;
  }

  function autoMountQuestCompletion() {
    const doneCard = document.querySelector('#doneScreen .done-card');
    const day = document.body?.dataset?.day;
    if (!doneCard || !day) return;
    mount({
      root: doneCard,
      targetType: 'quest',
      targetKey: `want-return:day-${day}`,
      source: 'quest-web',
      title: 'このDayを一緒に育てる',
      lead: 'よかった・困った・欲しい・変わった。どれか1つだけでもOK。',
      metadata: { quest_external_id: 'want-return', quest_day: Number(day) },
    });
  }

  window.SLFVoice = { mount };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMountQuestCompletion, { once: true });
  } else {
    autoMountQuestCompletion();
  }
})();

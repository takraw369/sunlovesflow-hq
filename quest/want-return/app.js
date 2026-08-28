(() => {
  const STORAGE_KEY = 'slf.wantReturnQuest.v1';
  const FLOW_TOKEN_KEY = 'slf.flowAccessToken.v1';
  const INSTALLATION_KEY = 'slf.installationId.v1';
  const ENDPOINT = 'https://qydbtholbwbuwiswmqsr.supabase.co/functions/v1/quest-event';

  const DAY_CONFIGS = {
    1: {
      slug: 'NOTICE',
      title: '答えを出す前に、\n違和感を拾う。',
      lead: 'Want toは、最初から言葉になっているとは限らない。まずは「なんか違う」「なぜか気になる」という小さな反応を、消さずに残す。',
      fields: [
        { id: 'notice', type: 'text', label: '今日、少しでも「違うな」と感じたことは？', help: '仕事、人間関係、身体、時間の使い方、やり方。大きな問題でなくていい。', placeholder: '例：やることは終わったのに、なぜか前に進んだ感じがしなかった。' },
        { id: 'signal', type: 'choice', label: 'その瞬間、最初にどこが反応した？', help: '意味づけより先に出た反応を選ぶ。', options: ['身体', '感情', '思考', '行動衝動'] },
        { id: 'intensity', type: 'scale', label: 'その違和感の強さは？', min: '小さい', max: '強い' }
      ],
      signalField: 'signal',
      doneTitle: '違和感を、消さずに残せた。',
      doneText: '今日は解決しなくていい。明日は、その違和感の奥にある「本当はどうしたい？」を拾う。'
    },
    2: {
      slug: 'WANT',
      title: '「べき」を外して、\n本当はどうしたい？',
      lead: '正しさや現実性をいったん脇に置く。Day1の違和感を、未来側の選択へ翻訳する。',
      context: [{ day: 1, field: 'notice', label: '昨日拾った違和感' }],
      fields: [
        { id: 'want', type: 'text', label: '本当は、どうしたい？', help: 'できるかどうかではなく、自分が選びたい方向を書く。', placeholder: '例：もっと少人数で、深く人と関わる仕事の比率を増やしたい。' },
        { id: 'withoutPraise', type: 'choice', label: '誰にも褒められなくても、まだ選びたい？', options: ['はい', 'まだ分からない', 'いいえ'] },
        { id: 'energy', type: 'scale', label: 'その方向を想像すると、エネルギーは？', min: '下がる', max: '上がる' }
      ],
      signalField: 'withoutPraise',
      doneTitle: 'Wantを、言葉にできた。',
      doneText: '明日はこのWantを、5分以内で現実に触れられる最小行動へ変える。'
    },
    3: {
      slug: 'ONE ACTION',
      title: '未来を、\n5分だけ現実にする。',
      lead: '大きな計画は要らない。「私はこっちへ進む人だ」と脳と現実に証拠を1つ置く。',
      context: [{ day: 2, field: 'want', label: '昨日言葉にしたWant' }],
      fields: [
        { id: 'action', type: 'text', label: '5分以内でできる最小行動は？', help: '小さすぎるくらいでいい。', placeholder: '例：企画書を完成させる、ではなく「見出しを1つ書く」。' },
        { id: 'timing', type: 'text', label: 'いつ・何の後にやる？', help: '既存行動へ接続すると始めやすい。', placeholder: '例：PCを開いた直後。' },
        { id: 'didNow', type: 'choice', label: '今、その場でやった？', options: ['やった', 'この後やる', '今日は最低行動だけ'] },
        { id: 'energyAfter', type: 'scale', label: '行動後のエネルギーは？', min: '減った', max: '増えた' }
      ],
      signalField: 'didNow',
      doneTitle: '未来に、1mm触れた。',
      doneText: '明日は「なぜ止まるのか」を責めずに観察する。止まることもEvidence。'
    },
    4: {
      slug: 'FRICTION',
      title: '止まった理由を、\n自分の欠点にしない。',
      lead: '摩擦は「意志が弱い証拠」ではなく、環境・設計・不安・不明確さを見つけるデータ。',
      context: [{ day: 3, field: 'action', label: '昨日の最小行動' }],
      fields: [
        { id: 'friction', type: 'text', label: '進みにくくしたものは何だった？', help: '実際に起きたことを具体的に。', placeholder: '例：スマホ通知で集中が切れた／何から始めるか迷った。' },
        { id: 'frictionType', type: 'choice', label: '一番近い摩擦は？', options: ['環境', '時間', '不安・怖さ', '不明確', '体力・気力', '人間関係'] },
        { id: 'control', type: 'scale', label: '自分で動かせる余地は？', min: '少ない', max: '大きい' }
      ],
      signalField: 'frictionType',
      doneTitle: '摩擦を、人格から切り離せた。',
      doneText: '明日は「できなかった日」でも戻れる最低ラインとCueをつくる。'
    },
    5: {
      slug: 'RETURN',
      title: '続けるより、\n戻れる仕組みをつくる。',
      lead: 'ACEで見るのはStreakよりReturn Latency。崩れない人ではなく、崩れても戻れる人を育てる。',
      context: [{ day: 4, field: 'friction', label: '昨日見つけた摩擦' }],
      fields: [
        { id: 'minimum', type: 'text', label: '最悪の日でもできる「最低行動」は？', placeholder: '例：資料を開くだけ／スクワット1回／1行だけ書く。' },
        { id: 'cue', type: 'text', label: '何をCueにして戻る？', placeholder: '例：朝の白湯の後／PCを開いたら／風呂上がり。' },
        { id: 'ifThen', type: 'text', label: 'IF-THENを1つ決める', help: 'もしXなら、Yする。', placeholder: '例：もし2日空いたら、通常メニューではなく最低行動だけやる。' }
      ],
      doneTitle: '「戻る道」を先につくった。',
      doneText: '明日は、今の自分に次に開く扉を1つだけ選ぶ。'
    },
    6: {
      slug: 'NEXT DOOR',
      title: '次に開く扉を、\n1つだけ選ぶ。',
      lead: '全部やらない。今のWantとEvidenceから、次の良いExperienceを1つ選ぶ。',
      context: [{ day: 2, field: 'want', label: 'この7日で拾ったWant' }],
      fields: [
        { id: 'doorType', type: 'choice', label: '今、次に開きたい扉は？', options: ['QUEST', 'ROLE', 'PERSON', 'PROJECT'] },
        { id: 'door', type: 'text', label: '具体的には何を選ぶ？', placeholder: '例：○○さんに話を聞く／週末のイベント運営を手伝う。' },
        { id: 'reason', type: 'text', label: 'なぜ今、それが良い？', help: '正解より、自分の選択理由を残す。', placeholder: '例：考えるだけより、現場で試した方が次の情報が取れるから。' }
      ],
      signalField: 'doorType',
      doneTitle: '次の扉を、1つに絞れた。',
      doneText: '最終日は、この7日で得たものを誰かへ返す。学びは渡した時に資産になる。'
    },
    7: {
      slug: 'RETURN TO OTHERS',
      title: '自分の変化を、\n次の人へ渡す。',
      lead: '経験を自分だけで閉じない。気づき・失敗・工夫を誰かが使える形へ変えると、Educationが循環し始める。',
      fields: [
        { id: 'learning', type: 'text', label: 'この7日で、一番残したい気づきは？', placeholder: '例：続かなかった原因は意志ではなく、開始単位が大きすぎたこと。' },
        { id: 'recipient', type: 'text', label: '誰に渡せそう？', placeholder: '例：同じことで止まっている仲間／家族／チームメイト。' },
        { id: 'format', type: 'choice', label: 'どう渡す？', options: ['話す', 'メッセージ', '投稿・note', '一緒にやる', 'Quest化する'] },
        { id: 'returnPower', type: 'scale', label: '今、「自分で戻れる」感覚は？', min: 'まだ弱い', max: 'かなりある' }
      ],
      signalField: 'format',
      doneTitle: 'RETURN LOOP、1周完了。',
      doneText: 'Want toを固定しなくていい。気づき、選び、試し、崩れ、戻り、また選ぶ。その回路自体があなたのOSになる。'
    }
  };

  const day = Number(document.body.dataset.day || 1);
  const config = DAY_CONFIGS[day] || DAY_CONFIGS[1];
  const form = document.querySelector('#questForm');
  const fieldsRoot = document.querySelector('#fieldsRoot');
  const saveButton = document.querySelector('#saveButton');
  const formScreen = document.querySelector('#formScreen');
  const doneScreen = document.querySelector('#doneScreen');
  const contextRoot = document.querySelector('#contextRoot');
  const summaryRoot = document.querySelector('#summaryRoot');
  const syncStatus = document.querySelector('#syncStatus');
  const editButton = document.querySelector('#editButton');
  const nextButton = document.querySelector('#nextButton');
  const restartButton = document.querySelector('#restartButton');

  const answers = {};
  const controls = new Map();

  function readState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (_) { return {}; }
  }

  function writeState(next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function getInstallationId() {
    let id = localStorage.getItem(INSTALLATION_KEY);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(INSTALLATION_KEY, id);
    }
    return id;
  }

  function params() {
    const p = new URLSearchParams(location.search);
    return { source: p.get('source') || null, campaign: p.get('campaign') || null, ref: p.get('ref') || null };
  }

  function carryQuery(url) {
    return `${url}${location.search || ''}`;
  }

  function esc(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function configFor(n) { return DAY_CONFIGS[n] || DAY_CONFIGS[1]; }

  function renderHeader() {
    document.title = `Day ${day}｜${config.slug}｜Want to Return Quest`;
    document.querySelector('#dayPill').textContent = `DAY ${day} / 7`;
    document.querySelector('#progressBar').style.width = `${(day / 7) * 100}%`;
    document.querySelector('#kicker').textContent = `DAY ${day} · ${config.slug}`;
    document.querySelector('#heroTitle').innerHTML = config.title.split('\n').map(esc).join('<br>');
    document.querySelector('#heroLead').textContent = config.lead;
    document.querySelector('#doneTitle').textContent = config.doneTitle;
    document.querySelector('#doneText').textContent = config.doneText;
    nextButton.textContent = day < 7 ? `DAY ${day + 1}へ進む` : '7日間を振り返る';
  }

  function renderContext() {
    const state = readState();
    const items = config.context || [];
    const visible = items.map((item) => {
      const value = state.days?.[`day${item.day}`]?.answers?.[item.field] ?? state.days?.[`day${item.day}`]?.[item.field];
      return value ? { ...item, value } : null;
    }).filter(Boolean);
    if (!visible.length) {
      contextRoot.classList.add('is-hidden');
      return;
    }
    contextRoot.innerHTML = visible.map((item) => `<div class="context-item"><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong></div>`).join('');
    contextRoot.classList.remove('is-hidden');
  }

  function makeText(field) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<label class="label" for="field-${esc(field.id)}">${esc(field.label)}</label>${field.help ? `<p class="help">${esc(field.help)}</p>` : ''}<textarea id="field-${esc(field.id)}" maxlength="500" placeholder="${esc(field.placeholder || '')}"></textarea>`;
    const input = card.querySelector('textarea');
    input.addEventListener('input', () => { answers[field.id] = input.value.trim(); validate(); });
    controls.set(field.id, { type: field.type, input });
    return card;
  }

  function makeChoice(field) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<span class="label">${esc(field.label)}</span>${field.help ? `<p class="help">${esc(field.help)}</p>` : ''}<div class="signal-grid" role="group" aria-label="${esc(field.label)}"></div>`;
    const root = card.querySelector('.signal-grid');
    const buttons = field.options.map((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'signal-btn';
      button.textContent = option;
      button.dataset.value = option;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        answers[field.id] = option;
        buttons.forEach((b) => { const active = b === button; b.classList.toggle('is-active', active); b.setAttribute('aria-pressed', active ? 'true' : 'false'); });
        validate();
      });
      root.appendChild(button);
      return button;
    });
    controls.set(field.id, { type: field.type, buttons });
    return card;
  }

  function makeScale(field) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<span class="label">${esc(field.label)}</span>${field.help ? `<p class="help">${esc(field.help)}</p>` : ''}<div class="scale-row"></div><div class="scale-caption"><span>0 · ${esc(field.min || '')}</span><span>4 · ${esc(field.max || '')}</span></div>`;
    const root = card.querySelector('.scale-row');
    const buttons = [0,1,2,3,4].map((value) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'scale-btn';
      button.textContent = String(value);
      button.dataset.value = String(value);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        answers[field.id] = value;
        buttons.forEach((b) => { const active = b === button; b.classList.toggle('is-active', active); b.setAttribute('aria-pressed', active ? 'true' : 'false'); });
        validate();
      });
      root.appendChild(button);
      return button;
    });
    controls.set(field.id, { type: field.type, buttons });
    return card;
  }

  function renderFields() {
    fieldsRoot.innerHTML = '';
    config.fields.forEach((field) => {
      const card = field.type === 'choice' ? makeChoice(field) : field.type === 'scale' ? makeScale(field) : makeText(field);
      fieldsRoot.appendChild(card);
    });
  }

  function setControlValue(field, value) {
    if (value === undefined || value === null) return;
    answers[field.id] = value;
    const control = controls.get(field.id);
    if (!control) return;
    if (field.type === 'text') control.input.value = value;
    else control.buttons.forEach((button) => {
      const active = field.type === 'scale' ? Number(button.dataset.value) === Number(value) : button.dataset.value === value;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function validate() {
    const ok = config.fields.every((field) => {
      const value = answers[field.id];
      return field.type === 'scale' ? Number.isFinite(Number(value)) : String(value ?? '').trim().length > 0;
    });
    saveButton.disabled = !ok;
    return ok;
  }

  function summaryHtml(saved) {
    return config.fields.map((field) => {
      const value = saved.answers?.[field.id];
      const shown = field.type === 'scale' ? `${value} / 4` : value;
      return `<div class="summary-row"><span>${esc(field.label)}</span><strong>${esc(shown)}</strong></div>`;
    }).join('');
  }

  function renderDone(saved) {
    formScreen.classList.add('is-hidden');
    doneScreen.classList.remove('is-hidden');
    summaryRoot.innerHTML = summaryHtml(saved);
    const sync = saved.sync?.status || 'pending';
    syncStatus.textContent = sync === 'synced' ? 'Human Graphへ保存済み' : sync === 'syncing' ? 'Human Graphへ同期中…' : sync === 'failed' ? '端末には保存済み。通信回復後に再同期します。' : '端末に保存済み。同期を準備中…';
    syncStatus.dataset.status = sync;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function syncDay(dayKey, allowFreshContact = true) {
    const state = readState();
    const saved = state.days?.[dayKey];
    if (!saved || saved.sync?.status === 'synced') return true;

    saved.sync = { ...(saved.sync || {}), status: 'syncing', lastAttemptAt: new Date().toISOString() };
    writeState(state);
    if (Number(dayKey.replace('day', '')) === day) renderDone(saved);

    const token = localStorage.getItem(FLOW_TOKEN_KEY);
    try {
      const targetDay = Number(dayKey.replace('day', ''));
      const targetConfig = configFor(targetDay);
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'x-flow-token': token } : {}) },
        body: JSON.stringify({
          questExternalId: 'want-return',
          day: targetDay,
          eventType: 'complete',
          rawAnswer: saved.answers,
          capturedSignal: targetConfig.signalField ? saved.answers?.[targetConfig.signalField] : null,
          sourceChannel: 'web',
          sourceEventId: saved.clientEventId,
          idempotencyKey: saved.idempotencyKey,
          occurredAt: saved.completedAt,
          metadata: { route: saved.route, attribution: saved.attribution, installationId: getInstallationId(), revision: saved.revision }
        })
      });

      if (response.status === 401 && token && allowFreshContact) {
        localStorage.removeItem(FLOW_TOKEN_KEY);
        return syncDay(dayKey, false);
      }
      if (!response.ok) throw new Error(`sync_${response.status}`);

      const data = await response.json();
      if (data.flowToken) localStorage.setItem(FLOW_TOKEN_KEY, data.flowToken);
      const latest = readState();
      if (latest.days?.[dayKey]) {
        latest.days[dayKey].sync = { status: 'synced', eventId: data.event?.id || null, syncedAt: new Date().toISOString() };
        if (data.personId) latest.personId = data.personId;
        writeState(latest);
        if (Number(dayKey.replace('day', '')) === day) renderDone(latest.days[dayKey]);
      }
      return true;
    } catch (error) {
      const latest = readState();
      if (latest.days?.[dayKey]) {
        latest.days[dayKey].sync = { ...(latest.days[dayKey].sync || {}), status: 'failed', error: String(error?.message || error), lastAttemptAt: new Date().toISOString() };
        writeState(latest);
        if (Number(dayKey.replace('day', '')) === day) renderDone(latest.days[dayKey]);
      }
      return false;
    }
  }

  async function syncPending() {
    const state = readState();
    const keys = Object.keys(state.days || {}).filter((key) => state.days[key]?.sync?.status !== 'synced').sort((a,b) => Number(a.replace('day','')) - Number(b.replace('day','')));
    for (const key of keys) await syncDay(key);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validate()) return;

    const state = readState();
    const dayKey = `day${day}`;
    const previous = state.days?.[dayKey];
    const revision = Number(previous?.revision || 0) + 1;
    const completedAt = new Date().toISOString();
    const clientEventId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const saved = {
      answers: { ...answers },
      completedAt,
      route: location.pathname,
      attribution: params(),
      revision,
      clientEventId,
      idempotencyKey: `${getInstallationId()}:want-return:d${day}:r${revision}`,
      sync: { status: 'pending' }
    };

    const next = {
      ...state,
      version: 1,
      series: 'want-return',
      currentDay: Math.min(7, Math.max(Number(state.currentDay || 1), day + (day < 7 ? 1 : 0))),
      lastCompletedDay: Math.max(Number(state.lastCompletedDay || 0), day),
      days: { ...(state.days || {}), [dayKey]: saved }
    };
    writeState(next);
    renderDone(saved);
    syncDay(dayKey);
  });

  editButton.addEventListener('click', () => {
    doneScreen.classList.add('is-hidden');
    formScreen.classList.remove('is-hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  nextButton.addEventListener('click', () => {
    if (day < 7) location.href = carryQuery(`../${day + 1}/`);
    else {
      const state = readState();
      const completed = Object.keys(state.days || {}).filter((key) => state.days[key]?.completedAt).length;
      alert(`WANT TO RETURN 7：${completed}/7 完了。\n\n続けることより、戻れること。`);
    }
  });

  restartButton.addEventListener('click', () => {
    const state = readState();
    if (state.days) delete state.days[`day${day}`];
    const completeDays = Object.keys(state.days || {}).map((key) => Number(key.replace('day',''))).filter((n) => state.days[`day${n}`]?.completedAt);
    state.lastCompletedDay = completeDays.length ? Math.max(...completeDays) : 0;
    state.currentDay = Math.min(7, Math.max(1, state.lastCompletedDay + 1));
    writeState(state);
    Object.keys(answers).forEach((key) => delete answers[key]);
    controls.clear();
    renderFields();
    validate();
    doneScreen.classList.add('is-hidden');
    formScreen.classList.remove('is-hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  renderHeader();
  renderContext();
  renderFields();

  const existing = readState()?.days?.[`day${day}`];
  if (existing) {
    config.fields.forEach((field) => setControlValue(field, existing.answers?.[field.id] ?? existing[field.id]));
    validate();
    renderDone(existing);
  } else {
    validate();
  }

  window.addEventListener('online', syncPending);
  syncPending();
})();

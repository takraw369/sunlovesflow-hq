(() => {
  'use strict';

  const config = window.ACE_CONFIG || {};
  const state = {
    answers: {},
    scores: null,
    resultAxis: null,
    lineUserId: null,
    displayName: null,
    timer: { remaining: 30, interval: null, completed: false, skipped: false },
  };

  const AXIS_ORDER = ['BODY', 'COGNITION', 'EMOTION', 'ACTION'];

  const axisCopy = {
    BODY: {
      title: 'BODY｜身体の条件',
      description: '今は「考え方を変える」より先に、身体の条件を1つ調える余地がありそうです。身体は答えではなく、出力条件の一部として観察します。',
      action: '「長く吐く／水を飲む／立つ／足裏を感じる／光を浴びる」から1つだけ試し、前後の差を観察する。',
    },
    COGNITION: {
      title: 'COGNITION｜認知の焦点',
      description: '今は情報や解釈が重なり、次に見る1点がぼやけている可能性があります。まず事実と解釈を分けます。',
      action: '今日の出来事を「事実」と「自分の解釈」の2行に分け、次に見る対象を1つ決める。',
    },
    EMOTION: {
      title: 'EMOTION｜戻る手順',
      description: '感情を消すことより、乱れた後に戻る手順を持つことが先になりそうです。反応を責めず、Resetを探します。',
      action: '1回だけ「Trigger → Reaction → Reset → Reselect」を記録する。',
    },
    ACTION: {
      title: 'ACTION｜実行条件',
      description: '考える材料はあっても、次の具体的な実行単位が大きい・曖昧な可能性があります。行動を小さくします。',
      action: '今週のKPIを1つ決め、それを支える「実行できる行動」を3つだけ書く。',
    },
  };

  const bodyQuestions = [
    ['body_sleep', '睡眠・回復', '起きたとき、活動に使える回復感がある'],
    ['body_breath', '呼吸', '急いだり力みすぎたりせず、呼吸を戻しやすい'],
    ['body_jaw', '顎・顔の力み', '必要以上に噛みしめたり顔へ力が入り続けたりしていない'],
    ['body_shoulders', '肩・上半身', '肩や上半身の余計な力を抜きやすい'],
    ['body_soles', '足裏・接地感', '立ったときに足裏の接地を感じやすい'],
    ['body_hunger', '空腹・エネルギー', '空腹や食後の状態に大きく振り回されず活動できる'],
    ['body_fatigue', '疲労', '疲れが強く残りすぎず、必要な出力を出せる'],
    ['body_openness', '身体の開き・温かさ', '縮こまりすぎず、身体が動きやすい・温まりやすい感覚がある'],
  ];

  const mindQuestions = [
    ['cognition_focus', 'COGNITION', '注意を戻す', '気が散ったあと、必要な対象へ注意を戻しやすい'],
    ['cognition_fact', 'COGNITION', '事実と解釈を分ける', '起きた事実と、自分がつけた意味を分けて見られる'],
    ['cognition_next', 'COGNITION', '次に見る1点', '情報が多いときでも、次に確認する1点を決められる'],
    ['emotion_notice', 'EMOTION', '反応に気づく', '乱れたとき、身体・思考・行動の反応に気づける'],
    ['emotion_reset', 'EMOTION', 'Resetを持つ', '呼吸・姿勢・言葉など、自分が戻りやすい手段を持っている'],
    ['emotion_reselect', 'EMOTION', '選び直す', '反応したあとでも、次の行動を選び直せる'],
    ['action_kpi', 'ACTION', '勝利条件を絞る', '今の自分が何を伸ばせば前進なのか、1つに絞れる'],
    ['action_experiment', 'ACTION', '小さく試す', '正解を待つより、小さく試して結果を観察できる'],
    ['action_repeat', 'ACTION', '修正して再実行', 'うまくいかなかったとき、1点を修正してもう一度試せる'],
  ];

  const screenMap = {
    intro: document.getElementById('screen-intro'),
    body: document.getElementById('screen-body'),
    balance: document.getElementById('screen-balance'),
    mind: document.getElementById('screen-mind'),
    result: document.getElementById('screen-result'),
    done: document.getElementById('screen-done'),
  };

  const bodyRoot = document.getElementById('bodyQuestions');
  const mindRoot = document.getElementById('mindQuestions');
  const balanceRoot = document.getElementById('balanceRating');
  const armRoot = document.getElementById('armRating');
  const template = document.getElementById('scaleQuestionTemplate');

  function createScaleQuestion({ name, label, help = '', axis = '' }) {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.name = name;
    if (axis) node.dataset.axis = axis;
    node.querySelector('legend').textContent = label;
    const helpEl = node.querySelector('.question-help');
    helpEl.textContent = help;
    if (!help) helpEl.remove();

    const scale = node.querySelector('.scale');
    for (let value = 0; value <= 4; value += 1) {
      const choice = document.createElement('label');
      choice.innerHTML = `<input type="radio" name="${name}" value="${value}" aria-label="${label} ${value}"><span>${value}</span>`;
      choice.querySelector('input').addEventListener('change', (event) => {
        state.answers[name] = Number(event.target.value);
      });
      scale.appendChild(choice);
    }
    return node;
  }

  function renderQuestions() {
    bodyQuestions.forEach(([name, label, help]) => {
      bodyRoot.appendChild(createScaleQuestion({ name, label, help, axis: 'BODY' }));
    });

    balanceRoot.appendChild(createScaleQuestion({
      name: 'body_balance',
      label: '今の片足立ちの安定感',
      help: '他人と比べず、今日の自分の感覚だけで答えてください。',
      axis: 'BODY',
    }));

    armRoot.appendChild(createScaleQuestion({
      name: 'body_arm_symmetry',
      label: '左右差が少なく、無理なく腕を伸ばせる感覚',
      help: '0=差や力みを強く感じる / 4=差が小さく自然に伸ばせる',
      axis: 'BODY',
    }));

    mindQuestions.forEach(([name, axis, label, help]) => {
      mindRoot.appendChild(createScaleQuestion({ name, label: `${axis}｜${label}`, help, axis }));
    });
  }

  function getCurrentStep(screen) {
    return Number(screen.dataset.step || 0);
  }

  function showScreen(key) {
    const target = screenMap[key];
    if (!target) return;
    Object.values(screenMap).forEach((screen) => screen.classList.toggle('is-active', screen === target));
    const step = getCurrentStep(target);
    const max = 5;
    document.getElementById('progressText').textContent = `${step} / ${max}`;
    document.getElementById('progressBar').style.width = `${Math.min(100, (step / max) * 100)}%`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function missing(names) {
    return names.filter((name) => typeof state.answers[name] !== 'number');
  }

  function validateBefore(nextKey) {
    if (nextKey === 'balance') {
      const required = bodyQuestions.map(([name]) => name);
      if (missing(required).length) return 'BODYの8項目をすべて選んでください。';
    }
    if (nextKey === 'mind') {
      if (!state.timer.skipped && typeof state.answers.body_balance !== 'number') {
        return '片足立ちの安定感を選ぶか、安全のためスキップしてください。';
      }
      if (typeof state.answers.body_arm_symmetry !== 'number') return '腕の左右差について選んでください。';
    }
    if (nextKey === 'result') {
      const required = mindQuestions.map(([name]) => name);
      if (missing(required).length) return '認知・感情・行動の項目をすべて選んでください。';
    }
    return null;
  }

  function average(keys) {
    const values = keys
      .map((key) => state.answers[key])
      .filter((value) => typeof value === 'number' && Number.isFinite(value));
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function calculateResult() {
    const bodyKeys = [...bodyQuestions.map(([name]) => name), 'body_balance', 'body_arm_symmetry'];
    const scores = {
      BODY: round2(average(bodyKeys)),
      COGNITION: round2(average(mindQuestions.filter(([, axis]) => axis === 'COGNITION').map(([name]) => name))),
      EMOTION: round2(average(mindQuestions.filter(([, axis]) => axis === 'EMOTION').map(([name]) => name))),
      ACTION: round2(average(mindQuestions.filter(([, axis]) => axis === 'ACTION').map(([name]) => name))),
    };

    // AXIS_ORDER is intentionally the tie-breaker: BODY → COGNITION → EMOTION → ACTION.
    const resultAxis = AXIS_ORDER.reduce((lowest, axis) => scores[axis] < scores[lowest] ? axis : lowest, AXIS_ORDER[0]);
    state.scores = scores;
    state.resultAxis = resultAxis;
    return { scores, resultAxis };
  }

  function renderResult() {
    const { scores, resultAxis } = calculateResult();
    const copy = axisCopy[resultAxis];

    document.getElementById('resultCard').innerHTML = `
      <span class="result-badge">FIRST CALIBRATION · ${resultAxis}</span>
      <h3>${copy.title}</h3>
      <p>${copy.description}</p>
    `;

    document.getElementById('scoreGrid').innerHTML = AXIS_ORDER.map((axis) => `
      <div class="score-item ${axis === resultAxis ? 'is-lowest' : ''}">
        <span>${axis}</span>
        <strong>${scores[axis].toFixed(2)}</strong>
      </div>
    `).join('');

    document.getElementById('nextAction').textContent = copy.action;
  }

  function startTimer() {
    if (state.timer.interval) return;
    state.timer.remaining = 30;
    state.timer.completed = false;
    state.timer.skipped = false;
    const value = document.getElementById('timerValue');
    const status = document.getElementById('timerStatus');
    const button = document.getElementById('timerButton');
    const skip = document.getElementById('skipBalance');

    button.disabled = true;
    skip.disabled = true;
    status.textContent = '安全を優先。無理ならすぐ両足をついてください。';
    value.textContent = '30';

    state.timer.interval = window.setInterval(() => {
      state.timer.remaining -= 1;
      value.textContent = String(Math.max(0, state.timer.remaining));
      if (state.timer.remaining <= 0) {
        window.clearInterval(state.timer.interval);
        state.timer.interval = null;
        state.timer.completed = true;
        status.textContent = '完了。今の安定感を記録してください。';
        button.textContent = 'もう一度測る';
        button.disabled = false;
        skip.disabled = false;
        balanceRoot.classList.remove('is-hidden');
      }
    }, 1000);
  }

  function skipBalance() {
    if (state.timer.interval) return;
    state.timer.skipped = true;
    delete state.answers.body_balance;
    balanceRoot.classList.add('is-hidden');
    document.getElementById('timerStatus').textContent = '片足立ちは評価から除外しました。安全優先でOKです。';
    document.getElementById('timerButton').textContent = 'やはり30秒測る';
  }

  async function initLiff() {
    const status = document.getElementById('syncStatus');
    if (!config.liffId || !window.liff) {
      status.textContent = '通常ブラウザ版として利用中。結果はこの画面で確認できます。';
      return;
    }

    try {
      await window.liff.init({ liffId: config.liffId });
      if (window.liff.isLoggedIn()) {
        const profile = await window.liff.getProfile();
        state.lineUserId = profile.userId || null;
        state.displayName = profile.displayName || null;
        status.textContent = state.displayName
          ? `${state.displayName}さんのLINEと連携できます。結果を保存します。`
          : 'LINEと連携できます。結果を保存します。';
      } else {
        status.textContent = '通常ブラウザ版として利用中。LINE内から開くと結果をLINEへ連携できます。';
      }
    } catch (error) {
      console.warn('LIFF init failed', error);
      status.textContent = 'LINE連携を確認できませんでした。診断自体はそのまま利用できます。';
      status.classList.add('is-error');
    }
  }

  function buildSubmissionData() {
    return {
      ...state.answers,
      score_body: state.scores.BODY,
      score_cognition: state.scores.COGNITION,
      score_emotion: state.scores.EMOTION,
      score_action: state.scores.ACTION,
      result_axis: state.resultAxis,
      assessment_version: 'ace-calibration-v1',
      balance_skipped: state.timer.skipped,
      assessed_at: new Date().toISOString(),
    };
  }

  async function syncResultToHarness() {
    const status = document.getElementById('syncStatus');
    if (!state.resultAxis) return;
    if (!state.lineUserId) {
      status.textContent = '結果は表示済みです。LINE内から診断すると、回答保存・個別フォローまで自動連携できます。';
      return;
    }

    const formId = config.formIds?.[state.resultAxis];
    if (!config.harnessBaseUrl || !formId) {
      status.textContent = 'LINE本人確認は完了。自動フォロー設定の初期化待ちです。';
      return;
    }

    try {
      status.textContent = 'LINEへ結果を保存しています...';
      const response = await fetch(`${config.harnessBaseUrl}/api/forms/${encodeURIComponent(formId)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineUserId: state.lineUserId,
          data: buildSubmissionData(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) throw new Error(payload.error || `HTTP ${response.status}`);
      status.classList.remove('is-error');
      status.textContent = '結果をLINEに保存しました。ここからあなたの結果に合わせたフォローが始まります。';
    } catch (error) {
      console.error('Harness sync failed', error);
      status.classList.add('is-error');
      status.textContent = '結果表示は完了していますが、LINEへの保存に失敗しました。時間を置いてもう一度診断するか「相談」と送ってください。';
    }
  }

  async function sendConsultMessage() {
    const button = document.getElementById('consultButton');
    button.disabled = true;
    try {
      if (window.liff?.isInClient?.() && window.liff.isInClient()) {
        await window.liff.sendMessages([{ type: 'text', text: '相談' }]);
        showScreen('done');
        return;
      }

      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText('相談');
      button.textContent = '「相談」をコピーしました';
      const status = document.getElementById('syncStatus');
      status.textContent = 'LINEに戻って「相談」と送ってください。';
    } catch (error) {
      console.warn('Could not send/copy consult message', error);
      document.getElementById('syncStatus').textContent = 'LINEに戻って「相談」と送ってください。';
    } finally {
      button.disabled = false;
    }
  }

  function resetAssessment() {
    if (state.timer.interval) window.clearInterval(state.timer.interval);
    state.answers = {};
    state.scores = null;
    state.resultAxis = null;
    state.timer = { remaining: 30, interval: null, completed: false, skipped: false };
    document.querySelectorAll('input[type="radio"]').forEach((input) => { input.checked = false; });
    document.getElementById('timerValue').textContent = '30';
    document.getElementById('timerStatus').textContent = '準備できたらスタート';
    document.getElementById('timerButton').textContent = '30秒スタート';
    balanceRoot.classList.add('is-hidden');
    showScreen('intro');
  }

  function wireNavigation() {
    document.querySelectorAll('[data-next]').forEach((button) => {
      button.addEventListener('click', async () => {
        const next = button.dataset.next;
        const error = validateBefore(next);
        if (error) {
          window.alert(error);
          return;
        }
        if (next === 'result') {
          renderResult();
          showScreen('result');
          await syncResultToHarness();
          return;
        }
        showScreen(next);
      });
    });

    document.getElementById('timerButton').addEventListener('click', startTimer);
    document.getElementById('skipBalance').addEventListener('click', skipBalance);
    document.getElementById('consultButton').addEventListener('click', sendConsultMessage);
    document.getElementById('restartButton').addEventListener('click', resetAssessment);
  }

  renderQuestions();
  wireNavigation();
  initLiff();
  showScreen('intro');
})();

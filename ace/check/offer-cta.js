(() => {
  'use strict';

  const button = document.getElementById('offerButton');
  if (!button) return;

  const keyword = '勝ち筋';

  button.addEventListener('click', async () => {
    button.disabled = true;
    const original = button.textContent;

    try {
      if (window.liff?.isInClient?.() && window.liff.isInClient()) {
        await window.liff.sendMessages([{ type: 'text', text: keyword }]);
        button.textContent = 'LINEに「勝ち筋」を送りました';
        const status = document.getElementById('syncStatus');
        if (status) status.textContent = 'LINEに戻ると、勝ち筋OS｜90分パフォーマンス実装セッションの案内が届きます。';
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(keyword);
        button.textContent = '「勝ち筋」をコピーしました';
      }
      const status = document.getElementById('syncStatus');
      if (status) status.textContent = 'LINEに戻って「勝ち筋」と送ってください。';
    } catch (error) {
      console.warn('Could not send/copy offer keyword', error);
      const status = document.getElementById('syncStatus');
      if (status) status.textContent = 'LINEに戻って「勝ち筋」と送ってください。';
      button.textContent = original;
    } finally {
      button.disabled = false;
    }
  });
})();

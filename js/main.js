document.addEventListener('DOMContentLoaded', () => {
    // アニメーションさせたい要素を選択
    const reveals = document.querySelectorAll('.card, .method-item, .profile-content');

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const revealPoint = 150;

        reveals.forEach(reveal => {
            const revealTop = reveal.getBoundingClientRect().top;
            if (revealTop < windowHeight - revealPoint) {
                reveal.classList.add('active');
            }
        });
    };

    // クラスを初期状態で設定（ revealed 用の共通クラスを後でHTMLに追加する場合も考慮）
    reveals.forEach(el => el.classList.add('reveal'));

    // 初期化時にも実行
    revealOnScroll();

    window.addEventListener('scroll', revealOnScroll);
});

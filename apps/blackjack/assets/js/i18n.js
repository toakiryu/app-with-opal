// Simple i18n module with JA/EN toggle
(function () {
  "use strict";

  const STORAGE_KEY = "lang";
  const DEFAULT_LANG = "ja";

  const dict = {
    en: {
      "btn.deal": "Deal",
      "btn.clear": "Clear",
      "btn.hit": "Hit",
      "btn.stand": "Stand",
      "btn.double": "Double",
      "btn.split": "Split",
      "btn.newHand": "New Hand",
      "label.balance": "Balance:",
      "label.bet": "Bet:",
      "label.language": "Language",
      "score.dealer": "Dealer: {score}",
      "score.player": "Player: {score}",
      "score.hand12": "Hand 1: {score1} / Hand 2: {score2}",
      "msg.placeYourBet": "Place Your Bet",
      "msg.yourTurn": "Your Turn",
      "msg.secondHandTurn": "Second Hand's Turn",
      "msg.dealerTurn": "Dealer's Turn",
      "msg.shuffling": "Shuffling new deck...",
      "msg.blackjackWin": "Blackjack! You win!",
      "msg.push": "Push!",
      "msg.youWin": "You win!",
      "msg.dealerWins": "Dealer wins.",
      "msg.pushShort": "Push.",
      "msg.handBusts": "Hand {hand} Busts!",
      "msg.handResult.bust": "Hand {hand}: Bust! You lose.",
      "msg.handResult.win": "Hand {hand}: You win!",
      "msg.handResult.dealerWins": "Hand {hand}: Dealer wins.",
      "msg.handResult.push": "Hand {hand}: Push.",
      "chip.5": "$5",
      "chip.10": "$10",
      "chip.25": "$25",
      "chip.100": "$100",
      "footer.about.title": "About This App",
      "footer.about.desc":
        "A stylish Blackjack web app created for practicing casino game rules and strategies. Developed for a school cultural festival casino experience.",
      "footer.ai.title": "AI-Powered Development",
      "footer.ai.desc":
        "This project was primarily developed by AI. Opal designed the game structure, initial design, and created the foundation. GitHub Copilot enhanced, refined, and extended the functionality.",
      "footer.quickLinks.title": "Quick Links",
      "footer.quickLinks.github": "GitHub Repository",
      "footer.quickLinks.opal": "Opal Project",
      "footer.quickLinks.demo": "Demo Site",
      "footer.copyright": "© 2025 Toa Kiryu. All rights reserved.",
      "footer.madeWith": "Made with Opal",
    },
    ja: {
      "btn.deal": "ディール",
      "btn.clear": "クリア",
      "btn.hit": "ヒット",
      "btn.stand": "スタンド",
      "btn.double": "ダブル",
      "btn.split": "スプリット",
      "btn.newHand": "新しいラウンド",
      "label.balance": "残高:",
      "label.bet": "ベット:",
      "label.language": "言語",
      "score.dealer": "ディーラー: {score}",
      "score.player": "プレイヤー: {score}",
      "score.hand12": "ハンド1: {score1} / ハンド2: {score2}",
      "msg.placeYourBet": "ベットを置いてください",
      "msg.yourTurn": "あなたのターン",
      "msg.secondHandTurn": "2つ目のハンドのターン",
      "msg.dealerTurn": "ディーラーのターン",
      "msg.shuffling": "新しいデッキをシャッフル中...",
      "msg.blackjackWin": "ブラックジャック！あなたの勝ち！",
      "msg.push": "プッシュ！",
      "msg.youWin": "あなたの勝ち！",
      "msg.dealerWins": "ディーラーの勝ち。",
      "msg.pushShort": "プッシュ。",
      "msg.handBusts": "ハンド{hand}がバースト！",
      "msg.handResult.bust": "ハンド{hand}: バースト！負け。",
      "msg.handResult.win": "ハンド{hand}: 勝ち！",
      "msg.handResult.dealerWins": "ハンド{hand}: ディーラーの勝ち。",
      "msg.handResult.push": "ハンド{hand}: プッシュ。",
      "chip.5": "$5",
      "chip.10": "$10",
      "chip.25": "$25",
      "chip.100": "$100",
      "footer.about.title": "このアプリについて",
      "footer.about.desc":
        "学校の文化祭でクラスがカジノをテーマにした際、ブラックジャックのルールや戦略をスマートフォンから手軽に練習できるように開発したWebアプリです。",
      "footer.ai.title": "AI主導の開発",
      "footer.ai.desc":
        "このプロジェクトは主にAIによって開発されました。Opalがゲーム設計、初期デザイン、基盤作成を担当し、GitHub Copilotが機能の強化、洗練、拡張を行いました。",
      "footer.quickLinks.title": "クイックリンク",
      "footer.quickLinks.github": "GitHubリポジトリ",
      "footer.quickLinks.opal": "Opalプロジェクト",
      "footer.quickLinks.demo": "デモサイト",
      "footer.copyright": "© 2025 桐生トア. All rights reserved.",
      "footer.madeWith": "Made with Opal",
    },
  };

  let current = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;

  function interpolate(str, params) {
    if (!params) return str;
    return str.replace(/\{(.*?)\}/g, (_, k) =>
      k in params ? String(params[k]) : ""
    );
  }

  function t(key, params) {
    const table = dict[current] || {};
    const val = table[key] || key;
    return interpolate(val, params);
  }

  function setLang(lang) {
    if (!dict[lang]) return;
    current = lang;
    localStorage.setItem(STORAGE_KEY, current);
    applyStaticLabels();
    // Notify listeners (e.g., game.js) to refresh dynamic texts
    window.dispatchEvent(
      new CustomEvent("langchange", { detail: { lang: current } })
    );
  }

  function getLang() {
    return current;
  }

  // Apply translations to elements that have data-i18n="key"
  function applyStaticLabels() {
    const nodes = document.querySelectorAll("[data-i18n]");
    nodes.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      el.textContent = t(key);
    });
  }

  function init() {
    applyStaticLabels();
  }

  window.i18n = { init, setLang, getLang, t, applyStaticLabels };
})();

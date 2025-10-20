// Simple i18n module with JA/EN toggle
(function () {
  "use strict";

  const STORAGE_KEY = "lang";
  const DEFAULT_LANG = "ja";

  const dict = {
    en: {
      // Contextual hints
      "hint.bet.select": "Select a bet amount to start. Press Deal to begin.",
      "hint.bet.ready":
        "Ready! Press Deal to start. Bet cannot be changed during the game.",
      "hint.player.stand": "Your total is high. Standing is usually safe.",
      "hint.player.stand.expert": "Stand recommended.",
      "hint.player.double":
        "Good chance for double down (only after initial deal).",
      "hint.player.double.expert": "Double opportunity.",
      "hint.player.bust": "Warning: High risk of busting with next card.",
      "hint.player.bust.expert": "Hitting is risky.",
      "hint.player.dealerStrong":
        "Dealer's upcard is strong. Choose carefully.",
      "hint.player.dealerStrong.expert": "Dealer strong. Be cautious.",
      "hint.player.dealerWeak":
        "Dealer's upcard is weak. Standing is an option.",
      "hint.player.dealerWeak.expert": "Dealer weak. Consider standing.",
      "hint.player.hit": "Hit to get closer to 21.",
      "hint.player.hit.expert": "Hit is good.",
      "hint.dealer.wait": "Dealer's upcard is {up}. Waiting for result...",
      "hint.handOver": "Result shown. Press New Hand for next round.",
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
      "footer.madeWith": "Made with",

      // Tooltips
      "tooltip.chip.5": "Add $5 to your bet",
      "tooltip.chip.10": "Add $10 to your bet",
      "tooltip.chip.25": "Add $25 to your bet",
      "tooltip.chip.100": "Add $100 to your bet",
      "tooltip.deal": "Start the game",
      "tooltip.clear": "Clear current bet",
      "tooltip.hit": "Draw one card",
      "tooltip.stand": "Stand with your current hand",
      "tooltip.double":
        "Double your bet and draw one card (only after the first deal)",
      "tooltip.split":
        "Split a pair into two hands (only after the first deal)",
      "tooltip.newHand": "Start the next round",

      // Disabled reasons
      "disabledReason.hit":
        "You cannot draw more because your total is 21 or more",
      "disabledReason.double": "Available only on the initial two cards",
      "disabledReason.split": "You need a pair of the same rank",
      "disabledReason.deal": "Please place your bet",

      // Help modal
      "help.title": "Help Center",
      "help.btn.startTutorial": "Start Tutorial Again",
      "help.sections.rules.title": "1. Basic Rules",
      "help.sections.rules.desc":
        "The goal is to get as close to 21 as possible without going over. Face cards (J, Q, K) are worth 10 points, Aces can be 1 or 11, and number cards are worth their face value. If you exceed 21, you bust and lose immediately. The dealer must draw cards until reaching 17 or more (H17 rule: dealer hits on Soft 17 - a hand with an Ace counted as 11).",
      "help.sections.actions.title": "2. Available Actions",
      "help.sections.actions.item.hit": "Hit: Draw one additional card to your hand. You can hit multiple times until you stand or bust.",
      "help.sections.actions.item.stand": "Stand: Keep your current hand and end your turn. The dealer will then play their hand.",
      "help.sections.actions.item.double":
        "Double Down: Double your bet and receive exactly one more card. Only available on your first two cards and if you have sufficient balance.",
      "help.sections.actions.item.split": "Split: When you have two cards of the same rank, you can split them into two separate hands. Each hand requires an equal bet. Only available with sufficient balance.",
      "help.sections.judgement.title": "3. Winning Conditions",
      "help.sections.judgement.desc":
        "You win if your hand total is higher than the dealer's without exceeding 21, or if the dealer busts. Blackjack (Ace + 10-value card) pays 1.5x your bet. A tie (push) returns your original bet. If the dealer's total is higher or you bust, you lose your bet.",
      "help.sections.faq.title": "4. Frequently Asked Questions",
      "help.sections.faq.desc":
        "Q: Why can't I press Deal? A: You need to place a bet first by clicking chips. Q: Why can't I Double or Split? A: These actions are only available on your initial two cards and require sufficient balance. Q: What is Soft 17? A: It's a hand totaling 17 with an Ace counted as 11 (e.g., A+6). The dealer must hit on Soft 17.",
      "help.sections.glossary.title": "5. Glossary",
      "help.sections.glossary.desc":
        "• Blackjack/Natural: Ace + 10-value card (pays 1.5x). • Bust: Hand exceeds 21 (automatic loss). • Push: Tie with dealer (bet returned). • Soft Hand: Hand with Ace as 11 (e.g., Soft 17 = A+6). • Hard Hand: Hand without Ace as 11, or Ace forced to 1. • H17 Rule: Dealer hits on Soft 17.",

      // Settings
      "help.settings.title": "Guide Settings",
      "help.settings.showTooltips": "Show tooltips",
      "help.settings.showContextHelp": "Show contextual hints",
      "help.settings.hintLevel": "Hint level",
      "help.settings.hintLevel.beginner": "Beginner",
      "help.settings.hintLevel.intermediate": "Intermediate",
      "help.settings.hintLevel.expert": "Expert",

      // Tutorial steps
      "tutorial.step1.title": "Welcome to Blackjack",
      "tutorial.step1.desc":
        "Let's learn the layout: dealer area, player area, betting area, action buttons, and balance.",
      "tutorial.step2.title": "Placing a Bet",
      "tutorial.step2.desc":
        "Choose your bet by clicking chips, then start with Deal.",
      "tutorial.step3.title": "Dealing Cards",
      "tutorial.step3.desc":
        "Cards are dealt to the player and dealer. Aim for 21.",
      "tutorial.step4.title": "Available Actions",
      "tutorial.step4.desc":
        "Choose Hit, Stand, Double, or Split depending on your hand.",
      "tutorial.step5.title": "Result",
      "tutorial.step5.desc": "Closer to 21 wins. Dealer draws to 17 or more.",
    },
    ja: {
      // Contextual hints
      "hint.bet.select":
        "適切なベット額を選びましょう。Dealでゲームを開始できます。",
      "hint.bet.ready":
        "準備OK。Dealでゲームを開始しましょう。ベットはゲーム中は変更できません。",
      "hint.player.stand": "合計が高いです。スタンドが無難かもしれません。",
      "hint.player.stand.expert": "スタンド推奨。",
      "hint.player.double":
        "ダブルダウンの好機かもしれません（開始直後のみ）。",
      "hint.player.double.expert": "ダブル好機。",
      "hint.player.bust": "注意：次のカードで21を超える可能性が高いです。",
      "hint.player.bust.expert": "ヒットは危険。",
      "hint.player.dealerStrong":
        "ディーラーの表札が強いです。慎重に選択しましょう。",
      "hint.player.dealerStrong.expert": "ディーラー強。慎重に。",
      "hint.player.dealerWeak":
        "ディーラーは弱いカードです。スタンドも選択肢です。",
      "hint.player.dealerWeak.expert": "ディーラー弱。スタンド検討。",
      "hint.player.hit": "ヒットでさらに近づけましょう。",
      "hint.player.hit.expert": "ヒット良し。",
      "hint.dealer.wait":
        "ディーラーの見えているカードは {up} です。結果を待ちましょう。",
      "hint.handOver": "結果が表示されました。New Handで次のラウンドへ。",
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
      "footer.madeWith": "Opalで作成",

      // Tooltips
      "tooltip.chip.5": "ベット額を$5追加します",
      "tooltip.chip.10": "ベット額を$10追加します",
      "tooltip.chip.25": "ベット額を$25追加します",
      "tooltip.chip.100": "ベット額を$100追加します",
      "tooltip.deal": "ゲームを開始します",
      "tooltip.clear": "現在のベットをクリアします",
      "tooltip.hit": "カードを1枚引きます",
      "tooltip.stand": "現在の手札で勝負します",
      "tooltip.double": "ベットを2倍にし、1枚だけ引きます（開始直後のみ）",
      "tooltip.split": "同一ランク2枚の手札を2つに分けます（開始直後のみ）",
      "tooltip.newHand": "次のラウンドを開始します",

      // Disabled reasons
      "disabledReason.hit": "21を超えているため、これ以上カードを引けません",
      "disabledReason.double": "最初の2枚のカードでのみ使用できます",
      "disabledReason.split": "同じ数字のカードが2枚必要です",
      "disabledReason.deal": "ベット額を選択してください",

      // Help modal
      "help.title": "ヘルプセンター",
      "help.btn.startTutorial": "チュートリアルをもう一度見る",
      "help.sections.rules.title": "1. 基本ルール",
      "help.sections.rules.desc":
        "目標は21に近づけることで、超えないようにします。絵札（J・Q・K）は10点、Aは1点または11点、数字カードは額面通りの点数です。21を超えるとバストして即座に負けです。ディーラーは17以上になるまで引く必要があります（H17ルール：ディーラーはソフト17でヒット。Aを11として数える手札のこと）。",
      "help.sections.actions.title": "2. 利用可能なアクション",
      "help.sections.actions.item.hit": "ヒット：手札に1枚追加します。スタンドまたはバストするまで複数回ヒットできます。",
      "help.sections.actions.item.stand": "スタンド：現在の手札を維持してターンを終了します。その後ディーラーが手札をプレイします。",
      "help.sections.actions.item.double":
        "ダブルダウン：ベットを倍にして、もう1枚だけカードを引きます。最初の2枚のときのみ可能で、残高が必要です。",
      "help.sections.actions.item.split":
        "スプリット：同じランクのカード2枚がある場合、2つの別々の手札に分けられます。各手札には同額のベットが必要です。残高が必要です。",
      "help.sections.judgement.title": "3. 勝利条件",
      "help.sections.judgement.desc":
        "21を超えずにディーラーより高い手札があれば勝ちです。またはディーラーがバストした場合も勝ちです。ブラックジャック（A + 10点カード）はベットの1.5倍を支払います。同点（プッシュ）は元のベットが戻ります。ディーラーの合計が高い場合やバストした場合、ベットを失います。",
      "help.sections.faq.title": "4. よくある質問",
      "help.sections.faq.desc":
        "Q: なぜディールを押せない？ A: まずチップをクリックしてベットする必要があります。Q: なぜダブルやスプリットができない？ A: これらは最初の2枚のときのみ可能で、十分な残高が必要です。Q: ソフト17とは？ A: Aを11として数えて合計17になる手札です（例：A+6）。ディーラーはソフト17でヒットしなければなりません。",
      "help.sections.glossary.title": "5. 用語集",
      "help.sections.glossary.desc":
        "• ブラックジャック/ナチュラル：A + 10点カード（1.5倍支払い）。• バスト：手札が21超え（自動的に負け）。• プッシュ：ディーラーと同点（ベット返却）。• ソフトハンド：Aを11として数える手札（例：ソフト17 = A+6）。• ハードハンド：Aを11として数えない手札、またはAが1になる手札。• H17ルール：ディーラーはソフト17でヒット。",

      // Settings
      "help.settings.title": "ガイド設定",
      "help.settings.showTooltips": "ツールチップを表示",
      "help.settings.showContextHelp": "コンテキストヒントを表示",
      "help.settings.hintLevel": "ヒントレベル",
      "help.settings.hintLevel.beginner": "ビギナー",
      "help.settings.hintLevel.intermediate": "中級",
      "help.settings.hintLevel.expert": "上級",

      // Tutorial steps
      "tutorial.step1.title": "ブラックジャックへようこそ",
      "tutorial.step1.desc":
        "画面の見方を説明します（ディーラー、プレイヤー、ベット、アクション、所持金）",
      "tutorial.step2.title": "ベットの説明",
      "tutorial.step2.desc":
        "チップをクリックしてベット額を選び、Dealで開始します。",
      "tutorial.step3.title": "カードの配布",
      "tutorial.step3.desc":
        "プレイヤーとディーラーにカードが配られます。21を目指しましょう。",
      "tutorial.step4.title": "選択できるアクション",
      "tutorial.step4.desc":
        "ヒット、スタンド、ダブル、スプリットから状況に応じて選びましょう。",
      "tutorial.step5.title": "勝敗判定",
      "tutorial.step5.desc":
        "21に近い方が勝ち。ディーラーは17以上まで引きます。",
    },
  };

  let current = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;

  function interpolate(str, params) {
    if (!params) return str;
    return str.replace(/\{(.*?)\}/g, (_, k) =>
      k in params ? String(params[k]) : "",
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
      new CustomEvent("langchange", { detail: { lang: current } }),
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
    applyTooltipLabels();
  }

  // Apply translations to elements that have data-i18n-tooltip="key"
  function applyTooltipLabels() {
    const nodes = document.querySelectorAll("[data-i18n-tooltip]");
    nodes.forEach((el) => {
      const key = el.getAttribute("data-i18n-tooltip");
      if (!key) return;
      el.setAttribute("data-tooltip", t(key));
    });
  }

  function init() {
    applyStaticLabels();
  }

  window.i18n = {
    init,
    setLang,
    getLang,
    t,
    applyStaticLabels,
    applyTooltipLabels,
  };
})();

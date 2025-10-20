// Guide & Tutorial & Tooltip Module
// - 常時ツールチップ: data-tooltip属性に基づく表示（ホバー/フォーカス/モバイルタップ）
// - 無効時の理由: aria-disabledやdisabledを監視し、適切なメッセージを表示
// - チュートリアルモード: 初回起動時のガイド（localStorageで状態管理）
// - ヘルプセンター: 浮動ボタンからモーダル表示
(function () {
  "use strict";

  const LS_KEYS = {
    tutorial: "blackjack_tutorial",
    hints: "blackjack_hints",
  };

  const DEFAULT_HINTS = {
    showTooltips: true,
    showContextHelp: true,
    hintLevel: "beginner",
  };

  const DEFAULT_TUTORIAL = {
    completed: false,
    dontShowAgain: false,
    currentStep: 0,
    lastShown: null,
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      // ignore
    }
  }

  // -----------------------------
  // Tooltip
  // -----------------------------
  let tooltipEl = null;
  let tooltipId = "guide-tooltip";
  let tooltipTarget = null;
  function openHelp() {
    if (window.ModalManager) {
      // i18n: ツールチップ文言も反映
      if (window.i18n) window.i18n.applyTooltipLabels();
      // 設定UIを反映
      applySettingsToUI();
      // ModalManagerが自動的にフォーカストラップを行うため、独自の処理は不要
      ModalManager.open("help-modal");
    }
  }

  function closeHelp() {
    if (window.ModalManager) {
      // ModalManagerが自動的にフォーカス復帰を行うため、独自の処理は不要
      ModalManager.close("help-modal");
    }
  }

  function showTooltip(target, text) {
    if (!hints || !hints.showTooltips) return;
    if (!text) return;

    // ツールチップ要素を作成または取得
    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.id = tooltipId;
      tooltipEl.className =
        "fixed z-[9999] bg-[#1a2332] text-[#f0d678] text-sm px-3 py-2 rounded-lg shadow-lg border border-[#d4af37]/40 pointer-events-none max-w-xs";
      tooltipEl.setAttribute("role", "tooltip");
      document.body.appendChild(tooltipEl);
    }

    // i18n対応: data-i18n-tooltip属性があればそのキーで翻訳
    const i18nKey = target.getAttribute("data-i18n-tooltip");
    if (i18nKey && window.i18n && typeof window.i18n.t === "function") {
      text = window.i18n.t(i18nKey) || text;
    }

    tooltipEl.textContent = text;
    tooltipEl.style.display = "block";

    // 位置計算
    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();

    let top = rect.top - tooltipRect.height - 8;
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

    // 画面外にはみ出す場合の調整
    if (top < 8) {
      top = rect.bottom + 8;
    }
    if (left < 8) {
      left = 8;
    }
    if (left + tooltipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tooltipRect.width - 8;
    }

    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;

    // アクセシビリティ
    tooltipTarget = target;
    target.setAttribute("aria-describedby", tooltipId);
  }

  function hideTooltip() {
    if (tooltipEl) {
      tooltipEl.style.display = "none";
    }
    if (tooltipTarget) {
      try {
        tooltipTarget.removeAttribute("aria-describedby");
      } catch (_) {}
      tooltipTarget = null;
    }
  }

  function getDisabledReason(el) {
    if (!el || !el.id) return null;
    const id = el.id;
    // 仕様書の例に基づき、よくある無効理由を返す
    const disabled = el.disabled || el.getAttribute("aria-disabled") === "true";
    if (!disabled) return null;

    // i18n対応
    const i18n = window.i18n;
    const t = i18n && typeof i18n.t === "function" ? i18n.t.bind(i18n) : null;

    switch (id) {
      case "hit-btn":
        return t
          ? t("disabledReason.hit")
          : "21を超えているため、これ以上カードを引けません";
      case "double-btn":
        return t
          ? t("disabledReason.double")
          : "最初の2枚のカードでのみ使用できます";
      case "split-btn":
        return t ? t("disabledReason.split") : "同じ数字のカードが2枚必要です";
      case "deal-btn":
        return t ? t("disabledReason.deal") : "ベット額を選択してください";
      default:
        return null;
    }
  }

  function attachTooltipHandlers() {
    const selector = "[data-tooltip], .action-button, .chip";
    document.addEventListener("mouseover", (e) => {
      const target = e.target.closest(selector);
      if (!target) return;

      const reason = getDisabledReason(target);
      const text = reason || target.getAttribute("data-tooltip");
      if (text) showTooltip(target, text);
    });
    document.addEventListener("focusin", (e) => {
      const target = e.target.closest(selector);
      if (!target) return;
      const reason = getDisabledReason(target);
      const text = reason || target.getAttribute("data-tooltip");
      if (text) showTooltip(target, text);
    });
    ["mouseout", "focusout", "click", "scroll"].forEach((evt) => {
      document.addEventListener(evt, hideTooltip, true);
    });

    // モバイル: タップで表示→数秒で消える
    document.addEventListener(
      "touchstart",
      (e) => {
        const target = e.target.closest(selector);
        if (!target) return;
        const reason = getDisabledReason(target);
        const text = reason || target.getAttribute("data-tooltip");
        if (!text) return;
        showTooltip(target, text);
        setTimeout(hideTooltip, 2000);
      },
      { passive: true },
    );
  }

  // -----------------------------
  // Tutorial
  // -----------------------------
  let tutorial = null;
  let hints = null;
  let overlayEl = null;
  let spotlightEl = null;
  let panelEl = null;
  let scrollLockPrev = { top: 0, left: 0 };

  const steps = [
    {
      title: "ブラックジャックへようこそ",
      desc: "画面の見方を説明します（ディーラー、プレイヤー、ベット、アクション、所持金）",
      highlight: "#game-container",
    },
    {
      title: "ベットの説明",
      desc: "まずベット額を選択します。チップをクリックして金額を選び、Dealで開始します。",
      highlight: "#betting-controls",
    },
    {
      title: "カードの配布",
      desc: "プレイヤーとディーラーにカードが配られます。21に近づけましょう。",
      highlight: "#player-hands-container",
    },
    {
      title: "アクション",
      desc: "ヒット、スタンド、ダブル、スプリットなどのアクションが選べます。",
      highlight: "#action-controls",
    },
    {
      title: "勝敗判定",
      desc: "21に近い方が勝ち。21超えは負け。ディーラーは17以上まで引きます。",
      highlight: "#message-box",
    },
  ];

  function ensureTutorialEls() {
    if (!overlayEl) {
      overlayEl = document.createElement("div");
      overlayEl.className = "tutorial-overlay hidden";
      overlayEl.addEventListener("click", () => {
        // クリックで次へ
        nextStep();
      });
      document.body.appendChild(overlayEl);
    }
    if (!spotlightEl) {
      spotlightEl = document.createElement("div");
      spotlightEl.className = "tutorial-spotlight hidden";
      document.body.appendChild(spotlightEl);
    }
    if (!panelEl) {
      panelEl = document.createElement("div");
      panelEl.className = "tutorial-panel hidden";
      panelEl.innerHTML = `
        <button id="tutorial-toggle" class="tutorial-toggle" aria-expanded="true" aria-controls="tutorial-body">
          <h3 id="tutorial-title"></h3>
          <span class="chevron" aria-hidden="true"></span>
        </button>
        <div id="tutorial-body">
          <div id="tutorial-desc" class="text-sm"></div>
          <div class="actions">
            <div>
              <label class="text-xs inline-flex items-center gap-1"><input type="checkbox" id="tutorial-dontshow" /> 今後表示しない</label>
            </div>
            <div class="flex gap-2">
              <button id="tutorial-skip" class="btn-ghost">スキップ</button>
              <button id="tutorial-prev" class="btn-ghost">戻る</button>
              <button id="tutorial-next" class="btn-primary">次へ</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(panelEl);
      document
        .getElementById("tutorial-skip")
        .addEventListener("click", (e) => {
          e.stopPropagation();
          skipTutorial();
        });
      document
        .getElementById("tutorial-prev")
        .addEventListener("click", (e) => {
          e.stopPropagation();
          prevStep();
        });
      document
        .getElementById("tutorial-next")
        .addEventListener("click", (e) => {
          e.stopPropagation();
          nextStep();
        });
      document
        .getElementById("tutorial-dontshow")
        .addEventListener("change", (e) => {
          tutorial.dontShowAgain = e.target.checked;
          persistTutorial();
        });
      const toggleBtn = document.getElementById("tutorial-toggle");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const isCollapsed = panelEl.classList.toggle("collapsed");
          toggleBtn.setAttribute("aria-expanded", String(!isCollapsed));
        });
      }
    }
  }

  function spotlightTo(selector) {
    const target = document.querySelector(selector);
    if (!target) {
      spotlightEl.classList.add("hidden");
      return;
    }
    const rect = target.getBoundingClientRect();
    spotlightEl.style.top = rect.top - 8 + "px";
    spotlightEl.style.left = rect.left - 8 + "px";
    spotlightEl.style.width = rect.width + 16 + "px";
    spotlightEl.style.height = rect.height + 16 + "px";
    spotlightEl.classList.remove("hidden");

    // 自動モーダル位置は廃止（パネルはボトム固定）
  }

  // positionPanelNear: 廃止

  function renderStep(index) {
    ensureTutorialEls();
    const step = steps[index];
    if (!step) return endTutorial();

    overlayEl.classList.remove("hidden");
    panelEl.classList.remove("hidden");
    panelEl.classList.remove("collapsed");
    const toggleBtn = document.getElementById("tutorial-toggle");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");

    document.getElementById("tutorial-title").textContent = step.title;
    document.getElementById("tutorial-desc").textContent = step.desc;
    document.getElementById("tutorial-prev").disabled = index === 0;
    document.getElementById("tutorial-next").textContent =
      index === steps.length - 1 ? "完了" : "次へ";

    spotlightTo(step.highlight);

    // スクロール固定
    lockScroll();
  }

  function persistTutorial() {
    tutorial.lastShown = new Date().toISOString();
    saveJSON(LS_KEYS.tutorial, tutorial);
  }

  function nextStep() {
    tutorial.currentStep = Math.min(tutorial.currentStep + 1, steps.length);
    if (tutorial.currentStep >= steps.length) {
      tutorial.completed = true;
      persistTutorial();
      return endTutorial();
    }
    persistTutorial();
    renderStep(tutorial.currentStep);
  }
  function prevStep() {
    tutorial.currentStep = Math.max(tutorial.currentStep - 1, 0);
    persistTutorial();
    renderStep(tutorial.currentStep);
  }
  function skipTutorial() {
    tutorial.completed = false;
    tutorial.currentStep = 0;
    persistTutorial();
    endTutorial();
  }
  function endTutorial() {
    if (overlayEl) overlayEl.classList.add("hidden");
    if (panelEl) panelEl.classList.add("hidden");
    if (spotlightEl) spotlightEl.classList.add("hidden");
    unlockScroll();
  }

  // チュートリアル再起動API
  function startTutorial(force = false) {
    ensureTutorialEls();
    if (tutorial.dontShowAgain && !force) return;
    tutorial.completed = false;
    tutorial.currentStep = 0;
    persistTutorial();
    // ヘルプモーダルが開いていたら閉じる
    try {
      closeHelp();
    } catch (_) {}
    renderStep(0);
  }

  function maybeStartTutorial() {
    tutorial = loadJSON(LS_KEYS.tutorial, { ...DEFAULT_TUTORIAL });
    hints = loadJSON(LS_KEYS.hints, { ...DEFAULT_HINTS });

    // 初回起動: 自動開始。ただし "今後表示しない" が立っていない場合
    if (!tutorial.dontShowAgain && tutorial.completed === false) {
      tutorial.currentStep = 0;
      persistTutorial();
      renderStep(0);
    }
  }

  // スクロール固定/解除
  function lockScroll() {
    try {
      scrollLockPrev.top = window.scrollY || document.documentElement.scrollTop;
      scrollLockPrev.left =
        window.scrollX || document.documentElement.scrollLeft;
      document.body.classList.add("no-scroll");
      document.body.style.top = `-${scrollLockPrev.top}px`;
      document.body.style.left = `-${scrollLockPrev.left}px`;
    } catch (_) {}
  }
  function unlockScroll() {
    try {
      document.body.classList.remove("no-scroll");
      document.body.style.top = "";
      document.body.style.left = "";
      window.scrollTo(scrollLockPrev.left, scrollLockPrev.top);
    } catch (_) {}
  }

  // リサイズやスクロール発生時にスポットライト位置のみ再計算（パネルは固定）
  function refreshPositions() {
    if (!panelEl || panelEl.classList.contains("hidden")) return;
    const step = steps[tutorial.currentStep];
    if (!step) return;
    const target = document.querySelector(step.highlight);
    if (!target) return;
    spotlightTo(step.highlight);
  }
  window.addEventListener("resize", refreshPositions);
  window.addEventListener("scroll", refreshPositions, { passive: true });

  // -----------------------------
  // Help Center
  // -----------------------------
  function attachHelpButton() {
    const btn = document.getElementById("help-button");
    if (!btn) return;
    btn.addEventListener("click", openHelp);

    // 再起動ボタン
    const startBtn = document.getElementById("help-start-tutorial");
    if (startBtn) startBtn.addEventListener("click", () => startTutorial(true));

    // 設定UIイベント
    const chkTips = document.getElementById("setting-show-tooltips");
    const chkCtx = document.getElementById("setting-show-context");
    const selLvl = document.getElementById("setting-hint-level");
    if (chkTips)
      chkTips.addEventListener("change", () => {
        hints.showTooltips = chkTips.checked;
        persistHints();
        if (!hints.showTooltips) hideTooltip();
      });
    if (chkCtx)
      chkCtx.addEventListener("change", () => {
        hints.showContextHelp = chkCtx.checked;
        persistHints();
        if (!hints.showContextHelp) setHint("");
      });
    if (selLvl)
      selLvl.addEventListener("change", () => {
        hints.hintLevel = selLvl.value;
        persistHints();
      });
  }

  // Keyboard shortcuts
  function attachKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "?") {
        openHelp();
      }
      // ESC key handling is now managed by ModalManager
    });
  }

  // -----------------------------
  // Contextual Hints
  // -----------------------------
  function setHint(text) {
    const hintEl = document.getElementById("context-hint");
    if (!hintEl) return;
    if (!hints.showContextHelp) {
      hintEl.textContent = "";
      return;
    }
    hintEl.textContent = text || "";
  }

  function formatCard(card) {
    return card ? card.rank + card.suit : "?";
  }

  function handValue(hand) {
    // 軽量な評価: ゲーム本体の関数は参照しない（疎結合）
    let sum = 0,
      aces = 0;
    hand.forEach((c) => {
      if (!c) return;
      const r = c.rank;
      if (r === "A") {
        sum += 11;
        aces++;
      } else if (["K", "Q", "J", "10"].includes(r)) sum += 10;
      else sum += parseInt(r, 10);
    });
    while (sum > 21 && aces > 0) {
      sum -= 10;
      aces--;
    }
    return sum;
  }

  function buildHint(detail) {
    const { state, playerBalance, currentBet, playerHands, dealerHand } =
      detail;
    if (!window.i18n || typeof window.i18n.t !== "function") return "";
    if (state === "BETTING") {
      if (currentBet === 0) return window.i18n.t("hint.bet.select");
      return window.i18n.t("hint.bet.ready");
    }
    if (state === "PLAYER_TURN") {
      const hand = playerHands[0] || [];
      const val = handValue(hand);
      const upRank = dealerHand && dealerHand[0] ? dealerHand[0].rank : "?";
      const upStrong = ["9", "10", "J", "Q", "K", "A"].includes(upRank);
      const upWeak = ["2", "3", "4", "5", "6"].includes(upRank);
      const level = hints.hintLevel || "beginner";

      if (val >= 20)
        return window.i18n.t(
          level === "expert" ? "hint.player.stand.expert" : "hint.player.stand",
        );
      if (val === 11 && playerBalance >= currentBet)
        return window.i18n.t(
          level === "expert"
            ? "hint.player.double.expert"
            : "hint.player.double",
        );

      const riskThreshold = 21 - val;
      if (val >= 12 && riskThreshold <= 5) {
        return window.i18n.t(
          level === "expert" ? "hint.player.bust.expert" : "hint.player.bust",
        );
      }
      if (upStrong && val >= 12 && val <= 16)
        return window.i18n.t(
          level === "expert"
            ? "hint.player.dealerStrong.expert"
            : "hint.player.dealerStrong",
        );
      if (upWeak && val >= 12 && val <= 16)
        return window.i18n.t(
          level === "expert"
            ? "hint.player.dealerWeak.expert"
            : "hint.player.dealerWeak",
        );
      if (val <= 10)
        return window.i18n.t(
          level === "expert" ? "hint.player.hit.expert" : "hint.player.hit",
        );
      return "";
    }
    if (state === "DEALER_TURN") {
      const up = dealerHand && dealerHand[0] ? formatCard(dealerHand[0]) : "?";
      return window.i18n.t("hint.dealer.wait", { up });
    }
    if (state === "HAND_OVER") {
      return window.i18n.t("hint.handOver");
    }
    return "";
  }

  let lastHintText = "";
  let lastHintTs = 0;
  function onGameUiUpdated(e) {
    try {
      const text = buildHint(e.detail || {});
      const now = Date.now();
      if (text !== lastHintText || now - lastHintTs > 2000) {
        setHint(text);
        lastHintText = text;
        lastHintTs = now;
      }
    } catch (_) {
      // ignore
    }
  }

  function applySettingsToUI() {
    const chkTips = document.getElementById("setting-show-tooltips");
    const chkCtx = document.getElementById("setting-show-context");
    const selLvl = document.getElementById("setting-hint-level");
    if (chkTips) {
      chkTips.checked = !!hints.showTooltips;
      if (window.i18n)
        chkTips.title = window.i18n.t("help.settings.showTooltips");
    }
    if (chkCtx) {
      chkCtx.checked = !!hints.showContextHelp;
      if (window.i18n)
        chkCtx.title = window.i18n.t("help.settings.showContextHelp");
    }
    if (selLvl) {
      selLvl.value = hints.hintLevel || "beginner";
      if (window.i18n) selLvl.title = window.i18n.t("help.settings.hintLevel");
    }
  }

  function persistHints() {
    saveJSON(LS_KEYS.hints, hints);
  }

  // Init
  function init() {
    hints = loadJSON(LS_KEYS.hints, { ...DEFAULT_HINTS });
    tutorial = loadJSON(LS_KEYS.tutorial, { ...DEFAULT_TUTORIAL });

    attachTooltipHandlers();
    attachHelpButton();
    attachKeyboardShortcuts();
    maybeStartTutorial();

    // コンテキストヒント購読
    window.addEventListener("game:ui-updated", onGameUiUpdated);

    // 言語変更時にツールチップ文言を更新
    window.addEventListener("langchange", () => {
      if (window.i18n) window.i18n.applyTooltipLabels();
    });
  }

  // expose minimal API
  window.guide = {
    openHelp,
    closeHelp,
    startTutorial,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

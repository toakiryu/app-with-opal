// Import core logic from window.Blackjack
const {
  SUITS,
  RANKS,
  NUM_DECKS,
  createDeck,
  shuffleDeck,
  getCardValue,
  calculateHandValue,
  isSoftHand,
  getHandInfo,
} = window.Blackjack || {};

if (!window.Blackjack) {
  // Fallback guard to help debugging if script order breaks
  throw new Error(
    "Blackjack core not found. Ensure script.js is loaded before game.js",
  );
}

let deck = [];
let playerBalance = 1000;
let currentBet = 0;

let playerHands = [];
let dealerHand = [];
let activeHandIndex = 0;

let gameState = "BETTING"; // BETTING, PLAYER_TURN, DEALER_TURN, HAND_OVER

// スコア管理
let scoreData = null;

// DOM Elements
const balanceEl = document.getElementById("balance");
const betEl = document.getElementById("bet");
const dealerScoreEl = document.getElementById("dealer-score");
const playerScoreEl = document.getElementById("player-score");
const dealerHandEl = document.getElementById("dealer-hand");
const playerHandsContainerEl = document.getElementById(
  "player-hands-container",
);
const mainPlayerHandEl = document.getElementById("player-hand-main");
const splitPlayerHandEl = document.getElementById("player-hand-split");
const messageBox = document.getElementById("message-box");

// スコア表示要素
const matchCountEl = document.getElementById("match-count");
const bestScoreEl = document.getElementById("best-score");

const bettingControls = document.getElementById("betting-controls");
const actionControls = document.getElementById("action-controls");
const newHandControls = document.getElementById("new-hand-controls");

const dealBtn = document.getElementById("deal-btn");
const clearBetBtn = document.getElementById("clear-bet-btn");
const hitBtn = document.getElementById("hit-btn");
const standBtn = document.getElementById("stand-btn");
const doubleBtn = document.getElementById("double-btn");
const splitBtn = document.getElementById("split-btn");
const newHandBtn = document.getElementById("new-hand-btn");
const chipBtns = document.querySelectorAll(".chip");

// remove duplicated core functions (now imported)

function createCardElement(card, isHidden = false) {
  const cardEl = document.createElement("div");
  cardEl.className = "card";

  const cardInner = document.createElement("div");
  cardInner.className = "card-inner";

  if (isHidden) {
    cardEl.classList.add("flipped");
  }

  const front = document.createElement("div");
  front.className = "card-face card-front";
  const suitColor = ["♥", "♦"].includes(card.suit)
    ? "text-[#de3730]"
    : "text-[#393c3d]";
  front.innerHTML = `
                <div class="absolute top-1 left-2 text-lg font-bold ${suitColor}">${card.rank}</div>
                <div class="text-4xl ${suitColor}">${card.suit}</div>
                <div class="absolute bottom-1 right-2 text-lg font-bold ${suitColor} transform rotate-180">${card.rank}</div>
            `;

  const back = document.createElement("div");
  back.className = "card-face card-back";

  cardInner.appendChild(front);
  cardInner.appendChild(back);
  cardEl.appendChild(cardInner);

  return cardEl;
}

function renderHands() {
  // ディーラーの手札を描画（既存のカードは保持、新しいカードのみ追加）
  const currentDealerCards = dealerHandEl.children.length;
  const isInitialDeal = currentDealerCards === 0; // 初期配布かどうか
  
  dealerHand.forEach((card, index) => {
    if (index < currentDealerCards) {
      // 既存のカードを更新（裏向き→表向きの切り替えなど）
      const existingCard = dealerHandEl.children[index];
      const isHidden =
        index === 1 && gameState !== "HAND_OVER" && gameState !== "DEALER_TURN";
      
      // カードが裏向きから表向きに変わる場合のみ更新
      if (isHidden !== existingCard.classList.contains("flipped")) {
        const cardEl = createCardElement(card, isHidden);
        dealerHandEl.replaceChild(cardEl, existingCard);
      }
    } else {
      // 新しいカードを追加
      const isHidden =
        index === 1 && gameState !== "HAND_OVER" && gameState !== "DEALER_TURN";
      const cardEl = createCardElement(card, isHidden);
      
      // 初期配布時は順次アニメーション、追加時は即座に表示
      if (isInitialDeal) {
        cardEl.style.animationDelay = `${index * 100}ms`;
      } else {
        cardEl.style.animationDelay = "0ms";
      }
      
      cardEl.classList.add("deal-in");
      dealerHandEl.appendChild(cardEl);
    }
  });

  // プレイヤーのメインハンドを描画（既存のカードは保持、新しいカードのみ追加）
  if (playerHands[0]) {
    const currentMainCards = mainPlayerHandEl.children.length;
    playerHands[0].forEach((card, index) => {
      if (index >= currentMainCards) {
        // 新しいカードのみ追加
        const cardEl = createCardElement(card);
        
        // 初期配布時は順次アニメーション、追加時は即座に表示
        if (isInitialDeal) {
          cardEl.style.animationDelay = `${index * 100 + 50}ms`;
        } else {
          cardEl.style.animationDelay = "0ms";
        }
        
        cardEl.classList.add("deal-in");
        mainPlayerHandEl.appendChild(cardEl);
      }
    });
  }

  // スプリットハンドを描画
  if (playerHands.length > 1) {
    splitPlayerHandEl.classList.remove("hidden");
    const currentSplitCards = splitPlayerHandEl.children.length;
    playerHands[1].forEach((card, index) => {
      if (index >= currentSplitCards) {
        // 新しいカードのみ追加
        const cardEl = createCardElement(card);
        cardEl.style.animationDelay = "0ms";
        cardEl.classList.add("deal-in");
        splitPlayerHandEl.appendChild(cardEl);
      }
    });
  } else {
    splitPlayerHandEl.classList.add("hidden");
  }

  updateScores();
  updateActiveHandIndicator();
}

function updateScores() {
  // ディーラースコア表示
  const isDealerHidden =
    gameState !== "HAND_OVER" && gameState !== "DEALER_TURN";

  if (isDealerHidden) {
    // カードが隠れている場合
    if (window.i18n) {
      dealerScoreEl.textContent = window.i18n.t("score.dealer", { score: "?" });
    } else {
      dealerScoreEl.textContent = `Dealer: ?`;
    }
  } else {
    // カードが見える場合：Soft/Hard表示を追加
    const dealerInfo = getHandInfo(dealerHand);
    if (window.i18n) {
      dealerScoreEl.textContent = window.i18n.t("score.dealer", {
        score: dealerInfo.label,
      });
    } else {
      dealerScoreEl.textContent = `Dealer: ${dealerInfo.label}`;
    }
  }

  // プレイヤースコア表示
  if (playerHands.length === 1) {
    const playerInfo = getHandInfo(playerHands[0]);
    playerScoreEl.textContent = window.i18n
      ? window.i18n.t("score.player", { score: playerInfo.label })
      : `Player: ${playerInfo.label}`;
  } else {
    const info1 = getHandInfo(playerHands[0]);
    const info2 = getHandInfo(playerHands[1]);
    playerScoreEl.textContent = window.i18n
      ? window.i18n.t("score.hand12", {
          score1: info1.label,
          score2: info2.label,
        })
      : `Hand 1: ${info1.label} / Hand 2: ${info2.label}`;
  }
}

function updateUI() {
  balanceEl.textContent = `$${playerBalance}`;
  betEl.textContent = `$${currentBet}`;
  dealBtn.disabled = currentBet === 0;
  clearBetBtn.disabled = currentBet === 0;
  chipBtns.forEach((btn) => {
    btn.disabled = playerBalance < currentBet + parseInt(btn.dataset.value);
  });

  // スコア表示の更新
  if (scoreData && matchCountEl) {
    matchCountEl.textContent = scoreData.currentScore.matchCount;
  }
  if (scoreData && bestScoreEl) {
    bestScoreEl.textContent = scoreData.bestScore;
  }

  bettingControls.style.display = gameState === "BETTING" ? "flex" : "none";
  actionControls.style.display = gameState === "PLAYER_TURN" ? "grid" : "none";
  newHandControls.style.display = gameState === "HAND_OVER" ? "block" : "none";

  if (gameState === "PLAYER_TURN") {
    const currentHand = playerHands[activeHandIndex];
    const handValue = calculateHandValue(currentHand);
    hitBtn.disabled = handValue >= 21;
    standBtn.disabled = false;
    doubleBtn.disabled = !(
      currentHand.length === 2 && playerBalance >= currentBet
    );
    splitBtn.disabled = !(
      currentHand.length === 2 &&
      getCardValue(currentHand[0]) === getCardValue(currentHand[1]) &&
      playerBalance >= currentBet
    );
  }

  // コンテキストヒント更新イベントを通知
  try {
    window.dispatchEvent(
      new CustomEvent("game:ui-updated", {
        detail: {
          state: gameState,
          playerBalance,
          currentBet,
          activeHandIndex,
          playerHands: JSON.parse(JSON.stringify(playerHands)),
          dealerHand: JSON.parse(JSON.stringify(dealerHand)),
        },
      }),
    );
  } catch (e) {
    /* noop */
  }
}

function updateActiveHandIndicator() {
  mainPlayerHandEl.classList.remove("active-hand");
  splitPlayerHandEl.classList.remove("active-hand");
  if (gameState === "PLAYER_TURN" && playerHands.length > 1) {
    if (activeHandIndex === 0) {
      mainPlayerHandEl.classList.add("active-hand");
    } else {
      splitPlayerHandEl.classList.add("active-hand");
    }
  }
}

function placeBet(amount) {
  if (gameState !== "BETTING") return;
  if (playerBalance >= amount) {
    currentBet += amount;
    playerBalance -= amount;
    updateUI();
    
    // 効果音: チップ配置
    if (window.Sfx) {
      window.Sfx.playSound('chip');
    }
  }
}

function clearBet() {
  if (gameState !== "BETTING") return;
  playerBalance += currentBet;
  currentBet = 0;
  updateUI();
}

function startHand() {
  if (currentBet === 0) return;
  gameState = "PLAYER_TURN";

  if (deck.length < NUM_DECKS * 52 * 0.25) {
    deck = createDeck();
    shuffleDeck(deck);
    const shufflingMsg = window.i18n
      ? window.i18n.t("msg.shuffling")
      : "Shuffling new deck...";
    displayMessage(shufflingMsg, false, 1500);
  }

  // 新しいハンドの開始時には既存のカードをクリア
  dealerHandEl.innerHTML = "";
  mainPlayerHandEl.innerHTML = "";
  splitPlayerHandEl.innerHTML = "";
  splitPlayerHandEl.classList.add("hidden");

  playerHands = [[deck.pop(), deck.pop()]];
  dealerHand = [deck.pop(), deck.pop()];
  activeHandIndex = 0;

  // 効果音: カード配布
  if (window.Sfx) {
    window.Sfx.playSound('card-flip');
  }

  renderHands();
  updateUI();

  const playerScore = calculateHandValue(playerHands[0]);
  const dealerScore = calculateHandValue(dealerHand);

  // ブラックジャック成立時も自動でスタンドせず、プレイヤーが操作できるようにする
  displayMessage(
    window.i18n ? window.i18n.t("msg.yourTurn") : "Your Turn",
    false,
    2000,
  );

  // 状態更新を通知
  updateUI();
}

function playerHit() {
  if (gameState !== "PLAYER_TURN") return;

  const currentHand = playerHands[activeHandIndex];
  currentHand.push(deck.pop());
  
  // 効果音: カード引く
  if (window.Sfx) {
    window.Sfx.playSound('card-flip');
  }
  
  renderHands();

  const handValue = calculateHandValue(currentHand);
  if (handValue > 21) {
    // 効果音: バースト
    if (window.Sfx) {
      window.Sfx.playSound('bust');
    }
    
    const msg = window.i18n
      ? window.i18n.t("msg.handBusts", { hand: activeHandIndex + 1 })
      : `Hand ${activeHandIndex + 1} Busts!`;
    displayMessage(msg, false, 2000);
    moveToNextHandOrDealer();
  }
  updateUI();
}

function playerStand() {
  if (gameState !== "PLAYER_TURN") return;
  
  // 効果音: スタンド（オプション）
  if (window.Sfx) {
    window.Sfx.playSound('stand');
  }
  
  moveToNextHandOrDealer();
}

function playerDoubleDown() {
  if (gameState !== "PLAYER_TURN") return;

  playerBalance -= currentBet;
  currentBet *= 2;
  updateUI();

  const currentHand = playerHands[activeHandIndex];
  currentHand.push(deck.pop());
  renderHands();

  setTimeout(moveToNextHandOrDealer, 1000);
}

function playerSplit() {
  if (gameState !== "PLAYER_TURN") return;

  const handToSplit = playerHands[0];
  playerBalance -= currentBet; // Place bet for the new hand

  playerHands = [
    [handToSplit[0], deck.pop()],
    [handToSplit[1], deck.pop()],
  ];

  renderHands();
  updateUI();
}

function moveToNextHandOrDealer() {
  if (playerHands.length > 1 && activeHandIndex === 0) {
    activeHandIndex = 1;
    updateActiveHandIndicator();
    updateUI();
    displayMessage(
      window.i18n ? window.i18n.t("msg.secondHandTurn") : "Second Hand's Turn",
      false,
      2000,
    );
  } else {
    gameState = "DEALER_TURN";
    updateUI();
    dealerPlay();
  }
}

function dealerPlay() {
  displayMessage(
    window.i18n ? window.i18n.t("msg.dealerTurn") : "Dealer's Turn",
    false,
    1500,
  );

  // Flip hidden card
  const hiddenCardEl = dealerHandEl.children[1];
  if (hiddenCardEl) hiddenCardEl.classList.remove("flipped");

  updateScores();

  const dealerInterval = setInterval(() => {
    const dealerScore = calculateHandValue(dealerHand);
    const isSoft = isSoftHand(dealerHand);

    // H17 Rule: Dealer hits on Soft 17
    // Dealer must hit if score < 17, or if score == 17 and hand is soft
    const shouldHit = dealerScore < 17 || (dealerScore === 17 && isSoft);

    if (shouldHit) {
      dealerHand.push(deck.pop());
      // 効果音を再生
      if (window.Sfx) {
        window.Sfx.playSound("card-flip");
      }
      renderHands();
      updateScores();
    } else {
      clearInterval(dealerInterval);
      resolveHand();
    }
  }, 1000);
}

function resolveHand(specialOutcome = null) {
  gameState = "HAND_OVER";

  if (specialOutcome === "Player Blackjack") {
    displayMessage(
      window.i18n ? window.i18n.t("msg.blackjackWin") : "Blackjack! You win!",
    );
    playerBalance += currentBet + currentBet * 1.5;
    
    // 効果音: 勝利
    if (window.Sfx) {
      window.Sfx.playSound('win');
    }
    
    // ビジュアルエフェクト: 勝利パルス
    addWinEffect();
  } else if (specialOutcome === "Push") {
    displayMessage(window.i18n ? window.i18n.t("msg.push") : "Push!");
    playerBalance += currentBet;
  } else {
    const dealerScore = calculateHandValue(dealerHand);
    let totalWinnings = 0;
    let finalMessage = "";

    playerHands.forEach((hand, index) => {
      const playerScore = calculateHandValue(hand);
      const betForHand = playerHands.length > 1 ? currentBet : currentBet;

      if (playerScore > 21) {
        finalMessage += window.i18n
          ? window.i18n.t("msg.handResult.bust", { hand: index + 1 })
          : `Hand ${index + 1}: Bust! You lose.`;
      } else if (dealerScore > 21 || playerScore > dealerScore) {
        finalMessage += window.i18n
          ? window.i18n.t("msg.handResult.win", { hand: index + 1 })
          : `Hand ${index + 1}: You win!`;
        totalWinnings += betForHand * 2;
        
        // 効果音: 勝利（最初の勝ちハンドでのみ再生）
        if (window.Sfx && index === 0) {
          window.Sfx.playSound('win');
        }
      } else if (playerScore < dealerScore) {
        finalMessage += window.i18n
          ? window.i18n.t("msg.handResult.dealerWins", { hand: index + 1 })
          : `Hand ${index + 1}: Dealer wins.`;
        
        // 効果音: 敗北（最初の負けハンドでのみ再生）
        if (window.Sfx && index === 0 && totalWinnings === 0) {
          window.Sfx.playSound('lose');
        }
      } else {
        finalMessage += window.i18n
          ? window.i18n.t("msg.handResult.push", { hand: index + 1 })
          : `Hand ${index + 1}: Push.`;
        totalWinnings += betForHand;
      }
      finalMessage += playerHands.length > 1 ? "<br>" : "";
    });

    displayMessage(finalMessage);
    playerBalance += totalWinnings;
    
    // ビジュアルエフェクト: 勝ちまたは負け
    if (totalWinnings > currentBet) {
      addWinEffect();
    } else if (totalWinnings === 0) {
      addLoseEffect();
    }
  }

  currentBet = 0;

  // スコア管理: 試合数をカウント
  if (window.ScoreManager && scoreData) {
    scoreData = window.ScoreManager.incrementMatchCount(scoreData);
    scoreData = window.ScoreManager.updateCurrentCash(scoreData, playerBalance);
  }

  // 破産チェック
  if (playerBalance <= 0) {
    // 効果音: 破産
    if (window.Sfx) {
      window.Sfx.playSound('bust');
    }
    
    handleBankruptcy();
  } else {
    updateUI();
  }
}

function displayMessage(msg, isPermanent = false, duration = 3000) {
  messageBox.innerHTML = msg;
  messageBox.style.opacity = 1;
  if (!isPermanent) {
    setTimeout(() => {
      if (gameState !== "BETTING") {
        messageBox.style.opacity = 0;
      }
    }, duration);
  }
}

function handleBankruptcy() {
  if (!window.ScoreManager || !scoreData) return;

  // スコアを記録
  const finalScore = scoreData.currentScore.matchCount;
  scoreData = window.ScoreManager.recordBankruptcy(scoreData);

  // プレイヤーバランスをリセット（モーダル表示前にリセット）
  playerBalance = window.ScoreManager.DEFAULT_START_CASH;
  currentBet = 0;

  // UIを更新してからモーダルを表示
  updateUI();

  // 破産メッセージと結果を表示
  showBankruptcyModal(finalScore);
}

function showBankruptcyModal(finalScore) {
  if (!window.ModalManager || !scoreData) return;

  // 新記録バッジの表示制御
  const newRecordBadge = document.getElementById("new-record-badge");
  if (newRecordBadge) {
    if (finalScore === scoreData.bestScore && finalScore > 0) {
      newRecordBadge.classList.remove("hidden");
    } else {
      newRecordBadge.classList.add("hidden");
    }
  }

  // スコア表示を更新
  const finalScoreEl = document.getElementById("final-score");
  const bestScoreModalEl = document.getElementById("best-score-modal");
  if (finalScoreEl) finalScoreEl.textContent = finalScore;
  if (bestScoreModalEl) bestScoreModalEl.textContent = scoreData.bestScore;

  // モーダルを開く
  ModalManager.open("bankruptcy-modal");
}

function closeBankruptcyModal() {
  if (window.ModalManager) {
    ModalManager.close("bankruptcy-modal");
  }
  // ゲーム状態をBETTINGにリセット
  gameState = "BETTING";
  playerHands = [];
  dealerHand = [];
  activeHandIndex = 0;
  currentBet = 0;

  // UIを更新（スコア表示もここで更新される）
  updateUI();

  // コンテキストヒント更新
  if (window.guide && typeof window.guide.updateContextHint === "function") {
    window.guide.updateContextHint({
      state: gameState,
      playerBalance,
      currentBet,
      playerHands,
      dealerHand,
    });
  }
}

function showScoreBoard() {
  if (!scoreData) return;
  // 統計情報の更新
  document.getElementById("stats-best-score").textContent = scoreData.bestScore;
  document.getElementById("stats-total-games").textContent =
    scoreData.totalGames;
  document.getElementById("stats-total-matches").textContent =
    scoreData.totalMatches;
  document.getElementById("stats-average-score").textContent =
    window.ScoreManager.calculateAverageScore(scoreData);

  // 履歴の更新
  const historyList = document.getElementById("score-history-list");
  historyList.innerHTML = "";
  const history = scoreData.scoreHistory.slice(-10).reverse();
  if (history.length === 0) {
    historyList.innerHTML =
      '<p class="text-gray-400 text-center py-4">まだ記録がありません</p>';
  } else {
    history.forEach((entry, index) => {
      const row = document.createElement("div");
      row.className =
        "grid grid-cols-3 gap-4 p-3 bg-[#1a2332]/50 rounded-lg hover:bg-[#1a2332]/70 transition-colors";
      row.innerHTML = `
        <div class="text-center">
          <div class="text-[#d4af37] font-bold text-xl">${entry.score}</div>
          <div class="text-gray-400 text-xs">試合</div>
        </div>
        <div class="text-center">
          <div class="text-white text-sm">${window.ScoreManager.formatDate(entry.endDate)}</div>
          <div class="text-gray-400 text-xs">プレイ日時</div>
        </div>
        <div class="text-center">
          <div class="text-white text-sm">${window.ScoreManager.formatDuration(entry.duration)}</div>
          <div class="text-gray-400 text-xs">プレイ時間</div>
        </div>
      `;
      historyList.appendChild(row);
    });
  }
  if (window.ModalManager) {
    ModalManager.open("scoreboard-modal");
  }
}

function closeScoreBoard() {
  const modal = document.getElementById("scoreboard-modal");
  const overlay = document.getElementById("modal-overlay");

  if (modal && overlay) {
    modal.classList.add("hidden");
    overlay.classList.add("hidden");
  }
}

function resetForNewHand() {
  gameState = "BETTING";
  playerHands = [];
  dealerHand = [];
  activeHandIndex = 0;

  dealerHandEl.innerHTML = "";
  mainPlayerHandEl.innerHTML = "";
  splitPlayerHandEl.innerHTML = "";
  splitPlayerHandEl.classList.add("hidden");
  mainPlayerHandEl.classList.remove("active-hand");

  dealerScoreEl.textContent = window.i18n
    ? window.i18n.t("score.dealer", { score: "?" })
    : "Dealer: ?";
  playerScoreEl.textContent = window.i18n
    ? window.i18n.t("score.player", { score: 0 })
    : "Player: 0";

  displayMessage(
    window.i18n ? window.i18n.t("msg.placeYourBet") : "Place Your Bet",
    true,
  );
  updateUI();
}

// ============================================
// ビジュアルエフェクト用ヘルパー関数
// ============================================

/**
 * 勝利エフェクトを追加
 */
function addWinEffect() {
  // メッセージボックスに勝利アニメーション
  if (messageBox) {
    messageBox.classList.add('win-pulse');
    setTimeout(() => {
      messageBox.classList.remove('win-pulse');
    }, 900);
  }
  
  // バランス表示にスコア増加アニメーション
  if (balanceEl) {
    balanceEl.classList.add('score-increase');
    setTimeout(() => {
      balanceEl.classList.remove('score-increase');
    }, 600);
  }
  
  // ベット表示にも軽いエフェクト
  if (betEl) {
    betEl.classList.add('win-glow');
    setTimeout(() => {
      betEl.classList.remove('win-glow');
    }, 1200);
  }
}

/**
 * 敗北エフェクトを追加
 */
function addLoseEffect() {
  // メッセージボックスに敗北アニメーション
  if (messageBox) {
    messageBox.classList.add('lose-shake');
    setTimeout(() => {
      messageBox.classList.remove('lose-shake');
    }, 500);
  }
  
  // バランス表示にスコア減少アニメーション
  if (balanceEl) {
    balanceEl.classList.add('score-decrease');
    setTimeout(() => {
      balanceEl.classList.remove('score-decrease');
    }, 600);
  }
}

/**
 * カードにディールアニメーションを追加
 */
function addCardDealAnimation(cardElement, delay = 0) {
  if (!cardElement) return;
  
  cardElement.classList.add('dealing');
  cardElement.style.animationDelay = `${delay}ms`;
  
  setTimeout(() => {
    cardElement.classList.remove('dealing');
  }, 500 + delay);
}

/**
 * チップ配置アニメーションを追加
 */
function addChipPlaceAnimation() {
  const betEl = document.getElementById('bet');
  if (betEl) {
    betEl.classList.add('placing');
    setTimeout(() => {
      betEl.classList.remove('placing');
    }, 400);
  }
}

// ============================================
// イベントリスナー
// ============================================

// Event Listeners
chipBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    placeBet(parseInt(btn.dataset.value));
    addChipPlaceAnimation();
  });
});
clearBetBtn.addEventListener("click", clearBet);
dealBtn.addEventListener("click", startHand);
hitBtn.addEventListener("click", playerHit);
standBtn.addEventListener("click", playerStand);
doubleBtn.addEventListener("click", playerDoubleDown);
splitBtn.addEventListener("click", playerSplit);
newHandBtn.addEventListener("click", resetForNewHand);

// Initial Game Setup
function init() {
  deck = createDeck();
  shuffleDeck(deck);

  // スコア管理の初期化
  if (window.ScoreManager) {
    scoreData = window.ScoreManager.loadScoreData();
    playerBalance = scoreData.currentScore.currentCash;
  }

  resetForNewHand();

  // i18n setup
  if (window.i18n) {
    window.i18n.init();

    // Language selector (replaces old buttons)
    const langSelect = document.getElementById("language-select");
    if (langSelect) {
      // Set initial value based on current language
      langSelect.value = window.i18n.getLang();

      langSelect.addEventListener("change", (e) => {
        window.i18n.setLang(e.target.value);
      });
    }

    // When language changes, refresh dynamic content (scores, message)
    window.addEventListener("langchange", () => {
      updateScores();
      // If we're in BETTING state, ensure the placeholder message is translated
      if (gameState === "BETTING") {
        displayMessage(window.i18n.t("msg.placeYourBet"), true);
      }
      // Also update static labels if any dynamic ones are missed
      window.i18n.applyStaticLabels();

      // Update language selector value
      const langSelect = document.getElementById("language-select");
      if (langSelect) {
        langSelect.value = window.i18n.getLang();
      }
    });
  }
}

init();

// グローバルスコープに関数を公開（HTMLのonclick属性で使用）
window.showScoreBoard = showScoreBoard;
window.closeScoreBoard = closeScoreBoard;
window.closeBankruptcyModal = closeBankruptcyModal;

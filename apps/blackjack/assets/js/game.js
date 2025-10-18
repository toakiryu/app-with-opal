// Import core logic from window.Blackjack
const {
  SUITS,
  RANKS,
  NUM_DECKS,
  createDeck,
  shuffleDeck,
  getCardValue,
  calculateHandValue,
} = window.Blackjack || {};

if (!window.Blackjack) {
  // Fallback guard to help debugging if script order breaks
  throw new Error("Blackjack core not found. Ensure script.js is loaded before game.js");
}

let deck = [];
let playerBalance = 1000;
let currentBet = 0;

let playerHands = [];
let dealerHand = [];
let activeHandIndex = 0;

let gameState = "BETTING"; // BETTING, PLAYER_TURN, DEALER_TURN, HAND_OVER

// DOM Elements
const balanceEl = document.getElementById("balance");
const betEl = document.getElementById("bet");
const dealerScoreEl = document.getElementById("dealer-score");
const playerScoreEl = document.getElementById("player-score");
const dealerHandEl = document.getElementById("dealer-hand");
const playerHandsContainerEl = document.getElementById(
  "player-hands-container"
);
const mainPlayerHandEl = document.getElementById("player-hand-main");
const splitPlayerHandEl = document.getElementById("player-hand-split");
const messageBox = document.getElementById("message-box");

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
  cardInner.className = "relative w-full h-full";

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

  cardEl.appendChild(front);
  cardEl.appendChild(back);

  return cardEl;
}

function renderHands() {
  dealerHandEl.innerHTML = "";
  dealerHand.forEach((card, index) => {
    const isHidden =
      index === 1 && gameState !== "HAND_OVER" && gameState !== "DEALER_TURN";
    const cardEl = createCardElement(card, isHidden);
    cardEl.style.animationDelay = `${index * 100}ms`;
    cardEl.classList.add("deal-in");
    dealerHandEl.appendChild(cardEl);
  });

  mainPlayerHandEl.innerHTML = "";
  if (playerHands[0]) {
    playerHands[0].forEach((card, index) => {
      const cardEl = createCardElement(card);
      cardEl.style.animationDelay = `${index * 100 + 50}ms`;
      cardEl.classList.add("deal-in");
      mainPlayerHandEl.appendChild(cardEl);
    });
  }

  if (playerHands.length > 1) {
    splitPlayerHandEl.classList.remove("hidden");
    splitPlayerHandEl.innerHTML = "";
    playerHands[1].forEach((card, index) => {
      const cardEl = createCardElement(card);
      cardEl.style.animationDelay = `${index * 100 + 50}ms`;
      cardEl.classList.add("deal-in");
      splitPlayerHandEl.appendChild(cardEl);
    });
  } else {
    splitPlayerHandEl.classList.add("hidden");
  }

  updateScores();
  updateActiveHandIndicator();
}

function updateScores() {
  const dealerScore = calculateHandValue(dealerHand);
  const isDealerHidden =
    gameState !== "HAND_OVER" && gameState !== "DEALER_TURN";
  if (window.i18n) {
    dealerScoreEl.textContent = window.i18n.t('score.dealer', {
      score: isDealerHidden ? getCardValue(dealerHand[0]) : dealerScore,
    });
  } else {
    dealerScoreEl.textContent = `Dealer: ${
      isDealerHidden ? getCardValue(dealerHand[0]) : dealerScore
    }`;
  }

  if (playerHands.length === 1) {
    const playerScore = calculateHandValue(playerHands[0]);
    playerScoreEl.textContent = window.i18n
      ? window.i18n.t('score.player', { score: playerScore })
      : `Player: ${playerScore}`;
  } else {
    const score1 = calculateHandValue(playerHands[0]);
    const score2 = calculateHandValue(playerHands[1]);
    playerScoreEl.textContent = window.i18n
      ? window.i18n.t('score.hand12', { score1, score2 })
      : `Hand 1: ${score1} / Hand 2: ${score2}`;
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
    const shufflingMsg = window.i18n ? window.i18n.t('msg.shuffling') : "Shuffling new deck...";
    displayMessage(shufflingMsg, false, 1500);
  }

  playerHands = [[deck.pop(), deck.pop()]];
  dealerHand = [deck.pop(), deck.pop()];
  activeHandIndex = 0;

  renderHands();
  updateUI();

  const playerScore = calculateHandValue(playerHands[0]);
  const dealerScore = calculateHandValue(dealerHand);

  if (playerScore === 21) {
    if (dealerScore === 21) {
      setTimeout(() => resolveHand("Push"), 1000);
    } else {
      setTimeout(() => resolveHand("Player Blackjack"), 1000);
    }
  } else {
    displayMessage(window.i18n ? window.i18n.t('msg.yourTurn') : "Your Turn", false, 2000);
  }
}

function playerHit() {
  if (gameState !== "PLAYER_TURN") return;

  const currentHand = playerHands[activeHandIndex];
  currentHand.push(deck.pop());
  renderHands();

  const handValue = calculateHandValue(currentHand);
  if (handValue > 21) {
    const msg = window.i18n
      ? window.i18n.t('msg.handBusts', { hand: activeHandIndex + 1 })
      : `Hand ${activeHandIndex + 1} Busts!`;
    displayMessage(msg, false, 2000);
    moveToNextHandOrDealer();
  }
  updateUI();
}

function playerStand() {
  if (gameState !== "PLAYER_TURN") return;
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
    displayMessage(window.i18n ? window.i18n.t('msg.secondHandTurn') : "Second Hand's Turn", false, 2000);
  } else {
    gameState = "DEALER_TURN";
    updateUI();
    dealerPlay();
  }
}

function dealerPlay() {
  displayMessage(window.i18n ? window.i18n.t('msg.dealerTurn') : "Dealer's Turn", false, 1500);

  // Flip hidden card
  const hiddenCardEl = dealerHandEl.children[1];
  if (hiddenCardEl) hiddenCardEl.classList.remove("flipped");

  updateScores();

  const dealerInterval = setInterval(() => {
    let dealerScore = calculateHandValue(dealerHand);
    if (dealerScore < 17) {
      dealerHand.push(deck.pop());
      renderHands();
    } else {
      clearInterval(dealerInterval);
      resolveHand();
    }
  }, 1000);
}

function resolveHand(specialOutcome = null) {
  gameState = "HAND_OVER";

  if (specialOutcome === "Player Blackjack") {
    displayMessage(window.i18n ? window.i18n.t('msg.blackjackWin') : "Blackjack! You win!");
    playerBalance += currentBet + currentBet * 1.5;
  } else if (specialOutcome === "Push") {
    displayMessage(window.i18n ? window.i18n.t('msg.push') : "Push!");
    playerBalance += currentBet;
  } else {
    const dealerScore = calculateHandValue(dealerHand);
    let totalWinnings = 0;
    let finalMessage = "";

    playerHands.forEach((hand, index) => {
      const playerScore = calculateHandValue(hand);
      const betForHand = playerHands.length > 1 ? currentBet : currentBet;

      if (playerScore > 21) {
        finalMessage += (window.i18n ? window.i18n.t('msg.handResult.bust', { hand: index + 1 }) : `Hand ${index + 1}: Bust! You lose.`);
      } else if (dealerScore > 21 || playerScore > dealerScore) {
        finalMessage += (window.i18n ? window.i18n.t('msg.handResult.win', { hand: index + 1 }) : `Hand ${index + 1}: You win!`);
        totalWinnings += betForHand * 2;
      } else if (playerScore < dealerScore) {
        finalMessage += (window.i18n ? window.i18n.t('msg.handResult.dealerWins', { hand: index + 1 }) : `Hand ${index + 1}: Dealer wins.`);
      } else {
        finalMessage += (window.i18n ? window.i18n.t('msg.handResult.push', { hand: index + 1 }) : `Hand ${index + 1}: Push.`);
        totalWinnings += betForHand;
      }
      finalMessage += (playerHands.length > 1 ? "<br>" : "");
    });

    displayMessage(finalMessage);
    playerBalance += totalWinnings;
  }

  currentBet = 0;
  updateUI();
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

  dealerScoreEl.textContent = window.i18n ? window.i18n.t('score.dealer', { score: '?' }) : "Dealer: ?";
  playerScoreEl.textContent = window.i18n ? window.i18n.t('score.player', { score: 0 }) : "Player: 0";

  displayMessage(window.i18n ? window.i18n.t('msg.placeYourBet') : "Place Your Bet", true);
  updateUI();
}

// Event Listeners
chipBtns.forEach((btn) => {
  btn.addEventListener("click", () => placeBet(parseInt(btn.dataset.value)));
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
  resetForNewHand();

  // i18n setup
  if (window.i18n) {
    window.i18n.init();
    
    // Language selector (replaces old buttons)
    const langSelect = document.getElementById('language-select');
    if (langSelect) {
      // Set initial value based on current language
      langSelect.value = window.i18n.getLang();
      
      langSelect.addEventListener('change', (e) => {
        window.i18n.setLang(e.target.value);
      });
    }

    // When language changes, refresh dynamic content (scores, message)
    window.addEventListener('langchange', () => {
      updateScores();
      // If we're in BETTING state, ensure the placeholder message is translated
      if (gameState === 'BETTING') {
        displayMessage(window.i18n.t('msg.placeYourBet'), true);
      }
      // Also update static labels if any dynamic ones are missed
      window.i18n.applyStaticLabels();
      
      // Update language selector value
      const langSelect = document.getElementById('language-select');
      if (langSelect) {
        langSelect.value = window.i18n.getLang();
      }
    });
  }
}

init();

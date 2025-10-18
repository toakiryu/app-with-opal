// Core Blackjack logic module
// Exposes card constants and pure functions via window.Blackjack
// UIやDOM操作は含まず、副作用のない処理のみを提供します。
(function () {
    'use strict';

    const SUITS = ["\u2665", "\u2666", "\u2663", "\u2660"]; // ♥ ♦ ♣ ♠
    const RANKS = [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
        "A",
    ];
    const NUM_DECKS = 6;

    /**
     * Create a fresh shoe of decks.
     * @param {number} numDecks - number of 52-card decks to include
     * @returns {{suit:string, rank:string}[]} new unshuffled deck array
     */
    function createDeck(numDecks = NUM_DECKS) {
        const newDeck = [];
        for (let i = 0; i < numDecks; i++) {
            for (const suit of SUITS) {
                for (const rank of RANKS) {
                    newDeck.push({ suit, rank });
                }
            }
        }
        return newDeck;
    }

    /**
     * Fisher-Yates shuffle (in-place)
     * @param {Array<any>} deck
     */
    function shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    /**
     * Get the blackjack value of a single card.
     * @param {{rank:string}} card
     * @returns {number}
     */
    function getCardValue(card) {
        if (["J", "Q", "K"].includes(card.rank)) return 10;
        if (card.rank === "A") return 11;
        return parseInt(card.rank, 10);
    }

    /**
     * Calculate the best (<=21) value of a blackjack hand.
     * @param {{rank:string}[]} hand
     * @returns {number}
     */
    function calculateHandValue(hand) {
        let value = hand.reduce((sum, card) => sum + getCardValue(card), 0);
        let numAces = hand.filter((card) => card.rank === "A").length;
        while (value > 21 && numAces > 0) {
            value -= 10; // count some Aces as 1 instead of 11
            numAces--;
        }
        return value;
    }

    // Public API
    window.Blackjack = {
        SUITS,
        RANKS,
        NUM_DECKS,
        createDeck,
        shuffleDeck,
        getCardValue,
        calculateHandValue,
    };
})();

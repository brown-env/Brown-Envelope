const homeFlap = document.querySelector('.home-page .flap');
const homeEnvelope = document.querySelector('.home-page .envelope');
const homeCard = document.querySelector('.home-page .card');

let isOpen = false;
let animating = false;

function onFlapClick() {
  if (animating || !homeFlap || !homeEnvelope || !homeCard) return;

  if (!isOpen) {
    animating = true;

    // mark opening state (used for hover effects)
    homeEnvelope.classList.add('opening');

    // open flap
    homeFlap.classList.add('open-flap');

    // flap transition end
    const onFlapTransition = function (e) {
      if (e.propertyName !== 'transform') return;
      homeFlap.removeEventListener('transitionend', onFlapTransition);

      // pull envelope to reveal card
      homeEnvelope.classList.add('pull-envelope');

      const onEnvelopeEnd = function (ev) {
        if (ev.propertyName !== 'transform') return;
        homeEnvelope.removeEventListener('transitionend', onEnvelopeEnd);
        homeEnvelope.classList.remove('opening');
        animating = false;
        isOpen = true;

        // after 1 second, rotate the card
        setTimeout(() => {
          homeCard.classList.add('rotated');
        }, 1000);
      };

      homeEnvelope.addEventListener('transitionend', onEnvelopeEnd);
    };

    homeFlap.addEventListener('transitionend', onFlapTransition);

  } else {
    animating = true;

    // mark reclosing state (subtle hover)
    homeEnvelope.classList.add('reclosing');

    // reset card rotation
    homeCard.classList.remove('rotated');

    // wait for card to shrink/unrotate, then reseal envelope
    setTimeout(() => {
      homeEnvelope.classList.remove('pull-envelope');

      const onEnvelopeTransition = function (e) {
        if (e.propertyName !== 'transform') return;
        homeEnvelope.removeEventListener('transitionend', onEnvelopeTransition);
        homeEnvelope.classList.remove('reclosing');

        // close flap
        homeFlap.classList.remove('open-flap');

        const onFlapClose = function (ev) {
          if (ev.propertyName !== 'transform') return;
          homeFlap.removeEventListener('transitionend', onFlapClose);
          animating = false;
          isOpen = false;
        };

        homeFlap.addEventListener('transitionend', onFlapClose);
      };

      homeEnvelope.addEventListener('transitionend', onEnvelopeTransition);
    }, 1100);
  }
}

if (homeFlap) {
  homeFlap.addEventListener('click', onFlapClick);
}

const musicPage = document.querySelector('.music-page');
if (musicPage) {
  const musicEnvelopes = Array.from(document.querySelectorAll('.music-page .music-envelope-container'));
  const smallScreenQuery = window.matchMedia('(max-width: 1600px)');
  const clearTouchBudge = () => {
    musicEnvelopes.forEach((container) => container.classList.remove('touch-budge'));
  };

  musicEnvelopes.forEach((container) => {
    container.addEventListener('click', (e) => {
      if (!smallScreenQuery.matches) return;
      if (container.classList.contains('is-openable')) return;

      e.preventDefault();

      clearTouchBudge();
      container.classList.add('touch-budge');
      setTimeout(() => {
        container.classList.remove('touch-budge');
      }, 220);
    });
  });

  window.addEventListener('resize', () => {
    if (!smallScreenQuery.matches) {
      clearTouchBudge();
    }
  });
}

const bribeEmailLink = document.querySelector('.bribe-email');
if (bribeEmailLink) {
  const mailtoHref = bribeEmailLink.getAttribute('data-mailto');
  const gmailHref = bribeEmailLink.getAttribute('data-gmail');
  const outlookHref = bribeEmailLink.getAttribute('data-outlook');
  const mailtoFirstQuery = window.matchMedia('(max-width: 1600px)');

  bribeEmailLink.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const openedAt = Date.now();

    if (mailtoFirstQuery.matches) {
      if (mailtoHref) {
        window.location.href = mailtoHref;
      }

      setTimeout(() => {
        if (document.hidden) return;
        if (Date.now() - openedAt < 800) {
          const gmailWindow = gmailHref ? window.open(gmailHref, '_blank', 'noopener') : null;
          if (!gmailWindow) {
            setTimeout(() => {
              if (document.hidden) return;
              if (outlookHref) {
                window.open(outlookHref, '_blank', 'noopener');
              }
            }, 200);
          }
        }
      }, 650);
    } else {
      const gmailWindow = gmailHref ? window.open(gmailHref, '_blank', 'noopener') : null;
      if (!gmailWindow) {
        const outlookWindow = outlookHref ? window.open(outlookHref, '_blank', 'noopener') : null;
        if (!outlookWindow) {
          if (mailtoHref) {
            window.location.href = mailtoHref;
          }
        }
      }
    }
  });
}

const pokerSection = document.querySelector('.bribe-poker');
if (pokerSection) {
  const dealButton = document.getElementById('poker-deal');
  const checkButton = document.getElementById('poker-check');
  const betButton = document.getElementById('poker-bet-btn');
  const callButton = document.getElementById('poker-call');
  const foldButton = document.getElementById('poker-fold');
  const betInput = document.getElementById('poker-bet');
  const message = document.getElementById('poker-message');
  const modal = document.getElementById('poker-modal');
  const modalBack = document.getElementById('poker-modal-back');
  const modalBuy = document.getElementById('poker-modal-buy');
  const modalClose = document.getElementById('poker-modal-close');
  const playerChipsLabel = document.getElementById('poker-player-chips');
  const computerChipsLabel = document.getElementById('poker-computer-chips');
  const potLabel = document.getElementById('poker-pot');
  const playerCards = Array.from(pokerSection.querySelectorAll('.poker-card[data-owner="player"]'));
  const computerCards = Array.from(pokerSection.querySelectorAll('.poker-card[data-owner="computer"]'));
  const communityCards = Array.from(pokerSection.querySelectorAll('.poker-card[data-owner="community"]'));
  const lyricLayoutQuery = window.matchMedia('(max-width: 1300px)');

  const suits = [
    { name: 'Spades', icon: '♠', color: 'black' },
    { name: 'Hearts', icon: '♥', color: 'red' },
    { name: 'Diamonds', icon: '♦', color: 'red' },
    { name: 'Clubs', icon: '♣', color: 'black' }
  ];

  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const rankValues = { A: 14, J: 11, Q: 12, K: 13 };
  const smallBlind = 10;
  const bigBlind = 20;

  let deck = [];
  let deckIndex = 0;
  let playerHand = [];
  let computerHand = [];
  let board = [];
  let stage = 'idle';
  let handActive = false;
  let awaitingPlayer = false;
  let playerChips = 500;
  let computerChips = 500;
  let pot = 0;
  let currentBet = 0;
  let playerBet = 0;
  let computerBet = 0;

  const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const buildDeck = () => {
    deck = [];
    suits.forEach((suit) => {
      ranks.forEach((rank) => {
        deck.push({
          suit: suit.name,
          suitIcon: suit.icon,
          suitColor: suit.color,
          rank,
          value: rankValues[rank] || Number(rank)
        });
      });
    });
    shuffle(deck);
    deckIndex = 0;
  };

  const drawFromDeck = () => {
    if (deckIndex >= deck.length) {
      buildDeck();
    }
    const card = deck[deckIndex];
    deckIndex += 1;
    return card;
  };

  const setMessage = (text) => {
    if (message) {
      message.textContent = text;
    }
  };

  const updateChips = () => {
    if (playerChipsLabel) playerChipsLabel.textContent = playerChips;
    if (computerChipsLabel) computerChipsLabel.textContent = computerChips;
    if (potLabel) potLabel.textContent = pot;

    const maxBet = Math.max(1, Math.min(playerChips, computerChips));
    if (betInput) {
      betInput.max = String(maxBet);
      if (Number(betInput.value) > maxBet) {
        betInput.value = String(maxBet);
      }
    }
  };

  const normalizeBet = (value, max) => {
    const minBet = 5;
    if (max <= minBet) return max;
    if (value >= max) return max;

    let allowed = minBet;
    while (allowed * 2 <= max) {
      allowed *= 2;
    }

    const bet = Math.max(minBet, Math.min(value, max));
    let current = minBet;
    while (current * 2 <= bet) {
      current *= 2;
    }

    if (current > max) current = allowed;
    return current;
  };

  const checkGameOver = () => {
    if (playerChips <= 0) {
      setMessage('Game over.');
      finishHand();
      return true;
    }
    return false;
  };

  const setActionState = ({ canCheck, canBet, canCall, canFold }) => {
    if (checkButton) checkButton.disabled = !canCheck;
    if (betButton) betButton.disabled = !canBet;
    if (callButton) callButton.disabled = !canCall;
    if (foldButton) foldButton.disabled = !canFold;
  };

  const openModal = () => {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  };

  const maybeOfferTrack = () => {
    if (playerChips >= 1000) {
      openModal();
    }
  };

  const applyLyricLayout = (textEl, phrase) => {
    if (!textEl) return;

    textEl.style.removeProperty('--lyric-size');
    textEl.style.removeProperty('--lyric-shift');

    const centerEl = textEl.closest('.card-center');
    if (centerEl) {
      centerEl.style.removeProperty('--lyric-justify');
      centerEl.style.removeProperty('--lyric-top-pad');
    }

    if (!phrase || !lyricLayoutQuery.matches) {
      return;
    }

    const words = phrase.trim().split(/\s+/).filter(Boolean);
    const isShort = words.length <= 7;

    if (centerEl) {
      centerEl.style.setProperty('--lyric-justify', isShort ? 'center' : 'flex-start');
      centerEl.style.setProperty('--lyric-top-pad', isShort ? '0px' : '6px');
    }
  };

  const syncLyricLayout = () => {
    pokerSection.querySelectorAll('.card-text').forEach((textEl) => {
      applyLyricLayout(textEl, textEl.textContent || '');
    });
  };

  if (lyricLayoutQuery.addEventListener) {
    lyricLayoutQuery.addEventListener('change', syncLyricLayout);
  } else if (lyricLayoutQuery.addListener) {
    lyricLayoutQuery.addListener(syncLyricLayout);
  }

  const updateCard = (button, card, faceDown) => {
    const cornerRanks = button.querySelectorAll('.card-corner .rank');
    const cornerSuits = button.querySelectorAll('.card-corner .suit');
    const suit = button.querySelector('.card-suit');
    const text = button.querySelector('.card-text');

    if (!card) {
      button.classList.remove('revealed', 'red');
      cornerRanks.forEach((rankEl) => {
        rankEl.textContent = '';
      });
      cornerSuits.forEach((suitEl) => {
        suitEl.textContent = '';
      });
      if (suit) suit.textContent = '';
      if (text) {
        text.textContent = '';
        applyLyricLayout(text, '');
      }
      return;
    }

    button.classList.toggle('red', card.suitColor === 'red');
    cornerRanks.forEach((rankEl) => {
      rankEl.textContent = card.rank;
    });
    cornerSuits.forEach((suitEl) => {
      suitEl.textContent = card.suitIcon;
    });
    if (suit) suit.textContent = card.suitIcon;
    if (text) {
      text.textContent = card.phrase || '';
      applyLyricLayout(text, card.phrase || '');
    }

    if (faceDown) {
      button.classList.remove('revealed');
    } else {
      button.classList.add('revealed');
    }
  };

  const renderCards = (cards, buttons, { faceDown }) => {
    buttons.forEach((button, index) => {
      updateCard(button, cards[index], faceDown);
    });
  };

  const renderBoard = () => {
    communityCards.forEach((button, index) => {
      const faceDown =
        (stage === 'preflop') ||
        (stage === 'flop' && index >= 3) ||
        (stage === 'turn' && index >= 4);
      updateCard(button, board[index], faceDown);
    });
  };

  const rankName = (score) => {
    const names = [
      'High Card',
      'One Pair',
      'Two Pairs',
      'Three of a Kind',
      'Straight',
      'Flush',
      'Full House',
      'Four of a Kind',
      'Straight Flush',
      'Royal Flush'
    ];
    return names[score] || 'Hand';
  };

  const evaluateHand = (cards) => {
    const values = cards.map((card) => card.value).sort((a, b) => b - a);
    const suitsList = cards.map((card) => card.suit);
    const isFlush = suitsList.every((suit) => suit === suitsList[0]);

    const uniqueValues = Array.from(new Set(values)).sort((a, b) => b - a);
    let isStraight = false;
    let straightHigh = uniqueValues[0];
    if (uniqueValues.length === 5) {
      if (uniqueValues[0] - uniqueValues[4] === 4) {
        isStraight = true;
      } else if (uniqueValues[0] === 14 && uniqueValues[1] === 5 && uniqueValues[4] === 2) {
        isStraight = true;
        straightHigh = 5;
      }
    }

    const counts = new Map();
    values.forEach((value) => {
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    const groups = Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => (b.count - a.count) || (b.value - a.value));

    const countValues = groups.map((group) => group.count);

    if (isStraight && isFlush) {
      if (straightHigh === 14 && uniqueValues[4] === 10) {
        return { rank: 9, tiebreaker: [straightHigh] };
      }
      return { rank: 8, tiebreaker: [straightHigh] };
    }
    if (countValues[0] === 4) {
      return { rank: 7, tiebreaker: [groups[0].value, groups[1].value] };
    }
    if (countValues[0] === 3 && countValues[1] === 2) {
      return { rank: 6, tiebreaker: [groups[0].value, groups[1].value] };
    }
    if (isFlush) {
      return { rank: 5, tiebreaker: values };
    }
    if (isStraight) {
      return { rank: 4, tiebreaker: [straightHigh] };
    }
    if (countValues[0] === 3) {
      return { rank: 3, tiebreaker: [groups[0].value, ...groups.slice(1).map((g) => g.value)] };
    }
    if (countValues[0] === 2 && countValues[1] === 2) {
      const pairValues = groups.filter((g) => g.count === 2).map((g) => g.value).sort((a, b) => b - a);
      const kicker = groups.find((g) => g.count === 1)?.value || 0;
      return { rank: 2, tiebreaker: [...pairValues, kicker] };
    }
    if (countValues[0] === 2) {
      return { rank: 1, tiebreaker: [groups[0].value, ...groups.slice(1).map((g) => g.value)] };
    }
    return { rank: 0, tiebreaker: values };
  };

  const compareHands = (playerScore, computerScore) => {
    if (playerScore.rank > computerScore.rank) return 1;
    if (playerScore.rank < computerScore.rank) return -1;

    const len = Math.max(playerScore.tiebreaker.length, computerScore.tiebreaker.length);
    for (let i = 0; i < len; i += 1) {
      const p = playerScore.tiebreaker[i] || 0;
      const c = computerScore.tiebreaker[i] || 0;
      if (p > c) return 1;
      if (p < c) return -1;
    }
    return 0;
  };

  const bestHandScore = (cards) => {
    let best = null;
    for (let i = 0; i < cards.length; i += 1) {
      for (let j = i + 1; j < cards.length; j += 1) {
        for (let k = j + 1; k < cards.length; k += 1) {
          for (let l = k + 1; l < cards.length; l += 1) {
            for (let m = l + 1; m < cards.length; m += 1) {
              const score = evaluateHand([cards[i], cards[j], cards[k], cards[l], cards[m]]);
              if (!best || compareHands(score, best) > 0) {
                best = score;
              }
            }
          }
        }
      }
    }
    return best;
  };

  const resetBets = () => {
    playerBet = 0;
    computerBet = 0;
    currentBet = 0;
  };

  const finishHand = () => {
    handActive = false;
    dealButton.disabled = false;
    setActionState({ canCheck: false, canBet: false, canCall: false, canFold: false });
  };

  const resolveShowdown = () => {
    renderCards(computerHand, computerCards, { faceDown: false });
    renderBoard();

    const playerScore = bestHandScore([...playerHand, ...board]);
    const computerScore = bestHandScore([...computerHand, ...board]);
    const result = compareHands(playerScore, computerScore);
    const playerHandName = rankName(playerScore.rank);
    const computerHandName = rankName(computerScore.rank);

    if (result > 0) {
      playerChips += pot;
      setMessage(`You win! Your hand: ${playerHandName}. House: ${computerHandName}.`);
      maybeOfferTrack();
    } else if (result < 0) {
      computerChips += pot;
      setMessage(`House wins. Your hand: ${playerHandName}. House: ${computerHandName}.`);
    } else {
      const split = pot / 2;
      playerChips += split;
      computerChips += split;
      setMessage(`Push. Both show ${playerHandName}.`);
    }

    pot = 0;
    updateChips();
    if (!checkGameOver()) {
      finishHand();
    }
  };

  const advanceStage = (note) => {
    if (stage === 'preflop') {
      stage = 'flop';
    } else if (stage === 'flop') {
      stage = 'turn';
    } else if (stage === 'turn') {
      stage = 'river';
    } else if (stage === 'river') {
      stage = 'showdown';
    }

    resetBets();
    renderBoard();

    if (stage === 'showdown') {
      resolveShowdown();
      return;
    }

    const stageLabel = `${stage.charAt(0).toUpperCase() + stage.slice(1)}`;
    if (note) {
      setMessage(`${note} Your turn: check or bet.`);
    } else {
      setMessage('Your turn: check or bet.');
    }
    setActionState({ canCheck: true, canBet: true, canCall: false, canFold: true });
  };

  const maybeHouseAction = () => {
    const willBet = Math.random() < 0.35;
    if (!willBet) {
      advanceStage('House checks.');
      return;
    }

    const betValue = Number(betInput?.value) || 0;
    const bet = normalizeBet(betValue, Math.min(computerChips, playerChips));
    if (bet <= 0) {
      advanceStage('House checks.');
      return;
    }

    computerChips -= bet;
    pot += bet;
    computerBet += bet;
    currentBet = computerBet;
    awaitingPlayer = true;
    updateChips();
    setMessage(`House bets ${bet}. Your move: call or fold.`);
    setActionState({ canCheck: false, canBet: false, canCall: true, canFold: true });
  };

  const endBettingRoundIfMatched = (note) => {
    if (playerBet === computerBet) {
      awaitingPlayer = false;
      advanceStage(note);
    }
  };

  const onCheck = () => {
    if (!handActive || awaitingPlayer) return;
    if (currentBet > playerBet) return;
    setMessage('You check. House is deciding...');
    maybeHouseAction();
  };

  const onBet = () => {
    if (!handActive || awaitingPlayer) return;
    const raiseValue = normalizeBet(Number(betInput?.value) || 0, playerChips);
    const toCall = Math.max(0, currentBet - playerBet);
    const total = Math.min(toCall + raiseValue, playerChips);
    if (total <= 0) return;

    if (betInput) {
      betInput.value = String(raiseValue);
    }

    playerChips -= total;
    pot += total;
    playerBet += total;
    currentBet = playerBet;
    updateChips();

    const aiCalls = Math.random() < 0.65;
    if (!aiCalls) {
      const potWon = pot;
      playerChips += pot;
      pot = 0;
      updateChips();
      setMessage(`House folds. You win the pot (${potWon}).`);
      maybeOfferTrack();
      finishHand();
      return;
    }

    const callAmount = Math.min(currentBet - computerBet, computerChips);
    computerChips -= callAmount;
    pot += callAmount;
    computerBet += callAmount;
    currentBet = playerBet;
    updateChips();
    setMessage(`House calls ${callAmount}. Next round.`);
    endBettingRoundIfMatched(`House calls ${callAmount}.`);
  };

  const onCall = () => {
    if (!handActive || !awaitingPlayer) return;
    const callAmount = Math.min(currentBet - playerBet, playerChips);
    playerChips -= callAmount;
    pot += callAmount;
    playerBet += callAmount;
    currentBet = computerBet;
    updateChips();
    setMessage(`You call ${callAmount}. Next round.`);
    endBettingRoundIfMatched(`You call ${callAmount}.`);
  };

  const onFold = () => {
    if (!handActive) return;
    const potWon = pot;
    computerChips += pot;
    pot = 0;
    updateChips();
    setMessage(`You fold. House wins the pot (${potWon}).`);
    if (!checkGameOver()) {
      finishHand();
    }
  };

  const postBlinds = () => {
    const sb = Math.min(smallBlind, playerChips);
    const bb = Math.min(bigBlind, computerChips);
    playerChips -= sb;
    computerChips -= bb;
    pot = sb + bb;
    playerBet = sb;
    computerBet = bb;
    currentBet = bb;
  };

  const dealHand = () => {
    if (playerChips < 5 || computerChips < 5) {
      setMessage('Game over.');
      finishHand();
      return;
    }
    const phrases = [
      'Hold on, wait',
      'Today you set me straight',
      'Now I can’t concentrate',
      'You lie, sometimes',
      'Keep speaking but say nothing',
      'Your house is flooding',
      'The carpet floor is soaking',
      'The walls will melt away',
      'Voices turn to colours',
      'Visions to shapes',
      'Word goes around',
      'Half stories won’t run out at all',
      'And I still doubt',
      'Every word that’s uttered from the mouth',
      'But time won’t stop',
      'How am I supposed to leave it?',
      'Some heaven sent its waves to have me drowned',
      'Please don’t stop',
      'How am I supposed to stick around?'
    ];
    const shuffledPhrases = shuffle([...phrases]);
    buildDeck();
    playerHand = [];
    computerHand = [];
    playerHand = [drawFromDeck(), drawFromDeck()];
    computerHand = [drawFromDeck(), drawFromDeck()];
    board = [drawFromDeck(), drawFromDeck(), drawFromDeck(), drawFromDeck(), drawFromDeck()];

    const allCards = [...playerHand, ...computerHand, ...board];
    allCards.forEach((card, index) => {
      card.phrase = shuffledPhrases[index];
    });
    stage = 'preflop';
    handActive = true;
    awaitingPlayer = false;
    resetBets();
    postBlinds();

    renderCards(playerHand, playerCards, { faceDown: false });
    renderCards(computerHand, computerCards, { faceDown: true });
    renderBoard();
    updateChips();

    setMessage('New hand. Call, bet, or fold.');
    setActionState({
      canCheck: currentBet === playerBet,
      canBet: true,
      canCall: currentBet > playerBet,
      canFold: true
    });
    dealButton.disabled = true;
  };

  const resetHand = () => {
    playerHand = [];
    computerHand = [];
    board = [];
    stage = 'idle';
    handActive = false;
    awaitingPlayer = false;
    pot = 0;
    resetBets();
    dealButton.disabled = false;
    setActionState({ canCheck: false, canBet: false, canCall: false, canFold: false });
    [...playerCards, ...computerCards, ...communityCards].forEach((button) => {
      updateCard(button, null, true);
      button.setAttribute('aria-pressed', 'false');
    });
    updateChips();
    setMessage('Deal to begin.');
  };

  const resetGame = () => {
    playerChips = 500;
    computerChips = 500;
    pot = 0;
    resetHand();
  };

  dealButton?.addEventListener('click', dealHand);
  checkButton?.addEventListener('click', onCheck);
  betButton?.addEventListener('click', onBet);
  callButton?.addEventListener('click', onCall);
  foldButton?.addEventListener('click', onFold);

  modalBack?.addEventListener('click', () => {
    closeModal();
    resetGame();
  });

  modalClose?.addEventListener('click', () => {
    closeModal();
  });

  modalBuy?.addEventListener('click', () => {
    playerChips = 0;
    pot = 0;
    updateChips();
    closeModal();
    window.open('https://soundcloud.com/brown-envelope/immram-acoustic-demo/s-5e9OGqStX08?si=3278c8b7d7194c6888a706211f557343&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing', '_blank', 'noopener');
  });

  resetHand();
}

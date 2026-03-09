// Precipitate Pursuit – Game Logic
// Refactored from monolithic HTML into SciSim module

document.addEventListener('DOMContentLoaded', () => {

  // --- DOM ELEMENT REFERENCES ---
  const get = (id) => document.getElementById(id);
  const nameEntryScreen = get('name-entry-screen');
  const gameContainer = get('game-container');
  const gameBoard = get('game-board');
  const controlsArea = get('controls-area');
  const startGameButton = get('start-game-button');
  const playerNameInput = get('player-name');
  const difficultySelect = get('difficulty');
  const formSetButton = get('form-set-button');
  const skipTurnButton = get('skip-turn-button');
  const sabotageButton = get('sabotage-button');
  const logDiv = get('log');
  const pendingSetDiv = get('pending-set');
  const countdownDiv = get('countdown');
  const deckCounter = get('deck-counter');
  const deckImage = get('deck-image');
  const messageModal = get('message-modal');
  const modalText = get('modal-text');
  const modalCloseButton = get('modal-close-button');

  // --- ASSETS & CONFIGURATION ---
  const assetBaseURL = "images/";
  const cardBackURL = "images/back-of-card.png";
  const cationImages = {
    "Ca2+": assetBaseURL + "Ca2%2B.PNG", "Zn2+": assetBaseURL + "Zn2%2B.PNG", "Pb2+": assetBaseURL + "Pb2%2B.PNG",
    "Al3+": assetBaseURL + "Al3%2B.PNG", "Fe2+": assetBaseURL + "Fe2%2B.PNG", "Fe3+": assetBaseURL + "Fe3%2B.PNG", "Cu2+": assetBaseURL + "Cu2%2B.PNG"
  };
  const ohImage = assetBaseURL + "OH-.PNG";
  const reagentImages = { "NaOH(aq)": assetBaseURL + "NaOH.PNG", "NH3(aq)": assetBaseURL + "NH3.PNG" };

  const cationData = {
    "Ca2+": { requiredOH: 2, soluble: { NaOH: false, NH3: false } }, "Zn2+": { requiredOH: 2, soluble: { NaOH: true, NH3: true } },
    "Pb2+": { requiredOH: 2, soluble: { NaOH: true, NH3: false } }, "Al3+": { requiredOH: 3, soluble: { NaOH: true, NH3: false } },
    "Fe2+": { requiredOH: 2, soluble: { NaOH: false, NH3: false } }, "Fe3+": { requiredOH: 3, soluble: { NaOH: false, NH3: false } },
    "Cu2+": { requiredOH: 2, soluble: { NaOH: false, NH3: true } }
  };

  let deck = [];
  let discardPile = [];
  let players = [];
  let currentPlayerId = 0;
  const turnOrder = [0, 2, 1, 3];
  let turnIndex = 0;
  let sabotageTimers = [];

  let humanSelection = { indices: [], cards: [] };
  const startingHandSize = 6;

  let pendingSet = null;
  let pendingSetPlayer = null;
  let pendingSetCountdown = 0;
  let pendingSetInterval = null;
  let gameActive = false;
  let gameDifficulty = 'advanced';
  let spectatorMode = true;

  // --- Dynamic Sizing ---
  const updateBoardSize = () => {
    const size = gameBoard.clientWidth;
    gameBoard.style.setProperty('--board-size', `${size}px`);
  };
  window.addEventListener('resize', updateBoardSize);

  // --- GAME START ---
  function initializeGame() {
    gameActive = true;
    gameDifficulty = difficultySelect.value;
    createDeck();
    shuffleDeck(deck);
    discardPile = [];

    players = [
      { id: 0, name: playerNameInput.value.trim() || "You", benchId: 'player-0-bench', nameId: 'player-0-name' },
      { id: 1, name: "Alice", benchId: 'player-1-bench', nameId: 'player-1-name' },
      { id: 2, name: "Beth", benchId: 'player-2-bench', nameId: 'player-2-name' },
      { id: 3, name: "Cathy", benchId: 'player-3-bench', nameId: 'player-3-name' }
    ];

    players.forEach(p => p.hand = deck.splice(0, startingHandSize));

    turnIndex = 0;
    currentPlayerId = turnOrder[turnIndex];
    humanSelection = { indices: [], cards: [] };
    pendingSet = null;
    if (pendingSetInterval) clearInterval(pendingSetInterval);

    logDiv.innerHTML = '';
    logMessage(`<strong>Game started!</strong> Difficulty: ${gameDifficulty}.`);
    logMessage(`It's <strong>your</strong> turn.`);

    setTimeout(() => {
      updateBoardSize();
      updateAllDisplays();
    }, 0);
  }

  // --- UI & DISPLAY ---
  function updateAllDisplays() {
    players.forEach(player => updatePlayerDisplay(player.id));
    updateCommonTable();
    updateControls();
    updateDeckCounter();
  }

  function updateDeckCounter() {
    deckCounter.textContent = `Deck: ${deck.length}`;
    deckImage.style.display = deck.length > 0 ? 'block' : 'none';
  }

  function updatePlayerDisplay(playerId) {
    const player = players.find(p => p.id === playerId);
    const benchDiv = get(player.benchId);
    const nameDiv = get(player.nameId);
    if (!benchDiv || !nameDiv) return;

    benchDiv.innerHTML = '';
    benchDiv.className = 'bench';

    nameDiv.innerHTML = '';
    nameDiv.className = 'player-name-tag';

    nameDiv.textContent = `${player.name} (${player.hand.length})`;
    if (player.id === currentPlayerId && !pendingSet) {
      nameDiv.classList.add('active-player');
    } else if (pendingSet && pendingSetPlayer === player.id) {
      nameDiv.classList.add('pending-player');
    }

    const handDiv = document.createElement('div');
    handDiv.className = 'player-hand';
    handDiv.id = `player-${player.id}-hand`;

    if (player.id === 2 || player.id === 3) {
      handDiv.style.flexDirection = 'column';
      handDiv.style.gap = `calc(var(--board-size) * -0.11)`;
    } else {
      handDiv.style.flexDirection = 'row';
      handDiv.style.gap = `calc(var(--board-size) * 0.01)`;
    }

    player.hand.forEach((card, i) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'game-card';
      const showFront = spectatorMode || player.id === 0;
      cardEl.innerHTML = `<img src="${showFront ? card.img : cardBackURL}" alt="card">`;

      if (player.id === 0) {
        cardEl.id = `card-0-${i}`;
        cardEl.classList.add('clickable');
        cardEl.onclick = () => toggleHumanCard(i);
        if (humanSelection.indices.includes(i)) cardEl.classList.add('selected');
      }
      if (player.id === 2) cardEl.style.transform = 'rotate(90deg)';
      if (player.id === 3) cardEl.style.transform = 'rotate(-90deg)';

      handDiv.appendChild(cardEl);
    });

    if (player.id === 0) { benchDiv.style.cssText = 'bottom: 0; left: 50%; transform: translateX(-50%) translateY(48%);'; nameDiv.style.cssText += 'bottom: 13.5%; left: 50%; transform: translateX(-50%);'; }
    else if (player.id === 1) { benchDiv.style.cssText = 'top: 0; left: 50%; transform: translateX(-50%) translateY(-48%);'; nameDiv.style.cssText += 'top: 13.5%; left: 50%; transform: translateX(-50%);'; }
    else if (player.id === 2) { benchDiv.style.cssText = 'top: 50%; left: 0; transform: translateY(-50%) translateX(-48%);'; nameDiv.style.cssText += 'left: 13.5%; top: 50%; transform: translateY(-50%) rotate(-90deg);'; }
    else if (player.id === 3) { benchDiv.style.cssText = 'top: 50%; right: 0; transform: translateY(-50%) translateX(48%);'; nameDiv.style.cssText += 'right: 13.5%; top: 50%; transform: translateY(-50%) rotate(90deg);'; }

    benchDiv.appendChild(handDiv);
  }

  function updateCommonTable() {
    pendingSetDiv.innerHTML = "";
    if (pendingSet) {
      const player = players.find(p => p.id === pendingSetPlayer);
      countdownDiv.innerHTML = `Set by <span style="color:var(--color-warning)">${player.name}</span><br>Confirming: <span style="color:var(--color-danger)">${pendingSetCountdown}</span>s`;
      pendingSet.forEach(card => {
        const miniCard = document.createElement('div');
        miniCard.className = 'pending-mini-card';
        miniCard.innerHTML = `<img src="${card.img}" alt="card">`;
        pendingSetDiv.appendChild(miniCard);
      });
    } else {
      countdownDiv.textContent = "";
      pendingSetDiv.innerHTML = `<span style="color:rgba(255,255,255,0.5)">Table is clear</span>`;
    }
  }

  function updateControls() {
    const isHumanTurn = (currentPlayerId === 0);
    formSetButton.disabled = !isHumanTurn || pendingSet !== null;
    skipTurnButton.disabled = !isHumanTurn || pendingSet !== null;
    sabotageButton.disabled = pendingSet === null || pendingSetPlayer === 0;
  }

  // --- UTILITY & HELPER FUNCTIONS ---
  const createDeck = () => { deck = []; Object.keys(cationData).forEach(ion => { for (let i=0; i<2; i++) deck.push({ type: "cation", ion, requiredOH: cationData[ion].requiredOH, img: cationImages[ion] }); }); for (let i=0; i<20; i++) deck.push({ type: "OH", img: ohImage }); for (let i=0; i<4; i++) { deck.push({ type: "reagent", reagent: "NaOH(aq)", img: reagentImages["NaOH(aq)"] }); deck.push({ type: "reagent", reagent: "NH3(aq)", img: reagentImages["NH3(aq)"] }); } };
  const shuffleDeck = (array) => { for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; } };
  const showMessage = (msg) => { modalText.textContent = msg; messageModal.classList.remove('hidden'); };
  const logMessage = (msg) => { const p = document.createElement('p'); p.innerHTML = msg; logDiv.appendChild(p); logDiv.scrollTop = logDiv.scrollHeight; };
  const isValidSet = (cards) => { if (!cards || cards.length === 0) return false; const cationCards = cards.filter(c => c.type === "cation"); const ohCards = cards.filter(c => c.type === "OH"); if(cationCards.length !== 1) return false; const requiredOH = cationCards[0].requiredOH; return cards.length === (1 + requiredOH) && ohCards.length === requiredOH; };

  // --- GAME LOGIC FUNCTIONS ---
  function toggleHumanCard(index) {
    if (!gameActive) return;
    const pos = humanSelection.indices.indexOf(index);
    const cardEl = document.getElementById(`card-0-${index}`);
    if (!cardEl) return;
    if (pos >= 0) { humanSelection.indices.splice(pos, 1); cardEl.classList.remove('selected'); }
    else { humanSelection.indices.push(index); cardEl.classList.add('selected'); }
    humanSelection.cards = players[0].hand.filter((_, i) => humanSelection.indices.includes(i));
  }

  function formSet() {
    if (currentPlayerId !== 0 || pendingSet) return;
    if (!isValidSet(humanSelection.cards)) { showMessage("The selected cards do not form a valid precipitate set."); return; }

    pendingSet = [...humanSelection.cards];
    pendingSetPlayer = currentPlayerId;

    humanSelection.indices.sort((a, b) => b - a).forEach(i => players[0].hand.splice(i, 1));
    humanSelection = { indices: [], cards: [] };

    logMessage(`<strong>You</strong> formed a pending set.`);
    startCountdown(7);
  }

  function drawCardAndSkip() {
    const player = players.find(p => p.id === currentPlayerId);
    if (deck.length > 0) {
      player.hand.push(deck.pop());
      logMessage(`<strong>${player.name}</strong> drew a card.`);
      if (deck.length === 0) { endGame(); return; }
    } else {
      logMessage("Deck is empty.");
    }
    logMessage(`<strong>${player.name}</strong> skipped their turn.`);
    endTurn();
  }

  function sabotageAttempt(saboteurId) {
    if (!pendingSet) return false;
    const saboteur = players.find(p => p.id === saboteurId);
    if (pendingSetPlayer === saboteur.id) {
      if(saboteur.id === 0) showMessage("You cannot sabotage your own set.");
      return false;
    }

    const cationCard = pendingSet.find(card => card.type === "cation"); if (!cationCard) return false;
    const ionName = cationCard.ion, cationInfo = cationData[ionName];

    const reagentCard = saboteur.hand.find(card =>
      (cationInfo.soluble.NaOH && card.reagent === 'NaOH(aq)') ||
      (cationInfo.soluble.NH3 && card.reagent === 'NH3(aq)')
    );

    if (!reagentCard) {
      if(saboteur.id === 0) showMessage("You don't have the correct reagent to sabotage this set.");
      return false;
    }

    const opponent = players.find(p => p.id === pendingSetPlayer);
    const setThatWasSabotaged = [...pendingSet];

    clearPendingSet();

    const reagentIndex = saboteur.hand.indexOf(reagentCard);
    saboteur.hand.splice(reagentIndex, 1);

    logMessage(`<strong>${saboteur.name}</strong> sabotaged <strong>${opponent.name}'s</strong> set!`);

    opponent.hand.push(...setThatWasSabotaged);
    discardPile.push(reagentCard, ...setThatWasSabotaged);

    turnIndex = turnOrder.indexOf(saboteur.id);
    currentPlayerId = saboteur.id;
    logMessage(`The turn now passes to <strong>${saboteur.name}</strong>.`);
    updateAllDisplays();
    if (currentPlayerId !== 0) setTimeout(processComputerTurn, 2000);
    return true;
  }

  function startCountdown(seconds) {
    pendingSetCountdown = seconds;
    if (pendingSetInterval) clearInterval(pendingSetInterval);
    sabotageTimers.forEach(clearTimeout);
    sabotageTimers = [];

    updateAllDisplays();

    pendingSetInterval = setInterval(() => {
      pendingSetCountdown--;
      if (pendingSetCountdown <= 0) { finalizePendingSet(); }
      updateCommonTable();
    }, 1000);

    players.forEach(p => {
      if (p.id !== pendingSetPlayer && p.id !== 0) {
        let delay;
        switch(gameDifficulty) {
          case 'beginner': delay = 3000 + Math.random() * 3000; break;
          case 'intermediate': delay = 2000 + Math.random() * 2000; break;
          default: delay = 1000 + Math.random() * 1500; break;
        }
        const timerId = setTimeout(() => sabotageAttempt(p.id), delay);
        sabotageTimers.push(timerId);
      }
    });
  }

  function clearPendingSet() {
    clearInterval(pendingSetInterval);
    sabotageTimers.forEach(clearTimeout);
    sabotageTimers = [];
    pendingSet = null;
    pendingSetPlayer = null;
    updateAllDisplays();
  }

  function finalizePendingSet() {
    if (!pendingSet) return;
    const playerWhoSet = players.find(p => p.id === pendingSetPlayer);
    logMessage(`<strong style="color:var(--color-success)">${playerWhoSet.name}'s</strong> set is confirmed!`);
    discardPile.push(...pendingSet);

    if (playerWhoSet.hand.length === 0) { endGame(playerWhoSet); return; }

    turnIndex = (turnOrder.indexOf(playerWhoSet.id) + 1) % turnOrder.length;
    currentPlayerId = turnOrder[turnIndex];

    clearPendingSet();

    logMessage(`It's now <strong>${players.find(p=>p.id === currentPlayerId).name}'s</strong> turn.`);
    if (currentPlayerId !== 0) setTimeout(processComputerTurn, 2000);
  }

  function endTurn() {
    turnIndex = (turnIndex + 1) % turnOrder.length;
    currentPlayerId = turnOrder[turnIndex];
    logMessage(`It's now <strong>${players.find(p=>p.id === currentPlayerId).name}'s</strong> turn.`);
    updateAllDisplays();
    if (currentPlayerId !== 0) setTimeout(processComputerTurn, 2000);
  }

  function endGame(winner = null) {
    gameActive = false;
    clearPendingSet();

    if (winner) {
      showMessage(`${winner.name} won by discarding all their cards!`);
      logMessage(`<strong>GAME OVER! Winner: ${winner.name}</strong>`);
    } else {
      logMessage(`The deck is empty! The game is over.`);
      let minCards = Infinity;
      let winners = [];
      players.forEach(p => {
        if (p.hand.length < minCards) { minCards = p.hand.length; winners = [p]; }
        else if (p.hand.length === minCards) { winners.push(p); }
      });
      const winnerNames = winners.map(w => w.name).join(' & ');
      showMessage(`${winnerNames} won with the fewest cards! (${minCards})`);
      logMessage(`<strong>GAME OVER! Winner: ${winnerNames}</strong>`);
    }

    controlsArea.style.display = 'none';
  }

  function processComputerTurn() {
    const computer = players.find(p => p.id === currentPlayerId);
    logMessage(`<strong>${computer.name}</strong> is thinking...`);

    if (pendingSet) {
      sabotageAttempt(computer.id);
      setTimeout(endTurn, 1000);
      return;
    }

    let actionProbability;
    switch(gameDifficulty) {
      case 'beginner': actionProbability = 0.5; break;
      case 'intermediate': actionProbability = 0.8; break;
      default: actionProbability = 1.0; break;
    }
    if (Math.random() <= actionProbability && computerAttemptFormSet(computer)) { return; }
    drawCardAndSkip();
  }

  function computerAttemptFormSet(computer) {
    let cationCardInSet = null, ohCardsForSet = [], setCardIndices = [];
    for (let i = 0; i < computer.hand.length; i++) {
      const potentialCation = computer.hand[i];
      if (potentialCation.type === 'cation') {
        const requiredOH = potentialCation.requiredOH, availableOHIndices = [];
        for(let j = 0; j < computer.hand.length; j++) { if (i === j) continue; if (computer.hand[j].type === 'OH') availableOHIndices.push(j); }
        if (availableOHIndices.length >= requiredOH) {
          cationCardInSet = potentialCation; setCardIndices.push(i);
          const ohIndicesForSet = availableOHIndices.slice(0, requiredOH); setCardIndices.push(...ohIndicesForSet);
          ohCardsForSet = ohIndicesForSet.map(idx => computer.hand[idx]); break;
        }
      }
    }
    if (cationCardInSet) {
      pendingSet = [cationCardInSet, ...ohCardsForSet]; pendingSetPlayer = computer.id;
      setCardIndices.sort((a, b) => b - a).forEach(index => computer.hand.splice(index, 1));
      logMessage(`<strong>${computer.name}</strong> formed a pending set.`);
      startCountdown(7);
      return true;
    } return false;
  }

  // --- EVENT LISTENERS ---
  startGameButton.addEventListener('click', () => {
    nameEntryScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    gameContainer.style.display = 'flex';
    initializeGame();
  });
  playerNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') startGameButton.click(); });
  formSetButton.addEventListener('click', formSet);
  skipTurnButton.addEventListener('click', drawCardAndSkip);
  sabotageButton.addEventListener('click', () => sabotageAttempt(0));
  modalCloseButton.addEventListener('click', () => { messageModal.classList.add('hidden'); });

});

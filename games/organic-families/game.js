// Happy Family: Organic Chemistry Edition – Game Logic

const baseURL = 'images/';
const fullCardList = [
  { group: 'Alkane', element: 'Methane', img: baseURL + 'methane.PNG' }, { group: 'Alkane', element: 'Ethane', img: baseURL + 'ethane.PNG' },
  { group: 'Alkane', element: 'Propane', img: baseURL + 'propane.PNG' }, { group: 'Alkane', element: 'Butane', img: baseURL + 'butane.PNG' },
  { group: 'Alkane', element: 'Pentane', img: baseURL + 'pentane.PNG' }, { group: 'Alkane', element: 'Hexane', img: baseURL + 'hexane.PNG' },
  { group: 'Alkene', element: 'Ethene', img: baseURL + 'ethene.PNG' }, { group: 'Alkene', element: 'Propene', img: baseURL + 'propene.PNG' },
  { group: 'Alkene', element: 'Butene', img: baseURL + 'butene.PNG' }, { group: 'Alkene', element: 'Pentene', img: baseURL + 'pentene.PNG' },
  { group: 'Alkene', element: 'Hexene', img: baseURL + 'hexene.PNG' }, { group: 'Alkene', element: 'Heptene', img: baseURL + 'heptene.PNG' },
  { group: 'Alcohol', element: 'Methanol', img: baseURL + 'methanol.PNG' }, { group: 'Alcohol', element: 'Ethanol', img: baseURL + 'ethanol.PNG' },
  { group: 'Alcohol', element: 'Propanol', img: baseURL + 'propanol.PNG' }, { group: 'Alcohol', element: 'Butanol', img: baseURL + 'butanol.PNG' },
  { group: 'Alcohol', element: 'Pentanol', img: baseURL + 'pentanol.PNG' }, { group: 'Alcohol', element: 'Hexanol', img: baseURL + 'hexanol.PNG' },
  { group: 'Acid', element: 'Methanoic Acid', img: baseURL + 'methanoic%20acid.PNG' }, { group: 'Acid', element: 'Ethanoic Acid', img: baseURL + 'ethanoic%20acid.PNG' },
  { group: 'Acid', element: 'Propanoic Acid', img: baseURL + 'propanoic%20acid.PNG' }, { group: 'Acid', element: 'Butanoic Acid', img: baseURL + 'butanoic%20acid.PNG' },
  { group: 'Acid', element: 'Pentanoic Acid', img: baseURL + 'pentanoic%20acid.PNG' }, { group: 'Acid', element: 'Hexanoic Acid', img: baseURL + 'hexanoic%20acid.PNG' }
];
const SERIES_COUNT = 4;
const groupRepresentativeImages = {
  'Alkane': baseURL + 'hexane.PNG', 'Alkene': baseURL + 'heptene.PNG',
  'Alcohol': baseURL + 'hexanol.PNG', 'Acid': baseURL + 'hexanoic%20acid.PNG'
};

let players = [], deck = [], currentPlayerIndex = 0, difficultyLevel = "beginner", gameInProgress = false, numPlayers = 4;
const nameEntryDiv = document.getElementById('name-entry'), tableDiv = document.getElementById('table'),
      controlsDiv = document.getElementById('controls'), logDiv = document.getElementById('log'),
      humanControlsDiv = document.getElementById('human-controls'), playerNameInput = document.getElementById('player-name-input');

function logMessage(message) {
  const p = document.createElement('p');
  p.innerHTML = message; logDiv.appendChild(p);
  logDiv.scrollTop = logDiv.scrollHeight;
}
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
function getPlayerName(index) { return players[index].name; }

function updatePlayerDisplays() {
  const hand0 = document.getElementById('hand-0');
  hand0.innerHTML = '';
  players[0].hand.sort((a,b) => a.group.localeCompare(b.group) || a.element.localeCompare(b.element));
  players[0].hand.forEach(card => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'playing-card';
    cardDiv.innerHTML = `<img src="${card.img}" alt="${card.element}" title="${card.element}">`;
    hand0.appendChild(cardDiv);
  });
  for (let i = 1; i < numPlayers; i++) {
    const handDiv = document.getElementById(`hand-${i}`);
    if (!handDiv) continue;
    handDiv.innerHTML = '';
    players[i].hand.forEach(() => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'playing-card';
      cardDiv.innerHTML = `<img src="${baseURL}back-of-card.png" alt="card back">`;
      handDiv.appendChild(cardDiv);
    });
  }
}

function updateCompletedDisplays() {
  for (let i = 0; i < numPlayers; i++) {
    const compDiv = document.getElementById(`completed-${i}`);
    if (!compDiv) continue;
    compDiv.innerHTML = '';
    players[i].completedFamilies.forEach(group => {
      const imgSrc = groupRepresentativeImages[group];
      if (imgSrc) compDiv.innerHTML += `<img src="${imgSrc}" alt="${group}" title="${group}">`;
    });
  }
}

function updateControls() {
  document.querySelectorAll('.player-seat').forEach(seat => seat.classList.remove('active'));
  if (gameInProgress) document.getElementById(`player-${currentPlayerIndex}`).classList.add('active');
  humanControlsDiv.style.display = (currentPlayerIndex === 0 && gameInProgress) ? 'flex' : 'none';
  if (currentPlayerIndex === 0 && gameInProgress) updateHumanControls();
}

function updateHumanControls() {
  difficultyLevel = document.getElementById('difficulty').value;
  humanControlsDiv.innerHTML = `<label for="target-player">Ask:</label> <select id="target-player"></select>
                                 <label for="card-choice">for:</label> <select id="card-choice"></select>
                                 <button id="ask-button">Ask</button>`;
  const cardChoiceDropdown = document.getElementById('card-choice');
  let options = (difficultyLevel === 'beginner') ?
    fullCardList.map(card => card.element) : fullCardList.map(card => card.element).sort();
  cardChoiceDropdown.innerHTML = '';
  options.forEach(el => {
    let option = document.createElement('option');
    option.value = el; option.text = el;
    cardChoiceDropdown.appendChild(option);
  });
  const targetPlayerDropdown = document.getElementById('target-player');
  targetPlayerDropdown.innerHTML = '';
  for (let i = 1; i < numPlayers; i++) {
    if (players[i].hand.length > 0) {
      let option = document.createElement('option');
      option.value = i; option.text = players[i].name;
      targetPlayerDropdown.appendChild(option);
    }
  }
  document.getElementById('ask-button').addEventListener('click', handleHumanAsk);
}

function initializeGame() {
  gameInProgress = true;
  numPlayers = parseInt(document.getElementById('num-players').value);
  players = [];
  for (let i = 0; i < numPlayers; i++) players.push({ id: i, hand: [], completedFamilies: [] });

  players[0].name = playerNameInput.value.trim() || "You";
  document.getElementById('name-0').textContent = players[0].name;

  const computerPlayerContainer = document.getElementById('computer-players-container');
  computerPlayerContainer.innerHTML = '';
  let names = ["Alice", "Bob", "Cathy", "David", "Edward"];
  shuffleArray(names);
  for(let i=1; i < numPlayers; i++) {
    players[i].name = names[i-1];
    const playerSeatHTML = `<div id="player-${i}" class="player-seat">
                                <div class="player-name" id="name-${i}">${players[i].name}</div>
                                <div class="hand computer" id="hand-${i}"></div>
                                <div class="completed-families" id="completed-${i}"></div>
                            </div>`;
    computerPlayerContainer.innerHTML += playerSeatHTML;
  }

  deck = [...fullCardList];
  shuffleArray(deck);
  while (deck.length > 0) {
    for (let i = 0; i < players.length && deck.length > 0; i++) {
      players[i].hand.push(deck.pop());
    }
  }
  currentPlayerIndex = 0;
  logDiv.innerHTML = '';
  logMessage(`Game started with ${numPlayers} players. Welcome, ${players[0].name}!`);
  players.forEach(player => checkForFamily(player));
  advanceToNextTurn(0);
}

function advanceToNextTurn(nextPlayer) {
  if (!gameInProgress) return;
  currentPlayerIndex = nextPlayer;
  let attempts = 0;
  while(players[currentPlayerIndex].hand.length === 0 && attempts < players.length) {
    logMessage(`${getPlayerName(currentPlayerIndex)} has no cards. Skipping turn.`);
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    attempts++;
  }
  if (attempts >= players.length) { checkGameEnd(); return; }
  startTurn();
}

function startTurn() {
  logMessage(`It's <b>${getPlayerName(currentPlayerIndex)}'s</b> turn.`);
  updatePlayerDisplays();
  updateControls();
  if (currentPlayerIndex !== 0) setTimeout(processComputerTurn, 2000);
}

function handleHumanAsk() {
  const targetPlayerDropdown = document.getElementById('target-player');
  if (targetPlayerDropdown.options.length === 0) { logMessage("There is nobody left to ask!"); return; }
  const targetIndex = parseInt(targetPlayerDropdown.value);
  processAsk(0, targetIndex, document.getElementById('card-choice').value);
}

function processAsk(requesterIndex, targetIndex, elementName) {
  const requester = players[requesterIndex], target = players[targetIndex];
  logMessage(`${getPlayerName(requesterIndex)} asks ${getPlayerName(targetIndex)} for ${elementName}.`);
  const cardPos = target.hand.findIndex(card => card.element === elementName);
  if (cardPos !== -1) {
    const card = target.hand.splice(cardPos, 1)[0];
    requester.hand.push(card);
    logMessage(`Success! ${getPlayerName(targetIndex)} gives ${elementName}.`);
    logMessage(`<b>${getPlayerName(requesterIndex)} gets to go again.</b>`);
    checkForFamily(requester);
    if (checkGameEnd()) return;
    setTimeout(() => advanceToNextTurn(requesterIndex), 1000);
  } else {
    logMessage(`${getPlayerName(targetIndex)} says, 'Not at home!'`);
    if (checkGameEnd()) return;
    const nextPlayerInSequence = (requesterIndex + 1) % players.length;
    setTimeout(() => advanceToNextTurn(nextPlayerInSequence), 1000);
  }
}

function processComputerTurn() {
  const computer = players[currentPlayerIndex];
  const groupsInHand = computer.hand.reduce((acc, card) => {
    if (!acc[card.group]) acc[card.group] = [];
    acc[card.group].push(card.element);
    return acc;
  }, {});
  let targetGroup = '', maxCards = 0;
  for (const group in groupsInHand) {
    if(groupsInHand[group].length < 4 && groupsInHand[group].length > maxCards) {
      maxCards = groupsInHand[group].length;
      targetGroup = group;
    }
  }
  if (targetGroup === '') {
    const availableGroups = Object.keys(groupsInHand).filter(g => groupsInHand[g].length < 4);
    if (availableGroups.length === 0) { advanceToNextTurn((currentPlayerIndex + 1) % players.length); return; }
    targetGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
  }
  const ownedElements = new Set(groupsInHand[targetGroup]);
  const missingElements = fullCardList.filter(card => card.group === targetGroup).map(c => c.element).filter(el => !ownedElements.has(el));
  const cardToAskFor = missingElements[Math.floor(Math.random() * missingElements.length)];
  const possibleTargets = players.filter(p => p.id !== currentPlayerIndex && p.hand.length > 0);
  if(possibleTargets.length === 0) { checkGameEnd(); return; }
  const targetPlayer = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
  processAsk(currentPlayerIndex, targetPlayer.id, cardToAskFor);
}

function checkForFamily(player) {
  const groupCount = player.hand.reduce((acc, card) => { acc[card.group] = (acc[card.group] || 0) + 1; return acc; }, {});
  for (let group in groupCount) {
    if (groupCount[group] >= 4) {
      const isNewFamily = !player.completedFamilies.includes(group);
      if (isNewFamily) {
        player.completedFamilies.push(group);
        let removedCount = 0;
        const newHand = [];
        player.hand.forEach(card => {
          if (card.group === group && removedCount < 4) { removedCount++; }
          else { newHand.push(card); }
        });
        player.hand = newHand;
        logMessage(`<b>${getPlayerName(player.id)} completed the ${group} family!</b>`);
        updateCompletedDisplays();
      }
    }
  }
}

function checkGameEnd() {
  const totalFamilies = players.reduce((sum, p) => sum + p.completedFamilies.length, 0);
  if (totalFamilies >= SERIES_COUNT) {
    gameInProgress = false;
    const scores = players.map(p => p.completedFamilies.length);
    const maxScore = Math.max(...scores);
    const winners = players.filter(p => p.completedFamilies.length === maxScore);
    const winnerNames = winners.map(w => getPlayerName(w.id)).join(' and ');
    logMessage("--- GAME OVER! ---");
    logMessage(`<b>${winnerNames} win${winners.length > 1 ? '' : 's'} with ${maxScore} families!</b>`);
    updateControls();
    return true;
  }
  return false;
}

document.getElementById('start-game-button').addEventListener('click', () => {
  initializeGame();
  nameEntryDiv.classList.add('hidden');
  tableDiv.classList.remove('hidden');
  tableDiv.style.display = 'flex';
  controlsDiv.classList.remove('hidden');
});
playerNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('start-game-button').click();
});

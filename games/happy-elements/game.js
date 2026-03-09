// Happy Family: Periodic Table Edition – Game Logic

const baseURL = 'images/';
const fullCardList = [
  { group: 'Group 1', element: 'Lithium', img: baseURL + 'Li.png' }, { group: 'Group 1', element: 'Sodium', img: baseURL + 'Na.png' },
  { group: 'Group 1', element: 'Potassium', img: baseURL + 'K.png' }, { group: 'Group 1', element: 'Rubidium', img: baseURL + 'Rb.png' },
  { group: 'Group 2', element: 'Beryllium', img: baseURL + 'Be.png' }, { group: 'Group 2', element: 'Magnesium', img: baseURL + 'Mg.png' },
  { group: 'Group 2', element: 'Calcium', img: baseURL + 'Ca.png' }, { group: 'Group 2', element: 'Strontium', img: baseURL + 'Sr.png' },
  { group: 'Group 13', element: 'Boron', img: baseURL + 'B.png' }, { group: 'Group 13', element: 'Aluminium', img: baseURL + 'Al.png' },
  { group: 'Group 13', element: 'Gallium', img: baseURL + 'Ga.png' }, { group: 'Group 13', element: 'Indium', img: baseURL + 'In.png' },
  { group: 'Group 14', element: 'Carbon', img: baseURL + 'C.png' }, { group: 'Group 14', element: 'Silicon', img: baseURL + 'Si.png' },
  { group: 'Group 14', element: 'Germanium', img: baseURL + 'Ge.png' }, { group: 'Group 14', element: 'Tin', img: baseURL + 'Sn.png' },
  { group: 'Group 15', element: 'Nitrogen', img: baseURL + 'N.PNG' }, { group: 'Group 15', element: 'Phosphorus', img: baseURL + 'P.PNG' },
  { group: 'Group 15', element: 'Arsenic', img: baseURL + 'As.PNG' }, { group: 'Group 15', element: 'Antimony', img: baseURL + 'Sb.PNG' },
  { group: 'Group 16', element: 'Oxygen', img: baseURL + 'O.PNG' }, { group: 'Group 16', element: 'Sulfur', img: baseURL + 'S.PNG' },
  { group: 'Group 16', element: 'Selenium', img: baseURL + 'Se.PNG' }, { group: 'Group 16', element: 'Tellurium', img: baseURL + 'Te.PNG' },
  { group: 'Group 17', element: 'Fluorine', img: baseURL + 'F.PNG' }, { group: 'Group 17', element: 'Chlorine', img: baseURL + 'Cl.PNG' },
  { group: 'Group 17', element: 'Bromine', img: baseURL + 'Br.PNG' }, { group: 'Group 17', element: 'Iodine', img: baseURL + 'I.PNG' },
  { group: 'Group 18', element: 'Neon', img: baseURL + 'Ne.PNG' }, { group: 'Group 18', element: 'Argon', img: baseURL + 'Ar.PNG' },
  { group: 'Group 18', element: 'Krypton', img: baseURL + 'Kr.PNG' }, { group: 'Group 18', element: 'Xenon', img: baseURL + 'Xe.PNG' }
];
const groupRepresentativeImages = {
  'Group 1': baseURL + 'Li.png', 'Group 2': baseURL + 'Be.png', 'Group 13': baseURL + 'B.png', 'Group 14': baseURL + 'C.png',
  'Group 15': baseURL + 'N.PNG', 'Group 16': baseURL + 'O.PNG', 'Group 17': baseURL + 'F.PNG', 'Group 18': baseURL + 'Ne.PNG'
};
const elementToGroup = {};
fullCardList.forEach(card => { elementToGroup[card.element.toLowerCase()] = card.group.replace("Group ", ""); });

let players = [], deck = [], currentPlayerIndex = 0, difficultyLevel = "beginner", gameInProgress = false;
const nameEntryDiv = document.getElementById('name-entry'), tableDiv = document.getElementById('table'),
      controlsDiv = document.getElementById('controls'), logDiv = document.getElementById('log'),
      humanControlsDiv = document.getElementById('human-controls'), playerNameInput = document.getElementById('player-name-input');

function logMessage(message) {
  const p = document.createElement('p');
  p.innerHTML = message;
  logDiv.appendChild(p);
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
  players[0].hand.sort((a,b) => {
    const groupA = parseInt(a.group.replace("Group ", ""));
    const groupB = parseInt(b.group.replace("Group ", ""));
    return groupA - groupB || a.element.localeCompare(b.element);
  });
  players[0].hand.forEach(card => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'playing-card';
    cardDiv.innerHTML = `<img src="${card.img}" alt="${card.element}" title="${card.element}">`;
    hand0.appendChild(cardDiv);
  });
  for (let i = 1; i < players.length; i++) {
    const handDiv = document.getElementById(`hand-${i}`);
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
  for (let i = 0; i < players.length; i++) {
    const compDiv = document.getElementById(`completed-${i}`);
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
  if (difficultyLevel === "advanced") {
    humanControlsDiv.innerHTML = `<label for="target-player">Ask:</label> <select id="target-player"></select>
                                   <label for="element-input">for element:</label> <input type="text" id="element-input" placeholder="Enter element">
                                   <label for="group-input">from Group:</label> <input type="text" id="group-input" placeholder="Enter group number">
                                   <button id="ask-button">Ask</button>`;
  } else {
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
  }
  const targetPlayerDropdown = document.getElementById('target-player');
  targetPlayerDropdown.innerHTML = '';
  for (let i = 1; i < players.length; i++) {
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
  players = [];
  for (let i = 0; i < 4; i++) players.push({ id: i, hand: [], completedFamilies: [] });
  players[0].name = playerNameInput.value.trim() || "You";
  document.getElementById('name-0').textContent = players[0].name;
  let names = ["Alice", "Beth", "Charlie", "David"];
  shuffleArray(names);
  for(let i=1; i<4; i++) {
    players[i].name = names[i-1];
    document.getElementById(`name-${i}`).textContent = players[i].name;
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
  logMessage(`Game started. All 32 cards dealt. Welcome, ${players[0].name}!`);
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
  if (difficultyLevel === "advanced") {
    const elementInput = document.getElementById('element-input').value.trim();
    const groupInput = document.getElementById('group-input').value.trim();
    if (!elementToGroup[elementInput.toLowerCase()] || elementToGroup[elementInput.toLowerCase()] !== groupInput) {
      logMessage("Invalid request. Check element name and group number."); return;
    }
    processAsk(0, targetIndex, elementInput);
  } else {
    processAsk(0, targetIndex, document.getElementById('card-choice').value);
  }
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
    if (groupCount[group] === 4) {
      const isNewFamily = !player.completedFamilies.includes(group);
      if (isNewFamily) {
        player.completedFamilies.push(group);
        player.hand = player.hand.filter(card => card.group !== group);
        logMessage(`<b>${getPlayerName(player.id)} completed ${group}!</b>`);
        updateCompletedDisplays();
      }
    }
  }
}

function checkGameEnd() {
  const totalFamilies = players.reduce((sum, p) => sum + p.completedFamilies.length, 0);
  if (totalFamilies === 8) {
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
  nameEntryDiv.style.display = 'none';
  tableDiv.style.display = 'flex';
  controlsDiv.style.display = 'block';
});
playerNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('start-game-button').click();
});

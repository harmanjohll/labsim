// Reactivity Bridge – Game Logic

// Sync CSS variable --bs to board width
const board = document.getElementById('game-board');
function updateBoardSize() {
  const w = board.clientWidth;
  board.style.setProperty('--bs', `${w}px`);
}
window.addEventListener('load', updateBoardSize);
window.addEventListener('resize', updateBoardSize);

const baseURL = 'images/';
const deck = [
  {element:'Potassium',symbol:'K',state:'neutral',filename:'K.PNG'},
  {element:'Potassium',symbol:'K',state:'ionic', filename:'K+.PNG'},
  {element:'Sodium',   symbol:'Na',state:'neutral',filename:'Na.PNG'},
  {element:'Sodium',   symbol:'Na',state:'ionic', filename:'Na+.PNG'},
  {element:'Calcium',  symbol:'Ca',state:'neutral',filename:'Ca.PNG'},
  {element:'Calcium',  symbol:'Ca',state:'ionic', filename:'Ca2+.PNG'},
  {element:'Magnesium',symbol:'Mg',state:'neutral',filename:'Mg.PNG'},
  {element:'Magnesium',symbol:'Mg',state:'ionic', filename:'Mg2+.PNG'},
  {element:'Aluminium',symbol:'Al',state:'neutral',filename:'Al.PNG'},
  {element:'Aluminium',symbol:'Al',state:'ionic', filename:'Al3+.PNG'},
  {element:'Zinc',     symbol:'Zn',state:'neutral',filename:'Zn.PNG'},
  {element:'Zinc',     symbol:'Zn',state:'ionic', filename:'Zn2+.PNG'},
  {element:'Iron',     symbol:'Fe',state:'neutral',filename:'Fe.PNG'},
  {element:'Iron',     symbol:'Fe',state:'ionic', filename:'Fe2+.PNG'},
  {element:'Tin',      symbol:'Sn',state:'neutral',filename:'Sn.PNG'},
  {element:'Tin',      symbol:'Sn',state:'ionic', filename:'Sn2+.PNG'},
  {element:'Lead',     symbol:'Pb',state:'neutral',filename:'Pb.PNG'},
  {element:'Lead',     symbol:'Pb',state:'ionic', filename:'Pb2+.PNG'},
  {element:'Copper',   symbol:'Cu',state:'neutral',filename:'Cu.PNG'},
  {element:'Copper',   symbol:'Cu',state:'ionic', filename:'Cu2+.PNG'},
  {element:'Silver',   symbol:'Ag',state:'neutral',filename:'Ag.PNG'},
  {element:'Silver',   symbol:'Ag',state:'ionic', filename:'Ag+.PNG'},
  {element:'Gold',     symbol:'Au',state:'neutral',filename:'Au.PNG'},
  {element:'Gold',     symbol:'Au',state:'ionic', filename:'Au+.PNG'}
];
const reactivityOrder = {K:12,Na:11,Ca:10,Mg:9,Al:8,Zn:7,Fe:6,Sn:5,Pb:4,Cu:3,Ag:2,Au:1};
let seatingOrder = ["south","west","north","east"];
const game = {
  hands:{south:[],west:[],north:[],east:[]},
  currentTrickPlays:[], currentTurnIndex:0,
  trickCount:{NS:0,WE:0}, trickNumber:1, totalTricks:6,
  stateRequired:null, difficulty:'beginner',
  bidding:false,bids:[],contract:null, trumpState:null, declarer:null
};

const biddingModalOverlay = document.getElementById('bidding-modal-overlay');
const bidHistoryEl = document.getElementById('bid-history');
const playerBidControlsEl = document.getElementById('player-bid-controls');
const currentBidTextEl = document.getElementById('current-bid-text');

function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function createCardElement(card, side, clickable=false, forceShow=false){
  const img=document.createElement("img");
  const backURL= baseURL+"back-of-card.png";
  const hide=!forceShow && side!=="south" && game.difficulty==="advanced";
  img.src= hide? backURL : baseURL+card.filename;
  img.alt= hide? "back" : `${card.symbol} (${card.state})`;
  img.classList.add("card");
  if(clickable && side==="south"){
    img.style.cursor="pointer";
    img.addEventListener("click",()=>{ if(seatingOrder[game.currentTurnIndex]==="south") playCard("south",card); });
  }
  return img;
}

function updateHandDisplay(side){
  const bench=document.getElementById(`bench-${side}`);
  bench.innerHTML="";
  game.hands[side].forEach(c=> bench.appendChild(createCardElement(c,side,side==="south", false)));
}
function updateAllHands(){["south","west","north","east"].forEach(updateHandDisplay);}
function resetTrickSlots(){
  ["north","east","south","west"].forEach(s=>{
    document.getElementById(`slot-${s}`).innerText=s.charAt(0).toUpperCase();
  });
}
function updateTrickHistory(winner,num){
  const d=document.createElement("div");
  d.innerText=`Trick ${num}: ${winner.player.toUpperCase()} wins with ${winner.card.symbol} (${winner.card.state})`;
  document.getElementById("trick-history").appendChild(d);
}
function updateScoreboard(){
  document.getElementById("scoreboard").innerText=
    `Team NS: ${game.trickCount.NS} | Team WE: ${game.trickCount.WE}`;
}
function rotateSeating(i){ seatingOrder.push(...seatingOrder.splice(0,i)); }
function endGame(){
  let msg="";
  if(game.difficulty!=="beginner" && game.declarer){
    const team=(game.declarer==="south"||game.declarer==="north")?"NS":"WE";
    const won= game.trickCount[team];
    msg= won>=game.contract.level
      ? `Team ${team} made their contract (${won} tricks)!`
      : `Team ${team} failed their contract (${won} tricks).`;
  } else {
    msg= game.trickCount.NS>game.trickCount.WE
      ? `Team NS wins! (${game.trickCount.NS}-${game.trickCount.WE})`
      : game.trickCount.WE>game.trickCount.NS
        ? `Team WE wins! (${game.trickCount.WE}-${game.trickCount.NS})`
        : "It's a tie!";
  }
  document.getElementById("table-text").innerText=msg;
}

// Bidding Logic
function startBidding() {
  game.bidding = true;
  game.bids = [];
  game.contract = { level: 0, state: null, player: null };
  game.currentTurnIndex = 0;
  updateBidUI();
  biddingModalOverlay.style.display = 'flex';
  promptNextBidder();
}
function promptNextBidder() {
  if (!game.bidding) return;
  const currentPlayer = seatingOrder[game.currentTurnIndex];
  if (currentPlayer === 'south') {
    playerBidControlsEl.style.display = 'block';
  } else {
    playerBidControlsEl.style.display = 'none';
    setTimeout(() => computerBid(currentPlayer), 1500);
  }
}
function handleBid(player, bid) {
  if (!game.bidding) return;
  game.bids.push({ player, bid });
  bidHistoryEl.innerHTML += `<div><strong>${player.toUpperCase()}:</strong> ${typeof bid === 'string' ? 'Pass' : `${bid.level} ${bid.state}`}</div>`;
  bidHistoryEl.scrollTop = bidHistoryEl.scrollHeight;
  if (typeof bid !== 'string') {
    game.contract = { ...bid, player };
    updateBidUI();
  }
  const lastThreeBids = game.bids.slice(-3);
  if (game.bids.length >= 4 && lastThreeBids.every(b => b.bid === 'pass')) {
    endBidding();
    return;
  }
  game.currentTurnIndex = (game.currentTurnIndex + 1) % 4;
  promptNextBidder();
}
function computerBid(player) {
  const hand = game.hands[player];
  const neutralCount = hand.filter(c => c.state === 'neutral').length;
  const ionicCount = hand.filter(c => c.state === 'ionic').length;
  let potentialBid = { level: 0, state: null };
  if (neutralCount >= 4) {
    potentialBid = { level: neutralCount - 2, state: 'neutral' };
  } else if (ionicCount >= 4) {
    potentialBid = { level: ionicCount - 2, state: 'ionic' };
  }
  if (potentialBid.level > game.contract.level) {
    handleBid(player, potentialBid);
  } else {
    handleBid(player, 'pass');
  }
}
function updateBidUI() {
  const minBidLevel = game.contract.level + 1;
  currentBidTextEl.textContent = game.contract.level === 0 ? 'No bids yet.' : `Current Bid: ${game.contract.level} ${game.contract.state} by ${game.contract.player.toUpperCase()}`;
  playerBidControlsEl.innerHTML = '';
  for (let level = minBidLevel; level <= game.totalTricks; level++) {
    const btnN = document.createElement('button');
    btnN.textContent = `${level} Neutral`;
    btnN.className = 'bid-btn';
    btnN.onclick = () => handleBid('south', { level, state: 'neutral' });
    playerBidControlsEl.appendChild(btnN);
    const btnI = document.createElement('button');
    btnI.textContent = `${level} Ionic`;
    btnI.className = 'bid-btn';
    btnI.onclick = () => handleBid('south', { level, state: 'ionic' });
    playerBidControlsEl.appendChild(btnI);
  }
  const passBtn = document.createElement('button');
  passBtn.textContent = 'Pass';
  passBtn.className = 'pass-btn';
  passBtn.onclick = () => handleBid('south', 'pass');
  playerBidControlsEl.appendChild(passBtn);
}
function endBidding() {
  game.bidding = false;
  biddingModalOverlay.style.display = 'none';
  if (!game.contract.player) {
    document.getElementById("table-text").innerText = 'All players passed. Redealing...';
    setTimeout(initializeGame, 2000);
    return;
  }
  game.trumpState = game.contract.state;
  game.declarer = game.contract.player;
  document.getElementById("contract-display").innerText = `Contract: ${game.contract.level} ${game.contract.state} by ${game.declarer.toUpperCase()}`;
  const declarerIndex = seatingOrder.indexOf(game.declarer);
  const leaderIndex = (declarerIndex + 1) % 4;
  game.currentTurnIndex = leaderIndex;
  const leader = seatingOrder[game.currentTurnIndex];
  document.getElementById("table-text").innerText = `${leader.toUpperCase()} leads`;
  if (leader !== 'south') {
    setTimeout(() => computerPlay(leader), 1000);
  }
}

// Core functions
function playCard(player,card){
  if(seatingOrder[game.currentTurnIndex]!==player) return;
  if(game.currentTrickPlays.length>0 && game.stateRequired){
    const must=game.hands[player].some(c=>c.state===game.stateRequired);
    if(must && card.state!==game.stateRequired){ alert(`Must follow ${game.stateRequired}`); return; }
  }
  game.hands[player].splice(game.hands[player].findIndex(c=>c.filename===card.filename),1);
  updateHandDisplay(player);
  game.currentTrickPlays.push({player,card});
  const slot=document.getElementById(`slot-${player}`);
  slot.innerHTML=""; slot.appendChild(createCardElement(card,player,false,true));
  if(game.currentTrickPlays.length===1) game.stateRequired=card.state;
  game.currentTurnIndex=(game.currentTurnIndex+1)%4;
  if(game.currentTrickPlays.length===4) setTimeout(processTrick,1000);
  else{
    const nxt=seatingOrder[game.currentTurnIndex];
    if(nxt!=="south") setTimeout(()=>computerPlay(nxt),800);
  }
}
function computerPlay(side){
  const hand=game.hands[side], led=game.stateRequired;
  const follow= led?hand.filter(c=>c.state===led):[];
  let choice;
  if(follow.length){
    follow.sort((a,b)=> led==="neutral"
      ? reactivityOrder[b.symbol]-reactivityOrder[a.symbol]
      : reactivityOrder[a.symbol]-reactivityOrder[b.symbol]
    );
    choice=follow[0];
  } else if(game.trumpState && game.trumpState!==led){
    const tr=hand.filter(c=>c.state===game.trumpState);
    if(tr.length){
      tr.sort((a,b)=> game.trumpState==="neutral"
        ?reactivityOrder[b.symbol]-reactivityOrder[a.symbol]
        :reactivityOrder[a.symbol]-reactivityOrder[b.symbol]
      );
      choice=tr[0];
    } else {
      hand.sort((a,b)=>reactivityOrder[a.symbol]-reactivityOrder[b.symbol]);
      choice=hand[0];
    }
  } else {
    hand.sort((a,b)=>reactivityOrder[a.symbol]-reactivityOrder[b.symbol]);
    choice=hand[0];
  }
  playCard(side,choice);
}
function processTrick(){
  const led=game.stateRequired;
  const trumps= game.trumpState?game.currentTrickPlays.filter(p=>p.card.state===game.trumpState):[];
  const pool= trumps.length? trumps : game.currentTrickPlays.filter(p=>p.card.state===led);
  let winner=pool[0];
  pool.forEach(p=>{
    if((p.card.state==="neutral" && reactivityOrder[p.card.symbol]>reactivityOrder[winner.card.symbol]) ||
       (p.card.state==="ionic"  && reactivityOrder[p.card.symbol]<reactivityOrder[winner.card.symbol])){
      winner=p;
    }
  });
  if(winner.player==="south"||winner.player==="north") game.trickCount.NS++;
  else game.trickCount.WE++;
  updateTrickHistory(winner,game.trickNumber);
  updateScoreboard();
  setTimeout(()=>{
    const idx=seatingOrder.indexOf(winner.player);
    rotateSeating(idx);
    game.currentTurnIndex=0;
    game.currentTrickPlays=[]; game.stateRequired=null;
    resetTrickSlots();
    if(game.trickNumber===game.totalTricks) endGame();
    else{
      game.trickNumber++;
      const lead=seatingOrder[0];
      document.getElementById("table-text").innerText=`${lead.toUpperCase()} leads`;
      if(lead!=="south") setTimeout(()=>computerPlay(lead),1000);
    }
  },1000);
}

// Initialize
function initializeGame(){
  seatingOrder=["south","west","north","east"];
  const d=shuffle([...deck]);
  game.hands.south=d.slice(0,6);
  game.hands.west =d.slice(6,12);
  game.hands.north=d.slice(12,18);
  game.hands.east =d.slice(18,24);

  const diff=document.getElementById("difficulty").value;
  game.difficulty=diff;

  Object.assign(game,{
    currentTrickPlays:[],currentTurnIndex:0,
    trickCount:{NS:0,WE:0},trickNumber:1,
    stateRequired:null,contract:null, trumpState:null,declarer:null,
    difficulty: diff
  });
  document.getElementById("table-text").innerText="Table";
  document.getElementById("trick-history").innerHTML="";
  document.getElementById("contract-display").innerText="No contract";
  resetTrickSlots();
  updateScoreboard();
  updateAllHands();

  if(diff==="intermediate"||diff==="advanced"){
    setTimeout(startBidding, 500);
  } else {
    document.getElementById("table-text").innerText="South leads";
  }
}
document.getElementById("startButton").addEventListener("click",initializeGame);

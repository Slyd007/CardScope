'use strict';

const RANKS = [2,3,4,5,6,7,8,9,10,11,12,13,14];
const SUITS = [
  { code:'s', symbol:'♠', red:false },
  { code:'h', symbol:'♥', red:true },
  { code:'d', symbol:'♦', red:true },
  { code:'c', symbol:'♣', red:false }
];
const RANK_LABEL = {11:'J',12:'Q',13:'K',14:'A'};
const CATEGORY_LABELS = ['Hauteur','Une paire','Deux paires','Brelan','Quinte','Couleur','Full','Carré','Quinte flush'];
const STREET_NAMES = ['Préflop','Flop','Turn','River'];

const BLIND_PRESETS = {
  cash: [
    {label:'0,05 / 0,10', sb:0.05, bb:0.10, ante:0},
    {label:'0,10 / 0,20', sb:0.10, bb:0.20, ante:0},
    {label:'0,25 / 0,50', sb:0.25, bb:0.50, ante:0},
    {label:'0,50 / 1', sb:0.50, bb:1, ante:0},
    {label:'1 / 2', sb:1, bb:2, ante:0},
    {label:'2 / 5', sb:2, bb:5, ante:0},
    {label:'5 / 10', sb:5, bb:10, ante:0}
  ],
  tournament: [
    {label:'10 / 20', sb:10, bb:20, ante:0},
    {label:'15 / 30', sb:15, bb:30, ante:0},
    {label:'20 / 40', sb:20, bb:40, ante:0},
    {label:'25 / 50', sb:25, bb:50, ante:0},
    {label:'50 / 100', sb:50, bb:100, ante:0},
    {label:'75 / 150 · ante 15', sb:75, bb:150, ante:15},
    {label:'100 / 200 · ante 25', sb:100, bb:200, ante:25},
    {label:'150 / 300 · ante 40', sb:150, bb:300, ante:40},
    {label:'200 / 400 · ante 50', sb:200, bb:400, ante:50},
    {label:'300 / 600 · ante 75', sb:300, bb:600, ante:75},
    {label:'500 / 1 000 · ante 125', sb:500, bb:1000, ante:125},
    {label:'1 000 / 2 000 · ante 250', sb:1000, bb:2000, ante:250},
    {label:'2 000 / 4 000 · ante 500', sb:2000, bb:4000, ante:500}
  ]
};

const FORMAT_PRESETS = {
  cash5: {
    label:'Cash Game · NLHE · Short Handed 5-max', tableLabel:'CASH GAME · NLHE · 5-MAX',
    mode:'cash', seats:4, sb:0.50, bb:1, ante:0, stack:100, blindIndex:3,
    description:'Le mode de base conseillé : quatre joueurs assis sur une table Short Handed 5-max, blindes fixes et stacks en euros.'
  },
  cash3: {
    label:'Cash Game · NLHE · Super Short Handed 3-max', tableLabel:'CASH GAME · NLHE · 3-MAX',
    mode:'cash', seats:3, sb:0.50, bb:1, ante:0, stack:100, blindIndex:3,
    description:'Table très courte à trois joueurs : davantage de blindes jouées et ranges naturellement plus larges.'
  },
  headsUp: {
    label:'Heads-up · NLHE · 2 joueurs', tableLabel:'HEADS-UP · NLHE',
    mode:'cash', seats:2, sb:0.50, bb:1, ante:0, stack:100, blindIndex:3,
    description:'Duel à deux joueurs. Le bouton poste aussi la petite blinde et parle en premier préflop.'
  },
  expresso: {
    label:'Expresso · NLHE · 3 joueurs', tableLabel:'EXPRESSO · NLHE · 3-MAX',
    mode:'tournament', seats:3, sb:10, bb:20, ante:0, stack:500, blindIndex:0,
    description:'Sit&Go jackpot à trois joueurs. Préréglage 500 jetons, blindes 10/20 ; tout reste modifiable.'
  },
  expressoNitro: {
    label:'Expresso Nitro · NLHE · 3 joueurs', tableLabel:'EXPRESSO NITRO · 3-MAX',
    mode:'tournament', seats:3, sb:10, bb:20, ante:0, stack:300, blindIndex:0,
    description:'Version très rapide de l’Expresso. Préréglage 300 jetons, blindes 10/20.'
  },
  sitgo5: {
    label:'Sit&Go classique · NLHE · 5 joueurs', tableLabel:'SIT&GO · NLHE · 5-MAX',
    mode:'tournament', seats:5, sb:25, bb:50, ante:0, stack:1500, blindIndex:3,
    description:'Tournoi à table unique : les blindes augmentent et les joueurs sont éliminés quand leur stack tombe à zéro.'
  },
  mtt6: {
    label:'Tournoi MTT · NLHE · 6-max', tableLabel:'TOURNOI MTT · NLHE · 6-MAX',
    mode:'tournament', seats:6, sb:50, bb:100, ante:0, stack:10000, blindIndex:4,
    description:'Tournoi multi-tables en 6-max. La structure exacte varie selon le tournoi : ce départ est modifiable.'
  },
  mtt9: {
    label:'Tournoi MTT · NLHE · 9-max', tableLabel:'TOURNOI MTT · NLHE · 9-MAX',
    mode:'tournament', seats:9, sb:50, bb:100, ante:0, stack:10000, blindIndex:4,
    description:'Tournoi multi-tables à neuf joueurs. Idéal pour travailler les positions précoces et les pots multiway.'
  },
  goFast5: {
    label:'GO FAST · NLHE · aperçu 5-max', tableLabel:'GO FAST · NLHE · REVIEW',
    mode:'cash', seats:5, sb:0.50, bb:1, ante:0, stack:100, blindIndex:3,
    description:'Aperçu de review du poker rapide. Sur la room, un fold envoie vers une nouvelle table ; ici on analyse un instantané fixe.'
  },
  custom: {
    label:'Réglage personnalisé', tableLabel:'RÉGLAGE PERSONNALISÉ · NLHE',
    mode:'cash', seats:5, sb:0.50, bb:1, ante:0, stack:100, blindIndex:3,
    description:'Réglage manuel : tu gardes le nombre de joueurs, les blindes, les antes et les stacks que tu saisis.'
  }
};

const GLOSSARY = {
  format:{title:'Format de table',definition:'Le type de partie et le nombre maximal de joueurs : cash game, tournoi, Expresso, heads-up, 3-max, 5-max, 6-max ou 9-max.',example:'Exemple : “Short Handed 5-max” signifie une table de cash game avec cinq sièges maximum.',room:'Terme standard pour distinguer les principaux formats de poker.'},
  cardTheme:{title:'Style des cartes',definition:'L’apparence visuelle du paquet. Le jeu classique utilise rouge et noir ; le jeu 4 couleurs donne une couleur différente à chaque enseigne.',example:'Le mode 4 couleurs aide à repérer plus vite les tirages couleur.',room:'Le style 4 couleurs est une option visuelle courante dans les logiciels de poker.'},
  nlhe:{title:'No-Limit Hold’em (NLHE)',definition:'Texas Hold’em sans limite maximale de mise : un joueur peut engager jusqu’à la totalité de son stack à tout moment.',example:'Deux cartes privées par joueur, cinq cartes communes, meilleure combinaison de cinq cartes.'},
  cashGame:{title:'Cash game',definition:'Partie où les jetons représentent directement de l’argent. Les blindes restent généralement fixes et tu peux quitter la table avec ton stack.',example:'À une table 0,50 €/1 €, la petite blinde vaut 0,50 € et la grosse blinde 1 €.'},
  blinds:{title:'Niveau de blindes',definition:'Montants des mises forcées qui créent le pot avant la distribution. En tournoi, elles augmentent par niveaux ; en cash game, elles restent fixes tant que tu ne changes pas de limite.',example:'Niveau 100/200 : petite blinde 100, grosse blinde 200.'},
  smallBlind:{title:'Petite blinde (SB)',definition:'Mise forcée placée par le joueur immédiatement à gauche du bouton. Elle vaut souvent la moitié de la grosse blinde.',example:'Sur une table 0,50 €/1 €, la SB poste 0,50 €.'},
  bigBlind:{title:'Grosse blinde (BB)',definition:'Mise forcée placée à gauche de la petite blinde. Elle sert d’unité de référence pour les stacks et les relances.',example:'Un stack de 100 € sur une table 0,50 €/1 € représente 100 BB.'},
  ante:{title:'Ante',definition:'Petite mise forcée ajoutée avant la main, en plus des blindes, surtout en tournoi.',example:'Une ante de 25 avec 8 joueurs ajoute 200 jetons au pot si chaque joueur la paie.'},
  anteMode:{title:'Type d’ante',definition:'“Chaque joueur” prélève une ante à tous. “Big blind ante” fait payer la totalité des antes par la grosse blinde.',example:'Avec une BB ante de 800, seul le joueur de grosse blinde poste les 800 jetons d’ante.'},
  stack:{title:'Stack / tapis',definition:'La quantité d’argent ou de jetons encore disponible devant un joueur.',example:'Stack 75 € à 0,50 €/1 € = 75 grosses blindes.'},
  button:{title:'Bouton / dealer (BTN)',definition:'Repère qui indique le donneur théorique. Il tourne d’un siège à chaque nouvelle main et détermine les positions.',example:'Le bouton est généralement la meilleure position postflop car il parle en dernier.'},
  winProbability:{title:'Probabilité de gagner',definition:'Chance de remporter seul le pot au showdown dans les simulations.',example:'55 % de victoire signifie environ 55 pots gagnés seul sur 100 simulations comparables.'},
  equity:{title:'Équité totale',definition:'Part moyenne du pot qui te revient. Elle ajoute à tes victoires ta fraction des pots partagés.',example:'50 % de victoires et 10 % de partages à deux donnent environ 55 % d’équité.'},
  tie:{title:'Partage du pot',definition:'Situation où plusieurs joueurs possèdent exactement la même meilleure combinaison et divisent le pot.',example:'Si deux joueurs partagent un pot de 20 €, chacun reçoit 10 € avant prélèvements éventuels.'},
  pot:{title:'Pot',definition:'Somme de toutes les mises déjà engagées dans la main. Les jetons d’un joueur couché restent dans le pot.',example:'SB 0,50 € + BB 1 € + un call 1 € = pot brut de 2,50 €.'},
  call:{title:'Suivre / call',definition:'Ajouter juste le montant nécessaire pour égaler la mise la plus élevée et rester dans la main.',example:'Tu as déjà mis 1 € et la mise est montée à 4 € : il reste 3 € à suivre.'},
  potOdds:{title:'Pot odds / équité requise',definition:'Pourcentage minimum d’équité nécessaire pour qu’un call soit rentable dans un calcul simplifié sans mise future.',example:'Payer 10 € pour viser un pot final de 40 € demande 25 % d’équité.'},
  effectiveStack:{title:'Stack effectif',definition:'Plus petit montant réellement jouable entre Hero et l’adversaire concerné. On ne peut pas gagner plus que ce que l’autre peut engager.',example:'Hero a 100 BB, Villain 35 BB : le stack effectif est 35 BB.'},
  spr:{title:'SPR',definition:'Stack-to-Pot Ratio : stack effectif divisé par le pot au début ou au moment étudié. Il mesure la profondeur restante.',example:'Stack effectif 80 €, pot 20 € : SPR = 4.'},
  ev:{title:'EV simplifiée du call',definition:'Gain ou perte moyenne théorique du call selon l’équité estimée, le pot et le montant à payer, sans tenir compte des mises futures.',example:'EV +2 € signifie qu’en moyenne ce call rapporterait 2 € dans le modèle utilisé.'},
  fold:{title:'Passer / se coucher (fold)',definition:'Abandonner la main. Tu ne peux plus gagner le pot, mais toutes les mises déjà engagées y restent.',example:'Le bouton PASSER couche Hero pour la main en cours.'},
  check:{title:'Parole (check)',definition:'Rester dans la main sans miser lorsque personne n’a misé avant toi sur le tour actuel.',example:'Au flop, tout le monde a parole : tu peux checker gratuitement.'},
  bet:{title:'Miser (bet)',definition:'Placer la première mise d’un tour lorsqu’aucune mise n’existe encore.',example:'Pot 10 €, miser 5 € correspond à 50 % du pot.'},
  raise:{title:'Relancer (raise)',definition:'Augmenter une mise déjà présente. Les autres joueurs doivent suivre le nouveau montant, relancer encore ou se coucher.',example:'Mise adverse 2 €, tu relances à 6 €.'},
  allin:{title:'Tapis / all-in',definition:'Engager tous ses jetons ou tout son argent restant dans la main.',example:'Un joueur all-in reste éligible au pot mais ne peut plus prendre de décision.'},
  range:{title:'Range',definition:'Ensemble des mains possibles qu’un joueur peut raisonnablement posséder selon sa position et ses actions.',example:'Une range de relance UTG est généralement plus serrée qu’une range au bouton.'},
  outs:{title:'Outs / sorties',definition:'Cartes encore disponibles qui améliorent probablement ta main vers une combinaison visée.',example:'Quatre cartes de la même couleur après le flop donnent souvent neuf outs pour compléter la couleur.'}
};

const DECK = SUITS.flatMap((suit, suitIndex) => RANKS.map(rank => ({
  rank,
  suit:suitIndex,
  key:`${rank}${suit.code}`,
  rankLabel:RANK_LABEL[rank] || String(rank),
  suitSymbol:suit.symbol,
  red:suit.red
})));

function makePlayer(id, isHero = false, stack = 100) {
  const safeStack=Math.max(0,Number(stack)||0);
  return {
    id,
    isHero,
    name:isHero?'Hero':`J${id}`,
    status:safeStack>0?'active':'out',
    stack:safeStack,
    committed:0,
    streetBet:0,
    revealed:[null,null],
    profile:'standard',
    rangeAction:'unknown',
    strongActions:[0,0,0,0]
  };
}
function makeTablePlayers(count, stack) {
  return Array.from({length:count},(_,index)=>makePlayer(index+1,index===0,stack));
}

const state = {
  heroCards:[null,null],
  board:[null,null,null,null,null],
  players:makeTablePlayers(4,100),
  tablePlayerCount:4,
  removedThisHand:[],
  nextPlayerId:5,
  dealerId:1,
  gameMode:'cash',
  formatPreset:'cash5',
  cardTheme:'classic',
  blindLevelIndex:3,
  smallBlind:0.5,
  bigBlind:1,
  ante:0,
  anteMode:'all',
  defaultStack:100,
  autoPostBlinds:false,
  autoMoveDealer:true,
  blindsPosted:false,
  bettingStreet:0,
  handStatus:'setup',
  handNumber:0,
  deadPot:0,
  deadStreetBet:0,
  lastFullRaise:0,
  deadCards:[],
  activeSlot:{area:'hero',index:0},
  selectedPlayerId:null,
  pressurePlayerId:null,
  estimatedHandsPlayerId:null,
  pendingRemovePlayerId:null,
  activeRevealedIndex:0,
  coachMode:false,
  lastEquity:null,
  lastWinProbability:null,
  lastRangeWinProbability:null,
  lastRangeEquity:null,
  lastIterations:0,
  lastFutureCategories:null,
  lastPersonalFutureCategories:null,
  lastRoyalFlushProbability:null,
  lastFutureExamples:null,
  lastRoyalFlushExample:null,
  lastStraightFlushExample:null,
  lastCurrentCategory:null,
  lastDrawSummary:[],
  runningToken:0,
  debounce:null
};

const $ = selector => document.querySelector(selector);
const els = {
  heroSlots:$('#heroSlots'), boardSlots:$('#boardSlots'), seatLayer:$('#seatLayer'),
  playersMinus:$('#playersMinus'), playersPlus:$('#playersPlus'), playersCount:$('#playersCount'), setupPlayersSummary:$('#setupPlayersSummary'), setupBlindSummary:$('#setupBlindSummary'),
  iterations:$('#iterations'), precisionHint:$('#precisionHint'), calculateNow:$('#calculateNow'),
  coachMode:$('#coachMode'), commentModeState:$('#commentModeState'), commentaryBox:$('#commentaryBox'),
  resetAll:$('#resetAll'), newHand:$('#newHand'), advanceStreet:$('#advanceStreet'), finishHand:$('#finishHand'), openOuts:$('#openOuts'), openTableSettings:$('#openTableSettings'), tableSettingsModal:$('#tableSettingsModal'),
  handStateBadge:$('#handStateBadge'), handStateTitle:$('#handStateTitle'), handStateHint:$('#handStateHint'), handFlowSteps:$('#handFlowSteps'),
  formatPreset:$('#formatPreset'), cardTheme:$('#cardTheme'), formatDescription:$('#formatDescription'), tableFormatLabel:$('#tableFormatLabel'),
  heroFold:$('#heroFold'), heroCheckCall:$('#heroCheckCall'), heroBetRaise:$('#heroBetRaise'), heroAllIn:$('#heroAllIn'), heroActionHint:$('#heroActionHint'),
  streetName:$('#streetName'), streetBadge:$('#streetBadge'), tablePotValue:$('#tablePotValue'), heroPosition:$('#heroPosition'), heroTableStatus:$('#heroTableStatus'),
  selectionHint:$('#selectionHint'), calculationStatus:$('#calculationStatus'),
  winValue:$('#winValue'), winContext:$('#winContext'), equityValue:$('#equityValue'), tieValue:$('#tieValue'), lossValue:$('#lossValue'),
  rangeWinValue:$('#rangeWinValue'), rangeContext:$('#rangeContext'), rangeEquityValue:$('#rangeEquityValue'), rangeDeltaValue:$('#rangeDeltaValue'), rangeModelLabel:$('#rangeModelLabel'), pressureModelCard:$('#pressureModelCard'), pressureImpactText:$('#pressureImpactText'), pressureReliability:$('#pressureReliability'), pressureVerdict:$('#pressureVerdict'),
  currentHandLabel:$('#currentHandLabel'), currentDrawLabel:$('#currentDrawLabel'), opponentsLabel:$('#opponentsLabel'), knownCardsLabel:$('#knownCardsLabel'),
  heroCardsMini:$('#heroCardsMini'), heroMadeHand:$('#heroMadeHand'), improveChance:$('#improveChance'), improveChanceLabel:$('#improveChanceLabel'), touchProbList:$('#touchProbList'), touchHint:$('#touchHint'), handRankingGrid:$('#handRankingGrid'), helpfulCardsBox:$('#helpfulCardsBox'), helpfulCardsList:$('#helpfulCardsList'), helpfulCardsStreet:$('#helpfulCardsStreet'),
  gameMode:$('#gameMode'), blindLevel:$('#blindLevel'), smallBlind:$('#smallBlind'), bigBlind:$('#bigBlind'), ante:$('#ante'), anteMode:$('#anteMode'),
  defaultStack:$('#defaultStack'), dealerSeat:$('#dealerSeat'), previousBlindLevel:$('#previousBlindLevel'), nextBlindLevel:$('#nextBlindLevel'), moveDealer:$('#moveDealer'),
  autoPostBlinds:$('#autoPostBlinds'), autoMoveDealer:$('#autoMoveDealer'), postBlinds:$('#postBlinds'), applyDefaultStack:$('#applyDefaultStack'), betRows:$('#betRows'),
  potSummary:$('#potSummary'), potWinner:$('#potWinner'), awardPot:$('#awardPot'),
  autoPot:$('#autoPot'), contestablePot:$('#contestablePot'), autoCall:$('#autoCall'), requiredEquity:$('#requiredEquity'), effectiveStack:$('#effectiveStack'), sprValue:$('#sprValue'), callEv:$('#callEv'), reviewVerdict:$('#reviewVerdict'), potResult:$('#potResult'),
  cardModal:$('#cardModal'), modalTitle:$('#modalTitle'), removeCard:$('#removeCard'), modalDeck:$('#modalDeck'),
  playerModal:$('#playerModal'), playerModalTitle:$('#playerModalTitle'), markActive:$('#markActive'), markFolded:$('#markFolded'), markAllIn:$('#markAllIn'), removePlayer:$('#removePlayer'),
  playerStack:$('#playerStack'), playerCommitted:$('#playerCommitted'), playerStreetBet:$('#playerStreetBet'), playerProfile:$('#playerProfile'), playerRangeAction:$('#playerRangeAction'),
  playerAddSB:$('#playerAddSB'), playerAddBB:$('#playerAddBB'), playerMatchBet:$('#playerMatchBet'), playerMinRaise:$('#playerMinRaise'), playerAllInBet:$('#playerAllInBet'),
  revealedSlots:$('#revealedSlots'), revealedSelectionHint:$('#revealedSelectionHint'), clearRevealed:$('#clearRevealed'), playerDeck:$('#playerDeck'),
  pressureModal:$('#pressureModal'), pressureModalTitle:$('#pressureModalTitle'), pressureStreetButtons:$('#pressureStreetButtons'), clearPressure:$('#clearPressure'),
  openEstimatedHands:$('#openEstimatedHands'), estimatedHandsModal:$('#estimatedHandsModal'), estimatedHandsPlayer:$('#estimatedHandsPlayer'), estimatedHandsSummary:$('#estimatedHandsSummary'), estimatedHandsGrid:$('#estimatedHandsGrid'),
  outsModal:$('#outsModal'), outsCurrentSummary:$('#outsCurrentSummary'), drawsList:$('#drawsList'), futureTable:$('#futureTable'),
  termModal:$('#termModal'), termTitle:$('#termTitle'), termDefinition:$('#termDefinition'), termExample:$('#termExample'), termWinamaxLabel:$('#termWinamaxLabel'),
  removePlayerConfirmModal:$('#removePlayerConfirmModal'), removePlayerConfirmText:$('#removePlayerConfirmText'), cancelRemovePlayer:$('#cancelRemovePlayer'), confirmRemovePlayer:$('#confirmRemovePlayer'),
  finishHandModal:$('#finishHandModal'), finishHandSummary:$('#finishHandSummary'), finishReason:$('#finishReason'), finishWinnerLabel:$('#finishWinnerLabel'), finishWinner:$('#finishWinner'), finishStreet:$('#finishStreet'), finishPot:$('#finishPot'), finishEligible:$('#finishEligible'), finishHandHelp:$('#finishHandHelp'), cancelFinishHand:$('#cancelFinishHand'), confirmFinishHand:$('#confirmFinishHand')
};

function money(value) {
  const decimals = state.gameMode === 'cash' ? 2 : 0;
  return `${Number(value || 0).toLocaleString('fr-FR',{minimumFractionDigits:decimals,maximumFractionDigits:decimals})} ${state.gameMode === 'cash' ? '€' : 'jetons'}`;
}
function numeric(input, fallback = 0) {
  const value = Number(input);
  return Number.isFinite(value) ? value : fallback;
}
function clamp(value,min,max) { return Math.min(max,Math.max(min,value)); }
function heroPlayer() { return state.players.find(player => player.isHero); }
function opponents() { return state.players.filter(player => !player.isHero); }
function activePlayers() { return state.players.filter(player => player.status === 'active' || player.status === 'allin'); }
function activeOpponents() { return opponents().filter(player => player.status === 'active' || player.status === 'allin'); }
function foldedPlayers() { return state.players.filter(player => player.status === 'folded'); }
function livingPlayers() { return state.players.filter(player => player.stack>0 && player.status!=='out'); }
function playerById(id) { return state.players.find(player => player.id === Number(id)); }
function selectedPlayer() { return playerById(state.selectedPlayerId); }
function pressurePlayer() { return playerById(state.pressurePlayerId); }
function pressureActions(player) {
  if(!player)return [0,0,0,0];
  if(!Array.isArray(player.strongActions))player.strongActions=[0,0,0,0];
  while(player.strongActions.length<4)player.strongActions.push(0);
  return player.strongActions.slice(0,4).map(value=>value===true?1:clamp(Number(value)||0,0,3));
}
function activePressureEntries() {
  const currentStreet=Math.max(0,Math.min(3,state.bettingStreet));
  return activeOpponents().flatMap(player=>pressureActions(player).map((level,index)=>({player,index,level})).filter(item=>item.level>0&&item.index<=currentStreet));
}
function hasActivePressure(){return activePressureEntries().length>0;}
function totalPot() { return state.deadPot + state.players.reduce((sum,player) => sum + player.committed,0); }
function maxStreetBet() {
  const live=state.players.filter(player=>player.status!=='folded'&&player.status!=='out').reduce((max,player)=>Math.max(max,player.streetBet),0);
  return Math.max(live,state.deadStreetBet);
}
function toCallFor(player) { return Math.max(0, Math.min(player.stack, maxStreetBet() - player.streetBet)); }
function allKnownCards() {
  return [
    ...state.heroCards,
    ...state.board,
    ...state.deadCards,
    ...state.players.flatMap(player => player.revealed)
  ].filter(Boolean);
}
function revealedCards() { return [...state.deadCards, ...state.players.flatMap(player => player.revealed)].filter(Boolean); }
function nextEmptySlot() {
  const heroIndex = state.heroCards.findIndex(card => !card);
  if (heroIndex !== -1) return {area:'hero',index:heroIndex};
  const boardIndex = state.board.findIndex(card => !card);
  if (boardIndex !== -1) return {area:'board',index:boardIndex};
  return {area:'board',index:4};
}
function getSlotCard(slot) { return slot.area === 'hero' ? state.heroCards[slot.index] : state.board[slot.index]; }
function setSlotCard(slot,card) { if (slot.area === 'hero') state.heroCards[slot.index]=card; else state.board[slot.index]=card; }
function completeBoardCount() {
  let count=0;
  for (const card of state.board) { if (!card) break; count += 1; }
  return count;
}
function validateBoardOrder() {
  let emptySeen=false;
  for (const card of state.board) {
    if (!card) emptySeen=true;
    else if (emptySeen) return false;
  }
  const count=state.board.filter(Boolean).length;
  return count===0 || count>=3;
}
function boardStreet() {
  const count=completeBoardCount();
  if (count===0) return 'Préflop';
  if (count===3) return 'Flop';
  if (count===4) return 'Turn';
  if (count===5) return 'River';
  return 'Board incomplet';
}
function cardLabel(card) { return card ? `${card.rankLabel}${card.suitSymbol}` : 'vide'; }
function cardMarkup(card) {
  if (!card) return '<span class="card-empty-symbol" aria-hidden="true">+</span>';
  return `<span class="card-corner top"><span class="rank">${card.rankLabel}</span><span class="suit">${card.suitSymbol}</span></span><span class="card-center-suit">${card.suitSymbol}</span><span class="card-corner bottom"><span class="rank">${card.rankLabel}</span><span class="suit">${card.suitSymbol}</span></span>`;
}

function positionMap() {
  const players=state.players.filter(player=>player.status!=='out');
  const count=players.length;
  const map=new Map(state.players.filter(player=>player.status==='out').map(player=>[player.id,'OUT']));
  if(!count)return map;
  let dealerIndex=players.findIndex(player=>player.id===state.dealerId);
  if(dealerIndex<0){dealerIndex=0;state.dealerId=players[0].id;}
  let labels;
  if(count===2)labels=['BTN/SB','BB'];
  else if(count===3)labels=['BTN','SB','BB'];
  else if(count===4)labels=['BTN','SB','BB','UTG'];
  else if(count===5)labels=['BTN','SB','BB','UTG','CO'];
  else if(count===6)labels=['BTN','SB','BB','UTG','HJ','CO'];
  else if(count===7)labels=['BTN','SB','BB','UTG','MP','HJ','CO'];
  else if(count===8)labels=['BTN','SB','BB','UTG','UTG+1','MP','HJ','CO'];
  else labels=['BTN','SB','BB','UTG','UTG+1','MP','MP+1','HJ','CO'];
  for(let offset=0;offset<count;offset+=1){
    const player=players[(dealerIndex+offset)%count];
    map.set(player.id,labels[offset]||`P${offset+1}`);
  }
  return map;
}
function nextLivingPlayerAfter(startIndex,includeStart=false) {
  const seated=state.players;
  if(!seated.length)return null;
  const firstOffset=includeStart?0:1;
  for(let offset=firstOffset;offset<=seated.length;offset+=1){
    const player=seated[(startIndex+offset+seated.length)%seated.length];
    if(player.stack>0&&player.status!=='out')return player;
  }
  return null;
}
function blindPlayers() {
  const live=livingPlayers();
  if(live.length<2)return {sb:null,bb:null};
  let dealerIndex=state.players.findIndex(player=>player.id===state.dealerId);
  if(dealerIndex<0)dealerIndex=0;
  let dealer=nextLivingPlayerAfter(dealerIndex,true);
  if(!dealer)return {sb:null,bb:null};
  state.dealerId=dealer.id;
  dealerIndex=state.players.findIndex(player=>player.id===dealer.id);
  if(live.length===2){
    const bb=nextLivingPlayerAfter(dealerIndex,false);
    return {sb:dealer,bb};
  }
  const sb=nextLivingPlayerAfter(dealerIndex,false);
  const sbIndex=state.players.findIndex(player=>player.id===sb?.id);
  const bb=sb?nextLivingPlayerAfter(sbIndex,false):null;
  return {sb,bb};
}
function rotateDealer() {
  if(livingPlayers().length<2)return;
  let index=state.players.findIndex(player=>player.id===state.dealerId);
  if(index<0)index=0;
  const next=nextLivingPlayerAfter(index,false);
  if(next)state.dealerId=next.id;
}

function seatPositions(totalPlayers) {
  const count=totalPlayers-1;
  const layouts={
    1:[[50,15]],
    2:[[24,22],[76,22]],
    3:[[14,43],[50,14],[86,43]],
    4:[[12,56],[28,18],[72,18],[88,56]],
    5:[[11,57],[25,22],[50,13],[75,22],[89,57]],
    6:[[10,58],[19,31],[38,13],[62,13],[81,31],[90,58]],
    7:[[9,59],[16,36],[31,17],[50,11],[69,17],[84,36],[91,59]],
    8:[[8,60],[13,41],[26,21],[42,12],[58,12],[74,21],[87,41],[92,60]]
  };
  return (layouts[count]||[]).map(([left,top])=>({left,top}));
}

function createCardButton(card,slot) {
  const button=document.createElement('button');
  button.type='button';
  const active=state.activeSlot.area===slot.area && state.activeSlot.index===slot.index;
  button.className=`card-slot${card?'':' is-empty'}${card?.red?' red':''}${card?` suit-${card.suit}`:''}${active?' active':''}`;
  button.innerHTML=cardMarkup(card);
  button.setAttribute('aria-label',`${slot.area==='hero'?'Ta carte':'Carte du board'} ${slot.index+1}, ${cardLabel(card)}`);
  button.addEventListener('click',()=>{state.activeSlot=slot;renderSlots();openCardModal(slot);});
  return button;
}
function renderSlots() {
  els.heroSlots.replaceChildren(...state.heroCards.map((card,index)=>createCardButton(card,{area:'hero',index})));
  els.boardSlots.replaceChildren(...state.board.map((card,index)=>createCardButton(card,{area:'board',index})));
}

function statusLabel(status) {
  if(status==='folded')return 'couché';
  if(status==='allin')return 'tapis';
  if(status==='out')return 'éliminé';
  return 'dans le coup';
}
function renderSeats() {
  const positions=seatPositions(state.players.length);
  const positionLabels=positionMap();
  const opponentList=opponents();
  const nodes=opponentList.map((player,index)=>{
    const pos=positions[index];
    const wrapper=document.createElement('div');
    wrapper.className=`seat seat-wrapper status-${player.status}${player.revealed.some(Boolean)?' has-revealed':''}`;
    wrapper.style.left=`${pos.left}%`;
    wrapper.style.top=`${pos.top}%`;

    const main=document.createElement('button');
    main.type='button';
    main.className='seat-main';
    const cards=player.revealed.map(card=>`<span class="seat-mini-card${card?.red?' red':''}${card?` suit-${card.suit}`:''}">${card?cardLabel(card):'?'}</span>`).join('');
    main.innerHTML=`<div class="seat-badge"><span>${player.name}</span></div><div class="avatar-chip">${player.status==='folded'?'×':player.status==='allin'?'AI':player.status==='out'?'OUT':player.id}</div><small>${statusLabel(player.status)}</small>${player.revealed.some(Boolean)?`<div class="seat-mini-cards">${cards}</div>`:''}`;
    main.setAttribute('aria-label',`${player.name}, ${statusLabel(player.status)}. Cliquer pour gérer.`);
    main.addEventListener('click',()=>openPlayerModal(player.id));

    const remove=document.createElement('button');
    remove.type='button';
    remove.className='seat-remove-button';
    remove.textContent='×';
    remove.setAttribute('aria-label',`Supprimer ${player.name} de la table`);
    remove.title=`Supprimer ${player.name}`;
    remove.addEventListener('click',event=>{
      event.stopPropagation();
      requestRemovePlayer(player.id);
    });

    const pressure=document.createElement('button');
    pressure.type='button';
    const pressureLevels=pressureActions(player);
    const pressureCount=pressureLevels.filter(level=>level>0).length;
    const maxPressure=Math.max(0,...pressureLevels);
    pressure.className=`seat-pressure-button${pressureCount?' is-active':''} level-${maxPressure}`;
    pressure.textContent=maxPressure===3?'+++':maxPressure===2?'++':'+';
    pressure.setAttribute('aria-label',`Actions de ${player.name}`);
    pressure.title=pressureCount?`${pressureCount} tour${pressureCount>1?'s':''} renseigné${pressureCount>1?'s':''}`:'Renseigner la force des actions';
    pressure.addEventListener('click',event=>{event.stopPropagation();openPressureModal(player.id);});

    wrapper.append(main,remove,pressure);
    return wrapper;
  });
  els.seatLayer.replaceChildren(...nodes);
  const hero=heroPlayer();
  els.heroPosition.textContent=positionLabels.get(hero.id)||'';
  els.heroTableStatus.textContent=`${statusLabel(hero.status)} · ${money(hero.stack)}`;
  els.heroTableStatus.className=`hero-status-chip status-${hero.status}`;
}

function openPressureModal(id){
  const player=playerById(id);if(!player||player.isHero)return;
  state.pressurePlayerId=player.id;
  renderPressureModal();
  els.pressureModal.showModal();
}
function renderPressureModal(){
  const player=pressurePlayer();if(!player)return;
  const levels=pressureActions(player);
  els.pressureModalTitle.textContent=`${player.name} · actions`;
  const levelText=['Aucune action marquée','+ Action forte','++ Action très forte','+++ Tout engager'];
  els.pressureStreetButtons.querySelectorAll('[data-pressure-street]').forEach(button=>{
    const index=Number(button.dataset.pressureStreet);const level=levels[index]||0;
    button.classList.toggle('is-current',index===state.bettingStreet);
    button.classList.remove('level-1','level-2','level-3','is-on');
    if(level>0)button.classList.add('is-on',`level-${level}`);
    button.dataset.level=String(level);
    button.setAttribute('aria-pressed',String(level>0));
    const small=button.querySelector('small');if(small)small.textContent=levelText[level];
  });
}
function togglePressureStreet(index){
  const player=pressurePlayer();if(!player)return;
  const levels=pressureActions(player);levels[index]=(levels[index]+1)%4;player.strongActions=levels;
  renderPressureModal();renderSeats();renderPressureProbabilityVisibility();scheduleCalculation();
}
function clearPlayerPressure(){
  const player=pressurePlayer();if(!player)return;player.strongActions=[0,0,0,0];
  renderPressureModal();renderSeats();renderPressureProbabilityVisibility();scheduleCalculation();
}
function pressureSummary(){
  const grouped=new Map();
  for(const {player,index,level} of activePressureEntries()){
    if(!grouped.has(player.id))grouped.set(player.id,{player,streets:[]});
    grouped.get(player.id).streets.push(`${STREET_NAMES[index]} ${'+'.repeat(level)}`);
  }
  return [...grouped.values()].map(item=>`${item.player.name}: ${item.streets.join(' · ')}`).join(' · ');
}

const ESTIMATED_RANGE_RANKS=[14,13,12,11,10,9,8,7,6,5,4,3,2];
function estimatedRangeRankLabel(rank){return rank===14?'A':rank===13?'K':rank===12?'Q':rank===11?'J':rank===10?'10':String(rank);}
function estimatedRangePlayers(){
  const ids=new Set(activePressureEntries().map(entry=>entry.player.id));
  return activeOpponents().filter(player=>ids.has(player.id));
}
function estimatedRangeClass(row,column){
  const a=ESTIMATED_RANGE_RANKS[row],b=ESTIMATED_RANGE_RANKS[column];
  if(a===b)return {high:a,low:b,suited:null,label:`${estimatedRangeRankLabel(a)}${estimatedRangeRankLabel(b)}`};
  const high=Math.max(a,b),low=Math.min(a,b),suited=row<column;
  return {high,low,suited,label:`${estimatedRangeRankLabel(high)}${estimatedRangeRankLabel(low)}${suited?'s':'o'}`};
}
function estimatedRangeCombos(info){
  const id=(rank,suit)=>(rank-2)*4+suit;
  const combos=[];
  if(info.high===info.low){
    for(let s1=0;s1<4;s1+=1)for(let s2=s1+1;s2<4;s2+=1)combos.push([id(info.high,s1),id(info.low,s2)]);
    return combos;
  }
  if(info.suited){for(let suit=0;suit<4;suit+=1)combos.push([id(info.high,suit),id(info.low,suit)]);return combos;}
  for(let s1=0;s1<4;s1+=1)for(let s2=0;s2<4;s2+=1)if(s1!==s2)combos.push([id(info.high,s1),id(info.low,s2)]);
  return combos;
}
function estimatedRangeBlockedIds(target){
  const blocked=new Set();
  state.heroCards.filter(Boolean).forEach(card=>blocked.add(cardToEngineId(card)));
  state.board.filter(Boolean).forEach(card=>blocked.add(cardToEngineId(card)));
  state.deadCards.filter(Boolean).forEach(card=>blocked.add(cardToEngineId(card)));
  state.players.filter(player=>player.id!==target.id).forEach(player=>player.revealed.filter(Boolean).forEach(card=>blocked.add(cardToEngineId(card))));
  return blocked;
}
function estimatedRangeLevel(value){
  if(value>=.80)return 5;if(value>=.60)return 4;if(value>=.40)return 3;if(value>=.20)return 2;if(value>=.08)return 1;return 0;
}
function renderEstimatedHands(){
  if(!els.estimatedHandsGrid||!globalThis.CS_ENGINE)return;
  const eligible=estimatedRangePlayers();
  if(!eligible.length){els.estimatedHandsSummary.textContent='Ajoute une action + / ++ / +++ à un adversaire.';els.estimatedHandsGrid.replaceChildren();return;}
  if(!eligible.some(player=>player.id===state.estimatedHandsPlayerId))state.estimatedHandsPlayerId=eligible[0].id;
  els.estimatedHandsPlayer.replaceChildren(...eligible.map(player=>{const option=document.createElement('option');option.value=String(player.id);option.textContent=player.name;option.selected=player.id===state.estimatedHandsPlayerId;return option;}));
  const target=eligible.find(player=>player.id===state.estimatedHandsPlayerId)||eligible[0];
  const levels=pressureActions(target),currentStreet=Math.max(0,Math.min(3,state.bettingStreet));
  const knownBoard=state.board.filter(Boolean).map(cardToEngineId);
  const knownTarget=target.revealed.filter(Boolean).map(cardToEngineId);
  const blocked=estimatedRangeBlockedIds(target);
  const active=levels.map((level,index)=>level>0&&index<=currentStreet?`${STREET_NAMES[index]} ${'+'.repeat(level)}`:null).filter(Boolean);
  els.estimatedHandsSummary.textContent=`${target.name} · ${active.join(' · ')}${knownTarget.length?' · cartes révélées prises en compte':''}`;
  const nodes=[];
  for(let row=0;row<13;row+=1){
    for(let column=0;column<13;column+=1){
      const info=estimatedRangeClass(row,column);
      const combos=estimatedRangeCombos(info).filter(([a,b])=>!blocked.has(a)&&!blocked.has(b)&&knownTarget.every(id=>id===a||id===b));
      const button=document.createElement('div');button.className='estimated-hand-cell';button.textContent=info.label;
      if(!combos.length){button.classList.add('is-impossible');button.title=`${info.label} · impossible avec les cartes connues`;nodes.push(button);continue;}
      let sum=0;for(const [a,b] of combos)sum+=globalThis.CS_ENGINE.pressureWeightForIds(a,b,knownBoard,levels,currentStreet);
      const average=sum/combos.length,level=estimatedRangeLevel(average);
      button.classList.add(`range-level-${level}`);
      button.title=`${info.label} · compatibilité ${Math.round(average*100)}/100 · ${combos.length} combinaison${combos.length>1?'s':''} possible${combos.length>1?'s':''}`;
      button.setAttribute('aria-label',button.title);
      nodes.push(button);
    }
  }
  els.estimatedHandsGrid.replaceChildren(...nodes);
}
function openEstimatedHands(){
  const eligible=estimatedRangePlayers();if(!eligible.length)return;
  if(!eligible.some(player=>player.id===state.estimatedHandsPlayerId))state.estimatedHandsPlayerId=eligible[0].id;
  renderEstimatedHands();els.estimatedHandsModal.showModal();
}
function renderPressureProbabilityVisibility(){
  if(!els.pressureModelCard)return;
  const active=hasActivePressure();
  els.pressureModelCard.classList.toggle('is-pressure-hidden',!active);
  if(!active){
    els.rangeWinValue.textContent='—';els.rangeEquityValue.textContent='—';els.rangeDeltaValue.textContent='—';els.rangeModelLabel.textContent='0';
    els.rangeContext.textContent='Renseigne + / ++ / +++ sur un joueur.';clearPressureAssessment();
  }
}

function renderDealerSelect() {
  const eligible=livingPlayers();
  const options=eligible.map(player=>{
    const option=document.createElement('option');
    option.value=String(player.id);
    option.textContent=player.isHero?'Hero':player.name;
    option.selected=player.id===state.dealerId;
    return option;
  });
  els.dealerSeat.replaceChildren(...options);
}
function renderBlindLevels() {
  const presets=BLIND_PRESETS[state.gameMode];
  const options=presets.map((preset,index)=>{
    const option=document.createElement('option');
    option.value=String(index);
    option.textContent=preset.label;
    option.selected=index===state.blindLevelIndex;
    return option;
  });
  els.blindLevel.replaceChildren(...options);
}
function renderWinnerSelect() {
  const eligible=state.players.filter(player=>player.status==='active'||player.status==='allin');
  const options=eligible.map(player=>{
    const option=document.createElement('option');
    option.value=String(player.id);
    option.textContent=player.isHero?'Hero':player.name;
    return option;
  });
  els.potWinner.replaceChildren(...options);
  els.awardPot.disabled=options.length===0||totalPot()<=0;
}

function createMoneyInput(value,label,onChange) {
  const input=document.createElement('input');
  input.type='number'; input.min='0'; input.step=state.gameMode==='cash'?'0.01':'1'; input.value=String(value);
  input.setAttribute('aria-label',label);
  input.addEventListener('change',()=>onChange(Math.max(0,numeric(input.value))));
  return input;
}
function renderBetRows() {
  const positions=positionMap();
  const maxBet=maxStreetBet();
  const header=document.createElement('div');
  header.className='bet-row-head';
  header.innerHTML='<span>Joueur / position</span><span>Statut</span><span>Stack restant</span><span>Total engagé</span><span>Mise du tour</span><span>Actions rapides</span><span></span>';
  const rows=state.players.map(player=>{
    const row=document.createElement('div');
    row.className=`bet-row status-${player.status}`;
    const identity=document.createElement('div');
    identity.className='bet-player';
    identity.innerHTML=`<strong>${player.isHero?'Hero':player.name}</strong><span>${positions.get(player.id)||''} · ${statusLabel(player.status)}</span>`;

    const status=document.createElement('select');
    status.className='compact-select';
    [['active','Actif'],['folded','Couché'],['allin','Tapis'],['out','Éliminé']].forEach(([value,label])=>{
      const option=document.createElement('option');option.value=value;option.textContent=label;option.selected=player.status===value;status.append(option);
    });
    status.addEventListener('change',()=>{setPlayerStatus(player,status.value);renderAll();scheduleCalculation();});

    const stack=createMoneyInput(player.stack,`Stack ${player.name}`,value=>{player.stack=value;if(value<=0)player.status='out';else if(player.status==='out')player.status='active';renderAll();scheduleCalculation();});
    const committed=createMoneyInput(player.committed,`Total engagé ${player.name}`,value=>{setCommitted(player,value);renderAll();scheduleCalculation();});
    const street=createMoneyInput(player.streetBet,`Mise du tour ${player.name}`,value=>{setStreetBet(player,value);renderAll();scheduleCalculation();});

    const actions=document.createElement('div');
    actions.className='row-actions';
    const quick=[
      ['+BB',()=>addContribution(player,state.bigBlind)],
      ['Suivre',()=>matchCurrentBet(player)],
      ['Relance min.',()=>minimumRaise(player)],
      ['Tapis',()=>allIn(player)]
    ];
    quick.forEach(([label,handler])=>{
      const button=document.createElement('button');button.type='button';button.className='btn btn-ghost btn-tiny';button.textContent=label;
      button.disabled=state.handStatus!=='active'||player.status==='folded'||player.status==='out'||player.status==='allin'||player.stack<=0;
      button.addEventListener('click',()=>{handler();renderAll();scheduleCalculation();});actions.append(button);
    });

    const leave=document.createElement('button');
    leave.type='button';leave.className='btn btn-danger btn-tiny';leave.textContent='Quitter';leave.disabled=player.isHero;
    if (player.isHero) leave.style.visibility='hidden';
    leave.addEventListener('click',()=>requestRemovePlayer(player.id));

    row.append(identity,status,stack,committed,street,actions,leave);
    return row;
  });
  els.betRows.replaceChildren(header,...rows);
  els.potSummary.textContent=`Pot : ${money(totalPot())}`;
}

function renderSummary() {
  const active=activePlayers().length;
  const seated=state.players.length;
  els.playersCount.textContent=active===seated?`${active} joueur${active>1?'s':''}`:`${active} dans le coup / ${seated} assis`;
  if(els.setupPlayersSummary)els.setupPlayersSummary.textContent=`${state.tablePlayerCount} joueur${state.tablePlayerCount>1?'s':''} prévus`;
  if(els.setupBlindSummary)els.setupBlindSummary.textContent=`${money(state.smallBlind)} / ${money(state.bigBlind)}`;
  document.body.dataset.handStatus=state.handStatus;
  els.playersMinus.disabled=activeOpponents().length===0;
  els.playersPlus.disabled=!foldedPlayers().some(player=>!player.isHero)&&state.players.length>=9;
  const boardLabel=boardStreet();
  const flowLabel=state.handStatus==='setup'?'Préparation':state.handStatus==='complete'?'Main terminée':STREET_NAMES[state.bettingStreet];
  els.streetName.textContent=state.handStatus==='active'?`${flowLabel} · board ${boardLabel}`:flowLabel;
  els.streetBadge.textContent=flowLabel;
  if(els.tablePotValue)els.tablePotValue.textContent=money(totalPot());

  if(state.handStatus==='setup')els.selectionHint.textContent=state.heroCards.every(Boolean)?'Prêt.':'Choisis tes 2 cartes.';
  else if(state.handStatus==='complete')els.selectionHint.textContent='Main terminée.';
  else if (!state.heroCards[0]||!state.heroCards[1]) els.selectionHint.textContent='Choisis tes 2 cartes.';
  else if (!validateBoardOrder()) els.selectionHint.textContent='Ajoute le flop.';
  else if (state.board.every(Boolean)) els.selectionHint.textContent='Board complet.';
  else els.selectionHint.textContent='Flop → Turn → River.';

  els.commentModeState.textContent=state.coachMode?'activé':'désactivé';
  els.commentModeState.classList.toggle('is-on',state.coachMode);
  els.coachMode.checked=state.coachMode;

  const known=allKnownCards().length;
  els.opponentsLabel.textContent=String(activeOpponents().length);
  els.knownCardsLabel.textContent=`${known}${revealedCards().length?` · ${revealedCards().length} montrée${revealedCards().length>1?'s':''}`:''}`;
  {
    const n=activeOpponents().length;
    els.winContext.textContent=`${n} adversaire${n>1?'s':''} restant${n>1?'s':''}`;
  }
  document.querySelectorAll('[data-player-count]').forEach(button=>{
    const selected=Number(button.dataset.playerCount)===state.tablePlayerCount;
    button.classList.toggle('is-selected',selected);
    button.setAttribute('aria-pressed',selected?'true':'false');
  });
}

function renderPokerReference() {
  const preset=FORMAT_PRESETS[state.formatPreset]||FORMAT_PRESETS.custom;
  els.formatPreset.value=state.formatPreset;
  els.cardTheme.value=state.cardTheme;
  els.formatDescription.textContent=preset.description;
  els.tableFormatLabel.textContent=preset.tableLabel;
  document.body.dataset.cardTheme=state.cardTheme;
}

function heroSuggestedBet() {
  const pot=Math.max(totalPot(),state.bigBlind);
  return Math.max(state.bigBlind,pot*.5);
}
function updateHeroActionBar() {
  const hero=heroPlayer();
  if(!hero)return;
  const call=toCallFor(hero);
  const highest=maxStreetBet();
  const locked=state.handStatus!=='active'||hero.status==='folded'||hero.status==='allin'||hero.status==='out'||hero.stack<=0;
  els.heroFold.disabled=locked;
  els.heroCheckCall.disabled=locked;
  els.heroBetRaise.disabled=locked;
  els.heroAllIn.disabled=locked;
  els.heroCheckCall.textContent=call>0?`SUIVRE ${money(call)}`:'PAROLE';
  els.heroBetRaise.textContent=highest>0?`RELANCER À ${money(Math.min(hero.streetBet+hero.stack,minimumRaiseTarget(hero)))}`:`MISER ${money(Math.min(hero.stack,heroSuggestedBet()))}`;
  els.heroAllIn.textContent=`TAPIS ${money(hero.stack)}`;
  if(state.handStatus==='setup') els.heroActionHint.textContent='Démarre la main avant de saisir les actions.';
  else if(state.handStatus==='complete') els.heroActionHint.textContent='Cette main est terminée. Lance la main suivante.';
  else if(hero.status==='folded') els.heroActionHint.textContent='Hero a passé : la main est terminée pour lui.';
  else if(hero.status==='allin') els.heroActionHint.textContent='Hero est à tapis : il reste seulement le calcul du showdown.';
  else if(call>0) els.heroActionHint.textContent=`Il faut ${money(call)} pour suivre la mise actuelle.`;
  else els.heroActionHint.textContent='Personne n’a misé davantage : Hero peut dire parole ou miser.';
}
function applyHeroPotSize(fraction) {
  const hero=heroPlayer();
  if(!hero||hero.status!=='active'||hero.stack<=0)return;
  const pot=Math.max(totalPot(),state.bigBlind);
  const highest=maxStreetBet();
  const call=toCallFor(hero);
  let target;
  if(highest<=hero.streetBet)target=hero.streetBet+Math.max(state.bigBlind,pot*fraction);
  else target=Math.max(minimumRaiseTarget(hero),highest+(pot+call)*fraction);
  betOrRaiseTo(hero,target);
  renderAll();scheduleCalculation();
}
function applyFormatPreset(key) {
  if(key==='custom') {state.formatPreset='custom';renderAll();return;}
  const preset=FORMAT_PRESETS[key]||FORMAT_PRESETS.cash5;
  state.formatPreset=key;
  state.gameMode=preset.mode;
  state.blindLevelIndex=preset.blindIndex;
  state.smallBlind=preset.sb;state.bigBlind=preset.bb;state.ante=preset.ante;state.anteMode='all';state.defaultStack=preset.stack;
  state.players=makeTablePlayers(preset.seats,preset.stack);state.tablePlayerCount=preset.seats;state.removedThisHand=[];state.nextPlayerId=preset.seats+1;state.dealerId=1;
  state.heroCards=[null,null];state.board=[null,null,null,null,null];state.activeSlot={area:'hero',index:0};
  state.deadPot=0;state.deadStreetBet=0;state.lastFullRaise=0;state.deadCards=[];state.removedThisHand=[];state.bettingStreet=0;state.blindsPosted=false;state.selectedPlayerId=null;
  state.handStatus='setup';state.handNumber=0;
  clearSimulationResults(`${preset.label} prêt. Règle les stacks puis démarre la main.`);
  renderAll();
}
function markCustomFormat() {
  state.formatPreset='custom';
}
function openTermDefinition(key) {
  const item=GLOSSARY[key];
  if(!item)return;
  els.termTitle.textContent=item.title;
  els.termDefinition.textContent=item.definition;
  els.termExample.textContent=item.example||'';
  els.termWinamaxLabel.textContent=item.room||'Terme standard du poker en ligne.';
  els.termModal.showModal();
}

function renderSettings() {
  els.gameMode.value=state.gameMode;
  els.smallBlind.value=String(state.smallBlind);
  els.bigBlind.value=String(state.bigBlind);
  els.ante.value=String(state.ante);
  els.anteMode.value=state.anteMode;
  els.defaultStack.value=String(state.defaultStack);
  els.autoPostBlinds.checked=state.autoPostBlinds;
  els.autoMoveDealer.checked=state.autoMoveDealer;
  renderBlindLevels();renderDealerSelect();renderWinnerSelect();
}
function renderHandFlow() {
  const isSetup=state.handStatus==='setup';
  const isActive=state.handStatus==='active';
  const isComplete=state.handStatus==='complete';
  const street=STREET_NAMES[state.bettingStreet]||'Préflop';
  const eligible=activePlayers();

  els.handFlowSteps.querySelectorAll('[data-step]').forEach(step=>{
    const key=step.dataset.step;
    const active=(isSetup&&key==='setup')||(isComplete&&key==='complete')||(isActive&&key===String(state.bettingStreet));
    const done=isActive&&key!=='setup'&&!Number.isNaN(Number(key))&&Number(key)<state.bettingStreet;
    step.classList.toggle('is-active',active);
    step.classList.toggle('is-done',done||(isComplete&&key!=='complete'));
  });

  if(isSetup){
    els.handStateBadge.textContent='Prêt';
    els.handStateTitle.textContent='Prêt';
    els.handStateHint.textContent='Choisis tes 2 cartes : la main démarrera automatiquement.';
    els.newHand.textContent='Démarrer';
  }else if(isActive){
    els.handStateBadge.textContent=`Main ${state.handNumber}`;
    els.handStateTitle.textContent=eligible.length===1?'Un seul joueur reste':`${street} en cours`;
    els.handStateHint.textContent=eligible.length===1
      ?'Un seul joueur reste. Tu peux terminer la main.'
      :'Ajoute le flop, la turn et la river, puis termine la main.';
    els.newHand.textContent='En cours';
  }else{
    els.handStateBadge.textContent='Terminée';
    els.handStateTitle.textContent=`Main ${state.handNumber} validée`;
    els.handStateHint.textContent='Choisis tes 2 cartes : la nouvelle main démarrera automatiquement.';
    els.newHand.textContent='Main suivante';
  }

  // V10.3 : plus de bouton « Démarrer / Main suivante ».
  // La main démarre automatiquement dès que les 2 cartes Hero sont choisies.
  els.newHand.disabled=true;
  els.newHand.hidden=true;
  els.advanceStreet.disabled=true;
  els.advanceStreet.hidden=true;
  els.finishHand.disabled=!isActive;
  els.finishHand.hidden=!isActive;
  els.finishHand.textContent='Terminer';
  els.applyDefaultStack.disabled=isActive;
  els.formatPreset.disabled=isActive;
  els.defaultStack.disabled=isActive;
  els.smallBlind.disabled=isActive;
  els.bigBlind.disabled=isActive;
  els.postBlinds.disabled=!isActive||state.blindsPosted;
  els.postBlinds.textContent=state.blindsPosted?'Blindes déjà postées':'Poster maintenant';
}
function markHandComplete(message='Main terminée.') {
  // Stoppe aussi tout calcul automatique encore en attente : une ancienne simulation
  // ne doit jamais continuer à modifier l'interface après la fin de la main.
  clearTimeout(state.debounce);
  state.debounce=null;
  state.runningToken+=1;

  state.handStatus='complete';
  state.players.forEach(player=>{
    player.streetBet=0;
    player.committed=0;
    player.revealed=[null,null];
    player.rangeAction='unknown';
    player.strongActions=[0,0,0,0];
  });
  state.deadPot=0;state.deadStreetBet=0;state.lastFullRaise=0;state.deadCards=[];

  // Le nombre choisi en haut de la table reste la référence entre les mains.
  // Les joueurs supprimés pendant la main reviennent immédiatement à la fin.
  restoreConfiguredPlayers('active');
  state.players.forEach(player=>{
    player.status=player.stack>0?'active':'out';
    player.committed=0;player.streetBet=0;player.revealed=[null,null];player.rangeAction='unknown';player.strongActions=[0,0,0,0];
  });

  // Efface visiblement la main terminée, même si elle s'est arrêtée au flop/turn/river.
  state.heroCards=[null,null];
  state.board=[null,null,null,null,null];
  state.activeSlot={area:'hero',index:0};
  state.bettingStreet=0;
  state.blindsPosted=false;
  state.selectedPlayerId=null;
  state.pressurePlayerId=null;

  clearSimulationResults(message);
  renderAll();
}

function finishHandSimple() {
  if(state.handStatus!=='active')return;

  // Annule immédiatement une mise à jour automatique programmée après la saisie du board.
  clearTimeout(state.debounce);
  state.debounce=null;
  state.runningToken+=1;

  // La version minimale ne demande ni gagnant ni confirmation.
  // Les mises non attribuées sont rendues, puis la table revient directement à l'état "main terminée".
  state.players.forEach(player=>{
    player.stack+=player.committed;
    player.committed=0;player.streetBet=0;
  });
  state.removedThisHand.forEach(item=>{
    const player=item.player;
    player.stack+=player.committed;
    player.committed=0;player.streetBet=0;
  });
  state.deadPot=0;state.deadStreetBet=0;state.lastFullRaise=0;
  if(els.cardModal.open)els.cardModal.close();
  if(els.playerModal.open)els.playerModal.close();
  if(els.pressureModal.open)els.pressureModal.close();
  if(els.finishHandModal.open)els.finishHandModal.close();

  markHandComplete(`Main ${state.handNumber} terminée · ${state.tablePlayerCount} joueurs prêts pour la suivante.`);
}

function renderFinishHandModal() {
  const eligible=state.players.filter(player=>player.status==='active'||player.status==='allin');
  const options=eligible.map(player=>{
    const option=document.createElement('option');
    option.value=String(player.id);
    option.textContent=player.isHero?'Hero':player.name;
    return option;
  });
  els.finishWinner.replaceChildren(...options);
  els.finishStreet.textContent=STREET_NAMES[state.bettingStreet]||'Préflop';
  els.finishPot.textContent=money(totalPot());
  els.finishEligible.textContent=String(eligible.length);
  els.finishHandSummary.textContent=eligible.length===1
    ? `${eligible[0].isHero?'Hero':eligible[0].name} est le seul joueur encore dans le coup.`
    : `${eligible.length} joueurs sont encore éligibles au pot.`;

  if(totalPot()<=0||eligible.length===0)els.finishReason.value='none';
  else if(eligible.length===1)els.finishReason.value='folds';
  else els.finishReason.value='manual';
  if(eligible.length===1)els.finishWinner.value=String(eligible[0].id);
  updateFinishReasonUi();
}

function updateFinishReasonUi() {
  const reason=els.finishReason.value;
  const needsWinner=reason==='folds'||reason==='manual'||reason==='showdown';
  els.finishWinnerLabel.hidden=!needsWinner;
  if(reason==='showdown'){
    els.finishHandHelp.textContent='Si toutes les cartes du showdown sont connues, les pots principal et secondaires seront répartis automatiquement. Sinon, le gagnant choisi sera utilisé uniquement pour un pot simple.';
  }else if(reason==='folds'){
    els.finishHandHelp.textContent='Choisis le dernier joueur encore dans le coup. Les mises des joueurs couchés restent dans le pot.';
  }else if(reason==='manual'){
    els.finishHandHelp.textContent='Utilise ce choix lorsqu’un gagnant est connu sans saisir toutes les cartes.';
  }else{
    els.finishHandHelp.textContent='Disponible uniquement lorsque le pot est déjà à zéro.';
  }
}

function openFinishHandModal() {
  if(state.handStatus!=='active')return;
  renderFinishHandModal();
  els.finishHandModal.showModal();
}

function confirmFinishHand() {
  const reason=els.finishReason.value;
  if(reason==='none'){
    if(totalPot()>0){
      els.finishHandHelp.textContent='Le pot contient encore des jetons : attribue-le avant de terminer la main.';
      return;
    }
    els.finishHandModal.close();
    markHandComplete('Main terminée sans pot à attribuer.');
    return;
  }

  const winnerId=Number(els.finishWinner.value);
  if(!winnerId){els.finishHandHelp.textContent='Choisis un gagnant.';return;}
  els.potWinner.value=String(winnerId);
  if(!awardPot()){
    els.finishHandHelp.textContent=els.potResult.textContent||'Impossible de répartir le pot avec les informations actuelles.';
    return;
  }
  els.finishHandModal.close();
  markHandComplete(reason==='showdown'?'Showdown validé et pot réparti.':'Gagnant validé et pot attribué.');
}

function applyDefaultStackToAll() {
  if(state.handStatus==='active')return;
  state.defaultStack=Math.max(0,numeric(els.defaultStack.value,state.defaultStack));
  const stack=state.defaultStack;
  state.players.forEach(player=>{
    player.stack=stack;player.committed=0;player.streetBet=0;
    player.status=stack>0?'active':'out';
  });
  state.deadPot=0;state.deadStreetBet=0;state.lastFullRaise=0;
  clearSimulationResults(`Stack de départ ${money(stack)} appliqué à tous les joueurs.`);
  renderAll();
}

function renderAll() {
  renderPokerReference();renderSlots();renderSeats();renderSummary();renderSettings();renderBetRows();renderHandFlow();updateHeroActionBar();updateQuickRead();renderHeroOutcomeGuide();renderHelpfulCards();renderPressureProbabilityVisibility();updateAnalysis();updateCommentary();updateOutsModalContent();updatePrecisionHint();
}

function setCommitted(player,newValue) {
  newValue=Math.max(player.streetBet,Math.max(0,newValue));
  const delta=newValue-player.committed;
  if(delta>0){
    const paid=Math.min(delta,player.stack);
    player.stack-=paid;player.committed+=paid;
    if(paid>0&&player.stack<=0&&player.status==='active')player.status='allin';
  }else if(delta<0){
    const refund=Math.min(-delta,Math.max(0,player.committed-player.streetBet));
    player.stack+=refund;player.committed-=refund;
    if(player.stack>0&&player.status==='out')player.status='active';
  }
}
function registerBetOrRaise(previousHigh,newStreetBet) {
  if(newStreetBet<=previousHigh)return;
  const increment=newStreetBet-previousHigh;
  if(increment>=Math.max(state.bigBlind,state.lastFullRaise))state.lastFullRaise=increment;
}
function setStreetBet(player,newValue) {
  newValue=Math.max(0,newValue);
  const previousHigh=maxStreetBet();
  const delta=newValue-player.streetBet;
  if(delta>0){
    addContribution(player,delta);
    registerBetOrRaise(previousHigh,player.streetBet);
  }else if(delta<0){
    const refund=Math.min(-delta,player.streetBet);
    player.streetBet-=refund;player.committed=Math.max(0,player.committed-refund);player.stack+=refund;
    if(player.stack>0&&player.status==='out')player.status='active';
  }
}
function addContribution(player,amount) {
  if(player.status==='folded'||player.status==='out'||amount<=0)return 0;
  const paid=Math.min(player.stack,Math.max(0,amount));
  if(paid<=0)return 0;
  player.stack-=paid;player.committed+=paid;player.streetBet+=paid;
  if(player.stack<=0&&player.status==='active')player.status='allin';
  return paid;
}
function addDeadContribution(player,amount) {
  if(player.status==='folded'||player.status==='out'||amount<=0)return 0;
  const paid=Math.min(player.stack,Math.max(0,amount));
  if(paid<=0)return 0;
  player.stack-=paid;player.committed+=paid;
  if(player.stack<=0&&player.status==='active')player.status='allin';
  return paid;
}
function matchCurrentBet(player){addContribution(player,toCallFor(player));}
function minimumRaiseTarget() {return maxStreetBet()+Math.max(state.bigBlind,state.lastFullRaise);}
function betOrRaiseTo(player,target) {
  const previousHigh=maxStreetBet();
  addContribution(player,Math.max(0,Math.min(player.streetBet+player.stack,target)-player.streetBet));
  registerBetOrRaise(previousHigh,player.streetBet);
}
function minimumRaise(player){betOrRaiseTo(player,minimumRaiseTarget());}
function allIn(player){
  const previousHigh=maxStreetBet();
  const paid=addContribution(player,player.stack);
  if(paid>0)registerBetOrRaise(previousHigh,player.streetBet);
  if(player.stack<=0&&player.status!=='folded'&&player.status!=='out')player.status='allin';
}
function setPlayerStatus(player,status) {
  if(player.stack<=0&&(status==='active'||status==='allin')){player.status='out';return;}
  player.status=status;
  if(status==='allin'&&player.stack>0)allIn(player);
}
function requestRemovePlayer(id) {
  const player=playerById(id);
  if(!player||player.isHero)return;
  removePlayerFromTable(id,{remember:true});
  renderAll();
  scheduleCalculation();
}
function cancelRemovePlayerRequest() {
  state.pendingRemovePlayerId=null;
  if(els.removePlayerConfirmModal.open)els.removePlayerConfirmModal.close();
}
function confirmRemovePlayerRequest() {
  const id=state.pendingRemovePlayerId;
  if(id===null)return;
  state.pendingRemovePlayerId=null;
  removePlayerFromTable(id);
  if(els.removePlayerConfirmModal.open)els.removePlayerConfirmModal.close();
  renderAll();
  scheduleCalculation();
}
function removePlayerFromTable(id,{remember=false}={}) {
  const player=playerById(id);
  if(!player||player.isHero)return;
  const originalIndex=state.players.findIndex(item=>item.id===id);
  if(remember&&!state.removedThisHand.some(item=>item.player.id===id)){
    state.removedThisHand.push({player,index:originalIndex});
  }

  const existingDeadKeys=new Set(state.deadCards.map(card=>card.key));
  player.revealed.filter(Boolean).forEach(card=>{
    if(!existingDeadKeys.has(card.key)){state.deadCards.push(card);existingDeadKeys.add(card.key);}
  });

  if(state.dealerId===id){
    const index=state.players.findIndex(item=>item.id===id);
    const next=nextLivingPlayerAfter(index,false);
    state.dealerId=next?.id||state.players.find(item=>item.id!==id)?.id||1;
  }
  state.deadStreetBet=Math.max(state.deadStreetBet,player.streetBet);
  state.deadPot+=player.committed;
  state.players=state.players.filter(item=>item.id!==id);
  if(state.selectedPlayerId===id){state.selectedPlayerId=null;if(els.playerModal.open)els.playerModal.close();}
}
function restoreConfiguredPlayers(status='folded') {
  const target=clamp(Math.round(Number(state.tablePlayerCount)||4),2,9);
  const returning=[...state.removedThisHand].sort((a,b)=>a.index-b.index);
  for(const item of returning){
    if(state.players.length>=target)break;
    if(state.players.some(player=>player.id===item.player.id))continue;
    const player=item.player;
    player.committed=0;player.streetBet=0;
    if(player.stack<=0)player.status='out';
    else player.status=status;
    const insertAt=Math.max(1,Math.min(item.index,state.players.length));
    state.players.splice(insertAt,0,player);
  }
  state.removedThisHand=[];
  while(state.players.length<target){
    const player=makePlayer(state.nextPlayerId++,false,state.defaultStack);
    player.status=status==='active'?'active':'folded';
    state.players.push(player);
  }
  while(state.players.length>target){
    const index=state.players.map(player=>player.isHero).lastIndexOf(false);
    if(index<0)break;
    state.players.splice(index,1);
  }
  if(!state.players.some(player=>player.id===state.dealerId)){
    state.dealerId=state.players[0]?.id||1;
  }
}

function addOrReactivatePlayer() {
  const folded=[...opponents()].reverse().find(player=>player.status==='folded');
  if (folded) {folded.status='active';return;}
  if (state.players.length>=9) return;
  state.players.push(makePlayer(state.nextPlayerId++,false,state.defaultStack));
}
function setPlayerCount(target) {
  target=clamp(Math.round(Number(target)||state.tablePlayerCount||state.players.length),2,9);
  state.tablePlayerCount=target;
  state.removedThisHand=[];
  while(state.players.length>target){
    const player=[...opponents()].reverse()[0];
    if(!player)break;
    removePlayerFromTable(player.id,{remember:false});
  }
  while(state.players.length<target){
    state.players.push(makePlayer(state.nextPlayerId++,false,state.defaultStack));
  }
  markCustomFormat();
  renderAll();
  scheduleCalculation();
}


function foldLastOpponent() {
  const player=[...opponents()].reverse().find(item=>item.status==='active');
  if (player) player.status='folded';
}

function applyBlindPreset(index) {
  const presets=BLIND_PRESETS[state.gameMode];
  state.blindLevelIndex=clamp(index,0,presets.length-1);
  const preset=presets[state.blindLevelIndex];
  state.smallBlind=preset.sb;state.bigBlind=preset.bb;state.ante=preset.ante;
}
function postBlindsAndAntes() {
  if(state.blindsPosted||livingPlayers().length<2)return;
  const {sb,bb}=blindPlayers();
  const eligible=livingPlayers();
  if(state.ante>0){
    if(state.anteMode==='all')eligible.forEach(player=>addDeadContribution(player,state.ante));
    else if(bb)addDeadContribution(bb,state.ante);
  }
  if(sb)addContribution(sb,state.smallBlind);
  if(bb)addContribution(bb,state.bigBlind);
  state.blindsPosted=true;
}
function newHand() {
  if(state.handStatus==='active'){
    finishHandSimple();
    return;
  }
  restoreConfiguredPlayers('active');
  if(livingPlayers().length<2){
    els.handStateHint.textContent='Il faut au moins deux joueurs avec un stack supérieur à zéro pour démarrer.';
    return;
  }
  const firstStart=state.handStatus==='setup'&&state.handNumber===0;
  // Si les deux cartes Hero viennent d'être choisies, on les conserve quelle que soit
  // la main précédente. C'est ce qui permet le démarrage automatique après « Terminer ».
  const preparedHero=state.heroCards.every(Boolean)?[...state.heroCards]:[null,null];
  if(state.handNumber>0&&state.autoMoveDealer)rotateDealer();
  state.heroCards=preparedHero;
  state.board=[null,null,null,null,null];
  state.activeSlot=state.heroCards[0]&&state.heroCards[1]?{area:'board',index:0}:nextEmptySlot();
  state.deadPot=0;state.deadStreetBet=0;state.lastFullRaise=0;state.deadCards=[];state.bettingStreet=0;state.blindsPosted=false;
  state.players.forEach(player=>{
    player.committed=0;player.streetBet=0;player.revealed=[null,null];player.rangeAction='unknown';player.strongActions=[0,0,0,0];
    player.status=player.stack>0?'active':'out';
  });
  state.handStatus='active';state.handNumber+=1;
  clearSimulationResults(preparedHero.every(Boolean)
    ?`Main ${state.handNumber} démarrée automatiquement.`
    :`Main ${state.handNumber} démarrée.`);
  if(state.autoPostBlinds)postBlindsAndAntes();
  renderAll();
  if(state.heroCards.every(Boolean))scheduleCalculation();
}
function newGame() {
  const chosen=state.formatPreset==='custom'?'cash5':state.formatPreset;
  state.autoPostBlinds=false;state.autoMoveDealer=true;state.coachMode=false;
  applyFormatPreset(chosen);
}
function setBettingStreetAutomatically(targetStreet) {
  if(state.handStatus!=='active'||targetStreet<=state.bettingStreet)return;
  state.players.forEach(player=>player.streetBet=0);
  state.deadStreetBet=0;
  state.lastFullRaise=0;
  state.bettingStreet=Math.min(3,targetStreet);
}
function inferredStreetFromBoard() {
  if(state.board[4])return 3;
  if(state.board[3])return 2;
  if(state.board.slice(0,3).every(Boolean))return 1;
  return 0;
}
function syncStreetAfterBoardEdit() {
  const inferred=inferredStreetFromBoard();
  if(inferred>state.bettingStreet)setBettingStreetAutomatically(inferred);
  else if(inferred<state.bettingStreet)state.bettingStreet=inferred;
}
function nextBettingStreet() {
  // Conservé uniquement pour compatibilité avec les anciennes interfaces.
  // La V8.6 change automatiquement de street quand le board est saisi.
  if(state.handStatus!=='active')return;
  const target=Math.min(3,state.bettingStreet+1);
  setBettingStreetAutomatically(target);
  renderAll();
}
function buildPots(players) {
  const live=players.filter(player=>!player.folded);
  const levels=[...new Set(live.filter(player=>player.committed>0).map(player=>player.committed))].sort((a,b)=>a-b);
  const total=players.reduce((sum,player)=>sum+player.committed,0);
  if(!levels.length)return total>0?[{amount:total,eligible:live.map(player=>player.id)}]:[];
  const pots=[];let previous=0;
  for(const level of levels){
    const amount=players.reduce((sum,player)=>sum+Math.max(0,Math.min(player.committed,level)-previous),0);
    const eligible=live.filter(player=>player.committed>=level).map(player=>player.id);
    const last=pots[pots.length-1];
    if(last&&last.eligible.length===eligible.length&&last.eligible.every((id,index)=>id===eligible[index]))last.amount+=amount;
    else pots.push({amount,eligible});
    previous=level;
  }
  const deadExcess=players.reduce((sum,player)=>sum+Math.max(0,player.committed-previous),0);
  if(deadExcess>0&&pots.length)pots[pots.length-1].amount+=deadExcess;
  return pots;
}
function awardPots(pots,scoreById,seatOrderFromSB) {
  const payout=new Map();
  for(const pot of pots){
    if(pot.eligible.length===1){
      const id=pot.eligible[0];payout.set(id,(payout.get(id)||0)+pot.amount);continue;
    }
    const contenders=pot.eligible.filter(id=>scoreById.has(id));
    if(!contenders.length)continue;
    const best=Math.max(...contenders.map(id=>scoreById.get(id)));
    const winners=contenders.filter(id=>scoreById.get(id)===best);
    const base=Math.floor(pot.amount/winners.length);
    let remainder=pot.amount-base*winners.length;
    for(const id of seatOrderFromSB.filter(candidate=>winners.includes(candidate))){
      const amount=base+(remainder>0?1:0);if(remainder>0)remainder-=1;
      payout.set(id,(payout.get(id)||0)+amount);
    }
  }
  return payout;
}
function seatOrderFromSmallBlind() {
  const seated=state.players;
  if(!seated.length)return [];
  let dealerIndex=seated.findIndex(player=>player.id===state.dealerId);
  if(dealerIndex<0)dealerIndex=0;
  const start=seated.length===2?dealerIndex:(dealerIndex+1)%seated.length;
  return Array.from({length:seated.length},(_,offset)=>seated[(start+offset)%seated.length].id);
}
function resetPotAfterAward() {
  state.deadPot=0;state.deadStreetBet=0;state.lastFullRaise=0;
  state.players.forEach(player=>{player.committed=0;player.streetBet=0;});
}
function awardPot() {
  const factor=state.gameMode==='cash'?100:1;
  const potPlayers=state.players.map(player=>({id:player.id,committed:Math.round(player.committed*factor),folded:player.status==='folded'||player.status==='out'}));
  const pots=buildPots(potPlayers);
  const deadUnits=Math.round(state.deadPot*factor);
  const eligibleIds=state.players.filter(player=>player.status==='active'||player.status==='allin').map(player=>player.id);
  if(deadUnits>0){
    if(pots.length)pots[0].amount+=deadUnits;
    else if(eligibleIds.length)pots.push({amount:deadUnits,eligible:eligibleIds});
  }
  if(!pots.length)return false;

  const board=state.board.filter(Boolean);
  const scoreById=new Map();
  if(board.length===5){
    for(const player of state.players){
      if(!eligibleIds.includes(player.id))continue;
      const hand=player.isHero?state.heroCards:player.revealed;
      if(hand.filter(Boolean).length===2)scoreById.set(player.id,score7(hand.concat(board)));
    }
  }
  const allContendersKnown=pots.every(pot=>pot.eligible.length===1||pot.eligible.every(id=>scoreById.has(id)));
  let payout;
  if(allContendersKnown){
    payout=awardPots(pots,scoreById,seatOrderFromSmallBlind());
  }else if(pots.length===1){
    const winner=playerById(els.potWinner.value);
    if(!winner||!pots[0].eligible.includes(winner.id)){
      els.potResult.textContent='Le gagnant choisi n’est pas éligible à ce pot.';return false;
    }
    payout=new Map([[winner.id,pots[0].amount]]);
  }else{
    els.potResult.textContent='Plusieurs pots sont présents : complète le board et les deux cartes des joueurs au showdown pour une répartition automatique.';
    return false;
  }
  for(const [id,units] of payout){const player=playerById(id);if(player)player.stack+=units/factor;}
  resetPotAfterAward();renderAll();return true;
}

function openCardModal(slot) {
  if(slot.area==='board'){
    if(state.handStatus==='setup'){
      if(!state.heroCards.every(Boolean)){
        els.selectionHint.textContent='Choisis d’abord tes deux cartes. La main démarrera automatiquement.';
        return;
      }
      newHand();
    }
    if(state.handStatus!=='active'){
      els.selectionHint.textContent='Cette main est terminée. Choisis tes deux nouvelles cartes pour démarrer la suivante.';
      return;
    }
    if(slot.index===3&&!state.board.slice(0,3).every(Boolean)){
      els.selectionHint.textContent='Ajoute d’abord les 3 cartes du flop.';
      return;
    }
    if(slot.index===4&&!state.board[3]){
      els.selectionHint.textContent='Ajoute d’abord la turn.';
      return;
    }
  }
  state.activeSlot=slot;
  updateCardModalTitle();
  renderModalDeck();els.removeCard.disabled=!getSlotCard(slot);els.cardModal.showModal();
}
function nextCardPickerSlot(editedSlot,wasEmpty) {
  if(!wasEmpty)return null;
  if(editedSlot.area==='hero'&&editedSlot.index===0&&!state.heroCards[1])return {area:'hero',index:1};
  if(editedSlot.area==='board'&&editedSlot.index<2&&!state.board[editedSlot.index+1])return {area:'board',index:editedSlot.index+1};
  return null;
}
function updateCardModalTitle() {
  const slot=state.activeSlot;
  els.modalTitle.textContent=slot.area==='hero'
    ?`Choisis la carte ${slot.index+1} de ta main`
    :slot.index<3?`Choisis la carte ${slot.index+1} du flop`:`Choisis ${slot.index===3?'la turn':'la river'}`;
}
function renderModalDeck() {
  const current=getSlotCard(state.activeSlot);
  const used=new Set(allKnownCards().map(card=>card.key));
  if(current)used.delete(current.key);
  els.modalDeck.replaceChildren(...DECK.map(card=>{
    const button=document.createElement('button');button.type='button';button.className=`modal-card${card.red?' red':''} suit-${card.suit}`;button.innerHTML=cardMarkup(card);button.disabled=used.has(card.key);
    button.addEventListener('click',()=>{
      const editedSlot={...state.activeSlot};
      const wasEmpty=!getSlotCard(editedSlot);
      setSlotCard(editedSlot,card);
      if(editedSlot.area==='board')syncStreetAfterBoardEdit();
      const followUp=nextCardPickerSlot(editedSlot,wasEmpty);
      if(followUp){
        state.activeSlot=followUp;
        renderSlots();
        updateCardModalTitle();
        renderModalDeck();
        scheduleCalculation();
        return;
      }

      // V10.3 : dès que la deuxième carte Hero est choisie, la main démarre
      // immédiatement. Plus besoin de cliquer sur « Démarrer » ou « Main suivante ».
      if(editedSlot.area==='hero' && state.heroCards.every(Boolean) && state.handStatus!=='active'){
        els.cardModal.close();
        newHand();
        return;
      }

      state.activeSlot=nextEmptySlot();
      els.cardModal.close();
      renderAll();
      scheduleCalculation();
    });return button;
  }));
}
function openPlayerModal(id) {state.selectedPlayerId=id;state.activeRevealedIndex=0;renderPlayerModal();els.playerModal.showModal();}
function renderPlayerModal() {
  const player=selectedPlayer();if(!player)return;
  els.playerModalTitle.textContent=`${player.name} · ${statusLabel(player.status)}`;
  els.markActive.classList.toggle('is-selected',player.status==='active');els.markFolded.classList.toggle('is-selected',player.status==='folded');els.markAllIn.classList.toggle('is-selected',player.status==='allin');
  els.removePlayer.disabled=player.isHero;
  els.playerStack.value=String(player.stack);els.playerCommitted.value=String(player.committed);els.playerStreetBet.value=String(player.streetBet);
  els.playerProfile.value=player.profile||'standard';els.playerRangeAction.value=player.rangeAction||'unknown';
  els.clearRevealed.disabled=!player.revealed.some(Boolean);
  const controls=player.revealed.map((card,index)=>{
    const wrapper=document.createElement('div');wrapper.className='revealed-card-control';
    const label=document.createElement('span');label.className='revealed-card-label';label.textContent=`Carte ${index+1}`;
    const button=document.createElement('button');button.type='button';button.className=`card-slot revealed-card-slot${card?'':' is-empty'}${card?.red?' red':''}${card?` suit-${card.suit}`:''}${state.activeRevealedIndex===index?' active':''}`;button.innerHTML=cardMarkup(card);
    button.addEventListener('click',()=>{state.activeRevealedIndex=index;renderPlayerModal();});wrapper.append(label,button);return wrapper;
  });
  els.revealedSlots.replaceChildren(...controls);
  if (!player.revealed[0]) els.revealedSelectionHint.textContent='Choisis la carte 1 si elle a été montrée.';
  else if (!player.revealed[1]) els.revealedSelectionHint.textContent='Carte 1 enregistrée. Tu peux choisir la carte 2.';
  else els.revealedSelectionHint.textContent='Deux cartes enregistrées. Clique sur un emplacement pour le remplacer.';
  renderPlayerDeck();
}
function renderPlayerDeck() {
  const player=selectedPlayer();if(!player)return;
  const current=player.revealed[state.activeRevealedIndex];
  const used=new Set(allKnownCards().map(card=>card.key));if(current)used.delete(current.key);
  els.playerDeck.replaceChildren(...DECK.map(card=>{
    const button=document.createElement('button');button.type='button';button.className=`modal-card${card.red?' red':''} suit-${card.suit}`;button.innerHTML=cardMarkup(card);button.disabled=used.has(card.key);
    button.addEventListener('click',()=>{player.revealed[state.activeRevealedIndex]=card;if(state.activeRevealedIndex===0&&!player.revealed[1])state.activeRevealedIndex=1;renderAll();renderPlayerModal();scheduleCalculation();});return button;
  }));
}

function packScore(category,kickers) {
  const ordered=kickers.slice(0,5);while(ordered.length<5)ordered.push(0);
  return ordered.reduce((score,rank)=>score*15+rank,category);
}
function scoreCategory(score) {return Math.floor(score/(15**5));}

// Évaluateur direct 5 à 7 cartes. Il évite d'énumérer les 21 sous-mains à 7 cartes
// et conserve exactement le même encodage de score que l'ancien évaluateur.
function scoreBestFast(cards){
  const clean=(cards||[]).filter(Boolean);const n=clean.length;
  if(n<5)return null;
  const rankCounts=new Uint8Array(15);const suitCounts=new Uint8Array(4);
  const suitRanks=[[],[],[],[]];
  for(const card of clean){rankCounts[card.rank]+=1;suitCounts[card.suit]+=1;suitRanks[card.suit].push(card.rank);}
  const uniqueDesc=[];for(let r=14;r>=2;r-=1)if(rankCounts[r])uniqueDesc.push(r);
  const straightHighFromRanks=ranks=>{
    const seen=new Uint8Array(15);for(const r of ranks)seen[r]=1;if(seen[14])seen[1]=1;
    for(let high=14;high>=5;high-=1){let ok=true;for(let r=high;r>=high-4;r-=1)if(!seen[r]){ok=false;break;}if(ok)return high;}
    return 0;
  };

  // Quinte flush.
  for(let suit=0;suit<4;suit+=1){
    if(suitCounts[suit]>=5){const high=straightHighFromRanks(suitRanks[suit]);if(high)return packScore(8,[high]);}
  }
  // Carré.
  for(let r=14;r>=2;r-=1)if(rankCounts[r]===4){const kicker=uniqueDesc.find(x=>x!==r)||0;return packScore(7,[r,kicker]);}
  // Full : meilleur brelan + meilleure paire/brelan restant.
  const trips=[];const pairs=[];
  for(let r=14;r>=2;r-=1){if(rankCounts[r]>=3)trips.push(r);if(rankCounts[r]>=2)pairs.push(r);}
  if(trips.length){const trip=trips[0];const pair=pairs.find(r=>r!==trip);if(pair)return packScore(6,[trip,pair]);}
  // Couleur : cinq cartes les plus hautes de la meilleure couleur.
  let bestFlush=null;
  for(let suit=0;suit<4;suit+=1)if(suitCounts[suit]>=5){
    const top=suitRanks[suit].slice().sort((a,b)=>b-a).slice(0,5);const score=packScore(5,top);if(bestFlush===null||score>bestFlush)bestFlush=score;
  }
  if(bestFlush!==null)return bestFlush;
  // Quinte.
  const straightHigh=straightHighFromRanks(uniqueDesc);if(straightHigh)return packScore(4,[straightHigh]);
  // Brelan.
  if(trips.length){const trip=trips[0];const kickers=uniqueDesc.filter(r=>r!==trip).slice(0,2);return packScore(3,[trip,...kickers]);}
  // Deux paires.
  if(pairs.length>=2){const p1=pairs[0],p2=pairs[1];const kicker=uniqueDesc.find(r=>r!==p1&&r!==p2)||0;return packScore(2,[p1,p2,kicker]);}
  // Paire.
  if(pairs.length===1){const p=pairs[0];const kickers=uniqueDesc.filter(r=>r!==p).slice(0,3);return packScore(1,[p,...kickers]);}
  return packScore(0,uniqueDesc.slice(0,5));
}
function score5(cards){return scoreBestFast(cards);}
function score7(cards){return scoreBestFast(cards);}
function shufflePrefix(array,count) {for(let i=0;i<count;i+=1){const j=i+Math.floor(Math.random()*(array.length-i));[array[i],array[j]]=[array[j],array[i]];}}
function percentage(value,total) {return `${((value/total)*100).toFixed(1)} %`;}

const HAND_GUIDE_LABELS=['Carte haute','Paire','Deux paires','Brelan','Quinte','Couleur','Full','Carré','Quinte flush'];
const HAND_GENERIC_EXAMPLES={
  royal:'10♠ J♠ Q♠ K♠ A♠',
  8:'5♥ 6♥ 7♥ 8♥ 9♥',
  7:'Q♣ Q♦ Q♥ Q♠ + 1 carte',
  6:'10♣ 10♦ 10♠ + 7♥ 7♣',
  5:'5 cartes de la même couleur',
  4:'5 cartes qui se suivent',
  3:'K♣ K♦ K♥ + 2 cartes',
  2:'A♣ A♥ + 8♦ 8♠ + 1 carte',
  1:'J♣ J♦ + 3 cartes',
  0:'Aucune combinaison : la plus haute gagne'
};
function cardText(card){return card?`${RANK_LABEL[card.rank]||card.rank}${SUITS[card.suit].symbol}`:'?';}
function cardsText(cards){return (cards||[]).filter(Boolean).map(cardText).join(' ');}
function memoCardRole(card){
  if(!card)return '';
  if(state.heroCards.filter(Boolean).some(item=>item.key===card.key))return ' is-hero-card';
  if(state.board.filter(Boolean).some(item=>item.key===card.key))return ' is-board-card';
  return ' is-future-card';
}
function memoCardMarkup(card,{roleAware=true}={}){
  if(!card)return '';
  const role=roleAware?memoCardRole(card):'';
  return `<span class="memo-card${card.red?' red':''} suit-${card.suit}${role}" title="${cardText(card)}">${cardMarkup(card)}</span>`;
}
function memoCardsMarkup(cards,prefix='',roleAware=true){
  const clean=(cards||[]).filter(Boolean);
  const prefixHtml=prefix?`<span class="memo-prefix">${prefix}</span>`:'';
  return prefixHtml+clean.map(card=>memoCardMarkup(card,{roleAware})).join('');
}
function upgradeStaticMemoCards(){
  document.querySelectorAll('.hand-rank-example .memo-card').forEach(cardEl=>{
    if(cardEl.querySelector('.card-corner'))return;
    const text=cardEl.textContent.trim();
    const symbols=['♠','♥','♦','♣'];
    const suit=symbols.find(symbol=>text.endsWith(symbol));
    if(!suit)return;
    const rank=text.slice(0,-1);
    cardEl.innerHTML=`<span class="card-corner top"><span class="rank">${rank}</span><span class="suit">${suit}</span></span><span class="card-center-suit">${suit}</span><span class="card-corner bottom"><span class="rank">${rank}</span><span class="suit">${suit}</span></span>`;
  });
}
function bestFiveCards(cards){
  const clean=(cards||[]).filter(Boolean);if(clean.length<5)return [];
  let best=-1,bestCards=[];const n=clean.length;
  for(let a=0;a<n-4;a+=1)for(let b=a+1;b<n-3;b+=1)for(let c=b+1;c<n-2;c+=1)for(let d=c+1;d<n-1;d+=1)for(let e=d+1;e<n;e+=1){
    const five=[clean[a],clean[b],clean[c],clean[d],clean[e]];const score=score5(five);
    if(score>best){best=score;bestCards=five;}
  }
  return bestCards;
}
function hasRoyalFlush(cards){
  const bySuit=[new Set(),new Set(),new Set(),new Set()];
  (cards||[]).filter(Boolean).forEach(card=>bySuit[card.suit].add(card.rank));
  return bySuit.some(ranks=>[10,11,12,13,14].every(rank=>ranks.has(rank)));
}
function currentRoyalFlush(){
  const cards=[...state.heroCards,...state.board.filter(Boolean)].filter(Boolean);
  return cards.length>=5&&hasRoyalFlush(cards);
}
function futureGuideEntries(){
  if(!state.lastFutureCategories)return [];
  const royal=Math.max(0,state.lastRoyalFlushProbability||0);
  const entries=[{key:'royal',label:'Quinte flush royale',value:royal,strength:10,example:state.lastRoyalFlushExample}];
  for(let category=8;category>=0;category-=1){
    let value=state.lastFutureCategories[category]||0;
    let example=state.lastFutureExamples?.[category]||null;
    if(category===8){value=Math.max(0,value-royal);example=state.lastStraightFlushExample||example;}
    entries.push({key:String(category),category,label:HAND_GUIDE_LABELS[category],value,strength:category+1,example});
  }
  return entries;
}
function renderHeroOutcomeGuide(){
  if(!els.heroCardsMini||!els.touchProbList)return;
  const heroReady=state.heroCards.every(Boolean);
  els.heroCardsMini.innerHTML=heroReady?memoCardsMarkup(state.heroCards,'',true):'—';
  const current=heroReady?bestCurrentCategory():null;
  const royalNow=heroReady&&currentRoyalFlush();
  els.heroMadeHand.textContent=current?(royalNow?'Quinte flush royale':current.label):'—';
  const boardComplete=state.board.every(Boolean);
  els.improveChanceLabel.textContent=boardComplete?'Amélioration restante':'Améliorer d’ici la river';

  const entries=futureGuideEntries();
  if(!heroReady||!entries.length){
    els.improveChance.textContent='—';
    els.touchProbList.innerHTML='<div class="touch-empty">Lance le calcul pour voir les mains que tu peux obtenir.</div>';
  }else{
    const currentStrength=royalNow?10:(current?.category??0)+1;
    const improve=boardComplete?0:entries.filter(entry=>entry.strength>currentStrength).reduce((sum,entry)=>sum+entry.value,0);
    els.improveChance.textContent=`${Math.min(100,Math.max(0,improve)).toFixed(1)} %`;

    // Le bloc principal privilégie les issues les plus probables. Le mémo complet reste juste dessous.
    let visible=entries.filter(entry=>entry.value>.05).sort((a,b)=>b.value-a.value||b.strength-a.strength).slice(0,6);
    const currentKey=royalNow?'royal':String(current?.category);
    const currentEntry=entries.find(entry=>entry.key===currentKey&&entry.value>.05);
    if(currentEntry&&!visible.some(entry=>entry.key===currentKey)){
      visible=visible.length>=6?[...visible.slice(0,5),currentEntry]:[...visible,currentEntry];
    }

    const rows=visible.map(entry=>{
      const row=document.createElement('div');row.className='touch-prob-chip touch-outcome-row';
      const isCurrent=entry.key===currentKey;
      if(isCurrent)row.classList.add('is-current');
      if(entry.strength>=5)row.classList.add('is-strong');
      const head=document.createElement('div');head.className='touch-outcome-head';
      head.innerHTML=`<span>${entry.label}${isCurrent?' <small>ACTUELLE</small>':''}</span><b>${entry.value.toFixed(1)} %</b>`;
      row.append(head);
      if(entry.example?.length){
        const cards=document.createElement('div');cards.className='touch-outcome-cards';cards.innerHTML=memoCardsMarkup(entry.example,'',true);row.append(cards);
      }
      return row;
    });
    if(rows.length)els.touchProbList.replaceChildren(...rows);
    else els.touchProbList.innerHTML='<div class="touch-empty">Aucune combinaison supplémentaire détectée dans cet échantillon.</div>';
  }
  els.touchHint.textContent=boardComplete
    ?'Board complet : ta combinaison finale est fixée. Vert = tes cartes.'
    :'Vert = tes cartes · bord normal = board déjà sorti · pointillé = carte simulée à venir.';

  const currentCards=[...state.heroCards,...state.board.filter(Boolean)].filter(Boolean);
  const currentBest=currentCards.length>=5?bestFiveCards(currentCards):[];
  document.querySelectorAll('.hand-rank-item[data-hand-category]').forEach(row=>{
    const key=row.dataset.handCategory;const prob=row.querySelector('.hand-rank-prob');const example=row.querySelector('.hand-rank-example');
    if(!example.dataset.defaultMarkup)example.dataset.defaultMarkup=example.innerHTML;
    row.classList.remove('is-possible','is-current');example.classList.remove('is-personal-example');
    const entry=entries.find(item=>item.key===key);const value=entry?.value??null;
    prob.textContent=value===null?'—':`${value.toFixed(1)} %`;
    if(value!==null&&value>.05)row.classList.add('is-possible');
    const isCurrent=heroReady&&(royalNow?key==='royal':key===String(current?.category));
    if(isCurrent){
      row.classList.add('is-current');
      if(currentBest.length){example.innerHTML=memoCardsMarkup(currentBest,'',true);example.classList.add('is-personal-example');}
      else if(entry?.example?.length){example.innerHTML=memoCardsMarkup(entry.example,'',true);example.classList.add('is-personal-example');}
      else example.innerHTML=example.dataset.defaultMarkup;
    }else if(entry?.example?.length&&value>.05){
      example.innerHTML=memoCardsMarkup(entry.example,'',true);example.classList.add('is-personal-example');
    }else example.innerHTML=example.dataset.defaultMarkup;
  });
}



// === Rétabli depuis la v10.5 (fonctions supprimées par erreur en V11.0 mais encore appelées) ===
function bestCurrentCategory() {
  const cards=[...state.heroCards,...state.board.filter(Boolean)].filter(Boolean);
  if (cards.length<2)return null;
  if (cards.length===2) {
    if(state.heroCards[0]?.rank===state.heroCards[1]?.rank)return {label:'Paire servie',category:1};
    return {label:`Hauteur ${RANK_LABEL[Math.max(...cards.map(card=>card.rank))]||Math.max(...cards.map(card=>card.rank))}`,category:0};
  }
  if(cards.length<5){
    const counts=new Map();cards.forEach(card=>counts.set(card.rank,(counts.get(card.rank)||0)+1));const values=[...counts.values()];
    if(values.includes(3))return {label:'Brelan provisoire',category:3};
    const pairs=values.filter(v=>v===2).length;if(pairs>=2)return {label:'Deux paires provisoires',category:2};if(pairs===1)return {label:'Une paire provisoire',category:1};
    return {label:'Main non faite',category:0};
  }
  let best=-1;const n=cards.length;
  for(let a=0;a<n-4;a+=1)for(let b=a+1;b<n-3;b+=1)for(let c=b+1;c<n-2;c+=1)for(let d=c+1;d<n-1;d+=1)for(let e=d+1;e<n;e+=1)best=Math.max(best,score5([cards[a],cards[b],cards[c],cards[d],cards[e]]));
  const category=scoreCategory(best);return {label:CATEGORY_LABELS[category],category};
}
function detectDraws() {
  const hero=state.heroCards.filter(Boolean);const board=state.board.filter(Boolean);const cards=[...hero,...board];const results=[];
  if(cards.length<4||state.board.every(Boolean))return results;
  const suitCounts=[0,0,0,0];cards.forEach(card=>suitCounts[card.suit]+=1);
  const flushSuit=suitCounts.findIndex(count=>count>=4);
  if(flushSuit>=0&&hero.some(card=>card.suit===flushSuit))results.push('Tirage couleur');

  const ranks=[...new Set(cards.map(card=>card.rank))];if(ranks.includes(14))ranks.push(1);
  const rankSet=new Set(ranks);const heroRanks=new Set(hero.flatMap(card=>card.rank===14?[14,1]:[card.rank]));
  const endpointOuts=new Set();const internalOuts=new Set();
  for(let start=1;start<=10;start+=1){
    const sequence=[start,start+1,start+2,start+3,start+4];
    if(!sequence.some(rank=>heroRanks.has(rank)))continue;
    const missing=sequence.filter(rank=>!rankSet.has(rank));
    if(missing.length===1){
      const out=missing[0];
      if(out===sequence[0]||out===sequence[4])endpointOuts.add(out);else internalOuts.add(out);
    }
  }
  if(internalOuts.size>=2)results.push('Double tirage quinte ventral');
  else if(endpointOuts.size>=2)results.push('Tirage quinte bilatéral');
  else if(internalOuts.size===1)results.push('Tirage quinte ventral');
  return results;
}
function updateQuickRead() {
  state.lastCurrentCategory=bestCurrentCategory();state.lastDrawSummary=detectDraws();
  els.currentHandLabel.textContent=state.lastCurrentCategory?.label||'—';
  els.currentDrawLabel.textContent=state.lastDrawSummary[0]||(state.board.every(Boolean)?'Board complet':'Aucun gros tirage');
}


function boardOnlyCategory(board){
  if(board.length>=5)return scoreCategory(score5(board));
  const counts=new Map();board.forEach(card=>counts.set(card.rank,(counts.get(card.rank)||0)+1));
  const values=[...counts.values()].sort((a,b)=>b-a);
  if(values[0]===4)return 7;if(values[0]===3)return 3;if(values[0]===2&&values[1]===2)return 2;if(values[0]===2)return 1;return 0;
}

function renderHelpfulCards(){
  if(!els.helpfulCardsList||!els.helpfulCardsStreet)return;
  const heroReady=state.heroCards.every(Boolean);const board=state.board.filter(Boolean);
  els.helpfulCardsStreet.textContent=board.length>=3?(board.length===3?'Flop':board.length===4?'Turn':'River'):'—';
  if(!heroReady||board.length<3){
    els.helpfulCardsList.innerHTML='<div class="helpful-card-empty">Ajoute le flop pour voir les cartes qui peuvent améliorer ta main.</div>';return;
  }
  if(board.length>=5){els.helpfulCardsList.innerHTML='<div class="helpful-card-empty">La river est sortie : il n’y a plus de carte à venir.</div>';return;}
  const knownKeys=new Set(allKnownCards().map(card=>card.key));const unseen=DECK.filter(card=>!knownKeys.has(card.key));
  const currentCards=state.heroCards.concat(board);const currentScore=bestScoreAny(currentCards);const currentCategory=currentScore===null?-1:scoreCategory(currentScore);
  const groups=new Map();
  for(const card of unseen){
    const nextBoard=board.concat(card);const newScore=bestScoreAny(state.heroCards.concat(nextBoard));if(newScore===null||newScore<=currentScore)continue;
    const category=scoreCategory(newScore);
    if(category<=Math.max(currentCategory,boardOnlyCategory(nextBoard)))continue;
    if(!groups.has(category))groups.set(category,[]);groups.get(category).push(card);
  }
  const finalProbs=state.lastPersonalFutureCategories||state.lastFutureCategories;
  const rows=[...groups.entries()].sort((a,b)=>b[0]-a[0]||b[1].length-a[1].length).slice(0,4).map(([category,cards])=>{
    const nextPct=unseen.length?cards.length/unseen.length*100:0;const riverPct=finalProbs?Number(finalProbs[category]||0):null;
    const row=document.createElement('div');row.className='helpful-card-row';
    const examples=cards.slice(0,5).map(card=>memoCardMarkup(card,{roleAware:false})).join('');
    row.innerHTML=`<div class="helpful-card-main"><strong>${cards.length} carte${cards.length>1?'s':''} → ${HAND_GUIDE_LABELS[category]}</strong><span>${examples}</span></div><div class="helpful-card-probs"><b>Prochaine : ${nextPct.toFixed(1).replace('.',',')} %</b><small>D’ici river : ${riverPct===null?'—':riverPct.toFixed(1).replace('.',',')+' %'}</small></div>`;
    return row;
  });
  if(rows.length)els.helpfulCardsList.replaceChildren(...rows);
  else els.helpfulCardsList.innerHTML='<div class="helpful-card-empty">Pas d’amélioration directe de catégorie sur la prochaine carte.</div>';
}

function pressureReliabilityLabel({effectiveN,useExact,entries}){
  const levelTotal=entries.reduce((sum,item)=>sum+item.level,0);const distinctPlayers=new Set(entries.map(item=>item.player.id)).size;
  let points=0;if(state.bettingStreet>=1)points+=1;if(entries.length>=2)points+=1;if(levelTotal>=3)points+=1;if(distinctPlayers>=2)points+=1;
  if(useExact)points+=1;else if(effectiveN>=5000)points+=1;else if(effectiveN>0&&effectiveN<1000)points-=1;
  if(points>=4)return {label:'Bonne',className:'quality-good'};
  if(points>=2)return {label:'Moyenne',className:'quality-medium'};
  return {label:'Faible',className:'quality-low'};
}
function renderPressureAssessment(adjustedWin,adjustedEquity,effectiveN,useExact){
  if(!els.pressureImpactText||!els.pressureReliability||!els.pressureVerdict)return;
  const raw=Number(state.lastWinProbability);const delta=adjustedWin-raw;const abs=Math.abs(delta);
  els.pressureImpactText.textContent=abs<0.05?'Les actions adverses changent très peu l’estimation.':`Tes chances ${delta>=0?'montent':'baissent'} de ${abs.toFixed(1).replace('.',',')} point${abs>=1.5?'s':''}.`;
  const entries=activePressureEntries();const quality=pressureReliabilityLabel({effectiveN,useExact,entries});
  els.pressureReliability.className=`pressure-reliability ${quality.className}`;
  els.pressureReliability.textContent=`Fiabilité de l’estimation : ${quality.label}`+(effectiveN>0&&!useExact&&effectiveN<1000?' · peu de simulations utiles':'' );

  const fairShare=100/(activeOpponents().length+1);const ratio=fairShare>0?adjustedEquity/fairShare:1;
  let kind='limit',title='Situation limite',text='Tes chances sont proches d’une zone incertaine face aux actions renseignées.';
  if(ratio>=1.16&&adjustedEquity>=fairShare+4){kind='good';title='Situation favorable';text='Tes chances restent bonnes malgré les actions adverses.';}
  else if(ratio<=0.80||adjustedEquity<=fairShare-8){kind='bad';title='Situation défavorable';text='Tes chances sont faibles face aux actions adverses estimées.';}
  els.pressureVerdict.className=`situation-verdict verdict-${kind}`;
  els.pressureVerdict.innerHTML=`<span class="verdict-dot"></span><div><strong>${title}</strong><small>${text}</small></div>`;
}
function clearPressureAssessment(){
  if(els.pressureImpactText)els.pressureImpactText.textContent='—';
  if(els.pressureReliability){els.pressureReliability.className='pressure-reliability';els.pressureReliability.textContent='Fiabilité : —';}
  if(els.pressureVerdict){els.pressureVerdict.className='situation-verdict verdict-neutral';els.pressureVerdict.innerHTML='<span class="verdict-dot"></span><div><strong>Situation à estimer</strong><small>Ajoute une action adverse.</small></div>';}
}


function preflopHandStrength(hand) {
  const [a,b]=hand.slice().sort((x,y)=>y.rank-x.rank);
  const high=a.rank, low=b.rank;
  if(high===low) return Math.min(100,48+(high-2)*4);
  let score=((high-2)/12)*42+((low-2)/12)*20;
  if(a.suit===b.suit) score+=7;
  const gap=Math.abs(high-low)-1;
  if(gap<=0) score+=8; else if(gap===1) score+=5; else if(gap===2) score+=2; else if(gap>=4) score-=5;
  if(high===14) score+=8;
  if(high>=13&&low>=10) score+=7;
  return clamp(score,2,96);
}
function bestScoreAny(cards){const clean=(cards||[]).filter(Boolean);return clean.length>=5?scoreBestFast(clean):null;}
function currentMadeHandStrength(hand,board) {
  if(board.length<3) return preflopHandStrength(hand);
  const best=bestScoreAny(hand.concat(board));
  const category=scoreCategory(best);
  const categoryBase=[16,38,56,67,77,82,91,97,100][category];
  return clamp(categoryBase+preflopHandStrength(hand)*0.12,5,100);
}

// Renvoie uniquement les cartes communes qui existaient réellement à la street étudiée.
// Important : le modèle de pression ne doit jamais « voir » une turn/river simulée à l'avance.
function boardAtStreet(knownBoard,street){
  if(street<=0)return [];
  const wanted=street===1?3:street===2?4:5;
  return (knownBoard||[]).filter(Boolean).slice(0,wanted);
}
function straightDrawOutRanks(hand,board){
  const rankSetOf=cards=>{const set=new Set((cards||[]).filter(Boolean).map(card=>card.rank));if(set.has(14))set.add(1);return set;};
  const handRanks=rankSetOf(hand),boardRanks=rankSetOf(board),all=new Set([...handRanks,...boardRanks]),outs=new Set();
  for(let candidate=2;candidate<=14;candidate+=1){
    if(all.has(candidate))continue;const candidateValues=candidate===14?[14,1]:[candidate];
    for(let high=5;high<=14;high+=1){
      const low=high-4;if(!candidateValues.some(value=>value>=low&&value<=high))continue;
      let complete=true,usesHand=false;
      for(let rank=low;rank<=high;rank+=1){
        if(candidateValues.includes(rank))continue;if(!all.has(rank)){complete=false;break;}
        if(handRanks.has(rank)&&!boardRanks.has(rank))usesHand=true;
      }
      if(complete&&usesHand){outs.add(candidate);break;}
    }
  }
  return outs;
}
function postflopHandSignals(hand,board){
  const cards=hand.concat(board);
  const made=currentMadeHandStrength(hand,board);
  let madeScore=made;
  const score=bestScoreAny(cards);
  const category=score===null?0:scoreCategory(score);

  // Affine les mains « une paire » : top paire / overpaire sont plus crédibles
  // pour une grosse action qu'une paire présente uniquement sur le board.
  if(category===1&&board.length){
    const boardRanks=board.map(card=>card.rank).sort((a,b)=>b-a);
    const top=boardRanks[0];
    const pocket=hand[0].rank===hand[1].rank;
    const overpair=pocket&&hand[0].rank>top;
    const topPair=hand.some(card=>card.rank===top);
    const boardPairOnly=!hand.some(card=>boardRanks.includes(card.rank))&&!pocket;
    if(overpair)madeScore=Math.max(madeScore,66);
    else if(topPair)madeScore=Math.max(madeScore,61);
    else if(boardPairOnly)madeScore=Math.min(madeScore,34);
    else madeScore=Math.max(madeScore,45);
  }
  if((category===2||category===3)&&board.length){
    const boardRanks=new Set(board.map(card=>card.rank));
    const pocket=hand[0].rank===hand[1].rank;
    const holeConnects=hand.some(card=>boardRanks.has(card.rank))||pocket;
    if(!holeConnects)madeScore=Math.min(madeScore,category===2?40:45);
  }
  if(board.length===5&&score!==null){
    const boardScore=score5(board);
    // Si les cinq meilleures cartes sont exactement celles du board, la force affichée du
    // board n'est pas une preuve que les cartes privées du joueur justifient une grosse action.
    if(score===boardScore)madeScore=Math.min(madeScore,32);
  }

  const suitCounts=[0,0,0,0];cards.forEach(card=>{suitCounts[card.suit]+=1;});
  let flushDrawScore=0;
  if(board.length<5){
    for(let suit=0;suit<4;suit+=1){
      if(suitCounts[suit]===4&&hand.some(card=>card.suit===suit)){
        const nut=hand.some(card=>card.suit===suit&&card.rank===14);
        flushDrawScore=Math.max(flushDrawScore,nut?78:70);
      }
    }
  }
  const straightOuts=board.length<5?straightDrawOutRanks(hand,board):new Set();
  let straightDrawScore=0;
  if(straightOuts.size>=2)straightDrawScore=70;
  else if(straightOuts.size===1)straightDrawScore=54;
  let drawScore=Math.max(flushDrawScore,straightDrawScore);
  if(flushDrawScore&&straightDrawScore)drawScore=Math.max(drawScore,86);

  return {madeScore:clamp(madeScore,0,100),drawScore:clamp(drawScore,0,100),category};
}
function strongActionLikelihoodForStreet(hand,knownBoard,street,level=1){
  const actionLevel=clamp(Number(level)||1,1,3);
  const logistic=(score,threshold,scale=8)=>1/(1+Math.exp(-(score-threshold)/scale));
  if(street===0){
    const pre=preflopHandStrength(hand);const thresholds=[0,67,75,83],scales=[0,7,7,7],floors=[0,0.09,0.055,0.03];
    const floor=floors[actionLevel];return clamp(floor+(1-floor)*logistic(pre,thresholds[actionLevel],scales[actionLevel]),floor,0.995);
  }
  const streetBoard=boardAtStreet(knownBoard,street);
  if(streetBoard.length<(street===1?3:street===2?4:5))return 1;
  const signals=postflopHandSignals(hand,streetBoard);const baseThreshold={1:51,2:58,3:64}[street];
  const valueLike=logistic(signals.madeScore,baseThreshold+[0,0,7,14][actionLevel],8);let semiBluffLike=0;
  if(street<3&&signals.drawScore>0){
    const drawThreshold=(street===1?57:63)+[0,0,6,12][actionLevel];
    const multiplier=street===1?[0,0.92,0.72,0.48][actionLevel]:[0,0.78,0.58,0.38][actionLevel];
    semiBluffLike=logistic(signals.drawScore,drawThreshold,8)*multiplier;
  }
  const floors={1:{1:0.12,2:0.09,3:0.07},2:{1:0.07,2:0.055,3:0.04},3:{1:0.035,2:0.025,3:0.02}};
  const bluffFloor=floors[actionLevel][street];return clamp(bluffFloor+(1-bluffFloor)*Math.max(valueLike,semiBluffLike),bluffFloor,0.998);
}
function pressureWeightForHand(player,hand,knownBoard){
  const levels=pressureActions(player),currentStreet=Math.max(0,Math.min(3,state.bettingStreet)),evidence=[];
  for(let street=0;street<=currentStreet;street+=1){const level=levels[street]||0;if(level<=0)continue;const likelihood=strongActionLikelihoodForStreet(hand,knownBoard,street,level);if(likelihood<0.999999)evidence.push({street,level,likelihood});}
  if(!evidence.length)return 1;
  const evidenceExponent=[1,0.84,0.70,0.60];let weight=1;
  evidence.forEach((entry,index)=>{weight*=Math.pow(entry.likelihood,evidenceExponent[Math.min(index,evidenceExponent.length-1)]);});
  return clamp(weight,1e-9,1);
}
function combinedPressureWeight(players,hands,knownBoard){
  let weight=1;
  for(let i=0;i<players.length;i+=1){
    if(pressureActions(players[i]).some((level,index)=>level>0&&index<=state.bettingStreet)){
      weight*=pressureWeightForHand(players[i],hands[i],knownBoard);
    }
  }
  return clamp(weight,1e-18,1);
}

// Ancien moteur de ranges supprimé : le modèle de pression pondéré l'a remplacé.

function combinationCount(n,k){
  if(k<0||k>n)return 0;
  k=Math.min(k,n-k);let result=1;
  for(let i=1;i<=k;i+=1)result=result*(n-k+i)/i;
  return result;
}
function estimateExactDealCount(remainingCount,missingBoard,missingByOpponent,stopAbove=Infinity){
  let available=remainingCount;
  let total=combinationCount(available,missingBoard);available-=missingBoard;
  if(total>stopAbove)return total;
  for(const missing of missingByOpponent){
    total*=combinationCount(available,missing);available-=missing;
    if(total>stopAbove)return total;
  }
  return Math.round(total);
}
function* combinationsGenerator(pool,k,start=0,picked=[]){
  if(k===0){yield picked.slice();return;}
  for(let i=start;i<=pool.length-k;i+=1){
    picked.push(pool[i]);yield* combinationsGenerator(pool,k-1,i+1,picked);picked.pop();
  }
}
function withoutCards(pool,cards){
  if(!cards.length)return pool.slice();
  const used=new Set(cards.map(card=>card.key));return pool.filter(card=>!used.has(card.key));
}
function* opponentHandsGenerator(players,pool,index=0,hands=[]){
  if(index>=players.length){yield hands.slice();return;}
  const player=players[index];const known=player.revealed.filter(Boolean).slice(0,2);const missing=2-known.length;
  if(missing===0){
    hands.push(known);yield* opponentHandsGenerator(players,pool,index+1,hands);hands.pop();return;
  }
  for(const extra of combinationsGenerator(pool,missing)){
    hands.push(known.concat(extra));
    yield* opponentHandsGenerator(players,withoutCards(pool,extra),index+1,hands);
    hands.pop();
  }
}
function confidenceMargin95(successes,total){
  if(total<=0)return null;
  const p=successes/total;return 1.96*Math.sqrt(Math.max(0,p*(1-p))/total)*100;
}
function weightedEffectiveSamples(sumW,sumW2){
  if(sumW<=0||sumW2<=0)return 0;return (sumW*sumW)/sumW2;
}

function clearSimulationResults(message='En attente de tes cartes…') {
  abortEngineWork();state.runningToken+=1;state.lastEquity=null;state.lastWinProbability=null;state.lastRangeWinProbability=null;state.lastRangeEquity=null;state.lastIterations=0;state.lastFutureCategories=null;state.lastPersonalFutureCategories=null;state.lastRoyalFlushProbability=null;state.lastFutureExamples=null;state.lastRoyalFlushExample=null;state.lastStraightFlushExample=null;
  state.lastCalculationMode=null;state.lastPressureEffectiveSamples=null;
  els.winValue.textContent='—';els.equityValue.textContent='—';els.tieValue.textContent='—';els.lossValue.textContent='—';els.rangeWinValue.textContent='—';els.rangeEquityValue.textContent='—';els.rangeDeltaValue.textContent='—';clearPressureAssessment();els.calculationStatus.textContent=message;els.calculateNow.disabled=false;
}
let persistentEngineWorker=null;
let activeEngineRequest=null;
let engineJobSequence=0;

function cardToEngineId(card){return (card.rank-2)*4+card.suit;}
const ENGINE_CARD_BY_ID=(()=>{const table=new Array(52);DECK.forEach(card=>{table[cardToEngineId(card)]=card;});return table;})();
function engineCards(ids){return (ids||[]).map(id=>ENGINE_CARD_BY_ID[id]).filter(Boolean);}
function engineExample(ids){const cards=engineCards(ids);return cards.length>=5?bestFiveCards(cards):cards;}
function runEngineDirect(job,token){
  if(!globalThis.CS_ENGINE)return Promise.reject(new Error('Moteur de calcul indisponible.'));
  return globalThis.CS_ENGINE.runJob(job,{
    onProgress:pct=>{if(token===state.runningToken)els.calculationStatus.textContent=`Calcul… ${pct} %`;},
    shouldAbort:()=>token!==state.runningToken
  });
}
function disposePersistentWorker(){
  if(persistentEngineWorker){try{persistentEngineWorker.terminate();}catch(_){ }}
  persistentEngineWorker=null;
}
function ensurePersistentWorker(){
  if(persistentEngineWorker)return persistentEngineWorker;
  if(typeof Worker==='undefined'||location.protocol==='file:')return null;
  let worker;
  try{worker=new Worker(`engine-worker.js?v=11.4`);}catch(_){return null;}
  worker.onmessage=event=>{
    const data=event.data||{};const request=activeEngineRequest;
    if(!request||data.jobId!==request.jobId)return;
    if(data.type==='progress'){if(request.token===state.runningToken)els.calculationStatus.textContent=`Calcul… ${data.pct} %`;return;}
    activeEngineRequest=null;
    if(data.type==='result')request.resolve(data.result);else if(data.type==='error')request.reject(new Error(data.message||'Erreur moteur.'));
  };
  worker.onerror=()=>{
    const request=activeEngineRequest;activeEngineRequest=null;disposePersistentWorker();
    if(!request)return true;
    if(request.token!==state.runningToken){request.resolve(null);return true;}
    runEngineDirect(request.job,request.token).then(request.resolve,request.reject);
    return true;
  };
  persistentEngineWorker=worker;
  return worker;
}
function abortEngineWork(){
  const request=activeEngineRequest;
  if(!request)return;
  activeEngineRequest=null;
  if(persistentEngineWorker){
    try{persistentEngineWorker.postMessage({type:'cancel',jobId:++engineJobSequence});}catch(_){disposePersistentWorker();}
  }
  // Une annulation normale n'est pas une erreur : l'ancien calcul se termine silencieusement.
  request.resolve(null);
}
function runEngineJob(job,token){
  abortEngineWork();
  const worker=ensurePersistentWorker();
  if(!worker)return runEngineDirect(job,token);
  const jobId=++engineJobSequence;
  return new Promise((resolve,reject)=>{
    activeEngineRequest={jobId,job,token,resolve,reject};
    try{worker.postMessage({type:'run',jobId,job});}
    catch(_){
      activeEngineRequest=null;disposePersistentWorker();
      runEngineDirect(job,token).then(resolve,reject);
    }
  });
}

async function calculate(iterations,token) {
  if(!state.heroCards[0]||!state.heroCards[1]){clearSimulationResults('Choisis tes deux cartes.');renderAll();return;}
  if(!validateBoardOrder()){clearSimulationResults('Complète d’abord les 3 cartes du flop.');renderAll();return;}
  const activeOpp=activeOpponents();
  if(activeOpp.length===0){clearSimulationResults('Aucun adversaire dans le coup.');renderAll();return;}
  const pressureActive=hasActivePressure();
  const knownBoard=state.board.filter(Boolean);
  const job={
    heroIds:state.heroCards.map(cardToEngineId),
    boardIds:knownBoard.map(cardToEngineId),
    deadIds:revealedCards().map(cardToEngineId),
    currentStreet:Math.max(0,Math.min(3,state.bettingStreet)),
    iterations:Math.max(1,Number(iterations)||250000),
    pressureActive,
    opponents:activeOpp.map(player=>({knownIds:player.revealed.filter(Boolean).map(cardToEngineId),levels:pressureActions(player)}))
  };
  els.calculateNow.disabled=true;
  els.calculationStatus.textContent='Préparation du calcul…';
  const result=await runEngineJob(job,token);
  if(token!==state.runningToken||!result)return;

  state.lastWinProbability=result.win;state.lastEquity=result.equity;
  state.lastRangeWinProbability=result.pressure?result.pressure.win:result.win;
  state.lastRangeEquity=result.pressure?result.pressure.equity:result.equity;
  state.lastIterations=result.samples;state.lastCalculationMode=result.method;
  state.lastFutureCategories=(result.futureCategories||[]).slice();
  state.lastPersonalFutureCategories=(result.personalFutureCategories||result.futureCategories||[]).slice();
  state.lastRoyalFlushProbability=Number(result.royalPct||0);
  state.lastFutureExamples=(result.examples||[]).map(engineExample);
  state.lastRoyalFlushExample=result.royalExample?engineExample(result.royalExample):null;
  state.lastStraightFlushExample=result.straightFlushExample?engineExample(result.straightFlushExample):null;
  state.lastPressureEffectiveSamples=result.pressure?Number(result.pressure.ess||0):null;

  els.winValue.textContent=`${result.win.toFixed(1)} %`;els.equityValue.textContent=`${result.equity.toFixed(1)} %`;els.tieValue.textContent=`${result.tie.toFixed(1)} %`;els.lossValue.textContent=`${result.loss.toFixed(1)} %`;
  if(result.pressure){
    const adjustedWin=result.pressure.win,adjustedEquity=result.pressure.equity,delta=adjustedWin-result.win;
    const pressureCount=activePressureEntries().length,effectiveN=Number(result.pressure.ess||0),useExact=result.method==='exact';
    els.rangeWinValue.textContent=`${adjustedWin.toFixed(1).replace('.',',')} %`;
    els.rangeEquityValue.textContent=`${adjustedEquity.toFixed(1).replace('.',',')} %`;
    els.rangeDeltaValue.textContent=`${delta>=0?'+':''}${delta.toFixed(1).replace('.',',')} pt`;
    els.rangeModelLabel.textContent=String(pressureCount);
    const essWarning=!useExact&&effectiveN>0&&effectiveN<1000?'⚠ estimation fragile':'';
    const precisionText=useExact?'calcul exhaustif':effectiveN>0?`échantillon utile ≈ ${Math.round(effectiveN).toLocaleString('fr-FR')}${Number.isFinite(result.pressure.ci95Win)?` · incertitude ≈ ±${result.pressure.ci95Win.toFixed(1).replace('.',',')} pt`:''}`:'';
    els.rangeContext.textContent=[pressureSummary(),precisionText,essWarning].filter(Boolean).join(' · ');
    renderPressureAssessment(adjustedWin,adjustedEquity,effectiveN,useExact);
  }else{
    els.rangeWinValue.textContent='—';els.rangeEquityValue.textContent='—';els.rangeDeltaValue.textContent='—';els.rangeModelLabel.textContent='0';els.rangeContext.textContent='Renseigne + / ++ / +++ sur un joueur.';clearPressureAssessment();
  }
  renderPressureProbabilityVisibility();
  if(result.method==='exact'){
    els.calculationStatus.textContent=`Exact · ${result.samples.toLocaleString('fr-FR')} distributions · ${activeOpp.length} adversaire${activeOpp.length>1?'s':''}`;
  }else{
    els.calculationStatus.textContent=`${result.samples.toLocaleString('fr-FR')} simulations · 95 % ≈ ±${Number(result.ci95Win||0).toFixed(2).replace('.',',')} pt · ${activeOpp.length} adversaire${activeOpp.length>1?'s':''}`;
  }
  els.calculateNow.disabled=false;
  renderHeroOutcomeGuide();renderHelpfulCards();updateAnalysis();updateCommentary();updateOutsModalContent();
}

function runCalculation(iterations=Number(els.iterations.value)) {state.runningToken+=1;const token=state.runningToken;calculate(iterations,token).catch(error=>{if(token===state.runningToken){const message=error&&error.message?error.message:'Une erreur a interrompu le calcul.';clearSimulationResults(message);renderAll();}});}
function scheduleCalculation() {
  clearTimeout(state.debounce);abortEngineWork();state.runningToken+=1;els.calculateNow.disabled=false;
  if(!state.heroCards[0]||!state.heroCards[1]||!validateBoardOrder()||activeOpponents().length===0){clearSimulationResults(!state.heroCards[0]||!state.heroCards[1]?'Choisis tes deux cartes pour lancer le calcul.':activeOpponents().length===0?'Aucun adversaire actif.':'Complète correctement le flop.');renderAll();return;}
  els.calculationStatus.textContent='Mise à jour automatique…';state.debounce=setTimeout(()=>runCalculation(Math.min(50000,Number(els.iterations.value))),180);
}

function effectiveStackValue() {
  const hero=heroPlayer();const opp=activeOpponents().filter(player=>player.stack>0);
  if(!opp.length)return 0;return Math.min(hero.stack,Math.max(...opp.map(player=>player.stack)));
}
function analysisSnapshot() {
  const hero=heroPlayer();const pot=totalPot();const call=toCallFor(hero);
  const heroLevel=hero.streetBet+call;
  const contestable=state.deadPot+state.players.reduce((sum,player)=>{
    if(player.isHero)return sum+player.committed;
    const excess=Math.max(0,player.streetBet-heroLevel);
    return sum+Math.max(0,player.committed-excess);
  },0);
  const contestableFinal=contestable+call;
  const required=call>0?call/contestableFinal*100:0;
  const effective=effectiveStackValue();const spr=contestable>0?effective/contestable:null;
  const modelEquity=state.lastRangeEquity??state.lastEquity;
  const ev=modelEquity===null||call<=0?null:(modelEquity/100)*contestable-(1-modelEquity/100)*call;
  return {hero,pot,contestable,contestableFinal,call,required,effective,spr,ev,modelEquity,margin:modelEquity===null?null:modelEquity-required};
}
function reviewVerdict(snapshot) {
  if(state.lastEquity===null)return {tone:'neutral',title:'EN ATTENTE',text:'Ajoute tes cartes et les mises pour obtenir un verdict de review.'};
  if(snapshot.hero.status==='folded') {
    if(snapshot.call>0&&snapshot.margin!==null)return snapshot.margin>=3?{tone:'positive',title:'FOLD TROP PRUDENT EN REVIEW',text:`Ton équité dépassait le seuil de ${snapshot.margin.toFixed(1)} points.`}:{tone:'negative',title:'FOLD COHÉRENT EN REVIEW',text:`Ton équité ne couvrait pas clairement le prix demandé.`};
    return {tone:'neutral',title:'HERO COUCHÉ',text:'La main est terminée pour Hero ; les chiffres restent utiles pour la review.'};
  }
  if(snapshot.hero.status==='allin')return {tone:'neutral',title:'ALL-IN DÉJÀ ENGAGÉ',text:`Équité ajustée au showdown : ${(snapshot.modelEquity??state.lastEquity).toFixed(1)} %.`};
  if(snapshot.call<=0) {
    const baseline=100/(activeOpponents().length+1);
    if(snapshot.modelEquity>=baseline*1.45)return {tone:'positive',title:'CHECK GRATUIT · AVANTAGE FORT',text:'Tu ne paies rien pour continuer et ton équité est nettement supérieure à la part moyenne.'};
    if(snapshot.modelEquity>=baseline)return {tone:'neutral',title:'CHECK GRATUIT · SITUATION CORRECTE',text:'Aucun prix à payer. Une mise ou relance exige encore une hypothèse de range et de folds.'};
    return {tone:'warning',title:'CHECK GRATUIT · ÉQUITÉ FRAGILE',text:'Voir la carte suivante gratuitement reste utile ; une ligne agressive demanderait beaucoup de folds adverses.'};
  }
  if(snapshot.margin>=10)return {tone:'positive',title:'CALL +EV TRÈS CLAIR',text:`Marge de ${snapshot.margin.toFixed(1)} points et EV simplifiée ${money(snapshot.ev)}.`};
  if(snapshot.margin>=3)return {tone:'positive',title:'CALL +EV',text:`Le prix est couvert avec ${snapshot.margin.toFixed(1)} points de marge. EV simplifiée ${money(snapshot.ev)}.`};
  if(snapshot.margin>-3)return {tone:'warning',title:'CALL MARGINAL',text:`Écart de seulement ${snapshot.margin.toFixed(1)} point(s) : une range plus forte peut inverser la décision.`};
  return {tone:'negative',title:'FOLD PRÉFÉRABLE EN REVIEW',text:`Le call manque ${Math.abs(snapshot.margin).toFixed(1)} points d’équité. EV simplifiée ${money(snapshot.ev)}.`};
}
function updateAnalysis() {
  const snapshot=analysisSnapshot();
  els.autoPot.textContent=money(snapshot.pot);if(els.contestablePot)els.contestablePot.textContent=money(snapshot.contestableFinal);els.autoCall.textContent=money(snapshot.call);els.requiredEquity.textContent=snapshot.call>0?`${snapshot.required.toFixed(1)} %`:'0 %';els.effectiveStack.textContent=money(snapshot.effective);els.sprValue.textContent=snapshot.spr===null?'—':snapshot.spr.toFixed(2);els.callEv.textContent=snapshot.ev===null?'—':money(snapshot.ev);
  const verdict=reviewVerdict(snapshot);els.reviewVerdict.className=`review-verdict is-${verdict.tone}`;els.reviewVerdict.innerHTML=`<strong>${verdict.title}</strong><span>${verdict.text}</span>`;
  if(snapshot.call>0)els.potResult.textContent=`Pot total affiché : ${money(snapshot.pot)}. Pot final réellement disputable par Hero après le call : ${money(snapshot.contestableFinal)}. Il faut ${snapshot.required.toFixed(1)} % d’équité, sans mise future.`;
  else els.potResult.textContent='Aucune mise supplémentaire à payer actuellement.';
}
function confidenceBand(iterations) {if(iterations>=1000000)return '≈ ±0,1 point';if(iterations>=500000)return '≈ ±0,14 point';if(iterations>=100000)return '≈ ±0,31 point';if(iterations>=30000)return '≈ ±0,57 point';if(iterations>=10000)return '≈ ±1 point';if(iterations>=3000)return '≈ ±1,8 point';return '≈ ±3,2 points';}
function updateCommentary() {
  if(!state.coachMode){els.commentaryBox.classList.add('is-muted');els.commentaryBox.textContent='Active les commentaires pour afficher le verdict de review sous la table.';return;}
  els.commentaryBox.classList.remove('is-muted');
  if(state.lastEquity===null){els.commentaryBox.textContent='Ajoute tes deux cartes puis renseigne les mises. Le commentaire utilisera la probabilité, le prix du call, le stack effectif et le SPR.';return;}
  const snapshot=analysisSnapshot();const verdict=reviewVerdict(snapshot);const current=state.lastCurrentCategory?.label||'main non définie';const draw=state.lastDrawSummary.length?` Tirage : ${state.lastDrawSummary.join(', ')}.`:'';
  const rangeText=state.lastRangeWinProbability===null?'':` Probabilité brute ${state.lastWinProbability.toFixed(1)} %, ajustée par ranges ${state.lastRangeWinProbability.toFixed(1)} %. Le verdict utilise l’équité ajustée ${state.lastRangeEquity.toFixed(1)} %.`;
  const precisionText=state.lastCalculationMode==='exact'?'Calcul exhaustif : aucune marge Monte-Carlo.':`Précision ${confidenceBand(state.lastIterations)}.`;
  els.commentaryBox.textContent=`${verdict.title}. ${verdict.text} Main actuelle : ${current}.${draw}${rangeText} ${precisionText} Les cartes montrées sont retirées du paquet dans les deux modèles.`;
}
function updatePrecisionHint() {
  const iterations=Number(els.iterations.value);let text;
  if(iterations<=5000)text=`${iterations.toLocaleString('fr-FR')} : aperçu rapide. Si ≤ 50 000 distributions restent, CardScope passe automatiquement en calcul exact.`;
  else if(iterations<=50000)text=`${iterations.toLocaleString('fr-FR')} : bon compromis. Les situations assez petites sont calculées exactement.`;
  else if(iterations<=250000)text=`${iterations.toLocaleString('fr-FR')} : haute précision PC + calcul exact automatique quand c’est plus efficace.`;
  else text=`${iterations.toLocaleString('fr-FR')} : calcul lourd ; CardScope préfère un calcul exhaustif lorsqu’il reste assez peu de distributions.`;
  els.precisionHint.textContent=text;els.precisionHint.classList.toggle('long-calc-warning',iterations>=500000);
}
function updateOutsModalContent() {
  const current=state.lastCurrentCategory?.label||(state.heroCards[0]&&state.heroCards[1]?'Main en cours':'Ajoute tes cartes');
  els.outsCurrentSummary.textContent=`${boardStreet()} · ${current}.`;
  const draws=state.lastDrawSummary.length?state.lastDrawSummary:['Aucun gros tirage détecté ou board complet.'];
  els.drawsList.replaceChildren(...draws.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  if(!state.lastFutureCategories){els.futureTable.innerHTML='<div class="future-row"><span>Lance un calcul pour voir les combinaisons finales possibles.</span><b>—</b></div>';return;}
  const rows=CATEGORY_LABELS.map((label,index)=>({label,value:state.lastFutureCategories[index]})).filter(row=>row.value>.05).sort((a,b)=>b.value-a.value).map(row=>{const div=document.createElement('div');div.className='future-row';div.innerHTML=`<strong>${row.label}</strong><b>${row.value.toFixed(1)} %</b>`;return div;});els.futureTable.replaceChildren(...rows);
}

els.playersMinus.addEventListener('click',()=>{foldLastOpponent();renderAll();scheduleCalculation();});
els.playersPlus.addEventListener('click',()=>{addOrReactivatePlayer();renderAll();scheduleCalculation();});
document.querySelectorAll('[data-player-count]').forEach(button=>button.addEventListener('click',()=>setPlayerCount(Number(button.dataset.playerCount))));
els.calculateNow.addEventListener('click',()=>runCalculation());
els.formatPreset.addEventListener('change',()=>applyFormatPreset(els.formatPreset.value));
els.cardTheme.addEventListener('change',()=>{state.cardTheme=els.cardTheme.value;renderAll();});
els.heroFold.addEventListener('click',()=>{const hero=heroPlayer();if(hero){hero.status='folded';renderAll();scheduleCalculation();}});
els.heroCheckCall.addEventListener('click',()=>{const hero=heroPlayer();if(hero){matchCurrentBet(hero);renderAll();scheduleCalculation();}});
els.heroBetRaise.addEventListener('click',()=>{const hero=heroPlayer();if(hero){if(maxStreetBet()>hero.streetBet)minimumRaise(hero);else betOrRaiseTo(hero,hero.streetBet+heroSuggestedBet());renderAll();scheduleCalculation();}});
els.heroAllIn.addEventListener('click',()=>{const hero=heroPlayer();if(hero){allIn(hero);renderAll();scheduleCalculation();}});
els.heroTableStatus.addEventListener('click',()=>{const hero=heroPlayer();if(hero)openPlayerModal(hero.id);});
document.querySelectorAll('[data-pot-size]').forEach(button=>button.addEventListener('click',()=>applyHeroPotSize(Number(button.dataset.potSize))));
document.addEventListener('click',event=>{const trigger=event.target.closest('[data-term]');if(trigger)openTermDefinition(trigger.dataset.term);});
els.iterations.addEventListener('change',updatePrecisionHint);
els.coachMode.addEventListener('change',event=>{state.coachMode=event.target.checked;renderAll();});
els.newHand.addEventListener('click',newHand);els.resetAll.addEventListener('click',newGame);
els.finishReason.addEventListener('change',updateFinishReasonUi);
els.cancelFinishHand.addEventListener('click',()=>els.finishHandModal.close());
els.confirmFinishHand.addEventListener('click',confirmFinishHand);
els.finishHandModal.addEventListener('click',event=>{if(event.target===els.finishHandModal)els.finishHandModal.close();});
els.applyDefaultStack.addEventListener('click',applyDefaultStackToAll);
els.gameMode.addEventListener('change',()=>{markCustomFormat();state.gameMode=els.gameMode.value;state.blindLevelIndex=state.gameMode==='cash'?3:0;applyBlindPreset(state.blindLevelIndex);renderAll();});
els.blindLevel.addEventListener('change',()=>{markCustomFormat();applyBlindPreset(Number(els.blindLevel.value));renderAll();});
els.smallBlind.addEventListener('change',()=>{markCustomFormat();state.smallBlind=Math.max(0,numeric(els.smallBlind.value));renderAll();});
els.bigBlind.addEventListener('change',()=>{markCustomFormat();state.bigBlind=Math.max(.01,numeric(els.bigBlind.value,1));renderAll();});
els.ante.addEventListener('change',()=>{markCustomFormat();state.ante=Math.max(0,numeric(els.ante.value));renderAll();});
els.anteMode.addEventListener('change',()=>{markCustomFormat();state.anteMode=els.anteMode.value;renderAll();});
els.defaultStack.addEventListener('change',()=>{markCustomFormat();state.defaultStack=Math.max(0,numeric(els.defaultStack.value));renderAll();});
els.dealerSeat.addEventListener('change',()=>{state.dealerId=Number(els.dealerSeat.value);renderAll();});
els.previousBlindLevel.addEventListener('click',()=>{applyBlindPreset(state.blindLevelIndex-1);renderAll();});
els.nextBlindLevel.addEventListener('click',()=>{applyBlindPreset(state.blindLevelIndex+1);renderAll();});
els.moveDealer.addEventListener('click',()=>{rotateDealer();renderAll();});
els.autoPostBlinds.addEventListener('change',()=>{state.autoPostBlinds=els.autoPostBlinds.checked;});
els.autoMoveDealer.addEventListener('change',()=>{state.autoMoveDealer=els.autoMoveDealer.checked;});
els.postBlinds.addEventListener('click',()=>{if(state.handStatus==='active'){postBlindsAndAntes();renderAll();}});
els.advanceStreet.addEventListener('click',nextBettingStreet);els.finishHand.addEventListener('click',finishHandSimple);els.awardPot.addEventListener('click',()=>{if(awardPot())markHandComplete('Pot attribué manuellement.');});
els.removeCard.addEventListener('click',()=>{
  const editedSlot={...state.activeSlot};
  setSlotCard(editedSlot,null);
  if(editedSlot.area==='board')syncStreetAfterBoardEdit();
  els.cardModal.close();
  renderAll();
  scheduleCalculation();
});
els.cardModal.addEventListener('click',event=>{if(event.target===els.cardModal)els.cardModal.close();});
els.openTableSettings.addEventListener('click',()=>els.tableSettingsModal.showModal());
els.tableSettingsModal.addEventListener('click',event=>{if(event.target===els.tableSettingsModal)els.tableSettingsModal.close();});
els.pressureStreetButtons.querySelectorAll('[data-pressure-street]').forEach(button=>button.addEventListener('click',()=>togglePressureStreet(Number(button.dataset.pressureStreet))));
els.clearPressure.addEventListener('click',clearPlayerPressure);
els.openEstimatedHands.addEventListener('click',openEstimatedHands);
els.estimatedHandsPlayer.addEventListener('change',()=>{state.estimatedHandsPlayerId=Number(els.estimatedHandsPlayer.value);renderEstimatedHands();});
els.estimatedHandsModal.addEventListener('click',event=>{if(event.target===els.estimatedHandsModal)els.estimatedHandsModal.close();});
els.pressureModal.addEventListener('click',event=>{if(event.target===els.pressureModal)els.pressureModal.close();});
els.pressureModal.addEventListener('close',()=>{state.pressurePlayerId=null;});
els.openOuts.addEventListener('click',()=>{updateOutsModalContent();els.outsModal.showModal();});
els.outsModal.addEventListener('click',event=>{if(event.target===els.outsModal)els.outsModal.close();});
els.termModal.addEventListener('click',event=>{if(event.target===els.termModal)els.termModal.close();});
els.cancelRemovePlayer.addEventListener('click',cancelRemovePlayerRequest);
els.confirmRemovePlayer.addEventListener('click',confirmRemovePlayerRequest);
els.removePlayerConfirmModal.addEventListener('click',event=>{if(event.target===els.removePlayerConfirmModal)cancelRemovePlayerRequest();});
els.removePlayerConfirmModal.addEventListener('close',()=>{state.pendingRemovePlayerId=null;});

els.markActive.addEventListener('click',()=>{const player=selectedPlayer();if(player){setPlayerStatus(player,'active');renderAll();renderPlayerModal();scheduleCalculation();}});
els.markFolded.addEventListener('click',()=>{const player=selectedPlayer();if(player){setPlayerStatus(player,'folded');renderAll();renderPlayerModal();scheduleCalculation();}});
els.markAllIn.addEventListener('click',()=>{const player=selectedPlayer();if(player){allIn(player);renderAll();renderPlayerModal();scheduleCalculation();}});
els.removePlayer.addEventListener('click',()=>{const player=selectedPlayer();if(player&&!player.isHero)requestRemovePlayer(player.id);});
els.playerStack.addEventListener('change',()=>{const player=selectedPlayer();if(player){player.stack=Math.max(0,numeric(els.playerStack.value));if(player.stack<=0)player.status='out';else if(player.status==='out')player.status='active';renderAll();renderPlayerModal();scheduleCalculation();}});
els.playerCommitted.addEventListener('change',()=>{const player=selectedPlayer();if(player){setCommitted(player,numeric(els.playerCommitted.value));renderAll();renderPlayerModal();scheduleCalculation();}});
els.playerStreetBet.addEventListener('change',()=>{const player=selectedPlayer();if(player){setStreetBet(player,numeric(els.playerStreetBet.value));renderAll();renderPlayerModal();scheduleCalculation();}});
els.playerAddSB.addEventListener('click',()=>{const player=selectedPlayer();if(player){addContribution(player,state.smallBlind);renderAll();renderPlayerModal();scheduleCalculation();}});
els.playerAddBB.addEventListener('click',()=>{const player=selectedPlayer();if(player){const previousHigh=maxStreetBet();addContribution(player,state.bigBlind);registerBetOrRaise(previousHigh,player.streetBet);renderAll();renderPlayerModal();scheduleCalculation();}});
els.playerMatchBet.addEventListener('click',()=>{const player=selectedPlayer();if(player){matchCurrentBet(player);renderAll();renderPlayerModal();scheduleCalculation();}});
els.playerMinRaise.addEventListener('click',()=>{const player=selectedPlayer();if(player){minimumRaise(player);renderAll();renderPlayerModal();scheduleCalculation();}});
els.playerAllInBet.addEventListener('click',()=>{const player=selectedPlayer();if(player){allIn(player);renderAll();renderPlayerModal();scheduleCalculation();}});
els.clearRevealed.addEventListener('click',()=>{const player=selectedPlayer();if(player){player.revealed=[null,null];state.activeRevealedIndex=0;renderAll();renderPlayerModal();scheduleCalculation();}});
els.playerProfile.addEventListener('change',()=>{const player=selectedPlayer();if(player){player.profile=els.playerProfile.value;renderAll();scheduleCalculation();}});
els.playerRangeAction.addEventListener('change',()=>{const player=selectedPlayer();if(player){player.rangeAction=els.playerRangeAction.value;renderAll();scheduleCalculation();}});
els.playerModal.addEventListener('click',event=>{if(event.target===els.playerModal)els.playerModal.close();});

upgradeStaticMemoCards();
renderAll();clearSimulationResults('Choisis tes cartes puis démarre la main.');renderAll();

if('serviceWorker'in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));

/* CardScope Engine v11.4 — moteur d'équité exact + Monte Carlo
   - Évaluateur 7 cartes direct par masques de bits (pas de boucle 21 combos)
   - Énumération EXACTE automatique quand l'espace est petit (river/turn/flop HU, préflop cartes connues)
   - Monte Carlo rapide en repli, avec intervalle de confiance 95 %
   - Pondération "pression par street" portée à l'identique de v10.4, appliquée
     de façon EXACTE en mode énumération (fini le bruit sur la proba ajustée)
   Fonctionne dans un Web Worker, en <script> classique (repli sans worker) et sous Node (tests).

   Identifiant carte : id = (rang-2)*4 + couleur   (rang 2..14, couleur 0..3)
   Score main : (catégorie<<20) | k1<<16 | k2<<12 | k3<<8 | k4<<4 | k5   (rangs 0..12)
   Catégories : 0 hauteur, 1 paire, 2 deux paires, 3 brelan, 4 quinte,
                5 couleur, 6 full, 7 carré, 8 quinte flush (12 en k1 = royale)
*/
(function (root) {
  'use strict';

  const EXACT_LEAF_LIMIT = 2600000;   // nb max de feuilles (assignations complètes) énumérées
  const EXACT_BOARD_LIMIT = 2200000;  // nb max de boards énumérés
  const MC_CHUNK = 20000;             // itérations MC entre deux points de contrôle
  const EXACT_CHUNK = 60000;          // feuilles exactes entre deux points de contrôle

  /* ---------- Tables précalculées ---------- */
  const STRAIGHT_HIGH = new Int8Array(8192).fill(-1);
  const TOP5 = new Int32Array(8192);
  (function initTables() {
    for (let mask = 0; mask < 8192; mask += 1) {
      for (let hi = 12; hi >= 4; hi -= 1) {
        if (((mask >> (hi - 4)) & 0x1f) === 0x1f) { STRAIGHT_HIGH[mask] = hi; break; }
      }
      if (STRAIGHT_HIGH[mask] < 0 && (mask & 0x100f) === 0x100f) STRAIGHT_HIGH[mask] = 3; // roue A-2-3-4-5, haute = 5
      let packed = 0, found = 0;
      for (let r = 12; r >= 0 && found < 5; r -= 1) {
        if (mask & (1 << r)) { packed = (packed << 4) | r; found += 1; }
      }
      while (found < 5) { packed <<= 4; found += 1; }
      TOP5[mask] = packed;
    }
  })();

  /* ---------- Évaluateur ---------- */
  const rc = new Uint8Array(13);
  const suitCount = new Uint8Array(4);
  const suitMask = new Int32Array(4);

  function eval7(a, b, c, d, e, f, g) {
    rc.fill(0); suitCount.fill(0); suitMask.fill(0);
    let rankMask = 0, id, r, s;
    id = a; r = id >> 2; s = id & 3; rc[r] += 1; suitCount[s] += 1; suitMask[s] |= 1 << r; rankMask |= 1 << r;
    id = b; r = id >> 2; s = id & 3; rc[r] += 1; suitCount[s] += 1; suitMask[s] |= 1 << r; rankMask |= 1 << r;
    id = c; r = id >> 2; s = id & 3; rc[r] += 1; suitCount[s] += 1; suitMask[s] |= 1 << r; rankMask |= 1 << r;
    id = d; r = id >> 2; s = id & 3; rc[r] += 1; suitCount[s] += 1; suitMask[s] |= 1 << r; rankMask |= 1 << r;
    id = e; r = id >> 2; s = id & 3; rc[r] += 1; suitCount[s] += 1; suitMask[s] |= 1 << r; rankMask |= 1 << r;
    id = f; r = id >> 2; s = id & 3; rc[r] += 1; suitCount[s] += 1; suitMask[s] |= 1 << r; rankMask |= 1 << r;
    id = g; r = id >> 2; s = id & 3; rc[r] += 1; suitCount[s] += 1; suitMask[s] |= 1 << r; rankMask |= 1 << r;
    return finishEval(rankMask);
  }

  function evalIds(ids) { // 5, 6 ou 7 cartes — utilisé par les tests et outils
    rc.fill(0); suitCount.fill(0); suitMask.fill(0);
    let rankMask = 0;
    for (let i = 0; i < ids.length; i += 1) {
      const id = ids[i], r = id >> 2, s = id & 3;
      rc[r] += 1; suitCount[s] += 1; suitMask[s] |= 1 << r; rankMask |= 1 << r;
    }
    return finishEval(rankMask);
  }

  function finishEval(rankMask) {
    let fs = -1;
    if (suitCount[0] >= 5) fs = 0; else if (suitCount[1] >= 5) fs = 1; else if (suitCount[2] >= 5) fs = 2; else if (suitCount[3] >= 5) fs = 3;
    if (fs >= 0) {
      const fmask = suitMask[fs];
      const sh = STRAIGHT_HIGH[fmask];
      if (sh >= 0) return (8 << 20) | (sh << 16);
      return (5 << 20) | TOP5[fmask];
    }
    let quad = -1, trips = -1, trips2 = -1, pair1 = -1, pair2 = -1;
    for (let r = 12; r >= 0; r -= 1) {
      const n = rc[r];
      if (n === 4) quad = r;
      else if (n === 3) { if (trips < 0) trips = r; else if (trips2 < 0) trips2 = r; }
      else if (n === 2) { if (pair1 < 0) pair1 = r; else if (pair2 < 0) pair2 = r; }
    }
    if (quad >= 0) {
      let k = -1;
      for (let r = 12; r >= 0; r -= 1) { if (r !== quad && rc[r] > 0) { k = r; break; } }
      return (7 << 20) | (quad << 16) | ((k < 0 ? 0 : k) << 12);
    }
    if (trips >= 0 && (trips2 >= 0 || pair1 >= 0)) {
      const pr = trips2 >= 0 ? (pair1 > trips2 ? pair1 : trips2) : pair1;
      return (6 << 20) | (trips << 16) | (pr << 12);
    }
    const sh = STRAIGHT_HIGH[rankMask];
    if (sh >= 0) return (4 << 20) | (sh << 16);
    if (trips >= 0) {
      let k1 = -1, k2 = -1;
      for (let r = 12; r >= 0; r -= 1) {
        if (r === trips || rc[r] === 0) continue;
        if (k1 < 0) k1 = r; else if (k2 < 0) { k2 = r; break; }
      }
      return (3 << 20) | (trips << 16) | (k1 << 12) | (k2 << 8);
    }
    if (pair1 >= 0 && pair2 >= 0) {
      let k = -1;
      for (let r = 12; r >= 0; r -= 1) { if (r !== pair1 && r !== pair2 && rc[r] > 0) { k = r; break; } }
      return (2 << 20) | (pair1 << 16) | (pair2 << 12) | ((k < 0 ? 0 : k) << 8);
    }
    if (pair1 >= 0) {
      let k1 = -1, k2 = -1, k3 = -1;
      for (let r = 12; r >= 0; r -= 1) {
        if (r === pair1 || rc[r] === 0) continue;
        if (k1 < 0) k1 = r; else if (k2 < 0) k2 = r; else if (k3 < 0) { k3 = r; break; }
      }
      return (1 << 20) | (pair1 << 16) | (k1 << 12) | (k2 << 8) | (k3 << 4);
    }
    return TOP5[rankMask]; // hauteur
  }

  const category = score => score >> 20;
  const isRoyal = score => score >> 16 === (8 << 4 | 12); // catégorie 8 et haute = As

  /* ---------- Pondération "pression" — modèle CardScope V11.1 ---------- */
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const CATEGORY_BASE = [16, 38, 56, 67, 77, 82, 91, 97, 100];
  const logistic = (score, threshold, scale = 8) => 1 / (1 + Math.exp(-(score - threshold) / scale));

  function rankValue(id) { return (id >> 2) + 2; }
  function suitValue(id) { return id & 3; }

  function preflopStrengthIds(a, b) {
    let high = rankValue(a), low = rankValue(b);
    const sa = suitValue(a), sb = suitValue(b);
    if (low > high) { const t = high; high = low; low = t; }
    if (high === low) return Math.min(100, 48 + (high - 2) * 4);
    let score = ((high - 2) / 12) * 42 + ((low - 2) / 12) * 20;
    if (sa === sb) score += 7;
    const gap = Math.abs(high - low) - 1;
    if (gap <= 0) score += 8; else if (gap === 1) score += 5; else if (gap === 2) score += 2; else if (gap >= 4) score -= 5;
    if (high === 14) score += 8;
    if (high >= 13 && low >= 10) score += 7;
    return clamp(score, 2, 96);
  }

  function currentMadeHandStrengthIds(a, b, boardIds) {
    if (boardIds.length < 3) return preflopStrengthIds(a, b);
    const score = evalIds([a, b, ...boardIds]);
    const cat = category(score);
    return clamp(CATEGORY_BASE[cat] + preflopStrengthIds(a, b) * 0.12, 5, 100);
  }

  function boardAtStreetIds(knownBoardIds, street) {
    if (street <= 0) return [];
    const wanted = street === 1 ? 3 : street === 2 ? 4 : 5;
    return (knownBoardIds || []).slice(0, wanted);
  }

  function straightDrawOutRanksIds(a, b, boardIds) {
    const handRanks = new Set([rankValue(a), rankValue(b)]);
    const boardRanks = new Set((boardIds || []).map(rankValue));
    if (handRanks.has(14)) handRanks.add(1);
    if (boardRanks.has(14)) boardRanks.add(1);
    const all = new Set([...handRanks, ...boardRanks]);
    const outs = new Set();
    for (let candidate = 2; candidate <= 14; candidate += 1) {
      if (all.has(candidate)) continue;
      const candidateValues = candidate === 14 ? [14, 1] : [candidate];
      for (let high = 5; high <= 14; high += 1) {
        const low = high - 4;
        if (!candidateValues.some(value => value >= low && value <= high)) continue;
        let complete = true, usesHand = false;
        for (let rank = low; rank <= high; rank += 1) {
          if (candidateValues.includes(rank)) continue;
          if (!all.has(rank)) { complete = false; break; }
          if (handRanks.has(rank) && !boardRanks.has(rank)) usesHand = true;
        }
        if (complete && usesHand) { outs.add(candidate); break; }
      }
    }
    return outs;
  }

  function postflopHandSignalsIds(a, b, boardIds) {
    const pre = preflopStrengthIds(a, b);
    const score = evalIds([a, b, ...boardIds]);
    const cat = category(score);
    let madeScore = currentMadeHandStrengthIds(a, b, boardIds);
    const ar = rankValue(a), br = rankValue(b);

    if (cat === 1 && boardIds.length) {
      const boardRanks = boardIds.map(rankValue).sort((x, y) => y - x);
      const top = boardRanks[0];
      const pocket = ar === br;
      const overpair = pocket && ar > top;
      const topPair = ar === top || br === top;
      const boardPairOnly = !boardRanks.includes(ar) && !boardRanks.includes(br) && !pocket;
      if (overpair) madeScore = Math.max(madeScore, 66);
      else if (topPair) madeScore = Math.max(madeScore, 61);
      else if (boardPairOnly) madeScore = Math.min(madeScore, 34);
      else madeScore = Math.max(madeScore, 45);
    }
    if ((cat === 2 || cat === 3) && boardIds.length) {
      const boardRanks = new Set(boardIds.map(rankValue));
      const pocket = ar === br;
      const holeConnects = boardRanks.has(ar) || boardRanks.has(br) || pocket;
      if (!holeConnects) madeScore = Math.min(madeScore, cat === 2 ? 40 : 45);
    }
    if (boardIds.length === 5) {
      const boardScore = evalIds(boardIds);
      if (score === boardScore) madeScore = Math.min(madeScore, 32);
    }

    const suitCounts = [0, 0, 0, 0];
    [a, b, ...boardIds].forEach(id => { suitCounts[suitValue(id)] += 1; });
    let flushDrawScore = 0;
    if (boardIds.length < 5) {
      for (let suit = 0; suit < 4; suit += 1) {
        if (suitCounts[suit] === 4 && (suitValue(a) === suit || suitValue(b) === suit)) {
          const nut = (suitValue(a) === suit && ar === 14) || (suitValue(b) === suit && br === 14);
          flushDrawScore = Math.max(flushDrawScore, nut ? 78 : 70);
        }
      }
    }
    const straightOuts = boardIds.length < 5 ? straightDrawOutRanksIds(a, b, boardIds) : new Set();
    let straightDrawScore = 0;
    if (straightOuts.size >= 2) straightDrawScore = 70;
    else if (straightOuts.size === 1) straightDrawScore = 54;
    let drawScore = Math.max(flushDrawScore, straightDrawScore);
    if (flushDrawScore && straightDrawScore) drawScore = Math.max(drawScore, 86);
    return { madeScore: clamp(madeScore, 0, 100), drawScore: clamp(drawScore, 0, 100), category: cat };
  }

  function strongActionLikelihoodIds(a, b, knownBoardIds, street, level = 1) {
    const actionLevel = clamp(Number(level) || 1, 1, 3);
    if (street === 0) {
      const pre = preflopStrengthIds(a, b);
      const thresholds = [0, 67, 75, 83], scales = [0, 7, 7, 7], floors = [0, 0.09, 0.055, 0.03];
      const floor = floors[actionLevel];
      return clamp(floor + (1 - floor) * logistic(pre, thresholds[actionLevel], scales[actionLevel]), floor, 0.995);
    }
    const streetBoard = boardAtStreetIds(knownBoardIds, street);
    const required = street === 1 ? 3 : street === 2 ? 4 : 5;
    if (streetBoard.length < required) return 1;
    const signals = postflopHandSignalsIds(a, b, streetBoard);
    const baseThreshold = { 1: 51, 2: 58, 3: 64 }[street];
    const valueLike = logistic(signals.madeScore, baseThreshold + [0, 0, 7, 14][actionLevel], 8);
    let semiBluffLike = 0;
    if (street < 3 && signals.drawScore > 0) {
      const drawThreshold = (street === 1 ? 57 : 63) + [0, 0, 6, 12][actionLevel];
      const multiplier = street === 1 ? [0, 0.92, 0.72, 0.48][actionLevel] : [0, 0.78, 0.58, 0.38][actionLevel];
      semiBluffLike = logistic(signals.drawScore, drawThreshold, 8) * multiplier;
    }
    const floors = { 1: { 1: 0.12, 2: 0.09, 3: 0.07 }, 2: { 1: 0.07, 2: 0.055, 3: 0.04 }, 3: { 1: 0.035, 2: 0.025, 3: 0.02 } };
    const bluffFloor = floors[actionLevel][street];
    return clamp(bluffFloor + (1 - bluffFloor) * Math.max(valueLike, semiBluffLike), bluffFloor, 0.998);
  }

  function pressureWeightForIds(a, b, knownBoardIds, levels, currentStreet) {
    const evidence = [];
    for (let street = 0; street <= currentStreet; street += 1) {
      const level = clamp(Number(levels && levels[street]) || 0, 0, 3);
      if (level <= 0) continue;
      const likelihood = strongActionLikelihoodIds(a, b, knownBoardIds, street, level);
      if (likelihood < 0.999999) evidence.push(likelihood);
    }
    if (!evidence.length) return 1;
    const exponents = [1, 0.84, 0.70, 0.60];
    let weight = 1;
    evidence.forEach((likelihood, index) => { weight *= Math.pow(likelihood, exponents[Math.min(index, exponents.length - 1)]); });
    return clamp(weight, 1e-9, 1);
  }

  function boardOnlyCategoryIds(boardIds) {
    if (boardIds.length >= 5) return category(evalIds(boardIds));
    const counts = new Map();
    boardIds.forEach(id => { const r = rankValue(id); counts.set(r, (counts.get(r) || 0) + 1); });
    const values = [...counts.values()].sort((a, b) => b - a);
    if (values[0] === 4) return 7;
    if (values[0] === 3) return 3;
    if (values[0] === 2 && values[1] === 2) return 2;
    if (values[0] === 2) return 1;
    return 0;
  }

  /* ---------- Utilitaires ---------- */
  function comb(n, k) {
    if (k < 0 || k > n) return 0;
    let out = 1;
    for (let i = 0; i < k; i += 1) out = out * (n - i) / (i + 1);
    return Math.round(out);
  }

  function makeAccumulator(pressureActive) {
    return {
      samples: 0, wins: 0, ties: 0, losses: 0, equity: 0, equitySq: 0,
      futureCategories: new Float64Array(9), personalFutureCategories: new Float64Array(9), royal: 0,
      examples: new Array(9).fill(null), royalExample: null, straightFlushExample: null,
      pressureActive,
      pW: 0, pW2: 0, pWin: 0, pTie: 0, pLoss: 0, pEquity: 0
    };
  }

  function noteHero(acc, heroScore, seven, boardIds) {
    const cat = category(heroScore);
    acc.futureCategories[cat] += 1;
    if (cat > boardOnlyCategoryIds(boardIds)) acc.personalFutureCategories[cat] += 1;
    if (!acc.examples[cat]) acc.examples[cat] = seven.slice();
    if (cat === 8) {
      if (isRoyal(heroScore)) { acc.royal += 1; if (!acc.royalExample) acc.royalExample = seven.slice(); }
      else if (!acc.straightFlushExample) acc.straightFlushExample = seven.slice();
    }
  }

  function tally(acc, heroWinsFlag, winners, weight) {
    acc.samples += 1;
    let share = 0;
    if (!heroWinsFlag) acc.losses += 1;
    else if (winners === 1) { acc.wins += 1; share = 1; }
    else { acc.ties += 1; share = 1 / winners; }
    acc.equity += share; acc.equitySq += share * share;
    if (acc.pressureActive) {
      acc.pW += weight; acc.pW2 += weight * weight;
      if (!heroWinsFlag) acc.pLoss += weight;
      else if (winners === 1) acc.pWin += weight;
      else acc.pTie += weight;
      acc.pEquity += weight * share;
    }
  }

  function finalize(acc, method, boardsForCategories) {
    const n = acc.samples;
    const pct = x => (x / n) * 100;
    const winP = acc.wins / n;
    const meanEq = acc.equity / n;
    const varEq = Math.max(0, acc.equitySq / n - meanEq * meanEq);
    const mc = method === 'montecarlo';
    const catDen = boardsForCategories || n;
    const result = {
      method,
      samples: n,
      win: pct(acc.wins), tie: pct(acc.ties), loss: pct(acc.losses), equity: meanEq * 100,
      ci95Win: mc ? 1.96 * Math.sqrt(winP * (1 - winP) / n) * 100 : 0,
      ci95Equity: mc ? 1.96 * Math.sqrt(varEq / n) * 100 : 0,
      futureCategories: Array.from(acc.futureCategories, v => (v / catDen) * 100),
      personalFutureCategories: Array.from(acc.personalFutureCategories, v => (v / catDen) * 100),
      royalPct: (acc.royal / catDen) * 100,
      examples: acc.examples, royalExample: acc.royalExample, straightFlushExample: acc.straightFlushExample,
      pressure: null
    };
    if (acc.pressureActive && acc.pW > 0) {
      const ess = (acc.pW * acc.pW) / acc.pW2;
      const pWinP = acc.pWin / acc.pW;
      result.pressure = {
        win: pWinP * 100, tie: (acc.pTie / acc.pW) * 100, loss: (acc.pLoss / acc.pW) * 100,
        equity: (acc.pEquity / acc.pW) * 100,
        ci95Win: mc ? 1.96 * Math.sqrt(Math.max(0, pWinP * (1 - pWinP)) / ess) * 100 : 0,
        ess: ess
      };
    }
    return result;
  }

  /* ---------- Préparation d'un job ----------
     job = {
       heroIds:[id,id], boardIds:[ids connus], deadIds:[ids morts], currentStreet:0..3, iterations:N,
       opponents:[{knownIds:[..], levels:[0..3,0..3,0..3,0..3]}], pressureActive:bool
     } */
  function prepare(job) {
    const known = new Set(job.heroIds);
    job.boardIds.forEach(id => known.add(id));
    (job.deadIds || []).forEach(id => known.add(id));
    job.opponents.forEach(op => (op.knownIds || []).forEach(id => known.add(id)));
    const pool = [];
    for (let id = 0; id < 52; id += 1) if (!known.has(id)) pool.push(id);
    const currentStreet = Math.max(0, Math.min(3, (job.currentStreet ?? job.street ?? 0) | 0));
    const weightTableCache = new Map();
    const opps = job.opponents.map(op => {
      const levels = [0, 0, 0, 0];
      for (let i = 0; i < 4; i += 1) levels[i] = i <= currentStreet ? clamp(Number(op.levels && op.levels[i]) || 0, 0, 3) : 0;
      const weighted = levels.some(level => level > 0);
      let weightTable = null;
      if (weighted) {
        const signature = levels.join(',');
        weightTable = weightTableCache.get(signature) || null;
        if (!weightTable) {
          weightTable = new Float64Array(52 * 52);
          weightTable.fill(1);
          for (let a = 0; a < 51; a += 1) {
            for (let b = a + 1; b < 52; b += 1) {
              const w = pressureWeightForIds(a, b, job.boardIds, levels, currentStreet);
              weightTable[a * 52 + b] = w;
              weightTable[b * 52 + a] = w;
            }
          }
          weightTableCache.set(signature, weightTable);
        }
      }
      return {
        known: (op.knownIds || []).slice(),
        missing: 2 - (op.knownIds || []).length,
        levels, weighted, weightTable
      };
    });
    const missingBoard = 5 - job.boardIds.length;
    let boards = comb(pool.length, missingBoard);
    let leaves = boards;
    let left = pool.length - missingBoard;
    for (const op of opps) { leaves *= comb(left, op.missing); left -= op.missing; }
    return { pool, opps, missingBoard, boards, leaves, currentStreet };
  }

  /* ---------- Énumération exacte ---------- */
  async function runExact(job, prep, hooks) {
    const { pool, opps, missingBoard } = prep;
    const P = pool.length;
    const acc = makeAccumulator(job.pressureActive);
    const used = new Uint8Array(P);
    const board = job.boardIds.slice();
    while (board.length < 5) board.push(-1);
    const knownLen = job.boardIds.length;
    const h0 = job.heroIds[0], h1 = job.heroIds[1];
    const nOpp = opps.length;
    const oppScores = new Int32Array(nOpp);
    const oppWeights = new Float64Array(nOpp);
    const oppCards = opps.map(op => [op.known[0] !== undefined ? op.known[0] : -1, op.known[1] !== undefined ? op.known[1] : -1]);
    let boardsDone = 0, leavesDone = 0, sinceYield = 0;
    let heroScore = 0;
    let aborted = false;

    async function maybeYield() {
      sinceYield += 1;
      if (sinceYield >= EXACT_CHUNK) {
        sinceYield = 0;
        if (hooks.onProgress) hooks.onProgress(Math.min(99, Math.round((leavesDone / prep.leaves) * 100)));
        await new Promise(res => setTimeout(res, 0));
        if (hooks.shouldAbort && hooks.shouldAbort()) aborted = true;
      }
    }

    async function assignOpp(index) {
      if (aborted) return;
      if (index === nOpp) {
        let best = heroScore, winners = 1, heroBest = true;
        for (let i = 0; i < nOpp; i += 1) {
          const sc = oppScores[i];
          if (sc > best) { best = sc; winners = 1; heroBest = false; }
          else if (sc === best) winners += 1;
        }
        let weight = 1;
        if (job.pressureActive) {
          for (let i = 0; i < nOpp; i += 1) weight *= oppWeights[i];
          weight = clamp(weight, 1e-18, 1);
        }
        tally(acc, heroBest, winners, weight);
        leavesDone += 1;
        await maybeYield();
        return;
      }
      const op = opps[index];
      const cards = oppCards[index];
      if (op.missing === 0) {
        oppScores[index] = eval7(cards[0], cards[1], board[0], board[1], board[2], board[3], board[4]);
        oppWeights[index] = op.weighted
          ? op.weightTable[cards[0] * 52 + cards[1]]
          : 1;
        await assignOpp(index + 1);
        return;
      }
      if (op.missing === 1) {
        const k = op.known[0];
        for (let i = 0; i < P; i += 1) {
          if (used[i]) continue;
          used[i] = 1;
          const c = pool[i];
          oppScores[index] = eval7(k, c, board[0], board[1], board[2], board[3], board[4]);
          oppWeights[index] = op.weighted
            ? op.weightTable[k * 52 + c]
            : 1;
          await assignOpp(index + 1);
          used[i] = 0;
          if (aborted) return;
        }
        return;
      }
      for (let i = 0; i < P - 1; i += 1) {
        if (used[i]) continue;
        used[i] = 1;
        const c1 = pool[i];
        for (let j = i + 1; j < P; j += 1) {
          if (used[j]) continue;
          used[j] = 1;
          const c2 = pool[j];
          oppScores[index] = eval7(c1, c2, board[0], board[1], board[2], board[3], board[4]);
          oppWeights[index] = op.weighted
            ? op.weightTable[c1 * 52 + c2]
            : 1;
          await assignOpp(index + 1);
          used[j] = 0;
          if (aborted) return;
        }
        used[i] = 0;
        if (aborted) return;
      }
    }

    async function chooseBoard(slot, start) {
      if (aborted) return;
      if (slot === 5) {
        heroScore = eval7(h0, h1, board[0], board[1], board[2], board[3], board[4]);
        noteHero(acc, heroScore, [h0, h1, board[0], board[1], board[2], board[3], board[4]], [board[0], board[1], board[2], board[3], board[4]]);
        boardsDone += 1;
        await assignOpp(0);
        return;
      }
      for (let i = start; i < P; i += 1) {
        if (used[i]) continue;
        used[i] = 1;
        board[slot] = pool[i];
        await chooseBoard(slot + 1, i + 1);
        used[i] = 0;
        if (aborted) return;
      }
    }

    await chooseBoard(knownLen, 0);
    if (aborted) return null;
    return finalize(acc, 'exact', boardsDone);
  }

  /* ---------- Monte Carlo ---------- */
  async function runMonteCarlo(job, prep, hooks) {
    const { pool, opps, missingBoard } = prep;
    const acc = makeAccumulator(job.pressureActive);
    const iterations = Math.max(1, job.iterations | 0);
    const cardsNeeded = missingBoard + opps.reduce((a, op) => a + op.missing, 0);
    const work = pool.slice();
    const L = work.length;
    const board = new Int32Array(5);
    for (let i = 0; i < job.boardIds.length; i += 1) board[i] = job.boardIds[i];
    const knownLen = job.boardIds.length;
    const h0 = job.heroIds[0], h1 = job.heroIds[1];
    const nOpp = opps.length;
    const seven = [h0, h1, 0, 0, 0, 0, 0];

    // Quand le modèle de pression est actif, une simulation uniforme peut donner
    // beaucoup de poids à très peu de distributions. On prolonge alors le MC
    // jusqu'à obtenir un échantillon utile (ESS) suffisant, sans dépasser 8×
    // la précision demandée par l'utilisateur.
    const targetEss = job.pressureActive ? Math.max(0, job.targetEss ?? 5000) : 0;
    const maxIterations = Math.max(iterations, job.maxIterations ?? iterations * 8);
    let done = 0, total = iterations;
    while (done < total) {
      const stop = Math.min(done + MC_CHUNK, total);
      for (; done < stop; done += 1) {
        for (let i = 0; i < cardsNeeded; i += 1) {
          const j = i + ((Math.random() * (L - i)) | 0);
          const t = work[i]; work[i] = work[j]; work[j] = t;
        }
        let cursor = 0;
        for (let i = knownLen; i < 5; i += 1) { board[i] = work[cursor]; cursor += 1; }
        seven[2] = board[0]; seven[3] = board[1]; seven[4] = board[2]; seven[5] = board[3]; seven[6] = board[4];
        const heroScore = eval7(h0, h1, board[0], board[1], board[2], board[3], board[4]);
        noteHero(acc, heroScore, seven, [board[0], board[1], board[2], board[3], board[4]]);
        let best = heroScore, winners = 1, heroBest = true, weight = 1;
        for (let k = 0; k < nOpp; k += 1) {
          const op = opps[k];
          let c1, c2;
          if (op.missing === 0) { c1 = op.known[0]; c2 = op.known[1]; }
          else if (op.missing === 1) { c1 = op.known[0]; c2 = work[cursor]; cursor += 1; }
          else { c1 = work[cursor]; c2 = work[cursor + 1]; cursor += 2; }
          const sc = eval7(c1, c2, board[0], board[1], board[2], board[3], board[4]);
          if (sc > best) { best = sc; winners = 1; heroBest = false; }
          else if (sc === best) winners += 1;
          if (job.pressureActive && op.weighted) {
            weight *= op.weightTable[c1 * 52 + c2];
          }
        }
        if (job.pressureActive) weight = clamp(weight, 1e-18, 1);
        tally(acc, heroBest, winners, weight);
      }
      await new Promise(res => setTimeout(res, 0));
      if (hooks.shouldAbort && hooks.shouldAbort()) return null;
      // Prolonge par blocs de la taille demandée si l'ESS reste trop faible.
      if (done >= total && targetEss > 0 && total < maxIterations && acc.pW > 0) {
        const ess = (acc.pW * acc.pW) / acc.pW2;
        if (ess < targetEss) total = Math.min(maxIterations, total + iterations);
      }
      if (hooks.onProgress) hooks.onProgress(Math.min(100, Math.round((done / total) * 100)));
    }
    return finalize(acc, 'montecarlo', 0);
  }

  /* ---------- Point d'entrée ---------- */
  async function runJob(job, hooks = {}) {
    const prep = prepare(job);
    if (prep.pool.length < prep.missingBoard + prep.opps.reduce((a, op) => a + op.missing, 0)) {
      throw new Error('Trop de cartes connues.');
    }
    job.pressureActive = Boolean(job.pressureActive) && prep.opps.some(op => op.weighted);
    if (prep.leaves > 0 && prep.leaves <= EXACT_LEAF_LIMIT && prep.boards <= EXACT_BOARD_LIMIT) {
      const exact = await runExact(job, prep, hooks);
      if (exact) { exact.leaves = prep.leaves; return exact; }
      return null; // annulé
    }
    return runMonteCarlo(job, prep, hooks);
  }

  const api = {
    eval7, evalIds, category, isRoyal,
    preflopStrengthIds, currentMadeHandStrengthIds, boardAtStreetIds, straightDrawOutRanksIds,
    postflopHandSignalsIds, strongActionLikelihoodIds, pressureWeightForIds, boardOnlyCategoryIds,
    prepare, runJob, comb, EXACT_LEAF_LIMIT
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.CS_ENGINE = api;
})(typeof self !== 'undefined' ? self : typeof globalThis !== 'undefined' ? globalThis : this);

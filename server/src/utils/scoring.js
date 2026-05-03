const F1_POINTS = [10, 8, 6, 5, 4, 3, 2, 1];

function getPointsForPlace(mode, place, n) {
  if (mode === "f1") return F1_POINTS[place - 1] ?? 0;
  if (mode === "top3") {
    if (place === 1) return 3;
    if (place === 2) return 2;
    if (place === 3) return 1;
    return 0;
  }
  return Math.max(0, n - place + 1);
}

function getMaxPoints(mode, n) {
  return getPointsForPlace(mode, 1, n);
}

export function computeLeaderboard(olympic) {
  const {
    participants,
    games,
    results,
    extraRules,
    scoringMode = "linear",
    scoringEnabled = true,
    hostGhostMode = false,
    hostParticipates = false,
    hostPlayerName = "",
  } = olympic;

  if (!scoringEnabled) {
    return participants.map((p) => ({
      name: p.name,
      base: 0,
      bonus: 0,
      total: 0,
      wins: 0,
      bonusLog: [],
    }));
  }

  const ghostName = hostGhostMode && hostParticipates && hostPlayerName ? hostPlayerName : null;

  const scores = {};
  for (const p of participants) {
    if (ghostName && p.name === ghostName) continue;
    scores[p.name] = { name: p.name, base: 0, bonus: 0, wins: 0, bonusLog: [] };
  }

  let prevLeader = null;
  let prevLast = null;
  let lastFFAWinner = null;

  for (let idx = 0; idx < results.length; idx++) {
    const result = results[idx];
    const game = games.find((g) => String(g._id) === String(result.gameId));
    if (!game) continue;

    const rawPlacements = result.placements || [];
    const n = ghostName ? participants.length - 1 : participants.length;
    if (n === 0) continue;

    const isLastGame = idx === games.length - 1;
    const isFFA = game.mode !== "team";
    const multiplier = isLastGame && extraRules?.finalDoublePoints ? 2 : 1;

    if (isFFA) {
      let placements = rawPlacements;
      if (ghostName) {
        const ghostPlacement = rawPlacements.find((p) => p.participantName === ghostName);
        const ghostPlace = ghostPlacement ? ghostPlacement.place : null;
        placements = rawPlacements
          .filter((p) => p.participantName !== ghostName)
          .map((p) => ({
            ...p,
            place: ghostPlace !== null && p.place > ghostPlace ? p.place - 1 : p.place,
          }));
      }

      for (const { participantName, place } of placements) {
        if (!scores[participantName]) continue;
        const basePoints = getPointsForPlace(scoringMode, place, n) * multiplier;
        scores[participantName].base += basePoints;
        if (place === 1) scores[participantName].wins += 1;
      }

      const winnerName = placements.find((p) => p.place === 1)?.participantName;
      const maxPlace = placements.length > 0 ? Math.max(...placements.map((p) => p.place)) : 0;
      const lastPlaceName = placements.find((p) => p.place === maxPlace)?.participantName;

      if (extraRules?.comebackPenalty && prevLeader && prevLeader === lastPlaceName) {
        if (scores[prevLeader]) {
          scores[prevLeader].bonus -= 2;
          scores[prevLeader].bonusLog.push({ game: game.title, reason: "Comeback Penalty", delta: -2 });
        }
      }

      if (extraRules?.lastPlaceBonus && prevLast && prevLast === winnerName) {
        if (scores[prevLast]) {
          scores[prevLast].bonus += 1;
          scores[prevLast].bonusLog.push({ game: game.title, reason: "Last Place Bonus", delta: +1 });
        }
      }

      if (extraRules?.winStreakBonus && winnerName && lastFFAWinner === winnerName) {
        if (scores[winnerName]) {
          scores[winnerName].bonus += 1;
          scores[winnerName].bonusLog.push({ game: game.title, reason: "Win Streak Bonus", delta: +1 });
        }
      }

      lastFFAWinner = winnerName || null;
    } else {
      const winningTeam = (result.teams || []).find((t) => t.won);
      const winPts = Math.ceil(getMaxPoints(scoringMode, n) / 2) * multiplier;

      for (const member of winningTeam?.members || []) {
        if (ghostName && member === ghostName) continue;
        if (scores[member]) {
          scores[member].base += winPts;
          scores[member].wins += 1;
        }
      }

      lastFFAWinner = null;
    }

    const ranking = Object.values(scores)
      .map((s) => ({ name: s.name, total: s.base + s.bonus }))
      .sort((a, b) => b.total - a.total);

    prevLeader = ranking[0]?.name || null;
    prevLast = ranking[ranking.length - 1]?.name || null;
  }

  return Object.values(scores)
    .map((s) => ({
      name: s.name,
      base: s.base,
      bonus: s.bonus,
      total: s.base + s.bonus,
      wins: s.wins,
      bonusLog: s.bonusLog,
    }))
    .sort((a, b) => b.total - a.total || b.wins - a.wins);
}

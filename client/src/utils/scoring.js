/** Client-side mirror of server/src/utils/scoring.js */
export function computeLeaderboard(olympic) {
  if (!olympic) return [];
  const { participants = [], games = [], results = [], extraRules = {} } = olympic;

  const scores = {};
  for (const p of participants) {
    scores[p.name] = { name: p.name, base: 0, bonus: 0, wins: 0, bonusLog: [] };
  }

  let prevLeader = null;
  let prevLast = null;
  let lastFFAWinner = null;

  for (let idx = 0; idx < results.length; idx++) {
    const result = results[idx];
    const game = games.find((g) => String(g._id) === String(result.gameId));
    if (!game) continue;

    const placements = result.placements || [];
    const n = participants.length;
    if (n === 0) continue;

    const isLastGame = idx === games.length - 1;
    const isFFA = game.mode !== 'team';
    const multiplier = isLastGame && extraRules.finalDoublePoints ? 2 : 1;

    if (isFFA) {
      for (const { participantName, place } of placements) {
        if (!scores[participantName]) continue;
        scores[participantName].base += (n - place + 1) * multiplier;
        if (place === 1) scores[participantName].wins += 1;
      }

      const top3Names = placements.filter((p) => p.place <= 3).map((p) => p.participantName);
      const winnerName = placements.find((p) => p.place === 1)?.participantName;

      if (extraRules.comebackPenalty && prevLeader && !top3Names.includes(prevLeader) && scores[prevLeader]) {
        scores[prevLeader].bonus -= 2;
        scores[prevLeader].bonusLog.push({ game: game.title, reason: 'Comeback Penalty', delta: -2 });
      }
      if (extraRules.lastPlaceBonus && prevLast && top3Names.includes(prevLast) && scores[prevLast]) {
        scores[prevLast].bonus += 1;
        scores[prevLast].bonusLog.push({ game: game.title, reason: 'Last Place Bonus', delta: +1 });
      }
      if (extraRules.winStreakBonus && winnerName && lastFFAWinner === winnerName && scores[winnerName]) {
        scores[winnerName].bonus += 1;
        scores[winnerName].bonusLog.push({ game: game.title, reason: 'Win Streak Bonus', delta: +1 });
      }

      lastFFAWinner = winnerName || null;
    } else {
      const winningTeam = (result.teams || []).find((t) => t.won);
      const losingTeam = (result.teams || []).find((t) => !t.won);
      const winPts = Math.ceil(n / 2) * multiplier;
      const losePts = Math.floor(n / 4) * multiplier;

      for (const member of winningTeam?.members || []) {
        if (scores[member]) { scores[member].base += winPts; scores[member].wins += 1; }
      }
      for (const member of losingTeam?.members || []) {
        if (scores[member]) scores[member].base += losePts;
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
    .map((s) => ({ ...s, total: s.base + s.bonus }))
    .sort((a, b) => b.total - a.total || b.wins - a.wins);
}

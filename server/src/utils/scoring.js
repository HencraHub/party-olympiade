/**
 * Computes the leaderboard from an Olympic document.
 * Returns a sorted array of player score objects.
 */

// Classic F1 points table (index 0 = 1st place)
const F1_POINTS = [10, 8, 6, 5, 4, 3, 2, 1];

/** Points awarded to a player finishing in `place` out of `n` participants. */
function getPointsForPlace(mode, place, n) {
  if (mode === "f1") return F1_POINTS[place - 1] ?? 0;
  if (mode === "top3") {
    if (place === 1) return 3;
    if (place === 2) return 2;
    if (place === 3) return 1;
    return 0;
  }
  // 'linear' (default): everyone scores, 1st gets n pts, last gets 1 pt
  return Math.max(0, n - place + 1);
}

/** Max points any single player can earn in one game (= points for 1st place). */
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
  } = olympic;

  // No-score mode: return all participants with zero points
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
    const isFFA = game.mode !== "team";
    const multiplier = isLastGame && extraRules?.finalDoublePoints ? 2 : 1;

    if (isFFA) {
      // FFA base scoring — use selected scoring mode
      for (const { participantName, place } of placements) {
        if (!scores[participantName]) continue;
        const basePoints =
          getPointsForPlace(scoringMode, place, n) * multiplier;
        scores[participantName].base += basePoints;
        if (place === 1) scores[participantName].wins += 1;
      }

      const top3Names = placements
        .filter((p) => p.place <= 3)
        .map((p) => p.participantName);
      const winnerName = placements.find((p) => p.place === 1)?.participantName;

      // Comeback penalty
      if (
        extraRules?.comebackPenalty &&
        prevLeader &&
        !top3Names.includes(prevLeader)
      ) {
        if (scores[prevLeader]) {
          scores[prevLeader].bonus -= 2;
          scores[prevLeader].bonusLog.push({
            game: game.title,
            reason: "Comeback Penalty",
            delta: -2,
          });
        }
      }

      // Last place bonus
      if (
        extraRules?.lastPlaceBonus &&
        prevLast &&
        top3Names.includes(prevLast)
      ) {
        if (scores[prevLast]) {
          scores[prevLast].bonus += 1;
          scores[prevLast].bonusLog.push({
            game: game.title,
            reason: "Last Place Bonus",
            delta: +1,
          });
        }
      }

      // Win streak bonus
      if (
        extraRules?.winStreakBonus &&
        winnerName &&
        lastFFAWinner === winnerName
      ) {
        if (scores[winnerName]) {
          scores[winnerName].bonus += 1;
          scores[winnerName].bonusLog.push({
            game: game.title,
            reason: "Win Streak Bonus",
            delta: +1,
          });
        }
      }

      lastFFAWinner = winnerName || null;
    } else {
      // Team scoring:
      // Winning team: each member earns half the max points for this scoring mode.
      // Losing team: 0 points (teams compete, only the winner is rewarded).
      const winningTeam = (result.teams || []).find((t) => t.won);
      const winPts = Math.ceil(getMaxPoints(scoringMode, n) / 2) * multiplier;

      for (const member of winningTeam?.members || []) {
        if (scores[member]) {
          scores[member].base += winPts;
          scores[member].wins += 1;
        }
      }

      lastFFAWinner = null;
    }

    // Update previous leader / last for next iteration
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

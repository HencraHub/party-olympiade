import { useState } from "react";
import { Check } from "lucide-react";
import Select from "./ui/Select.jsx";

export default function ScoreEntry({
  game,
  participants,
  existingResult,
  onSubmit,
  onCancel,
  tieRule,
}) {
  const isFFA = game.mode !== "team";
  const names = participants.map((p) => p.name);

  // FFA state: placements[i] = { participantName, place }
  const [placements, setPlacements] = useState(() => {
    if (existingResult?.placements?.length) return existingResult.placements;
    return names.map((n, i) => ({ participantName: n, place: i + 1 }));
  });

  // Team state
  const [teamAName, setTeamAName] = useState(
    () => existingResult?.teams?.[0]?.name || "Team A",
  );
  const [teamBName, setTeamBName] = useState(
    () => existingResult?.teams?.[1]?.name || "Team B",
  );
  const [teamA, setTeamA] = useState(
    () => existingResult?.teams?.[0]?.members || [],
  );
  const [teamB, setTeamB] = useState(
    () => existingResult?.teams?.[1]?.members || [],
  );
  const [winner, setWinner] = useState(() =>
    existingResult?.teams ? (existingResult.teams[0]?.won ? "A" : "B") : null,
  );

  const [error, setError] = useState("");

  // FFA: update place for a player
  function setPlace(name, newPlace) {
    setPlacements((prev) => {
      const newP = prev.map((p) =>
        p.participantName === name ? { ...p, place: newPlace } : p,
      );
      return newP;
    });
  }

  // Team: toggle player between teams
  function toggleTeam(name, team) {
    if (team === "A") {
      setTeamA((p) =>
        p.includes(name) ? p.filter((n) => n !== name) : [...p, name],
      );
      setTeamB((p) => p.filter((n) => n !== name));
    } else {
      setTeamB((p) =>
        p.includes(name) ? p.filter((n) => n !== name) : [...p, name],
      );
      setTeamA((p) => p.filter((n) => n !== name));
    }
  }

  function validate() {
    if (isFFA) {
      const places = placements.map((p) => p.place);
      const uniquePlaces = new Set(places);
      if (tieRule !== "tiebreaker" && uniquePlaces.size !== places.length) {
        setError("Each player must have a unique place.");
        return false;
      }
      if (placements.some((p) => !p.place || p.place < 1)) {
        setError("All players must be assigned a place.");
        return false;
      }
    } else {
      if (teamA.length === 0 || teamB.length === 0) {
        setError("Both teams must have at least one player.");
        return false;
      }
      if (!winner) {
        setError("Select the winning team.");
        return false;
      }
    }
    return true;
  }

  function handleSubmit() {
    setError("");
    if (!validate()) return;

    if (isFFA) {
      onSubmit({ gameId: game._id, placements, teams: [] });
    } else {
      const teams = [
        {
          name: teamAName.trim() || "Team A",
          members: teamA,
          won: winner === "A",
        },
        {
          name: teamBName.trim() || "Team B",
          members: teamB,
          won: winner === "B",
        },
      ];
      onSubmit({ gameId: game._id, placements: [], teams });
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-white text-lg">
        Score: {game.icon} {game.title}
      </h3>

      {isFFA ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">
            Assign placement for each player (1 = winner):
          </p>
          {names.map((name) => {
            const entry = placements.find((p) => p.participantName === name);
            return (
              <div key={name} className="flex items-center gap-3">
                <span className="w-32 truncate text-white text-sm font-medium">
                  {name}
                </span>
                <Select
                  value={entry?.place ? String(entry.place) : ""}
                  onChange={(val) => setPlace(name, Number(val))}
                  placeholder="—"
                  className="w-28"
                  options={[
                    { value: "", label: "—" },
                    ...names.map((_, i) => ({
                      value: String(i + 1),
                      label: String(i + 1),
                    })),
                  ]}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Form two teams from the player list, name them, then pick the
            winner.
            <span className="ml-1 text-purple-light">
              The winning team earns points — losing team scores nothing.
            </span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {["A", "B"].map((team) => {
              const members = team === "A" ? teamA : teamB;
              const teamName = team === "A" ? teamAName : teamBName;
              const setTeamName = team === "A" ? setTeamAName : setTeamBName;
              return (
                <div key={team} className="glass rounded-xl p-3 space-y-2">
                  <input
                    className="input-field text-sm font-bold py-1.5"
                    maxLength={30}
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder={`Team ${team}`}
                  />
                  <button
                    className={`w-full text-xs px-2 py-1.5 rounded-lg border transition-colors ${
                      winner === team
                        ? "bg-green-500/30 border-green-500 text-green-400"
                        : "border-white/20 text-muted hover:border-white/40"
                    }`}
                    onClick={() => setWinner(team)}
                  >
                    {winner === team ? <span className="flex items-center justify-center gap-1"><Check size={12} /> Winner</span> : "Set as winner"}
                  </button>
                  <div className="space-y-1 pt-1">
                    {names.map((name) => (
                      <label
                        key={name}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={members.includes(name)}
                          onChange={() => toggleTeam(name, team)}
                          className="accent-purple w-4 h-4"
                        />
                        <span className="text-sm text-white">{name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-pink-400">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button className="btn-primary flex-1" onClick={handleSubmit}>
          Save Score
        </button>
        {onCancel && (
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

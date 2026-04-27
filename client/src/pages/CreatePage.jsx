import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import { useAuthStore } from "../store/useAuthStore.js";
import AuthModal from "../components/AuthModal.jsx";

const STEPS = ["Event Setup", "Games", "Preview"];

const DEFAULT_ADDONS = {
  drinkingGame: { enabled: false, rules: "" },
  timeLimit: 0,
  equipment: "",
  handicap: "",
  teamSize: 2,
};

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error("Image must be under 2 MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Step 1: Event Setup ───────────────────────────────────────────────────
function StepEventSetup({ data, onChange }) {
  const scoringEnabled = data.scoringEnabled !== false;

  return (
    <div className="space-y-5">
      <Input
        label="Olympic Name"
        placeholder="e.g. Summer Gaming Olympics 2025"
        maxLength={60}
        value={data.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />

      <div>
        <label className="label">Max Players</label>
        <input
          type="number"
          className="input-field"
          min={2}
          max={50}
          value={data.maxPlayers}
          onChange={(e) =>
            onChange({ maxPlayers: Math.max(2, Number(e.target.value)) })
          }
        />
        <p className="text-xs text-muted mt-1">
          Players join via room code after launch. Min 2, max 50.
        </p>
      </div>

      {/* ─ Scoring toggle ─ */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer glass rounded-xl p-3 hover:border-white/20 transition-colors">
          <input
            type="checkbox"
            className="mt-0.5 accent-purple w-4 h-4 shrink-0"
            checked={scoringEnabled}
            onChange={(e) => onChange({ scoringEnabled: e.target.checked })}
          />
          <div>
            <span className="text-sm font-semibold text-white">
              🏅 Track Scores
            </span>
            <p className="text-xs text-muted mt-0.5">
              When off, games are played for fun — no points, no leaderboard.
            </p>
          </div>
        </label>

        {scoringEnabled && (
          <>
            <Select
              label="Scoring System"
              value={data.scoringMode}
              onChange={(val) => onChange({ scoringMode: val })}
              options={[
                {
                  value: "linear",
                  label: "Linear",
                  description:
                    "Every position earns points: 1st = n pts, last = 1 pt",
                },
                {
                  value: "top3",
                  label: "Top 3 Only",
                  description: "1st: 3 pts · 2nd: 2 pts · 3rd: 1 pt · rest: 0",
                },
                {
                  value: "f1",
                  label: "F1 Format",
                  description: "10 · 8 · 6 · 5 · 4 · 3 · 2 · 1 pts",
                },
              ]}
              description="Team games: winning team gets half the max points. Losing team: 0."
            />

            <Select
              label="Tie-Breaking Rule"
              value={data.tieRule}
              onChange={(val) => onChange({ tieRule: val })}
              options={[
                { value: "tiebreaker", label: "Tiebreaker question decides" },
                { value: "shared_points", label: "Tied players share points" },
              ]}
            />

            <div>
              <p className="label mb-3">Optional Bonus / Penalty Rules</p>
              <div className="space-y-3">
                {[
                  {
                    key: "comebackPenalty",
                    label: "Comeback Penalty",
                    desc: "Previous leader not in top 3 → −2 pts",
                    icon: "📉",
                  },
                  {
                    key: "lastPlaceBonus",
                    label: "Last Place Bonus",
                    desc: "Previous last-place in top 3 → +1 pt",
                    icon: "📈",
                  },
                  {
                    key: "winStreakBonus",
                    label: "Win Streak Bonus",
                    desc: "Win two FFA games in a row → +1 pt",
                    icon: "🔥",
                  },
                  {
                    key: "finalDoublePoints",
                    label: "Final Double Points",
                    desc: "Last game awards 2× base points",
                    icon: "💥",
                  },
                ].map(({ key, label, desc, icon }) => (
                  <label
                    key={key}
                    className="flex items-start gap-3 cursor-pointer glass rounded-xl p-3 hover:border-white/20 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-purple w-4 h-4 shrink-0"
                      checked={data.extraRules[key]}
                      onChange={(e) =>
                        onChange({
                          extraRules: {
                            ...data.extraRules,
                            [key]: e.target.checked,
                          },
                        })
                      }
                    />
                    <div>
                      <span className="text-sm font-semibold text-white">
                        {icon} {label}
                      </span>
                      <p className="text-xs text-muted mt-0.5">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─ Host participation ─ */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer glass rounded-xl p-3 hover:border-white/20 transition-colors">
          <input
            type="checkbox"
            className="mt-0.5 accent-purple w-4 h-4 shrink-0"
            checked={!!data.hostParticipates}
            onChange={(e) => onChange({ hostParticipates: e.target.checked })}
          />
          <div>
            <span className="text-sm font-semibold text-white">
              🎮 Host also plays
            </span>
            <p className="text-xs text-muted mt-0.5">
              You join as a player — your score
              {scoringEnabled
                ? " is tracked on the leaderboard"
                : " shows on screen"}
              .
            </p>
          </div>
        </label>

        {data.hostParticipates && (
          <Input
            label="Your player name"
            placeholder="e.g. Alex"
            maxLength={30}
            value={data.hostPlayerName || ""}
            onChange={(e) => onChange({ hostPlayerName: e.target.value })}
          />
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Games ────────────────────────────────────────────────────────
function StepGames({ games, onChange }) {
  const [tab, setTab] = useState("create"); // 'create' | 'library'

  // ── Create tab state ──
  const [form, setForm] = useState({
    title: "",
    mode: "ffa",
    icon: "🎮",
    rules: "",
    imageBase64: "",
    addons: { ...DEFAULT_ADDONS },
  });
  const [imgError, setImgError] = useState("");
  const [showAddons, setShowAddons] = useState(false);

  // ── Library tab state ──
  const [presets, setPresets] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [presetsError, setPresetsError] = useState("");
  const [search, setSearch] = useState("");
  const [addedIds, setAddedIds] = useState(new Set());

  // Load presets when library tab is first opened
  useEffect(() => {
    if (tab !== "library" || presets.length > 0) return;
    setPresetsLoading(true);
    setPresetsError("");
    api
      .get("/game-presets")
      .then(({ data }) => setPresets(data))
      .catch(() => setPresetsError("Failed to load library"))
      .finally(() => setPresetsLoading(false));
  }, [tab]); // eslint-disable-line

  async function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await readFileAsBase64(file);
      setForm((f) => ({ ...f, imageBase64: b64 }));
      setImgError("");
    } catch (err) {
      setImgError(err.message);
    }
  }

  function addGame() {
    const title = form.title.trim();
    if (!title) return;
    onChange([...games, { ...form, title, order: games.length }]);
    setForm({
      title: "",
      mode: "ffa",
      icon: "🎮",
      rules: "",
      imageBase64: "",
      addons: { ...DEFAULT_ADDONS },
    });
    setShowAddons(false);
  }

  function addFromLibrary(preset) {
    onChange([
      ...games,
      {
        title: preset.title,
        mode: preset.mode,
        icon: preset.icon,
        rules: preset.rules,
        imageBase64: "",
        addons: preset.addons || { ...DEFAULT_ADDONS },
        order: games.length,
      },
    ]);
    setAddedIds((s) => new Set([...s, preset._id]));
  }

  function moveGame(i, dir) {
    const arr = [...games];
    const swap = i + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[i], arr[swap]] = [arr[swap], arr[i]];
    onChange(arr.map((g, idx) => ({ ...g, order: idx })));
  }

  const filteredPresets = presets.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-1 glass rounded-xl p-1">
        {[
          { key: "create", label: "✏️ Create Game" },
          { key: "library", label: "📚 Choose from Library" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? "bg-purple-500/30 text-white"
                : "text-muted hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Create tab ── */}
      {tab === "create" && (
        <GlassCard className="space-y-4">
          <h3 className="font-bold text-white">Add Game</h3>

          <div className="flex gap-2">
            <Input
              placeholder="Game title"
              maxLength={60}
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className="flex-1"
            />
            <input
              className="input-field w-16 text-center text-xl"
              placeholder="🎮"
              maxLength={2}
              value={form.icon}
              onChange={(e) =>
                setForm((f) => ({ ...f, icon: e.target.value || "🎮" }))
              }
            />
          </div>

          <div className="flex gap-3">
            {["ffa", "team"].map((m) => (
              <button
                key={m}
                onClick={() => setForm((f) => ({ ...f, mode: m }))}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  form.mode === m
                    ? "border-purple-500 bg-purple-500/20 text-purple-light"
                    : "border-white/10 text-muted hover:border-white/30"
                }`}
              >
                {m === "ffa" ? "⚔️ FFA" : "👥 Teams"}
              </button>
            ))}
          </div>

          <textarea
            className="textarea-field h-24"
            placeholder="Rules (optional, max 1000 chars)"
            maxLength={1000}
            value={form.rules}
            onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
          />

          {/* Cover image */}
          <label className="cursor-pointer glass rounded-xl p-3 flex items-center gap-3 hover:border-purple-500/40 transition-colors">
            <input type="file" accept="image/*" onChange={handleImage} />
            {form.imageBase64 ? (
              <img
                src={form.imageBase64}
                alt=""
                className="w-16 h-10 rounded object-cover"
              />
            ) : (
              <span className="text-2xl">🖼</span>
            )}
            <span className="text-sm text-muted">
              {form.imageBase64
                ? "Change cover image"
                : "Upload cover image (optional)"}
            </span>
          </label>
          {imgError && <p className="text-xs text-pink-400">{imgError}</p>}

          {/* Addons toggle */}
          <button
            className="text-sm text-purple-light hover:text-purple transition-colors"
            onClick={() => setShowAddons((s) => !s)}
          >
            {showAddons ? "▲ Hide add-ons" : "▼ Show add-ons (optional)"}
          </button>

          {showAddons && (
            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-3 text-sm text-white">
                <input
                  type="checkbox"
                  className="accent-purple w-4 h-4"
                  checked={form.addons.drinkingGame.enabled}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      addons: {
                        ...f.addons,
                        drinkingGame: {
                          ...f.addons.drinkingGame,
                          enabled: e.target.checked,
                        },
                      },
                    }))
                  }
                />
                🍺 Drinking game mode
              </label>
              {form.addons.drinkingGame.enabled && (
                <textarea
                  className="textarea-field h-16 text-sm"
                  placeholder="Drinking rules..."
                  maxLength={500}
                  value={form.addons.drinkingGame.rules}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      addons: {
                        ...f.addons,
                        drinkingGame: {
                          ...f.addons.drinkingGame,
                          rules: e.target.value,
                        },
                      },
                    }))
                  }
                />
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">⏱ Time limit (min, 0=∞)</label>
                  <input
                    type="number"
                    className="input-field"
                    min={0}
                    value={form.addons.timeLimit}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        addons: {
                          ...f.addons,
                          timeLimit: Number(e.target.value),
                        },
                      }))
                    }
                  />
                </div>
                {form.mode === "team" && (
                  <div>
                    <label className="label">👥 Team size</label>
                    <input
                      type="number"
                      className="input-field"
                      min={1}
                      value={form.addons.teamSize}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          addons: {
                            ...f.addons,
                            teamSize: Number(e.target.value),
                          },
                        }))
                      }
                    />
                  </div>
                )}
              </div>
              <Input
                label="🛠 Equipment needed"
                placeholder="e.g. Controller, 2 TVs"
                maxLength={200}
                value={form.addons.equipment}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    addons: { ...f.addons, equipment: e.target.value },
                  }))
                }
              />
              <Input
                label="⚖ Handicap rules"
                placeholder="e.g. Best player uses keyboard"
                maxLength={200}
                value={form.addons.handicap}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    addons: { ...f.addons, handicap: e.target.value },
                  }))
                }
              />
            </div>
          )}

          <button
            className="btn-primary w-full"
            onClick={addGame}
            disabled={!form.title.trim()}
          >
            + Add Game
          </button>
        </GlassCard>
      )}

      {/* ── Library tab ── */}
      {tab === "library" && (
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-bold text-white">Game Library</h3>
            <a
              href="/library"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-light hover:text-purple transition-colors"
            >
              + Submit a preset ↗
            </a>
          </div>

          <input
            className="input-field"
            placeholder="🔍 Search games…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {presetsLoading && (
            <p className="text-muted text-sm text-center py-6 animate-pulse">
              Loading library…
            </p>
          )}
          {presetsError && (
            <p className="text-pink-400 text-sm text-center py-4">
              {presetsError}
            </p>
          )}

          {!presetsLoading && filteredPresets.length === 0 && !presetsError && (
            <p className="text-muted text-sm text-center py-6">
              {search
                ? `No games matching "${search}"`
                : "Library is empty yet — be the first to submit!"}
            </p>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredPresets.map((preset) => {
              const already =
                addedIds.has(preset._id) ||
                games.some((g) => g.title === preset.title);
              return (
                <div
                  key={preset._id}
                  className="glass rounded-xl p-3 flex items-start gap-3 hover:border-white/20 transition-colors"
                >
                  <span className="text-2xl mt-0.5 shrink-0">
                    {preset.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white truncate">
                        {preset.title}
                      </span>
                      <span className="text-xs text-muted uppercase">
                        {preset.mode}
                      </span>
                    </div>
                    {preset.rules && (
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">
                        {preset.rules}
                      </p>
                    )}
                    <p className="text-xs text-white/30 mt-1">
                      by {preset.createdByUsername}
                    </p>
                  </div>
                  <button
                    className={`shrink-0 text-sm px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      already
                        ? "bg-green-500/20 text-green-400 cursor-default"
                        : "bg-purple-500/20 text-purple-light hover:bg-purple-500/30"
                    }`}
                    onClick={() => !already && addFromLibrary(preset)}
                    disabled={already}
                  >
                    {already ? "✓ Added" : "+ Add"}
                  </button>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Game list */}
      <div className="space-y-2">
        {games.map((g, i) => (
          <div key={i} className="glass rounded-xl p-3 flex items-center gap-3">
            <span className="text-xl">{g.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-white truncate">{g.title}</span>
              <span className="ml-2 text-xs text-muted">
                {g.mode.toUpperCase()}
              </span>
            </div>
            <div className="flex gap-1">
              <button
                className="btn-ghost text-xs !px-2 !py-1"
                onClick={() => moveGame(i, -1)}
                disabled={i === 0}
              >
                ▲
              </button>
              <button
                className="btn-ghost text-xs !px-2 !py-1"
                onClick={() => moveGame(i, 1)}
                disabled={i === games.length - 1}
              >
                ▼
              </button>
              <button
                className="text-pink-400 hover:text-pink-300 text-sm ml-1"
                onClick={() => onChange(games.filter((_, idx) => idx !== i))}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {games.length === 0 && (
          <p className="text-muted text-sm text-center py-4">
            No games yet. Add at least 1.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Preview ──────────────────────────────────────────────────────
function StepPreview({ data }) {
  const scoringLabels = {
    linear: "Linear",
    top3: "Top 3 Only",
    f1: "F1 Format",
  };
  return (
    <div className="space-y-4">
      <GlassCard>
        <h3 className="font-bold text-white mb-1">{data.name || "—"}</h3>
        <p className="text-sm text-muted">Max players: {data.maxPlayers}</p>
        {data.scoringEnabled !== false ? (
          <>
            <p className="text-sm text-muted">
              Scoring: {scoringLabels[data.scoringMode] || data.scoringMode} ·
              Tie: {data.tieRule === "shared_points" ? "Shared" : "Tiebreaker"}
            </p>
          </>
        ) : (
          <p className="text-sm text-amber-400">🎉 Fun mode — no scoring</p>
        )}
        {data.hostParticipates && data.hostPlayerName && (
          <p className="text-sm text-cyan-400">
            🎮 Host plays as: {data.hostPlayerName}
          </p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {Object.entries(data.extraRules)
            .filter(([, v]) => v)
            .map(([k]) => (
              <span
                key={k}
                className="badge bg-purple-500/20 text-purple-light"
              >
                {k}
              </span>
            ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h4 className="font-semibold text-muted text-sm mb-2">
          Games ({data.games.length})
        </h4>
        <div className="space-y-1.5">
          {data.games.map((g, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-muted w-5 text-right">{i + 1}.</span>
              <span>{g.icon}</span>
              <span className="text-white">{g.title}</span>
              <span className="text-xs text-muted ml-auto">
                {g.mode.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="border-cyan-500/30">
        <h4 className="font-semibold text-cyan text-sm mb-1">
          🎮 Players join via room code
        </h4>
        <p className="text-sm text-muted">
          After launching you'll get a shareable room code. Up to{" "}
          {data.maxPlayers} players can join the lobby before you start the
          event.
        </p>
      </GlassCard>
    </div>
  );
}

// ─── Main CreatePage ───────────────────────────────────────────────────────
export default function CreatePage() {
  const navigate = useNavigate();
  const { code: editCode } = useParams(); // present when route is /edit/:code
  const isEditMode = Boolean(editCode);
  const { user } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingDraft, setFetchingDraft] = useState(isEditMode);
  const [apiError, setApiError] = useState("");

  const [eventData, setEventData] = useState({
    name: "",
    tieRule: "tiebreaker",
    scoringMode: "linear",
    scoringEnabled: true,
    hostParticipates: false,
    hostPlayerName: "",
    extraRules: {
      comebackPenalty: false,
      lastPlaceBonus: false,
      winStreakBonus: false,
      finalDoublePoints: false,
    },
    maxPlayers: 12,
  });
  const [games, setGames] = useState([]);

  // In edit mode, load existing draft data
  useEffect(() => {
    if (!isEditMode) return;
    api
      .get(`/olympics/${editCode}`)
      .then(({ data }) => {
        setEventData({
          name: data.name,
          tieRule: data.tieRule,
          scoringMode: data.scoringMode || "linear",
          scoringEnabled: data.scoringEnabled !== false,
          hostParticipates: !!data.hostParticipates,
          hostPlayerName: data.hostPlayerName || "",
          extraRules: data.extraRules,
          maxPlayers: data.maxPlayers,
        });
        setGames(data.games || []);
      })
      .catch(() => setApiError("Failed to load Olympic. Does it exist?"))
      .finally(() => setFetchingDraft(false));
  }, [editCode, isEditMode]);

  function canProceed() {
    if (step === 0) return eventData.name.trim().length > 0;
    if (step === 1) return games.length >= 1;
    return true;
  }

  async function save() {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      if (isEditMode) {
        // Update existing draft
        await api.patch(`/olympics/${editCode}`, {
          name: eventData.name,
          tieRule: eventData.tieRule,
          scoringMode: eventData.scoringMode,
          scoringEnabled: eventData.scoringEnabled,
          hostParticipates: eventData.hostParticipates,
          hostPlayerName: eventData.hostPlayerName,
          extraRules: eventData.extraRules,
          maxPlayers: eventData.maxPlayers,
          games,
        });
      } else {
        // Create new draft
        const { data } = await api.post("/olympics", {
          name: eventData.name,
          tieRule: eventData.tieRule,
          scoringMode: eventData.scoringMode,
          scoringEnabled: eventData.scoringEnabled,
          hostParticipates: eventData.hostParticipates,
          hostPlayerName: eventData.hostPlayerName,
          extraRules: eventData.extraRules,
          maxPlayers: eventData.maxPlayers,
          games,
        });
        localStorage.setItem(`hostToken_${data.code}`, data.hostToken);
      }
      navigate("/profile");
    } catch (err) {
      setApiError(
        err.response?.data?.error ||
          (isEditMode
            ? "Failed to save changes."
            : "Failed to create Olympic. Is the server running?"),
      );
    } finally {
      setLoading(false);
    }
  }

  // Auth gate
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="max-w-sm w-full text-center py-8">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="font-bold text-white mb-1">Sign in required</h2>
          <p className="text-sm text-muted mb-5">
            You need an account to create Olympics
          </p>
          <button
            className="btn-primary w-full"
            onClick={() => setShowAuthModal(true)}
          >
            Sign in / Sign up
          </button>
        </GlassCard>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    );
  }

  if (fetchingDraft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted animate-pulse">Loading draft…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        {/* Back */}
        <button
          className="btn-ghost mb-6"
          onClick={() => navigate(isEditMode ? "/profile" : "/")}
        >
          ← Back
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i === step
                    ? "bg-gradient-to-br from-purple to-pink text-white"
                    : i < step
                      ? "bg-purple-500/40 text-purple-light"
                      : "bg-white/10 text-muted"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${i === step ? "text-white" : "text-muted"}`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-white/10" />
              )}
            </div>
          ))}
        </div>

        {/* Step title */}
        <h1 className="text-2xl font-bold text-white mb-6">
          {isEditMode ? `Edit: ${eventData.name || editCode}` : STEPS[step]}
        </h1>

        {/* Step content */}
        {step === 0 && (
          <StepEventSetup
            data={eventData}
            onChange={(patch) => setEventData((d) => ({ ...d, ...patch }))}
          />
        )}
        {step === 1 && <StepGames games={games} onChange={setGames} />}
        {step === 2 && <StepPreview data={{ ...eventData, games }} />}

        {apiError && (
          <div className="mt-4 p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 text-sm">
            {apiError}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              className="btn-secondary"
              onClick={() => setStep((s) => s - 1)}
            >
              ← Back
            </button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <button
              className="btn-primary"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={save}
              disabled={loading || !canProceed()}
            >
              {loading
                ? isEditMode
                  ? "Saving…"
                  : "Saving draft…"
                : isEditMode
                  ? "💾 Save Changes"
                  : "💾 Save Draft"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/client.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import { useAuthStore } from "../store/useAuthStore.js";
import AuthModal from "../components/AuthModal.jsx";

const STEPS = ["Event Setup", "Spiele", "Vorschau"];

const DEFAULT_ADDONS = {
  drinkingGame: { enabled: false, rules: "" },
  timeLimit: 0,
  equipment: "",
  handicap: "",
  teamSize: 2,
};

// ─── Bonus / Malus rule definitions ───────────────────────────────────────
const BONUS_RULES = [
  {
    key: "comebackPenalty",
    emoji: "↩️",
    label: "COMEBACK MALUS",
    desc: "Vorheriger Sieger nicht in Top 3 → −2 Punkte",
    badge: "−2 PT",
    badgeClass: "text-pink-400",
  },
  {
    key: "lastPlaceBonus",
    emoji: "🎯",
    label: "LAST PLACE BONUS",
    desc: "Letzter Platz in Top 3 → +1 Punkt",
    badge: "+1 PT",
    badgeClass: "text-green-400",
  },
  {
    key: "winStreakBonus",
    emoji: "🔥",
    label: "WIN STREAK BONUS",
    desc: "Zwei FFA-Siege in Folge → +1 Punkt",
    badge: "+1 PT",
    badgeClass: "text-green-400",
  },
  {
    key: "finalDoublePoints",
    emoji: "⭐",
    label: "FINAL DOUBLE POINTS",
    desc: "Letztes Spiel gibt doppelte Basispunkte",
    badge: "2×",
    badgeClass: "text-yellow-400",
  },
];

// ─── Step 1: Event Setup ───────────────────────────────────────────────────
function StepEventSetup({ data, onChange }) {
  return (
    <div className="space-y-6">
      {/* Olympic Name */}
      <div>
        <label className="label-upper">Olympic Name</label>
        <div className="relative">
          <input
            className="input-field pr-12"
            placeholder="z.B. Summer Gaming Olympics 2025"
            maxLength={60}
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-500 text-lg select-none pointer-events-none">
            👑
          </span>
        </div>
        <p className="field-hint">
          Wähle einen coolen Namen für deine Olympiade!
        </p>
      </div>

      {/* Max Players */}
      <div>
        <label className="label-upper">Max. Spieler</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-base select-none pointer-events-none">
            👥
          </span>
          <input
            type="number"
            className="input-field pl-11"
            min={2}
            max={50}
            value={data.maxPlayers}
            onChange={(e) =>
              onChange({
                maxPlayers: Math.max(2, Math.min(50, Number(e.target.value))),
              })
            }
          />
        </div>
        <p className="field-hint">
          Spieler können per Code beitreten. Min. 2, max. 50.
        </p>
      </div>

      {/* Scoring System */}
      <Select
        label={
          <span className="label-upper" style={{ marginBottom: 0 }}>
            Wertungssystem
          </span>
        }
        value={data.scoringMode}
        onChange={(val) => onChange({ scoringMode: val })}
        options={[
          {
            value: "linear",
            label: "Linear",
            description:
              "Jeder Platz gibt Punkte: 1. = n Pkt., letzter = 1 Pkt.",
          },
          {
            value: "top3",
            label: "Top 3 Only",
            description: "1.: 3 Pkt. · 2.: 2 Pkt. · 3.: 1 Pkt. · Rest: 0",
          },
          {
            value: "f1",
            label: "F1 Format",
            description: "10 · 8 · 6 · 5 · 4 · 3 · 2 · 1 Pkt.",
          },
        ]}
        description="Team-Spiele: das Gewinner-Team erhält die Hälfte der Max-Punkte."
      />

      {/* Tie-Breaker */}
      <Select
        label={
          <span className="label-upper" style={{ marginBottom: 0 }}>
            Tie-Breaker Regel
          </span>
        }
        value={data.tieRule}
        onChange={(val) => onChange({ tieRule: val })}
        options={[
          { value: "tiebreaker", label: "Tiebreaker Frage entscheidet" },
          { value: "shared_points", label: "Punkte werden aufgeteilt" },
        ]}
      />

      {/* Bonus / Malus Rules */}
      <div>
        <p className="label-upper">Optionale Bonus / Malus Regeln</p>
        <div className="space-y-2 mt-3">
          {BONUS_RULES.map(({ key, emoji, label, desc, badge, badgeClass }) => (
            <label key={key} className="checkbox-card">
              {/* Custom visual checkbox */}
              <div
                className={`checkbox-dot ${data.extraRules[key] ? "checked" : ""}`}
                aria-hidden="true"
              >
                {data.extraRules[key] && (
                  <svg
                    className="w-3 h-3 text-white"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={data.extraRules[key]}
                onChange={(e) =>
                  onChange({
                    extraRules: { ...data.extraRules, [key]: e.target.checked },
                  })
                }
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-black text-white/80 uppercase tracking-wide">
                  {emoji} {label}
                </span>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">
                  {desc}
                </p>
              </div>
              <span
                className={`text-xs font-black flex-shrink-0 ${badgeClass}`}
              >
                {badge}
              </span>
            </label>
          ))}

          {/* Host participates */}
          <label
            className="checkbox-card"
            style={{
              borderColor: data.hostParticipates
                ? "rgba(34,211,238,0.3)"
                : undefined,
              background: data.hostParticipates
                ? "rgba(34,211,238,0.05)"
                : undefined,
            }}
          >
            <div
              className={`checkbox-dot ${data.hostParticipates ? "checked-cyan" : ""}`}
              aria-hidden="true"
            >
              {data.hostParticipates && (
                <svg
                  className="w-3 h-3 text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={!!data.hostParticipates}
              onChange={(e) => onChange({ hostParticipates: e.target.checked })}
            />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-black text-white/80 uppercase tracking-wide">
                🎮 Host spielt mit
              </span>
              <p className="text-xs text-muted mt-0.5">
                Du nimmst als Spieler teil – dein Score zählt mit.
              </p>
            </div>
            <span className="text-xs font-semibold flex-shrink-0 text-cyan-400">
              Score zählt
            </span>
          </label>

          {data.hostParticipates && (
            <div className="ml-8">
              <Input
                label="Dein Spielername"
                placeholder="z.B. Alex"
                maxLength={30}
                value={data.hostPlayerName || ""}
                onChange={(e) => onChange({ hostPlayerName: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Preview Panel (right column on Step 1) ────────────────────────────────
function PreviewPanel({ data }) {
  const scoringLabels = {
    linear: "Linear",
    top3: "Top 3 Only",
    f1: "F1 Format",
  };
  const tieLabels = {
    tiebreaker: "Tiebreaker Frage entscheidet",
    shared_points: "Punkte aufteilen",
  };

  const activeRules = [
    data.extraRules?.comebackPenalty && {
      label: "Comeback Malus",
      badge: "−2 Punkte",
      cls: "text-pink-400",
    },
    data.extraRules?.lastPlaceBonus && {
      label: "Last Place Bonus",
      badge: "+1 Punkt",
      cls: "text-green-400",
    },
    data.extraRules?.winStreakBonus && {
      label: "Win Streak Bonus",
      badge: "+1 Punkt",
      cls: "text-green-400",
    },
    data.extraRules?.finalDoublePoints && {
      label: "Final Double Points",
      badge: "2× Basispunkte",
      cls: "text-yellow-400",
    },
    data.hostParticipates && {
      label: "Host spielt mit",
      badge: "Score zählt",
      cls: "text-cyan-400",
    },
  ].filter(Boolean);

  return (
    <div className="space-y-4 lg:sticky lg:top-20">
      {/* Main preview card */}
      <div className="panel-glass rounded-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <p
            className="font-black uppercase tracking-[0.2em] text-xs"
            style={{ color: "#ec4899" }}
          >
            Vorschau
          </p>
        </div>

        {/* Podium illustration */}
        <div
          className="relative mx-5 mt-4 mb-5 h-40 rounded-xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(236,72,153,0.08) 60%, rgba(34,211,238,0.06) 100%)",
            border: "1px solid rgba(139,92,246,0.18)",
          }}
        >
          {/* Ambient glow */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-20 rounded-full bg-pink-500/15 blur-2xl pointer-events-none" />
          {/* Podium blocks */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-3 px-10">
            {/* 2nd */}
            <div className="w-1/4 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-cyan-500/30 border border-cyan-500/40 mb-1" />
              <div
                className="w-full h-[52px] rounded-t-lg flex items-end justify-center pb-1.5"
                style={{
                  background:
                    "linear-gradient(to top, rgba(34,211,238,0.28), rgba(34,211,238,0.08))",
                  border: "1px solid rgba(34,211,238,0.22)",
                  borderBottom: "none",
                }}
              >
                <span className="text-cyan-400 font-black text-base">2</span>
              </div>
            </div>
            {/* 1st */}
            <div className="w-1/4 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-yellow-500/30 border border-yellow-500/40 mb-1 ring-2 ring-yellow-400/25" />
              <div
                className="w-full h-[72px] rounded-t-lg flex items-end justify-center pb-1.5"
                style={{
                  background:
                    "linear-gradient(to top, rgba(250,204,21,0.28), rgba(250,204,21,0.08))",
                  border: "1px solid rgba(250,204,21,0.22)",
                  borderBottom: "none",
                }}
              >
                <span className="text-yellow-400 font-black text-xl">1</span>
              </div>
            </div>
            {/* 3rd */}
            <div className="w-1/4 flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-purple-500/30 border border-purple-500/40 mb-1" />
              <div
                className="w-full h-[38px] rounded-t-lg flex items-end justify-center pb-1.5"
                style={{
                  background:
                    "linear-gradient(to top, rgba(139,92,246,0.28), rgba(139,92,246,0.08))",
                  border: "1px solid rgba(139,92,246,0.22)",
                  borderBottom: "none",
                }}
              >
                <span className="text-purple-400 font-black text-sm">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 pb-5 space-y-3.5">
          {[
            {
              icon: "👥",
              label: "Spieler",
              value: data.maxPlayers,
              cls: "text-white font-semibold",
            },
            {
              icon: "🏆",
              label: "Wertungssystem",
              value: scoringLabels[data.scoringMode] || "Linear",
              cls: "text-white font-semibold",
            },
            {
              icon: "⚔️",
              label: "Tie-Breaker",
              value: tieLabels[data.tieRule] || data.tieRule,
              cls: "text-white/80 text-xs",
            },
          ].map(({ icon, label, value, cls }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="text-base leading-none mt-0.5 flex-shrink-0">
                {icon}
              </span>
              <div className="min-w-0">
                <div className="text-xs text-muted leading-none mb-0.5">
                  {label}
                </div>
                <div className={`text-sm truncate ${cls}`}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active rules */}
      {activeRules.length > 0 && (
        <div className="panel-glass rounded-2xl p-5">
          <p
            className="font-black uppercase tracking-[0.2em] text-xs mb-3"
            style={{ color: "#ec4899" }}
          >
            Aktive Regeln
          </p>
          <div className="space-y-2.5">
            {activeRules.map((rule, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-white/70 text-sm">{rule.label}</span>
                <span className={`text-xs font-bold flex-shrink-0 ${rule.cls}`}>
                  {rule.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info box */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "rgba(34,211,238,0.04)",
          border: "1px solid rgba(34,211,238,0.14)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-cyan-400 text-sm">💡</span>
          <h4 className="text-cyan-400 text-xs font-black uppercase tracking-widest">
            So funktioniert's
          </h4>
        </div>
        <p className="text-white/45 text-xs leading-relaxed">
          Erstelle deine Lobby, wähle Regeln und lade deine Freunde ein. Sammelt
          Punkte, spielt verrückte Spiele und kürt am Ende den Champion!
        </p>
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
    addons: { ...DEFAULT_ADDONS },
  });
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

  function addGame() {
    const title = form.title.trim();
    if (!title) return;
    onChange([...games, { ...form, title, order: games.length }]);
    setForm({
      title: "",
      mode: "ffa",
      icon: "🎮",
      rules: "",
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
    <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
      {/* ── Left column: tabs + form/library ── */}
      <div className="space-y-4">
      {/* ── Tab switcher ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            key: "create",
            icon: "+",
            label: "Eigenes Spiel erstellen",
            sub: "Individuelle Regeln & Einstellungen",
            pencil: true,
          },
          {
            key: "library",
            icon: "⬡",
            label: "Aus Bibliothek wählen",
            sub: "Bewährte Spiele & Vorlagen",
          },
        ].map(({ key, label, sub }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="text-left p-4 rounded-2xl transition-all duration-200"
            style={
              tab === key
                ? {
                    background: "rgba(139,92,246,0.12)",
                    border: "1.5px solid rgba(139,92,246,0.55)",
                    boxShadow: "0 0 24px rgba(139,92,246,0.15)",
                  }
                : {
                    background: "rgba(255,255,255,0.03)",
                    border: "1.5px solid rgba(255,255,255,0.08)",
                  }
            }
          >
            <div
              className={`font-black text-sm mb-0.5 ${tab === key ? "text-white" : "text-muted"}`}
            >
              {key === "create" ? "＋ " : "🗂 "}
              {label} {key === "create" && "✏️"}
            </div>
            <div className="text-xs text-white/35">{sub}</div>
          </button>
        ))}
      </div>

      {/* ── Library tab: single panel, full-width in left column ── */}
      {tab === "library" && (
        <div
          className="rounded-2xl p-4 flex flex-col gap-4"
          style={{
            background: "rgba(10,12,30,0.95)",
            border: "1px solid rgba(139,92,246,0.22)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-purple-400">🗂</span>
            <h3 className="font-black text-white text-xs uppercase tracking-[0.15em]">
              Spielbibliothek
            </h3>
          </div>

            {/* Search */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">
                🔍
              </span>
              <input
                className="input-field pl-9 text-sm"
                placeholder="Spiele suchen…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Mode filter chips */}
            <div className="flex flex-wrap gap-2">
              {["Alle", "Team", "FFA"].map((f) => (
                <button
                  key={f}
                  className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                  style={{
                    background:
                      f === "Alle" ? "#ec4899" : "rgba(255,255,255,0.05)",
                    color: f === "Alle" ? "#fff" : "#b7bbcc",
                    border:
                      "1px solid " +
                      (f === "Alle" ? "transparent" : "rgba(255,255,255,0.08)"),
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {presetsLoading && (
              <p className="text-muted text-sm text-center py-6 animate-pulse">
                Lade Bibliothek…
              </p>
            )}
            {presetsError && (
              <p className="text-pink-400 text-sm text-center py-4">
                {presetsError}
              </p>
            )}
            {!presetsLoading &&
              filteredPresets.length === 0 &&
              !presetsError && (
                <p className="text-muted text-sm text-center py-6">
                  {search
                    ? `Keine Spiele für "${search}"`
                    : "Bibliothek ist leer — sei der Erste!"}
                </p>
              )}

            <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
              {filteredPresets.map((preset) => {
                const already =
                  addedIds.has(preset._id) ||
                  games.some((g) => g.title === preset.title);
                return (
                  <div
                    key={preset._id}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: "rgba(139,92,246,0.12)" }}
                    >
                      {preset.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm truncate">
                          {preset.title}
                        </span>
                        <span
                          className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded"
                          style={{
                            background:
                              preset.mode === "team"
                                ? "rgba(139,92,246,0.2)"
                                : "rgba(236,72,153,0.2)",
                            color:
                              preset.mode === "team" ? "#a78bfa" : "#f472b6",
                          }}
                        >
                          {preset.mode.toUpperCase()}
                        </span>
                      </div>
                      {preset.rules && (
                        <p className="text-xs text-muted mt-0.5 line-clamp-1">
                          {preset.rules}
                        </p>
                      )}
                      <p className="text-xs text-white/25 mt-0.5">
                        by {preset.createdByUsername}
                      </p>
                    </div>
                    <button
                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
                      style={
                        already
                          ? {
                              background: "rgba(34,197,94,0.15)",
                              color: "#4ade80",
                              cursor: "default",
                            }
                          : {
                              background: "rgba(236,72,153,0.15)",
                              border: "1px solid rgba(236,72,153,0.4)",
                              color: "#f472b6",
                            }
                      }
                      onClick={() => !already && addFromLibrary(preset)}
                      disabled={already}
                    >
                      {already ? "✓" : "+ Hinzufügen"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
      )}

      {/* ── Create tab ── */}
      {tab === "create" && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "rgba(10,12,30,0.97)",
            border: "1px solid rgba(139,92,246,0.28)",
            boxShadow: "0 0 30px rgba(139,92,246,0.08)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-400">✏️</span>
            <h3 className="font-black text-white text-xs uppercase tracking-[0.15em]">
              Spiel hinzufügen
            </h3>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Spieltitel"
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
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={
                  form.mode === m
                    ? {
                        background: "linear-gradient(90deg, #8b5cf6, #6d28d9)",
                        color: "#fff",
                        border: "1px solid rgba(139,92,246,0.5)",
                        boxShadow: "0 0 16px rgba(139,92,246,0.3)",
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.5)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }
                }
              >
                {m === "ffa" ? "⚔ FFA" : "👥 Teams"}
              </button>
            ))}
          </div>

          <textarea
            className="textarea-field h-24"
            placeholder="Regeln (optional, max 1000 Zeichen)"
            maxLength={1000}
            value={form.rules}
            onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
          />

          <button
            className="text-sm text-purple-light hover:text-purple transition-colors"
            onClick={() => setShowAddons((s) => !s)}
          >
            {showAddons
              ? "▲ Add-ons ausblenden"
              : "▼ Add-ons anzeigen (optional)"}
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
                🍺 Trinkspiel-Modus
              </label>
              {form.addons.drinkingGame.enabled && (
                <textarea
                  className="textarea-field h-16 text-sm"
                  placeholder="Trinkregeln…"
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
                  <label className="label">⏱ Zeitlimit (min, 0=∞)</label>
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
                    <label className="label">👥 Teamgröße</label>
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
                label="🛠 Benötigtes Equipment"
                placeholder="z.B. Controller, 2 TVs"
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
                label="⚖ Handicap-Regeln"
                placeholder="z.B. Bester Spieler nutzt Tastatur"
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
            + Spiel hinzufügen
          </button>
        </div>
      )}

      {/* end left column */}
      </div>

      {/* ── Right column: persistent selected games ── */}
      <div
        className="rounded-2xl p-4 flex flex-col gap-3 lg:sticky lg:top-6"
        style={{
          background: "rgba(10,12,30,0.97)",
          border: "1px solid rgba(236,72,153,0.28)",
          boxShadow: "0 0 24px rgba(236,72,153,0.07)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-pink-400">🎮</span>
            <h3 className="font-black text-white text-xs uppercase tracking-[0.15em]">
              Ausgewählte Spiele
            </h3>
          </div>
          {games.length > 0 && (
            <span
              className="text-xs font-black px-2 py-0.5 rounded-full"
              style={{ background: "#ec4899", color: "#fff" }}
            >
              {games.length}
            </span>
          )}
        </div>

        {games.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-10 text-center">
            <div>
              <div className="text-white/15 text-4xl mb-2">🎮</div>
              <p className="text-white/25 text-xs leading-relaxed">
                Hier erscheinen die Spiele deiner Olympiade.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto max-h-[540px] pr-0.5">
            {games.map((g, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 p-2.5 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "rgba(139,92,246,0.12)" }}
                >
                  {g.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-white text-sm truncate block">
                    {g.title}
                  </span>
                  <span
                    className="text-[10px] font-black uppercase"
                    style={{ color: g.mode === "team" ? "#a78bfa" : "#f472b6" }}
                  >
                    {g.mode.toUpperCase()}
                  </span>
                </div>
                <div className="flex gap-0.5 items-center shrink-0">
                  <button
                    className="text-white/25 hover:text-white/70 text-xs px-1 py-0.5 rounded disabled:opacity-20"
                    onClick={() => moveGame(i, -1)}
                    disabled={i === 0}
                  >▲</button>
                  <button
                    className="text-white/25 hover:text-white/70 text-xs px-1 py-0.5 rounded disabled:opacity-20"
                    onClick={() => moveGame(i, 1)}
                    disabled={i === games.length - 1}
                  >▼</button>
                  <button
                    className="text-pink-400/60 hover:text-pink-400 text-base leading-none ml-0.5 px-1"
                    onClick={() => onChange(games.filter((_, idx) => idx !== i))}
                  >×</button>
                </div>
              </div>
            ))}
          </div>
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
  const tieLabels = {
    tiebreaker: "Tiebreaker Frage entscheidet",
    shared_points: "Punkte aufteilen",
  };

  const activeRuleLabels = {
    comebackPenalty: "🔥 WinStreak Bonus aktiviert",
    lastPlaceBonus: "📈 Last Place Bonus aktiviert",
    winStreakBonus: "🔥 WinStreak Bonus aktiviert",
    finalDoublePoints: "⭐ Final Double Points aktiviert",
  };

  const activeRules = Object.entries(data.extraRules)
    .filter(([, v]) => v)
    .map(([k]) => activeRuleLabels[k] || k);

  const panelStyle = {
    background: "rgba(10,12,30,0.97)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
  };

  return (
    <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-4">
      {/* ── Left column ── */}
      <div className="space-y-3">
        {/* Deine Lobby */}
        <div style={panelStyle} className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-purple-400">👑</span>
            <h3 className="font-black text-white text-xs uppercase tracking-[0.18em]">
              Deine Lobby
            </h3>
          </div>

          <p className="text-white text-xl font-black mb-4">
            {data.name || "—"}
          </p>

          <div className="space-y-3">
            {[
              { icon: "👥", label: "Max. Spieler", value: data.maxPlayers },
              {
                icon: "🏆",
                label: "Wertungssystem",
                value: scoringLabels[data.scoringMode] || "Linear",
              },
              {
                icon: "⚔️",
                label: "Tie-Breaker",
                value: tieLabels[data.tieRule] || data.tieRule,
              },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-base flex-shrink-0">{icon}</span>
                <div>
                  <div className="text-xs text-white/45">{label}</div>
                  <div className="text-white text-sm font-semibold">
                    {value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {activeRules.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeRules.map((r) => (
                <span
                  key={r}
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    background: "rgba(139,92,246,0.18)",
                    border: "1px solid rgba(139,92,246,0.35)",
                    color: "#a78bfa",
                  }}
                >
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Spiele */}
        <div style={panelStyle} className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-purple-400">🎮</span>
            <h3 className="font-black text-white text-xs uppercase tracking-[0.18em]">
              Spiele ({data.games.length})
            </h3>
          </div>

          {data.games.length === 0 ? (
            <p className="text-muted text-sm py-2">
              Noch keine Spiele hinzugefügt.
            </p>
          ) : (
            <div className="space-y-3">
              {data.games.map((g, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-white/30 text-xs w-4 flex-shrink-0">
                    {i + 1}.
                  </span>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "rgba(139,92,246,0.12)" }}
                  >
                    {g.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-semibold text-sm truncate">
                      {g.title}
                    </div>
                    {g.rules && (
                      <div className="text-xs text-muted line-clamp-1">
                        {g.rules}
                      </div>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-black uppercase ml-auto flex-shrink-0 px-1.5 py-0.5 rounded"
                    style={{
                      background:
                        g.mode === "team"
                          ? "rgba(139,92,246,0.2)"
                          : "rgba(236,72,153,0.2)",
                      color: g.mode === "team" ? "#a78bfa" : "#f472b6",
                    }}
                  >
                    {g.mode.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Room code info */}
        <div
          style={{
            background: "rgba(34,211,238,0.04)",
            border: "1px solid rgba(34,211,238,0.18)",
            borderRadius: "16px",
          }}
          className="p-5"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-cyan-400">👥</span>
            <h4 className="font-black text-cyan-400 text-xs uppercase tracking-[0.15em]">
              Spieler treten per Room Code bei
            </h4>
          </div>
          <p className="text-white/45 text-sm leading-relaxed">
            Nach dem Start erhältst du einen teilbaren Room Code. Bis zu{" "}
            {data.maxPlayers} Spieler können der Lobby beitreten, bevor das
            Event startet.
          </p>
        </div>
      </div>

      {/* ── Right column: Vorschau ── */}
      <div
        style={{
          background: "rgba(10,12,30,0.97)",
          border: "1px solid rgba(236,72,153,0.2)",
          borderRadius: "16px",
        }}
        className="p-5 flex flex-col gap-5"
      >
        <div className="flex items-center gap-2">
          <span className="text-pink-400">👁</span>
          <h3 className="font-black text-white text-xs uppercase tracking-[0.18em]">
            Vorschau
          </h3>
        </div>

        {/* Podium illustration */}
        <div
          className="relative rounded-xl overflow-hidden flex-1 min-h-[180px]"
          style={{
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08), rgba(34,211,238,0.06))",
            border: "1px solid rgba(139,92,246,0.15)",
          }}
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-1/4 w-32 h-20 rounded-full bg-pink-500/15 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-24 h-16 rounded-full bg-purple-500/15 blur-3xl" />
          </div>
          {/* Podium */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-2 px-8">
            {/* 2nd */}
            <div className="w-1/4 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 mb-1 flex items-center justify-center text-white font-black text-sm border-2 border-white/10">
                2
              </div>
              <div
                className="w-full h-[60px] rounded-t-xl flex items-end justify-center pb-1.5"
                style={{
                  background:
                    "linear-gradient(to top, rgba(34,211,238,0.3), rgba(34,211,238,0.05))",
                  border: "1px solid rgba(34,211,238,0.2)",
                  borderBottom: "none",
                }}
              >
                <span className="text-cyan-400 font-black text-lg">2</span>
              </div>
            </div>
            {/* 1st */}
            <div className="w-1/4 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 mb-1 flex items-center justify-center text-white font-black text-lg border-2 border-white/20 ring-2 ring-yellow-400/30">
                1
              </div>
              <div
                className="w-full h-[88px] rounded-t-xl flex items-end justify-center pb-1.5"
                style={{
                  background:
                    "linear-gradient(to top, rgba(250,204,21,0.3), rgba(250,204,21,0.05))",
                  border: "1px solid rgba(250,204,21,0.25)",
                  borderBottom: "none",
                }}
              >
                <span className="text-yellow-400 font-black text-2xl">1</span>
              </div>
            </div>
            {/* 3rd */}
            <div className="w-1/4 flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 mb-1 flex items-center justify-center text-white font-black text-sm border-2 border-white/10">
                3
              </div>
              <div
                className="w-full h-[44px] rounded-t-xl flex items-end justify-center pb-1.5"
                style={{
                  background:
                    "linear-gradient(to top, rgba(139,92,246,0.3), rgba(139,92,246,0.05))",
                  border: "1px solid rgba(139,92,246,0.2)",
                  borderBottom: "none",
                }}
              >
                <span className="text-purple-400 font-black">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          {[
            { icon: "👥", label: "Max. Spieler", value: data.maxPlayers },
            {
              icon: "🏆",
              label: "Wertungssystem",
              value: scoringLabels[data.scoringMode] || "Linear",
            },
            {
              icon: "⚔️",
              label: "Tie-Breaker",
              value: tieLabels[data.tieRule] || data.tieRule,
            },
            { icon: "🎮", label: "Spiele", value: data.games.length },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-base flex-shrink-0">{icon}</span>
              <div>
                <div className="text-xs text-white/40">{label}</div>
                <div className="text-white font-semibold text-sm">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
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
          <h2 className="font-bold text-white mb-1">Anmeldung erforderlich</h2>
          <p className="text-sm text-muted mb-5">
            Du benötigst ein Konto, um Olympics zu erstellen
          </p>
          <button
            className="btn-primary w-full"
            onClick={() => setShowAuthModal(true)}
          >
            Anmelden / Registrieren
          </button>
        </GlassCard>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </div>
    );
  }

  if (fetchingDraft) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted animate-pulse">Lade Entwurf…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* ── Page header ── */}
      <div className="relative flex items-center justify-center px-4 pt-8 pb-6">
        <button
          className="absolute left-4 btn-ghost !px-3 !py-2 text-sm"
          onClick={() => navigate(isEditMode ? "/profile" : "/")}
        >
          ← Zurück
        </button>
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="text-2xl">🏅</span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              <span className="text-white">LOBBY </span>
              <span
                style={{
                  background: "linear-gradient(90deg, #ec4899, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {isEditMode ? "BEARBEITEN" : "ERSTELLEN"}
              </span>
            </h1>
          </div>
          <p className="text-muted text-sm">
            {isEditMode
              ? `Bearbeite: ${eventData.name || editCode}`
              : "Erstelle deine Olympiade und lade deine Freunde ein!"}
          </p>
        </div>
      </div>

      {/* ── Step progress ── */}
      <div className="flex items-start justify-center gap-0 px-4 mb-8">
        {STEPS.map((label, i) => (
          <Fragment key={label}>
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all duration-300 ${
                  i === step
                    ? "border-pink-500 bg-pink-500/20 text-white"
                    : i < step
                      ? "border-purple-500/60 bg-purple-500/20 text-purple-400"
                      : "border-white/15 bg-white/[0.04] text-muted"
                }`}
                style={
                  i === step
                    ? { boxShadow: "0 0 18px rgba(236,72,153,0.4)" }
                    : undefined
                }
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs font-semibold whitespace-nowrap ${i === step ? "text-white" : "text-muted"}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-16 sm:w-28 h-px mt-[18px] transition-colors duration-300 ${
                  i < step ? "bg-purple-500/50" : "bg-white/10"
                }`}
              />
            )}
          </Fragment>
        ))}
      </div>

      {/* ── Step content ── */}
      {step === 0 && (
        <div className="max-w-5xl mx-auto px-4 grid lg:grid-cols-2 gap-5">
          {/* Form panel */}
          <div className="panel-glass rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <span className="text-pink-500">📅</span>
              <h2 className="text-sm font-black uppercase tracking-[0.15em] text-white">
                Event Setup
              </h2>
            </div>
            <StepEventSetup
              data={eventData}
              onChange={(patch) => setEventData((d) => ({ ...d, ...patch }))}
            />
          </div>
          {/* Preview panel */}
          <PreviewPanel data={eventData} />
        </div>
      )}

      {step === 1 && (
        <div className="max-w-5xl mx-auto px-4">
          <StepGames games={games} onChange={setGames} />
        </div>
      )}

      {step === 2 && (
        <div className="max-w-5xl mx-auto px-4">
          <StepPreview data={{ ...eventData, games }} />
        </div>
      )}

      {apiError && (
        <div className="max-w-5xl mx-auto mt-4 px-4">
          <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 text-sm">
            {apiError}
          </div>
        </div>
      )}

      {/* ── Sticky bottom nav ── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pt-6 pb-4 z-10"
        style={{
          background:
            "linear-gradient(to top, rgba(7,7,20,0.97) 55%, transparent)",
        }}
      >
        <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto mb-3">
          {step > 0 ? (
            <button
              className="btn-secondary !px-6"
              onClick={() => setStep((s) => s - 1)}
            >
              ← Zurück
            </button>
          ) : (
            <div />
          )}

          {/* Center: game count for step 2 */}
          {step === 1 && (
            <span className="text-white/40 text-sm font-semibold">
              {games.length}/20 Spiele ausgewählt
            </span>
          )}

          {step < STEPS.length - 1 ? (
            <button
              className="btn-primary !px-14 !py-3.5 !rounded-2xl font-black tracking-widest text-base"
              style={
                canProceed()
                  ? { boxShadow: "0 0 40px rgba(236,72,153,0.4)" }
                  : undefined
              }
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
            >
              WEITER →
            </button>
          ) : (
            <button
              className="btn-primary !px-14 !py-3.5 !rounded-2xl font-black text-base"
              style={
                canProceed() && !loading
                  ? { boxShadow: "0 0 40px rgba(236,72,153,0.4)" }
                  : undefined
              }
              onClick={save}
              disabled={loading || !canProceed()}
            >
              {loading
                ? "Speichern…"
                : isEditMode
                  ? "💾 SPEICHERN"
                  : "Lobby erstellen ✓"}
            </button>
          )}
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-pink-500" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

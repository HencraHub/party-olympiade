import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import api from "../api/client.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import Input from "../components/ui/Input.jsx";

const DEFAULT_ADDONS = {
  drinkingGame: { enabled: false, rules: "" },
  timeLimit: 0,
  equipment: "",
  handicap: "",
  teamSize: 2,
};

const BLANK_FORM = {
  title: "",
  mode: "ffa",
  icon: "🎮",
  rules: "",
  addons: { ...DEFAULT_ADDONS },
};

export default function GameLibraryPage() {
  const { user } = useAuthStore();

  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Submit form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Confirm delete
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchPresets();
  }, []);

  async function fetchPresets() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/game-presets");
      setPresets(data);
    } catch {
      setError("Failed to load library. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      setSubmitError("Title is required");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const { data } = await api.post("/game-presets", form);
      setPresets((prev) =>
        [...prev, data].sort((a, b) => a.title.localeCompare(b.title)),
      );
      setForm({ ...BLANK_FORM });
      setShowForm(false);
    } catch (err) {
      setSubmitError(err.response?.data?.error || "Failed to submit preset");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setDeleting(id);
    setConfirmDelete(null);
    try {
      await api.delete(`/game-presets/${id}`);
      setPresets((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  // Group alphabetically
  const filtered = presets.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.createdByUsername.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = filtered.reduce((acc, p) => {
    const letter = p.title[0]?.toUpperCase() || "#";
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(p);
    return acc;
  }, {});
  const letters = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-white">📚 Game Library</h1>
            <p className="text-sm text-muted mt-1">
              Community game presets — pick any into your Olympic
            </p>
          </div>
          {user ? (
            <button
              className="btn-primary !py-2 !px-4 text-sm shrink-0"
              onClick={() => setShowForm((s) => !s)}
            >
              {showForm ? "✕ Cancel" : "+ Submit Preset"}
            </button>
          ) : (
            <p className="text-xs text-muted bg-white/5 rounded-xl px-3 py-2">
              Sign in to submit presets
            </p>
          )}
        </div>

        {/* Submit form */}
        {showForm && user && (
          <GlassCard className="space-y-4 border-purple-500/30">
            <h2 className="font-bold text-white">New Preset</h2>

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
              className="textarea-field h-28"
              placeholder="Rules / description (optional, max 1000 chars)"
              maxLength={1000}
              value={form.rules}
              onChange={(e) =>
                setForm((f) => ({ ...f, rules: e.target.value }))
              }
            />

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
              <div>
                <label className="label">🛠 Equipment</label>
                <input
                  className="input-field"
                  placeholder="e.g. Controller"
                  maxLength={200}
                  value={form.addons.equipment}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      addons: { ...f.addons, equipment: e.target.value },
                    }))
                  }
                />
              </div>
            </div>

            {submitError && (
              <p className="text-pink-400 text-sm">{submitError}</p>
            )}

            <button
              className="btn-primary w-full"
              onClick={handleSubmit}
              disabled={submitting || !form.title.trim()}
            >
              {submitting ? "Submitting…" : "📤 Submit to Library"}
            </button>
          </GlassCard>
        )}

        {/* Search */}
        <input
          className="input-field w-full"
          placeholder="🔍 Search games or creators…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading && (
          <p className="text-muted text-sm text-center py-10 animate-pulse">
            Loading library…
          </p>
        )}
        {error && (
          <p className="text-pink-400 text-sm bg-pink-500/10 border border-pink-500/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        {!loading && filtered.length === 0 && !error && (
          <GlassCard className="text-center py-10">
            <p className="text-4xl mb-3">🎮</p>
            <p className="text-white font-semibold mb-1">
              {search ? `No results for "${search}"` : "Library is empty"}
            </p>
            {!search && user && (
              <p className="text-sm text-muted">
                Be the first to submit a game preset!
              </p>
            )}
          </GlassCard>
        )}

        {/* Alphabetical groups */}
        {!loading &&
          letters.map((letter) => (
            <div key={letter}>
              {/* Letter header */}
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-xl font-black w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                  }}
                >
                  {letter}
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="space-y-2">
                {grouped[letter].map((preset) => (
                  <GlassCard
                    key={preset._id}
                    className="hover:border-white/15 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl mt-0.5 shrink-0">
                        {preset.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="font-bold text-white">
                            {preset.title}
                          </h3>
                          <span
                            className={`badge text-xs px-2 py-0.5 rounded-full ${
                              preset.mode === "ffa"
                                ? "bg-cyan-500/20 text-cyan-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {preset.mode === "ffa" ? "⚔️ FFA" : "👥 Teams"}
                          </span>
                          {preset.addons?.drinkingGame?.enabled && (
                            <span className="badge text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                              🍺 Drinking
                            </span>
                          )}
                        </div>
                        {preset.rules && (
                          <p className="text-sm text-muted line-clamp-2 mb-1">
                            {preset.rules}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-white/30 flex-wrap">
                          <span>by {preset.createdByUsername}</span>
                          {preset.addons?.equipment && (
                            <span>🛠 {preset.addons.equipment}</span>
                          )}
                          {preset.addons?.timeLimit > 0 && (
                            <span>⏱ {preset.addons.timeLimit} min</span>
                          )}
                        </div>
                      </div>

                      {/* Delete own preset */}
                      {user && String(preset.createdBy) === user.id && (
                        <div className="shrink-0">
                          {confirmDelete === preset._id ? (
                            <div className="flex flex-col gap-1">
                              <button
                                className="text-xs px-2 py-1 rounded-lg bg-pink-500/20 text-pink-400 hover:bg-pink-500/30"
                                onClick={() => handleDelete(preset._id)}
                                disabled={deleting === preset._id}
                              >
                                {deleting === preset._id ? "…" : "Delete"}
                              </button>
                              <button
                                className="text-xs px-2 py-1 rounded-lg bg-white/5 text-muted hover:bg-white/10"
                                onClick={() => setConfirmDelete(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn-ghost text-xs text-pink-400 hover:bg-pink-500/10 !p-2"
                              onClick={() => setConfirmDelete(preset._id)}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          ))}

        {/* Stats footer */}
        {!loading && presets.length > 0 && (
          <p className="text-center text-xs text-white/20 pb-4">
            {presets.length} preset{presets.length !== 1 ? "s" : ""} in the
            library
          </p>
        )}
      </div>
    </div>
  );
}

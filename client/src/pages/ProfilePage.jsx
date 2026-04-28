import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import api from "../api/client.js";
import GlassCard from "../components/ui/GlassCard.jsx";

const STATUS_STYLES = {
  draft: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  lobby: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
  active: "bg-green-500/20 text-green-400 border border-green-500/30",
  finished: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
};

const STATUS_LABEL = {
  draft: "✏️ Draft",
  lobby: "⏳ Lobby",
  active: "▶️ Active",
  finished: "🏁 Finished",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [tab, setTab] = useState("mine"); // "mine" | "participated"
  const [olympics, setOlympics] = useState([]);
  const [participated, setParticipated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [participatedLoading, setParticipatedLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(""); // ephemeral error toast
  const [deleting, setDeleting] = useState(null);
  const [launching, setLaunching] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // code to confirm

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    fetchOlympics();
    fetchParticipated();
  }, [user]); // eslint-disable-line

  async function fetchOlympics() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/olympics/mine");
      setOlympics(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load your Olympics");
    } finally {
      setLoading(false);
    }
  }

  async function fetchParticipated() {
    setParticipatedLoading(true);
    try {
      const { data } = await api.get("/olympics/participated");
      setParticipated(data);
    } catch {
      // Silently ignore — feature is optional
    } finally {
      setParticipatedLoading(false);
    }
  }

  async function handleDelete(code) {
    setDeleting(code);
    setConfirmDelete(null);
    try {
      await api.delete(`/olympics/${code}`);
      setOlympics((prev) => prev.filter((o) => o.code !== code));
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  async function handleLaunch(code) {
    setLaunching(code);
    try {
      const { data } = await api.post(`/olympics/${code}/launch`);
      localStorage.setItem(`hostToken_${data.code}`, data.hostToken);
      navigate(`/room/${data.code}/host`);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to launch");
      setLaunching(null);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen px-4 py-10">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-pink-600/90 backdrop-blur-sm text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl border border-pink-400/30">
            ⚠ {toast}
          </div>
        </div>
      )}
      <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
        {/* Profile card */}
        <GlassCard>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black shrink-0"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white">{user.username}</h1>
              <p className="text-sm text-muted truncate">{user.email}</p>
            </div>
            <button
              className="btn-ghost text-sm text-pink-400 hover:bg-pink-500/10 shrink-0"
              onClick={logout}
            >
              Sign out
            </button>
          </div>
        </GlassCard>

        {/* Tab switcher */}
        <div className="flex gap-1 glass rounded-xl p-1">
          {[
            { key: "mine", label: "🏅 My Olympics" },
            { key: "participated", label: "🎮 Participated" },
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
              {key === "participated" && participated.length > 0 && (
                <span className="ml-1.5 text-xs bg-purple-500/40 text-purple-200 px-1.5 py-0.5 rounded-full">
                  {participated.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── My Olympics tab ── */}
        {tab === "mine" && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white text-lg">My Olympics</h2>
              <button
                className="btn-primary !py-1.5 !px-4 text-sm"
                onClick={() => navigate("/create")}
              >
                + New Olympic
              </button>
            </div>

            {loading && (
              <p className="text-muted text-sm text-center py-10 animate-pulse">
                Loading…
              </p>
            )}
            {error && (
              <p className="text-pink-400 text-sm bg-pink-500/10 border border-pink-500/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            {!loading && olympics.length === 0 && !error && (
              <GlassCard className="text-center py-10">
                <p className="text-4xl mb-3">🏅</p>
                <p className="text-white font-semibold mb-1">No Olympics yet</p>
                <p className="text-sm text-muted mb-5">
                  Create your first one to get started
                </p>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/create")}
                >
                  Create Olympic
                </button>
              </GlassCard>
            )}

            <div className="space-y-3">
              {olympics.map((o) => (
                <GlassCard
                  key={o.code}
                  className="hover:border-white/15 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <h3 className="font-bold text-white truncate">
                          {o.name}
                        </h3>
                        <span
                          className={`badge text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[o.status] || ""}`}
                        >
                          {STATUS_LABEL[o.status] || o.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        <span className="font-mono text-white/60">
                          {o.code}
                        </span>
                        {" · "}
                        {o.games.length} game{o.games.length !== 1 ? "s" : ""}
                        {" · "}
                        {o.participants.length}/{o.maxPlayers} players
                        {" · "}
                        {new Date(o.createdAt).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {o.status === "draft" && (
                        <>
                          <button
                            className="btn-ghost text-xs"
                            onClick={() => navigate(`/edit/${o.code}`)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn-primary !py-1 !px-3 text-xs"
                            onClick={() => handleLaunch(o.code)}
                            disabled={
                              launching === o.code || o.games.length === 0
                            }
                            title={
                              o.games.length === 0
                                ? "Add at least one game first"
                                : ""
                            }
                          >
                            {launching === o.code ? "Launching…" : "🚀 Launch"}
                          </button>
                        </>
                      )}
                      {(o.status === "lobby" || o.status === "active") && (
                        <button
                          className="btn-primary !py-1 !px-3 text-xs"
                          onClick={() => navigate(`/room/${o.code}/host`)}
                        >
                          Open Room
                        </button>
                      )}
                      {o.status === "finished" && (
                        <button
                          className="btn-secondary !py-1 !px-3 text-xs"
                          onClick={() => navigate(`/room/${o.code}/winner`)}
                        >
                          🏆 Results
                        </button>
                      )}

                      {/* Delete */}
                      {confirmDelete === o.code ? (
                        <div className="flex items-center gap-1">
                          <button
                            className="text-xs px-2 py-1 rounded-lg bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-colors"
                            onClick={() => handleDelete(o.code)}
                            disabled={deleting === o.code}
                          >
                            {deleting === o.code ? "…" : "Confirm"}
                          </button>
                          <button
                            className="text-xs px-2 py-1 rounded-lg bg-white/5 text-muted hover:bg-white/10 transition-colors"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-ghost text-xs text-pink-400 hover:bg-pink-500/10 !p-2"
                          onClick={() => setConfirmDelete(o.code)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </>
        )}

        {/* ── Participated tab ── */}
        {tab === "participated" && (
          <>
            {participatedLoading && (
              <p className="text-muted text-sm text-center py-10 animate-pulse">
                Loading…
              </p>
            )}

            {!participatedLoading && participated.length === 0 && (
              <GlassCard className="text-center py-10">
                <p className="text-4xl mb-3">🎮</p>
                <p className="text-white font-semibold mb-1">No history yet</p>
                <p className="text-sm text-muted">
                  Join an Olympic while logged in to track your results here.
                </p>
              </GlassCard>
            )}

            <div className="space-y-3">
              {participated.map((o) => {
                const lb = o.finalLeaderboard || [];
                // Find my participant entry (match by userId first, then by name)
                const myParticipant = o.participants.find(
                  (p) => String(p.userId) === user.id,
                );
                const myEntry = myParticipant
                  ? lb.find((e) => e.name === myParticipant.name)
                  : null;
                const myRank = myEntry ? lb.indexOf(myEntry) + 1 : null;
                const rankEmoji =
                  myRank === 1
                    ? "🥇"
                    : myRank === 2
                      ? "🥈"
                      : myRank === 3
                        ? "🥉"
                        : myRank
                          ? `#${myRank}`
                          : null;

                return (
                  <GlassCard
                    key={o.code}
                    className="hover:border-white/15 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-1.5">
                          <h3 className="font-bold text-white truncate">
                            {o.name}
                          </h3>
                          <span
                            className={`badge text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[o.status] || ""}`}
                          >
                            {STATUS_LABEL[o.status] || o.status}
                          </span>
                          {rankEmoji && (
                            <span className="text-xs font-bold text-yellow-400">
                              {rankEmoji}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted">
                          <span className="font-mono text-white/60">
                            {o.code}
                          </span>
                          {" · "}
                          {o.games.length} game{o.games.length !== 1 ? "s" : ""}
                          {" · "}
                          {o.participants.length} players
                          {myEntry && o.scoringEnabled !== false && (
                            <>
                              {" "}
                              ·{" "}
                              <span className="text-purple-300">
                                {myEntry.total} pts · {myEntry.wins} win
                                {myEntry.wins !== 1 ? "s" : ""}
                              </span>
                            </>
                          )}
                          {" · "}
                          {new Date(o.updatedAt).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      {o.status === "finished" && (
                        <button
                          className="btn-secondary !py-1 !px-3 text-xs shrink-0"
                          onClick={() => navigate(`/room/${o.code}/winner`)}
                        >
                          🏆 Results
                        </button>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

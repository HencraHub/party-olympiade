import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import api from "../api/client.js";
import GlassCard from "../components/ui/GlassCard.jsx";
import { AVATAR_GRADIENTS } from "../components/Header.jsx";
import {
  Pencil, Save, Trash2, Trophy, Crown, Gamepad2,
  ChevronDown, ChevronUp, AlertTriangle, ExternalLink,
  Medal, Check, X,
} from "lucide-react";

const STATUS_STYLES = {
  draft: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  lobby: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
  active: "bg-green-500/20 text-green-400 border border-green-500/30",
  finished: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
};

const STATUS_LABEL = {
  draft: "Draft",
  lobby: "Lobby",
  active: "Aktiv",
  finished: "Beendet",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuthStore();

  const [olympics, setOlympics] = useState([]);
  const [participated, setParticipated] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState("");
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [selectedColor, setSelectedColor] = useState(user?.avatarColor ?? 0);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  useEffect(() => {
    if (!user) { navigate("/"); return; }
    setSelectedColor(user.avatarColor ?? 0);
    Promise.all([
      api.get("/olympics/mine").then(({ data }) => setOlympics(data)).catch(() => {}),
      api.get("/olympics/participated").then(({ data }) => setParticipated(data)).catch(() => {}),
    ]).finally(() => setDataLoading(false));
  }, [user]); // eslint-disable-line

  // Active/lobby — both hosted and participated
  const activeOlympics = useMemo(() => {
    const hosted = olympics
      .filter((o) => o.status === "lobby" || o.status === "active")
      .map((o) => ({ ...o, role: "host" }));
    const joined = participated
      .filter((o) => o.status === "lobby" || o.status === "active")
      .map((o) => ({ ...o, role: "participant" }));
    return [...hosted, ...joined];
  }, [olympics, participated]);

  // Finished history only
  const history = useMemo(() => {
    const hosted = olympics.filter((o) => o.status === "finished").map((o) => ({ ...o, role: "host" }));
    const joined = participated.filter((o) => o.status === "finished").map((o) => ({ ...o, role: "participant" }));
    return [...hosted, ...joined].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    );
  }, [olympics, participated]);

  const historyToShow = historyExpanded ? history : history.slice(0, 3);

  async function saveProfile() {
    setProfileError("");
    setSavingProfile(true);
    try {
      const changes = {};
      if (editingName && nameInput.trim() && nameInput.trim() !== user.username) {
        changes.username = nameInput.trim();
      }
      if (selectedColor !== (user.avatarColor ?? 0)) {
        changes.avatarColor = selectedColor;
      }
      if (Object.keys(changes).length > 0) {
        await updateProfile(changes);
      }
      setEditingName(false);
    } catch (err) {
      setProfileError(err.response?.data?.error || "Speichern fehlgeschlagen");
    } finally {
      setSavingProfile(false);
    }
  }

  function startEditName() {
    setNameInput(user.username);
    setEditingName(true);
    setProfileError("");
  }

  function cancelEdit() {
    setEditingName(false);
    setSelectedColor(user.avatarColor ?? 0);
    setProfileError("");
  }

  async function handleDelete(code) {
    setDeleting(code);
    setConfirmDelete(null);
    try {
      await api.delete(`/olympics/${code}`);
      setOlympics((prev) => prev.filter((o) => o.code !== code));
    } catch (err) {
      showToast(err.response?.data?.error || "Löschen fehlgeschlagen");
    } finally {
      setDeleting(null);
    }
  }

  if (!user) return null;

  const hasChanges =
    selectedColor !== (user.avatarColor ?? 0) ||
    (editingName && nameInput.trim() !== user.username && nameInput.trim().length >= 2);

  return (
    <div className="min-h-screen px-4 py-10">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-pink-600/90 backdrop-blur-sm text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl border border-pink-400/30 flex items-center gap-2">
            <AlertTriangle size={14} />
            {toast}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">

        {/* Profile card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(10,12,30,0.97)",
            border: "1px solid rgba(139,92,246,0.3)",
            boxShadow: "0 0 40px rgba(139,92,246,0.08)",
          }}
        >
          <div className="flex items-start gap-5">
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black"
                style={{ background: AVATAR_GRADIENTS[selectedColor] }}
              >
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center" style={{ maxWidth: 92 }}>
                {AVATAR_GRADIENTS.map((g, i) => (
                  <button
                    key={i}
                    title={`Farbe ${i + 1}`}
                    onClick={() => setSelectedColor(i)}
                    className="w-5 h-5 rounded-full transition-all"
                    style={{
                      background: g,
                      outline: selectedColor === i ? "2px solid white" : "2px solid transparent",
                      outlineOffset: 1,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
              {editingName ? (
                <input
                  className="w-full bg-white/5 border border-purple-500/40 rounded-xl px-3 py-2 text-white font-bold text-lg focus:outline-none focus:border-purple-400 mb-1"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={30}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveProfile();
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-white">{user.username}</h1>
                  <button
                    onClick={startEditName}
                    className="text-white/30 hover:text-white/70 transition-colors"
                    title="Name bearbeiten"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              )}
              <p className="text-sm text-white/40 truncate mb-4">{user.email}</p>

              {profileError && (
                <p className="text-xs text-pink-400 mb-3">{profileError}</p>
              )}

              <div className="flex items-center gap-2">
                {hasChanges ? (
                  <>
                    <button
                      className="btn-primary !py-1.5 !px-4 text-sm flex items-center gap-1.5"
                      onClick={saveProfile}
                      disabled={savingProfile}
                    >
                      <Save size={13} />
                      {savingProfile ? "Speichern…" : "Speichern"}
                    </button>
                    <button
                      className="btn-ghost !py-1.5 !px-3 text-sm text-white/50"
                      onClick={cancelEdit}
                      disabled={savingProfile}
                    >
                      Abbrechen
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-ghost text-xs text-pink-400 hover:bg-pink-500/10"
                    onClick={logout}
                  >
                    Abmelden
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Active Olympics — shown only when in an active/lobby olympic */}
        {activeOlympics.length > 0 && (
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.3)",
              boxShadow: "0 0 24px rgba(34,197,94,0.06)",
            }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-400 mb-3">
              Aktive Olympiaden
            </p>
            {activeOlympics.map((o) => (
              <div
                key={o.code + o.role}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{o.name}</p>
                  <p className="text-xs text-green-400/70">
                    <span className="font-mono">{o.code}</span>
                    {" · "}
                    {o.status === "lobby" ? "Lobby" : "Läuft"}
                    {" · "}
                    {o.participants.length} Spieler
                    {o.role === "participant" && (
                      <span className="ml-1 text-green-400/50">(Teilnehmer)</span>
                    )}
                  </p>
                </div>
                <button
                  className="flex items-center gap-1.5 text-xs font-semibold shrink-0 px-3 py-1.5 rounded-xl transition-colors"
                  style={{ background: "rgba(34,197,94,0.25)", border: "1px solid rgba(34,197,94,0.5)", color: "#4ade80" }}
                  onClick={() => navigate(o.role === "host" ? `/room/${o.code}/host` : `/room/${o.code}`)}
                >
                  <ExternalLink size={11} />
                  Beitreten
                </button>
              </div>
            ))}
          </div>
        )}

        {/* History — finished olympics only */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(10,12,30,0.97)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-white text-sm uppercase tracking-wider">Verlauf</h2>
            <button
              className="btn-primary !py-1.5 !px-4 text-sm"
              onClick={() => navigate("/create")}
            >
              + Neue Olympiade
            </button>
          </div>

          {dataLoading && (
            <p className="text-muted text-sm text-center py-8 animate-pulse">Laden…</p>
          )}

          {!dataLoading && history.length === 0 && (
            <div className="text-center py-8">
              <Medal size={36} className="mx-auto mb-2 text-white/20" />
              <p className="text-white/50 text-sm">Noch keine abgeschlossenen Olympiaden</p>
            </div>
          )}

          <div className="space-y-2">
            {historyToShow.map((o) => {
              const isHost = o.role === "host";
              const lb = o.finalLeaderboard || [];
              const myParticipant = !isHost
                ? o.participants.find((p) => String(p.userId) === user.id)
                : null;
              const myEntry = myParticipant ? lb.find((e) => e.name === myParticipant.name) : null;
              const myRank = myEntry ? lb.indexOf(myEntry) + 1 : null;
              const rankEmoji = myRank ? `#${myRank}` : null;
              const rankColor = myRank === 1 ? "text-yellow-400" : myRank === 2 ? "text-slate-300" : myRank === 3 ? "text-orange-400" : "text-white/50";

              return (
                <div
                  key={o.code + o.role}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="shrink-0">
                    {isHost
                      ? <Crown size={16} className="text-yellow-400/70" />
                      : <Gamepad2 size={16} className="text-purple-400/70" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm truncate">{o.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLES[o.status] || ""}`}>
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                      {rankEmoji && <span className={`text-xs font-bold ${rankColor}`}>{rankEmoji}</span>}
                    </div>
                    <p className="text-xs text-white/35 mt-0.5">
                      <span className="font-mono">{o.code}</span>
                      {" · "}
                      {o.games.length} {o.games.length === 1 ? "Spiel" : "Spiele"}
                      {" · "}
                      {new Date(o.updatedAt).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors"
                      style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}
                      onClick={() => navigate(`/room/${o.code}/winner`)}
                    >
                      <Trophy size={12} />
                      Ergebnis
                    </button>
                    {isHost && (
                      confirmDelete === o.code ? (
                        <div className="flex gap-1">
                          <button
                            className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-colors"
                            onClick={() => handleDelete(o.code)}
                            disabled={deleting === o.code}
                          >
                            {deleting === o.code ? "…" : <Check size={12} />}
                          </button>
                          <button
                            className="p-1.5 rounded-lg bg-white/5 text-muted hover:bg-white/10 transition-colors"
                            onClick={() => setConfirmDelete(null)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="p-1.5 rounded-lg text-pink-400/50 hover:text-pink-400 hover:bg-pink-500/10 transition-colors"
                          onClick={() => setConfirmDelete(o.code)}
                          title="Löschen"
                        >
                          <Trash2 size={13} />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!dataLoading && history.length > 3 && (
            <button
              className="w-full mt-3 py-2 rounded-xl text-sm font-semibold text-white/50 hover:text-white/80 hover:bg-white/[0.04] transition-all flex items-center justify-center gap-1.5"
              onClick={() => setHistoryExpanded((v) => !v)}
            >
              {historyExpanded
                ? <><ChevronUp size={14} /> Weniger anzeigen</>
                : <><ChevronDown size={14} /> Alle anzeigen ({history.length})</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

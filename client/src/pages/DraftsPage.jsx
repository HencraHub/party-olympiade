import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";
import api from "../api/client.js";
import {
  Pencil,
  Trash2,
  Rocket,
  AlertTriangle,
  FileText,
  Check,
  X,
  Plus,
} from "lucide-react";

export default function DraftsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState("");
  const [starting, setStarting] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    api
      .get("/olympics/mine")
      .then(({ data }) => setDrafts(data.filter((o) => o.status === "draft")))
      .catch(() => showToast("Entwürfe konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }, [user]); // eslint-disable-line

  async function handleDelete(code) {
    setDeleting(code);
    setConfirmDelete(null);
    try {
      await api.delete(`/olympics/${code}`);
      setDrafts((prev) => prev.filter((d) => d.code !== code));
    } catch (err) {
      showToast(err.response?.data?.error || "Löschen fehlgeschlagen");
    } finally {
      setDeleting(null);
    }
  }

  async function startDraft(code) {
    setStarting(code);
    try {
      const { data } = await api.post(`/olympics/${code}/launch`);
      if (data?.hostToken)
        localStorage.setItem(`hostToken_${code}`, data.hostToken);
      navigate(`/room/${code}/host`);
    } catch (err) {
      showToast(err.response?.data?.error || "Starten fehlgeschlagen");
    } finally {
      setStarting(null);
    }
  }

  if (!user) return null;

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

      <div className="max-w-2xl mx-auto space-y-5 animate-slide-up">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileText size={22} className="text-purple-400" />
            <h1 className="text-2xl font-black text-white">Entwürfe</h1>
          </div>
          <button
            className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2"
            onClick={() => navigate("/create")}
          >
            <Plus size={14} /> Neue Olympiade
          </button>
        </div>

        {loading && (
          <p className="text-muted text-sm text-center py-12 animate-pulse">
            Laden…
          </p>
        )}

        {!loading && drafts.length === 0 && (
          <div
            className="rounded-2xl p-10 text-center"
            style={{
              background: "rgba(10,12,30,0.97)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <FileText size={36} className="mx-auto mb-3 text-white/15" />
            <p className="text-white/50 text-sm font-semibold mb-1">
              Keine Entwürfe
            </p>
            <p className="text-white/30 text-xs">
              Erstelle eine neue Olympiade und speichere sie als Entwurf.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {drafts.map((d) => (
            <div
              key={d.code}
              className="rounded-2xl px-5 py-4 flex items-center gap-4"
              style={{
                background: "rgba(10,12,30,0.97)",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">
                  {d.name || "(kein Name)"}
                </p>
                <p className="text-xs text-white/35 mt-0.5">
                  <span className="font-mono text-white/50">{d.code}</span>
                  {" · "}
                  {d.games.length} {d.games.length === 1 ? "Spiel" : "Spiele"}
                  {" · "}
                  {new Date(d.updatedAt).toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors"
                  style={{
                    background: "rgba(139,92,246,0.15)",
                    border: "1px solid rgba(139,92,246,0.3)",
                    color: "#a78bfa",
                  }}
                  onClick={() => navigate(`/edit/${d.code}`)}
                >
                  <Pencil size={12} /> Bearbeiten
                </button>

                <button
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors"
                  style={{
                    background: "rgba(34,197,94,0.12)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    color: "#4ade80",
                  }}
                  onClick={() => startDraft(d.code)}
                  disabled={starting === d.code}
                  title="Direkt starten"
                >
                  {starting === d.code ? (
                    "…"
                  ) : (
                    <>
                      <Rocket size={12} /> Starten
                    </>
                  )}
                </button>

                {confirmDelete === d.code ? (
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 hover:bg-pink-500/30 transition-colors"
                      onClick={() => handleDelete(d.code)}
                      disabled={deleting === d.code}
                    >
                      {deleting === d.code ? "…" : <Check size={12} />}
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
                    className="p-1.5 rounded-lg text-pink-400/40 hover:text-pink-400 hover:bg-pink-500/10 transition-colors"
                    onClick={() => setConfirmDelete(d.code)}
                    title="Löschen"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

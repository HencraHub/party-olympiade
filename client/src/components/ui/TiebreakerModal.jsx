import { useState, useEffect, useRef } from "react";
import { Zap, Trophy, Check, ArrowRight } from "lucide-react";

const TIMER_SECONDS = 45;

/**
 * Shared tiebreaker overlay used by both HostRoomPage and ParticipantView.
 *
 * Props:
 *   question      – string
 *   unit          – string (display unit for the answer)
 *   tiedPlayers   – string[] (names of tied participants)
 *   answers       – { [name]: string } live answers dict
 *   isHost        – bool
 *   isParticipant – bool (is this user one of the tied players?)
 *   onAnswer      – fn(answer: string) — participant submits answer
 *   onResolve     – fn(winner: string) — host picks winner
 *   onClose       – fn() — dismiss after resolved
 *   resolved      – bool
 *   winner        – string | null (after resolution)
 */
export default function TiebreakerModal({
  question,
  unit,
  tiedPlayers,
  answers,
  isHost,
  isParticipant,
  onAnswer,
  onResolve,
  onClose,
  resolved,
  winner,
}) {
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timerDone, setTimerDone] = useState(false);
  const intervalRef = useRef(null);

  // Countdown
  useEffect(() => {
    if (resolved) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          setTimerDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [resolved]);

  function handleSubmit() {
    if (!input.trim()) return;
    setSubmitted(true);
    onAnswer(input.trim());
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden animate-slide-up"
        style={{
          background: "rgba(10,8,28,0.98)",
          border: "1px solid rgba(250,204,21,0.35)",
          boxShadow: "0 0 80px rgba(250,204,21,0.12)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <Zap size={22} className="text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400/70">
              Stechen!
            </p>
            <p className="text-white font-bold text-sm">
              {tiedPlayers.join(" & ")} haben denselben Platz
            </p>
          </div>
          {/* Timer circle */}
          {!resolved && (
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                <circle
                  cx="24" cy="24" r="20"
                  fill="none"
                  stroke={timeLeft > 15 ? "#facc15" : timeLeft > 5 ? "#f97316" : "#ef4444"}
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - timeLeft / TIMER_SECONDS)}`}
                  style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-sm font-black"
                style={{ color: timeLeft > 15 ? "#facc15" : timeLeft > 5 ? "#f97316" : "#ef4444" }}
              >
                {timeLeft}
              </span>
            </div>
          )}
        </div>

        {/* Question */}
        <div className="px-6 py-5">
          <p className="text-white text-lg font-bold leading-snug mb-1">{question}</p>
          {unit && <p className="text-white/35 text-xs">Antwort in: {unit}</p>}
        </div>

        {/* ── Resolved state ── */}
        {resolved && (
          <div className="px-6 pb-6">
            <div
              className="rounded-xl p-4 text-center mb-4"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}
            >
              <p className="text-green-400 font-black text-base flex items-center justify-center gap-2"><Trophy size={16} /> {winner} gewinnt das Stechen!</p>
            </div>
            {/* Show all answers */}
            <div className="space-y-2 mb-4">
              {tiedPlayers.map((name) => (
                <div key={name} className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                  style={{ background: name === winner ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${name === winner ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.06)"}` }}>
                  <span className="font-semibold text-white text-sm flex-1">{name}</span>
                  <span className="text-white/60 text-sm font-mono">{answers[name] ?? "—"} {unit}</span>
                  {name === winner && <span className="text-green-400 text-xs font-black">GEWINNER</span>}
                </div>
              ))}
            </div>
            {onClose && (
              <button className="btn-primary w-full flex items-center justify-center gap-1.5" onClick={onClose}>Weiter <Check size={14} /></button>
            )}
          </div>
        )}

        {/* ── Participant input ── */}
        {!resolved && isParticipant && (
          <div className="px-6 pb-6">
            {submitted ? (
              <div className="text-center py-4">
                <p className="text-green-400 font-bold flex items-center justify-center gap-1.5"><Check size={14} /> Antwort eingereicht</p>
                <p className="text-white/40 text-xs mt-1">Warte auf andere Spieler…</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  type="number"
                  step="any"
                  placeholder="Deine Schätzung…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  autoFocus
                  disabled={timerDone}
                />
                <button
                  className="btn-primary !px-4"
                  onClick={handleSubmit}
                  disabled={!input.trim() || timerDone}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Spectator waiting message ── */}
        {!resolved && !isParticipant && !isHost && (
          <div className="px-6 pb-6 text-center">
            <p className="text-white/40 text-sm animate-pulse">Stechen läuft… {answeredCount}/{tiedPlayers.length} geantwortet</p>
          </div>
        )}

        {/* ── Host view: live answers + pick winner ── */}
        {!resolved && isHost && (
          <div className="px-6 pb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3">
              Antworten ({answeredCount}/{tiedPlayers.length})
            </p>
            <div className="space-y-2 mb-4">
              {tiedPlayers.map((name) => (
                <div key={name} className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span className="font-semibold text-white text-sm flex-1">{name}</span>
                  {answers[name] != null ? (
                    <span className="text-yellow-400 font-mono text-sm">{answers[name]} {unit}</span>
                  ) : (
                    <span className="text-white/20 text-xs animate-pulse">tippt…</span>
                  )}
                </div>
              ))}
            </div>

            {(timerDone || answeredCount >= tiedPlayers.length) && (
              <>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">
                  Wer hat die bessere Antwort?
                </p>
                <div className="grid gap-2">
                  {tiedPlayers.map((name) => (
                    <button
                      key={name}
                      className="w-full py-2.5 rounded-xl font-bold text-sm transition-all"
                      style={{
                        background: "rgba(250,204,21,0.12)",
                        border: "1px solid rgba(250,204,21,0.3)",
                        color: "#facc15",
                      }}
                      onClick={() => onResolve(name)}
                    >
                      <span className="flex items-center justify-center gap-1.5"><Trophy size={13} /> {name} gewinnt</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {!timerDone && answeredCount < tiedPlayers.length && (
              <p className="text-center text-white/30 text-xs animate-pulse">
                Warte auf alle Antworten… oder wähle nach dem Timer
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

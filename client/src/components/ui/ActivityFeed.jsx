import { useEffect, useRef, useState } from "react";
import { Send, Zap, MessageCircle } from "lucide-react";
import { AVATAR_GRADIENTS } from "../Header.jsx";

const FALLBACK_GRADIENTS = [
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
  "linear-gradient(135deg,#8b5cf6,#3b82f6)",
  "linear-gradient(135deg,#22d3ee,#3b82f6)",
  "linear-gradient(135deg,#22c55e,#14b8a6)",
  "linear-gradient(135deg,#f97316,#ec4899)",
  "linear-gradient(135deg,#eab308,#f97316)",
  "linear-gradient(135deg,#f43f5e,#8b5cf6)",
  "linear-gradient(135deg,#6366f1,#22d3ee)",
];

function MiniAvatar({ name, participants }) {
  const idx = participants.findIndex((p) => p.name === name);
  const p = participants[idx];
  const grad =
    p?.avatarColor != null
      ? AVATAR_GRADIENTS[p.avatarColor] ?? AVATAR_GRADIENTS[0]
      : FALLBACK_GRADIENTS[Math.abs(idx >= 0 ? idx : 0) % FALLBACK_GRADIENTS.length];

  if (p?.cardImage) {
    return (
      <div
        className="w-6 h-6 rounded-md flex-shrink-0 overflow-hidden"
        style={{ background: grad }}
      >
        <img src={p.cardImage} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-black text-white"
      style={{ background: grad }}
    >
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

export default function ActivityFeed({ items, onSend, myName, participants = [], cooldownSecs = 0 }) {
  const [text, setText] = useState("");
  const [countdown, setCountdown] = useState(0);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  // Start countdown when server sends a cooldown
  useEffect(() => {
    if (cooldownSecs > 0) setCountdown(cooldownSecs);
  }, [cooldownSecs]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const blocked = countdown > 0;

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || blocked) return;
    onSend(trimmed);
    setText("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(10,12,30,0.95)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <MessageCircle size={13} className="text-purple-400" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
          Chat & Events
        </span>
      </div>

      {/* Message list */}
      <div
        className="overflow-y-auto px-4 py-2 space-y-0.5"
        style={{ maxHeight: 220, minHeight: 72 }}
      >
        {items.length === 0 && (
          <p className="text-white/20 text-xs text-center py-5">
            Noch keine Aktivität…
          </p>
        )}
        {items.map((item, i) =>
          item.type === "bonus" ? (
            /* ── Server event row ── */
            <div
              key={i}
              className="flex items-center gap-2 py-1.5 px-2 rounded-lg"
              style={{
                background:
                  item.delta > 0
                    ? "rgba(34,197,94,0.06)"
                    : "rgba(236,72,153,0.06)",
                border: `1px solid ${item.delta > 0 ? "rgba(34,197,94,0.15)" : "rgba(236,72,153,0.15)"}`,
              }}
            >
              <Zap
                size={11}
                className="flex-shrink-0"
                style={{ color: item.delta > 0 ? "#4ade80" : "#f472b6" }}
              />
              <span className="text-xs text-white/60 leading-none">
                <span className="font-bold text-white/90">{item.player}</span>
                {" — "}
                <span>{item.reason}</span>
                {" "}
                <span
                  className="font-black"
                  style={{ color: item.delta > 0 ? "#4ade80" : "#f472b6" }}
                >
                  {item.delta > 0 ? `+${item.delta}` : item.delta}
                </span>
                <span className="text-white/30 ml-1 text-[10px]">
                  in {item.game}
                </span>
              </span>
            </div>
          ) : (
            /* ── Chat message row ── */
            <div key={i} className="flex items-center gap-2.5 py-1.5">
              <MiniAvatar name={item.name} participants={participants} />
              <span className="text-xs leading-none">
                <span
                  className="font-bold mr-1.5"
                  style={{
                    color:
                      item.name === myName ? "#f472b6" : "rgba(255,255,255,0.85)",
                  }}
                >
                  {item.name}
                </span>
                <span className="text-white/65">{item.text}</span>
              </span>
            </div>
          ),
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chat input */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {blocked ? (
          <span className="flex-1 text-xs font-semibold" style={{ color: "#f472b6" }}>
            Cooldown — bitte warte {countdown}s…
          </span>
        ) : (
          <input
            className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
            placeholder="Nachricht…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={200}
          />
        )}
        <button
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          style={{
            background:
              !blocked && text.trim()
                ? "rgba(139,92,246,0.4)"
                : "rgba(255,255,255,0.05)",
            border: "1px solid rgba(139,92,246,0.3)",
            opacity: blocked ? 0.4 : 1,
          }}
          onClick={handleSend}
          disabled={blocked || !text.trim()}
        >
          <Send size={13} className="text-purple-300" />
        </button>
      </div>
    </div>
  );
}

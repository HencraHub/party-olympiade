import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import GlassCard from "../components/ui/GlassCard.jsx";
import Input from "../components/ui/Input.jsx";
import { connectSocket, disconnectSocket } from "../socket/socket.js";
import useOlympicStore from "../store/useOlympicStore.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { Gamepad2, ArrowLeft } from "lucide-react";

export default function JoinPage() {
  const navigate = useNavigate();
  const { code: paramCode } = useParams();
  const [searchParams] = useSearchParams();
  const wasReverted = searchParams.get("reverted") === "1";
  const wasKicked = searchParams.get("kicked") === "1";
  const { user } = useAuthStore();

  const [code, setCode] = useState((paramCode || "").toUpperCase());
  const [name, setName] = useState(user?.username || "");
  const [error, setError] = useState(
    wasKicked
      ? "Du wurdest vom Host aus der Lobby entfernt."
      : wasReverted
        ? "The host reverted the Olympic back to draft. You can rejoin when it's relaunched."
        : "",
  );
  const [loading, setLoading] = useState(false);

  const { updateFromRoomEvent, setParticipantName, setIsHost, setConnected } =
    useOlympicStore();

  function handleJoin() {
    const trimCode = code.trim().toUpperCase();
    const trimName = name.trim();
    if (!trimCode || trimCode.length !== 4) {
      setError("Enter a valid 4-character room code.");
      return;
    }
    if (!trimName) {
      setError("Enter your name.");
      return;
    }
    setError("");
    setLoading(true);

    const socket = connectSocket();

    socket.once("room-update", (data) => {
      updateFromRoomEvent(data);
      setParticipantName(trimName);
      setIsHost(false);
      setConnected(true);
      setLoading(false);
      navigate(`/room/${trimCode}`);
    });

    socket.once("error", ({ message }) => {
      setError(message || "Could not join room.");
      setLoading(false);
      disconnectSocket();
    });

    socket.emit("join-room", {
      code: trimCode,
      name: trimName,
      isHost: false,
      userId: user?.id || null,
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <button className="btn-ghost mb-8" onClick={() => navigate("/")}>
          <span className="flex items-center gap-1.5"><ArrowLeft size={14} /> Zurück</span>
        </button>

        <GlassCard glow>
          <h1 className="text-2xl font-bold text-white mb-1">Raum beitreten</h1>
          <p className="text-sm text-muted mb-8">
            Gib den Raumcode vom Host ein.
          </p>

          <div className="space-y-5">
            <Input
              label="Raumcode"
              placeholder="ABCD"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="text-center text-3xl font-black tracking-widest text-yellow-400 uppercase"
            />

            <Input
              label="Dein Name"
              placeholder="Namen eingeben"
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />

            {error && (
              <p className="text-sm text-pink-400 bg-pink-500/10 border border-pink-500/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              className="btn-primary w-full"
              onClick={handleJoin}
              disabled={loading}
            >
              {loading ? "Beitreten…" : <span className="flex items-center justify-center gap-2"><Gamepad2 size={15} />Beitreten</span>}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

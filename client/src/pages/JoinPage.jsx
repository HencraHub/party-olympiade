import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard.jsx';
import Input from '../components/ui/Input.jsx';
import { connectSocket, disconnectSocket } from '../socket/socket.js';
import useOlympicStore from '../store/useOlympicStore.js';

export default function JoinPage() {
  const navigate = useNavigate();
  const { code: paramCode } = useParams();
  const [code, setCode] = useState((paramCode || '').toUpperCase());
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { updateFromRoomEvent, setParticipantName, setIsHost, setConnected } = useOlympicStore();

  function handleJoin() {
    const trimCode = code.trim().toUpperCase();
    const trimName = name.trim();
    if (!trimCode || trimCode.length !== 4) {
      setError('Enter a valid 4-character room code.');
      return;
    }
    if (!trimName) {
      setError('Enter your name.');
      return;
    }
    setError('');
    setLoading(true);

    const socket = connectSocket();

    socket.once('room-update', (data) => {
      updateFromRoomEvent(data);
      setParticipantName(trimName);
      setIsHost(false);
      setConnected(true);
      setLoading(false);
      navigate(`/room/${trimCode}`);
    });

    socket.once('error', ({ message }) => {
      setError(message || 'Could not join room.');
      setLoading(false);
      disconnectSocket();
    });

    socket.emit('join-room', { code: trimCode, name: trimName, isHost: false });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <button className="btn-ghost mb-6" onClick={() => navigate('/')}>
          ← Back
        </button>

        <GlassCard glow>
          <h1 className="text-2xl font-bold text-white mb-1">Join Event</h1>
          <p className="text-sm text-muted mb-6">Enter the room code from the host.</p>

          <div className="space-y-4">
            <Input
              label="Room Code"
              placeholder="ABCD"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="text-center text-3xl font-black tracking-widest text-yellow-400 uppercase"
            />

            <Input
              label="Your Name"
              placeholder="Enter your name"
              maxLength={30}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />

            {error && (
              <p className="text-sm text-pink-400 bg-pink-500/10 border border-pink-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              className="btn-primary w-full"
              onClick={handleJoin}
              disabled={loading}
            >
              {loading ? 'Joining...' : '🎮 Join Room'}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

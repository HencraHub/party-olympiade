import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import GlassCard from '../components/ui/GlassCard.jsx';
import Input from '../components/ui/Input.jsx';

const STEPS = ['Event Setup', 'Games', 'Preview'];

const DEFAULT_ADDONS = {
  drinkingGame: { enabled: false, rules: '' },
  timeLimit: 0,
  equipment: '',
  handicap: '',
  teamSize: 2,
};

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error('Image must be under 2 MB'));
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
          onChange={(e) => onChange({ maxPlayers: Math.max(2, Number(e.target.value)) })}
        />
        <p className="text-xs text-muted mt-1">Players join via room code after launch. Min 2, max 50.</p>
      </div>

      <div>
        <label className="label">Tie-Breaking Rule</label>
        <select
          className="input-field"
          value={data.tieRule}
          onChange={(e) => onChange({ tieRule: e.target.value })}
        >
          <option value="tiebreaker">Tiebreaker question decides</option>
          <option value="shared_points">Tied players share points</option>
        </select>
      </div>

      <div>
        <p className="label mb-3">Optional Bonus / Penalty Rules</p>
        <div className="space-y-3">
          {[
            {
              key: 'comebackPenalty',
              label: 'Comeback Penalty',
              desc: 'Previous leader not in top 3 → −2 pts',
              icon: '📉',
            },
            {
              key: 'lastPlaceBonus',
              label: 'Last Place Bonus',
              desc: 'Previous last-place in top 3 → +1 pt',
              icon: '📈',
            },
            {
              key: 'winStreakBonus',
              label: 'Win Streak Bonus',
              desc: 'Win two FFA games in a row → +1 pt',
              icon: '🔥',
            },
            {
              key: 'finalDoublePoints',
              label: 'Final Double Points',
              desc: 'Last game awards 2× base points',
              icon: '💥',
            },
          ].map(({ key, label, desc, icon }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer glass rounded-xl p-3 hover:border-white/20 transition-colors">
              <input
                type="checkbox"
                className="mt-0.5 accent-purple w-4 h-4 shrink-0"
                checked={data.extraRules[key]}
                onChange={(e) =>
                  onChange({ extraRules: { ...data.extraRules, [key]: e.target.checked } })
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
    </div>
  );
}

// ─── Step 2: Games ────────────────────────────────────────────────────────
function StepGames({ games, onChange }) {
  const [form, setForm] = useState({
    title: '',
    mode: 'ffa',
    icon: '🎮',
    rules: '',
    imageBase64: '',
    addons: { ...DEFAULT_ADDONS },
  });
  const [imgError, setImgError] = useState('');
  const [showAddons, setShowAddons] = useState(false);

  async function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await readFileAsBase64(file);
      setForm((f) => ({ ...f, imageBase64: b64 }));
      setImgError('');
    } catch (err) {
      setImgError(err.message);
    }
  }

  function addGame() {
    const title = form.title.trim();
    if (!title) return;
    onChange([...games, { ...form, title, order: games.length }]);
    setForm({ title: '', mode: 'ffa', icon: '🎮', rules: '', imageBase64: '', addons: { ...DEFAULT_ADDONS } });
    setShowAddons(false);
  }

  function moveGame(i, dir) {
    const arr = [...games];
    const swap = i + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[i], arr[swap]] = [arr[swap], arr[i]];
    onChange(arr.map((g, idx) => ({ ...g, order: idx })));
  }

  return (
    <div className="space-y-5">
      <GlassCard className="space-y-4">
        <h3 className="font-bold text-white">Add Game</h3>

        <div className="flex gap-2">
          <Input
            placeholder="Game title"
            maxLength={60}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="flex-1"
          />
          <input
            className="input-field w-16 text-center text-xl"
            placeholder="🎮"
            maxLength={2}
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value || '🎮' }))}
          />
        </div>

        <div className="flex gap-3">
          {['ffa', 'team'].map((m) => (
            <button
              key={m}
              onClick={() => setForm((f) => ({ ...f, mode: m }))}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                form.mode === m
                  ? 'border-purple-500 bg-purple-500/20 text-purple-light'
                  : 'border-white/10 text-muted hover:border-white/30'
              }`}
            >
              {m === 'ffa' ? '⚔️ FFA' : '👥 Teams'}
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
            <img src={form.imageBase64} alt="" className="w-16 h-10 rounded object-cover" />
          ) : (
            <span className="text-2xl">🖼</span>
          )}
          <span className="text-sm text-muted">
            {form.imageBase64 ? 'Change cover image' : 'Upload cover image (optional)'}
          </span>
        </label>
        {imgError && <p className="text-xs text-pink-400">{imgError}</p>}

        {/* Addons toggle */}
        <button
          className="text-sm text-purple-light hover:text-purple transition-colors"
          onClick={() => setShowAddons((s) => !s)}
        >
          {showAddons ? '▲ Hide add-ons' : '▼ Show add-ons (optional)'}
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
                    addons: { ...f.addons, drinkingGame: { ...f.addons.drinkingGame, enabled: e.target.checked } },
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
                    addons: { ...f.addons, drinkingGame: { ...f.addons.drinkingGame, rules: e.target.value } },
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
                    setForm((f) => ({ ...f, addons: { ...f.addons, timeLimit: Number(e.target.value) } }))
                  }
                />
              </div>
              {form.mode === 'team' && (
                <div>
                  <label className="label">👥 Team size</label>
                  <input
                    type="number"
                    className="input-field"
                    min={1}
                    value={form.addons.teamSize}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, addons: { ...f.addons, teamSize: Number(e.target.value) } }))
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
                setForm((f) => ({ ...f, addons: { ...f.addons, equipment: e.target.value } }))
              }
            />
            <Input
              label="⚖ Handicap rules"
              placeholder="e.g. Best player uses keyboard"
              maxLength={200}
              value={form.addons.handicap}
              onChange={(e) =>
                setForm((f) => ({ ...f, addons: { ...f.addons, handicap: e.target.value } }))
              }
            />
          </div>
        )}

        <button className="btn-primary w-full" onClick={addGame} disabled={!form.title.trim()}>
          + Add Game
        </button>
      </GlassCard>

      {/* Game list */}
      <div className="space-y-2">
        {games.map((g, i) => (
          <div key={i} className="glass rounded-xl p-3 flex items-center gap-3">
            <span className="text-xl">{g.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-white truncate">{g.title}</span>
              <span className="ml-2 text-xs text-muted">{g.mode.toUpperCase()}</span>
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
          <p className="text-muted text-sm text-center py-4">No games yet. Add at least 1.</p>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Preview ──────────────────────────────────────────────────────
function StepPreview({ data }) {
  return (
    <div className="space-y-4">
      <GlassCard>
        <h3 className="font-bold text-white mb-1">{data.name || '—'}</h3>
        <p className="text-sm text-muted">Max players: {data.maxPlayers}</p>
        <p className="text-sm text-muted">Tie rule: {data.tieRule}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {Object.entries(data.extraRules)
            .filter(([, v]) => v)
            .map(([k]) => (
              <span key={k} className="badge bg-purple-500/20 text-purple-light">
                {k}
              </span>
            ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h4 className="font-semibold text-muted text-sm mb-2">Games ({data.games.length})</h4>
        <div className="space-y-1.5">
          {data.games.map((g, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-muted w-5 text-right">{i + 1}.</span>
              <span>{g.icon}</span>
              <span className="text-white">{g.title}</span>
              <span className="text-xs text-muted ml-auto">{g.mode.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="border-cyan-500/30">
        <h4 className="font-semibold text-cyan text-sm mb-1">🎮 Players join via room code</h4>
        <p className="text-sm text-muted">
          After launching you'll get a shareable room code. Up to {data.maxPlayers} players can join
          the lobby before you start the event.
        </p>
      </GlassCard>
    </div>
  );
}

// ─── Main CreatePage ───────────────────────────────────────────────────────
export default function CreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const [eventData, setEventData] = useState({
    name: '',
    tieRule: 'tiebreaker',
    extraRules: { comebackPenalty: false, lastPlaceBonus: false, winStreakBonus: false, finalDoublePoints: false },
    maxPlayers: 12,
  });
  const [games, setGames] = useState([]);

  function canProceed() {
    if (step === 0) return eventData.name.trim().length > 0;
    if (step === 1) return games.length >= 1;
    return true;
  }

  async function launch() {
    setLoading(true);
    setApiError('');
    try {
      const { data } = await api.post('/olympics', {
        name: eventData.name,
        tieRule: eventData.tieRule,
        extraRules: eventData.extraRules,
        maxPlayers: eventData.maxPlayers,
        games,
      });
      localStorage.setItem(`hostToken_${data.code}`, data.hostToken);
      navigate(`/room/${data.code}/host`);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to create Olympic. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        {/* Back */}
        <button className="btn-ghost mb-6" onClick={() => navigate('/')}>
          ← Back
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i === step
                    ? 'bg-gradient-to-br from-purple to-pink text-white'
                    : i < step
                    ? 'bg-purple-500/40 text-purple-light'
                    : 'bg-white/10 text-muted'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-white' : 'text-muted'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        {/* Step title */}
        <h1 className="text-2xl font-bold text-white mb-6">{STEPS[step]}</h1>

        {/* Step content */}
        {step === 0 && (
          <StepEventSetup data={eventData} onChange={(patch) => setEventData((d) => ({ ...d, ...patch }))} />
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
            <button className="btn-secondary" onClick={() => setStep((s) => s - 1)}>
              ← Back
            </button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <button className="btn-primary" onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
              Next →
            </button>
          ) : (
            <button className="btn-primary" onClick={launch} disabled={loading || !canProceed()}>
              {loading ? 'Launching...' : '🚀 Launch Olympic'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

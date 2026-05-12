import { useState, useEffect } from 'react';

const EXPECTED_HASH = import.meta.env.VITE_PASSWORD_HASH as string;
const EXPECTED_USER = import.meta.env.VITE_USERNAME as string;

const MAX_TRIES = 5;
const HINT_AFTER = 3;

interface AttemptState {
  count: number;
  date: string;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getAttempts(): AttemptState {
  try {
    const raw = localStorage.getItem('login_attempts');
    if (!raw) return { count: 0, date: todayStr() };
    const state: AttemptState = JSON.parse(raw);
    return state.date === todayStr() ? state : { count: 0, date: todayStr() };
  } catch {
    return { count: 0, date: todayStr() };
  }
}

function recordAttempt(): AttemptState {
  const next = { count: getAttempts().count + 1, date: todayStr() };
  localStorage.setItem('login_attempts', JSON.stringify(next));
  return next;
}

const SPIDERMAN_HINTS = [
  '"With great power comes great responsibility."\n— Also applies to remembering passwords.',
  'Your friendly neighborhood Spider-Man tried the same password and also got it wrong.',
  'Peter Parker forgot his password once too. He just web-swung away from the problem.',
  '🕷️  Tingle tingle… your spider-sense says: maybe check caps lock?',
];

export default function Login({ onLogin, onBack }: { onLogin: () => void; onBack: () => void }) {
  const [username, setUsername] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState<AttemptState>(getAttempts);
  const [hintIndex] = useState(() => Math.floor(Math.random() * SPIDERMAN_HINTS.length));

  useEffect(() => {
    setAttempts(getAttempts());
  }, []);

  const locked = attempts.count >= MAX_TRIES;
  const showHint = attempts.count >= HINT_AFTER && !locked;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;

    if (!EXPECTED_HASH || !EXPECTED_USER) {
      setError('Auth not configured in this build.');
      return;
    }

    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
    const hex = Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');

    if (username.toLowerCase() === EXPECTED_USER.toLowerCase() && hex === EXPECTED_HASH) {
      localStorage.setItem('auth', 'true');
      onLogin();
    } else {
      const next = recordAttempt();
      setAttempts(next);
      const remaining = MAX_TRIES - next.count;
      if (next.count >= MAX_TRIES) {
        setError('Too many attempts. Try again tomorrow.');
      } else {
        setError(`Wrong credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} left today.`);
      }
      setPw('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-84 max-w-sm w-full mx-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Owner Login</h2>

        {locked ? (
          <div className="text-center space-y-3">
            <div className="text-5xl">🕷️</div>
            <p className="text-red-600 font-semibold">Too many attempts.</p>
            <p className="text-gray-500 text-sm">Your spider-sense says: try again tomorrow.</p>
            <button onClick={onBack} className="mt-4 text-gray-500 text-sm hover:underline">
              Go back
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              placeholder="Username"
              autoFocus
              autoComplete="username"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setError(''); }}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            {showHint && (
              <div className="bg-red-50 border border-red-100 rounded p-3 text-xs text-gray-600 whitespace-pre-line">
                <span className="text-lg">🕷️</span> {SPIDERMAN_HINTS[hintIndex]}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold"
            >
              Sign In
            </button>
            <button type="button" onClick={onBack} className="w-full text-gray-500 text-sm hover:underline">
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

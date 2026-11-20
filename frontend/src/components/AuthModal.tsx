import { useState } from 'react';
import { useAuth } from '../auth/useAuth';

interface AuthModalProps {
  configured: boolean;
  onClose: () => void;
}

export function AuthModal({ configured, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-onyx-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-xl font-bold text-pure-white">
            {isSignUp ? 'Create SparkZ Account' : 'Welcome back to SparkZ'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-pure-white/60 hover:text-pure-white"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {!configured && (
          <div className="mb-4 rounded-lg border border-spark-lime/30 bg-spark-lime/10 p-3 text-xs text-pure-white/90">
            <p className="font-semibold text-spark-lime">Demo / Local Environment Note</p>
            <p className="mt-1">
              Supabase keys are not yet configured in <code className="text-spark-lime">frontend/.env</code>.
              Configure <code className="text-spark-lime">VITE_SUPABASE_URL</code> and <code className="text-spark-lime">VITE_SUPABASE_ANON_KEY</code> to enable live authentication.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-pure-white/60">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ada Lovelace"
                className="input mt-1"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pure-white/60">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="engineer@sparkz.dev"
              className="input mt-1"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-pure-white/60">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input mt-1"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !configured}
            className="btn-primary w-full py-2.5 text-sm font-bold"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-pure-white/60 hover:text-spark-lime"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
}

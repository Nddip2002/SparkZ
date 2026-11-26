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
      setError((err as Error).message || 'Authentication failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B111E]/80 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#28364F] bg-[#131C2E] p-6 space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-[#28364F] bg-[#1A253A] p-3">
          <h2 id="auth-dialog-title" className="title-1 text-pure-white">
            {isSignUp ? 'Create SparkZ account' : 'Sign in to SparkZ'}
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
          <div className="rounded-lg border border-spark-lime/40 bg-[#0F2537] p-3 caption-2 text-pure-white/90">
            <p className="caption-3 text-spark-lime">Local environment note</p>
            <p className="mt-1">
              Configure <code className="font-mono text-spark-lime">VITE_SUPABASE_URL</code> and{' '}
              <code className="font-mono text-spark-lime">VITE_SUPABASE_ANON_KEY</code> in{' '}
              <code className="font-mono text-spark-lime">frontend/.env</code> to enable live authentication.
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/40 bg-[#1A253A] p-3 caption-2 text-red-400"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label htmlFor="auth-fullname" className="block caption-3 uppercase tracking-wider text-pure-white/60">
                Full name
              </label>
              <input
                id="auth-fullname"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ada Lovelace"
                className="input"
              />
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="auth-email" className="block caption-3 uppercase tracking-wider text-pure-white/60">
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="engineer@sparkz.dev"
              className="input"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="auth-password" className="block caption-3 uppercase tracking-wider text-pure-white/60">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="input"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !configured}
            className="btn-primary w-full"
          >
            {loading ? 'Verifying credentials...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="caption-2 text-pure-white/60 hover:text-spark-lime"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : 'Need an account? Create one'}
          </button>
        </div>
      </div>
    </div>
  );
}

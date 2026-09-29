import { Leaf, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const submit = async (event) => {
    event.preventDefault();
    if (!email || !password) return;
    setError('');
    setLoading(true);
    setStatusMessage('Connecting to server...');

    const maxRetries = 3;
    const retryDelays = [3000, 6000, 10000];

    try {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const result = await login(email, password);

        if (result.ok) {
          if (result.user?.role === 'admin') {
            navigate('/admin');
            return;
          } else {
            setError("Access Denied: You do not have admin privileges.");
            return;
          }
        }

        // If the error is a definitive auth rejection (like 401 Invalid Credentials), don't retry
        const isNetworkOrColdStart = result.isNetworkError || result.message?.toLowerCase().includes('network') || result.message?.toLowerCase().includes('timeout');

        if (!isNetworkOrColdStart || attempt === maxRetries) {
          setError(result.message || 'Invalid email or password');
          return;
        }

        // Handle cold start retry
        const nextDelay = retryDelays[attempt] || 5000;
        setStatusMessage(`Server starting up (waking from sleep)... Retrying in ${nextDelay / 1000}s (Attempt ${attempt + 1}/${maxRetries})`);
        await sleep(nextDelay);
        setStatusMessage(`Connecting to server (Attempt ${attempt + 2}/${maxRetries + 1})...`);
      }
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-leaf-50 px-4 pt-24 dark:bg-[#0c2411]">
      <form onSubmit={submit} className="glass w-full max-w-md rounded-[2rem] p-8">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-leaf-700 text-white"><Leaf /></span>
          <h1 className="font-display text-4xl font-extrabold">Login</h1>
          <p className="mt-2 text-leaf-900/70 dark:text-leaf-100/75">Sign in to access the secure Admin Dashboard and manage your nursery.</p>
        </div>
        <label className="mb-4 flex items-center gap-3 rounded-xl border border-leaf-700/20 bg-white px-4 py-3 dark:bg-leaf-900">
          <Mail size={18} />
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="w-full bg-transparent outline-none" disabled={loading} />
        </label>
        <label className="mb-4 flex items-center gap-3 rounded-xl border border-leaf-700/20 bg-white px-4 py-3 dark:bg-leaf-900">
          <Lock size={18} />
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full bg-transparent outline-none" disabled={loading} />
        </label>
        {statusMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-200">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
        {error && <p className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
        <button disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? (
            <>
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>{statusMessage ? 'Please Wait...' : 'Signing In...'}</span>
            </>
          ) : (
            <span>Login</span>
          )}
        </button>
      </form>
    </main>
  );
}

import { Leaf, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    const result = await login(email, password);
    if (result.ok) {
      if (result.user?.role === 'admin') {
        navigate('/admin');
      } else {
        setError("Access Denied: You do not have admin privileges.");
      }
    } else {
      setError(result.message);
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
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="w-full bg-transparent outline-none" />
        </label>
        <label className="mb-4 flex items-center gap-3 rounded-xl border border-leaf-700/20 bg-white px-4 py-3 dark:bg-leaf-900">
          <Lock size={18} />
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full bg-transparent outline-none" />
        </label>
        {error && <p className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
        <button className="btn-primary w-full">Login</button>
      </form>
    </main>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChefHat, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        toast.success('Welcome back to DINEWELL!');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (err) {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1711153419402-336ee48f2138" 
          alt="Indian Food"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-12 text-white">
          <div className="max-w-md">
            <h1 className="text-5xl font-heading font-bold mb-4">Nourishing the Future.</h1>
            <p className="text-lg text-white/80">
              Efficient, hygienic, and transparent mess management for the IIT Gandhinagar community.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-sage rounded-2xl text-white mb-6">
              <ChefHat size={28} />
            </div>
            <h2 className="text-3xl font-heading font-bold text-gray-900">Sign In</h2>
            <p className="text-gray-500 mt-2">Access your DINEWELL account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username or Email</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sage focus:ring-4 focus:ring-sage/10 transition-all outline-none"
                placeholder="admin@iitgn.ac.in or student"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sage focus:ring-4 focus:ring-sage/10 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sage hover:bg-sage-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-sage/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  Continue <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Demo Credentials</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">Admin:</span>
              <div className="text-right">
                <span className="text-gray-700 block">'admin@iitgn.ac.in'<span className="text-gray-400 text-[10px]"></span></span>
                <span className="text-gray-400 text-xs">admin123</span>
              </div>
            </div>
            <div className="h-px bg-gray-200/50 w-full" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 font-medium">Student:</span>
              <div className="text-right">
                <span className="text-gray-700 block">student <span className="text-gray-400 text-[10px]">(or roll no)</span></span>
                <span className="text-gray-400 text-xs">student123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

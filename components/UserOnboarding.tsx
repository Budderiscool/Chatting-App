import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '../types';
import { Gamepad2, Image as ImageIcon, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

interface Props {
  onUserCreated: (user: User) => void;
}

export const UserOnboarding: React.FC<Props> = ({ onUserCreated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        // LOGIN LOGIC
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('username', username.trim())
            .single();

        if (fetchError || !user) {
            throw new Error('User not found.');
        }

        if (user.password !== password) {
            throw new Error('Invalid password.');
        }

        onUserCreated(user);

      } else {
        // REGISTER LOGIC
        
        // 1. Check duplicate username
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('username', username.trim())
            .single();
        
        if (existing) {
            throw new Error('Username is already taken.');
        }

        // 2. Create user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ 
            username: username.trim(),
            password: password, // Note: In a real app, hash this!
            avatar_url: avatarUrl.trim() || undefined,
            last_username_change: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) throw createError;
        if (newUser) onUserCreated(newUser);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]" />

      <div className="bg-surface p-8 rounded-3xl shadow-2xl w-full max-w-md border border-border relative z-10">
        <div className="flex justify-center mb-6">
          <div className="bg-primary p-4 rounded-full shadow-lg shadow-primary/20">
            <Gamepad2 className="w-12 h-12 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2">
            {mode === 'login' ? 'Welcome Back!' : 'Create an Account'}
        </h2>
        <p className="text-textMuted text-center mb-6">
            {mode === 'login' ? 'We are so excited to see you again!' : 'Join the server and start chatting.'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-textMuted uppercase mb-2">Username</label>
            <div className="relative">
                <UserIcon className="absolute left-3 top-3 text-textMuted w-5 h-5" />
                <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-background border border-border text-text p-3 pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="CoolUser123"
                required
                />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-textMuted uppercase mb-2">Password</label>
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-textMuted w-5 h-5" />
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border text-text p-3 pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="••••••••"
                required
                />
            </div>
          </div>
          
          {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase mb-2">Avatar URL (Optional)</label>
                <div className="relative">
                <ImageIcon className="absolute left-3 top-3 text-textMuted w-5 h-5" />
                <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full bg-background border border-border text-text p-3 pl-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder="https://example.com/me.png"
                />
                </div>
                {avatarUrl && (
                <div className="mt-2 flex justify-center">
                    <img src={avatarUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-primary" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                )}
            </div>
          )}

          {error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded text-center font-medium">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primaryHover text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Register')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-textMuted text-sm">
                {mode === 'login' ? "Need an account?" : "Already have an account?"}
                <button 
                    onClick={() => {
                        setMode(mode === 'login' ? 'register' : 'login');
                        setError('');
                        setPassword('');
                    }}
                    className="text-primary hover:underline ml-1 font-bold"
                >
                    {mode === 'login' ? 'Register' : 'Log In'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};
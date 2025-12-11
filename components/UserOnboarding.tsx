import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '../types';
import { Gamepad2, Image as ImageIcon } from 'lucide-react';

interface Props {
  onUserCreated: (user: User) => void;
}

export const UserOnboarding: React.FC<Props> = ({ onUserCreated }) => {
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Check if username exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim())
        .single();

      if (existingUser) {
        onUserCreated(existingUser);
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ 
            username: username.trim(),
            avatar_url: avatarUrl.trim() || undefined
          }])
          .select()
          .single();

        if (createError) throw createError;
        if (newUser) onUserCreated(newUser);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create account');
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
        <h2 className="text-2xl font-bold text-center text-white mb-2">Welcome!</h2>
        <p className="text-textMuted text-center mb-6">Create your profile to join the server.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-textMuted uppercase mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-background border border-border text-text p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="CoolUser123"
              required
            />
          </div>
          
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

          {error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primaryHover text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
          >
            {loading ? 'Joining...' : 'Enter World'}
          </button>
        </form>
      </div>
    </div>
  );
};
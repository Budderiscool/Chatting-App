import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '../types';
import { Gamepad2 } from 'lucide-react';

interface Props {
  onUserCreated: (user: User) => void;
}

export const UserOnboarding: React.FC<Props> = ({ onUserCreated }) => {
  const [username, setUsername] = useState('');
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
        // If user exists, just log them in for this simplified demo
        // In a real app, you'd want some verification logic
        onUserCreated(existingUser);
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{ username: username.trim() }])
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
    <div className="min-h-screen bg-[url('https://picsum.photos/1920/1080?blur=5')] bg-cover bg-center flex items-center justify-center p-4">
      <div className="bg-discord-darker p-8 rounded shadow-2xl w-full max-w-md animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <div className="bg-discord-primary p-4 rounded-full">
            <Gamepad2 className="w-12 h-12 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2">Welcome!</h2>
        <p className="text-discord-textMuted text-center mb-6">Enter a username to join the chat.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-discord-textMuted uppercase mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-discord-darkest border-none text-discord-text p-3 rounded focus:outline-none focus:ring-2 focus:ring-discord-primary"
              placeholder="CoolUser123"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-discord-primary hover:bg-discord-primaryHover text-white font-bold py-3 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Entering...' : 'Enter Server'}
          </button>
        </form>
      </div>
    </div>
  );
};
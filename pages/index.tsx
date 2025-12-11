import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { UserOnboarding } from '../components/UserOnboarding';
import { Dashboard } from '../components/Dashboard';
import { User } from '../types';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch by ensuring we only render specific parts on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const checkSession = async () => {
      const storedUserId = localStorage.getItem('discord_clone_user_id');
      if (storedUserId) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', storedUserId)
            .single();

          if (data && !error) {
            setUser(data);
          } else {
            localStorage.removeItem('discord_clone_user_id');
          }
        } catch (err) {
          console.error("Session check failed", err);
        }
      }
      setLoading(false);
    };

    if (isSupabaseConfigured) {
      checkSession();
    } else {
      setLoading(false);
    }
  }, [isClient]);

  const handleUserCreated = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('discord_clone_user_id', newUser.id);
  };

  if (!isClient) {
    return null; // or a loading spinner
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-discord-dark p-4">
        <div className="bg-discord-darker p-8 rounded-lg shadow-xl max-w-lg w-full text-center border border-red-500/20">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-500/10 rounded-full">
               <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Connection Required</h1>
          <p className="text-discord-textMuted mb-6">
            To run this Discord clone, you need to connect it to a Supabase project.
          </p>
          
          <div className="text-left bg-discord-darkest p-4 rounded-md mb-6 space-y-3">
            <div>
              <p className="text-xs font-bold text-discord-textMuted uppercase mb-1">1. Create Project</p>
              <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-discord-primary hover:underline">
                supabase.com
              </a>
            </div>
            <div>
              <p className="text-xs font-bold text-discord-textMuted uppercase mb-1">2. Run Database Schema</p>
              <p className="text-sm text-discord-text">Run the SQL from <code className="bg-black/30 px-1 rounded">supabase_schema.sql</code></p>
            </div>
            <div>
               <p className="text-xs font-bold text-discord-textMuted uppercase mb-1">3. Set Environment Variables</p>
               <code className="text-xs text-green-400 block mt-1">NEXT_PUBLIC_SUPABASE_URL</code>
               <code className="text-xs text-green-400 block">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
            </div>
          </div>

          <button 
            onClick={() => window.location.reload()} 
            className="bg-discord-primary hover:bg-discord-primaryHover text-white px-6 py-2 rounded font-medium transition-colors w-full"
          >
            Refresh App
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-discord-dark">
        <Loader2 className="animate-spin text-discord-primary w-10 h-10" />
      </div>
    );
  }

  if (!user) {
    return <UserOnboarding onUserCreated={handleUserCreated} />;
  }

  return <Dashboard currentUser={user} />;
}
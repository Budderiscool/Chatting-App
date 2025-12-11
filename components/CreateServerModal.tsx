import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Server } from '../types';
import { X, Upload } from 'lucide-react';

interface Props {
  onClose: () => void;
  onCreated: (server: Server) => void;
}

export const CreateServerModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('servers')
      .insert({ name: name.trim() })
      .select()
      .single();

    if (data && !error) {
      onCreated(data);
    } else {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-discord-darkest w-full max-w-sm rounded-lg shadow-2xl overflow-hidden">
        <div className="p-6 relative text-center">
            <button onClick={onClose} className="absolute top-4 right-4 text-discord-textMuted hover:text-discord-text">
                <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-2">Create a Server</h2>
            <p className="text-discord-textMuted text-sm mb-6">
                Your server is where you and your friends hang out. Make yours and start talking.
            </p>
            
            <form onSubmit={handleSubmit}>
                 <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-discord-textMuted flex items-center justify-center text-discord-textMuted hover:border-discord-text hover:text-discord-text transition-colors cursor-pointer bg-discord-dark">
                        <div className="text-center">
                            <Upload className="mx-auto mb-1" />
                            <span className="text-xs uppercase font-bold">Upload</span>
                        </div>
                    </div>
                 </div>

                <div className="text-left mb-6">
                    <label className="block text-xs font-bold text-discord-textMuted uppercase mb-2">Server Name</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-discord-darker p-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="My Awesome Server"
                        required
                    />
                </div>

                <div className="bg-discord-darker -mx-6 -mb-6 p-4 flex justify-between items-center">
                    <button type="button" onClick={onClose} className="text-white text-sm font-medium hover:underline">
                        Back
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-discord-primary hover:bg-discord-primaryHover text-white px-6 py-2 rounded font-medium transition-colors"
                    >
                        {loading ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};
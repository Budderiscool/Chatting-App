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
      <div className="bg-surface w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-border">
        <div className="p-6 relative text-center">
            <button onClick={onClose} className="absolute top-4 right-4 text-textMuted hover:text-white transition-colors">
                <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-2">Create a Server</h2>
            <p className="text-textMuted text-sm mb-6">
                Your server is where you and your friends hang out. Make yours and start talking.
            </p>
            
            <form onSubmit={handleSubmit}>
                 <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-textMuted flex items-center justify-center text-textMuted hover:border-white hover:text-white transition-all cursor-pointer bg-surfaceHighlight group">
                        <div className="text-center group-hover:scale-105 transition-transform">
                            <Upload className="mx-auto mb-1" />
                            <span className="text-xs uppercase font-bold">Upload</span>
                        </div>
                    </div>
                 </div>

                <div className="text-left mb-6">
                    <label className="block text-xs font-bold text-textMuted uppercase mb-2">Server Name</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-background border border-border p-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="My Awesome Server"
                        required
                    />
                </div>

                <div className="bg-surfaceHighlight -mx-6 -mb-6 p-4 flex justify-between items-center border-t border-border">
                    <button type="button" onClick={onClose} className="text-white text-sm font-medium hover:underline">
                        Back
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-primary hover:bg-primaryHover text-white px-6 py-2 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
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
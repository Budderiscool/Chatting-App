import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Channel } from '../types';
import { X, Hash, Volume2 } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  serverId: string;
  onClose: () => void;
  onCreated: (channel: Channel) => void;
}

export const CreateChannelModal: React.FC<Props> = ({ serverId, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'text' | 'voice'>('text');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('channels')
      .insert({ 
          server_id: serverId, 
          name: name.trim().toLowerCase().replace(/\s+/g, '-') // Slugify roughly
      })
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
      <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-border">
        <div className="p-5 flex justify-between items-center border-b border-border bg-surfaceHighlight/50">
             <h2 className="text-lg font-bold text-white">Create Channel</h2>
            <button onClick={onClose} className="text-textMuted hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5">
            <div className="mb-6">
                <label className="block text-xs font-bold text-textMuted uppercase mb-2">Channel Type</label>
                <div className="space-y-2">
                    <div 
                        onClick={() => setType('text')}
                        className={clsx(
                            "flex items-center p-3 rounded-xl cursor-pointer border transition-all",
                            type === 'text' ? "bg-surfaceHighlight border-primary" : "border-border hover:bg-surfaceHighlight/50 hover:border-textMuted"
                        )}
                    >
                        <Hash className="text-textMuted mr-4" size={24} />
                        <div>
                            <div className="text-white font-medium">Text</div>
                            <div className="text-textMuted text-xs">Send messages, images, GIFS, emoji, opinions, and puns</div>
                        </div>
                        <div className={clsx("ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", type === 'text' ? "border-primary bg-primary" : "border-textMuted")}>
                             {type === 'text' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                        </div>
                    </div>
                     <div 
                        onClick={() => setType('voice')}
                        className={clsx(
                            "flex items-center p-3 rounded-xl cursor-pointer border transition-all opacity-50", 
                            type === 'voice' ? "bg-surfaceHighlight border-primary" : "border-border hover:bg-surfaceHighlight/50 hover:border-textMuted"
                        )}
                    >
                        <Volume2 className="text-textMuted mr-4" size={24} />
                        <div>
                            <div className="text-white font-medium">Voice (Coming Soon)</div>
                            <div className="text-textMuted text-xs">Hang out together with voice, video, and screen share</div>
                        </div>
                         <div className={clsx("ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", type === 'voice' ? "border-primary bg-primary" : "border-textMuted")}>
                             {type === 'voice' && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-xs font-bold text-textMuted uppercase mb-2">Channel Name</label>
                <div className="relative">
                    <Hash className="absolute left-3 top-3 text-textMuted w-5 h-5" />
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-background border border-border p-2.5 pl-10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary font-medium transition-all"
                        placeholder="new-channel"
                        required
                    />
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button type="button" onClick={onClose} className="text-white text-sm font-medium hover:underline mr-6">
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-primary hover:bg-primaryHover text-white px-6 py-2 rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
                >
                    {loading ? 'Creating...' : 'Create Channel'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
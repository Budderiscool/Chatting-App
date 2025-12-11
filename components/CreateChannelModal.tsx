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
      <div className="bg-discord-darkest w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-black/20">
             <h2 className="text-lg font-bold text-white">Create Channel</h2>
            <button onClick={onClose} className="text-discord-textMuted hover:text-discord-text">
                <X size={24} />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
            <div className="mb-6">
                <label className="block text-xs font-bold text-discord-textMuted uppercase mb-2">Channel Type</label>
                <div className="space-y-2">
                    <div 
                        onClick={() => setType('text')}
                        className={clsx(
                            "flex items-center p-3 rounded cursor-pointer",
                            type === 'text' ? "bg-discord-light" : "hover:bg-discord-darker"
                        )}
                    >
                        <Hash className="text-discord-textMuted mr-4" size={24} />
                        <div>
                            <div className="text-white font-medium">Text</div>
                            <div className="text-discord-textMuted text-xs">Send messages, images, GIFS, emoji, opinions, and puns</div>
                        </div>
                        <div className={clsx("ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center", type === 'text' ? "border-white bg-white" : "border-discord-textMuted")}>
                             {type === 'text' && <div className="w-2.5 h-2.5 rounded-full bg-discord-darkest" />}
                        </div>
                    </div>
                     <div 
                        onClick={() => setType('voice')}
                        className={clsx(
                            "flex items-center p-3 rounded cursor-pointer opacity-50", // Disabled visual for demo
                            type === 'voice' ? "bg-discord-light" : "hover:bg-discord-darker"
                        )}
                    >
                        <Volume2 className="text-discord-textMuted mr-4" size={24} />
                        <div>
                            <div className="text-white font-medium">Voice (Coming Soon)</div>
                            <div className="text-discord-textMuted text-xs">Hang out together with voice, video, and screen share</div>
                        </div>
                         <div className={clsx("ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center", type === 'voice' ? "border-white bg-white" : "border-discord-textMuted")}>
                             {type === 'voice' && <div className="w-2.5 h-2.5 rounded-full bg-discord-darkest" />}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-xs font-bold text-discord-textMuted uppercase mb-2">Channel Name</label>
                <div className="relative">
                    <Hash className="absolute left-2 top-2.5 text-discord-textMuted w-4 h-4" />
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-discord-darker p-2 pl-8 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        placeholder="new-channel"
                        required
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <button type="button" onClick={onClose} className="text-white text-sm font-medium hover:underline mr-6">
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-discord-primary hover:bg-discord-primaryHover text-white px-6 py-2 rounded font-medium transition-colors"
                >
                    {loading ? 'Creating...' : 'Create Channel'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Server, Channel, Message, User } from '../types';
import { X, Hash, Send } from 'lucide-react';

interface Props {
  message: Message;
  currentUser: User;
  onClose: () => void;
}

export const ForwardModal: React.FC<Props> = ({ message, currentUser, onClose }) => {
  const [servers, setServers] = useState<Server[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch all servers user is in
    const fetchData = async () => {
        const { data: members } = await supabase.from('server_members').select('server_id').eq('user_id', currentUser.id);
        if (members && members.length > 0) {
            const serverIds = members.map(m => m.server_id);
            const { data: serverList } = await supabase.from('servers').select('*').in('id', serverIds);
            if (serverList) {
                setServers(serverList);
                if(serverList.length > 0) setSelectedServerId(serverList[0].id);
            }
        }
    };
    fetchData();
  }, [currentUser.id]);

  useEffect(() => {
    if (selectedServerId) {
        const fetchChannels = async () => {
            const { data } = await supabase.from('channels').select('*').eq('server_id', selectedServerId).order('name');
            if (data) {
                setChannels(data);
                setSelectedChannelId(null);
            }
        };
        fetchChannels();
    }
  }, [selectedServerId]);

  const handleForward = async () => {
    if (!selectedChannelId) return;
    setLoading(true);

    // Copy content and media
    const content = message.content;
    const media_url = message.media_url;
    
    await supabase.from('messages').insert({
        channel_id: selectedChannelId,
        user_id: currentUser.id,
        content: `**Forwarded:** ${content}`,
        media_url: media_url,
        media_type: message.media_type
    });

    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-border flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-border flex justify-between items-center">
             <h3 className="font-bold text-white">Forward Message</h3>
             <button onClick={onClose}><X className="text-textMuted hover:text-white" size={20}/></button>
        </div>

        <div className="p-4 overflow-y-auto">
             <div className="bg-black/30 p-3 rounded-lg border border-white/5 mb-4 text-sm text-textMuted italic">
                "{message.content.substring(0, 100)}{message.content.length > 100 ? '...' : ''}"
             </div>

             <label className="block text-xs font-bold text-textMuted uppercase mb-2">Select Server</label>
             <div className="grid grid-cols-4 gap-2 mb-4">
                {servers.map(s => (
                    <button 
                        key={s.id}
                        onClick={() => setSelectedServerId(s.id)}
                        className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all ${selectedServerId === s.id ? 'bg-primary text-white shadow-lg scale-105' : 'bg-surfaceHighlight text-textMuted hover:bg-white/10'}`}
                    >
                        {s.name.substring(0, 2).toUpperCase()}
                    </button>
                ))}
             </div>

             {selectedServerId && (
                <>
                    <label className="block text-xs font-bold text-textMuted uppercase mb-2">Select Channel</label>
                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                        {channels.filter(c => !c.is_dm).map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedChannelId(c.id)}
                                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${selectedChannelId === c.id ? 'bg-white/10 text-white font-bold' : 'text-textMuted hover:bg-white/5'}`}
                            >
                                <Hash size={14} className="mr-2 opacity-50"/>
                                {c.name}
                            </button>
                        ))}
                    </div>
                </>
             )}
        </div>

        <div className="p-4 border-t border-border flex justify-end">
            <button 
                disabled={!selectedChannelId || loading}
                onClick={handleForward}
                className="bg-primary hover:bg-primaryHover disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold flex items-center"
            >
                <Send size={16} className="mr-2" />
                Forward
            </button>
        </div>
      </div>
    </div>
  );
};
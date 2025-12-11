import React, { useEffect, useState } from 'react';
import { Channel, Server, User } from '../types';
import { supabase } from '../supabaseClient';
import { Hash, Plus, ChevronDown, Volume2, Search, MessageSquare } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  server: Server | null;
  channels: Channel[];
  selectedChannelId?: string;
  onSelect: (channel: Channel) => void;
  onAddChannel: () => void;
  currentUser: User;
  isAdmin: boolean;
}

export const ChannelList: React.FC<Props> = ({ server, channels, selectedChannelId, onSelect, onAddChannel, currentUser, isAdmin }) => {
  const [dmUsers, setDmUsers] = useState<User[]>([]);

  // If in Home mode, fetch all users to simulate DMs
  useEffect(() => {
    if (!server) {
      const fetchUsers = async () => {
        const { data } = await supabase.from('users').select('*').neq('id', currentUser.id);
        if (data) setDmUsers(data);
      };
      fetchUsers();
    }
  }, [server]);

  // Handle clicking a user for DM
  const handleUserClick = async (targetUser: User) => {
    // Check if DM channel exists (simple hack: check for channel name "dm-id1-id2")
    const ids = [currentUser.id, targetUser.id].sort();
    const dmName = `dm-${ids[0]}-${ids[1]}`;
    
    // Check if it exists in DB (we are searching global channels for this hack to work)
    let { data: existingChannel } = await supabase.from('channels').select('*').eq('name', dmName).single();
    
    if (!existingChannel) {
        // Create it
        const { data } = await supabase.from('channels').insert({
            name: dmName,
            is_dm: true,
            server_id: null // It's a DM
        }).select().single();
        existingChannel = data;
    }

    if (existingChannel) {
        onSelect(existingChannel);
    }
  };

  if (!server) {
    // DM / Home View
    return (
        <div className="flex flex-col h-full bg-surface">
            <div className="h-16 px-6 flex items-center justify-start font-bold text-lg text-white border-b border-border bg-surfaceHighlight/30 backdrop-blur-sm shrink-0">
                <Search size={18} className="mr-2 text-textMuted" />
                <input type="text" placeholder="Find or start a conversation" className="bg-transparent focus:outline-none text-sm w-full" />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                <div className="px-3 mb-2 text-xs font-bold text-textMuted uppercase tracking-wider">Direct Messages</div>
                {dmUsers.map(user => (
                    <button key={user.id} onClick={() => handleUserClick(user)} className="w-full flex items-center px-3 py-2.5 rounded-xl hover:bg-surfaceHighlight transition-all group">
                        <div className="relative">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover mr-3" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-surfaceHighlight border border-white/10 flex items-center justify-center text-xs font-bold mr-3">{user.username[0]}</div>
                            )}
                        </div>
                        <span className="text-text font-medium group-hover:text-white transition-colors">{user.username}</span>
                    </button>
                ))}
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="h-16 px-6 flex items-center justify-between font-bold text-lg text-white border-b border-border bg-surfaceHighlight/30 backdrop-blur-sm shrink-0">
        <span className="truncate">{server.name}</span>
        <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronDown size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        <div>
            <div className="flex items-center justify-between px-3 mb-2 group">
                <span className="text-xs font-bold text-textMuted uppercase tracking-wider">Text Channels</span>
                {isAdmin && (
                    <button onClick={onAddChannel} className="text-textMuted hover:text-white p-1 hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Plus size={14} />
                    </button>
                )}
            </div>
            <div className="space-y-1">
            {channels.filter(c => !c.name.includes('voice')).map((channel) => (
                <button
                key={channel.id}
                onClick={() => onSelect(channel)}
                className={clsx(
                    "w-full flex items-center px-3 py-2.5 rounded-xl mx-0 group transition-all duration-200",
                    selectedChannelId === channel.id ? "bg-primary/10 text-primary font-semibold shadow-sm" : "text-textMuted hover:bg-surfaceHighlight hover:text-text"
                )}
                >
                <Hash size={18} className={clsx("mr-2.5", selectedChannelId === channel.id ? "text-primary" : "text-textMuted/70")} />
                <span className="truncate">{channel.name}</span>
                </button>
            ))}
            </div>
        </div>
      </div>
      <div className="h-6 bg-gradient-to-t from-surface to-transparent shrink-0 pointer-events-none" />
    </div>
  );
};
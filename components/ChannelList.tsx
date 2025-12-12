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
  unreadChannelIds?: Set<string>;
}

export const ChannelList: React.FC<Props> = ({ server, channels, selectedChannelId, onSelect, onAddChannel, currentUser, isAdmin, unreadChannelIds = new Set() }) => {
  const [dmUsers, setDmUsers] = useState<User[]>([]);
  const [resolvedDmNames, setResolvedDmNames] = useState<{[key: string]: string}>({});

  // If in Home mode, fetch all users to simulate DMs
  useEffect(() => {
    if (!server) {
      const fetchUsers = async () => {
        const { data } = await supabase.from('users').select('*').neq('id', currentUser.id);
        if (data) setDmUsers(data as User[]);
      };
      fetchUsers();
    }
  }, [server]);

  // Resolve DM Channel Names
  useEffect(() => {
      const resolveNames = async () => {
          const dmChannels = channels.filter(c => c.is_dm);
          const newNames: {[key: string]: string} = {};
          
          const idsToFetch = new Set<string>();

          dmChannels.forEach(c => {
             // Name format: dm-ID1-ID2
             if (c.name.startsWith('dm-')) {
                 const parts = c.name.replace('dm-', '').split('-');
                 if (parts.length >= 2) {
                     // Find the ID that isn't current user
                     // Note: parts[0] is first UUID, parts[1] is second.
                     // UUID is 36 chars.
                     const id1 = c.name.substring(3, 39);
                     const id2 = c.name.substring(40);
                     const otherId = id1 === currentUser.id ? id2 : id1;
                     if (otherId) idsToFetch.add(otherId);
                 }
             }
          });

          if (idsToFetch.size > 0) {
              const { data: users } = await supabase.from('users').select('id, username').in('id', Array.from(idsToFetch));
              
              if (users) {
                  const userMap = new Map((users as any[]).map((u: any) => [u.id, u.username] as [string, string]));
                   dmChannels.forEach(c => {
                        const id1 = c.name.substring(3, 39);
                        const id2 = c.name.substring(40);
                        const otherId = id1 === currentUser.id ? id2 : id1;
                        if (userMap.has(otherId)) {
                            newNames[c.id] = userMap.get(otherId)!;
                        }
                   });
              }
          }
          setResolvedDmNames(newNames);
      };

      if (server) {
        resolveNames();
      }
  }, [channels, server, currentUser.id]);

  // Handle clicking a user for DM (Home Screen)
  const handleUserClick = async (targetUser: User) => {
    const ids = [currentUser.id, targetUser.id].sort();
    const dmName = `dm-${ids[0]}-${ids[1]}`;
    
    // Check if it exists in DB (global search for DMs)
    let { data: existingChannel } = await supabase.from('channels').select('*').eq('name', dmName).single();
    
    if (!existingChannel) {
        // Create it
        const { data } = await supabase.from('channels').insert({
            name: dmName,
            is_dm: true,
            server_id: null
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
                <div className="px-3 mb-2 text-xs font-bold text-textMuted uppercase tracking-wider">Start a Conversation</div>
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

  // Server View
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
            {channels.filter(c => !c.name.includes('voice')).map((channel) => {
                // If by some chance a DM channel ends up in a server list (data error), handle name
                const displayName = channel.is_dm ? (resolvedDmNames[channel.id] || "Loading...") : channel.name;
                const isUnread = unreadChannelIds.has(channel.id) && selectedChannelId !== channel.id;

                return (
                    <button
                        key={channel.id}
                        onClick={() => onSelect(channel)}
                        className={clsx(
                            "w-full flex items-center px-3 py-2.5 rounded-xl mx-0 group transition-all duration-200 justify-between",
                            selectedChannelId === channel.id ? "bg-primary/10 text-primary font-semibold shadow-sm" : isUnread ? "text-white bg-white/5" : "text-textMuted hover:bg-surfaceHighlight hover:text-text"
                        )}
                    >
                        <div className="flex items-center truncate">
                            <Hash size={18} className={clsx("mr-2.5", selectedChannelId === channel.id ? "text-primary" : "text-textMuted/70")} />
                            <span className={clsx("truncate", isUnread && "font-bold text-white")}>{displayName}</span>
                        </div>
                        {isUnread && (
                            <div className="w-2 h-2 rounded-full bg-white ml-2 shrink-0"></div>
                        )}
                    </button>
                );
            })}
            </div>
        </div>
      </div>
      <div className="h-6 bg-gradient-to-t from-surface to-transparent shrink-0 pointer-events-none" />
    </div>
  );
};
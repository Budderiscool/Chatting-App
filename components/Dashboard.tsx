import React, { useState, useEffect } from 'react';
import { User, Server, Channel } from '../types';
import { supabase } from '../supabaseClient';
import { ServerList } from './ServerList';
import { ChannelList } from './ChannelList';
import { ChatView } from './ChatView';
import { MemberSidebar } from './MemberSidebar';
import { CreateServerModal } from './CreateServerModal';
import { CreateChannelModal } from './CreateChannelModal';
import { Mic, Headphones, Settings } from 'lucide-react';

interface Props {
  currentUser: User;
}

const ADMIN_ID = '8c5e27af-5d11-437b-9b0e-fbc8334a6e0b';

export const Dashboard: React.FC<Props> = ({ currentUser }) => {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  
  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [presenceState, setPresenceState] = useState<any>({});

  const isAdmin = currentUser.id === ADMIN_ID;

  // --- Presence & Realtime Logic ---
  useEffect(() => {
    // Track presence
    const presenceChannel = supabase.channel('global_presence', {
      config: { presence: { key: currentUser.id } },
    });

    const updateStatus = async (status: 'online' | 'offline') => {
      await presenceChannel.track({ 
        user_id: currentUser.id, 
        status, 
        last_seen: new Date().toISOString() 
      });
    };

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        setPresenceState(presenceChannel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await updateStatus('online');
        }
      });

    // Window Focus/Blur listeners
    const handleFocus = () => updateStatus('online');
    const handleBlur = () => updateStatus('offline');

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser.id]);

  // --- Data Fetching ---
  useEffect(() => {
    fetchServers();
    const serverSub = supabase
      .channel('public:servers')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'servers' }, (payload) => {
        setServers(prev => [...prev, payload.new as Server]);
      })
      .subscribe();
    return () => { supabase.removeChannel(serverSub); };
  }, []);

  useEffect(() => {
    if (selectedServer) {
      fetchChannels(selectedServer.id);
      ensureMembership(selectedServer.id);
    } else {
      // Home mode (DMs)
      setChannels([]); 
      setSelectedChannel(null);
    }
  }, [selectedServer]);

  const fetchServers = async () => {
    const { data } = await supabase.from('servers').select('*').order('created_at', { ascending: true });
    if (data) {
      setServers(data);
      if (data.length > 0 && !selectedServer) setSelectedServer(data[0]);
    }
  };

  const fetchChannels = async (serverId: string) => {
    const { data } = await supabase.from('channels').select('*').eq('server_id', serverId).order('created_at', { ascending: true });
    if (data) {
      setChannels(data);
      if (data.length > 0) setSelectedChannel(data[0]);
    }
  };

  const ensureMembership = async (serverId: string) => {
    const { data } = await supabase.from('server_members').select('*').eq('server_id', serverId).eq('user_id', currentUser.id).single();
    if (!data) await supabase.from('server_members').insert({ server_id: serverId, user_id: currentUser.id });
  };

  const handleServerCreated = (newServer: Server) => {
    setSelectedServer(newServer);
    setIsCreateServerOpen(false);
    createDefaultChannel(newServer.id);
  };

  const createDefaultChannel = async (serverId: string) => {
    await supabase.from('channels').insert({ server_id: serverId, name: 'general' });
    fetchChannels(serverId);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background p-4 gap-4">
      {/* Top Workspace Area */}
      <div className="flex flex-1 min-h-0 gap-4">
        {/* Left: Channel List or DM List */}
        <div className="w-72 bg-surface rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden">
          <ChannelList 
            server={selectedServer}
            channels={channels}
            selectedChannelId={selectedChannel?.id}
            onSelect={setSelectedChannel}
            onAddChannel={() => setIsCreateChannelOpen(true)}
            currentUser={currentUser}
            isAdmin={isAdmin}
          />
        </div>

        {/* Center: Chat */}
        <div className="flex-1 bg-surface rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden relative">
          <ChatView 
            channel={selectedChannel} 
            currentUser={currentUser}
          />
        </div>
        
        {/* Right: Members (Only if server selected) */}
        {selectedServer && (
          <div className="w-72 bg-surface rounded-3xl border border-border shadow-2xl hidden lg:flex flex-col overflow-hidden">
            <MemberSidebar serverId={selectedServer.id} presenceState={presenceState} />
          </div>
        )}
      </div>

      {/* Bottom Dock */}
      <div className="h-20 bg-surface/80 backdrop-blur-md rounded-3xl border border-white/5 flex items-center justify-between px-6 shadow-2xl z-50 shrink-0">
        <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar flex-1">
          <ServerList 
            servers={servers} 
            selectedServerId={selectedServer?.id} 
            onSelect={setSelectedServer}
            onAddServer={() => setIsCreateServerOpen(true)}
            isAdmin={isAdmin}
          />
        </div>

        <div className="flex items-center gap-4 pl-6 border-l border-white/10 ml-4 shrink-0">
            <div className="flex items-center gap-3">
                <div className="relative">
                    {currentUser.avatar_url ? (
                         <img src={currentUser.avatar_url} alt="User" className="w-10 h-10 rounded-full object-cover shadow-lg" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {currentUser.username.substring(0, 1).toUpperCase()}
                        </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full"></div>
                </div>
                <div className="hidden sm:block">
                    <div className="text-white font-bold text-sm leading-tight">{currentUser.username}</div>
                    <div className="text-textMuted text-xs leading-tight">#{currentUser.id.substring(0, 4)}</div>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button className="p-2 text-textMuted hover:text-white hover:bg-white/10 rounded-full transition-colors"><Mic size={18} /></button>
                <button className="p-2 text-textMuted hover:text-white hover:bg-white/10 rounded-full transition-colors"><Headphones size={18} /></button>
                <button className="p-2 text-textMuted hover:text-white hover:bg-white/10 rounded-full transition-colors"><Settings size={18} /></button>
            </div>
        </div>
      </div>

      {/* Modals */}
      {isCreateServerOpen && isAdmin && (
        <CreateServerModal onClose={() => setIsCreateServerOpen(false)} onCreated={handleServerCreated} />
      )}
      {isCreateChannelOpen && selectedServer && isAdmin && (
        <CreateChannelModal serverId={selectedServer.id} onClose={() => setIsCreateChannelOpen(false)} onCreated={(ch) => {
            setChannels(prev => [...prev, ch]);
            setSelectedChannel(ch);
            setIsCreateChannelOpen(false);
        }} />
      )}
    </div>
  );
};
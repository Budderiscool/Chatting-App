import React, { useState, useEffect } from 'react';
import { User, Server, Channel, Message, CLIENT_VERSION } from '../types';
import { supabase } from '../supabaseClient';
import { ServerList } from './ServerList';
import { ChannelList } from './ChannelList';
import { ChatView } from './ChatView';
import { MemberSidebar } from './MemberSidebar';
import { CreateServerModal } from './CreateServerModal';
import { CreateChannelModal } from './CreateChannelModal';
import { SettingsModal } from './SettingsModal';
import { AnnouncementBar } from './AnnouncementBar';
import { Mic, Headphones, Settings, Bell, RefreshCw } from 'lucide-react';

interface Props {
  currentUser: User;
}

const ADMIN_ID = '8c5e27af-5d11-437b-9b0e-fbc8334a6e0b';

export const Dashboard: React.FC<Props> = ({ currentUser: initialUser }) => {
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  
  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [presenceState, setPresenceState] = useState<any>({});
  
  // Unread State
  const [unreadChannelIds, setUnreadChannelIds] = useState<Set<string>>(new Set());
  const [unreadServerIds, setUnreadServerIds] = useState<Set<string>>(new Set());

  // Notification Toasts
  const [toasts, setToasts] = useState<{id: number, message: string}[]>([]);

  // Version Control
  const [requiredVersion, setRequiredVersion] = useState(CLIENT_VERSION);

  const isAdmin = currentUser.id === ADMIN_ID;

  // --- Version Check ---
  useEffect(() => {
    // 1. Initial Check
    const checkVersion = async () => {
        const { data } = await supabase.from('app_config').select('value').eq('key', 'min_client_version').single();
        if (data) {
            setRequiredVersion(data.value);
        }
    };
    checkVersion();

    // 2. Realtime Subscription
    const versionSub = supabase.channel('config-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, (payload) => {
            if (payload.new && (payload.new as any).key === 'min_client_version') {
                setRequiredVersion((payload.new as any).value);
            }
        })
        .subscribe();

    return () => { supabase.removeChannel(versionSub); };
  }, []);

  const isVersionMismatch = requiredVersion !== CLIENT_VERSION;

  // --- Global Notification Listener ---
  useEffect(() => {
    const channel = supabase
        .channel('global-mentions')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
            const msg = payload.new as Message;
            // Mentions logic: Check if message contains @Username
            if (msg.user_id !== currentUser.id && msg.content.includes(`@${currentUser.username}`)) {
                 // Fetch sender name
                 const { data: sender } = await supabase.from('users').select('username').eq('id', msg.user_id).single();
                 const text = `${sender?.username || 'Someone'} mentioned you: "${msg.content.substring(0, 30)}..."`;
                 
                 const id = Date.now();
                 setToasts(prev => [...prev, { id, message: text }]);

                 setTimeout(() => {
                     setToasts(prev => prev.filter(t => t.id !== id));
                 }, 5000);
            }
        })
        .subscribe();
    
    return () => { supabase.removeChannel(channel); }
  }, [currentUser]);

  // --- Unread Logic ---
  const fetchUnreads = async () => {
      // 1. Get all channels the user has access to (simplified: get all channels, filtering by user membership is heavier but safer)
      // For this demo, we assume user can see all public channels. 
      // We need channel Last Message At
      const { data: allChannels } = await supabase.from('channels').select('id, server_id, last_message_at');
      
      // 2. Get user's read states
      const { data: reads } = await supabase.from('channel_reads').select('channel_id, last_read_at').eq('user_id', currentUser.id);
      
      const readMap = new Map();
      reads?.forEach(r => readMap.set(r.channel_id, r.last_read_at));

      const unreadCh = new Set<string>();
      const unreadSv = new Set<string>();

      allChannels?.forEach((ch: any) => {
          if (!ch.last_message_at) return;
          
          // Skip if currently selected
          if (selectedChannel && ch.id === selectedChannel.id) return;

          const lastRead = readMap.get(ch.id);
          // If never read, or last message is newer than last read
          if (!lastRead || new Date(ch.last_message_at) > new Date(lastRead)) {
              unreadCh.add(ch.id);
              if (ch.server_id) unreadSv.add(ch.server_id);
          }
      });
      
      setUnreadChannelIds(unreadCh);
      setUnreadServerIds(unreadSv);
  };

  // Poll for unreads occasionally or set up complex realtime listeners
  // For simplicity, we poll every 30s and also trigger on realtime message events
  useEffect(() => {
      fetchUnreads();
      const interval = setInterval(fetchUnreads, 30000);

      // Listen for ANY new message to update unreads
      const sub = supabase.channel('global-unreads')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
             // Delay slightly to allow DB trigger to update channel last_message_at
             setTimeout(fetchUnreads, 1000);
        })
        .subscribe();

      return () => { clearInterval(interval); supabase.removeChannel(sub); };
  }, [selectedChannel, currentUser.id]);

  // Mark current channel as read
  useEffect(() => {
      if (selectedChannel) {
          // Optimistically remove from unread set
          setUnreadChannelIds(prev => {
              const next = new Set(prev);
              next.delete(selectedChannel.id);
              return next;
          });
          
          // Update DB
          supabase.from('channel_reads').upsert(
              { user_id: currentUser.id, channel_id: selectedChannel.id, last_read_at: new Date().toISOString() }, 
              { onConflict: 'user_id,channel_id' }
          ).then(() => {
              // Re-evaluate server unreads after a short delay
              setTimeout(fetchUnreads, 500);
          });
      }
  }, [selectedChannel]);


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

  const handleLogout = () => {
    localStorage.removeItem('discord_clone_user_id');
    window.location.reload();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background relative">
      <AnnouncementBar isAdmin={isAdmin} />
      
      <div className="flex flex-1 min-h-0 gap-4 p-4 pt-2">
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
            unreadChannelIds={unreadChannelIds}
          />
        </div>

        {/* Center: Chat */}
        <div className="flex-1 bg-surface rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden relative">
          <ChatView 
            channel={selectedChannel} 
            currentUser={currentUser}
            presenceState={presenceState}
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
      <div className="h-20 bg-surface/80 backdrop-blur-md rounded-3xl border border-white/5 flex items-center justify-between px-6 shadow-2xl z-50 shrink-0 mx-4 mb-4">
        <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar flex-1">
          <ServerList 
            servers={servers} 
            selectedServerId={selectedServer?.id} 
            onSelect={setSelectedServer}
            onAddServer={() => setIsCreateServerOpen(true)}
            isAdmin={isAdmin}
            unreadServerIds={unreadServerIds}
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
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-textMuted hover:text-white hover:bg-white/10 rounded-full transition-colors"><Settings size={18} /></button>
            </div>
            
            {/* Version Indicator */}
            <div className="border-l border-white/10 pl-4 flex items-center">
                 {isVersionMismatch ? (
                     <button 
                        onClick={() => window.location.reload()}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all animate-pulse"
                     >
                        <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '3s' }} />
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-extrabold uppercase leading-none">Mismatched Version</span>
                            <span className="text-[10px] leading-none mt-0.5">Click to Reload</span>
                        </div>
                     </button>
                 ) : (
                    <div className="text-[10px] text-white/20 font-mono select-none" title={`v${CLIENT_VERSION}`}>
                        v{CLIENT_VERSION}
                    </div>
                 )}
            </div>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-24 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
            <div key={toast.id} className="bg-surfaceHighlight border border-primary/50 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 fade-in duration-300 pointer-events-auto max-w-sm">
                <Bell className="text-primary shrink-0" size={20} />
                <span className="text-sm font-medium">{toast.message}</span>
            </div>
        ))}
      </div>

      {/* Modals */}
      {isCreateServerOpen && (
        <CreateServerModal 
          onClose={() => setIsCreateServerOpen(false)} 
          onCreated={handleServerCreated} 
        />
      )}

      {isCreateChannelOpen && selectedServer && (
        <CreateChannelModal 
          serverId={selectedServer.id} 
          onClose={() => setIsCreateChannelOpen(false)} 
          onCreated={(channel) => {
             setIsCreateChannelOpen(false);
             fetchChannels(selectedServer.id);
          }} 
        />
      )}

      {isSettingsOpen && (
          <SettingsModal 
            user={currentUser}
            onClose={() => setIsSettingsOpen(false)}
            onUpdate={setCurrentUser}
            onLogout={handleLogout}
          />
      )}
    </div>
  );
};
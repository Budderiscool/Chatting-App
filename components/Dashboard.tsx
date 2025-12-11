import React, { useState, useEffect } from 'react';
import { User, Server, Channel } from '../types';
import { supabase } from '../supabaseClient';
import { ServerList } from './ServerList';
import { ChannelList } from './ChannelList';
import { ChatView } from './ChatView';
import { MemberSidebar } from './MemberSidebar';
import { CreateServerModal } from './CreateServerModal';
import { CreateChannelModal } from './CreateChannelModal';

interface Props {
  currentUser: User;
}

export const Dashboard: React.FC<Props> = ({ currentUser }) => {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  
  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);

  // Fetch servers on mount
  useEffect(() => {
    fetchServers();
    
    // Subscribe to new servers
    const serverSub = supabase
      .channel('public:servers')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'servers' }, (payload) => {
        setServers(prev => [...prev, payload.new as Server]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(serverSub);
    };
  }, []);

  // Fetch channels when server changes
  useEffect(() => {
    if (selectedServer) {
      fetchChannels(selectedServer.id);
      ensureMembership(selectedServer.id);
    } else {
      setChannels([]);
      setSelectedChannel(null);
    }
  }, [selectedServer]);

  const fetchServers = async () => {
    const { data } = await supabase.from('servers').select('*').order('created_at', { ascending: true });
    if (data) {
      setServers(data);
      if (data.length > 0 && !selectedServer) {
        setSelectedServer(data[0]);
      }
    }
  };

  const fetchChannels = async (serverId: string) => {
    const { data } = await supabase.from('channels').select('*').eq('server_id', serverId).order('created_at', { ascending: true });
    if (data) {
      setChannels(data);
      if (data.length > 0) {
        setSelectedChannel(data[0]);
      } else {
        setSelectedChannel(null);
      }
    }
  };

  const ensureMembership = async (serverId: string) => {
    // Check if member
    const { data } = await supabase
      .from('server_members')
      .select('*')
      .eq('server_id', serverId)
      .eq('user_id', currentUser.id)
      .single();

    if (!data) {
      // Auto-join
      await supabase.from('server_members').insert({
        server_id: serverId,
        user_id: currentUser.id
      });
    }
  };

  const handleServerCreated = (newServer: Server) => {
    // Server subscription will catch it, but we can optimistically set it or select it
    setSelectedServer(newServer);
    setIsCreateServerOpen(false);
    // Create default channel
    createDefaultChannel(newServer.id);
  };

  const createDefaultChannel = async (serverId: string) => {
    await supabase.from('channels').insert({ server_id: serverId, name: 'general' });
    // Channel fetch will happen via subscription or refresh
    fetchChannels(serverId);
  };

  const handleChannelCreated = (newChannel: Channel) => {
    setChannels(prev => [...prev, newChannel]);
    setSelectedChannel(newChannel);
    setIsCreateChannelOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-discord-dark">
      {/* Server List */}
      <ServerList 
        servers={servers} 
        selectedServerId={selectedServer?.id} 
        onSelect={setSelectedServer}
        onAddServer={() => setIsCreateServerOpen(true)}
      />

      {/* Channel Sidebar */}
      <ChannelList 
        server={selectedServer}
        channels={channels}
        selectedChannelId={selectedChannel?.id}
        onSelect={setSelectedChannel}
        onAddChannel={() => setIsCreateChannelOpen(true)}
        currentUser={currentUser}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-row min-w-0">
        <ChatView 
          channel={selectedChannel} 
          currentUser={currentUser}
        />
        
        {/* Members List */}
        {selectedServer && (
          <MemberSidebar serverId={selectedServer.id} />
        )}
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
          onCreated={handleChannelCreated}
        />
      )}
    </div>
  );
};
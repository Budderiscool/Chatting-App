import React, { useEffect, useState } from 'react';
import { ServerMember } from '../types';
import { supabase } from '../supabaseClient';

interface Props {
  serverId: string;
}

export const MemberSidebar: React.FC<Props> = ({ serverId }) => {
  const [members, setMembers] = useState<ServerMember[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('server_members')
        .select(`
          *,
          users (
            username
          )
        `)
        .eq('server_id', serverId);
        
      if (data) {
        setMembers(data as ServerMember[]);
      }
    };

    fetchMembers();

    // In a real app, subscribe to presence or member changes
    const sub = supabase.channel('public:server_members')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'server_members', 
        filter: `server_id=eq.${serverId}`
      }, () => {
        fetchMembers();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(sub);
    };
  }, [serverId]);

  return (
    <div className="w-60 bg-discord-darker hidden lg:flex flex-col p-3 overflow-y-auto">
      <h3 className="text-xs font-bold text-discord-textMuted uppercase mb-4 px-2">
        Online — {members.length}
      </h3>
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center px-2 py-1.5 rounded hover:bg-discord-light/50 cursor-pointer opacity-90 hover:opacity-100">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center text-white text-sm font-bold">
                {member.users?.username.substring(0, 1).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-discord-darker rounded-full"></div>
            </div>
            <div className="ml-3">
              <div className="text-white text-sm font-medium">
                {member.users?.username}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { ServerMember } from '../types';
import { supabase } from '../supabaseClient';
import { Crown, Circle } from 'lucide-react';

interface Props {
  serverId: string;
}

export const MemberSidebar: React.FC<Props> = ({ serverId }) => {
  const [members, setMembers] = useState<ServerMember[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('server_members')
        .select(`*, users (username)`)
        .eq('server_id', serverId);
        
      if (data) {
        setMembers(data as ServerMember[]);
      }
    };

    fetchMembers();

    const sub = supabase.channel('public:server_members')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'server_members', 
        filter: `server_id=eq.${serverId}`
      }, () => fetchMembers())
      .subscribe();
      
    return () => {
      supabase.removeChannel(sub);
    };
  }, [serverId]);

  return (
    <div className="flex flex-col h-full bg-surface p-4 overflow-y-auto custom-scrollbar">
      
      {/* Category Header */}
      <h3 className="text-xs font-extrabold text-textMuted uppercase mb-4 px-2 tracking-widest flex items-center">
        <span className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
        Online — {members.length}
      </h3>

      <div className="space-y-1">
        {members.map((member) => (
          <div key={member.id} className="flex items-center p-2 rounded-xl hover:bg-surfaceHighlight cursor-pointer group transition-all duration-200">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center text-white text-sm font-bold shadow-md">
                {member.users?.username.substring(0, 1).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full shadow-sm"></div>
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <div className="text-text font-semibold text-sm truncate flex items-center">
                <span className={member.id === members[0]?.id ? "text-pink-300" : "text-text"}>
                    {member.users?.username}
                </span>
                {member.id === members[0]?.id && (
                     <Crown size={12} className="ml-1.5 text-yellow-400 fill-yellow-400" />
                )}
              </div>
              <div className="text-xs text-textMuted/70 truncate group-hover:text-textMuted transition-colors">
                 Chilling...
              </div>
            </div>
          </div>
        ))}
      </div>
      
       {/* Offline Category */}
       <h3 className="text-xs font-extrabold text-textMuted uppercase mb-4 mt-8 px-2 tracking-widest flex items-center">
         <span className="w-2 h-2 rounded-full bg-textMuted mr-2"></span>
        Offline — 2
      </h3>
      
      <div className="space-y-1 opacity-60">
        <div className="flex items-center p-2 rounded-xl hover:bg-surfaceHighlight cursor-pointer transition-all duration-200 grayscale hover:grayscale-0">
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shrink-0">B</div>
            <div className="ml-3 text-sm font-medium">BotUser</div>
        </div>
        <div className="flex items-center p-2 rounded-xl hover:bg-surfaceHighlight cursor-pointer transition-all duration-200 grayscale hover:grayscale-0">
            <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center text-white font-bold shrink-0">M</div>
            <div className="ml-3 text-sm font-medium">Moderator</div>
        </div>
      </div>

    </div>
  );
};
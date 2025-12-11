import React, { useEffect, useState } from 'react';
import { ServerMember } from '../types';
import { supabase } from '../supabaseClient';
import { Crown } from 'lucide-react';

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
    <div className="w-60 bg-discord-darker hidden lg:flex flex-col p-3 overflow-y-auto custom-scrollbar flex-shrink-0">
      
      {/* Category Header */}
      <h3 className="text-xs font-bold text-discord-textMuted uppercase mb-2 px-2 pt-4">
        Online — {members.length}
      </h3>

      <div className="space-y-[2px]">
        {members.map((member) => (
          <div key={member.id} className="flex items-center px-2.5 py-1.5 rounded hover:bg-discord-light/60 cursor-pointer group opacity-90 hover:opacity-100 transition-opacity">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                {member.users?.username.substring(0, 1).toUpperCase()}
              </div>
              <div className="absolute bottom-[-2px] right-[-2px] w-4 h-4 bg-discord-darker flex items-center justify-center rounded-full">
                  <div className="w-2.5 h-2.5 bg-discord-green rounded-full"></div>
              </div>
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate flex items-center">
                <span className={member.id === members[0]?.id ? "text-[#E0A6C3]" : "text-discord-text"}>
                    {member.users?.username}
                </span>
                {/* Fake "Owner" crown for the first user in list just for visuals */}
                {member.id === members[0]?.id && (
                     <Crown size={12} className="ml-1.5 text-[#E5C600]" fill="#E5C600" />
                )}
              </div>
              {/* Optional Status Text */}
              <div className="text-xs text-discord-textMuted truncate opacity-0 group-hover:opacity-100 transition-opacity">
                 Playing Visual Studio Code
              </div>
            </div>
          </div>
        ))}
      </div>
      
       {/* Fake Offline Category */}
       <h3 className="text-xs font-bold text-discord-textMuted uppercase mb-2 px-2 pt-6">
        Offline — 2
      </h3>
      <div className="flex items-center px-2.5 py-1.5 rounded hover:bg-discord-light/60 cursor-pointer opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all">
         <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            B
         </div>
          <div className="ml-3 text-discord-text text-sm font-medium">
             BotUser
          </div>
      </div>
       <div className="flex items-center px-2.5 py-1.5 rounded hover:bg-discord-light/60 cursor-pointer opacity-50 hover:opacity-100 grayscale hover:grayscale-0 transition-all">
         <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            M
         </div>
          <div className="ml-3 text-discord-text text-sm font-medium">
             Moderator
          </div>
      </div>

    </div>
  );
};
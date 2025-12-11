import React, { useEffect, useState } from 'react';
import { ServerMember } from '../types';
import { supabase } from '../supabaseClient';
import { Crown } from 'lucide-react';

interface Props {
  serverId: string;
  presenceState: any;
}

export const MemberSidebar: React.FC<Props> = ({ serverId, presenceState }) => {
  const [members, setMembers] = useState<ServerMember[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase.from('server_members').select(`*, users (id, username, avatar_url)`).eq('server_id', serverId);
      if (data) setMembers(data as ServerMember[]);
    };

    fetchMembers();
    const sub = supabase.channel('public:server_members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'server_members', filter: `server_id=eq.${serverId}` }, () => fetchMembers())
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [serverId]);

  // Determine Online/Offline based on Supabase Presence
  const onlineMemberIds = new Set();
  Object.values(presenceState).forEach((presences: any) => {
    presences.forEach((p: any) => {
        if (p.status === 'online') onlineMemberIds.add(p.user_id);
    });
  });

  const onlineMembers = members.filter(m => onlineMemberIds.has(m.users?.id));
  const offlineMembers = members.filter(m => !onlineMemberIds.has(m.users?.id));

  const MemberItem = ({ member, isOnline }: { member: ServerMember, isOnline: boolean }) => (
    <div className={`flex items-center p-2 rounded-xl hover:bg-surfaceHighlight cursor-pointer group transition-all duration-200 ${!isOnline ? 'opacity-50 grayscale hover:grayscale-0 hover:opacity-100' : ''}`}>
        <div className="relative shrink-0">
            {member.users?.avatar_url ? (
                <img src={member.users.avatar_url} className="w-9 h-9 rounded-full object-cover" />
            ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {member.users?.username[0]}
                </div>
            )}
            {isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full shadow-sm"></div>}
        </div>
        <div className="ml-3 flex-1 min-w-0">
            <div className="text-text font-semibold text-sm truncate flex items-center">
                <span>{member.users?.username}</span>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-surface p-4 overflow-y-auto custom-scrollbar">
      <h3 className="text-xs font-extrabold text-textMuted uppercase mb-2 px-2 tracking-widest flex items-center">
        <span className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
        Online — {onlineMembers.length}
      </h3>
      <div className="space-y-1 mb-6">{onlineMembers.map(m => <MemberItem key={m.id} member={m} isOnline={true} />)}</div>

      <h3 className="text-xs font-extrabold text-textMuted uppercase mb-2 px-2 tracking-widest flex items-center">
         <span className="w-2 h-2 rounded-full bg-textMuted mr-2"></span>
        Offline — {offlineMembers.length}
      </h3>
      <div className="space-y-1">{offlineMembers.map(m => <MemberItem key={m.id} member={m} isOnline={false} />)}</div>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Megaphone, X, Edit2, Save, Trash } from 'lucide-react';

interface Props {
  isAdmin: boolean;
}

export const AnnouncementBar: React.FC<Props> = ({ isAdmin }) => {
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  // Load initial state
  useEffect(() => {
    const fetchData = async () => {
      const { data: msgData } = await supabase.from('app_config').select('value').eq('key', 'announcement_message').single();
      const { data: activeData } = await supabase.from('app_config').select('value').eq('key', 'announcement_active').single();
      
      if (msgData) setMessage(msgData.value);
      if (activeData) setIsActive(activeData.value === 'true');
    };

    fetchData();

    // Check local storage for close state
    const closed = sessionStorage.getItem('announcement_closed');
    if (closed) setIsVisible(false);

    const sub = supabase.channel('config-announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, (payload) => {
          if ((payload.new as any).key === 'announcement_message') setMessage((payload.new as any).value);
          if ((payload.new as any).key === 'announcement_active') setIsActive((payload.new as any).value === 'true');
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [message]); // re-run if message changes to check sessionStorage again if needed, though mainly just on mount

  const handleSave = async () => {
    await supabase.from('app_config').upsert({ key: 'announcement_message', value: editValue });
    await supabase.from('app_config').upsert({ key: 'announcement_active', value: 'true' });
    setIsEditing(false);
    setMessage(editValue);
    setIsActive(true);
  };

  const handleDisable = async () => {
      await supabase.from('app_config').upsert({ key: 'announcement_active', value: 'false' });
      setIsEditing(false);
  };

  const handleClose = () => {
      setIsVisible(false);
      sessionStorage.setItem('announcement_closed', 'true');
  };

  if (!isActive && !isAdmin) return null;
  if (!isVisible && !isAdmin) return null; // Admin always sees it to edit

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 flex items-center justify-between shadow-lg relative z-[60]">
      <div className="flex items-center gap-3 flex-1">
        <Megaphone className="fill-white text-indigo-600" size={20} />
        {isEditing ? (
            <input 
                type="text" 
                value={editValue} 
                onChange={(e) => setEditValue(e.target.value)}
                className="bg-white/20 border border-white/30 rounded px-2 py-1 text-sm text-white placeholder-white/50 focus:outline-none w-full max-w-xl"
                placeholder="Enter announcement..."
            />
        ) : (
            <span className="font-medium text-sm drop-shadow-md">
                {message || "No announcement set."}
                {!isActive && isAdmin && <span className="ml-2 text-xs bg-black/30 px-2 py-0.5 rounded text-white/70">(Hidden from users)</span>}
            </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && !isEditing && (
            <button 
                onClick={() => { setIsEditing(true); setEditValue(message); }} 
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Edit Announcement"
            >
                <Edit2 size={16} />
            </button>
        )}
        
        {isAdmin && isEditing && (
            <>
                <button onClick={handleSave} className="p-1.5 bg-green-500/80 hover:bg-green-500 rounded-lg transition-colors" title="Save">
                    <Save size={16} />
                </button>
                <button onClick={handleDisable} className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors" title="Disable/Delete">
                    <Trash size={16} />
                </button>
                <button onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Cancel">
                    <X size={16} />
                </button>
            </>
        )}

        {!isEditing && (
            <button onClick={handleClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X size={18} />
            </button>
        )}
      </div>
    </div>
  );
};

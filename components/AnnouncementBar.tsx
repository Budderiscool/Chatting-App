import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Megaphone, X, Edit2, Save, Trash, Clock } from 'lucide-react';
import { addHours, addDays, isPast, parseISO } from 'date-fns';

interface Props {
  isAdmin: boolean;
}

export const AnnouncementBar: React.FC<Props> = ({ isAdmin }) => {
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  
  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [duration, setDuration] = useState('24h'); // default 1 day

  // Visibility (Local State only - resets on refresh)
  const [isVisible, setIsVisible] = useState(true);

  // Load initial state
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('app_config').select('key, value').in('key', ['announcement_message', 'announcement_active', 'announcement_expires_at']);
      
      if (data) {
        data.forEach(row => {
            if (row.key === 'announcement_message') setMessage(row.value);
            if (row.key === 'announcement_active') setIsActive(row.value === 'true');
            if (row.key === 'announcement_expires_at') setExpiresAt(row.value);
        });
      }
    };

    fetchData();

    const sub = supabase.channel('config-announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, (payload) => {
          const key = (payload.new as any).key;
          const val = (payload.new as any).value;
          if (key === 'announcement_message') setMessage(val);
          if (key === 'announcement_active') setIsActive(val === 'true');
          if (key === 'announcement_expires_at') setExpiresAt(val);
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const handleSave = async () => {
    let newExpiry = '';
    const now = new Date();
    
    if (duration === '1h') newExpiry = addHours(now, 1).toISOString();
    else if (duration === '24h') newExpiry = addDays(now, 1).toISOString();
    else if (duration === '7d') newExpiry = addDays(now, 7).toISOString();
    else if (duration === 'forever') newExpiry = '';

    await supabase.from('app_config').upsert({ key: 'announcement_message', value: editValue });
    await supabase.from('app_config').upsert({ key: 'announcement_active', value: 'true' });
    await supabase.from('app_config').upsert({ key: 'announcement_expires_at', value: newExpiry });
    
    setIsEditing(false);
    setMessage(editValue);
    setIsActive(true);
    setExpiresAt(newExpiry);
  };

  const handleDisable = async () => {
      await supabase.from('app_config').upsert({ key: 'announcement_active', value: 'false' });
      setIsEditing(false);
  };

  // Check Expiry
  const isExpired = expiresAt && expiresAt !== '' && isPast(parseISO(expiresAt));

  if (!isAdmin && (!isActive || isExpired)) return null;
  if (!isVisible && !isAdmin) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 flex items-center justify-between shadow-lg relative z-[60]">
      <div className="flex items-center gap-3 flex-1">
        <Megaphone className="fill-white text-indigo-600 shrink-0" size={20} />
        {isEditing ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full">
                <input 
                    type="text" 
                    value={editValue} 
                    onChange={(e) => setEditValue(e.target.value)}
                    className="bg-white/20 border border-white/30 rounded px-2 py-1 text-sm text-white placeholder-white/50 focus:outline-none flex-1"
                    placeholder="Enter announcement..."
                />
                <select 
                    value={duration} 
                    onChange={(e) => setDuration(e.target.value)}
                    className="bg-white/20 border border-white/30 rounded px-2 py-1 text-sm text-white focus:outline-none"
                >
                    <option value="1h" className="text-black">1 Hour</option>
                    <option value="24h" className="text-black">24 Hours</option>
                    <option value="7d" className="text-black">7 Days</option>
                    <option value="forever" className="text-black">Forever</option>
                </select>
            </div>
        ) : (
            <span className="font-medium text-sm drop-shadow-md flex items-center gap-2">
                {message || "No announcement set."}
                {isAdmin && (
                    <>
                        {!isActive && <span className="text-[10px] bg-red-500/50 px-1.5 py-0.5 rounded border border-red-400/50">Disabled</span>}
                        {isExpired && <span className="text-[10px] bg-orange-500/50 px-1.5 py-0.5 rounded border border-orange-400/50">Expired</span>}
                    </>
                )}
            </span>
        )}
      </div>

      <div className="flex items-center gap-2 ml-4">
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
                <button onClick={handleSave} className="p-1.5 bg-green-500/80 hover:bg-green-500 rounded-lg transition-colors" title="Save & Publish">
                    <Save size={16} />
                </button>
                <button onClick={handleDisable} className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors" title="Delete/Disable">
                    <Trash size={16} />
                </button>
                <button onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Cancel">
                    <X size={16} />
                </button>
            </>
        )}

        {!isEditing && (
            <button onClick={() => setIsVisible(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X size={18} />
            </button>
        )}
      </div>
    </div>
  );
};
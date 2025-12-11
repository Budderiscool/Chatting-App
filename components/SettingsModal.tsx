import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '../types';
import { X, User as UserIcon, Lock, Check } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

interface Props {
  user: User;
  onClose: () => void;
  onUpdate: (user: User) => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<Props> = ({ user, onClose, onUpdate, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'account' | 'security'>('account');
  
  // Account State
  const [newUsername, setNewUsername] = useState(user.username);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');

  // Security State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [loading, setLoading] = useState(false);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess('');
    
    if (newUsername === user.username) return;

    // Check 30 day limit
    if (user.last_username_change) {
        const daysSinceChange = differenceInDays(new Date(), parseISO(user.last_username_change));
        if (daysSinceChange < 30) {
            setUsernameError(`You can change your username again in ${30 - daysSinceChange} days.`);
            return;
        }
    }

    setLoading(true);

    try {
        // Check uniqueness
        const { data: existing } = await supabase.from('users').select('id').eq('username', newUsername).single();
        if (existing) throw new Error('Username taken.');

        const updateData = {
            username: newUsername,
            last_username_change: new Date().toISOString()
        };

        const { error } = await supabase.from('users').update(updateData).eq('id', user.id);
        if (error) throw error;

        onUpdate({ ...user, ...updateData });
        setUsernameSuccess('Username updated!');
    } catch (err: any) {
        setUsernameError(err.message || 'Failed to update');
    } finally {
        setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
        setPasswordError("Passwords don't match.");
        return;
    }
    if (newPassword.length < 6) {
        setPasswordError("Password must be at least 6 characters.");
        return;
    }

    setLoading(true);
    try {
        const { error } = await supabase.from('users').update({ password: newPassword }).eq('id', user.id);
        if (error) throw error;
        setPasswordSuccess('Password updated successfully.');
        setNewPassword('');
        setConfirmPassword('');
    } catch (err: any) {
        setPasswordError(err.message || 'Failed to update password');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center">
      <div className="bg-surface w-full max-w-2xl h-[500px] rounded-2xl shadow-2xl flex overflow-hidden border border-border">
        {/* Sidebar */}
        <div className="w-1/3 bg-surfaceHighlight p-4 border-r border-border">
            <h2 className="text-xs font-bold text-textMuted uppercase mb-4 px-2">User Settings</h2>
            <nav className="space-y-1">
                <button 
                    onClick={() => setActiveTab('account')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-surface text-white' : 'text-textMuted hover:bg-surface/50 hover:text-white'}`}
                >
                    My Account
                </button>
                <button 
                    onClick={() => setActiveTab('security')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-surface text-white' : 'text-textMuted hover:bg-surface/50 hover:text-white'}`}
                >
                    Privacy & Security
                </button>
            </nav>
            <div className="mt-auto pt-4 border-t border-white/5 absolute bottom-4 w-[180px]">
                 <button onClick={onLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                    Log Out
                 </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 relative bg-surface">
            <button onClick={onClose} className="absolute top-4 right-4 text-textMuted hover:text-white p-2 border border-transparent hover:border-white/10 rounded-full">
                <X size={24} />
            </button>

            {activeTab === 'account' && (
                <div>
                    <h2 className="text-xl font-bold text-white mb-6">My Account</h2>
                    
                    <div className="bg-surfaceHighlight p-4 rounded-xl mb-6 flex items-center gap-4">
                         <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                            {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full rounded-full object-cover" /> : user.username[0]}
                         </div>
                         <div>
                             <div className="text-white font-bold text-lg">{user.username}</div>
                             <div className="text-textMuted text-xs">#{user.id.substring(0,4)}</div>
                         </div>
                    </div>

                    <form onSubmit={handleUpdateUsername}>
                        <label className="block text-xs font-bold text-textMuted uppercase mb-2">Username</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                className="flex-1 bg-black/20 border border-border p-2 rounded-lg text-white focus:outline-none focus:border-primary"
                            />
                            <button disabled={loading || newUsername === user.username} type="submit" className="bg-primary hover:bg-primaryHover text-white px-4 rounded-lg font-medium text-sm disabled:opacity-50">
                                Save
                            </button>
                        </div>
                        {usernameError && <p className="text-red-400 text-xs mt-2">{usernameError}</p>}
                        {usernameSuccess && <p className="text-green-400 text-xs mt-2 flex items-center"><Check size={12} className="mr-1"/> {usernameSuccess}</p>}
                        <p className="text-[10px] text-textMuted mt-2">Usernames can be changed once every 30 days.</p>
                    </form>
                </div>
            )}

            {activeTab === 'security' && (
                 <div>
                    <h2 className="text-xl font-bold text-white mb-6">Password Change</h2>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-textMuted uppercase mb-2">New Password</label>
                            <input 
                                type="password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-black/20 border border-border p-2.5 rounded-lg text-white focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-textMuted uppercase mb-2">Confirm Password</label>
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-black/20 border border-border p-2.5 rounded-lg text-white focus:outline-none focus:border-primary"
                            />
                        </div>

                        {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
                        {passwordSuccess && <p className="text-green-400 text-xs flex items-center"><Check size={12} className="mr-1"/> {passwordSuccess}</p>}

                        <button disabled={loading || !newPassword} type="submit" className="bg-primary hover:bg-primaryHover text-white px-6 py-2 rounded-lg font-medium text-sm disabled:opacity-50 mt-2">
                            Update Password
                        </button>
                    </form>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};
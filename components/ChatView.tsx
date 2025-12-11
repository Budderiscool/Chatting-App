import React, { useEffect, useState, useRef } from 'react';
import { Channel, Message, User } from '../types';
import { supabase } from '../supabaseClient';
import { Hash, Plus, Gift, Sticker, Smile, Send, MoreHorizontal, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';

interface Props {
  channel: Channel | null;
  currentUser: User;
}

export const ChatView: React.FC<Props> = ({ channel, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showEmojiPickerId, setShowEmojiPickerId] = useState<string | null>(null);
  
  // Media Input State
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!channel) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`*, users (username, avatar_url)`)
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (data && !error) {
        setMessages(data as Message[]);
        scrollToBottom();
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel(`chat:${channel.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages',
        filter: `channel_id=eq.${channel.id}`
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
            const { data: userData } = await supabase.from('users').select('username, avatar_url').eq('id', payload.new.user_id).single();
            const newMessage = { ...payload.new, users: userData } as Message;
            setMessages((prev) => [...prev, newMessage]);
            scrollToBottom();
        } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [channel]);

  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }); }, 50);
  };

  const handleSendMessage = async (e?: React.FormEvent, contentOverride?: string, mediaUrl?: string) => {
    e?.preventDefault();
    const text = contentOverride ?? inputText.trim();
    if ((!text && !mediaUrl) || !channel) return;

    setInputText(''); 
    setShowMediaPicker(false);
    setMediaUrlInput('');

    const { error } = await supabase.from('messages').insert({
      channel_id: channel.id,
      user_id: currentUser.id,
      content: text,
      media_url: mediaUrl
    });

    if (error) console.error(error);
  };

  // --- Reactions ---
  const handleAddReaction = async (messageId: string, emojiData: EmojiClickData) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    const currentReactions = message.reactions || {};
    const emoji = emojiData.emoji;
    const users = currentReactions[emoji] || [];

    let newReactions;
    if (users.includes(currentUser.id)) {
        // Remove reaction
        const newUsers = users.filter(id => id !== currentUser.id);
        if (newUsers.length === 0) {
            const { [emoji]: _, ...rest } = currentReactions;
            newReactions = rest;
        } else {
            newReactions = { ...currentReactions, [emoji]: newUsers };
        }
    } else {
        // Add reaction
        newReactions = { ...currentReactions, [emoji]: [...users, currentUser.id] };
    }

    await supabase.from('messages').update({ reactions: newReactions }).eq('id', messageId);
    setShowEmojiPickerId(null);
  };

  // --- File Upload (Base64 for reliability in demo) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            // Send immediately as media message
            handleSendMessage(undefined, '', base64);
        };
        reader.readAsDataURL(file);
    }
  };

  if (!channel) return <div className="flex-1 bg-surface flex items-center justify-center text-textMuted"><p>Select a channel or user to start chatting.</p></div>;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface relative">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-border bg-surfaceHighlight/30 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center">
            <Hash className="text-textMuted mr-3" size={22} />
            <span className="font-bold text-white text-lg mr-4">{channel.name.replace('dm-', 'DM: ')}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col px-6 pt-6">
        {messages.map((msg, index) => {
           const prevMsg = messages[index - 1];
           const isSequence = prevMsg && prevMsg.user_id === msg.user_id && (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60 * 1000);
           const isMe = msg.user_id === currentUser.id;

           return (
            <div key={msg.id} className={isSequence ? "mt-0.5 group flex items-start relative hover:bg-white/5 -mx-4 px-4 py-1 rounded-lg" : "mt-5 group flex items-start relative hover:bg-white/5 -mx-4 px-4 py-1 rounded-lg"}>
              {!isSequence ? (
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-4 mt-0.5 shadow-lg bg-surfaceHighlight">
                    {msg.users?.avatar_url ? (
                        <img src={msg.users.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold">{msg.users?.username[0]}</div>
                    )}
                </div>
              ) : <div className="w-14 flex-shrink-0"></div>}

              <div className="flex-1 min-w-0">
                  {!isSequence && (
                      <div className="flex items-center mb-1">
                          <span className="font-bold text-white cursor-pointer mr-2 hover:underline">{msg.users?.username}</span>
                          <span className="text-xs text-textMuted font-medium">{formatMessageDate(msg.created_at)}</span>
                      </div>
                  )}
                  
                  {msg.content && <p className={isMe ? "text-white/90 leading-relaxed" : "text-text/90 leading-relaxed"}>{msg.content}</p>}
                  
                  {msg.media_url && (
                      <div className="mt-2">
                          <img src={msg.media_url} className="max-w-sm max-h-64 rounded-xl border border-border shadow-md" alt="Attachment" />
                      </div>
                  )}

                  {/* Reactions Display */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(msg.reactions).map(([emoji, users]) => (
                              <div key={emoji} className="flex items-center bg-surfaceHighlight border border-white/5 rounded-lg px-1.5 py-0.5 text-xs text-text cursor-pointer hover:border-primary/50">
                                  <span>{emoji}</span>
                                  <span className="ml-1 font-bold">{users.length}</span>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Hover Actions */}
              <div className="absolute right-4 top-[-16px] bg-surfaceHighlight border border-border shadow-xl rounded-lg flex items-center p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => setShowEmojiPickerId(showEmojiPickerId === msg.id ? null : msg.id)} className="p-1.5 hover:bg-white/10 rounded text-textMuted hover:text-white transition-colors relative">
                      <Smile size={16} />
                  </button>
              </div>

              {/* Inline Emoji Picker */}
              {showEmojiPickerId === msg.id && (
                  <div className="absolute right-0 top-8 z-50">
                      <EmojiPicker 
                        onEmojiClick={(data) => handleAddReaction(msg.id, data)} 
                        theme={Theme.DARK} 
                        searchDisabled 
                        skinTonesDisabled 
                        width={300} 
                        height={350} 
                      />
                      <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPickerId(null)}></div>
                  </div>
              )}
            </div>
           );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="p-6 pt-2 shrink-0 z-20 relative">
        {/* Media Picker Modal */}
        {showMediaPicker && (
            <div className="absolute bottom-24 left-6 bg-surfaceHighlight border border-border rounded-xl shadow-2xl p-4 w-80 z-50">
                <div className="text-sm font-bold text-white mb-2 uppercase">Add Media</div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-4 bg-black/20 rounded-lg hover:bg-black/40 transition-colors cursor-pointer">
                        <ImageIcon className="mb-2 text-primary" />
                        <span className="text-xs text-white">Upload File</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-4 bg-black/20 rounded-lg hover:bg-black/40 transition-colors opacity-50 cursor-not-allowed">
                        <Gift className="mb-2 text-pink-400" />
                        <span className="text-xs text-white">GIF Search</span>
                    </button>
                </div>
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Paste image link..." 
                        className="w-full bg-black/20 border border-white/10 rounded p-2 text-xs text-white focus:outline-none focus:border-primary"
                        value={mediaUrlInput}
                        onChange={(e) => setMediaUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendMessage(undefined, undefined, mediaUrlInput);
                        }}
                    />
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
        )}

        <form onSubmit={(e) => handleSendMessage(e)} className="bg-surfaceHighlight rounded-full pl-4 pr-3 py-3 flex items-center relative shadow-lg border border-white/5">
          <button type="button" onClick={() => setShowMediaPicker(!showMediaPicker)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-textMuted hover:text-white transition-colors mr-3 shrink-0">
            <Plus size={18} />
          </button>

          <input
            type="text"
            className="flex-1 bg-transparent text-text focus:outline-none placeholder-textMuted/50 font-medium"
            placeholder={`Message ${channel.name}`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          
          <div className="flex items-center gap-3 ml-3 text-textMuted">
            {inputText.trim() ? (
                 <button type="submit" className="w-10 h-10 rounded-full bg-primary hover:bg-primaryHover text-white flex items-center justify-center transition-all shadow-lg">
                    <Send size={18} className="ml-0.5" />
                 </button>
            ) : <div className="w-10"></div>}
          </div>
        </form>
      </div>
    </div>
  );
};

const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return `Today at ${format(date, 'h:mm aa')}`;
    if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm aa')}`;
    return format(date, 'MM/dd/yyyy');
};
import React, { useEffect, useState, useRef } from 'react';
import { Channel, Message, User } from '../types';
import { supabase } from '../supabaseClient';
import { Hash, Plus, Gift, Sticker, Smile, Send, MoreHorizontal, Image as ImageIcon, Link as LinkIcon, Search, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  channel: Channel | null;
  currentUser: User;
}

export const ChatView: React.FC<Props> = ({ channel, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showEmojiPickerId, setShowEmojiPickerId] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  
  // Media / Search State
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'search'>('upload');
  const [searchProvider, setSearchProvider] = useState<'tenor' | 'image'>('tenor'); // tenor (GIF) or loremflickr (Image)
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Focus input when disabling preview
  useEffect(() => {
    if (!isPreviewing && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isPreviewing]);

  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }); }, 100);
  };

  const handleSendMessage = async (e?: React.FormEvent, contentOverride?: string, mediaUrl?: string) => {
    e?.preventDefault();
    const text = contentOverride ?? inputText.trim();
    if ((!text && !mediaUrl) || !channel) return;

    setInputText(''); 
    setShowMediaPicker(false);
    setIsPreviewing(false);
    setMediaUrlInput('');
    setSearchQuery('');
    setSearchResults([]);

    const { error } = await supabase.from('messages').insert({
      channel_id: channel.id,
      user_id: currentUser.id,
      content: text,
      media_url: mediaUrl,
      media_type: mediaUrl ? 'image' : undefined
    });

    if (error) console.error("Error sending message:", error);
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

    // Optimistic Update
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: newReactions } : m));
    setShowEmojiPickerId(null);

    const { error } = await supabase.from('messages').update({ reactions: newReactions }).eq('id', messageId);
    if (error) {
        console.error("Failed to update reaction:", error);
    }
  };

  // --- File Upload ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            handleSendMessage(undefined, '', base64);
        };
        reader.readAsDataURL(file);
    }
  };

  // --- Search Logic ---
  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      setIsSearching(true);
      setSearchResults([]);
      
      try {
        if (searchProvider === 'tenor') {
            // Tenor API for GIFs
            // contentfilter=medium ensures strictly G and PG results (excludes PG-13, R)
            const response = await fetch(`https://g.tenor.com/v1/search?q=${encodeURIComponent(searchQuery)}&key=LIVDSRZULELA&limit=12&contentfilter=medium`);
            const data = await response.json();
            if (data.results) {
                setSearchResults(data.results.map((item: any) => item.media[0].gif.url));
            } else {
                 setSearchResults([]);
            }
        } else {
            // Simulation for Static Images
            const results = Array.from({ length: 9 }).map((_, i) => 
                `https://loremflickr.com/320/240/${encodeURIComponent(searchQuery)}?lock=${i + Math.floor(Math.random() * 1000)}`
            );
            setSearchResults(results);
        }
      } catch (err) {
          console.error("Search failed", err);
          // Fallback simulation
          const results = Array.from({ length: 9 }).map((_, i) => 
            `https://loremflickr.com/320/240/${encodeURIComponent(searchQuery)}?lock=${i + Math.floor(Math.random() * 1000)}`
          );
          setSearchResults(results);
      } finally {
        setIsSearching(false);
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
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-4 mt-0.5 shadow-lg bg-surfaceHighlight cursor-pointer hover:opacity-80 transition-opacity">
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
                  
                  <div className={isMe ? "text-white/90 leading-relaxed" : "text-text/90 leading-relaxed"}>
                    {msg.content && (
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            className="markdown-content prose prose-invert max-w-none"
                            components={{
                                a: ({node, ...props}) => <a {...props} className="text-primary hover:underline cursor-pointer" target="_blank" rel="noopener noreferrer" />,
                                code: ({node, className, children, ...props}) => {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return <code className={`${className} bg-black/30 rounded px-1.5 py-0.5 text-sm font-mono text-gray-200`} {...props}>{children}</code>
                                },
                                pre: ({node, ...props}) => <pre className="bg-black/30 p-3 rounded-lg overflow-x-auto my-2 border border-white/5" {...props} />,
                                p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc list-inside my-1" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-inside my-1" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/50 pl-3 my-1 italic text-textMuted" {...props} />
                            }}
                        >
                            {msg.content}
                        </ReactMarkdown>
                    )}
                  </div>
                  
                  {msg.media_url && (
                      <div className="mt-2">
                          <img src={msg.media_url} className="max-w-sm max-h-72 rounded-xl border border-border shadow-md object-cover cursor-pointer" alt="Attachment" onClick={() => window.open(msg.media_url, '_blank')} />
                      </div>
                  )}

                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 select-none">
                          {Object.entries(msg.reactions).map(([emoji, users]) => (
                              <div 
                                key={emoji} 
                                onClick={() => handleAddReaction(msg.id, { emoji } as any)}
                                className={`flex items-center border rounded-lg px-1.5 py-0.5 text-xs cursor-pointer transition-colors ${users.includes(currentUser.id) ? 'bg-primary/20 border-primary/50 text-white' : 'bg-surfaceHighlight border-white/5 text-textMuted hover:border-textMuted'}`}
                              >
                                  <span className="mr-1">{emoji}</span>
                                  <span className="font-bold">{users.length}</span>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              <div className="absolute right-4 top-[-16px] bg-surfaceHighlight border border-border shadow-xl rounded-lg flex items-center p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button onClick={() => setShowEmojiPickerId(showEmojiPickerId === msg.id ? null : msg.id)} className="p-1.5 hover:bg-white/10 rounded text-textMuted hover:text-white transition-colors relative" title="Add Reaction">
                      <Smile size={16} />
                  </button>
              </div>

              {showEmojiPickerId === msg.id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEmojiPickerId(null)}>
                     <div onClick={(e) => e.stopPropagation()} className="relative transform scale-110">
                        <EmojiPicker 
                            onEmojiClick={(data) => handleAddReaction(msg.id, data)} 
                            theme={Theme.DARK} 
                            searchDisabled={false}
                            skinTonesDisabled 
                            width={350} 
                            height={450}
                        />
                     </div>
                  </div>
              )}
            </div>
           );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="p-6 pt-2 shrink-0 z-20 relative">
        {showMediaPicker && (
            <div className="absolute bottom-24 left-6 bg-surfaceHighlight border border-border rounded-xl shadow-2xl w-96 z-50 overflow-hidden flex flex-col h-[500px]">
                <div className="flex border-b border-white/5">
                    <button 
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 p-3 text-sm font-bold transition-colors ${activeTab === 'upload' ? 'bg-white/10 text-white' : 'text-textMuted hover:text-white hover:bg-white/5'}`}
                    >
                        Upload
                    </button>
                    <button 
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 p-3 text-sm font-bold transition-colors ${activeTab === 'search' ? 'bg-white/10 text-white' : 'text-textMuted hover:text-white hover:bg-white/5'}`}
                    >
                        Search
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-hidden flex flex-col">
                    {activeTab === 'upload' ? (
                        <div className="overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 gap-2 mb-4">
                                <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 bg-black/20 rounded-lg hover:bg-black/40 transition-colors cursor-pointer border-2 border-dashed border-white/10 hover:border-primary/50 group">
                                    <ImageIcon className="mb-2 text-textMuted group-hover:text-primary transition-colors" size={32} />
                                    <span className="text-xs text-white font-bold">Click to Upload File</span>
                                    <span className="text-[10px] text-textMuted">Images up to 10MB</span>
                                </button>
                            </div>
                            <div className="relative">
                                <div className="text-xs font-bold text-textMuted uppercase mb-1.5 ml-1">Or paste a link</div>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="https://example.com/image.png" 
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        value={mediaUrlInput}
                                        onChange={(e) => setMediaUrlInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSendMessage(undefined, undefined, mediaUrlInput);
                                        }}
                                    />
                                    <button 
                                        onClick={() => handleSendMessage(undefined, undefined, mediaUrlInput)}
                                        disabled={!mediaUrlInput}
                                        className="bg-primary hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-3 transition-colors"
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="flex gap-2 mb-3">
                                <button 
                                    onClick={() => setSearchProvider('tenor')} 
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${searchProvider === 'tenor' ? 'bg-primary text-white border-primary' : 'bg-black/20 text-textMuted border-white/10 hover:bg-white/5'}`}
                                >
                                    GIFs
                                </button>
                                <button 
                                    onClick={() => setSearchProvider('image')} 
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${searchProvider === 'image' ? 'bg-primary text-white border-primary' : 'bg-black/20 text-textMuted border-white/10 hover:bg-white/5'}`}
                                >
                                    Images
                                </button>
                            </div>
                            
                            <form onSubmit={handleSearch} className="flex gap-2 mb-4 shrink-0">
                                <input 
                                    type="text" 
                                    placeholder={searchProvider === 'tenor' ? "Search Tenor GIFs..." : "Search Images..."}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-primary"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" className="bg-white/10 hover:bg-white/20 text-white rounded-lg px-3 transition-colors" disabled={isSearching}>
                                    {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                </button>
                            </form>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                                {searchResults.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {searchResults.map((url, i) => (
                                            <div 
                                                key={i} 
                                                className="aspect-video bg-black/30 rounded overflow-hidden cursor-pointer relative group border border-transparent hover:border-primary"
                                                onClick={() => handleSendMessage(undefined, undefined, url)}
                                            >
                                                <img src={url} className="w-full h-full object-cover" loading="lazy" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Send className="text-white" size={20} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-textMuted h-full opacity-50">
                                        {isSearching ? (
                                            <span className="text-xs">Searching...</span>
                                        ) : (
                                            <>
                                                <Search size={32} className="mb-2" />
                                                <p className="text-xs text-center px-4">Search for {searchProvider === 'tenor' ? 'GIFs' : 'Images'} to send.</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
        )}

        <form onSubmit={(e) => handleSendMessage(e)} className="bg-surfaceHighlight rounded-xl pl-4 pr-3 py-3 flex items-center relative shadow-lg border border-white/5">
          <button type="button" onClick={() => setShowMediaPicker(!showMediaPicker)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors mr-3 shrink-0 ${showMediaPicker ? 'bg-primary text-white' : 'bg-white/10 hover:bg-white/20 text-textMuted hover:text-white'}`}>
            <Plus size={18} className={`transition-transform duration-200 ${showMediaPicker ? 'rotate-45' : ''}`} />
          </button>

          {isPreviewing && inputText.trim() ? (
             <div 
                className="flex-1 bg-transparent text-text/90 font-medium overflow-y-auto max-h-48 cursor-text py-0.5"
                onClick={() => setIsPreviewing(false)}
             >
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    className="markdown-content prose prose-invert max-w-none"
                    components={{
                        a: ({node, ...props}) => <a {...props} className="text-primary hover:underline cursor-pointer" target="_blank" rel="noopener noreferrer" />,
                        code: ({node, className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '')
                            return <code className={`${className} bg-black/30 rounded px-1.5 py-0.5 text-sm font-mono text-gray-200`} {...props}>{children}</code>
                        },
                        pre: ({node, ...props}) => <pre className="bg-black/30 p-3 rounded-lg overflow-x-auto my-2 border border-white/5" {...props} />,
                        p: ({node, ...props}) => <p className="mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside my-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside my-1" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/50 pl-3 my-1 italic text-textMuted" {...props} />
                    }}
                >
                    {inputText}
                </ReactMarkdown>
             </div>
          ) : (
            <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent text-text focus:outline-none placeholder-textMuted/50 font-medium"
                placeholder={`Message ${channel.name}`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
            />
          )}
          
          <div className="flex items-center gap-3 ml-3 text-textMuted">
             {inputText.trim() && (
                 <button 
                    type="button"
                    onClick={() => setIsPreviewing(!isPreviewing)} 
                    className={`hover:text-white transition-colors ${isPreviewing ? 'text-primary' : 'text-textMuted'}`}
                    title={isPreviewing ? "Edit" : "Preview"}
                 >
                    {isPreviewing ? <EyeOff size={20} /> : <Eye size={20} />}
                 </button>
             )}
             
             <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
             {/* Hint for Markdown */}
             <div className="hidden md:flex items-center gap-1 text-[10px] text-textMuted/50 font-mono mr-2 border border-white/5 rounded px-1.5 py-0.5 pointer-events-none select-none">
                <span className="font-bold">**bold**</span>
                <span>*italic*</span>
                <span>`code`</span>
             </div>

            {inputText.trim() ? (
                 <button type="submit" className="w-10 h-10 rounded-lg bg-primary hover:bg-primaryHover text-white flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95">
                    <Send size={18} className="ml-0.5" />
                 </button>
            ) : (
                <div className="w-10 flex items-center justify-center">
                    <Smile className="hover:text-white cursor-pointer transition-colors" size={20} />
                </div>
            )}
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
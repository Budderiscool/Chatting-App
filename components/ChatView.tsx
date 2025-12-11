import React, { useEffect, useState, useRef } from 'react';
import { Channel, Message, User } from '../types';
import { supabase } from '../supabaseClient';
import { Hash, Plus, Gift, Sticker, Smile, Send, MoreHorizontal } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface Props {
  channel: Channel | null;
  currentUser: User;
}

export const ChatView: React.FC<Props> = ({ channel, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!channel) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`*, users (username)`)
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
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `channel_id=eq.${channel.id}`
      }, async (payload) => {
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', payload.new.user_id)
          .single();

        const newMessage = { ...payload.new, users: userData } as Message;
        setMessages((prev) => [...prev, newMessage]);
        scrollToBottom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 50);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !channel) return;

    const content = inputText.trim();
    setInputText(''); 

    const { error } = await supabase.from('messages').insert({
      channel_id: channel.id,
      user_id: currentUser.id,
      content: content
    });

    if (error) {
      console.error('Error sending message:', error);
      setInputText(content);
    }
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm aa')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm aa')}`;
    }
    return format(date, 'MM/dd/yyyy');
  };

  if (!channel) {
    return (
      <div className="flex-1 bg-surface flex flex-col items-center justify-center text-textMuted">
        <div className="w-20 h-20 bg-surfaceHighlight rounded-full flex items-center justify-center mb-6 shadow-xl">
             <Hash size={40} className="text-textMuted/50" />
        </div>
        <h3 className="text-2xl font-bold text-text mb-2">Welcome Back</h3>
        <p>Select a channel to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface relative">
      {/* Floating Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-border bg-surfaceHighlight/30 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center">
            <Hash className="text-textMuted mr-3" size={22} />
            <span className="font-bold text-white text-lg mr-4 tracking-tight">{channel.name}</span>
            <span className="text-textMuted text-sm font-medium px-3 py-1 bg-white/5 rounded-full hidden sm:block">
                Chat Room
            </span>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-4 text-textMuted">
            <MoreHorizontal className="hover:text-white cursor-pointer" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col px-6 pt-6">
        
        {/* Welcome Channel Banner */}
        <div className="mt-auto mb-8 text-center sm:text-left border-b border-border pb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-4 mx-auto sm:mx-0">
                <Hash size={40} className="text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2">Welcome to #{channel.name}</h1>
            <p className="text-textMuted text-lg">This is the beginning of the legendary conversations in #{channel.name}.</p>
        </div>

        <div className="flex flex-col gap-1 pb-4">
        {messages.map((msg, index) => {
           const prevMsg = messages[index - 1];
           const isSequence = prevMsg && 
                              prevMsg.user_id === msg.user_id && 
                              (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60 * 1000);
            
           const isMe = msg.user_id === currentUser.id;

           return (
            <div 
                key={msg.id} 
                className={isSequence ? "mt-0.5 group flex items-start" : "mt-5 group flex items-start"}
            >
              {!isSequence && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-lg mr-4 mt-0.5">
                    {msg.users?.username.substring(0, 1).toUpperCase()}
                </div>
              )}
              
              {isSequence && <div className="w-14 flex-shrink-0"></div>}

              <div className="flex-1 min-w-0">
                  {!isSequence && (
                      <div className="flex items-center mb-1">
                          <span className="font-bold text-white hover:underline cursor-pointer mr-2 text-[15px]">
                              {msg.users?.username}
                          </span>
                          <span className="text-xs text-textMuted font-medium">
                              {formatMessageDate(msg.created_at)}
                          </span>
                      </div>
                  )}
                  <p className={isMe ? "text-white/90 leading-relaxed" : "text-text/90 leading-relaxed"}>
                      {msg.content}
                  </p>
              </div>
            </div>
           );
        })}
        </div>
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Floating Input Area */}
      <div className="p-6 pt-2 shrink-0 z-20">
        <form 
          onSubmit={handleSendMessage}
          className="bg-surfaceHighlight rounded-full pl-4 pr-3 py-3 flex items-center relative shadow-lg border border-white/5 focus-within:border-primary/50 transition-colors"
        >
          <button type="button" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-textMuted hover:text-white transition-colors mr-3 shrink-0">
            <Plus size={18} />
          </button>

          <input
            type="text"
            className="flex-1 bg-transparent text-text focus:outline-none placeholder-textMuted/50 font-medium"
            placeholder={`Message #${channel.name}`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          
          <div className="flex items-center gap-3 ml-3 text-textMuted">
            <div className="hidden sm:flex gap-2">
                <Gift className="hover:text-white cursor-pointer transition-colors p-1" size={28} />
                <Sticker className="hover:text-white cursor-pointer transition-colors p-1" size={28} />
                <Smile className="hover:text-white cursor-pointer transition-colors p-1" size={28} />
            </div>
            
            {inputText.trim() ? (
                 <button type="submit" className="w-10 h-10 rounded-full bg-primary hover:bg-primaryHover text-white flex items-center justify-center transition-all shadow-lg hover:scale-105">
                    <Send size={18} className="ml-0.5" />
                 </button>
            ) : (
                <div className="w-10"></div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
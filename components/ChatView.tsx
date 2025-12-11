import React, { useEffect, useState, useRef } from 'react';
import { Channel, Message, User } from '../types';
import { supabase } from '../supabaseClient';
import { Hash, Plus, Gift, Sticker, Smile, Send } from 'lucide-react';
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
      <div className="flex-1 bg-discord-dark flex flex-col items-center justify-center text-discord-textMuted">
        <div className="bg-discord-darker p-4 rounded-full mb-4">
             <Hash size={48} />
        </div>
        <h3 className="text-lg font-bold text-discord-text mb-2">No Channel Selected</h3>
        <p>Pick a channel from the sidebar to start chatting.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-discord-dark relative">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-black/20 shadow-sm flex-shrink-0 z-10 bg-discord-dark">
        <Hash className="text-discord-textMuted mr-2" size={24} />
        <span className="font-bold text-white mr-4">{channel.name}</span>
        {/* Placeholder for topic */}
        <div className="w-[1px] h-6 bg-discord-textMuted/30 mx-2 hidden sm:block"></div>
        <span className="text-discord-textMuted text-xs font-medium hidden sm:block truncate">This is the start of the #{channel.name} channel.</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col px-4 pt-4">
        
        {/* Welcome Channel Banner */}
        <div className="mt-auto mb-6">
            <div className="w-16 h-16 bg-discord-light rounded-full flex items-center justify-center mb-4">
                <Hash size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to #{channel.name}!</h1>
            <p className="text-discord-textMuted text-lg">This is the start of the #{channel.name} channel.</p>
        </div>

        {messages.map((msg, index) => {
           const prevMsg = messages[index - 1];
           // Grouping logic: Same user and less than 5 minutes diff
           const isSequence = prevMsg && 
                              prevMsg.user_id === msg.user_id && 
                              (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60 * 1000);

           return (
            <div 
                key={msg.id} 
                className={isSequence 
                    ? "py-0.5 hover:bg-black/5 -mx-4 px-4 group flex items-start" 
                    : "mt-[17px] hover:bg-black/5 -mx-4 px-4 py-0.5 group flex items-start"}
            >
              {isSequence ? (
                // Compact Message Mode
                <>
                    <div className="w-[50px] flex-shrink-0 text-[10px] text-discord-textMuted opacity-0 group-hover:opacity-100 text-right select-none pr-3 pt-1 font-mono">
                        {format(new Date(msg.created_at), 'h:mm aa')}
                    </div>
                    <p className="text-[#dbdee1] whitespace-pre-wrap leading-[1.375rem] flex-1 font-[400]">
                        {msg.content}
                    </p>
                </>
              ) : (
                // Full Header Message Mode
                <>
                    <div className="w-[40px] h-[40px] rounded-full bg-discord-primary hover:bg-discord-primaryHover cursor-pointer flex-shrink-0 flex items-center justify-center text-white font-bold text-lg mt-0.5 transition-colors overflow-hidden">
                        {msg.users?.username.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                            <span className="font-medium text-white hover:underline cursor-pointer mr-2">
                                {msg.users?.username}
                            </span>
                            <span className="text-xs text-discord-textMuted font-medium ml-0.5">
                                {formatMessageDate(msg.created_at)}
                            </span>
                        </div>
                        <p className="text-[#dbdee1] whitespace-pre-wrap leading-[1.375rem] font-[400]">
                            {msg.content}
                        </p>
                    </div>
                </>
              )}
            </div>
           );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="px-4 pb-6 pt-0 flex-shrink-0 z-20 bg-discord-dark">
        <form 
          onSubmit={handleSendMessage}
          className="bg-discord-input rounded-lg px-4 py-2.5 flex items-center relative"
        >
          {/* Plus Button */}
          <button type="button" className="text-discord-textMuted hover:text-discord-text mr-3 sticky-plus">
            <div className="w-6 h-6 rounded-full bg-discord-textMuted flex items-center justify-center text-discord-darkest font-bold text-xs hover:text-white transition-colors">
              <Plus size={16} strokeWidth={4} />
            </div>
          </button>

          <input
            type="text"
            className="flex-1 bg-transparent text-discord-text focus:outline-none placeholder-discord-textMuted/50 font-medium"
            placeholder={`Message #${channel.name}`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          
          <div className="flex items-center space-x-3 ml-3 text-discord-textMuted">
            <Gift className="hover:text-discord-text cursor-pointer" size={20} />
            <Sticker className="hover:text-discord-text cursor-pointer" size={20} />
            <Smile className="hover:text-discord-text cursor-pointer" size={20} />
            {inputText.trim() && (
                 <button type="submit" className="text-discord-primary hover:text-white transition-colors">
                    <Send size={20} />
                 </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
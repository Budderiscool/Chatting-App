import React, { useEffect, useState, useRef } from 'react';
import { Channel, Message, User } from '../types';
import { supabase } from '../supabaseClient';
import { Hash, Send } from 'lucide-react';
import { format } from 'date-fns';

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

    // Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          users (
            username
          )
        `)
        .eq('channel_id', channel.id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (data && !error) {
        setMessages(data as Message[]);
        scrollToBottom();
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat:${channel.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `channel_id=eq.${channel.id}`
      }, async (payload) => {
        // Fetch user details for the new message
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', payload.new.user_id)
          .single();

        const newMessage = {
          ...payload.new,
          users: userData
        } as Message;

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
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !channel) return;

    const content = inputText.trim();
    setInputText(''); // Optimistic clear

    const { error } = await supabase.from('messages').insert({
      channel_id: channel.id,
      user_id: currentUser.id,
      content: content
    });

    if (error) {
      console.error('Error sending message:', error);
      setInputText(content); // Restore on error
    }
  };

  if (!channel) {
    return (
      <div className="flex-1 bg-discord-dark flex items-center justify-center text-discord-textMuted">
        Select a channel to start chatting
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-discord-dark">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-discord-darkest shadow-sm">
        <Hash className="text-discord-textMuted mr-2" size={24} />
        <span className="font-bold text-white">{channel.name}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
           const showHeader = index === 0 || messages[index - 1].user_id !== msg.user_id;
           return (
            <div key={msg.id} className={showHeader ? "mt-4 group" : "mt-1 group hover:bg-black/5 px-2 -mx-2 py-0.5"}>
              {showHeader ? (
                 <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-discord-primary flex-shrink-0 flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-80">
                    {msg.users?.username.substring(0, 1).toUpperCase()}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-white hover:underline cursor-pointer mr-2">
                        {msg.users?.username}
                      </span>
                      <span className="text-xs text-discord-textMuted">
                        {format(new Date(msg.created_at), 'MM/dd/yyyy p')}
                      </span>
                    </div>
                    <p className="text-discord-text whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                   <div className="w-10 mr-4 flex-shrink-0 text-xs text-discord-textMuted opacity-0 group-hover:opacity-100 text-right select-none pt-1">
                     {format(new Date(msg.created_at), 'hh:mm a')}
                   </div>
                   <p className="text-discord-text whitespace-pre-wrap leading-relaxed flex-1">
                      {msg.content}
                   </p>
                </div>
              )}
            </div>
           );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-2">
        <form 
          onSubmit={handleSendMessage}
          className="bg-[#383a40] rounded-lg px-4 py-2.5 flex items-center"
        >
          <button type="button" className="text-discord-textMuted hover:text-discord-text mr-4">
            <div className="w-6 h-6 rounded-full bg-discord-textMuted flex items-center justify-center text-discord-darkest font-bold text-xs">
              +
            </div>
          </button>
          <input
            type="text"
            className="flex-1 bg-transparent text-discord-text focus:outline-none placeholder-discord-textMuted/70"
            placeholder={`Message #${channel.name}`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="ml-2 text-discord-textMuted hover:text-discord-primary disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
import React from 'react';
import { Channel, Server } from '../types';
import { Hash, Plus, ChevronDown, Volume2 } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  server: Server | null;
  channels: Channel[];
  selectedChannelId?: string;
  onSelect: (channel: Channel) => void;
  onAddChannel: () => void;
}

export const ChannelList: React.FC<Props> = ({ server, channels, selectedChannelId, onSelect, onAddChannel }) => {
  if (!server) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-textMuted">
            <div className="w-16 h-16 rounded-3xl bg-surfaceHighlight mb-4 animate-pulse"></div>
            <p className="text-sm">Select a server from the dock below</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Server Header */}
      <div className="h-16 px-6 flex items-center justify-between font-bold text-lg text-white border-b border-border bg-surfaceHighlight/30 backdrop-blur-sm shrink-0">
        <span className="truncate">{server.name}</span>
        <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronDown size={20} />
        </button>
      </div>

      {/* Channels Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        
        {/* Text Channels Group */}
        <div>
            <div className="flex items-center justify-between px-3 mb-2 group">
                <span className="text-xs font-bold text-textMuted uppercase tracking-wider">Text Channels</span>
                <button 
                    onClick={onAddChannel} 
                    className="text-textMuted hover:text-white p-1 hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                    <Plus size={14} />
                </button>
            </div>

            <div className="space-y-1">
            {channels.filter(c => !c.name.includes('voice')).map((channel) => (
                <button
                key={channel.id}
                onClick={() => onSelect(channel)}
                className={clsx(
                    "w-full flex items-center px-3 py-2.5 rounded-xl mx-0 group transition-all duration-200",
                    selectedChannelId === channel.id 
                    ? "bg-primary/10 text-primary font-semibold shadow-sm" 
                    : "text-textMuted hover:bg-surfaceHighlight hover:text-text"
                )}
                >
                <Hash size={18} className={clsx("mr-2.5", selectedChannelId === channel.id ? "text-primary" : "text-textMuted/70")} />
                <span className="truncate">{channel.name}</span>
                </button>
            ))}
            </div>
        </div>

        {/* Voice Channels Group (Fake for visual) */}
        <div>
             <div className="flex items-center justify-between px-3 mb-2 group">
                <span className="text-xs font-bold text-textMuted uppercase tracking-wider">Voice Channels</span>
                <button className="text-textMuted hover:text-white p-1 hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                    <Plus size={14} />
                </button>
            </div>
            <div className="space-y-1">
                 <button className="w-full flex items-center px-3 py-2.5 rounded-xl mx-0 text-textMuted hover:bg-surfaceHighlight hover:text-text transition-all duration-200 group">
                    <Volume2 size={18} className="mr-2.5 text-textMuted/70" />
                    <span className="truncate">General Voice</span>
                 </button>
                 <button className="w-full flex items-center px-3 py-2.5 rounded-xl mx-0 text-textMuted hover:bg-surfaceHighlight hover:text-text transition-all duration-200 group">
                    <Volume2 size={18} className="mr-2.5 text-textMuted/70" />
                    <span className="truncate">Gaming</span>
                 </button>
            </div>
        </div>

      </div>
      
      {/* Decorative Bottom Gradient Fade */}
      <div className="h-6 bg-gradient-to-t from-surface to-transparent shrink-0 pointer-events-none" />
    </div>
  );
};
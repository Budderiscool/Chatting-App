import React from 'react';
import { Channel, Server, User } from '../types';
import { Hash, Plus, Mic, Headphones, Settings, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  server: Server | null;
  channels: Channel[];
  selectedChannelId?: string;
  onSelect: (channel: Channel) => void;
  onAddChannel: () => void;
  currentUser: User;
}

export const ChannelList: React.FC<Props> = ({ server, channels, selectedChannelId, onSelect, onAddChannel, currentUser }) => {
  if (!server) {
    return <div className="w-60 bg-discord-darker flex-shrink-0" />;
  }

  return (
    <div className="w-60 bg-discord-darker flex flex-col flex-shrink-0 relative">
      {/* Server Header */}
      <div className="h-12 px-4 flex items-center justify-between font-bold text-white border-b border-black/10 shadow-sm hover:bg-white/5 transition-colors cursor-pointer flex-shrink-0">
        <span className="truncate">{server.name}</span>
        <ChevronDown size={20} />
      </div>

      {/* Channels Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-3 px-2">
        {/* Category Header */}
        <div className="flex items-center justify-between px-1 mb-1 group text-discord-textMuted hover:text-discord-text">
          <div className="flex items-center text-xs font-bold uppercase tracking-wide cursor-pointer">
            <ChevronDown size={12} className="mr-0.5" />
            <span>Text Channels</span>
          </div>
          <button 
            onClick={onAddChannel} 
            className="cursor-pointer hover:bg-discord-light/40 rounded p-0.5"
            title="Create Channel"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-[2px]">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onSelect(channel)}
              className={clsx(
                "w-full flex items-center px-2 py-[6px] rounded mx-0 group transition-all duration-100",
                selectedChannelId === channel.id 
                  ? "bg-discord-light/60 text-white" 
                  : "text-discord-textMuted hover:bg-discord-light/40 hover:text-discord-text"
              )}
            >
              <Hash size={20} className="mr-1.5 flex-shrink-0 text-discord-textMuted/70" />
              <span className={clsx("truncate font-medium", selectedChannelId === channel.id ? "text-white" : "text-[#949BA4] group-hover:text-[#DBDEE1]")}>
                {channel.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* User Footer (Control Panel) */}
      <div className="bg-[#232428] px-2 py-1.5 flex items-center flex-shrink-0">
        <div className="flex items-center p-1 rounded hover:bg-white/5 cursor-pointer mr-auto transition-colors group">
            <div className="relative w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center text-white text-sm font-bold overflow-hidden mr-2">
            {currentUser.username.substring(0, 1).toUpperCase()}
            {/* Status Indicator */}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-discord-green border-[2.5px] border-[#232428] rounded-full" />
            </div>
            <div className="overflow-hidden mr-1">
            <div className="text-white text-sm font-bold truncate leading-tight">
                {currentUser.username}
            </div>
            <div className="text-discord-textMuted text-xs leading-tight truncate">
                #{currentUser.id.substring(0, 4)}
            </div>
            </div>
        </div>

        <div className="flex items-center">
            <button className="p-1.5 rounded hover:bg-discord-light/60 text-discord-text relative group">
                <Mic size={20} />
                 <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">Unmute</div>
            </button>
            <button className="p-1.5 rounded hover:bg-discord-light/60 text-discord-text relative group">
                <Headphones size={20} />
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">Deafen</div>
            </button>
            <button className="p-1.5 rounded hover:bg-discord-light/60 text-discord-text relative group">
                <Settings size={20} />
                 <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">User Settings</div>
            </button>
        </div>
      </div>
    </div>
  );
};
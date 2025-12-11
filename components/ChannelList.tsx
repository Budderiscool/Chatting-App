import React from 'react';
import { Channel, Server, User } from '../types';
import { Hash, Plus, Mic, Settings } from 'lucide-react';
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
    <div className="w-60 bg-discord-darker flex flex-col flex-shrink-0">
      {/* Server Header */}
      <div className="h-12 px-4 flex items-center font-bold text-white border-b border-discord-darkest shadow-sm hover:bg-white/5 transition-colors cursor-pointer">
        <span className="truncate">{server.name}</span>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <div className="flex items-center justify-between px-2 pt-4 pb-1 text-xs font-bold text-discord-textMuted uppercase hover:text-discord-text group">
          <span>Text Channels</span>
          <button onClick={onAddChannel} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:text-discord-text">
            <Plus size={14} />
          </button>
        </div>

        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onSelect(channel)}
            className={clsx(
              "w-full flex items-center px-2 py-[5px] rounded mx-0.5 mb-0.5 group transition-colors",
              selectedChannelId === channel.id 
                ? "bg-discord-light text-white" 
                : "text-discord-textMuted hover:bg-discord-light/50 hover:text-discord-text"
            )}
          >
            <Hash size={20} className="mr-1.5 text-discord-textMuted" />
            <span className="truncate font-medium">{channel.name}</span>
          </button>
        ))}
      </div>

      {/* User Footer */}
      <div className="bg-[#232428] px-2 py-1.5 flex items-center">
        <div className="w-8 h-8 rounded-full bg-discord-primary flex items-center justify-center text-white text-sm font-bold mr-2">
          {currentUser.username.substring(0, 1).toUpperCase()}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-white text-sm font-bold truncate leading-tight">
            {currentUser.username}
          </div>
          <div className="text-discord-textMuted text-xs leading-tight">
            #{currentUser.id.substring(0, 4)}
          </div>
        </div>
        <div className="flex items-center space-x-1">
            <button className="p-1.5 rounded hover:bg-discord-light text-discord-text">
                <Mic size={18} />
            </button>
            <button className="p-1.5 rounded hover:bg-discord-light text-discord-text">
                <Settings size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};
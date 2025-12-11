import React from 'react';
import { Server } from '../types';
import { Plus, Gamepad2 } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  servers: Server[];
  selectedServerId?: string;
  onSelect: (server: Server) => void;
  onAddServer: () => void;
}

export const ServerList: React.FC<Props> = ({ servers, selectedServerId, onSelect, onAddServer }) => {
  return (
    <div className="w-[72px] bg-discord-darkest flex flex-col items-center py-3 space-y-2 overflow-y-auto hide-scrollbar z-20">
      
      {/* Home / Direct Messages Button Placeholder */}
      <div className="relative group w-full flex justify-center mb-2">
         <div className={clsx(
            "absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-lg transition-all duration-200",
            "h-0 opacity-0 group-hover:h-5 group-hover:opacity-100" // Not active for this demo
          )} />
        <button
          className="w-12 h-12 rounded-[24px] bg-discord-dark transition-all duration-200 hover:rounded-[16px] hover:bg-discord-primary flex items-center justify-center text-discord-text"
        >
           <Gamepad2 size={28} />
        </button>
      </div>

      <div className="w-8 h-[2px] bg-discord-darker rounded-lg mx-auto mb-2" />

      {/* Server Items */}
      {servers.map((server) => (
        <div key={server.id} className="relative group w-full flex justify-center">
           {/* Active Pill */}
          <div className={clsx(
            "absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-lg transition-all duration-200 origin-left",
            selectedServerId === server.id ? "h-10 opacity-100 scale-100" : "h-2 scale-0 opacity-0 group-hover:opacity-100 group-hover:h-5 group-hover:scale-100"
          )} />
          
          <button
            onClick={() => onSelect(server)}
            className={clsx(
              "w-12 h-12 transition-all duration-200 flex items-center justify-center text-discord-text overflow-hidden relative group-active:translate-y-[1px]",
              selectedServerId === server.id 
                ? "bg-discord-primary rounded-[16px]" 
                : "bg-discord-dark hover:bg-discord-primary rounded-[24px] hover:rounded-[16px]"
            )}
          >
             {/* If we had images, they would go here. For now, text fallback. */}
             <span className="font-medium text-sm transition-transform duration-200 group-hover:scale-110">
               {server.name.substring(0, 2).toUpperCase()}
             </span>
          </button>
          
          {/* Tooltip */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-black text-white text-sm font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity shadow-xl">
            {server.name}
            {/* Triangle pointing left */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-black transform rotate-45" />
          </div>
        </div>
      ))}

      {/* Add Server Button */}
      <div className="relative group w-full flex justify-center mt-2">
         <button
            onClick={onAddServer}
            className="w-12 h-12 rounded-[24px] bg-discord-dark transition-all duration-200 hover:rounded-[16px] hover:bg-discord-green flex items-center justify-center text-discord-green hover:text-white group-active:translate-y-[1px]"
          >
            <Plus size={24} />
          </button>
           <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-black text-white text-sm font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl">
            Add a Server
            <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-black transform rotate-45" />
          </div>
      </div>
    </div>
  );
};
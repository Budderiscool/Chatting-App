import React from 'react';
import { Server } from '../types';
import { Plus } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  servers: Server[];
  selectedServerId?: string;
  onSelect: (server: Server) => void;
  onAddServer: () => void;
}

export const ServerList: React.FC<Props> = ({ servers, selectedServerId, onSelect, onAddServer }) => {
  return (
    <div className="w-[72px] bg-discord-darkest flex flex-col items-center py-3 space-y-2 overflow-y-auto hide-scrollbar">
      {servers.map((server) => (
        <div key={server.id} className="relative group w-full flex justify-center">
           {/* Active Pill */}
          <div className={clsx(
            "absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-r-lg transition-all duration-200",
            selectedServerId === server.id ? "h-10" : "h-2 group-hover:h-5 opacity-0 group-hover:opacity-100"
          )} />
          
          <button
            onClick={() => onSelect(server)}
            className={clsx(
              "w-12 h-12 rounded-[24px] bg-discord-dark transition-all duration-200 hover:rounded-[16px] flex items-center justify-center text-discord-text overflow-hidden group-hover:bg-discord-primary",
              selectedServerId === server.id && "bg-discord-primary rounded-[16px]"
            )}
          >
             {/* Placeholder Icon */}
             <span className="font-bold text-sm">
               {server.name.substring(0, 2).toUpperCase()}
             </span>
          </button>
          
          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
            {server.name}
          </div>
        </div>
      ))}

      {/* Add Server Button */}
      <div className="relative group w-full flex justify-center mt-2">
         <button
            onClick={onAddServer}
            className="w-12 h-12 rounded-[24px] bg-discord-dark transition-all duration-200 hover:rounded-[16px] hover:bg-green-600 flex items-center justify-center text-green-500 hover:text-white"
          >
            <Plus size={24} />
          </button>
           <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            Create Server
          </div>
      </div>
    </div>
  );
};
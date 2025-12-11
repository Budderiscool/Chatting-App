import React from 'react';
import { Server } from '../types';
import { Plus, Home } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  servers: Server[];
  selectedServerId?: string;
  onSelect: (server: Server | null) => void;
  onAddServer: () => void;
  isAdmin: boolean;
}

export const ServerList: React.FC<Props> = ({ servers, selectedServerId, onSelect, onAddServer, isAdmin }) => {
  return (
    <div className="flex items-center gap-3 h-full">
      {/* Home Button (DMs) */}
      <div className="relative group">
        <button
          onClick={() => onSelect(null)}
          className={clsx(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 hover:-translate-y-1",
            !selectedServerId ? "bg-primary text-white" : "bg-surfaceHighlight text-textMuted hover:text-white hover:bg-primary"
          )}
        >
           <Home size={24} />
        </button>
        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/90 backdrop-blur text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-y-2 group-hover:translate-y-0 whitespace-nowrap z-50">
            Direct Messages
        </div>
      </div>

      <div className="w-[1px] h-8 bg-white/10 rounded-full" />

      {servers.map((server) => (
        <div key={server.id} className="relative group">
           {selectedServerId === server.id && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]"></span>
           )}
          <button
            onClick={() => onSelect(server)}
            className={clsx(
              "w-12 h-12 flex items-center justify-center text-text font-bold transition-all duration-300 shadow-lg hover:-translate-y-1",
              selectedServerId === server.id 
                ? "bg-primary rounded-2xl shadow-primary/40 text-white" 
                : "bg-surfaceHighlight hover:bg-surfaceHighlight/80 rounded-2xl hover:rounded-xl text-textMuted hover:text-white"
            )}
          >
             {server.name.substring(0, 2).toUpperCase()}
          </button>
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/90 backdrop-blur text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-y-2 group-hover:translate-y-0 whitespace-nowrap z-50">
            {server.name}
          </div>
        </div>
      ))}

      {isAdmin && (
        <div className="relative group">
            <button
                onClick={onAddServer}
                className="w-12 h-12 rounded-2xl bg-surfaceHighlight border-2 border-dashed border-white/20 hover:border-green-500 hover:bg-green-500/10 text-green-500 transition-all duration-300 flex items-center justify-center hover:-translate-y-1"
            >
                <Plus size={24} />
            </button>
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/90 backdrop-blur text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-y-2 group-hover:translate-y-0 whitespace-nowrap z-50">
                Add Server
            </div>
        </div>
      )}
    </div>
  );
};
export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  status?: 'online' | 'offline'; // Client-side only
}

export interface Server {
  id: string;
  name: string;
  created_at: string;
}

export interface Channel {
  id: string;
  server_id: string | null; // Null for DMs
  name: string;
  is_dm?: boolean;
  created_at: string;
}

export interface Reaction {
  emoji: string;
  user_ids: string[];
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  media_url?: string; // For images/gifs
  media_type?: 'image' | 'video';
  created_at: string;
  users?: User;
  reactions?: { [key: string]: string[] }; // JSONB: { "👍": ["user_id_1", "user_id_2"] }
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  joined_at: string;
  users?: User;
}
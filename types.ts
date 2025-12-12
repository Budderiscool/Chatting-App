
export const CLIENT_VERSION = '1.0.0';

export interface User {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  status?: 'online' | 'offline'; // Client-side only
  password?: string; // Stored for demo authentication
  last_username_change?: string;
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
  last_message_at?: string; // New field for unread logic
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
  reactions?: { [key: string]: string[] };
  reply_to_message_id?: string | null;
  reply_to_message?: Message; // Joined data
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  joined_at: string;
  users?: User;
}
export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface Server {
  id: string;
  name: string;
  created_at: string;
}

export interface Channel {
  id: string;
  server_id: string;
  name: string;
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  users?: User; // Joined user data
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  joined_at: string;
  users?: User; // Joined user data
}

export interface RealtimeMessagePayload {
  new: Message;
  old: Message;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}
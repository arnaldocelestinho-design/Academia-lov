export type UserType = 'normal' | 'premium' | 'admin';

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  user_type: UserType;
  created_at: string;
  avatar_url?: string;
  address?: string;
}

export interface PremiumData {
  user_id: string;
  bi_number: string;
  birth_date: string;
  age: number;
  gender: string;
  address: string;
  height: number;
}

export interface Post {
  id: string;
  user_id: string;
  type: 'image' | 'video';
  content_url: string;
  description: string;
  created_at: string;
  profiles?: UserProfile;
  likes_count: number;
  comments_count: number;
  has_liked?: boolean;
}

export interface Story {
  id: string;
  user_id: string;
  type: 'image' | 'video' | 'text';
  content_url?: string;
  text_content?: string;
  created_at: string;
  profiles?: UserProfile;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: UserProfile;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  content_url?: string;
  created_at: string;
  is_read: boolean;
}

export type UserRole = 'normal' | 'premium' | 'admin';

export interface UserProfile {
  id: string;
  displayName: string;
  phoneNumber: string;
  role: UserRole;
  photoURL?: string;
  createdAt: string;
  isPremium: boolean;
  bi?: string;
  birthDate?: string;
  age?: number;
  gender?: string;
  address?: string;
  height?: string;
}

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorPhoto?: string;
  type: 'image' | 'video';
  contentUrl: string;
  description?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  type: 'text' | 'image' | 'video' | 'audio';
  mediaUrl?: string;
  createdAt: string;
  read: boolean;
}

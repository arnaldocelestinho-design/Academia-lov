import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MoreVertical, Phone, Video, Send, Mic, Image as ImageIcon, CheckCheck, ArrowLeft, Paperclip, Smile, FileText, X } from 'lucide-react';
import { Input } from './UI';
import { supabase } from '../lib/supabase';
import { UserProfile, ChatMessage } from '../types';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import imageCompression from 'browser-image-compression';

export const Chat: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [selectedChat, setSelectedChat] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isCalling, setIsCalling] = useState<'voice' | 'video' | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
      markAsRead();
      
      const subscription = supabase
        .channel(`chat:${selectedChat.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${user.id}))`
        }, (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => {
            // Avoid duplicates from optimistic updates
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          if (newMessage.receiver_id === user.id) {
            markAsRead();
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id.eq.${user.id}`
        }, (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          setMessages(prev => prev.map(m => m.id === updatedMessage.id ? updatedMessage : m));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [selectedChat]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const markAsRead = async () => {
    if (!selectedChat) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', selectedChat.id)
      .eq('is_read', false);
  };

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id);
      
      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (type: ChatMessage['type'] = 'text', contentUrl?: string) => {
    if (!message.trim() && type === 'text') return;
    if (!selectedChat) return;

    const tempId = crypto.randomUUID();
    const newMessage: ChatMessage = {
      id: tempId,
      sender_id: user.id,
      receiver_id: selectedChat.id,
      message: type === 'text' ? message : '',
      type,
      content_url: contentUrl,
      is_read: false,
      created_at: new Date().toISOString()
    };

    // Optimistic update
    setMessages(prev => [...prev, newMessage]);
    const currentMessage = message;
    setMessage('');
    setShowEmojiPicker(false);

    try {
      const { data, error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: selectedChat.id,
        message: type === 'text' ? currentMessage : '',
        type,
        content_url: contentUrl
      }).select().single();

      if (error) throw error;
      
      // Replace temp message with real one
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    } catch (error) {
      console.error('Error sending message:', error);
      // Rollback optimistic update
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;

    let fileToProcess = file;
    if (file.type.startsWith('image/')) {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true };
      try {
        fileToProcess = await imageCompression(file, options);
      } catch (error) {
        console.error('Compression error:', error);
      }
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      let type: ChatMessage['type'] = 'image';
      if (file.type.startsWith('video')) type = 'video';
      else if (file.type.startsWith('audio')) type = 'audio';
      else if (!file.type.startsWith('image')) type = 'document';

      await handleSendMessage(type, base64);
    };
    reader.readAsDataURL(fileToProcess);
  };

  const onEmojiClick = (emojiData: any) => {
    setMessage(prev => prev + emojiData.emoji);
  };

  if (isCalling) {
    return (
      <div className="fixed inset-0 bg-luxury-black z-[100] flex flex-col items-center justify-center p-8 text-center">
        <div className="space-y-6">
          <div className="w-32 h-32 rounded-full border-4 border-gold-primary p-1 mx-auto">
            <img src={selectedChat?.avatar_url || `https://picsum.photos/seed/${selectedChat?.id}/200`} className="w-full h-full rounded-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold">{selectedChat?.full_name}</h2>
            <p className="text-gold-light/60 uppercase tracking-widest text-xs mt-2">
              Chamada de {isCalling === 'video' ? 'Vídeo' : 'Voz'} em curso...
            </p>
          </div>
          <div className="flex gap-8">
            <button onClick={() => setIsCalling(null)} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl">
              <X size={32} />
            </button>
            {isCalling === 'video' && (
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white">
                <Video size={32} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (selectedChat) {
    return (
      <div className="fixed inset-0 bg-luxury-black z-[60] flex flex-col">
        {/* Chat Header */}
        <div className="bg-white/5 p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedChat(null)} className="text-gold-primary">
              <ArrowLeft size={24} />
            </button>
            <div className="w-10 h-10 rounded-full border border-gold-primary overflow-hidden">
              <img src={selectedChat.avatar_url || `https://picsum.photos/seed/${selectedChat.id}/100`} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{selectedChat.full_name}</h3>
              <p className="text-[10px] text-gold-primary uppercase tracking-widest">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-gold-primary">
            <button onClick={() => setIsCalling('video')}><Video size={20} /></button>
            <button onClick={() => setIsCalling('voice')}><Phone size={20} /></button>
            <MoreVertical size={20} />
          </div>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                msg.sender_id === user.id 
                  ? 'bg-gold-primary/20 border border-gold-primary/30 rounded-tr-none' 
                  : 'bg-white/10 rounded-tl-none'
              }`}>
                {msg.type === 'text' && <p className="text-sm">{msg.message}</p>}
                {msg.type === 'image' && <img src={msg.content_url} className="rounded-lg max-w-full" loading="lazy" />}
                {msg.type === 'video' && <video src={msg.content_url} controls className="rounded-lg max-w-full" />}
                {msg.type === 'document' && (
                  <div className="flex items-center gap-2 text-gold-light">
                    <FileText size={20} />
                    <span className="text-xs">Documento</span>
                  </div>
                )}
                <div className="flex items-center justify-end gap-1 mt-1">
                  <p className="text-[10px] opacity-40">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {msg.sender_id === user.id && (
                    <CheckCheck size={12} className={msg.is_read ? "text-blue-400" : "text-gold-primary"} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="absolute bottom-20 left-4 right-4 z-50"
            >
              <EmojiPicker 
                onEmojiClick={onEmojiClick}
                theme={Theme.DARK}
                width="100%"
                height={350}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="text-gold-primary">
            <Paperclip size={24} />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-gold-primary">
            <Smile size={24} />
          </button>
          <div className="flex-1">
            <input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Mensagem..."
              className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-gold-primary"
            />
          </div>
          {message ? (
            <button onClick={() => handleSendMessage()} className="gold-gradient w-10 h-10 rounded-full flex items-center justify-center text-luxury-black">
              <Send size={20} />
            </button>
          ) : (
            <button className="text-gold-primary">
              <Mic size={24} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold gold-text-gradient">Mensagens</h2>
        <div className="flex gap-4 text-gold-primary">
          <Search size={24} />
          <MoreVertical size={24} />
        </div>
      </div>

      <div className="space-y-2">
        {chats.map((chat) => (
          <button 
            key={chat.id}
            onClick={() => setSelectedChat(chat)}
            className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-colors text-left"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full border border-gold-primary p-0.5">
                <img src={chat.avatar_url || `https://picsum.photos/seed/${chat.id}/100`} className="w-full h-full rounded-full object-cover" />
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-luxury-black rounded-full" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm">{chat.full_name}</h3>
                <span className="text-[10px] text-white/40">Online</span>
              </div>
              <p className="text-xs text-white/60 line-clamp-1">Clique para conversar...</p>
            </div>
          </button>
        ))}
      </div>

      {user.user_type === 'normal' && (
        <div className="bg-gold-primary/10 border border-gold-primary/20 p-6 rounded-2xl text-center space-y-3">
          <Crown className="mx-auto text-gold-primary" size={32} />
          <h3 className="font-bold">Chat Exclusivo</h3>
          <p className="text-xs text-white/60">Somente membros PREMIUM podem conversar com a elite da moda.</p>
          <button className="text-gold-primary text-sm font-bold uppercase tracking-widest">Fazer Upgrade</button>
        </div>
      )}
    </div>
  );
};

const Crown = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    className={className} 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);

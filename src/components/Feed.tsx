import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Share2, PlusCircle, Home, MessageSquare, User, Settings, ShieldCheck, X, Send } from 'lucide-react';
import { Button, Input } from './UI';
import { supabase } from '../lib/supabase';
import { Post, UserProfile, Story, Comment } from '../types';

export const Feed: React.FC<{ user: UserProfile, onAddStory: () => void }> = ({ user, onAddStory }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });
      
      if (postsError) throw postsError;

      // Check likes for each post
      const postsWithLikes = await Promise.all((postsData || []).map(async (post) => {
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        
        return { ...post, has_liked: count ? count > 0 : false };
      }));

      setPosts(postsWithLikes);

      // Fetch Stories (last 24h)
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);
      
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*, profiles(*)')
        .gt('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;
      setStories(storiesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, hasLiked: boolean) => {
    try {
      if (hasLiked) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      }
      
      // Update local state
      setPosts(posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            has_liked: !hasLiked,
            likes_count: hasLiked ? p.likes_count - 1 : p.likes_count + 1
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleShare = async (post: Post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BIG LOVA-FASHION',
          text: post.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      alert('Link copiado para a área de transferência!');
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const openComments = async (post: Post) => {
    setSelectedPost(post);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(*)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: selectedPost.id,
          user_id: user.id,
          content: newComment
        })
        .select('*, profiles(*)')
        .single();
      
      if (error) throw error;
      setComments([...comments, data]);
      setNewComment('');
      
      // Update post comment count locally
      setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, comments_count: p.comments_count + 1 } : p));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const openWhatsApp = () => {
    const phone = "+258848342617";
    const text = "Olá, preciso de ajuda com o BIG LOVA-FASHION.";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="pb-20 pt-4">
      {/* Stories */}
      <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar">
        <button 
          onClick={onAddStory}
          className="flex-shrink-0 flex flex-col items-center gap-1"
        >
          <div className="w-16 h-16 rounded-full border-2 border-gold-primary p-0.5">
            <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center">
              <PlusCircle className="text-gold-primary" size={24} />
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-tighter text-white/60">Seu Story</span>
        </button>
        
        {stories.map((story) => (
          <div key={story.id} className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="w-16 h-16 rounded-full border-2 border-gold-primary p-0.5">
              {story.type === 'text' ? (
                <div className="w-full h-full rounded-full bg-gold-primary/20 flex items-center justify-center p-1 overflow-hidden">
                  <span className="text-[8px] text-center font-bold text-gold-light line-clamp-2">{story.text_content}</span>
                </div>
              ) : (
                <img 
                  src={story.content_url} 
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              )}
            </div>
            <span className="text-[10px] uppercase tracking-tighter text-white/60 truncate w-16 text-center">
              {story.profiles?.full_name.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-6 px-4">
        {posts.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-white/40 italic">Nenhuma postagem ainda. Seja o primeiro!</p>
          </div>
        )}
        
        {posts.map((post) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 luxury-shadow"
          >
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-gold-primary overflow-hidden">
                <img src={post.profiles?.avatar_url || `https://picsum.photos/seed/${post.user_id}/100`} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h3 className="font-bold text-sm">{post.profiles?.full_name || 'Usuário Fashion'}</h3>
                  {post.profiles?.user_type === 'premium' && <ShieldCheck size={14} className="text-gold-primary" />}
                </div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Maputo, MZ</p>
              </div>
            </div>

            <div className="aspect-square bg-black">
              {post.type === 'video' ? (
                <video src={post.content_url} className="w-full h-full object-cover" controls preload="metadata" />
              ) : (
                <img src={post.content_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
              )}
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleLike(post.id, post.has_liked || false)}
                  className={`transition-colors ${post.has_liked ? 'text-red-500' : 'text-white/80 hover:text-gold-primary'}`}
                >
                  <Heart size={24} fill={post.has_liked ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={() => openComments(post)}
                  className="text-white/80 hover:text-gold-primary transition-colors"
                >
                  <MessageCircle size={24} />
                </button>
                <button 
                  onClick={() => handleShare(post)}
                  className="text-white/80 hover:text-gold-primary transition-colors"
                >
                  <Share2 size={24} />
                </button>
              </div>
              
              <div className="text-sm">
                <p className="font-bold text-gold-light mb-1">{post.likes_count} curtidas</p>
                <span className="font-bold mr-2">{post.profiles?.full_name}</span>
                <span className="text-white/80">{post.description}</span>
              </div>
              
              {post.comments_count > 0 && (
                <button 
                  onClick={() => openComments(post)}
                  className="text-xs text-white/40 hover:text-gold-primary transition-colors"
                >
                  Ver todos os {post.comments_count} comentários
                </button>
              )}
              
              <p className="text-[10px] text-white/30 uppercase tracking-widest">
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comments Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-luxury-black w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/10 flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-display font-bold gold-text-gradient">Comentários</h3>
                <button onClick={() => setSelectedPost(null)} className="text-white/40">
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full border border-gold-primary overflow-hidden flex-shrink-0">
                      <img src={comment.profiles?.avatar_url || `https://picsum.photos/seed/${comment.user_id}/100`} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{comment.profiles?.full_name}</span>
                        <span className="text-[10px] text-white/30">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-white/80">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/10 flex gap-2">
                <input 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adicione um comentário..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-gold-primary"
                />
                <button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="gold-gradient w-10 h-10 rounded-full flex items-center justify-center text-luxury-black disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Support Button */}
      <button 
        onClick={openWhatsApp}
        className="fixed bottom-24 right-6 w-14 h-14 gold-gradient rounded-full flex items-center justify-center shadow-2xl z-40 hover:scale-110 transition-transform"
      >
        <MessageSquare className="text-luxury-black" size={28} />
      </button>
    </div>
  );
};

export const Navigation: React.FC<{ activeTab: string, setActiveTab: (tab: string) => void }> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'publish', icon: PlusCircle, label: 'Publicar' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'profile', icon: User, label: 'Perfil' },
    { id: 'settings', icon: Settings, label: 'Config' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-luxury-black/90 backdrop-blur-md border-t border-white/10 px-6 py-3 flex justify-between items-center z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === tab.id ? 'text-gold-primary' : 'text-white/40'}`}
        >
          <tab.icon size={24} />
          <span className="text-[10px] uppercase tracking-tighter font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, Video as VideoIcon, X, Send, Camera, Type } from 'lucide-react';
import { Button, Input } from './UI';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import imageCompression from 'browser-image-compression';

interface PublishProps {
  user: UserProfile;
  onSuccess: () => void;
  type: 'post' | 'story';
}

export const Publish: React.FC<PublishProps> = ({ user, onSuccess, type }) => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState<'image' | 'video' | 'text'>(type === 'story' ? 'text' : 'image');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      let fileToProcess = selectedFile;
      
      // Compress image if it's an image
      if (selectedFile.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        try {
          fileToProcess = await imageCompression(selectedFile, options);
        } catch (error) {
          console.error('Compression error:', error);
        }
      }

      setFile(fileToProcess);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setContentType(fileToProcess.type.startsWith('video') ? 'video' : 'image');
      };
      reader.readAsDataURL(fileToProcess);
    }
  };

  const handlePublish = async () => {
    if (!file && contentType !== 'text') return;
    setLoading(true);

    try {
      let contentUrl = '';
      
      if (file) {
        // For this demo/preview environment, we'll use the base64 preview as the URL
        // In production, you MUST use Supabase Storage
        contentUrl = preview || '';
      }

      if (type === 'post') {
        const { error } = await supabase.from('posts').insert({
          user_id: user.id,
          type: contentType as 'image' | 'video',
          content_url: contentUrl,
          description: content
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('stories').insert({
          user_id: user.id,
          type: contentType,
          content_url: contentType === 'text' ? null : contentUrl,
          text_content: contentType === 'text' ? content : null
        });
        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      alert('Erro ao publicar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold gold-text-gradient">
          {type === 'post' ? 'Nova Postagem' : 'Novo Status'}
        </h2>
        <button onClick={() => setPreview(null)} className="text-white/40">
          <X size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {preview ? (
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black">
            {contentType === 'video' ? (
              <video src={preview} className="w-full h-full object-cover" controls />
            ) : (
              <img src={preview} className="w-full h-full object-cover" />
            )}
            <button 
              onClick={() => { setPreview(null); setFile(null); }}
              className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <label className="aspect-square bg-white/5 rounded-2xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
              <ImageIcon className="text-gold-primary" size={32} />
              <span className="text-xs uppercase tracking-widest text-white/40">Foto</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
            <label className="aspect-square bg-white/5 rounded-2xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
              <VideoIcon className="text-gold-primary" size={32} />
              <span className="text-xs uppercase tracking-widest text-white/40">Vídeo</span>
              <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            </label>
            {type === 'story' && (
              <button 
                onClick={() => setContentType('text')}
                className="col-span-2 p-4 bg-white/5 rounded-2xl border border-dashed border-white/20 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
              >
                <Type className="text-gold-primary" size={24} />
                <span className="text-xs uppercase tracking-widest text-white/40">Apenas Texto</span>
              </button>
            )}
          </div>
        )}

        {contentType === 'text' && type === 'story' && (
          <div className="bg-gold-primary/10 p-8 rounded-2xl border border-gold-primary/30 min-h-[200px] flex items-center justify-center">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="O que você está pensando?"
              className="w-full bg-transparent text-center text-xl font-display text-gold-light placeholder:text-gold-light/30 focus:outline-none resize-none"
              rows={4}
            />
          </div>
        )}

        {type === 'post' && (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva uma legenda luxuosa..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-gold-primary resize-none"
            rows={3}
          />
        )}

        <Button 
          onClick={handlePublish} 
          className="w-full" 
          disabled={loading || (!file && contentType !== 'text')}
        >
          {loading ? 'Publicando...' : (
            <div className="flex items-center gap-2">
              <Send size={18} />
              <span>PUBLICAR AGORA</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

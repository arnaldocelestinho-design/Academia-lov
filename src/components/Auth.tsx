import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button, Input } from './UI';
import { supabase } from '../lib/supabase';

export const Auth: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  });

  const isConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      alert('Configuração do Supabase ausente. Por favor, adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nos Secrets.');
      return;
    }
    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
              user_type: 'normal'
            }
          }
        });
        if (error) throw error;
      }
      onAuth();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-luxury-black">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <h2 className="text-4xl font-display font-bold gold-text-gradient">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p className="text-white/40 mt-2">
            {isLogin ? 'Entre para acessar o mundo da moda' : 'Junte-se à elite da moda fashion'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <Input 
                label="Nome Completo" 
                placeholder="Seu nome luxuoso"
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                required
              />
              <Input 
                label="Número de Telefone" 
                placeholder="+258 ..."
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                required
              />
            </>
          )}
          <Input 
            label="Email" 
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            required
          />
          <Input 
            label="Palavra-passe" 
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            required
          />
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Processando...' : isLogin ? 'ENTRAR' : 'CRIAR CONTA'}
          </Button>
        </form>

        <div className="text-center space-y-4">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-gold-primary hover:text-gold-light transition-colors text-sm font-medium"
          >
            {isLogin ? 'Não tem uma conta? Crie agora' : 'Já tem uma conta? Entre'}
          </button>
          
          {isLogin && (
            <button className="block w-full text-white/30 hover:text-white/50 text-xs uppercase tracking-widest">
              Esqueci minha palavra-passe
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

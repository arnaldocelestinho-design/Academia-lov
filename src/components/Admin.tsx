import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Users, BarChart3, Trash2, UserPlus, Ban, Bell } from 'lucide-react';
import { Button } from './UI';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export const AdminPanel: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [isAdminExists, setIsAdminExists] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_type', 'admin');
    
    if (data && data.length === 0) {
      setIsAdminExists(false);
    }
  };

  const becomeAdmin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: 'admin' })
        .eq('id', user.id);
      
      if (error) throw error;
      alert('Você agora é o ADMINISTRADOR oficial!');
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (user.user_type !== 'admin') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        {!isAdminExists ? (
          <>
            <div className="w-20 h-20 gold-gradient rounded-full flex items-center justify-center shadow-2xl animate-bounce">
              <ShieldAlert size={40} className="text-luxury-black" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold gold-text-gradient">Vaga de Administrador</h2>
              <p className="text-white/60 text-sm">Não existe um administrador no sistema. Você deseja assumir o controle total?</p>
            </div>
            <Button onClick={becomeAdmin} disabled={loading} className="w-full max-w-xs">
              {loading ? 'Processando...' : '🟡 TORNAR-SE ADMINISTRADOR'}
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <ShieldAlert size={64} className="mx-auto text-white/10" />
            <p className="text-white/40 italic">Acesso restrito ao Administrador oficial.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold gold-text-gradient">Painel Admin</h2>
        <div className="bg-gold-primary/20 p-2 rounded-lg">
          <BarChart3 className="text-gold-primary" size={20} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Usuários</p>
          <p className="text-2xl font-bold">1,284</p>
        </div>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Premium</p>
          <p className="text-2xl font-bold text-gold-primary">342</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Ações Rápidas</h3>
        <div className="grid grid-cols-1 gap-3">
          <button className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
            <UserPlus className="text-gold-primary" size={20} />
            <span className="text-sm">Adicionar Usuário Manualmente</span>
          </button>
          <button className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
            <Ban className="text-red-500" size={20} />
            <span className="text-sm">Bloquear Contas Suspeitas</span>
          </button>
          <button className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
            <Bell className="text-gold-primary" size={20} />
            <span className="text-sm">Enviar Anúncio Geral</span>
          </button>
          <button className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
            <Trash2 className="text-white/40" size={20} />
            <span className="text-sm">Remover Conteúdo Impróprio</span>
          </button>
        </div>
      </div>
    </div>
  );
};

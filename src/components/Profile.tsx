import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Shield, Crown, LogOut, ChevronRight, Phone, User as UserIcon, Calendar, MapPin, Ruler, UserCircle, Camera, Edit3, Save } from 'lucide-react';
import { Button, Input } from './UI';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export const Profile: React.FC<{ user: UserProfile, onLogout: () => void, onUpdate: () => void, onPremiumSuccess: () => void }> = ({ user, onLogout, onUpdate, onPremiumSuccess }) => {
  const [showPremiumForm, setShowPremiumForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    full_name: user.full_name,
    phone: user.phone,
    address: user.address || ''
  });

  const [premiumData, setPremiumData] = useState({
    bi: '',
    birthDate: '',
    age: '',
    gender: '',
    address: '',
    height: ''
  });

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          address: profileData.address
        })
        .eq('id', user.id);
      
      if (error) throw error;
      setIsEditing(false);
      onUpdate();
      alert('Perfil atualizado com sucesso!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert('Senha atualizada com sucesso!');
      setNewPassword('');
      setShowPasswordUpdate(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: base64 })
          .eq('id', user.id);
        
        if (error) throw error;
        onUpdate();
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ user_type: 'premium' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: dataError } = await supabase
        .from('premium_data')
        .insert({
          user_id: user.id,
          bi_number: premiumData.bi,
          birth_date: premiumData.birthDate,
          age: parseInt(premiumData.age),
          gender: premiumData.gender,
          address: premiumData.address,
          height: parseFloat(premiumData.height)
        });

      if (dataError) throw dataError;
      
      alert('Parabéns! Você agora é um membro PREMIUM.');
      onUpdate();
      setShowPremiumForm(false);
      onPremiumSuccess(); // Redirect to home
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8 pb-24">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full border-4 border-gold-primary p-1 overflow-hidden">
            <img 
              src={user.avatar_url || `https://picsum.photos/seed/${user.id}/200`} 
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera className="text-white" size={24} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleAvatarUpload} 
          />
          {user.user_type === 'premium' && (
            <div className="absolute -bottom-2 -right-2 bg-gold-primary text-luxury-black p-1.5 rounded-full shadow-lg">
              <Crown size={20} />
            </div>
          )}
        </div>
        
        <div className="w-full max-w-xs space-y-2">
          {isEditing ? (
            <div className="space-y-3">
              <Input 
                value={profileData.full_name} 
                onChange={e => setProfileData({...profileData, full_name: e.target.value})}
                placeholder="Nome Completo"
              />
              <Input 
                value={profileData.phone} 
                onChange={e => setProfileData({...profileData, phone: e.target.value})}
                placeholder="Telefone"
              />
              <Input 
                value={profileData.address} 
                onChange={e => setProfileData({...profileData, address: e.target.value})}
                placeholder="Endereço"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowPasswordUpdate(!showPasswordUpdate)} className="text-[10px] text-gold-primary uppercase tracking-widest">Alterar Senha</button>
              </div>
              {showPasswordUpdate && (
                <div className="space-y-2">
                  <Input 
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Nova Senha"
                  />
                  <Button size="sm" variant="ghost" onClick={handleUpdatePassword} disabled={loading}>Confirmar Senha</Button>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="flex-1">Cancelar</Button>
                <Button size="sm" onClick={handleUpdateProfile} className="flex-1" disabled={loading}>Salvar</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-display font-bold">{user.full_name}</h2>
                <button onClick={() => setIsEditing(true)} className="text-gold-primary/60 hover:text-gold-primary">
                  <Edit3 size={16} />
                </button>
              </div>
              <p className="text-gold-light/60 uppercase tracking-widest text-xs">{user.user_type} Member</p>
              <p className="text-white/40 text-sm">{user.phone}</p>
              {user.address && <p className="text-white/40 text-xs italic">{user.address}</p>}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
          <p className="text-2xl font-bold gold-text-gradient">128</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40">Seguidores</p>
        </div>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
          <p className="text-2xl font-bold gold-text-gradient">45</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40">Posts</p>
        </div>
      </div>

      <div className="space-y-4">
        {user.user_type === 'normal' && !showPremiumForm && (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowPremiumForm(true)}
            className="gold-gradient p-6 rounded-2xl text-luxury-black cursor-pointer shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Torne-se Premium</h3>
                <p className="text-sm opacity-80">Acesse recursos exclusivos e rede de elite</p>
              </div>
              <Crown size={32} />
            </div>
          </motion.div>
        )}

        {showPremiumForm && (
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleUpgrade}
            className="bg-white/5 p-6 rounded-2xl border border-gold-primary/30 space-y-4"
          >
            <h3 className="text-xl font-display font-bold gold-text-gradient mb-4">Dados Premium</h3>
            <Input label="Número de BI" value={premiumData.bi} onChange={e => setPremiumData({...premiumData, bi: e.target.value})} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Data Nascimento" type="date" value={premiumData.birthDate} onChange={e => setPremiumData({...premiumData, birthDate: e.target.value})} required />
              <Input label="Idade" type="number" value={premiumData.age} onChange={e => setPremiumData({...premiumData, age: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Sexo" value={premiumData.gender} onChange={e => setPremiumData({...premiumData, gender: e.target.value})} required />
              <Input label="Altura (m)" type="number" step="0.01" value={premiumData.height} onChange={e => setPremiumData({...premiumData, height: e.target.value})} required />
            </div>
            <Input label="Endereço" value={premiumData.address} onChange={e => setPremiumData({...premiumData, address: e.target.value})} required />
            
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setShowPremiumForm(false)} className="flex-1">Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Processando...' : 'Confirmar'}</Button>
            </div>
          </motion.form>
        )}

        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="text-gold-primary" size={20} />
              <span className="text-sm">Privacidade e Segurança</span>
            </div>
            <ChevronRight size={16} className="text-white/20" />
          </button>
          <button 
            onClick={() => window.open('https://wa.me/258848342617', '_blank')}
            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-t border-white/5"
          >
            <div className="flex items-center gap-3">
              <Phone className="text-gold-primary" size={20} />
              <span className="text-sm">Suporte Oficial</span>
            </div>
            <ChevronRight size={16} className="text-white/20" />
          </button>
          <button 
            onClick={onLogout}
            className="w-full p-4 flex items-center justify-between hover:bg-red-500/10 transition-colors border-t border-white/5 text-red-500"
          >
            <div className="flex items-center gap-3">
              <LogOut size={20} />
              <span className="text-sm">Sair da Conta</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

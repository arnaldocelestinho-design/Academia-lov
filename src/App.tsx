/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { SplashScreen } from './components/SplashScreen';
import { Auth } from './components/Auth';
import { Feed, Navigation } from './components/Feed';
import { Profile } from './components/Profile';
import { Chat } from './components/Chat';
import { AdminPanel } from './components/Admin';
import { Publish } from './components/Publish';
import { UserProfile } from './types';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [publishType, setPublishType] = useState<'post' | 'story'>('post');

  useEffect(() => {
    // Splash screen timer
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    // Auth listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setUserProfile(null);
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setUserProfile(data);
    } else if (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  if (!session) {
    return <Auth onAuth={() => {}} />;
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-luxury-black flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gold-light/60 uppercase tracking-widest text-xs">Carregando seu perfil de elite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luxury-black text-luxury-white font-sans selection:bg-gold-primary selection:text-luxury-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-luxury-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <h1 className="font-display text-xl font-bold gold-text-gradient tracking-widest">
          BIG LOVA
        </h1>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full border border-gold-primary overflow-hidden">
            <img src={userProfile.avatar_url || `https://picsum.photos/seed/${userProfile.id}/100`} className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {activeTab === 'home' && (
          <Feed 
            user={userProfile} 
            onAddStory={() => {
              setPublishType('story');
              setActiveTab('publish');
            }} 
          />
        )}
        {activeTab === 'chat' && <Chat user={userProfile} />}
        {activeTab === 'profile' && (
          <Profile 
            user={userProfile} 
            onLogout={handleLogout} 
            onUpdate={() => fetchProfile(userProfile.id)}
            onPremiumSuccess={() => setActiveTab('home')}
          />
        )}
        {activeTab === 'settings' && <AdminPanel user={userProfile} />}
        {activeTab === 'publish' && (
          <Publish 
            user={userProfile} 
            type={publishType} 
            onSuccess={() => {
              setActiveTab('home');
              setPublishType('post');
            }} 
          />
        )}
      </main>

      <Navigation 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'publish') setPublishType('post');
        }} 
      />
    </div>
  );
}

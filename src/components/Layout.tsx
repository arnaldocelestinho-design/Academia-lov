import { ReactNode } from 'react';
import { Home, PlusSquare, MessageCircle, User, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: PlusSquare, label: 'Publicar', path: '/publish' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: User, label: 'Perfil', path: '/profile' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <header className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-md border-b border-white/10 z-40 px-4 h-16 flex items-center justify-between">
        <h1 className="text-amber-500 font-bold text-xl tracking-wider">BIG LOVA</h1>
        <div className="flex items-center gap-4">
          <button className="text-white/80 hover:text-amber-500 transition-colors">
            <PlusSquare size={24} />
          </button>
          <button className="text-white/80 hover:text-amber-500 transition-colors">
            <MessageCircle size={24} />
          </button>
        </div>
      </header>
      
      <main className="pt-20 px-4 max-w-2xl mx-auto">
        {children}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-white/10 z-40 h-16 flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all duration-300",
                isActive ? "text-amber-500 scale-110" : "text-white/60 hover:text-white"
              )}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium uppercase tracking-tighter">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

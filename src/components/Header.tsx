import React from 'react';
import { 
  Keyboard, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  Volume2, 
  VolumeX, 
  Laptop,
  Command
} from 'lucide-react';
import { TabType, Language } from '../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  currentProvider: string;
  currentModel: string;
  logCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  soundEnabled,
  setSoundEnabled,
  currentProvider,
  currentModel,
  logCount,
}) => {
  const isVi = language === 'vi';

  const navItems: { id: TabType; labelVi: string; labelEn: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'humanizer',
      labelVi: 'AI Humanizer',
      labelEn: 'AI Humanizer',
      icon: <Sparkles className="w-4 h-4" />,
      badge: 'PRO'
    },
    {
      id: 'autotyper',
      labelVi: 'AutoTyper Simulator',
      labelEn: 'AutoTyper Simulator',
      icon: <Keyboard className="w-4 h-4" />,
      badge: 'LIVE'
    },
    {
      id: 'prose',
      labelVi: 'Quy Tắc Văn Phong',
      labelEn: 'Prose & Anti-AI Rules',
      icon: <ShieldCheck className="w-4 h-4" />
    },
    {
      id: 'models',
      labelVi: 'Kho Mô Hình',
      labelEn: 'Model Catalog',
      icon: <Cpu className="w-4 h-4" />
    },
    {
      id: 'desktop',
      labelVi: 'Bản Desktop Python',
      labelEn: 'Desktop Companion',
      icon: <Laptop className="w-4 h-4" />
    },
    {
      id: 'logs',
      labelVi: 'Nhật Ký',
      labelEn: 'Live Logs',
      icon: <Terminal className="w-4 h-4" />,
      badge: logCount > 0 ? `${logCount}` : undefined
    }
  ];

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Top Banner with brand & status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-emerald-500 shadow-lg shadow-cyan-950/50">
              <Keyboard className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  AutoTyper <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">v2.4</span>
                </h1>
                <span className="text-zinc-600">/</span>
                <span className="text-xs font-medium text-zinc-400">Humanize Studio</span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                {isVi 
                  ? 'Viết lại văn bản AI tự nhiên & Giả lập gõ phím con người'
                  : 'Undetectable AI Rewriter & Natural Typing Simulator'}
              </p>
            </div>
          </div>

          {/* Quick status & toggles */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Active Model Indicator */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-zinc-400 font-mono text-[11px] uppercase">{currentProvider}:</span>
              <span className="text-zinc-200 font-medium font-mono text-[11px]">{currentModel}</span>
            </div>

            {/* Global Hotkeys Hint Button */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/60 px-2 py-1 rounded-md border border-zinc-800 font-mono text-[11px]">
              <Command className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-300">Ctrl+Shift+H</span>
              <span className="text-zinc-600">→</span>
              <span className="text-zinc-300">Ctrl+T</span>
            </div>

            {/* Sound Mute/Unmute */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mechanical keyboard clicks enabled' : 'Muted'}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Language Switch */}
            <button
              onClick={() => setLanguage(isVi ? 'en' : 'vi')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
            >
              {isVi ? '🇻🇳 VI' : '🇺🇸 EN'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70'
                }`}
              >
                {item.icon}
                <span>{isVi ? item.labelVi : item.labelEn}</span>
                {item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isActive 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

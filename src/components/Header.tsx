import React from 'react';
import {
  Keyboard,
  Sparkles,
  BookOpenCheck,
  FileCheck2,
  Presentation,
  ShieldCheck,
  Cpu,
  Terminal,
  Volume2,
  VolumeX,
  Laptop,
  CloudUpload,
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

  const navItems: {
    id: TabType;
    labelVi: string;
    labelEn: string;
    icon: React.ReactNode;
    activeStyle: string;
    idleStyle: string;
  }[] = [
    {
      id: 'humanizer',
      labelVi: 'AI Humanizer PRO',
      labelEn: 'AI Humanizer PRO',
      icon: <Sparkles className="w-4 h-4 text-yellow-200" />,
      activeStyle:
        'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-2 border-cyan-200 border-b-4 border-b-blue-900 shadow-[0_6px_18px_rgba(6,182,212,0.65)] scale-[1.02]',
      idleStyle:
        'bg-slate-800/95 text-cyan-200 border border-cyan-500/40 border-b-4 border-b-cyan-800 hover:bg-cyan-950/90 shadow-[0_4px_12px_rgba(6,182,212,0.28)]',
    },
    {
      id: 'autotyper',
      labelVi: 'AutoTyper Simulator',
      labelEn: 'AutoTyper Simulator',
      icon: <Keyboard className="w-4 h-4 text-emerald-200" />,
      activeStyle:
        'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-2 border-emerald-200 border-b-4 border-b-teal-900 shadow-[0_6px_18px_rgba(16,185,129,0.65)] scale-[1.02]',
      idleStyle:
        'bg-slate-800/95 text-emerald-200 border border-emerald-500/40 border-b-4 border-b-emerald-800 hover:bg-emerald-950/90 shadow-[0_4px_12px_rgba(16,185,129,0.28)]',
    },
    {
      id: 'lesson5512',
      labelVi: 'Giáo Án & Mã Màu',
      labelEn: 'Lesson Plan',
      icon: <BookOpenCheck className="w-4 h-4 text-sky-200" />,
      activeStyle:
        'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-2 border-blue-200 border-b-4 border-b-indigo-950 shadow-[0_6px_18px_rgba(59,130,246,0.65)] scale-[1.02]',
      idleStyle:
        'bg-slate-800/95 text-sky-200 border border-blue-500/40 border-b-4 border-b-blue-800 hover:bg-blue-950/90 shadow-[0_4px_12px_rgba(59,130,246,0.28)]',
    },
    {
      id: 'examsuite',
      labelVi: 'Sinh Đề · Phản Biện · Ma Trận',
      labelEn: 'Exam Suite & Matrix',
      icon: <FileCheck2 className="w-4 h-4 text-amber-200" />,
      activeStyle:
        'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-2 border-amber-200 border-b-4 border-b-orange-950 shadow-[0_6px_18px_rgba(245,158,11,0.65)] scale-[1.02]',
      idleStyle:
        'bg-slate-800/95 text-amber-200 border border-amber-500/40 border-b-4 border-b-amber-800 hover:bg-amber-950/90 shadow-[0_4px_12px_rgba(245,158,11,0.28)]',
    },
    {
      id: 'mediastudio',
      labelVi: 'Slide PPTX · Video · Game',
      labelEn: 'Slides · Video · Game',
      icon: <Presentation className="w-4 h-4 text-purple-200" />,
      activeStyle:
        'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white border-2 border-purple-200 border-b-4 border-b-purple-950 shadow-[0_6px_18px_rgba(168,85,247,0.65)] scale-[1.02]',
      idleStyle:
        'bg-slate-800/95 text-purple-200 border border-purple-500/40 border-b-4 border-b-purple-800 hover:bg-purple-950/90 shadow-[0_4px_12px_rgba(168,85,247,0.28)]',
    },
    {
      id: 'models',
      labelVi: 'Kho AI & Kết Nối (100%)',
      labelEn: 'AI Models & Sync',
      icon: <Cpu className="w-4 h-4 text-rose-200" />,
      activeStyle:
        'bg-gradient-to-r from-rose-500 to-pink-600 text-white border-2 border-rose-200 border-b-4 border-b-rose-950 shadow-[0_6px_18px_rgba(244,63,94,0.65)] scale-[1.02]',
      idleStyle:
        'bg-slate-800/95 text-rose-200 border border-rose-500/40 border-b-4 border-b-rose-800 hover:bg-rose-950/90 shadow-[0_4px_12px_rgba(244,63,94,0.28)]',
    },
    {
      id: 'sync',
      labelVi: 'Sao Lưu & Đồng Bộ Máy Khác',
      labelEn: 'Backup & Device Sync',
      icon: <CloudUpload className="w-4 h-4 text-teal-200" />,
      activeStyle:
        'bg-gradient-to-r from-teal-500 to-cyan-600 text-white border-2 border-teal-200 border-b-4 border-b-teal-950 shadow-[0_6px_18px_rgba(20,184,166,0.65)] scale-[1.02]',
      idleStyle:
        'bg-slate-800/95 text-teal-200 border border-teal-500/40 border-b-4 border-b-teal-800 hover:bg-teal-950/90 shadow-[0_4px_12px_rgba(20,184,166,0.28)]',
    },
    {
      id: 'prose',
      labelVi: 'Quy Tắc Văn Phong',
      labelEn: 'Prose Rules',
      icon: <ShieldCheck className="w-4 h-4 text-indigo-200" />,
      activeStyle:
        'bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-2 border-indigo-200 border-b-4 border-b-indigo-950 shadow-[0_6px_18px_rgba(99,102,241,0.65)] scale-[1.02]',
      idleStyle:
        'bg-slate-800/95 text-indigo-200 border border-indigo-500/40 border-b-4 border-b-indigo-800 hover:bg-indigo-950/90 shadow-[0_4px_12px_rgba(99,102,241,0.28)]',
    },
    {
      id: 'desktop',
      labelVi: 'GitHub & Desktop',
      labelEn: 'GitHub & Desktop',
      icon: <Laptop className="w-4 h-4 text-sky-200" />,
      activeStyle:
        'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-2 border-sky-200 border-b-4 border-b-blue-950 shadow-[0_6px_18px_rgba(14,165,233,0.65)] scale-[1.02]',
      idleStyle:
        'bg-slate-800/95 text-sky-200 border border-sky-500/40 border-b-4 border-b-sky-800 hover:bg-sky-950/90 shadow-[0_4px_12px_rgba(14,165,233,0.28)]',
    },
    {
      id: 'logs',
      labelVi: `Nhật Ký (${logCount})`,
      labelEn: `Logs (${logCount})`,
      icon: <Terminal className="w-4 h-4 text-amber-200" />,
      activeStyle:
        'bg-gradient-to-r from-slate-600 to-slate-800 text-white border-2 border-slate-300 border-b-4 border-b-slate-950 shadow-[0_6px_18px_rgba(148,163,184,0.5)] scale-[1.02]',
      idleStyle:
        'bg-slate-800/95 text-slate-200 border border-slate-500/40 border-b-4 border-b-slate-900 hover:bg-slate-700/90 shadow-[0_4px_12px_rgba(100,116,139,0.25)]',
    },
  ];

  return (
    <header className="frame-3d-header sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
        {/* Top Row: Redesigned 3D Emblem Logo + Blinking Title + Author Hồ Tấn Khải */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Custom 3D Royal Cyber-Crest Logo */}
            <div className="logo-3d-emblem w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden">
              <svg
                viewBox="0 0 48 48"
                className="w-8 h-8 drop-shadow-[0_2px_6px_rgba(255,255,255,0.6)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="crestGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FDE047" />
                    <stop offset="50%" stopColor="#38BDF8" />
                    <stop offset="100%" stopColor="#F472B6" />
                  </linearGradient>
                </defs>
                <polygon
                  points="24,4 42,14 42,34 24,44 6,34 6,14"
                  stroke="url(#crestGrad)"
                  strokeWidth="3"
                  fill="rgba(15,23,42,0.55)"
                />
                <path
                  d="M15 28L24 13L33 28H27L24 22L21 28H15Z"
                  fill="url(#crestGrad)"
                />
                <rect x="14" y="31" width="20" height="4" rx="2" fill="#FDE047" />
              </svg>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight brand-title-blink whitespace-nowrap">
                Auto Typer Studio Pro v3.0
              </h1>
              <p className="text-xs sm:text-sm font-bold text-amber-300 tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                Tác giả: Hồ Tấn Khải
              </p>
            </div>
          </div>

          {/* Right 3D Quick Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('models')}
              className="btn-3d btn-3d-indigo px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap"
              title="Đổi mô hình AI hoặc đồng bộ kết nối"
            >
              <Cpu className="w-4 h-4 text-yellow-300" />
              <span>{currentProvider.toUpperCase()} · {currentModel}</span>
            </button>

            <button
              onClick={() => setActiveTab('sync')}
              className="btn-3d btn-3d-emerald px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
              title="Sao lưu & Đồng bộ dữ liệu sang máy khác"
            >
              <CloudUpload className="w-4 h-4" />
              <span className="hidden sm:inline">{isVi ? 'Mã Sao Lưu' : 'Backup Sync'}</span>
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Âm thanh phím cơ: Đang bật' : 'Đã tắt âm thanh'}
              className={`btn-3d p-2 rounded-xl border ${
                soundEnabled
                  ? 'btn-3d-cyan'
                  : 'bg-slate-800 border-slate-600 border-b-4 border-b-slate-950 text-slate-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setLanguage(isVi ? 'en' : 'vi')}
              className="btn-3d btn-3d-amber px-3 py-2 text-xs font-extrabold rounded-xl whitespace-nowrap"
            >
              {isVi ? 'VI' : 'EN'}
            </button>
          </div>
        </div>

        {/* 3D Multi-Color Shadow Feature Navigation Bar */}
        <nav className="p-2 rounded-2xl bg-slate-900/90 border-2 border-sky-400/50 shadow-[0_8px_20px_rgba(2,132,199,0.3)] flex items-center gap-2 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`no-3d flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-150 ${
                  isActive ? item.activeStyle : item.idleStyle
                }`}
              >
                {item.icon}
                <span>{isVi ? item.labelVi : item.labelEn}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

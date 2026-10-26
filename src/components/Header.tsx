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

  const navItems: {
    id: TabType;
    labelVi: string;
    labelEn: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'humanizer',
      labelVi: '01. AI Humanizer PRO',
      labelEn: '01. AI Humanizer PRO',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
    },
    {
      id: 'autotyper',
      labelVi: '02. AutoTyper Simulator',
      labelEn: '02. AutoTyper Simulator',
      icon: <Keyboard className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'lesson5512',
      labelVi: '03-04. Giáo Án 5512 & Mã Màu',
      labelEn: '03-04. Lesson Plan 5512',
      icon: <BookOpenCheck className="w-4 h-4 text-blue-400" />,
    },
    {
      id: 'examsuite',
      labelVi: '05-07. Sinh Đề 3 Phần · Phản Biện · Ma Trận',
      labelEn: '05-07. Exam Suite & Audit',
      icon: <FileCheck2 className="w-4 h-4 text-amber-400" />,
    },
    {
      id: 'mediastudio',
      labelVi: '08-10. Slide PPTX · Video Vi Mô · Phiếu & Game',
      labelEn: '08-10. Slides · Video · Game',
      icon: <Presentation className="w-4 h-4 text-purple-400" />,
    },
    {
      id: 'prose',
      labelVi: 'Quy Tắc Văn Phong',
      labelEn: 'Prose Rules',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'models',
      labelVi: 'Kho Mô Hình',
      labelEn: 'Models',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: 'desktop',
      labelVi: 'GitHub & Desktop',
      labelEn: 'GitHub & Desktop',
      icon: <Laptop className="w-4 h-4" />,
    },
    {
      id: 'logs',
      labelVi: `Nhật Ký (${logCount})`,
      labelEn: `Logs (${logCount})`,
      icon: <Terminal className="w-4 h-4" />,
    },
  ];

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Architecture Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-600 text-white shadow-sm">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold tracking-tight text-white">
                <span>AutoTyper Studio Pro v3.0</span>
                <span className="text-zinc-600" aria-hidden="true">·</span>
                <span className="text-xs font-medium text-cyan-400">
                  {isVi ? 'Hệ Thống Sư Phạm Đa Năng 10-Trong-1' : '10-in-1 Pedagogical Platform'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">
                {isVi
                  ? 'Bảo tồn 100% v2.4 · Chuẩn Công văn 5512 · Khảo thí 3 phần mới · Web Worker 0% UI Freeze'
                  : '100% v2.4 Preserved · 5512 Lesson Plan · 3-Part Exam · Web Worker 0% UI Freeze'}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <span>{currentProvider.toUpperCase()}</span>
              <span aria-hidden="true">/</span>
              <span className="text-zinc-200">{currentModel}</span>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <Command className="w-3.5 h-3.5" />
              <span>Ctrl+Shift+H</span>
              <span aria-hidden="true">→</span>
              <span>Ctrl+T</span>
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Âm thanh phím cơ: Đang bật' : 'Đã tắt âm thanh'}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setLanguage(isVi ? 'en' : 'vi')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white hover:border-zinc-700 transition-colors"
            >
              {isVi ? 'VI' : 'EN'}
            </button>
          </div>
        </div>

        {/* 10-in-1 Navigation Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2.5 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/70'
                }`}
              >
                {item.icon}
                <span>{isVi ? item.labelVi : item.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

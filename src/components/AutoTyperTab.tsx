import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Gauge, 
  AlertCircle, 
  Sliders, 
  Clock, 
  Copy, 
  Check, 
  Terminal,
  ShieldAlert,
  Plus,
  Edit3,
  Trash2,
  Maximize2,
  Minimize2,
  Presentation,
  ZoomIn,
  ZoomOut,
  Palette,
  Download,
  FastForward,
} from 'lucide-react';
import { Language, UserSettings } from '../types';
import { TypingSimulator, TypingStats } from '../utils/typingEngine';
import { soundSynth } from '../utils/audioSynth';
import { LiveClassroomTwinPanel } from './ClassroomSimulatorTab';

interface AutoTyperTabProps {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  language: Language;
  preloadedText?: string;
  onOpenSimulatorTab?: () => void;
  onLog: (msg: string, level?: 'info' | 'hotkey' | 'engine' | 'warning' | 'error') => void;
}

type PresentationTheme = 'cyber-stage' | 'chalkboard' | 'paper-12pt';

export const AutoTyperTab: React.FC<AutoTyperTabProps> = ({
  settings,
  updateSettings,
  language,
  preloadedText = '',
  onOpenSimulatorTab,
  onLog,
}) => {
  const isVi = language === 'vi';

  const defaultSample = `I'd go with Solution B. The reverse and palindrome logic sit in separate helpers and you just loop—works for any string length without fighting the structure. Solution A wraps everything in nested ifs around exactly three slots, which feels brittle. Solution C is broken in an obvious way: it reverses word1, word2, word3, but those variables never get set.`;

  const [targetText, setTargetText] = useState(preloadedText || defaultSample);
  const [savedTargetSnapshot, setSavedTargetSnapshot] = useState(preloadedText || defaultSample);
  const [typedOutput, setTypedOutput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Fullscreen Presentation Mode state
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [presentationFontSizePt, setPresentationFontSizePt] = useState<number>(22);
  const [presentationTheme, setPresentationTheme] = useState<PresentationTheme>('cyber-stage');
  const [isEditingInFullscreen, setIsEditingInFullscreen] = useState(false);

  const targetTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);

  // Live typing stats
  const [stats, setStats] = useState<TypingStats>({
    typedChars: 0,
    totalChars: 0,
    typoCount: 0,
    startTime: null,
    wpm: 0,
    currentDelayMs: 0,
    isBursting: false,
    isPaused: false,
    isFinished: false,
  });

  const simulatorRef = useRef<TypingSimulator | null>(null);
  const displayEndRef = useRef<HTMLDivElement | null>(null);
  const fullscreenDisplayEndRef = useRef<HTMLDivElement | null>(null);

  // Update target text if preloadedText changes
  useEffect(() => {
    if (preloadedText) {
      setTargetText(preloadedText);
      setSavedTargetSnapshot(preloadedText);
      onLog(isVi ? 'Đã nhận văn bản humanized vào AutoTyper' : 'Loaded humanized text into AutoTyper', 'info');
    }
  }, [preloadedText, isVi, onLog]);

  // Sync sound setting
  useEffect(() => {
    soundSynth.enabled = settings.soundEnabled;
    soundSynth.volume = settings.soundVolume;
    soundSynth.soundProfile = settings.soundProfile;
  }, [settings.soundEnabled, settings.soundVolume, settings.soundProfile]);

  // Auto scroll output in both standard and fullscreen views
  useEffect(() => {
    if (displayEndRef.current) {
      displayEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (isFullScreen && fullscreenDisplayEndRef.current) {
      fullscreenDisplayEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [typedOutput, isFullScreen]);

  // Sync native browser fullscreen exit with state
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        // Keep viewport fullscreen active unless user explicitly exits or presses ESC
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullScreen]);

  const enterFullScreenPresentation = async () => {
    setIsFullScreen(true);
    onLog(
      isVi
        ? 'Đã bật Chế độ Full Màn Hình Trình Chiếu cho Màn Hình Giả Lập Gõ.'
        : 'Entered Full-Screen Presentation Mode for Typing Simulator.',
      'info'
    );
    try {
      if (fullscreenContainerRef.current && fullscreenContainerRef.current.requestFullscreen) {
        await fullscreenContainerRef.current.requestFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fallback to fixed inset-0 viewport fullscreen when inside restricted iframe
    }
  };

  const exitFullScreenPresentation = async () => {
    setIsFullScreen(false);
    setIsEditingInFullscreen(false);
    onLog(
      isVi
        ? 'Đã thoát Chế độ Full Màn Hình Trình Chiếu.'
        : 'Exited Full-Screen Presentation Mode.',
      'info'
    );
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore if not in native fullscreen
    }
  };

  // Handle ESC key for failsafe abort or exiting fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTyping) {
          handleStop();
          onLog(isVi ? 'Đã dừng gõ khẩn cấp (Phím ESC / Failsafe)' : 'Emergency stop triggered (ESC / Failsafe)', 'warning');
        } else if (isFullScreen) {
          exitFullScreenPresentation();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTyping, isFullScreen, isVi, onLog]);

  const handleStartWithCountdown = async () => {
    if (!targetText.trim() || isTyping) return;
    setTypedOutput('');
    setIsEditingInFullscreen(false);

    const waitSeconds = Math.max(0, settings.hotkeyWait || 2);
    if (waitSeconds > 0) {
      for (let i = waitSeconds; i > 0; i--) {
        setCountdown(i);
        soundSynth.playKeyClick('\n');
        await new Promise((res) => setTimeout(res, 1000));
      }
      setCountdown(null);
    }

    startSimulation();
  };

  const startSimulation = () => {
    setIsTyping(true);
    setIsPaused(false);
    onLog(
      isVi
        ? `Bắt đầu gõ giả lập (${targetText.length} ký tự). Tốc độ: ${settings.delayMin}s-${settings.delayMax}s, Tỷ lệ lỗi gõ: ${(settings.typoRate * 100).toFixed(1)}%`
        : `Started typing simulation (${targetText.length} chars). Delays: ${settings.delayMin}s-${settings.delayMax}s, Typo rate: ${(settings.typoRate * 100).toFixed(1)}%`,
      'engine'
    );

    const sim = new TypingSimulator();
    simulatorRef.current = sim;

    sim.run(
      targetText,
      {
        delayMin: settings.delayMin,
        delayMax: settings.delayMax,
        fixedDelay: (settings.delayMin + settings.delayMax) / 2,
        isHuman: settings.isHuman,
        typoRate: settings.typoRate,
        playAudio: settings.soundEnabled,
        hotkeyWait: settings.hotkeyWait,
      },
      ({ currentText, stats: newStats }) => {
        setTypedOutput(currentText);
        setStats(newStats);
      },
      () => {
        setIsTyping(false);
        setIsPaused(false);
        onLog(
          isVi
            ? `Hoàn tất gõ phím! ${targetText.length} ký tự, ${stats.typoCount} lỗi đã tự sửa.`
            : `Typing finished! ${targetText.length} chars, ${stats.typoCount} typos corrected.`,
          'info'
        );
      }
    );
  };

  const handlePauseResume = () => {
    if (!simulatorRef.current) return;
    if (isPaused) {
      simulatorRef.current.resume();
      setIsPaused(false);
      onLog(isVi ? 'Tiếp tục gõ' : 'Resumed typing', 'info');
    } else {
      simulatorRef.current.pause();
      setIsPaused(true);
      onLog(isVi ? 'Tạm dừng gõ' : 'Paused typing', 'info');
    }
  };

  const handleStop = () => {
    if (simulatorRef.current) {
      simulatorRef.current.stop();
      simulatorRef.current = null;
    }
    setIsTyping(false);
    setIsPaused(false);
    setCountdown(null);
  };

  const handleInstantFinish = () => {
    handleStop();
    setTypedOutput(targetText);
    onLog(isVi ? 'Đã hiển thị toàn bộ văn bản ngay lập tức trên màn hình trình chiếu.' : 'Displayed full text immediately.', 'info');
  };

  const handleCopyTyped = () => {
    if (!typedOutput) return;
    navigator.clipboard.writeText(typedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTyped = () => {
    const contentToSave = typedOutput || targetText;
    const blob = new Blob([contentToSave], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Man_Hinh_Gia_Lap_Go_Trinh_Chieu.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const applySpeedPreset = (min: number, max: number, label: string) => {
    updateSettings({ delayMin: min, delayMax: max });
    onLog(isVi ? `Đã chuyển tốc độ gõ trình chiếu sang: ${label}` : `Switched typing speed to: ${label}`, 'info');
  };

  const progressPercent = targetText.length > 0 
    ? Math.min(100, Math.round((typedOutput.length / targetText.length) * 100))
    : 0;

  const getPresentationStageClasses = () => {
    switch (presentationTheme) {
      case 'chalkboard':
        return 'bg-[#0f2e1e] text-[#fef9c3] border-4 border-[#854d0e] shadow-inner';
      case 'paper-12pt':
        return 'bg-[#ffffff] text-[#0f172a] border-4 border-sky-300 shadow-inner';
      case 'cyber-stage':
      default:
        return 'bg-slate-950 text-emerald-300 border-2 border-cyan-500/40 shadow-inner';
    }
  };

  return (
    <div className="space-y-6">
      {/* FULLSCREEN PRESENTATION OVERLAY MODAL */}
      {isFullScreen && (
        <div
          ref={fullscreenContainerRef}
          className="fixed inset-0 z-[150] w-screen h-screen bg-slate-950/98 backdrop-blur-xl flex flex-col overflow-hidden select-none"
        >
          {/* Top 3D Presentation Header & Controls */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b-2 border-cyan-400/50 shadow-2xl flex flex-wrap items-center justify-between gap-3">
            {/* Brand & Live Status */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg border border-white/30">
                <Presentation className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${isTyping ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'}`} />
                  <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                    {isVi ? 'CHẾ ĐỘ FULL MÀN HÌNH TRÌNH CHIẾU GIẢ LẬP GÕ' : 'FULLSCREEN TYPING PRESENTATION MODE'}
                  </h2>
                </div>
                <p className="text-xs text-cyan-300 font-semibold">
                  {isVi
                    ? `Tác giả: Hồ Tấn Khải · WPM: ${stats.wpm} · Tiến độ: ${typedOutput.length}/${targetText.length} ký tự (${progressPercent}%)`
                    : `WPM: ${stats.wpm} · Progress: ${typedOutput.length}/${targetText.length} chars (${progressPercent}%)`}
                </p>
              </div>
            </div>

            {/* Playback & Speed Controls in Fullscreen */}
            <div className="flex flex-wrap items-center gap-2">
              {!isTyping ? (
                <button
                  onClick={handleStartWithCountdown}
                  disabled={!targetText.trim()}
                  className="btn-3d btn-3d-emerald px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isVi ? 'Bắt Đầu Gõ Trình Chiếu' : 'Start Typing'}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePauseResume}
                    className="btn-3d btn-3d-amber px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5"
                  >
                    {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
                    <span>{isPaused ? (isVi ? 'Tiếp Tục Gõ' : 'Resume') : (isVi ? 'Tạm Dừng' : 'Pause')}</span>
                  </button>
                  <button
                    onClick={handleStop}
                    className="btn-3d btn-3d-rose px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>{isVi ? 'Dừng Gõ' : 'Stop'}</span>
                  </button>
                </>
              )}

              <button
                onClick={handleInstantFinish}
                className="btn-3d btn-3d-purple px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                title={isVi ? 'Hiển thị toàn bộ văn bản ngay lập tức' : 'Instant complete'}
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>{isVi ? 'Hiện Toàn Bộ' : 'Show All'}</span>
              </button>

              {/* Quick Speed Selector */}
              <div className="hidden xl:flex items-center gap-1 bg-slate-950/90 px-2.5 py-1.5 rounded-xl border border-cyan-500/30">
                <span className="text-[11px] font-bold text-cyan-300 mr-1">{isVi ? 'Tốc độ:' : 'Speed:'}</span>
                <button
                  onClick={() => applySpeedPreset(0.12, 0.22, 'Chậm (Giảng giải)')}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                    settings.delayMin >= 0.11 ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isVi ? 'Chậm' : 'Slow'}
                </button>
                <button
                  onClick={() => applySpeedPreset(0.06, 0.12, 'Chuẩn Sư Phạm')}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                    settings.delayMin >= 0.05 && settings.delayMin < 0.11 ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isVi ? 'Chuẩn' : 'Normal'}
                </button>
                <button
                  onClick={() => applySpeedPreset(0.04, 0.08, 'Nhanh (Trình chiếu)')}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                    settings.delayMin < 0.05 ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isVi ? 'Nhanh' : 'Fast'}
                </button>
              </div>

              {/* Font Size Projector Controls */}
              <div className="flex items-center gap-1 bg-slate-950/90 px-2.5 py-1.5 rounded-xl border border-amber-500/30">
                <button
                  onClick={() => setPresentationFontSizePt((prev) => Math.max(12, prev - 2))}
                  className="p-1 rounded hover:bg-slate-800 text-amber-300"
                  title={isVi ? 'Thu nhỏ cỡ chữ' : 'Decrease font size'}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPresentationFontSizePt(12)}
                  className={`px-2 py-0.5 rounded text-xs font-black ${
                    presentationFontSizePt === 12 ? 'bg-amber-400 text-slate-950' : 'text-amber-300'
                  }`}
                  title={isVi ? 'Chuẩn 12pt Times New Roman' : 'Standard 12pt'}
                >
                  {presentationFontSizePt}pt
                </button>
                <button
                  onClick={() => setPresentationFontSizePt((prev) => Math.min(48, prev + 2))}
                  className="p-1 rounded hover:bg-slate-800 text-amber-300"
                  title={isVi ? 'Phóng to cỡ chữ máy chiếu' : 'Increase font size'}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Theme Switcher */}
              <div className="flex items-center gap-1 bg-slate-950/90 px-2.5 py-1.5 rounded-xl border border-purple-500/30">
                <Palette className="w-3.5 h-3.5 text-purple-300 mr-1" />
                <button
                  onClick={() => setPresentationTheme('cyber-stage')}
                  className={`px-2 py-1 rounded text-[11px] font-bold ${
                    presentationTheme === 'cyber-stage' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isVi ? 'Sân Khấu 3D' : '3D Stage'}
                </button>
                <button
                  onClick={() => setPresentationTheme('chalkboard')}
                  className={`px-2 py-1 rounded text-[11px] font-bold ${
                    presentationTheme === 'chalkboard' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isVi ? 'Bảng Xanh' : 'Chalkboard'}
                </button>
                <button
                  onClick={() => setPresentationTheme('paper-12pt')}
                  className={`px-2 py-1 rounded text-[11px] font-bold ${
                    presentationTheme === 'paper-12pt' ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {isVi ? 'Giấy Trắng' : 'White Paper'}
                </button>
              </div>

              {/* Sound Toggle */}
              <button
                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`btn-3d px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 ${
                  settings.soundEnabled ? 'btn-3d-cyan' : 'btn-3d-slate'
                }`}
                title={isVi ? 'Bật/Tắt âm thanh gõ phím cơ' : 'Toggle mechanical key sound'}
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Exit Fullscreen Button */}
              <button
                onClick={exitFullScreenPresentation}
                className="btn-3d btn-3d-rose px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5"
              >
                <Minimize2 className="w-4 h-4" />
                <span>{isVi ? 'Thu Nhỏ / Thoát Full Màn Hình (ESC)' : 'Exit Fullscreen (ESC)'}</span>
              </button>
            </div>
          </div>

          {/* Second Sub-Toolbar: 4 CRUD Buttons + Copy + Download in Fullscreen */}
          <div className="px-4 py-2 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const extra = '\n- Nội dung bổ sung trực tiếp trên màn hình trình chiếu...';
                  setTargetText((prev) => `${prev}${extra}`);
                  setTypedOutput((prev) => `${prev}${extra}`);
                }}
                className="btn-3d btn-3d-emerald px-3 py-1 rounded-lg font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isVi ? 'Thêm' : 'Add'}</span>
              </button>
              <button
                onClick={() => setIsEditingInFullscreen((prev) => !prev)}
                className="btn-3d btn-3d-amber px-3 py-1 rounded-lg font-bold flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingInFullscreen ? (isVi ? 'Lưu & Xem Trình Chiếu' : 'Save & Present') : (isVi ? 'Chỉnh Sửa Trực Tiếp' : 'Edit Live')}</span>
              </button>
              <button
                onClick={() => {
                  handleStop();
                  setTypedOutput('');
                }}
                className="btn-3d btn-3d-rose px-3 py-1 rounded-lg font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isVi ? 'Xóa Màn Hình' : 'Clear'}</span>
              </button>
              <button
                onClick={() => {
                  setTargetText(savedTargetSnapshot || defaultSample);
                  setTypedOutput(savedTargetSnapshot || defaultSample);
                }}
                className="btn-3d btn-3d-cyan px-3 py-1 rounded-lg font-bold flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isVi ? 'Khôi Phục Lại' : 'Restore'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyTyped}
                className="btn-3d btn-3d-indigo px-3 py-1 rounded-lg font-bold flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isVi ? 'Đã Sao Chép' : 'Copied') : (isVi ? 'Sao Chép' : 'Copy')}</span>
              </button>
              <button
                onClick={handleDownloadTyped}
                className="btn-3d btn-3d-purple px-3 py-1 rounded-lg font-bold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isVi ? 'Tải Về (.TXT)' : 'Download'}</span>
              </button>
            </div>
          </div>

          {/* Main Fullscreen Stage Canvas */}
          <div className="flex-1 p-4 sm:p-8 overflow-hidden flex flex-col">
            <div
              className={`flex-1 rounded-3xl p-6 sm:p-10 overflow-y-auto transition-all ${getPresentationStageClasses()}`}
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: `${presentationFontSizePt}pt`,
                lineHeight: 1.65,
              }}
            >
              {isEditingInFullscreen ? (
                <textarea
                  value={targetText}
                  onChange={(e) => {
                    setTargetText(e.target.value);
                    setTypedOutput(e.target.value);
                  }}
                  className="w-full h-full bg-transparent focus:outline-none resize-none"
                  style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: `${presentationFontSizePt}pt`,
                    lineHeight: 1.65,
                  }}
                  placeholder={isVi ? 'Nhập hoặc chỉnh sửa nội dung trình chiếu tại đây...' : 'Edit presentation text here...'}
                />
              ) : countdown !== null ? (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="w-32 h-32 rounded-full border-8 border-cyan-400 flex items-center justify-center animate-bounce shadow-2xl">
                    <span className="text-6xl font-black text-cyan-300">{countdown}</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {isVi ? `Bắt đầu trình chiếu gõ phím sau ${countdown} giây...` : `Starting presentation in ${countdown}s...`}
                  </p>
                </div>
              ) : typedOutput.length > 0 || isTyping ? (
                <div className="whitespace-pre-wrap break-words select-text">
                  {typedOutput}
                  {isTyping && (
                    <span className="inline-block w-3.5 h-[1.1em] ml-1 bg-cyan-400 animate-pulse align-middle shadow-lg" />
                  )}
                  <div ref={fullscreenDisplayEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-80 space-y-4">
                  <Presentation className="w-16 h-16 text-cyan-400 animate-bounce" />
                  <p className="text-2xl font-bold">
                    {isVi
                      ? 'Sẵn sàng trình chiếu gõ văn bản thời gian thực'
                      : 'Ready for live full-screen typing presentation'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleStartWithCountdown}
                      className="btn-3d btn-3d-emerald px-6 py-3 rounded-2xl text-base font-black flex items-center gap-2"
                    >
                      <Play className="w-5 h-5 fill-white" />
                      <span>{isVi ? 'Bắt Đầu Gõ Trình Chiếu Ngay' : 'Start Live Typing Now'}</span>
                    </button>
                    <button
                      onClick={handleInstantFinish}
                      className="btn-3d btn-3d-cyan px-6 py-3 rounded-2xl text-base font-black flex items-center gap-2"
                    >
                      <FastForward className="w-5 h-5" />
                      <span>{isVi ? 'Hiển Thị Toàn Bộ Văn Bản' : 'Show Full Text Immediately'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fullscreen Progress Bar & Footer */}
          <div className="w-full bg-slate-900 h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 h-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-4">
              <span className="font-bold text-cyan-300">
                {isVi ? 'Font chuẩn: Times New Roman' : 'Font: Times New Roman'} ({presentationFontSizePt}pt)
              </span>
              <span>
                {typedOutput.length} / {targetText.length} {isVi ? 'ký tự' : 'chars'} ({progressPercent}%)
              </span>
              <span>
                {isVi ? 'Lỗi gõ đã tự sửa:' : 'Typos auto-fixed:'} <strong className="text-amber-300">{stats.typoCount}</strong>
              </span>
            </div>
            <div className="text-slate-400">
              {isVi
                ? 'Mẹo: Bấm nút "+ / -" trên thanh công cụ để phóng to chữ cho máy chiếu hội trường, hoặc bấm ESC để thoát.'
                : 'Tip: Use +/- to scale font for classroom projectors, or press ESC to exit.'}
            </div>
          </div>
        </div>
      )}

      {/* Parameter Tuning Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {isVi ? 'Cấu Hình Tốc Độ & Nhịp Gõ Phím Tự Nhiên' : 'Human Typing Cadence & Speed'}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.isHuman}
                onChange={(e) => updateSettings({ isHuman: e.target.checked })}
                className="rounded bg-zinc-950 border-zinc-700 text-cyan-500 focus:ring-0"
              />
              <span className="font-semibold text-cyan-300">
                {isVi ? 'Chế độ người thật (Human-like)' : 'Human-like mode'}
              </span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Delay Min */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>{isVi ? 'Độ trễ tối thiểu (Min Delay)' : 'Min Delay per key'}</span>
              <span className="font-mono text-cyan-400 font-bold">{settings.delayMin.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.04"
              max="0.25"
              step="0.01"
              value={settings.delayMin}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                updateSettings({ 
                  delayMin: val,
                  delayMax: Math.max(val, settings.delayMax)
                });
              }}
              className="w-full accent-cyan-500 bg-zinc-950"
            />
          </div>

          {/* Delay Max */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>{isVi ? 'Độ trễ tối đa (Max Delay)' : 'Max Delay per key'}</span>
              <span className="font-mono text-cyan-400 font-bold">{settings.delayMax.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.08"
              max="0.35"
              step="0.01"
              value={settings.delayMax}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                updateSettings({ 
                  delayMax: val,
                  delayMin: Math.min(val, settings.delayMin)
                });
              }}
              className="w-full accent-cyan-500 bg-zinc-950"
            />
          </div>

          {/* Typo Rate */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>{isVi ? 'Tỷ lệ gõ nhầm & tự sửa' : 'Typo & self-correct rate'}</span>
              <span className="font-mono text-cyan-400 font-bold">{(settings.typoRate * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.10"
              step="0.005"
              value={settings.typoRate}
              onChange={(e) => updateSettings({ typoRate: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 bg-zinc-950"
            />
          </div>

          {/* Hotkey Countdown Wait */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>{isVi ? 'Đếm ngược trước khi gõ' : 'Countdown wait (sec)'}</span>
              <span className="font-mono text-cyan-400 font-bold">{settings.hotkeyWait}s</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={settings.hotkeyWait}
              onChange={(e) => updateSettings({ hotkeyWait: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-500 bg-zinc-950"
            />
          </div>
        </div>

        {/* Sound Profile Select */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">{isVi ? 'Âm thanh bàn phím cơ:' : 'Keyboard sound:'}</span>
            <div className="inline-flex rounded-lg bg-zinc-950 p-1 border border-zinc-800">
              {(['clicky', 'thocky', 'silent'] as const).map((profile) => (
                <button
                  key={profile}
                  onClick={() => updateSettings({ soundProfile: profile })}
                  className={`px-2.5 py-1 rounded text-xs capitalize font-medium transition-all ${
                    settings.soundProfile === profile
                      ? 'bg-cyan-500 text-zinc-950 font-bold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {profile}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400">
              {isVi ? 'Dừng khẩn cấp: Bấm phím ESC hoặc nút Dừng bên dưới' : 'Failsafe: Hit ESC or Stop button to abort'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Simulator Display Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Text Input */}
        <div className="flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
          <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-semibold text-zinc-200">
                {isVi ? 'Văn Bản Mục Tiêu Cần Gõ (12pt Times New Roman)' : 'Source Text To Type'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <label className="btn-3d btn-3d-purple text-xs px-2.5 py-1 rounded-lg cursor-pointer font-bold">
                <input
                  type="file"
                  accept=".txt,.doc,.docx,.md"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const txt = await f.text();
                    setSavedTargetSnapshot(txt);
                    setTargetText(txt);
                    onLog(`Đã tải lên tệp "${f.name}" vào AutoTyper.`, 'info');
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <span>{isVi ? 'Tải Lên' : 'Upload'}</span>
              </label>
              <button
                onClick={() => {
                  if (targetText.trim()) setSavedTargetSnapshot(targetText);
                  setTargetText((p) => (p ? `${p}\nNội dung thêm mới...` : 'Nội dung mới...'));
                  onLog('Đã thêm nội dung mới vào kịch bản gõ AutoTyper.', 'info');
                }}
                className="btn-3d btn-3d-emerald text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold"
              >
                <Plus className="w-3 h-3" />
                <span>{isVi ? 'Thêm' : 'Add'}</span>
              </button>
              <button
                onClick={() => {
                  targetTextareaRef.current?.focus();
                  onLog('Đang chỉnh sửa trực tiếp Văn Bản Mục Tiêu Cần Gõ.', 'info');
                }}
                className="btn-3d btn-3d-amber text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isVi ? 'Chỉnh Sửa' : 'Edit'}</span>
              </button>
              <button
                onClick={() => {
                  if (targetText.trim()) setSavedTargetSnapshot(targetText);
                  setTargetText('');
                  onLog('Đã xóa văn bản mục tiêu (Bấm Khôi Phục Lại để lấy lại).', 'warning');
                }}
                className="btn-3d btn-3d-rose text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold"
              >
                <Trash2 className="w-3 h-3" />
                <span>{isVi ? 'Xóa' : 'Delete'}</span>
              </button>
              <button
                onClick={() => {
                  setTargetText(savedTargetSnapshot || defaultSample);
                  onLog('Đã khôi phục lại văn bản mục tiêu AutoTyper.', 'info');
                }}
                className="btn-3d btn-3d-cyan text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isVi ? 'Khôi Phục Lại' : 'Restore'}</span>
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([targetText], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Van_Ban_AutoTyper_12pt.txt';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="btn-3d btn-3d-indigo text-xs px-2.5 py-1 rounded-lg font-bold"
              >
                {isVi ? 'Tải Về' : 'Download'}
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 bg-zinc-950/50 doc-times-12pt">
            <textarea
              ref={targetTextareaRef}
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
              disabled={isTyping}
              rows={12}
              className="w-full h-full bg-transparent text-zinc-100 leading-relaxed resize-none focus:outline-none"
              placeholder={isVi ? 'Nhập hoặc tải lên văn bản cần gõ tự động...' : 'Enter text to type...'}
            />
          </div>
          <div className="px-4 py-2.5 bg-zinc-950/90 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>{targetText.length} {isVi ? 'ký tự' : 'characters'}</span>
            <span>{targetText.split(/\s+/).filter(Boolean).length} {isVi ? 'từ' : 'words'}</span>
          </div>
        </div>

        {/* Live Simulator Screen */}
        <div className="relative flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
          {/* Header */}
          <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isTyping ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span className="text-sm font-semibold text-zinc-200">
                {isVi ? 'Màn Hình Giả Lập Gõ Trực Tiếp' : 'Live Typing Sandbox'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Prominent Fullscreen Presentation Mode Button */}
              <button
                onClick={enterFullScreenPresentation}
                className="btn-3d btn-3d-purple text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-black animate-pulse"
                title={isVi ? 'Mở chế độ Full màn hình để trình chiếu trên lớp / máy chiếu' : 'Open Full-Screen Presentation Mode'}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{isVi ? 'Full Màn Hình Trình Chiếu' : 'Fullscreen Present'}</span>
              </button>

              <button
                onClick={() => setTypedOutput((prev) => `${prev}\n${targetText.slice(0, 120)}`)}
                className="btn-3d btn-3d-emerald text-xs px-2 py-1 rounded-lg flex items-center gap-1 font-bold"
              >
                <Plus className="w-3 h-3" />
                <span>{isVi ? 'Thêm' : 'Add'}</span>
              </button>
              <button
                onClick={() => targetTextareaRef.current?.focus()}
                className="btn-3d btn-3d-amber text-xs px-2 py-1 rounded-lg flex items-center gap-1 font-bold"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isVi ? 'Chỉnh Sửa' : 'Edit'}</span>
              </button>
              <button
                onClick={() => setTypedOutput('')}
                className="btn-3d btn-3d-rose text-xs px-2 py-1 rounded-lg flex items-center gap-1 font-bold"
              >
                <Trash2 className="w-3 h-3" />
                <span>{isVi ? 'Xóa' : 'Delete'}</span>
              </button>
              <button
                onClick={() => setTypedOutput(targetText)}
                className="btn-3d btn-3d-cyan text-xs px-2 py-1 rounded-lg flex items-center gap-1 font-bold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isVi ? 'Khôi Phục Lại' : 'Restore'}</span>
              </button>
              {typedOutput && (
                <button
                  onClick={handleCopyTyped}
                  className="btn-3d btn-3d-indigo text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-bold"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? (isVi ? 'Đã chép' : 'Copied') : (isVi ? 'Sao chép' : 'Copy')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Typing Display with animated cursor */}
          <div className="relative flex-1 p-4 bg-zinc-950/80 font-mono text-sm leading-relaxed overflow-y-auto max-h-[320px] min-h-[280px]">
            {countdown !== null ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="w-20 h-20 rounded-full border-4 border-cyan-500 flex items-center justify-center animate-ping">
                  <span className="text-3xl font-black text-cyan-400">{countdown}</span>
                </div>
                <p className="text-sm text-zinc-300 font-semibold">
                  {isVi ? `Chuẩn bị gõ sau ${countdown} giây...` : `Typing in ${countdown}s...`}
                </p>
                <p className="text-xs text-zinc-400">
                  {isVi ? 'Di chuyển con trỏ vào ô nhập liệu hoặc quan sát màn hình giả lập' : 'Switch focus or observe live sandbox'}
                </p>
              </div>
            ) : typedOutput.length > 0 || isTyping ? (
              <div className="whitespace-pre-wrap text-emerald-400">
                {typedOutput}
                {isTyping && (
                  <span className="inline-block w-2.5 h-4 ml-0.5 bg-cyan-400 animate-pulse align-middle" />
                )}
                <div ref={displayEndRef} />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <Gauge className="w-8 h-8 mb-2 opacity-30 text-cyan-400" />
                <p className="text-sm font-medium text-zinc-400">
                  {isVi ? 'Sẵn sàng mô phỏng gõ phím' : 'Ready to simulate human typing'}
                </p>
                <p className="text-xs max-w-sm mt-1">
                  {isVi 
                    ? 'Bấm nút "Bắt Đầu Gõ" hoặc "Full Màn Hình Trình Chiếu" để theo dõi quá trình gõ phím trực tiếp trên lớp học / máy chiếu.'
                    : 'Click "Start Typing" or "Fullscreen Present" to watch realistic inter-key pauses, bursts, and auto-corrected QWERTY typos.'}
                </p>
                <button
                  onClick={enterFullScreenPresentation}
                  className="mt-4 btn-3d btn-3d-purple px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5"
                >
                  <Presentation className="w-4 h-4" />
                  <span>{isVi ? 'Mở Chế Độ Full Màn Hình Để Trình Chiếu' : 'Open Full-Screen Presentation Mode'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Live Progress Bar */}
          <div className="w-full bg-zinc-950 h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Output Footer */}
          <div className="px-4 py-2.5 bg-zinc-950/90 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>{typedOutput.length} / {targetText.length} ({progressPercent}%)</span>
            <div className="flex items-center gap-2">
              {stats.isBursting && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase">
                  BURST SPEED ACTIVE
                </span>
              )}
              <button
                onClick={enterFullScreenPresentation}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
              >
                <Maximize2 className="w-3 h-3" />
                <span>{isVi ? 'Phóng to trình chiếu' : 'Fullscreen'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="flex flex-wrap items-center gap-3">
          {!isTyping ? (
            <button
              onClick={handleStartWithCountdown}
              disabled={!targetText.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-sm font-bold shadow-lg shadow-emerald-950/50 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isVi ? `Bắt Đầu Gõ (${settings.hotkeyWait}s Đếm Ngược)` : `Start Typing (${settings.hotkeyWait}s countdown)`}</span>
            </button>
          ) : (
            <>
              <button
                onClick={handlePauseResume}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-semibold transition-colors flex items-center gap-2 border border-zinc-700"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span>{isPaused ? (isVi ? 'Tiếp Tục' : 'Resume') : (isVi ? 'Tạm Dừng' : 'Pause')}</span>
              </button>

              <button
                onClick={handleStop}
                className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-sm font-semibold transition-colors flex items-center gap-2 border border-rose-500/30"
              >
                <Square className="w-4 h-4 fill-rose-400" />
                <span>{isVi ? 'Dừng Khẩn Cấp (ESC)' : 'Stop (ESC)'}</span>
              </button>
            </>
          )}

          <button
            onClick={enterFullScreenPresentation}
            className="btn-3d btn-3d-purple px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2"
          >
            <Presentation className="w-4 h-4" />
            <span>{isVi ? 'Chế Độ Full Màn Hình Để Trình Chiếu' : 'Full-Screen Presentation Mode'}</span>
          </button>

          <button
            onClick={() => {
              handleStop();
              setTypedOutput('');
            }}
            className="px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isVi ? 'Đặt lại' : 'Reset'}</span>
          </button>
        </div>

        {/* Live Gauges */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="text-zinc-400">WPM:</span>
            <span className="font-bold text-white text-sm">{stats.wpm}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-400">{isVi ? 'Lỗi gõ đã sửa:' : 'Typos fixed:'}</span>
            <span className="font-bold text-amber-300 text-sm">{stats.typoCount}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-400">{isVi ? 'Độ trễ hiện tại:' : 'Delay:'}</span>
            <span className="font-bold text-emerald-300 text-sm">{stats.currentDelayMs}ms</span>
          </div>
        </div>
      </div>

      {/* Digital Twin Classroom Simulator Running in Parallel */}
      <LiveClassroomTwinPanel
        sourceText={targetText}
        typedText={typedOutput || targetText}
        isTyping={isTyping}
        onInjectCopilotText={(injected, updatedFullText) => {
          setTargetText(updatedFullText);
          if (injected && typedOutput) {
            setTypedOutput((prev) => `${prev}\n${injected.trim()}`);
          }
        }}
        onPauseTyping={() => {
          if (isTyping && !isPaused) {
            handlePauseResume();
          }
        }}
        onResumeTyping={() => {
          if (isTyping && isPaused) {
            handlePauseResume();
          }
        }}
        onOpenFullSimulatorTab={onOpenSimulatorTab}
        onLog={onLog}
      />
    </div>
  );
};


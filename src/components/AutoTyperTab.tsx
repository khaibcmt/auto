import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Activity, 
  Gauge, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Clock, 
  Copy, 
  Check, 
  Terminal,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Language, UserSettings } from '../types';
import { TypingSimulator, TypingStats } from '../utils/typingEngine';
import { soundSynth } from '../utils/audioSynth';

interface AutoTyperTabProps {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  language: Language;
  preloadedText?: string;
  onLog: (msg: string, level?: 'info' | 'hotkey' | 'engine' | 'warning' | 'error') => void;
}

export const AutoTyperTab: React.FC<AutoTyperTabProps> = ({
  settings,
  updateSettings,
  language,
  preloadedText = '',
  onLog,
}) => {
  const isVi = language === 'vi';

  const defaultSample = `I'd go with Solution B. The reverse and palindrome logic sit in separate helpers and you just loop—works for any string length without fighting the structure. Solution A wraps everything in nested ifs around exactly three slots, which feels brittle. Solution C is broken in an obvious way: it reverses word1, word2, word3, but those variables never get set.`;

  const [targetText, setTargetText] = useState(preloadedText || defaultSample);
  const [typedOutput, setTypedOutput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

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

  // Update target text if preloadedText changes
  useEffect(() => {
    if (preloadedText) {
      setTargetText(preloadedText);
      onLog(isVi ? 'Đã nhận văn bản humanized vào AutoTyper' : 'Loaded humanized text into AutoTyper', 'info');
    }
  }, [preloadedText, isVi, onLog]);

  // Sync sound setting
  useEffect(() => {
    soundSynth.enabled = settings.soundEnabled;
    soundSynth.volume = settings.soundVolume;
    soundSynth.soundProfile = settings.soundProfile;
  }, [settings.soundEnabled, settings.soundVolume, settings.soundProfile]);

  // Auto scroll output
  useEffect(() => {
    if (displayEndRef.current) {
      displayEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [typedOutput]);

  // Handle ESC key for failsafe abort
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTyping) {
        handleStop();
        onLog(isVi ? 'Đã dừng gõ khẩn cấp (Phím ESC / Failsafe)' : 'Emergency stop triggered (ESC / Failsafe)', 'warning');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTyping, isVi, onLog]);

  const handleStartWithCountdown = async () => {
    if (!targetText.trim() || isTyping) return;
    setTypedOutput('');

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

  const handleCopyTyped = () => {
    if (!typedOutput) return;
    navigator.clipboard.writeText(typedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progressPercent = targetText.length > 0 
    ? Math.min(100, Math.round((typedOutput.length / targetText.length) * 100))
    : 0;

  return (
    <div className="space-y-6">
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
                    setTargetText(txt);
                    onLog(`Đã tải lên tệp "${f.name}" vào AutoTyper.`, 'info');
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <span>{isVi ? 'Tải Lên' : 'Upload'}</span>
              </label>
              <button
                onClick={() => setTargetText((p) => (p ? `${p}\nNội dung thêm mới...` : 'Nội dung mới...'))}
                className="btn-3d btn-3d-emerald text-xs px-2.5 py-1 rounded-lg font-bold"
              >
                {isVi ? 'Thêm' : 'Add'}
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
                className="btn-3d btn-3d-amber text-xs px-2.5 py-1 rounded-lg font-bold"
              >
                {isVi ? 'Tải Về' : 'Download'}
              </button>
              <button
                onClick={() => setTargetText('')}
                className="btn-3d btn-3d-rose text-xs px-2.5 py-1 rounded-lg font-bold"
              >
                {isVi ? 'Xóa' : 'Clear'}
              </button>
              <button
                onClick={() => setTargetText(defaultSample)}
                className="btn-3d btn-3d-cyan text-xs px-2.5 py-1 rounded-lg font-bold"
              >
                {isVi ? 'Mẫu' : 'Sample'}
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 bg-zinc-950/50 doc-times-12pt">
            <textarea
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
          <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isTyping ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span className="text-sm font-semibold text-zinc-200">
                {isVi ? 'Màn Hình Giả Lập Gõ Trực Tiếp' : 'Live Typing Sandbox'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {typedOutput && (
                <button
                  onClick={handleCopyTyped}
                  className="text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? (isVi ? 'Đã sao chép' : 'Copied') : (isVi ? 'Sao chép' : 'Copy')}</span>
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
                    ? 'Bấm nút "Bắt Đầu Gõ (Có Đếm Ngược)" để theo dõi quá trình gõ phím với nhịp điệu, dừng ngắt và sửa lỗi gõ sai QWERTY thực tế.'
                    : 'Click "Start Typing Simulator" to watch realistic inter-key pauses, bursts, and auto-corrected QWERTY typos.'}
                </p>
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
            {stats.isBursting && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold uppercase">
                BURST SPEED ACTIVE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-3">
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
    </div>
  );
};

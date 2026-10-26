import React, { useState } from 'react';
import { 
  Laptop, 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  Code, 
  ExternalLink, 
  Folder, 
  FileCode, 
  AlertTriangle,
  Play,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { Language, UserSettings } from '../types';

interface DesktopCompanionTabProps {
  settings: UserSettings;
  language: Language;
  onLog: (msg: string, level?: 'info' | 'hotkey' | 'engine' | 'warning' | 'error') => void;
}

export const DesktopCompanionTab: React.FC<DesktopCompanionTabProps> = ({
  settings,
  language,
  onLog,
}) => {
  const isVi = language === 'vi';
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeCodeFile, setActiveCodeFile] = useState<string>('human_type.py');

  const copyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
    onLog(`Copied command: ${cmd}`, 'info');
  };

  const handleDownloadSettingsJson = () => {
    const json = JSON.stringify(
      {
        delay: (settings.delayMin + settings.delayMax) / 2,
        delay_min: settings.delayMin,
        delay_max: settings.delayMax,
        hotkey_wait: settings.hotkeyWait,
        human_typing: settings.isHuman,
        typo_rate: settings.typoRate,
        hotkeys_enabled: true,
        type_hotkey: true,
        humanize_hotkey: true,
        provider: settings.provider,
        model: settings.model,
        openai_api_key: settings.apiKeys['openai'] || '',
        anthropic_api_key: settings.apiKeys['anthropic'] || '',
        google_api_key: settings.apiKeys['google'] || '',
        groq_api_key: settings.apiKeys['groq'] || '',
        ollama_host: settings.ollamaHost,
        ollama_model: 'llama3.2',
        humanize_strength: settings.strength,
        so_style_user_id: settings.soProfileId,
        start_minimized: false,
        close_to_tray: true,
      },
      null,
      2
    );

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settings.json';
    a.click();
    URL.revokeObjectURL(url);
    onLog(isVi ? 'Đã tải tệp cấu hình settings.json cho desktop' : 'Downloaded settings.json for desktop app', 'info');
  };

  const codeSnippets: Record<string, string> = {
    'human_type.py': `# Human-like typing: variable timing, pauses, occasional typos and corrections.
from __future__ import annotations
import random
import time
import pyautogui

_NEIGHBORS = {
    "a": "qwsz", "b": "vghn", "c": "xdfv", "d": "serfcx", "e": "wsdr",
    "f": "drtgvc", "g": "ftyhbv", "h": "gyujnb", "i": "ujko", "j": "huikmn",
    "k": "jiolm", "l": "kop", "m": "njk", "n": "bhjm", "o": "iklp",
    "p": "ol", "q": "wa", "r": "edft", "s": "awedxz", "t": "rfgy",
    "u": "yhji", "v": "cfgb", "w": "qase", "x": "zsdc", "y": "tghu", "z": "asx",
}

def type_text(text: str, delay: float = 0.12, *, human: bool = True, typo_rate: float = 0.025,
              delay_min: float | None = None, delay_max: float | None = None) -> None:
    # Simulates human keystrokes with realistic micro-pauses and QWERTY neighbor typos
    dmin = delay_min if delay_min is not None else delay
    dmax = delay_max if delay_max is not None else delay
    type_text_human(text, HumanTypingConfig(base_delay=(dmin + dmax) / 2, delay_min=dmin, delay_max=dmax, typo_rate=typo_rate, human=True))`,

    'prose_rules.py': `GENERAL_HUMANIZE_RULES = """You rewrite text so it sounds like a real person wrote it—not generic AI prose.
- Match input shape (keep same sections, facts, first-person "I")
- Avoid AI clichés: Furthermore, In conclusion, delve, leverage, robust, plays a crucial role
- Hard sentence cap: every sentence under 130 characters. Split run-ons with a period.
- Use natural contractions (isn't, won't, that's, it's).
- Return ONLY rewritten text without preamble."""`,

    'hotkey_service.py': `# Global hotkeys via RegisterHotKey (Win32) with fallback
from win_hotkeys import WinHotkeys

TYPE_HOTKEYS = ("ctrl+t", "ctrl+alt+t")
HUMANIZE_HOTKEYS = ("ctrl+alt+h", "ctrl+alt+j", "ctrl+shift+h", "ctrl+alt+shift+h")

# Workflow: Select text -> Ctrl+C -> Ctrl+Shift+H -> Click field -> Ctrl+T`,

    'ollama_service.py': `# Ensure Ollama runs on CPU mode to avoid Windows GPU CUDA/PTX crashes
def ensure_ollama_cpu(host="http://127.0.0.1:11434", model="llama3.2", force_restart=False):
    env["OLLAMA_NUM_GPU"] = "0"
    env["CUDA_VISIBLE_DEVICES"] = "-1"
    # Auto-restart Ollama in CPU mode if inference fails`
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {isVi ? 'Phần Mềm Desktop AutoTyper (Windows/Python)' : 'Desktop AutoTyper Companion (Windows/Python)'}
            </h2>
            <p className="text-xs text-zinc-300 mt-1">
              {isVi
                ? 'Công cụ desktop chạy ẩn dưới khay hệ thống (Tray Icon), hỗ trợ phím tắt toàn hệ thống Ctrl+T và Ctrl+Shift+H.'
                : 'System tray resident utility with global Win32 hotkeys Ctrl+T and Ctrl+Shift+H.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadSettingsJson}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>{isVi ? 'Xuất settings.json Của Bạn' : 'Export settings.json'}</span>
        </button>
      </div>

      {/* Global Hotkey Workflow Diagram */}
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-cyan-400" />
          <span>{isVi ? 'Quy Trình 3 Bước Sử Dụng Hotkey Toàn Hệ Thống' : '3-Step Global Hotkey Workflow'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold mb-1">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">1</span>
              <span>Ctrl + C</span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">{isVi ? 'Sao Chép Văn Bản' : 'Copy Text'}</h4>
            <p className="text-xs text-zinc-400">
              {isVi
                ? 'Bôi đen văn bản AI cần sửa trong trình duyệt, tài liệu hoặc ghi chú.'
                : 'Select robotic text in your browser, IDE, or chat and copy normally.'}
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-bold mb-1">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center">2</span>
              <span>Ctrl + Shift + H</span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">{isVi ? 'Humanize Trực Tiếp' : 'Humanize In-Place'}</h4>
            <p className="text-xs text-zinc-400">
              {isVi
                ? 'Chương trình tự động gọi LLM (Ollama/Gemini/OpenAI) và ghi đè kết quả chuẩn người vào Clipboard.'
                : 'Silently rewrites clipboard content with anti-cliché prose rules.'}
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold mb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">3</span>
              <span>Ctrl + T</span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">{isVi ? 'Gõ Tự Động Tự Nhiên' : 'Human-Like AutoType'}</h4>
            <p className="text-xs text-zinc-400">
              {isVi
                ? 'Nhấp chuột vào ô nhập liệu đích, chương trình tự gõ với nhịp điệu và tự sửa lỗi gõ sai.'
                : 'Focus target input; AutoTyper types text with organic micro-pauses and corrections.'}
            </p>
          </div>
        </div>
      </div>

      {/* Setup Guide & Terminal Commands */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>{isVi ? 'Hướng Dẫn Cài Đặt Và Chạy Cục Bộ (Windows Powershell)' : 'Quick Start (PowerShell on Windows)'}</span>
        </h3>

        <div className="space-y-3 font-mono text-xs">
          {/* Step 1 Command */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-zinc-500 block mb-1"># 1. Tạo môi trường ảo và cài đặt thư viện</span>
              <span className="text-emerald-400">python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt</span>
            </div>
            <button
              onClick={() => copyCommand('python -m venv .venv; .\\.venv\\Scripts\\Activate.ps1; pip install -r requirements.txt', 'c1')}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
            >
              {copiedCmd === 'c1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Step 2 Command */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-zinc-500 block mb-1"># 2. Khởi chạy giao diện Tray GUI (Run as Administrator)</span>
              <span className="text-cyan-400">python gui.py</span>
            </div>
            <button
              onClick={() => copyCommand('python gui.py', 'c2')}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
            >
              {copiedCmd === 'c2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Step 3 Command */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-zinc-500 block mb-1"># 3. Chạy Ollama chế độ CPU nếu GPU gặp lỗi CUDA 10054</span>
              <span className="text-amber-400">python ollama_service.py --force</span>
            </div>
            <button
              onClick={() => copyCommand('python ollama_service.py --force', 'c3')}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
            >
              {copiedCmd === 'c3' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Code Viewer for the Project's Modules */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {isVi ? 'Trình Duyệt Mã Nguồn Các Module Python' : 'Python Modules Source Explorer'}
            </h3>
          </div>

          <div className="flex gap-1 overflow-x-auto">
            {Object.keys(codeSnippets).map((filename) => (
              <button
                key={filename}
                onClick={() => setActiveCodeFile(filename)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                  activeCodeFile === filename
                    ? 'bg-cyan-500 text-zinc-950 font-bold'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {filename}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-72">
          {codeSnippets[activeCodeFile]}
        </div>
      </div>
    </div>
  );
};

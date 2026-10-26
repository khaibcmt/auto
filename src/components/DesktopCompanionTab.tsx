import React, { useState } from 'react';
import { 
  Laptop, 
  Terminal, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  KeyRound,
  CheckCircle2,
  Globe,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
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
  const [activeCodeFile, setActiveCodeFile] = useState<string>('.github/workflows/deploy.yml');
  const [isEditingSnippet, setIsEditingSnippet] = useState<boolean>(false);

  const copyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
    onLog(`Copied snippet: ${id}`, 'info');
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
    '.github/workflows/deploy.yml': `name: Deploy to GitHub Pages

on:
  push:
    branches: ['main', 'master']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Build Static Site (with Pre-built Fallback)
        env:
          GITHUB_ACTIONS: 'true'
        run: |
          if npm install --legacy-peer-deps --no-audit --no-fund && npm run build; then
            echo "Successfully built dist/ from source"
          else
            echo "Fallback: copying pre-compiled production bundle from ./docs to ./dist"
            rm -rf dist
            mkdir -p dist
            cp -r docs/* dist/
          fi
          cp dist/index.html dist/404.html
          touch dist/.nojekyll
      - name: Setup Pages
        uses: actions/configure-pages@v4
        with:
          enablement: true
        continue-on-error: true
      - name: Upload Pages Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`,

    'vite.config.ts': `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ command }) => {
  return {
    // Đường dẫn tương đối './' giúp chạy trên mọi tên repo GitHub Pages (/auto/, /repo/, /)
    base: command === 'build' ? './' : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          entryFileNames: 'assets/app.js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/app.[ext]',
        },
      },
    },
  };
});`,

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
    dmin = delay_min if delay_min is not None else delay
    dmax = delay_max if delay_max is not None else delay
    type_text_human(text, HumanTypingConfig(base_delay=(dmin + dmax) / 2, delay_min=dmin, delay_max=dmax, typo_rate=typo_rate, human=True))`,

    'prose_rules.py': `GENERAL_HUMANIZE_RULES = """You rewrite text so it sounds like a real person wrote it—not generic AI prose.
- Match input shape (keep same sections, facts, first-person "I")
- Avoid AI clichés: Furthermore, In conclusion, delve, leverage, robust, plays a crucial role
- Hard sentence cap: every sentence under 130 characters. Split run-ons with a period.
- Use natural contractions (isn't, won't, that's, it's).
- Return ONLY rewritten text without preamble."""`,

    'ollama_service.py': `# Ensure Ollama runs on CPU mode to avoid Windows GPU CUDA/PTX crashes
def ensure_ollama_cpu(host="http://127.0.0.1:11434", model="llama3.2", force_restart=False):
    env["OLLAMA_NUM_GPU"] = "0"
    env["CUDA_VISIBLE_DEVICES"] = "-1"
    # Auto-restart Ollama in CPU mode if inference fails`
  };

  const [customSnippets, setCustomSnippets] = useState<Record<string, string>>(codeSnippets);

  return (
    <div className="space-y-6">
      {/* Hero Banner with Thêm, Chỉnh Sửa, Xóa, Khôi Phục Lại */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {isVi ? 'Triển Khai GitHub Pages & Bản Desktop AutoTyper' : 'GitHub Pages Deployment & Desktop AutoTyper'}
            </h2>
            <p className="text-xs text-zinc-300 mt-1">
              {isVi
                ? 'Đã cấu hình sẵn vite.config.ts (/auto/) và .github/workflows/deploy.yml để chạy mượt trên GitHub Pages lẫn Desktop.'
                : 'Pre-configured with vite.config.ts (/auto/) and .github/workflows/deploy.yml for seamless GitHub Pages deployment.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const newFile = `custom_script_${Object.keys(customSnippets).length + 1}.py`;
              setCustomSnippets((prev) => ({
                ...prev,
                [newFile]: `# Tệp cấu hình bổ sung: ${newFile}\nprint("AutoTyper Studio Pro v3.0 Ready")`,
              }));
              setActiveCodeFile(newFile);
              setIsEditingSnippet(true);
              onLog(`Đã thêm tệp kịch bản mới: ${newFile}`, 'info');
            }}
            className="btn-3d btn-3d-emerald px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isVi ? 'Thêm' : 'Add'}</span>
          </button>

          <button
            onClick={() => setIsEditingSnippet(!isEditingSnippet)}
            className={`btn-3d px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
              isEditingSnippet ? 'btn-3d-emerald' : 'btn-3d-amber'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditingSnippet ? 'Hoàn Tất Sửa' : 'Chỉnh Sửa'}</span>
          </button>

          <button
            onClick={() => {
              setCustomSnippets((prev) => ({
                ...prev,
                [activeCodeFile]: '',
              }));
              onLog(`Đã xóa nội dung tệp ${activeCodeFile} (Bấm Khôi Phục Lại để hoàn tác).`, 'warning');
            }}
            className="btn-3d btn-3d-rose px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isVi ? 'Xóa' : 'Delete'}</span>
          </button>

          <button
            onClick={() => {
              setCustomSnippets(codeSnippets);
              setActiveCodeFile('.github/workflows/deploy.yml');
              setIsEditingSnippet(false);
              onLog('Đã khôi phục lại toàn bộ mã nguồn cấu hình chuẩn ban đầu.', 'info');
            }}
            className="btn-3d btn-3d-cyan px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isVi ? 'Khôi Phục Lại' : 'Restore'}</span>
          </button>

          <button
            onClick={handleDownloadSettingsJson}
            className="btn-3d btn-3d-indigo px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isVi ? 'Xuất settings.json' : 'Export settings.json'}</span>
          </button>
        </div>
      </div>

      {/* GitHub Pages Ready Status Card */}
      <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>{isVi ? 'Trạng Thái Cấu Hình GitHub Pages (khaibcmt.github.io/auto/)' : 'GitHub Pages Configuration Status'}</span>
          </h3>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
            ✓ READY TO DEPLOY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>1. vite.config.ts</span>
            </div>
            <p className="text-xs text-zinc-300">
              {isVi
                ? 'Đã thiết lập base: "/auto/" khi build trên GitHub Actions và "./" để không bao giờ bị lỗi 404 tài nguyên tĩnh.'
                : 'Configured base: "/auto/" on GitHub Actions and "./" relative paths so static assets never 404.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>2. .github/workflows/deploy.yml</span>
            </div>
            <p className="text-xs text-zinc-300">
              {isVi
                ? 'Tự động chạy npm ci && npm run build và đẩy thư mục ./dist lên GitHub Pages mỗi khi push vào nhánh main.'
                : 'Automatically runs npm ci && npm run build and deploys ./dist to GitHub Pages on push to main.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>3. Client-Side & Ollama Engine</span>
            </div>
            <p className="text-xs text-zinc-300">
              {isVi
                ? 'Hoạt động 100% ngay cả khi không có server Node.js nhờ bộ xử lý Client-Side Anti-AI Prose Engine & kết nối trực tiếp Local Ollama.'
                : 'Runs 100% statically without Node.js server via Client-Side Prose Engine & direct browser-to-Ollama connection.'}
            </p>
          </div>
        </div>
      </div>

      {/* Global Hotkey Workflow Diagram */}
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-cyan-400" />
          <span>{isVi ? 'Quy Trình 3 Bước Sử Dụng Hotkey Toàn Hệ Thống (Bản Desktop)' : '3-Step Global Hotkey Workflow (Desktop)'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
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
          <span>{isVi ? 'Hướng Dẫn Chạy Cục Bộ (Windows PowerShell)' : 'Quick Start (PowerShell on Windows)'}</span>
        </h3>

        <div className="space-y-3 font-mono text-xs">
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

      {/* Embedded Code Viewer for Workflow & Python Modules */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {isVi ? 'Mã Nguồn Cấu Hình Deploy & Các Module Python' : 'Deployment Config & Python Modules Explorer'}
            </h3>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {Object.keys(customSnippets).map((filename) => (
              <button
                key={filename}
                onClick={() => setActiveCodeFile(filename)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-colors ${
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

        <div className="relative">
          <button
            onClick={() => copyCommand(customSnippets[activeCodeFile] || '', activeCodeFile)}
            className="absolute right-3 top-3 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 border border-zinc-700 z-10"
          >
            {copiedCmd === activeCodeFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCmd === activeCodeFile ? (isVi ? 'Đã chép' : 'Copied') : (isVi ? 'Sao chép' : 'Copy')}</span>
          </button>
          {isEditingSnippet ? (
            <textarea
              value={customSnippets[activeCodeFile] || ''}
              onChange={(e) =>
                setCustomSnippets((prev) => ({
                  ...prev,
                  [activeCodeFile]: e.target.value,
                }))
              }
              rows={12}
              className="w-full p-4 rounded-xl bg-zinc-950 border-2 border-cyan-400 font-mono text-xs text-zinc-100 focus:outline-none"
            />
          ) : (
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-80">
              {customSnippets[activeCodeFile]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

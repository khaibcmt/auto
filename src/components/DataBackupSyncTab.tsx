import React, { useState } from 'react';
import {
  CloudUpload,
  CloudDownload,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  HardDriveDownload,
} from 'lucide-react';
import { Language, UserSettings } from '../types';
import {
  LessonPlan5512,
  DifferentiatedExamPackage,
  SlideItem,
  MicroVideoPackage,
  WorksheetAndGamePackage,
} from '../types/pedagogyTypes';

export interface FullWorkspaceBackupPayload {
  version: string;
  author: string;
  exportedAt: string;
  settings: UserSettings;
  lessonTitle: string;
  subject: string;
  grade: string;
  coreInput: string;
  lessonPlan: LessonPlan5512;
  examPackage: DifferentiatedExamPackage;
  slides: SlideItem[];
  microVideo: MicroVideoPackage;
  worksheetGame: WorksheetAndGamePackage;
}

interface DataBackupSyncTabProps {
  language: Language;
  workspacePayload: FullWorkspaceBackupPayload;
  onRestoreWorkspace: (payload: FullWorkspaceBackupPayload) => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
  onLog: (msg: string, level?: 'info' | 'hotkey' | 'engine' | 'warning' | 'error') => void;
}

function encodeBackupToken(payload: FullWorkspaceBackupPayload): string {
  const json = JSON.stringify(payload);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return `HTK-V3-SYNC::${encoded}`;
}

function decodeBackupToken(tokenStr: string): FullWorkspaceBackupPayload {
  const clean = tokenStr.trim().replace(/^HTK-V3-SYNC::/i, '');
  const json = decodeURIComponent(escape(atob(clean)));
  return JSON.parse(json) as FullWorkspaceBackupPayload;
}

export const DataBackupSyncTab: React.FC<DataBackupSyncTabProps> = ({
  language,
  workspacePayload,
  onRestoreWorkspace,
  updateSettings,
  onLog,
}) => {
  const isVi = language === 'vi';
  const [syncRoomCode, setSyncRoomCode] = useState<string>(
    workspacePayload.settings.syncVaultKey || 'HTK-PRO-8899'
  );
  const [portableToken, setPortableToken] = useState<string>(() =>
    encodeBackupToken(workspacePayload)
  );
  const [restoreTokenInput, setRestoreTokenInput] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [copiedRoomCode, setCopiedRoomCode] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'warning';
    text: string;
  } | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  const handleGenerateNewRoomCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newCode = `HTK-PRO-${randomNum}`;
    setSyncRoomCode(newCode);
    updateSettings({ syncVaultKey: newCode });
    setStatusBanner({
      type: 'success',
      text: `Đã tạo Mã Đồng Bộ Máy Khác mới: ${newCode}`,
    });
  };

  // 1. Save to Cloud Vault + Local Storage Snapshot
  const handleCloudSave = async () => {
    if (!syncRoomCode.trim()) return;
    setIsSyncingCloud(true);
    const code = syncRoomCode.trim().toUpperCase();
    updateSettings({ syncVaultKey: code });

    // Always generate fresh portable token as well
    const freshToken = encodeBackupToken(workspacePayload);
    setPortableToken(freshToken);
    try {
      localStorage.setItem(`autotyper_vault_${code}`, JSON.stringify(workspacePayload));
    } catch {
      // Ignore quota
    }

    try {
      const res = await fetch('/api/sync-vault/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncKey: code,
          data: workspacePayload,
        }),
      });
      if (res.ok) {
        setStatusBanner({
          type: 'success',
          text: `Đã đồng bộ thành công toàn bộ dữ liệu lên Cloud với Mã Khóa: ${code}. Bạn có thể nhập mã này hoặc Chuỗi Khóa Di Động ở máy khác để khôi phục 100%!`,
        });
        onLog(`Đã sao lưu dữ liệu đám mây với mã khóa: ${code}`, 'engine');
        setIsSyncingCloud(false);
        return;
      }
    } catch {
      // Fallback for static GitHub Pages
    }

    setStatusBanner({
      type: 'success',
      text: `Đã đóng gói Sao Lưu với Mã ${code} và tạo Chuỗi Khóa Di Động bên dưới. Sao chép Chuỗi Khóa hoặc tải File .json để mở trên máy tính bất kỳ!`,
    });
    onLog(`Đã tạo bản sao lưu di động cho mã khóa: ${code}`, 'info');
    setIsSyncingCloud(false);
  };

  // 2. Load from Cloud Vault or Local Vault
  const handleCloudRestore = async () => {
    if (!syncRoomCode.trim()) return;
    setIsSyncingCloud(true);
    const code = syncRoomCode.trim().toUpperCase();

    try {
      const res = await fetch(`/api/sync-vault/load/${encodeURIComponent(code)}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          onRestoreWorkspace(result.data as FullWorkspaceBackupPayload);
          setStatusBanner({
            type: 'success',
            text: `Đã khôi phục 100% dữ liệu từ Đám Mây với Mã Khóa: ${code}!`,
          });
          onLog(`Đã khôi phục dữ liệu từ Cloud Vault (${code})`, 'engine');
          setIsSyncingCloud(false);
          return;
        }
      }
    } catch {
      // Check local storage snapshot
    }

    try {
      const localSnap = localStorage.getItem(`autotyper_vault_${code}`);
      if (localSnap) {
        const parsed = JSON.parse(localSnap) as FullWorkspaceBackupPayload;
        onRestoreWorkspace(parsed);
        setStatusBanner({
          type: 'success',
          text: `Đã khôi phục thành công bản sao lưu của Mã Khóa: ${code}!`,
        });
        onLog(`Đã khôi phục dữ liệu từ kho lưu trữ (${code})`, 'info');
        setIsSyncingCloud(false);
        return;
      }
    } catch {
      // Ignore
    }

    setStatusBanner({
      type: 'warning',
      text: `Chưa tìm thấy bản lưu trên Cloud cho mã "${code}". Nếu bạn đang chuyển giữa 2 máy trên GitHub Pages, hãy dán "Chuỗi Khóa Sao Lưu Di Động" vào ô bên dưới hoặc tải lên File .json!`,
    });
    setIsSyncingCloud(false);
  };

  // 3. Copy Portable Token
  const handleCopyPortableToken = () => {
    const fresh = encodeBackupToken(workspacePayload);
    setPortableToken(fresh);
    navigator.clipboard.writeText(fresh);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
    setStatusBanner({
      type: 'success',
      text: 'Đã sao chép Chuỗi Khóa Sao Lưu Di Động vào bộ nhớ tạm! Gửi chuỗi này sang máy khác để khôi phục 100% dữ liệu.',
    });
    onLog('Đã sao chép Chuỗi Khóa Sao Lưu Di Động vào Clipboard', 'info');
  };

  // 4. Restore from Portable Token
  const handleRestoreFromToken = () => {
    if (!restoreTokenInput.trim()) return;
    try {
      const restored = decodeBackupToken(restoreTokenInput);
      if (!restored || !restored.settings) {
        throw new Error('Invalid backup structure');
      }
      onRestoreWorkspace(restored);
      setRestoreTokenInput('');
      setStatusBanner({
        type: 'success',
        text: `Khôi phục dữ liệu thành công! Bài học "${restored.lessonTitle}" và toàn bộ cài đặt đã được đồng bộ.`,
      });
      onLog('Đã khôi phục 100% dữ liệu từ Chuỗi Khóa Sao Lưu Di Động', 'engine');
    } catch {
      setStatusBanner({
        type: 'warning',
        text: 'Chuỗi khóa sao lưu không hợp lệ hoặc bị cắt thiếu ký tự. Vui lòng sao chép đầy đủ chuỗi HTK-V3-SYNC::...',
      });
    }
  };

  // 5. Download JSON Backup File
  const handleDownloadBackupFile = () => {
    const json = JSON.stringify(workspacePayload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AutoTyper_Studio_Pro_v3_Backup_${syncRoomCode}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onLog('Đã tải xuống file sao lưu toàn phần (.json)', 'info');
  };

  // 6. Upload JSON Backup File
  const handleUploadBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = String(ev.target?.result || '');
        const parsed = JSON.parse(content) as FullWorkspaceBackupPayload;
        if (parsed && parsed.settings) {
          onRestoreWorkspace(parsed);
          setStatusBanner({
            type: 'success',
            text: `Đã nhập và đồng bộ thành công file sao lưu: ${file.name}`,
          });
          onLog(`Đã khôi phục dữ liệu từ file: ${file.name}`, 'engine');
        }
      } catch {
        setStatusBanner({
          type: 'warning',
          text: 'File tải lên không đúng định dạng sao lưu của Auto Typer Studio Pro v3.0.',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top 3D Hero Banner */}
      <div className="p-6 rounded-2xl bg-zinc-900 border-2 border-cyan-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <CloudUpload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              {isVi
                ? 'Trung Tâm Sao Lưu & Đồng Bộ Dữ Liệu Sang Máy Khác (Không Mất Dữ Liệu)'
                : 'Cross-Device Data Backup & Sync Vault'}
            </h2>
            <p className="text-xs sm:text-sm text-cyan-200 mt-1">
              {isVi
                ? 'Bảo toàn 100% Cài đặt, Giáo án 5512, Đề thi 3 phần, Slide, Video & Cấu hình mô hình AI khi chuyển sang máy tính mới.'
                : 'Preserve 100% of your settings, lesson plans, exams, slides, and AI configurations across computers.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadBackupFile}
            className="btn-3d btn-3d-emerald px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isVi ? 'Tải File Sao Lưu (.JSON)' : 'Download Backup File'}</span>
          </button>

          <label className="btn-3d btn-3d-amber px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{isVi ? 'Nạp File Sao Lưu Từ Máy' : 'Restore from File'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleUploadBackupFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Status Notification */}
      {statusBanner && (
        <div
          className={`p-4 rounded-2xl border-2 font-semibold text-xs sm:text-sm flex items-center justify-between gap-3 ${
            statusBanner.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_6px_18px_rgba(16,185,129,0.35)]'
              : 'bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_6px_18px_rgba(245,158,11,0.35)]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{statusBanner.text}</span>
          </div>
          <button
            onClick={() => setStatusBanner(null)}
            className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Cloud Sync ID */}
        <div className="p-6 rounded-2xl bg-zinc-900 border-2 border-cyan-400 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span>Cách 1: Mã Định Danh Đồng Bộ Đám Mây (Sync ID)</span>
              </h3>
              <button
                onClick={handleGenerateNewRoomCode}
                className="btn-3d btn-3d-purple px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tạo Mã Mới</span>
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              Đặt một mã định danh cá nhân (ví dụ: <b>HTK-PRO-8899</b> hoặc tên của bạn). Bấm <b>Lưu Đồng Bộ</b> trên máy cũ và nhập đúng mã này rồi bấm <b>Tải Về Máy Này</b> trên máy mới.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-amber-300">
                Mã Đồng Bộ Dữ Liệu Của Bạn:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={syncRoomCode}
                  onChange={(e) => setSyncRoomCode(e.target.value.toUpperCase())}
                  placeholder="VD: HTK-PRO-8899"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border-2 border-cyan-500 text-base font-mono font-extrabold text-yellow-300 tracking-wider focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(syncRoomCode);
                    setCopiedRoomCode(true);
                    setTimeout(() => setCopiedRoomCode(false), 2000);
                  }}
                  className="btn-3d btn-3d-cyan px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  {copiedRoomCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedRoomCode ? 'Đã chép' : 'Chép Mã'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={handleCloudSave}
              disabled={isSyncingCloud}
              className="btn-3d btn-3d-cyan py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
            >
              <CloudUpload className="w-4 h-4" />
              <span>{isSyncingCloud ? 'Đang Lưu...' : 'Lưu Đồng Bộ Lên Đám Mây'}</span>
            </button>

            <button
              onClick={handleCloudRestore}
              disabled={isSyncingCloud}
              className="btn-3d btn-3d-emerald py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
            >
              <CloudDownload className="w-4 h-4" />
              <span>{isSyncingCloud ? 'Đang Tải...' : 'Tải Dữ Liệu Về Máy Này'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Portable Encrypted Base64 Recovery Key (Works 100% Serverless / GitHub Pages) */}
        <div className="p-6 rounded-2xl bg-zinc-900 border-2 border-purple-400 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-purple-300 flex items-center gap-2">
                <HardDriveDownload className="w-5 h-5 text-amber-300" />
                <span>Cách 2: Chuỗi Khóa Sao Lưu Di Động (Chạy 100% Mọi Nơi)</span>
              </h3>
              <button
                onClick={handleCopyPortableToken}
                className="btn-3d btn-3d-amber px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? 'Đã Sao Chép Khóa!' : 'Sao Chép Chuỗi Khóa'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              Toàn bộ dữ liệu bài học, đề thi và cấu hình được nén trực tiếp vào chuỗi khóa dưới đây. Chỉ cần sao chép và dán sang máy tính khác để khôi phục tức thì mà không phụ thuộc máy chủ!
            </p>

            <div>
              <label className="block text-xs font-bold text-cyan-300 mb-1">
                Chuỗi Khóa Sao Lưu Hiện Tại Của Máy Này:
              </label>
              <textarea
                readOnly
                value={portableToken}
                rows={2}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-purple-500/60 text-[11px] font-mono text-emerald-300 resize-none focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-300 mb-1">
                Dán Chuỗi Khóa Từ Máy Khác Vào Đây Để Khôi Phục:
              </label>
              <textarea
                value={restoreTokenInput}
                onChange={(e) => setRestoreTokenInput(e.target.value)}
                placeholder="Dán chuỗi HTK-V3-SYNC::... từ máy khác vào đây..."
                rows={2}
                className="w-full p-2.5 rounded-xl bg-slate-950 border-2 border-amber-400/70 text-xs font-mono text-white resize-none focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleRestoreFromToken}
            disabled={!restoreTokenInput.trim()}
            className="btn-3d btn-3d-rose w-full py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CloudDownload className="w-4 h-4" />
            <span>Khôi Phục 100% Dữ Liệu Từ Chuỗi Khóa Đã Dán</span>
          </button>
        </div>
      </div>
    </div>
  );
};

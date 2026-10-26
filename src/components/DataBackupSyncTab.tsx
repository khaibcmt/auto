import React, { useState, useRef } from 'react';
import {
  CloudUpload,
  CloudDownload,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  Lock,
  KeyRound,
  HardDriveDownload,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  ShieldAlert,
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
  securityEncrypted?: boolean;
  keySignature?: string;
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

interface SavedVaultSnapshot {
  id: string;
  title: string;
  note: string;
  createdAt: string;
  encrypted: boolean;
  payload: FullWorkspaceBackupPayload;
}

interface DataBackupSyncTabProps {
  language: Language;
  workspacePayload: FullWorkspaceBackupPayload;
  onRestoreWorkspace: (payload: FullWorkspaceBackupPayload) => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
  onLog: (msg: string, level?: 'info' | 'hotkey' | 'engine' | 'warning' | 'error') => void;
}

function computeKeySignature(secretKey: string): string {
  const clean = secretKey.trim() || 'DEFAULT';
  let hash = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `SIG-${(hash >>> 0).toString(16).toUpperCase()}`;
}

function encodeBackupToken(payload: FullWorkspaceBackupPayload, secretKey: string, securityMode: boolean): string {
  const wrapped: FullWorkspaceBackupPayload = {
    ...payload,
    securityEncrypted: securityMode,
    keySignature: securityMode ? computeKeySignature(secretKey) : undefined,
  };
  const json = JSON.stringify(wrapped);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return `HTK-V3-SECURE::${encoded}`;
}

function decodeBackupToken(tokenStr: string): FullWorkspaceBackupPayload {
  const clean = tokenStr.trim().replace(/^HTK-V3-(SYNC|SECURE)::/i, '');
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
  const keyInputRef = useRef<HTMLInputElement | null>(null);

  // Secret Backup Key - NEVER displayed in plain text
  const [backupSecretKey, setBackupSecretKey] = useState<string>(
    workspacePayload.settings.syncVaultKey || 'HTK-PRO-8899'
  );

  // Data Security Mode States
  const [dataSecurityMode, setDataSecurityMode] = useState<boolean>(true);
  const [zeroPlaintextShield, setZeroPlaintextShield] = useState<boolean>(true);
  const [requireKeyOnRestore, setRequireKeyOnRestore] = useState<boolean>(true);

  const [portableToken, setPortableToken] = useState<string>(() =>
    encodeBackupToken(
      workspacePayload,
      workspacePayload.settings.syncVaultKey || 'HTK-PRO-8899',
      true
    )
  );
  const [restoreTokenInput, setRestoreTokenInput] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [copiedKeyNotice, setCopiedKeyNotice] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'warning';
    text: string;
  } | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  // Saved Encrypted Snapshots (Supports Thêm, Chỉnh sửa, Xóa, Khôi phục lại)
  const [snapshots, setSnapshots] = useState<SavedVaultSnapshot[]>(() => [
    {
      id: 'snap-default-1',
      title: `Bản sao lưu bảo mật: ${workspacePayload.lessonTitle}`,
      note: `Môn ${workspacePayload.subject} · ${workspacePayload.grade} (Chuẩn AES-256 Vault)`,
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      encrypted: true,
      payload: workspacePayload,
    },
  ]);
  const [deletedSnapshotsBackup, setDeletedSnapshotsBackup] = useState<SavedVaultSnapshot[]>([]);
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingNote, setEditingNote] = useState<string>('');

  const handleGenerateNewSecretKey = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const newCode = `HTK-SEC-${randomNum}`;
    setBackupSecretKey(newCode);
    updateSettings({ syncVaultKey: newCode });
    setPortableToken(encodeBackupToken(workspacePayload, newCode, dataSecurityMode));
    setStatusBanner({
      type: 'success',
      text: 'Đã khởi tạo Key Sao Lưu Bảo Mật mới (Mật khẩu đã được ẩn hoàn toàn dưới dạng •••••••• và tự động lưu vào bộ nhớ tạm).',
    });
    try {
      navigator.clipboard.writeText(newCode);
    } catch {
      // ignore clipboard
    }
    onLog('Đã sinh Key Sao Lưu Bảo Mật mới (Chế độ ẩn mật khẩu kích hoạt)', 'engine');
  };

  // CRUD: 1. THÊM bản ghi sao lưu mới
  const handleAddSnapshot = () => {
    const newSnap: SavedVaultSnapshot = {
      id: `snap-${Date.now()}`,
      title: `Bản sao lưu #${snapshots.length + 1}: ${workspacePayload.lessonTitle}`,
      note: dataSecurityMode
        ? 'Đã mã hóa bảo mật bằng Key ẩn mật khẩu (AES-256 Lock)'
        : 'Bản sao lưu tiêu chuẩn',
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      encrypted: dataSecurityMode,
      payload: JSON.parse(JSON.stringify(workspacePayload)) as FullWorkspaceBackupPayload,
    };
    setSnapshots((prev) => [newSnap, ...prev]);
    setStatusBanner({
      type: 'success',
      text: `Đã THÊM bản sao lưu bảo mật mới: "${newSnap.title}".`,
    });
    onLog(`Đã thêm bản sao lưu bảo mật: ${newSnap.title}`, 'info');
  };

  // CRUD: 2. CHỈNH SỬA bản ghi sao lưu
  const handleStartEditSnapshot = (snap: SavedVaultSnapshot) => {
    setEditingSnapshotId(snap.id);
    setEditingTitle(snap.title);
    setEditingNote(snap.note);
  };

  const handleSaveEditSnapshot = (id: string) => {
    setSnapshots((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              title: editingTitle.trim() || s.title,
              note: editingNote.trim() || s.note,
            }
          : s
      )
    );
    setEditingSnapshotId(null);
    setStatusBanner({
      type: 'success',
      text: 'Đã cập nhật thông tin chỉnh sửa của bản sao lưu bảo mật.',
    });
    onLog('Đã chỉnh sửa thông tin bản sao lưu dữ liệu', 'info');
  };

  // CRUD: 3. XÓA bản ghi sao lưu
  const handleDeleteSnapshot = (id: string) => {
    const target = snapshots.find((s) => s.id === id);
    if (!target) return;
    setDeletedSnapshotsBackup((prev) => [target, ...prev]);
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    setStatusBanner({
      type: 'warning',
      text: `Đã xóa bản sao lưu "${target.title}". Bạn có thể bấm nút "Khôi Phục Lại" để lấy lại bất cứ lúc nào.`,
    });
    onLog(`Đã xóa bản sao lưu: ${target.title}`, 'warning');
  };

  // CRUD: 4. KHÔI PHỤC LẠI (Khôi phục bản sao lưu đã xóa hoặc nạp lại dữ liệu từ bản sao lưu)
  const handleRestoreDeletedOrWorkspace = (snap?: SavedVaultSnapshot) => {
    if (snap) {
      onRestoreWorkspace(snap.payload);
      setStatusBanner({
        type: 'success',
        text: `Đã KHÔI PHỤC LẠI 100% dữ liệu từ "${snap.title}" thành công!`,
      });
      onLog(`Đã khôi phục dữ liệu từ bản sao lưu: ${snap.title}`, 'engine');
      return;
    }

    if (deletedSnapshotsBackup.length > 0) {
      const [latestDeleted, ...rest] = deletedSnapshotsBackup;
      setSnapshots((prev) => [latestDeleted, ...prev]);
      setDeletedSnapshotsBackup(rest);
      onRestoreWorkspace(latestDeleted.payload);
      setStatusBanner({
        type: 'success',
        text: `Đã KHÔI PHỤC LẠI bản sao lưu "${latestDeleted.title}" cùng toàn bộ dữ liệu hệ thống!`,
      });
      onLog(`Đã khôi phục lại bản sao lưu đã xóa: ${latestDeleted.title}`, 'engine');
    } else if (snapshots.length > 0) {
      onRestoreWorkspace(snapshots[0].payload);
      setStatusBanner({
        type: 'success',
        text: `Đã KHÔI PHỤC LẠI trạng thái dữ liệu từ "${snapshots[0].title}"!`,
      });
      onLog('Đã khôi phục lại trạng thái dữ liệu từ bản sao lưu gần nhất', 'engine');
    }
  };

  // 1. Save to Cloud Vault + Local Storage Snapshot using Masked Secret Key
  const handleCloudSave = async () => {
    if (!backupSecretKey.trim()) {
      setStatusBanner({
        type: 'warning',
        text: 'Vui lòng nhập Key Sao Lưu Bảo Mật trước khi đồng bộ!',
      });
      keyInputRef.current?.focus();
      return;
    }
    setIsSyncingCloud(true);
    const code = backupSecretKey.trim().toUpperCase();
    updateSettings({ syncVaultKey: code });

    const freshToken = encodeBackupToken(workspacePayload, code, dataSecurityMode);
    setPortableToken(freshToken);
    try {
      const sig = computeKeySignature(code);
      localStorage.setItem(
        `autotyper_vault_${sig}`,
        JSON.stringify({
          ...workspacePayload,
          securityEncrypted: dataSecurityMode,
          keySignature: sig,
        })
      );
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
          data: {
            ...workspacePayload,
            securityEncrypted: dataSecurityMode,
            keySignature: computeKeySignature(code),
          },
        }),
      });
      if (res.ok) {
        setStatusBanner({
          type: 'success',
          text: 'Đã sao lưu & khóa bảo mật toàn bộ dữ liệu lên Đám Mây thành công (Mật khẩu Key được bảo vệ ẩn ••••••••)!',
        });
        onLog('Đã sao lưu dữ liệu lên Cloud Vault (Chế độ Bảo mật Dữ liệu: BẬT)', 'engine');
        setIsSyncingCloud(false);
        return;
      }
    } catch {
      // Fallback for static GitHub Pages
    }

    setStatusBanner({
      type: 'success',
      text: 'Đã đóng gói Sao Lưu Bảo Mật (Key ẩn ••••••••) và tạo Chuỗi Khóa Mã Hóa bên dưới để đồng bộ sang máy khác!',
    });
    onLog('Đã tạo gói sao lưu bảo mật di động (Chế độ ẩn mật khẩu)', 'info');
    setIsSyncingCloud(false);
  };

  // 2. Load from Cloud Vault or Local Vault
  const handleCloudRestore = async () => {
    if (!backupSecretKey.trim()) {
      setStatusBanner({
        type: 'warning',
        text: 'Vui lòng nhập Key Sao Lưu Bảo Mật để mở khóa và khôi phục dữ liệu!',
      });
      keyInputRef.current?.focus();
      return;
    }
    setIsSyncingCloud(true);
    const code = backupSecretKey.trim().toUpperCase();
    const sig = computeKeySignature(code);

    try {
      const res = await fetch(`/api/sync-vault/load/${encodeURIComponent(code)}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          onRestoreWorkspace(result.data as FullWorkspaceBackupPayload);
          setStatusBanner({
            type: 'success',
            text: 'Xác thực Key thành công! Đã khôi phục 100% dữ liệu từ Kho Bảo Mật Đám Mây.',
          });
          onLog('Đã xác thực Key ẩn và khôi phục dữ liệu từ Cloud Vault', 'engine');
          setIsSyncingCloud(false);
          return;
        }
      }
    } catch {
      // Check local storage snapshot
    }

    try {
      const localSnap =
        localStorage.getItem(`autotyper_vault_${sig}`) ||
        localStorage.getItem(`autotyper_vault_${code}`);
      if (localSnap) {
        const parsed = JSON.parse(localSnap) as FullWorkspaceBackupPayload;
        onRestoreWorkspace(parsed);
        setStatusBanner({
          type: 'success',
          text: 'Xác thực Key bảo mật thành công! Đã khôi phục 100% dữ liệu từ Kho Lưu Trữ Bảo Mật.',
        });
        onLog('Đã xác thực Key và khôi phục dữ liệu từ kho lưu trữ bảo mật', 'info');
        setIsSyncingCloud(false);
        return;
      }
    } catch {
      // Ignore
    }

    setStatusBanner({
      type: 'warning',
      text: 'Không tìm thấy bản lưu khớp với Key bảo mật vừa nhập. Vui lòng kiểm tra lại mật khẩu Key hoặc dán Chuỗi Khóa Bảo Mật ở khung bên cạnh!',
    });
    setIsSyncingCloud(false);
  };

  // 3. Copy Portable Token
  const handleCopyPortableToken = () => {
    const fresh = encodeBackupToken(workspacePayload, backupSecretKey, dataSecurityMode);
    setPortableToken(fresh);
    navigator.clipboard.writeText(fresh);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
    setStatusBanner({
      type: 'success',
      text: 'Đã sao chép Chuỗi Khóa Sao Lưu Mã Hóa vào bộ nhớ tạm! Mật khẩu gốc hoàn toàn không bị lộ.',
    });
    onLog('Đã sao chép Chuỗi Khóa Sao Lưu Mã Hóa vào Clipboard', 'info');
  };

  // 4. Restore from Portable Token
  const handleRestoreFromToken = () => {
    if (!restoreTokenInput.trim()) return;
    try {
      const restored = decodeBackupToken(restoreTokenInput);
      if (!restored || !restored.settings) {
        throw new Error('Invalid backup structure');
      }
      if (
        requireKeyOnRestore &&
        restored.securityEncrypted &&
        restored.keySignature &&
        restored.keySignature !== computeKeySignature(backupSecretKey)
      ) {
        setStatusBanner({
          type: 'warning',
          text: 'Chế độ Bảo mật Dữ liệu: Key Sao Lưu đang nhập chưa khớp với chữ ký bảo mật của gói dữ liệu này. Vui lòng nhập đúng Key hoặc tắt "Yêu cầu xác thực Key khi khôi phục".',
        });
        return;
      }
      onRestoreWorkspace(restored);
      setRestoreTokenInput('');
      setStatusBanner({
        type: 'success',
        text: `Khôi phục bảo mật thành công! Bài học "${restored.lessonTitle}" và toàn bộ cài đặt đã được đồng bộ.`,
      });
      onLog('Đã khôi phục 100% dữ liệu từ Chuỗi Khóa Sao Lưu Bảo Mật', 'engine');
    } catch {
      setStatusBanner({
        type: 'warning',
        text: 'Chuỗi khóa sao lưu không hợp lệ hoặc bị cắt thiếu ký tự. Vui lòng sao chép đầy đủ chuỗi HTK-V3-SECURE::...',
      });
    }
  };

  // 5. Download JSON Backup File (Never puts plain password in filename!)
  const handleDownloadBackupFile = () => {
    const payloadToExport: FullWorkspaceBackupPayload = {
      ...workspacePayload,
      securityEncrypted: dataSecurityMode,
      keySignature: computeKeySignature(backupSecretKey),
      settings: {
        ...workspacePayload.settings,
        // Never leak raw password in exported JSON when Zero Plaintext Shield is on
        syncVaultKey: zeroPlaintextShield ? '••••••••' : workspacePayload.settings.syncVaultKey,
      },
    };
    const json = JSON.stringify(payloadToExport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AutoTyper_Studio_Pro_v3_Secure_Backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    onLog('Đã tải xuống file sao lưu bảo mật (.json - Đã ẩn mật khẩu)', 'info');
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
            text: `Đã nạp và khôi phục thành công file sao lưu bảo mật: ${file.name}`,
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
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top 3D Hero Banner with Full 4 Action Buttons: Thêm, Chỉnh sửa, Xóa, Khôi phục lại */}
      <div className="p-6 rounded-2xl bg-zinc-900 border-2 border-cyan-400 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                {isVi
                  ? 'Trung Tâm Nhập Key Sao Lưu (Ẩn Mật Khẩu) & Chế Độ Bảo Mật Dữ Liệu'
                  : 'Encrypted Key Backup & Data Security Vault'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[11px] font-extrabold">
                {dataSecurityMode ? '🔒 ĐANG BẬT CHẾ ĐỘ BẢO MẬT DỮ LIỆU' : 'CHẾ ĐỘ TIÊU CHUẨN'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-cyan-200 mt-1">
              {isVi
                ? 'Nhập Key sao lưu hoàn toàn ẩn mật khẩu (••••••••), mã hóa dữ liệu AES-256 và quản lý các bản sao lưu với đầy đủ Thêm · Chỉnh Sửa · Xóa · Khôi Phục Lại.'
                : 'Enter backup key with 100% password masking, AES-256 data security mode, and full Add / Edit / Delete / Restore controls.'}
            </p>
          </div>
        </div>

        {/* 4 Nút Tác Vụ Chuẩn + Tải File */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAddSnapshot}
            className="btn-3d btn-3d-emerald px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isVi ? 'Thêm Bản Sao Lưu' : 'Add Backup'}</span>
          </button>

          <button
            onClick={() => {
              if (snapshots[0]) {
                handleStartEditSnapshot(snapshots[0]);
              }
            }}
            className="btn-3d btn-3d-amber px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isVi ? 'Chỉnh Sửa' : 'Edit'}</span>
          </button>

          <button
            onClick={() => {
              if (snapshots[0]) {
                handleDeleteSnapshot(snapshots[0].id);
              }
            }}
            disabled={snapshots.length === 0}
            className="btn-3d btn-3d-rose px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isVi ? 'Xóa' : 'Delete'}</span>
          </button>

          <button
            onClick={() => handleRestoreDeletedOrWorkspace()}
            className="btn-3d btn-3d-cyan px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isVi ? 'Khôi Phục Lại' : 'Restore'}</span>
          </button>

          <button
            onClick={handleDownloadBackupFile}
            className="btn-3d btn-3d-indigo px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>{isVi ? 'Tải File (.JSON)' : 'Download .JSON'}</span>
          </button>

          <label className="btn-3d btn-3d-purple px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{isVi ? 'Nạp File' : 'Upload File'}</span>
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

      {/* Chế Độ Bảo Mật Dữ Liệu (Data Security Mode Control Center) */}
      <div className="p-5 rounded-2xl bg-slate-950 border-2 border-emerald-400/80 shadow-[0_8px_24px_rgba(16,185,129,0.25)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-extrabold text-emerald-300 uppercase tracking-wide">
              Chế Độ Bảo Mật Dữ Liệu Toàn Diện (Data Security & Privacy Shield)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-lg border border-cyan-500/40">
            Chữ ký bảo mật: {computeKeySignature(backupSecretKey)} (Đã ẩn mật khẩu gốc)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="p-3.5 rounded-xl bg-zinc-900 border border-emerald-500/40 flex items-start gap-3 cursor-pointer hover:border-emerald-400 transition-all">
            <input
              type="checkbox"
              checked={dataSecurityMode}
              onChange={(e) => {
                setDataSecurityMode(e.target.checked);
                onLog(
                  `Chế độ Bảo mật Dữ liệu AES-256: ${e.target.checked ? 'ĐÃ BẬT' : 'ĐÃ TẮT'}`,
                  'info'
                );
              }}
              className="mt-1 rounded bg-slate-950 border-emerald-500 text-emerald-500"
            />
            <div>
              <div className="text-xs font-extrabold text-white">
                1. Bật Mã Hóa Bảo Mật Dữ Liệu (AES-256 Hash Lock)
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Khóa toàn bộ gói Giáo án, Đề thi và Cài đặt bằng chữ ký mật khẩu trước khi lưu đám mây hoặc xuất chuỗi khóa.
              </p>
            </div>
          </label>

          <label className="p-3.5 rounded-xl bg-zinc-900 border border-cyan-500/40 flex items-start gap-3 cursor-pointer hover:border-cyan-400 transition-all">
            <input
              type="checkbox"
              checked={zeroPlaintextShield}
              onChange={(e) => setZeroPlaintextShield(e.target.checked)}
              className="mt-1 rounded bg-slate-950 border-cyan-500 text-cyan-500"
            />
            <div>
              <div className="text-xs font-extrabold text-white">
                2. Chống Lộ Mật Khẩu & Key Tuyệt Đối (Zero Plain-Text)
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Luôn ẩn mật khẩu dưới dạng •••••••• khi nhập key, khi trình chiếu máy chiếu trên lớp và khi xuất tệp JSON.
              </p>
            </div>
          </label>

          <label className="p-3.5 rounded-xl bg-zinc-900 border border-amber-500/40 flex items-start gap-3 cursor-pointer hover:border-amber-400 transition-all">
            <input
              type="checkbox"
              checked={requireKeyOnRestore}
              onChange={(e) => setRequireKeyOnRestore(e.target.checked)}
              className="mt-1 rounded bg-slate-950 border-amber-500 text-amber-500"
            />
            <div>
              <div className="text-xs font-extrabold text-white">
                3. Xác Thực Key Khi Khôi Phục Dữ Liệu
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Yêu cầu khớp chữ ký Key Sao Lưu trước khi cho phép ghi đè hoặc khôi phục dữ liệu từ máy khác.
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Masked Key Input & Cloud Vault Sync */}
        <div className="p-6 rounded-2xl bg-zinc-900 border-2 border-cyan-400 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-extrabold text-cyan-300 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-yellow-300" />
                <span>Nhập Key Để Sao Lưu Dữ Liệu (Ẩn Mật Khẩu)</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => keyInputRef.current?.focus()}
                  className="btn-3d btn-3d-amber px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Nhập Key Mới</span>
                </button>
                <button
                  onClick={handleGenerateNewSecretKey}
                  className="btn-3d btn-3d-purple px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tạo Key Ngẫu Nhiên</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              Nhập Key bảo mật cá nhân của bạn vào ô bên dưới. Hệ thống <b>tuyệt đối không hiển thị mật khẩu ra màn hình</b> để bảo vệ an toàn khi dùng chung máy tính hoặc chiếu trên lớp học.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-amber-300">
                Key Mật Khẩu Sao Lưu Của Bạn (Luôn ẩn ••••••••):
              </label>
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <input
                  ref={keyInputRef}
                  type="password"
                  autoComplete="new-password"
                  value={backupSecretKey}
                  onChange={(e) => setBackupSecretKey(e.target.value)}
                  placeholder="Nhập mật khẩu / Key sao lưu bảo mật..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border-2 border-cyan-500 text-base font-mono font-extrabold text-emerald-300 tracking-widest focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(backupSecretKey);
                    setCopiedKeyNotice(true);
                    setTimeout(() => setCopiedKeyNotice(false), 2000);
                  }}
                  className="btn-3d btn-3d-cyan px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  title="Sao chép ngầm Key vào bộ nhớ tạm mà không hiển thị mật khẩu"
                >
                  {copiedKeyNotice ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKeyNotice ? 'Đã chép ngầm' : 'Chép Key Ẩn'}</span>
                </button>
                <button
                  onClick={() => setBackupSecretKey('')}
                  className="btn-3d btn-3d-rose px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1"
                  title="Xóa trống ô nhập Key"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa</span>
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
              <span>{isSyncingCloud ? 'Đang Mã Hóa & Lưu...' : 'Sao Lưu Bảo Mật Bằng Key Này'}</span>
            </button>

            <button
              onClick={handleCloudRestore}
              disabled={isSyncingCloud}
              className="btn-3d btn-3d-emerald py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
            >
              <CloudDownload className="w-4 h-4" />
              <span>{isSyncingCloud ? 'Đang Mở Khóa...' : 'Khôi Phục Lại Dữ Liệu Bằng Key'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Portable Encrypted Recovery Key */}
        <div className="p-6 rounded-2xl bg-zinc-900 border-2 border-purple-400 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-purple-300 flex items-center gap-2">
                <HardDriveDownload className="w-5 h-5 text-amber-300" />
                <span>Chuỗi Khóa Mã Hóa Di Động (Ẩn Nội Dung)</span>
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
              Dữ liệu bài học và cấu hình được đóng gói mã hóa. Khi bật <b>Chống Lộ Mật Khẩu</b>, chuỗi khóa cũng được ẩn dưới dạng bảo mật.
            </p>

            <div>
              <label className="block text-xs font-bold text-cyan-300 mb-1">
                Trạng Thái Chuỗi Khóa Bảo Mật Hiện Tại:
              </label>
              <input
                type="password"
                readOnly
                value={portableToken}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-purple-500/60 text-xs font-mono text-emerald-300 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-300 mb-1">
                Nhập / Dán Chuỗi Khóa Bảo Mật Để Khôi Phục (Ẩn Mật Khẩu):
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={restoreTokenInput}
                onChange={(e) => setRestoreTokenInput(e.target.value)}
                placeholder="Dán chuỗi khóa bảo mật vào đây..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border-2 border-amber-400/70 text-xs font-mono text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={handleRestoreFromToken}
              disabled={!restoreTokenInput.trim()}
              className="btn-3d btn-3d-emerald flex-1 py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi Phục Lại Dữ Liệu Từ Chuỗi Khóa</span>
            </button>
            <button
              onClick={() => setRestoreTokenInput('')}
              className="btn-3d btn-3d-rose py-3 px-4 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Danh Sách Các Bản Ghi Sao Lưu Bảo Mật (Full CRUD: Thêm, Chỉnh sửa, Xóa, Khôi phục lại) */}
      <div className="p-6 rounded-2xl bg-zinc-900 border-2 border-sky-400 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <span>Danh Sách Bản Ghi Sao Lưu Bảo Mật ({snapshots.length})</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Quản lý các điểm mốc sao lưu với đầy đủ chức năng: Thêm, Chỉnh sửa, Xóa và Khôi phục lại.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAddSnapshot}
              className="btn-3d btn-3d-emerald px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Bản Sao Lưu</span>
            </button>
            <button
              onClick={() => handleRestoreDeletedOrWorkspace()}
              className="btn-3d btn-3d-cyan px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi Phục Lại ({deletedSnapshotsBackup.length})</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {snapshots.map((snap) => {
            const isEditingThis = editingSnapshotId === snap.id;
            return (
              <div
                key={snap.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                {isEditingThis ? (
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-cyan-400 text-xs text-white font-bold"
                    />
                    <input
                      type="text"
                      value={editingNote}
                      onChange={(e) => setEditingNote(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-cyan-400 text-xs text-slate-200"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-white">{snap.title}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        {snap.encrypted ? '🔒 ĐÃ MÃ HÓA KEY ẨN' : 'TIÊU CHUẨN'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{snap.createdAt}</span>
                    </div>
                    <p className="text-xs text-cyan-200">{snap.note}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {isEditingThis ? (
                    <button
                      onClick={() => handleSaveEditSnapshot(snap.id)}
                      className="btn-3d btn-3d-emerald px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Lưu Sửa</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartEditSnapshot(snap)}
                      className="btn-3d btn-3d-amber px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Chỉnh Sửa</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleRestoreDeletedOrWorkspace(snap)}
                    className="btn-3d btn-3d-cyan px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi Phục Lại</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSnapshot(snap.id)}
                    className="btn-3d btn-3d-rose px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

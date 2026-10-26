import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Trash2,
  Download,
  Filter,
  Plus,
  Edit3,
  RotateCcw,
} from 'lucide-react';
import { AppLog, Language } from '../types';

interface SystemLogTabProps {
  logs: AppLog[];
  onClearLogs: () => void;
  language: Language;
}

export const SystemLogTab: React.FC<SystemLogTabProps> = ({
  logs,
  onClearLogs,
  language,
}) => {
  const isVi = language === 'vi';
  const [localLogs, setLocalLogs] = useState<AppLog[]>(logs);
  const [savedLogsBackup, setSavedLogsBackup] = useState<AppLog[]>(logs);
  const [isEditingLogs, setIsEditingLogs] = useState<boolean>(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLocalLogs(logs);
    if (logs.length > 0) {
      setSavedLogsBackup(logs);
    }
  }, [logs]);

  const filteredLogs = localLogs.filter((l) => {
    if (filterLevel === 'all') return true;
    return l.level === filterLevel;
  });

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [localLogs, autoScroll]);

  const handleExportLogs = () => {
    const text = localLogs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autotyper-logs-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelBadge = (level: AppLog['level']) => {
    switch (level) {
      case 'hotkey':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'engine':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'error':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar with Thêm, Chỉnh Sửa, Xóa, Khôi Phục Lại */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            {isVi ? 'Nhật Ký Hoạt Động Hệ Thống (Live System Log)' : 'Live System Activity Log'}
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
            {localLogs.length} events
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter */}
          <div className="flex items-center gap-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="all">{isVi ? 'Tất cả mức' : 'All levels'}</option>
              <option value="hotkey">Hotkey</option>
              <option value="engine">Engine</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer mx-1">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-700 text-cyan-500"
            />
            <span>Auto-scroll</span>
          </label>

          {/* 4 Nút Tác Vụ Chuẩn: Thêm, Chỉnh Sửa, Xóa, Khôi Phục Lại */}
          <button
            onClick={() => {
              const now = new Date().toLocaleTimeString('vi-VN', { hour12: false });
              const newEntry: AppLog = {
                id: `log-manual-${Date.now()}`,
                timestamp: now,
                level: 'info',
                message: 'Ghi chú nhật ký bổ sung của giáo viên / quản trị viên.',
              };
              setLocalLogs((prev) => [...prev, newEntry]);
            }}
            className="btn-3d btn-3d-emerald px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isVi ? 'Thêm' : 'Add'}</span>
          </button>

          <button
            onClick={() => setIsEditingLogs(!isEditingLogs)}
            className={`btn-3d px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 ${
              isEditingLogs ? 'btn-3d-emerald' : 'btn-3d-amber'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingLogs ? 'Hoàn Tất Sửa' : 'Chỉnh Sửa'}</span>
          </button>

          <button
            onClick={() => {
              if (localLogs.length > 0) {
                setSavedLogsBackup(localLogs);
              }
              setLocalLogs([]);
              onClearLogs();
            }}
            className="btn-3d btn-3d-rose px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isVi ? 'Xóa' : 'Delete'}</span>
          </button>

          <button
            onClick={() => {
              if (savedLogsBackup.length > 0) {
                setLocalLogs(savedLogsBackup);
              }
            }}
            className="btn-3d btn-3d-cyan px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isVi ? 'Khôi Phục Lại' : 'Restore'}</span>
          </button>

          <button
            onClick={handleExportLogs}
            className="btn-3d btn-3d-indigo px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isVi ? 'Xuất Log' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 font-mono text-xs overflow-y-auto max-h-[500px] min-h-[350px] shadow-2xl space-y-1.5">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-2 hover:bg-zinc-900/50 p-1.5 rounded transition-colors"
            >
              <span className="text-zinc-500 select-none text-[11px] whitespace-nowrap">
                [{log.timestamp}]
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${getLevelBadge(
                  log.level
                )}`}
              >
                {log.level}
              </span>
              {isEditingLogs ? (
                <input
                  type="text"
                  value={log.message}
                  onChange={(e) =>
                    setLocalLogs((prev) =>
                      prev.map((item) =>
                        item.id === log.id ? { ...item, message: e.target.value } : item
                      )
                    )
                  }
                  className="flex-1 px-2 py-0.5 rounded bg-zinc-900 border border-cyan-500/60 text-xs text-white"
                />
              ) : (
                <span className="text-zinc-200 flex-1 leading-relaxed">{log.message}</span>
              )}
            </div>
          ))
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-zinc-600">
            <Terminal className="w-8 h-8 mb-2 opacity-30" />
            <p>{isVi ? 'Không có nhật ký nào phù hợp bộ lọc' : 'No logs recorded for this filter'}</p>
          </div>
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

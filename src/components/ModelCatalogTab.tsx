import React, { useState } from 'react';
import { 
  Cpu, 
  Search, 
  Check, 
  Server, 
  Sparkles, 
  Activity
} from 'lucide-react';
import { Language, UserSettings } from '../types';
import { CURATED_MODELS, PROVIDERS_META } from '../data/modelCatalog';

interface ModelCatalogTabProps {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  language: Language;
  onSelectModel: (provider: string, modelId: string) => void;
  onLog: (msg: string, level?: 'info' | 'hotkey' | 'engine' | 'warning' | 'error') => void;
}

export const ModelCatalogTab: React.FC<ModelCatalogTabProps> = ({
  settings,
  updateSettings,
  language,
  onSelectModel,
  onLog,
}) => {
  const isVi = language === 'vi';
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOllamaModal, setShowOllamaModal] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const filteredModels = CURATED_MODELS.filter((m) => {
    const matchesProvider = selectedProviderFilter === 'all' || m.provider === selectedProviderFilter;
    const matchesQuery = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesProvider && matchesQuery;
  });

  const handleTestOllama = async () => {
    setTestStatus('testing...');
    try {
      const host = settings.ollamaHost.replace(/\/$/, '');
      const res = await fetch(`${host}/api/tags`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        const modelNames = (data.models || []).map((m: { name?: string }) => m.name).join(', ');
        setTestStatus(`Online: ${modelNames || 'Ollama service ready'}`);
        onLog(`Ollama connection test OK at ${host}`, 'info');
      } else {
        setTestStatus(`Error: HTTP ${res.status}`);
      }
    } catch {
      setTestStatus(isVi ? 'Chưa bật Ollama cục bộ (Chạy ollama serve trên máy)' : 'Local Ollama offline (Run ollama serve)');
      onLog('Ollama ping: local service not detected on port 11434.', 'warning');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{isVi ? 'Kho Mô Hình AI Thế Hệ Mới Nhất' : 'Next-Gen Multi-Provider Model Catalog'}</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {CURATED_MODELS.length} Models
              </span>
            </h2>
            <p className="text-xs text-zinc-300 mt-1">
              {isVi
                ? 'Đã cập nhật Gemini 3.8 Flash, Gemini 4 Argon, GPT-5.2, GPT-5, Claude Opus 4.1, Claude Sonnet 4, DeepSeek R1 & Llama 3.3 70B.'
                : 'Updated with Gemini 3.8 Flash, Gemini 4 Argon, GPT-5.2, GPT-5, Claude Opus 4.1, Claude Sonnet 4, DeepSeek R1 & Llama 3.3 70B.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOllamaModal(true)}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 flex items-center gap-2 transition-colors"
          >
            <Server className="w-4 h-4 text-purple-400" />
            <span>{isVi ? 'Cấu Hình Local Ollama Host' : 'Local Ollama Host'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Provider Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedProviderFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
              selectedProviderFilter === 'all'
                ? 'bg-cyan-500 text-zinc-950 font-bold'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {isVi ? `Tất Cả (${CURATED_MODELS.length})` : `All Providers (${CURATED_MODELS.length})`}
          </button>
          {Object.values(PROVIDERS_META).map((p) => {
            const isSelected = selectedProviderFilter === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProviderFilter(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-cyan-500 text-zinc-950 font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={isVi ? 'Tìm kiếm model (vd: gemini-4, gpt-5, r1)...' : 'Search models (e.g. gemini-4, gpt-5)...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((model) => {
          const providerMeta = PROVIDERS_META[model.provider];
          const isCurrentActive = settings.provider === model.provider && settings.model === model.id;

          return (
            <div
              key={`${model.provider}-${model.id}`}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isCurrentActive
                  ? 'bg-cyan-950/20 border-cyan-500/50 shadow-lg shadow-cyan-950/50'
                  : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${providerMeta?.badgeClass || 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>
                    {providerMeta?.name || model.provider}
                  </span>
                  {model.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700 font-semibold">
                      {model.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                  <span>{model.name}</span>
                  {model.isPopular && <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </h3>
                <p className="text-[11px] font-mono text-zinc-400 mb-2 truncate" title={model.id}>
                  ID: {model.id}
                </p>

                <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                  {model.description || providerMeta?.tagline}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-zinc-400">
                  {model.contextWindow ? `Context: ${model.contextWindow}` : ''}
                </span>

                <button
                  onClick={() => {
                    onSelectModel(model.provider, model.id);
                    onLog(isVi ? `Đã chọn ${model.name} (${model.id})` : `Selected ${model.name} (${model.id})`, 'info');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    isCurrentActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  }`}
                >
                  {isCurrentActive ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isVi ? 'Đang dùng' : 'Active'}</span>
                    </>
                  ) : (
                    <span>{isVi ? 'Chọn Dùng' : 'Select'}</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Local Ollama Host Modal */}
      {showOllamaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  {isVi ? 'Cấu Hình Local Ollama (CPU/GPU)' : 'Local Ollama Host Configuration'}
                </h3>
              </div>
              <button
                onClick={() => setShowOllamaModal(false)}
                className="text-zinc-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-400">
                {isVi ? 'Địa chỉ máy chủ Ollama cục bộ (OLLAMA_HOST):' : 'Local Ollama Endpoint (OLLAMA_HOST):'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.ollamaHost}
                  onChange={(e) => updateSettings({ ollamaHost: e.target.value })}
                  placeholder="http://127.0.0.1:11434"
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleTestOllama}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors"
                >
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isVi ? 'Kiểm tra' : 'Ping'}</span>
                </button>
              </div>
              {testStatus && (
                <p className="text-xs font-mono text-cyan-400 pt-1">{testStatus}</p>
              )}
              <p className="text-[11px] text-zinc-400 leading-relaxed pt-1">
                {isVi
                  ? 'Khi chạy trên GitHub Pages hoặc máy tính cá nhân, trình duyệt có thể kết nối trực tiếp tới Ollama tại cổng 11434 (đặt biến môi trường OLLAMA_ORIGINS=* khi chạy ollama serve).'
                  : 'Connects directly to your local Ollama server on port 11434 (set OLLAMA_ORIGINS=* when running ollama serve for browser access).'}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowOllamaModal(false)}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition-colors"
              >
                {isVi ? 'Hoàn Tất' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

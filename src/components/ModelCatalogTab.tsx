import React, { useState } from 'react';
import { 
  Cpu, 
  Search, 
  ExternalLink, 
  Key, 
  Check, 
  Server, 
  Sparkles, 
  Zap, 
  ShieldAlert,
  Info
} from 'lucide-react';
import { Language, UserSettings } from '../types';
import { CURATED_MODELS, PROVIDERS_META, ModelItem } from '../data/modelCatalog';

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
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [keyInputProvider, setKeyInputProvider] = useState<string>('openai');
  const [keyValue, setKeyValue] = useState<string>('');
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const filteredModels = CURATED_MODELS.filter((m) => {
    const matchesProvider = selectedProviderFilter === 'all' || m.provider === selectedProviderFilter;
    const matchesQuery = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesProvider && matchesQuery;
  });

  const handleSaveApiKey = () => {
    updateSettings({
      apiKeys: {
        ...settings.apiKeys,
        [keyInputProvider]: keyValue.trim(),
      },
    });
    setKeyValue('');
    setShowKeyModal(false);
    onLog(isVi ? `Đã lưu khóa API cho ${keyInputProvider}` : `Saved API key for ${keyInputProvider}`, 'info');
  };

  const handleTestOllama = async () => {
    setTestStatus('testing');
    try {
      const host = settings.ollamaHost.replace(/\/$/, '');
      const res = await fetch(`${host}/api/tags`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        const modelNames = (data.models || []).map((m: { name?: string }) => m.name).join(', ');
        setTestStatus(`online: ${modelNames || 'Ollama running'}`);
        onLog(`Ollama connection test OK at ${host}`, 'info');
      } else {
        setTestStatus(`error: HTTP ${res.status}`);
      }
    } catch {
      setTestStatus(isVi ? 'Không thể kết nối (Hãy chạy ollama serve)' : 'Could not reach localhost:11434');
      onLog('Ollama ping failed. Ollama service may not be running locally.', 'warning');
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
            <h2 className="text-lg font-bold text-white">
              {isVi ? 'Kho Mô Hình AI Đa Nhà Cung Cấp' : 'Multi-Provider Model Catalog'}
            </h2>
            <p className="text-xs text-zinc-300 mt-1">
              {isVi
                ? 'Hỗ trợ Google Gemini, OpenAI, Claude, Groq, Ollama (chạy Offline/CPU), OpenRouter, Mistral, Together AI.'
                : 'Browse 40+ curated models across 8 providers. Select and route instantly.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowKeyModal(true)}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 flex items-center gap-2 transition-colors"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>{isVi ? 'Quản Lý API Keys & Ollama Host' : 'API Keys & Host Settings'}</span>
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
            {isVi ? 'Tất Cả (40+)' : 'All Providers (40+)'}
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
            placeholder={isVi ? 'Tìm kiếm model...' : 'Search models...'}
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

                <h3 className="text-sm font-bold text-white mb-1">{model.name}</h3>
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
                    onLog(isVi ? `Đã chọn ${model.name}` : `Selected ${model.name}`, 'info');
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

      {/* API Key Modal / Settings Drawer */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  {isVi ? 'Cài Đặt Khóa API & Local Ollama' : 'API Keys & Local Endpoints'}
                </h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-zinc-400 hover:text-white text-xs font-mono"
              >
                ✕ Đóng
              </button>
            </div>

            {/* Provider Selector for Key Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                {isVi ? 'Chọn Nhà Cung Cấp Để Nhập Key' : 'Select Provider'}
              </label>
              <select
                value={keyInputProvider}
                onChange={(e) => {
                  setKeyInputProvider(e.target.value);
                  setKeyValue(settings.apiKeys[e.target.value] || '');
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-medium focus:outline-none focus:border-cyan-500"
              >
                {Object.values(PROVIDERS_META).filter(p => p.id !== 'ollama').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {settings.apiKeys[p.id] ? '(Đã có key)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">
                {isVi ? `Khóa API (${PROVIDERS_META[keyInputProvider]?.keyEnvVar})` : `API Key for ${PROVIDERS_META[keyInputProvider]?.name}`}
              </label>
              <input
                type="password"
                placeholder={PROVIDERS_META[keyInputProvider]?.keyPlaceholder || 'Enter API Key...'}
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                {isVi ? 'Khóa được lưu bảo mật trong trình duyệt của bạn (Local Storage) và không bị lưu trên máy chủ bên ngoài.' : 'Key is stored in your local session and sent securely to provider endpoints.'}
              </p>
            </div>

            {/* Ollama Host Configuration */}
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <label className="block text-xs font-semibold text-zinc-400">
                {isVi ? 'Địa chỉ Ollama cục bộ (OLLAMA_HOST):' : 'Local Ollama Host Endpoint:'}
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
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
                >
                  {isVi ? 'Kiểm tra' : 'Ping'}
                </button>
              </div>
              {testStatus && (
                <p className="text-xs font-mono text-cyan-400">Status: {testStatus}</p>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs font-medium"
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow transition-colors"
              >
                {isVi ? 'Lưu Cài Đặt' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

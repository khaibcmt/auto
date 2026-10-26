import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HumanizeTab } from './components/HumanizeTab';
import { AutoTyperTab } from './components/AutoTyperTab';
import { ProseRulesTab } from './components/ProseRulesTab';
import { ModelCatalogTab } from './components/ModelCatalogTab';
import { DesktopCompanionTab } from './components/DesktopCompanionTab';
import { SystemLogTab } from './components/SystemLogTab';
import { TabType, Language, UserSettings, AppLog } from './types';
import { DEFAULT_SYSTEM_PROMPT } from './data/proseRules';

const STORAGE_KEY = 'autotyper_web_settings_v2';

const DEFAULT_SETTINGS: UserSettings = {
  delayMin: 0.10,
  delayMax: 0.15,
  hotkeyWait: 2,
  typoRate: 0.025,
  isHuman: true,
  soundEnabled: true,
  soundProfile: 'clicky',
  soundVolume: 0.35,
  provider: 'google',
  model: 'gemini-3.8-flash',
  strength: 'standard',
  soProfileId: 'none',
  ollamaHost: 'http://127.0.0.1:11434',
  apiKeys: {},
  customPrompt: DEFAULT_SYSTEM_PROMPT,
  language: 'vi',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('humanizer');
  const [preloadedTyperText, setPreloadedTyperText] = useState<string>('');

  // Load saved settings from localStorage
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Persistent save
  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // LocalStorage quota or disabled
      }
      return updated;
    });
  }, []);

  // System Logs
  const [logs, setLogs] = useState<AppLog[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'AutoTyper Studio initialized. Global hotkeys listener ready.',
    },
    {
      id: 'log-2',
      timestamp: new Date().toLocaleTimeString(),
      level: 'engine',
      message: 'Humanize Engine connected. Active provider: Google Gemini (gemini-2.0-flash).',
    },
    {
      id: 'log-3',
      timestamp: new Date().toLocaleTimeString(),
      level: 'hotkey',
      message: 'Hotkey registered: Ctrl+Shift+H (Humanize clipboard) & Ctrl+T (Type clipboard).',
    },
  ]);

  const addLog = useCallback(
    (message: string, level: AppLog['level'] = 'info') => {
      const newLog: AppLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
      };
      setLogs((prev) => [...prev.slice(-150), newLog]);
    },
    []
  );

  const handleClearLogs = () => {
    setLogs([]);
  };

  // Switch tab and send text to AutoTyper
  const handleSendToTyper = (text: string) => {
    setPreloadedTyperText(text);
    setActiveTab('autotyper');
    addLog(
      settings.language === 'vi'
        ? `Đã chuyển văn bản humanized sang AutoTyper Simulator (${text.length} ký tự)`
        : `Sent ${text.length} chars to AutoTyper live sandbox`,
      'engine'
    );
  };

  // Model selection shortcut from catalog
  const handleSelectModelFromCatalog = (provider: string, modelId: string) => {
    updateSettings({ provider, model: modelId });
    setActiveTab('humanizer');
  };

  // Keyboard shortcut listener within browser
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+H or Cmd+Shift+H -> go to Humanizer
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setActiveTab('humanizer');
        addLog('In-browser hotkey triggered: Ctrl+Shift+H (Humanizer Studio)', 'hotkey');
      }
      // Ctrl+Alt+T or Ctrl+T (in non-input) -> go to AutoTyper
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setActiveTab('autotyper');
        addLog('In-browser hotkey triggered: Ctrl+Alt+T (AutoTyper Simulator)', 'hotkey');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addLog]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={settings.language}
        setLanguage={(lang) => updateSettings({ language: lang })}
        soundEnabled={settings.soundEnabled}
        setSoundEnabled={(enabled) => updateSettings({ soundEnabled: enabled })}
        currentProvider={settings.provider}
        currentModel={settings.model}
        logCount={logs.length}
      />

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'humanizer' && (
          <HumanizeTab
            settings={settings}
            updateSettings={updateSettings}
            language={settings.language}
            onSendToTyper={handleSendToTyper}
            onLog={addLog}
          />
        )}

        {activeTab === 'autotyper' && (
          <AutoTyperTab
            settings={settings}
            updateSettings={updateSettings}
            language={settings.language}
            preloadedText={preloadedTyperText}
            onLog={addLog}
          />
        )}

        {activeTab === 'prose' && (
          <ProseRulesTab
            settings={settings}
            updateSettings={updateSettings}
            language={settings.language}
            onLog={addLog}
          />
        )}

        {activeTab === 'models' && (
          <ModelCatalogTab
            settings={settings}
            updateSettings={updateSettings}
            language={settings.language}
            onSelectModel={handleSelectModelFromCatalog}
            onLog={addLog}
          />
        )}

        {activeTab === 'desktop' && (
          <DesktopCompanionTab
            settings={settings}
            language={settings.language}
            onLog={addLog}
          />
        )}

        {activeTab === 'logs' && (
          <SystemLogTab
            logs={logs}
            onClearLogs={handleClearLogs}
            language={settings.language}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>AutoTyper & AI Humanizer Studio • Engine v2.4</span>
            <span className="text-zinc-700">|</span>
            <span>Based on uploaded Python codebase</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <span>Hard Sentence Cap: &lt; 130 Chars</span>
            <span>•</span>
            <span>Typo Simulator: QWERTY Neighbors</span>
            <span>•</span>
            <span>Anti-AI Cliché Shield</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

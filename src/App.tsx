import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HumanizeTab } from './components/HumanizeTab';
import { AutoTyperTab } from './components/AutoTyperTab';
import { Lesson5512Tab } from './components/Lesson5512Tab';
import { ExamSuiteTab } from './components/ExamSuiteTab';
import { MediaStudioTab } from './components/MediaStudioTab';
import { ProseRulesTab } from './components/ProseRulesTab';
import { ModelCatalogTab } from './components/ModelCatalogTab';
import { DesktopCompanionTab } from './components/DesktopCompanionTab';
import { SystemLogTab } from './components/SystemLogTab';
import { TabType, UserSettings, AppLog } from './types';
import { DEFAULT_SYSTEM_PROMPT } from './data/proseRules';
import {
  CURRICULUM_PRESETS,
  buildLessonPlan5512FromInput,
  buildExamPackageFromInput,
  buildSlidesFromInput,
  buildMicroVideoFromInput,
  buildWorksheetAndGameFromInput,
} from './data/pedagogyPresets';
import {
  LessonPlan5512,
  DifferentiatedExamPackage,
  SlideItem,
  MicroVideoPackage,
  WorksheetAndGamePackage,
} from './types/pedagogyTypes';
import { generatePedagogyModuleOnDemand } from './utils/pedagogyApi';
import { BookOpen, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const STORAGE_KEY = 'autotyper_studio_pro_v3_settings';

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
  customPrompt: DEFAULT_SYSTEM_PROMPT,
  language: 'vi',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('humanizer');
  const [preloadedTyperText, setPreloadedTyperText] = useState<string>('');

  // Load saved settings from localStorage (Isolated Central AppState)
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

  // Central AppState for 10-in-1 Pedagogical Platform
  const defaultPreset = CURRICULUM_PRESETS[0];
  const [lessonTitle, setLessonTitle] = useState<string>(defaultPreset.lessonTitle);
  const [subject, setSubject] = useState<string>(defaultPreset.subject);
  const [grade, setGrade] = useState<string>(defaultPreset.grade);
  const [coreInput, setCoreInput] = useState<string>(defaultPreset.coreKnowledgeText);
  const [showCoreInputEditor, setShowCoreInputEditor] = useState<boolean>(false);
  const [isGeneratingModule, setIsGeneratingModule] = useState<boolean>(false);

  // Isolated Module State Slices
  const [lessonPlan, setLessonPlan] = useState<LessonPlan5512>(() =>
    buildLessonPlan5512FromInput(
      defaultPreset.lessonTitle,
      defaultPreset.subject,
      defaultPreset.grade,
      defaultPreset.coreKnowledgeText
    )
  );
  const [examPackage, setExamPackage] = useState<DifferentiatedExamPackage>(() =>
    buildExamPackageFromInput(
      defaultPreset.lessonTitle,
      defaultPreset.subject,
      defaultPreset.grade,
      defaultPreset.coreKnowledgeText
    )
  );
  const [slides, setSlides] = useState<SlideItem[]>(() =>
    buildSlidesFromInput(
      defaultPreset.lessonTitle,
      defaultPreset.subject,
      defaultPreset.grade,
      defaultPreset.coreKnowledgeText
    )
  );
  const [microVideo, setMicroVideo] = useState<MicroVideoPackage>(() =>
    buildMicroVideoFromInput(
      defaultPreset.lessonTitle,
      defaultPreset.subject,
      defaultPreset.grade,
      defaultPreset.coreKnowledgeText
    )
  );
  const [worksheetGame, setWorksheetGame] = useState<WorksheetAndGamePackage>(() =>
    buildWorksheetAndGameFromInput(
      defaultPreset.lessonTitle,
      defaultPreset.subject,
      defaultPreset.grade,
      defaultPreset.coreKnowledgeText
    )
  );

  // System Logs
  const [logs, setLogs] = useState<AppLog[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'AutoTyper Studio Pro v3.0 (10-in-1) initialized. Bảo tồn 100% lõi v2.4 & kích hoạt Web Worker (0% UI Freeze).',
    },
    {
      id: 'log-2',
      timestamp: new Date().toLocaleTimeString(),
      level: 'engine',
      message: 'Central AppState & Progressive On-Demand Engine ready. Active model: Google Gemini 3.8 Flash.',
    },
    {
      id: 'log-3',
      timestamp: new Date().toLocaleTimeString(),
      level: 'hotkey',
      message: 'Hotkey registered: Ctrl+Shift+H (Humanize) & Ctrl+T (AutoTyper Simulator).',
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

  // Switch tab and send text to AutoTyper Simulator (Module 1)
  const handleSendToTyper = (text: string) => {
    setPreloadedTyperText(text);
    setActiveTab('autotyper');
    addLog(
      `Đã chuyển văn bản sang AutoTyper Simulator (${text.length} ký tự)`,
      'engine'
    );
  };

  // Progressive On-Demand Generator for individual Pedagogical Modules
  const handleRegeneratePedagogyTask = async (
    task: 'lesson5512' | 'exam3part' | 'slides' | 'microvideo' | 'worksheet',
    overrideText?: string,
    overrideTitle?: string,
    overrideSubject?: string,
    overrideGrade?: string
  ) => {
    setIsGeneratingModule(true);
    const targetTitle = overrideTitle ?? lessonTitle;
    const targetSubject = overrideSubject ?? subject;
    const targetGrade = overrideGrade ?? grade;
    const targetText = overrideText ?? coreInput;

    try {
      if (task === 'lesson5512') {
        const { data } = await generatePedagogyModuleOnDemand<LessonPlan5512>(
          'lesson5512',
          {
            lessonTitle: targetTitle,
            subject: targetSubject,
            grade: targetGrade,
            coreKnowledgeText: targetText,
            model: settings.model,
          },
          addLog
        );
        setLessonPlan(data);
      } else if (task === 'exam3part') {
        const { data } = await generatePedagogyModuleOnDemand<DifferentiatedExamPackage>(
          'exam3part',
          {
            lessonTitle: targetTitle,
            subject: targetSubject,
            grade: targetGrade,
            coreKnowledgeText: targetText,
            model: settings.model,
          },
          addLog
        );
        setExamPackage(data);
      } else if (task === 'slides') {
        const { data } = await generatePedagogyModuleOnDemand<SlideItem[]>(
          'slides',
          {
            lessonTitle: targetTitle,
            subject: targetSubject,
            grade: targetGrade,
            coreKnowledgeText: targetText,
            model: settings.model,
          },
          addLog
        );
        setSlides(data);
      } else if (task === 'microvideo') {
        const { data } = await generatePedagogyModuleOnDemand<MicroVideoPackage>(
          'microvideo',
          {
            lessonTitle: targetTitle,
            subject: targetSubject,
            grade: targetGrade,
            coreKnowledgeText: targetText,
            model: settings.model,
          },
          addLog
        );
        setMicroVideo(data);
      } else if (task === 'worksheet') {
        const { data } = await generatePedagogyModuleOnDemand<WorksheetAndGamePackage>(
          'worksheet',
          {
            lessonTitle: targetTitle,
            subject: targetSubject,
            grade: targetGrade,
            coreKnowledgeText: targetText,
            model: settings.model,
          },
          addLog
        );
        setWorksheetGame(data);
      }
    } finally {
      setIsGeneratingModule(false);
    }
  };

  // Sync all pedagogical modules when preset changes or user clicks Sync Core Knowledge
  const handleSyncAllFromCoreInput = (
    newTitle: string,
    newSubject: string,
    newGrade: string,
    newText: string
  ) => {
    setLessonTitle(newTitle);
    setSubject(newSubject);
    setGrade(newGrade);
    setCoreInput(newText);

    setLessonPlan(buildLessonPlan5512FromInput(newTitle, newSubject, newGrade, newText));
    setExamPackage(buildExamPackageFromInput(newTitle, newSubject, newGrade, newText));
    setSlides(buildSlidesFromInput(newTitle, newSubject, newGrade, newText));
    setMicroVideo(buildMicroVideoFromInput(newTitle, newSubject, newGrade, newText));
    setWorksheetGame(buildWorksheetAndGameFromInput(newTitle, newSubject, newGrade, newText));

    addLog(
      `Đã đồng bộ Tri thức cốt lõi "${newTitle}" (${newSubject} - ${newGrade}) sang các phân hệ 03 → 10`,
      'engine'
    );
  };

  // Send humanized text from Module 2 directly into a specific Pedagogical branch
  const handleSendFromHumanizerToPedagogy = (
    text: string,
    targetTab: 'lesson5512' | 'examsuite' | 'mediastudio'
  ) => {
    const firstLine = text.split('\n')[0]?.trim().slice(0, 75) || lessonTitle;
    const derivedTitle = firstLine.length > 10 ? firstLine : lessonTitle;
    handleSyncAllFromCoreInput(derivedTitle, subject, grade, text);
    setActiveTab(targetTab);
  };

  const handleSelectModelFromCatalog = (provider: string, modelId: string) => {
    updateSettings({ provider, model: modelId });
    setActiveTab('humanizer');
  };

  // In-browser shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setActiveTab('humanizer');
        addLog('In-browser hotkey triggered: Ctrl+Shift+H (AI Humanizer PRO)', 'hotkey');
      }
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setActiveTab('autotyper');
        addLog('In-browser hotkey triggered: Ctrl+Alt+T (AutoTyper Simulator)', 'hotkey');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addLog]);

  const isPedagogyTab =
    activeTab === 'lesson5512' || activeTab === 'examsuite' || activeTab === 'mediastudio';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Shared Central AppState Cockpit Bar for Pedagogical Modules (03 -> 10) */}
        {isPedagogyTab && (
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Central AppState — Nguồn Tri Thức Cơ Sở Dùng Chung Cho Hệ Thống 10-Trong-1
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Nhập tên bài học hoặc chọn mẫu học liệu chuẩn GDPT 2018 để đồng bộ xuyên suốt Giáo án 5512 · Đề 3 phần · Slide PPTX · Video · Game
                  </p>
                </div>
              </div>

              {/* Preset Quick Switcher */}
              <div className="flex flex-wrap items-center gap-2">
                {CURRICULUM_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() =>
                      handleSyncAllFromCoreInput(
                        preset.lessonTitle,
                        preset.subject,
                        preset.grade,
                        preset.coreKnowledgeText
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      lessonTitle === preset.lessonTitle
                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    Mẫu: {preset.subject} ({preset.grade})
                  </button>
                ))}

                <button
                  onClick={() => setShowCoreInputEditor(!showCoreInputEditor)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1"
                >
                  <span>{showCoreInputEditor ? 'Thu gọn học liệu' : 'Tùy chỉnh Bài học & Học liệu'}</span>
                  {showCoreInputEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {showCoreInputEditor && (
              <div className="pt-3 border-t border-zinc-800 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-zinc-400 mb-1">Tên bài học / Chủ đề:</label>
                    <input
                      type="text"
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Môn học:</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Khối lớp:</label>
                    <input
                      type="text"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Văn bản tri thức cơ sở (coreInput):
                  </label>
                  <textarea
                    value={coreInput}
                    onChange={(e) => setCoreInput(e.target.value)}
                    rows={4}
                    className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      handleSyncAllFromCoreInput(lessonTitle, subject, grade, coreInput)
                    }
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Áp Dụng & Đồng Bộ Toàn Bộ Phân Hệ (03 → 10)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODULE 2: AI HUMANIZER PRO (Preserved v2.4 + Progressive Branching) */}
        {activeTab === 'humanizer' && (
          <HumanizeTab
            settings={settings}
            updateSettings={updateSettings}
            language={settings.language}
            onSendToTyper={handleSendToTyper}
            onSendToPedagogy={handleSendFromHumanizerToPedagogy}
            onLog={addLog}
          />
        )}

        {/* MODULE 1: AUTOTYPER SIMULATOR (Preserved v2.4) */}
        {activeTab === 'autotyper' && (
          <AutoTyperTab
            settings={settings}
            updateSettings={updateSettings}
            language={settings.language}
            preloadedText={preloadedTyperText}
            onLog={addLog}
          />
        )}

        {/* MODULES 3 & 4: LESSON PLAN 5512 & COMPETENCY COLOR MAP */}
        {activeTab === 'lesson5512' && (
          <Lesson5512Tab
            lessonPlan={lessonPlan}
            isGenerating={isGeneratingModule}
            onRegenerate={() => handleRegeneratePedagogyTask('lesson5512')}
            onSendToTyper={handleSendToTyper}
            onLog={addLog}
          />
        )}

        {/* MODULES 5, 6 & 7: 3-PART EXAM, ADVERSARIAL AUDIT & UNDERLINED KEY + MATRIX */}
        {activeTab === 'examsuite' && (
          <ExamSuiteTab
            examPackage={examPackage}
            onUpdateExam={setExamPackage}
            isGenerating={isGeneratingModule}
            onRegenerate={() => handleRegeneratePedagogyTask('exam3part')}
            onSendToTyper={handleSendToTyper}
            onLog={addLog}
          />
        )}

        {/* MODULES 8, 9 & 10: PPTX SLIDES, MICRO-VIDEO (2-3 MIN), WORKSHEET & MINI-GAME */}
        {activeTab === 'mediastudio' && (
          <MediaStudioTab
            lessonTitle={lessonTitle}
            slides={slides}
            microVideo={microVideo}
            worksheetGame={worksheetGame}
            isGenerating={isGeneratingModule}
            onRegenerateModule={(task) => handleRegeneratePedagogyTask(task)}
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

      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>AutoTyper Studio Pro v3.0 (10-in-1 Pedagogical & Assessment Platform)</span>
            <span aria-hidden="true">·</span>
            <span>Bảo lưu 100% v2.4 · GitHub Pages & Vercel Ready</span>
          </div>

          <div className="flex items-center gap-3 text-zinc-400">
            <span>State Isolation</span>
            <span aria-hidden="true">·</span>
            <span>Lazy CDN Export (.docx / .pptx)</span>
            <span aria-hidden="true">·</span>
            <span>Web Worker 0% UI Freeze</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

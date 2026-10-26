import React, { useState, useEffect, useCallback } from 'react';
import { Header, ViewportDisplayMode } from './components/Header';
import { HumanizeTab } from './components/HumanizeTab';
import { AutoTyperTab } from './components/AutoTyperTab';
import { ClassroomSimulatorTab } from './components/ClassroomSimulatorTab';
import { Lesson5512Tab } from './components/Lesson5512Tab';
import { ExamSuiteTab } from './components/ExamSuiteTab';
import { MediaStudioTab } from './components/MediaStudioTab';
import { ProseRulesTab } from './components/ProseRulesTab';
import { ModelCatalogTab } from './components/ModelCatalogTab';
import { DataBackupSyncTab, FullWorkspaceBackupPayload } from './components/DataBackupSyncTab';
import { DesktopCompanionTab } from './components/DesktopCompanionTab';
import { SystemLogTab } from './components/SystemLogTab';
import { GuideAndRoleModal } from './components/GuideAndRoleModal';
import { TabType, UserSettings, AppLog } from './types';
import { DEFAULT_SYSTEM_PROMPT } from './data/proseRules';
import {
  CURRICULUM_PRESETS,
  buildLessonPlan5512FromInput,
  buildExamPackageFromInput,
  buildSlidesFromInput,
  buildMicroVideoFromInput,
  buildWorksheetAndGameFromInput,
  cleanPedagogyText,
} from './data/pedagogyPresets';
import {
  LessonPlan5512,
  DifferentiatedExamPackage,
  SlideItem,
  MicroVideoPackage,
  WorksheetAndGamePackage,
} from './types/pedagogyTypes';
import { generatePedagogyModuleOnDemand } from './utils/pedagogyApi';
import { BookOpen, Sparkles, ChevronDown, ChevronUp, CloudUpload, HelpCircle } from 'lucide-react';

const STORAGE_KEY = 'autotyper_studio_pro_v3_settings';
const WORKSPACE_STORAGE_KEY = 'autotyper_studio_pro_v3_workspace_clean';

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
  syncVaultKey: 'HTK-PRO-8899',
  aiBridgeAutoSync: true,
};

function sanitizeLessonPlan(lp: LessonPlan5512): LessonPlan5512 {
  return {
    ...lp,
    lessonTitle: cleanPedagogyText(lp.lessonTitle),
    duration: '',
    knowledgeObjectives: (lp.knowledgeObjectives || []).map(cleanPedagogyText),
    generalCompetencies: (lp.generalCompetencies || []).map(cleanPedagogyText),
    specificCompetencies: (lp.specificCompetencies || []).map(cleanPedagogyText),
    digitalCompetencyNLS: cleanPedagogyText(lp.digitalCompetencyNLS || ''),
    aiCompetencyNLAI: cleanPedagogyText(lp.aiCompetencyNLAI || ''),
    interdisciplinaryTHLM: cleanPedagogyText(lp.interdisciplinaryTHLM || ''),
    qualities: (lp.qualities || []).map(cleanPedagogyText),
    teacherEquipment: (lp.teacherEquipment || []).map(cleanPedagogyText),
    studentEquipment: (lp.studentEquipment || []).map(cleanPedagogyText),
    activities: (lp.activities || []).map((act) => ({
      ...act,
      title: cleanPedagogyText(act.title),
      durationMinutes: 0,
      objectives: (act.objectives || []).map(cleanPedagogyText),
      content: cleanPedagogyText(act.content),
      products: (act.products || []).map(cleanPedagogyText),
      twoColumnRows: (act.twoColumnRows || []).map((r) => ({
        ...r,
        stepTitle: cleanPedagogyText(r.stepTitle),
        teacherStudentAction: (r.teacherStudentAction || []).map(cleanPedagogyText),
        expectedProduct: (r.expectedProduct || []).map(cleanPedagogyText),
      })),
    })),
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('humanizer');
  const [preloadedTyperText, setPreloadedTyperText] = useState<string>('');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [displayMode, setDisplayMode] = useState<ViewportDisplayMode>('auto');

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
        // Ignore
      }
      return updated;
    });
  }, []);

  const defaultPreset = CURRICULUM_PRESETS[0];
  const savedWorkspace = (() => {
    try {
      const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Partial<FullWorkspaceBackupPayload>;
    } catch {
      // Ignore
    }
    return null;
  })();

  const [lessonTitle, setLessonTitle] = useState<string>(
    savedWorkspace?.lessonTitle || defaultPreset.lessonTitle
  );
  const [subject, setSubject] = useState<string>(
    savedWorkspace?.subject || defaultPreset.subject
  );
  const [grade, setGrade] = useState<string>(
    savedWorkspace?.grade || defaultPreset.grade
  );
  const [coreInput, setCoreInput] = useState<string>(
    savedWorkspace?.coreInput || defaultPreset.coreKnowledgeText
  );
  const [showCoreInputEditor, setShowCoreInputEditor] = useState<boolean>(false);
  const [isGeneratingModule, setIsGeneratingModule] = useState<boolean>(false);

  const [lessonPlan, setLessonPlan] = useState<LessonPlan5512>(() =>
    sanitizeLessonPlan(
      savedWorkspace?.lessonPlan ||
        buildLessonPlan5512FromInput(
          defaultPreset.lessonTitle,
          defaultPreset.subject,
          defaultPreset.grade,
          defaultPreset.coreKnowledgeText
        )
    )
  );
  const [examPackage, setExamPackage] = useState<DifferentiatedExamPackage>(() =>
    savedWorkspace?.examPackage ||
    buildExamPackageFromInput(
      defaultPreset.lessonTitle,
      defaultPreset.subject,
      defaultPreset.grade,
      defaultPreset.coreKnowledgeText
    )
  );
  const [slides, setSlides] = useState<SlideItem[]>(() =>
    savedWorkspace?.slides ||
    buildSlidesFromInput(
      defaultPreset.lessonTitle,
      defaultPreset.subject,
      defaultPreset.grade,
      defaultPreset.coreKnowledgeText
    )
  );
  const [microVideo, setMicroVideo] = useState<MicroVideoPackage>(() =>
    savedWorkspace?.microVideo ||
    buildMicroVideoFromInput(
      defaultPreset.lessonTitle,
      defaultPreset.subject,
      defaultPreset.grade,
      defaultPreset.coreKnowledgeText
    )
  );
  const [worksheetGame, setWorksheetGame] = useState<WorksheetAndGamePackage>(() =>
    savedWorkspace?.worksheetGame ||
    buildWorksheetAndGameFromInput(
      defaultPreset.lessonTitle,
      defaultPreset.subject,
      defaultPreset.grade,
      defaultPreset.coreKnowledgeText
    )
  );

  // Auto-persist workspace locally whenever it changes
  useEffect(() => {
    try {
      const snapshot: FullWorkspaceBackupPayload = {
        version: '3.0.0',
        author: 'Hồ Tấn Khải',
        exportedAt: new Date().toISOString(),
        settings,
        lessonTitle,
        subject,
        grade,
        coreInput,
        lessonPlan,
        examPackage,
        slides,
        microVideo,
        worksheetGame,
      };
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore quota
    }
  }, [
    settings,
    lessonTitle,
    subject,
    grade,
    coreInput,
    lessonPlan,
    examPackage,
    slides,
    microVideo,
    worksheetGame,
  ]);

  const [logs, setLogs] = useState<AppLog[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'Auto Typer Studio Pro v3.0 — Tác giả: Hồ Tấn Khải đã khởi động thành công.',
    },
    {
      id: 'log-2',
      timestamp: new Date().toLocaleTimeString(),
      level: 'engine',
      message: 'Đã đồng bộ 37 mô hình AI, định dạng Times New Roman 12pt và hệ mã màu chuẩn.',
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

  const handleRestoreWorkspace = (payload: FullWorkspaceBackupPayload) => {
    if (payload.settings) {
      updateSettings(payload.settings);
    }
    if (payload.lessonTitle) setLessonTitle(payload.lessonTitle);
    if (payload.subject) setSubject(payload.subject);
    if (payload.grade) setGrade(payload.grade);
    if (payload.coreInput) setCoreInput(payload.coreInput);
    if (payload.lessonPlan) setLessonPlan(sanitizeLessonPlan(payload.lessonPlan));
    if (payload.examPackage) setExamPackage(payload.examPackage);
    if (payload.slides) setSlides(payload.slides);
    if (payload.microVideo) setMicroVideo(payload.microVideo);
    if (payload.worksheetGame) setWorksheetGame(payload.worksheetGame);
  };

  const handleSendToTyper = (text: string) => {
    setPreloadedTyperText(text);
    setActiveTab('autotyper');
    addLog(
      `Đã chuyển văn bản sang AutoTyper Simulator (${text.length} ký tự)`,
      'engine'
    );
  };

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
        setLessonPlan(sanitizeLessonPlan(data));
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

    setLessonPlan(
      sanitizeLessonPlan(buildLessonPlan5512FromInput(newTitle, newSubject, newGrade, newText))
    );
    setExamPackage(buildExamPackageFromInput(newTitle, newSubject, newGrade, newText));
    setSlides(buildSlidesFromInput(newTitle, newSubject, newGrade, newText));
    setMicroVideo(buildMicroVideoFromInput(newTitle, newSubject, newGrade, newText));
    setWorksheetGame(buildWorksheetAndGameFromInput(newTitle, newSubject, newGrade, newText));

    addLog(
      `Đã đồng bộ chủ đề "${newTitle}" (${newSubject} - ${newGrade}) sang toàn bộ phân hệ.`,
      'engine'
    );
  };

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setActiveTab('humanizer');
        addLog('Phím tắt: Ctrl+Shift+H (AI Humanizer PRO)', 'hotkey');
      }
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setActiveTab('autotyper');
        addLog('Phím tắt: Ctrl+Alt+T (AutoTyper Simulator)', 'hotkey');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addLog]);

  const isPedagogyTab =
    activeTab === 'lesson5512' ||
    activeTab === 'examsuite' ||
    activeTab === 'mediastudio' ||
    activeTab === 'simulator';

  const currentBackupPayload: FullWorkspaceBackupPayload = {
    version: '3.0.0',
    author: 'Hồ Tấn Khải',
    exportedAt: new Date().toISOString(),
    settings,
    lessonTitle,
    subject,
    grade,
    coreInput,
    lessonPlan,
    examPackage,
    slides,
    microVideo,
    worksheetGame,
  };

  const viewportClassMap: Record<ViewportDisplayMode, string> = {
    auto: 'viewport-mode-auto',
    pc: 'viewport-mode-pc',
    laptop: 'viewport-mode-laptop',
    tablet: 'viewport-mode-tablet',
    mobile: 'viewport-mode-mobile',
    projector: 'viewport-mode-projector',
  };

  return (
    <div className="light-blue-3d-theme min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-900">
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
        onOpenGuide={() => setIsGuideOpen(true)}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
      />

      <GuideAndRoleModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        lessonPlan={lessonPlan}
        examPackage={examPackage}
        slides={slides}
        worksheetGame={worksheetGame}
        fullBackupData={currentBackupPayload}
        onLog={addLog}
      />

      <main className={`flex-1 ${viewportClassMap[displayMode]} px-4 sm:px-6 lg:px-8 py-6 space-y-6 transition-all duration-200`}>
        {/* Shared 3D Curriculum Cockpit Bar for Pedagogical Modules */}
        {isPedagogyTab && (
          <div className="p-5 rounded-2xl bg-zinc-900 border-2 border-cyan-400 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300">
                  <BookOpen className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-white">
                    Chủ Đề Bài Học & Nguồn Học Liệu Đồng Bộ
                  </h2>
                  <p className="text-xs text-cyan-200">
                    Đang chọn: <b>{lessonTitle}</b> ({subject} · {grade})
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {CURRICULUM_PRESETS.map((preset, idx) => {
                  const btnStyles = [
                    'btn-3d-cyan',
                    'btn-3d-purple',
                    'btn-3d-emerald',
                  ];
                  const isCurrent = lessonTitle === preset.lessonTitle;
                  return (
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
                      className={`btn-3d px-3.5 py-2 rounded-xl text-xs font-extrabold ${
                        isCurrent
                          ? btnStyles[idx % btnStyles.length]
                          : 'bg-slate-800 text-slate-200 border border-slate-600'
                      }`}
                    >
                      Mẫu: {preset.subject} ({preset.grade})
                    </button>
                  );
                })}

                <button
                  onClick={() => setShowCoreInputEditor(!showCoreInputEditor)}
                  className="btn-3d btn-3d-amber px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
                >
                  <span>{showCoreInputEditor ? 'Thu Gọn' : 'Nhập Bài Học Mới'}</span>
                  {showCoreInputEditor ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {showCoreInputEditor && (
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-cyan-300 mb-1">
                      Tên bài học / Chủ đề:
                    </label>
                    <input
                      type="text"
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border-2 border-cyan-500 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-cyan-300 mb-1">Môn học:</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border-2 border-cyan-500 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-cyan-300 mb-1">Khối lớp:</label>
                    <input
                      type="text"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border-2 border-cyan-500 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1">
                    Nội dung kiến thức cốt lõi:
                  </label>
                  <textarea
                    value={coreInput}
                    onChange={(e) => setCoreInput(e.target.value)}
                    rows={4}
                    className="w-full p-3 rounded-xl bg-slate-950 border-2 border-cyan-500 text-xs text-slate-100 doc-times-12pt leading-relaxed focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      handleSyncAllFromCoreInput(lessonTitle, subject, grade, coreInput)
                    }
                    className="btn-3d btn-3d-emerald px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Áp Dụng & Đồng Bộ Toàn Bộ Hệ Thống</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI HUMANIZER PRO */}
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

        {/* AUTOTYPER SIMULATOR */}
        {activeTab === 'autotyper' && (
          <AutoTyperTab
            settings={settings}
            updateSettings={updateSettings}
            language={settings.language}
            preloadedText={preloadedTyperText}
            onOpenSimulatorTab={() => setActiveTab('simulator')}
            onLog={addLog}
          />
        )}

        {/* DIGITAL TWIN CLASSROOM SIMULATOR (36 AI STUDENTS) */}
        {activeTab === 'simulator' && (
          <ClassroomSimulatorTab
            language={settings.language}
            initialLessonText={preloadedTyperText || coreInput}
            onSyncToAutoTyper={handleSendToTyper}
            onLog={addLog}
          />
        )}

        {/* LESSON PLAN 5512 */}
        {activeTab === 'lesson5512' && (
          <Lesson5512Tab
            lessonPlan={lessonPlan}
            onUpdateLessonPlan={(updated) => setLessonPlan(sanitizeLessonPlan(updated))}
            isGenerating={isGeneratingModule}
            onRegenerate={() => handleRegeneratePedagogyTask('lesson5512')}
            onSendToTyper={handleSendToTyper}
            onLog={addLog}
          />
        )}

        {/* EXAM SUITE, AUDIT & MATRIX */}
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

        {/* PPTX SLIDES, MICRO-VIDEO, WORKSHEET & MINI-GAME */}
        {activeTab === 'mediastudio' && (
          <MediaStudioTab
            lessonTitle={lessonTitle}
            slides={slides}
            microVideo={microVideo}
            worksheetGame={worksheetGame}
            onUpdateSlides={setSlides}
            onUpdateMicroVideo={setMicroVideo}
            onUpdateWorksheetGame={setWorksheetGame}
            isGenerating={isGeneratingModule}
            onRegenerateModule={(task) => handleRegeneratePedagogyTask(task)}
            onLog={addLog}
          />
        )}

        {/* AI MODELS & 100% AUTO-SYNC */}
        {activeTab === 'models' && (
          <ModelCatalogTab
            settings={settings}
            updateSettings={updateSettings}
            language={settings.language}
            onSelectModel={handleSelectModelFromCatalog}
            onLog={addLog}
          />
        )}

        {/* DATA BACKUP & CROSS-DEVICE SYNC */}
        {activeTab === 'sync' && (
          <DataBackupSyncTab
            language={settings.language}
            workspacePayload={currentBackupPayload}
            onRestoreWorkspace={handleRestoreWorkspace}
            updateSettings={updateSettings}
            onLog={addLog}
          />
        )}

        {/* PROSE RULES */}
        {activeTab === 'prose' && (
          <ProseRulesTab
            settings={settings}
            updateSettings={updateSettings}
            language={settings.language}
            onLog={addLog}
          />
        )}

        {/* GITHUB & DESKTOP */}
        {activeTab === 'desktop' && (
          <DesktopCompanionTab
            settings={settings}
            language={settings.language}
            onLog={addLog}
          />
        )}

        {/* LOGS */}
        {activeTab === 'logs' && (
          <SystemLogTab
            logs={logs}
            onClearLogs={handleClearLogs}
            language={settings.language}
          />
        )}
      </main>

      <footer className="frame-3d-header border-t-4 border-sky-400 py-5 text-xs text-slate-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm brand-title-blink">
              Auto Typer Studio Pro v3.0
            </span>
            <span aria-hidden="true" className="text-sky-400">·</span>
            <span className="font-bold text-amber-300">
              Tác giả: Hồ Tấn Khải
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="btn-3d btn-3d-rose px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Hướng Dẫn & Tải Đa Định Dạng</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

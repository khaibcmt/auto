import React, { useState, useRef, useEffect } from 'react';
import {
  Presentation,
  Film,
  Gamepad2,
  Download,
  Play,
  Square,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Volume2,
  Trophy,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import {
  SlideItem,
  MicroVideoPackage,
  WorksheetAndGamePackage,
} from '../types/pedagogyTypes';
import { exportSlidesToPptx, exportWorksheetToWord } from '../utils/exportHelpers';
import { soundSynth } from '../utils/audioSynth';

interface MediaStudioTabProps {
  lessonTitle: string;
  slides: SlideItem[];
  microVideo: MicroVideoPackage;
  worksheetGame: WorksheetAndGamePackage;
  isGenerating: boolean;
  onRegenerateModule: (task: 'slides' | 'microvideo' | 'worksheet') => void;
  onLog: (msg: string, level?: 'info' | 'engine' | 'warning') => void;
}

export const MediaStudioTab: React.FC<MediaStudioTabProps> = ({
  lessonTitle,
  slides,
  microVideo,
  worksheetGame,
  isGenerating,
  onRegenerateModule,
  onLog,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'slides' | 'video' | 'worksheet_game'>('slides');
  const [currentSlideIdx, setCurrentSlideIdx] = useState<number>(0);
  const [isExportingPptx, setIsExportingPptx] = useState<boolean>(false);

  // Module 9: Video Studio state
  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Module 10: Worksheet & Mini-game state
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState<boolean>(false);
  const [gameStep, setGameStep] = useState<number>(0);
  const [gameScore, setGameScore] = useState<number>(0);
  const [selectedGameOption, setSelectedGameOption] = useState<number | null>(null);
  const [gameFinished, setGameFinished] = useState<boolean>(false);

  const currentSlide = slides[currentSlideIdx] || slides[0];
  const currentScene = microVideo.scenes[activeSceneIdx] || microVideo.scenes[0];

  // Export PPTX via Lazy-Loaded PptxGenJS
  const handleExportPptx = async () => {
    setIsExportingPptx(true);
    onLog('Đang nạp động thư viện PptxGenJS (Lazy Load CDN) và đóng gói file .pptx...', 'engine');
    try {
      await exportSlidesToPptx(slides, lessonTitle);
      onLog('Đã xuất thành công file PowerPoint (.pptx) kèm Speaker Notes ở từng slide!', 'info');
    } catch (err) {
      onLog(`Lỗi xuất PPTX: ${err instanceof Error ? err.message : String(err)}`, 'warning');
    } finally {
      setIsExportingPptx(false);
    }
  };

  // Module 9: Render 60 FPS Canvas frame for current scene
  useEffect(() => {
    if (activeSubTab !== 'video') return;
    const canvas = canvasRef.current;
    if (!canvas || !currentScene) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTick = performance.now();

    const renderFrame = (now: number) => {
      const elapsed = (now - startTick) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#09090b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Top competency accent bar
      ctx.fillStyle = currentScene.accentColor || '#06b6d4';
      ctx.fillRect(0, 0, w, 8);

      // Animated pulse circle
      const pulseRadius = 36 + Math.sin(elapsed * 3) * 6;
      ctx.beginPath();
      ctx.arc(w - 65, 55, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = `${currentScene.accentColor}22`;
      ctx.fill();

      // Scene badge & timeRange
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(
        `CẢNH ${currentScene.sceneNumber}/${microVideo.scenes.length}  ·  ${currentScene.timeRange}  ·  ${currentScene.phase.toUpperCase()}`,
        32,
        46
      );

      // Lesson Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 21px sans-serif';
      ctx.fillText(lessonTitle.slice(0, 56), 32, 84);

      // Motion direction box
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(32, 108, w - 64, 58);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px sans-serif';
      ctx.fillText(`Hiệu ứng hình ảnh: ${currentScene.motionEffect}`, 46, 132);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`Bối cảnh: ${currentScene.visualDirection.slice(0, 78)}`, 46, 154);

      // Subtitle Kinetic Box at bottom
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = currentScene.accentColor || '#06b6d4';
      ctx.lineWidth = 2;
      ctx.fillRect(32, h - 125, w - 64, 88);
      ctx.strokeRect(32, h - 125, w - 64, 88);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px sans-serif';
      const sub = currentScene.subtitleText;
      const line1 = sub.slice(0, 72);
      const line2 = sub.slice(72, 144);
      ctx.fillText(line1, 48, h - 88);
      if (line2) {
        ctx.fillText(line2, 48, h - 62);
      }

      if (isPlayingVideo || isRecordingVideo) {
        animFrameRef.current = requestAnimationFrame(renderFrame);
      }
    };

    renderFrame(performance.now());

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [activeSubTab, currentScene, lessonTitle, microVideo.scenes.length, isPlayingVideo, isRecordingVideo]);

  const handlePlayMicroVideoWithVoice = () => {
    if (isPlayingVideo) {
      setIsPlayingVideo(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    setIsPlayingVideo(true);
    onLog(`Đang phát Cảnh ${currentScene.sceneNumber} (${currentScene.timeRange}) kèm giọng đọc AI...`, 'info');

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(currentScene.voiceoverScript);
      utter.lang = 'vi-VN';
      utter.rate = 1.02;
      utter.onend = () => {
        setIsPlayingVideo(false);
      };
      window.speechSynthesis.speak(utter);
    } else {
      setTimeout(() => setIsPlayingVideo(false), 5000);
    }
  };

  // Record 4-second preview clip from HTML5 Canvas to downloadable video file
  const handleRecordAndDownloadVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRecordingVideo) return;

    try {
      setIsRecordingVideo(true);
      onLog('Đang kết xuất khung hình video bài giảng từ Canvas (60 FPS)...', 'engine');
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Video_Vi_Mo_Canh_${currentScene.sceneNumber}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecordingVideo(false);
        onLog('Đã xuất thành công file Video bài giảng vi mô!', 'info');
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 3500);
    } catch {
      setIsRecordingVideo(false);
      onLog('Trình duyệt hiện tại không hỗ trợ MediaRecorder trên Canvas.', 'warning');
    }
  };

  // Module 10: Mini-game handler
  const currentGameQ = worksheetGame.gameQuestions[gameStep] || worksheetGame.gameQuestions[0];

  const handleSelectGameAnswer = (idx: number) => {
    if (selectedGameOption !== null) return;
    setSelectedGameOption(idx);
    if (idx === currentGameQ.correctIndex) {
      soundSynth.playKeyClick('\n');
      setGameScore((prev) => prev + currentGameQ.points);
    } else {
      soundSynth.playKeyClick('Backspace');
    }
  };

  const handleNextGameQuestion = () => {
    if (gameStep + 1 < worksheetGame.gameQuestions.length) {
      setGameStep((prev) => prev + 1);
      setSelectedGameOption(null);
    } else {
      setGameFinished(true);
    }
  };

  const handleResetGame = () => {
    setGameStep(0);
    setGameScore(0);
    setSelectedGameOption(null);
    setGameFinished(false);
  };

  const handleExportGameJson = () => {
    const json = JSON.stringify(worksheetGame.gameQuestions, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Goi_Cau_Hoi_MiniGame_On_Tap.json';
    a.click();
    URL.revokeObjectURL(url);
    onLog('Đã xuất gói câu hỏi trắc nghiệm JSON để import vào hệ thống tương tác', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation for Modules 8, 9, 10 */}
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
          <button
            onClick={() => setActiveSubTab('slides')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'slides'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Presentation className="w-4 h-4 text-cyan-400" />
            <span>08. One-Click Slide Studio (.PPTX)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('video')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'video'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Film className="w-4 h-4 text-purple-400" />
            <span>09. Xưởng Video Vi Mô (2-3 Phút)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('worksheet_game')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'worksheet_game'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-emerald-400" />
            <span>10. Phiếu Học Tập & Trò Chơi Ôn Tập</span>
          </button>
        </div>

        <div className="text-xs text-zinc-400">
          Lazy Loading CDN: Chỉ tải thư viện xuất file khi người dùng bấm nút
        </div>
      </div>

      {/* MODULE 8: ONE-CLICK SLIDE STUDIO (PPTX) */}
      {activeSubTab === 'slides' && currentSlide && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Phân Hệ 08: One-Click Slide Studio — Xuất PowerPoint (.pptx) Kèm Speaker Notes
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Phân cấp Tiêu đề · Nội dung cốt lõi · Câu hỏi tương tác · Lời thoại giáo viên ở từng slide
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onRegenerateModule('slides')}
                disabled={isGenerating}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tái tạo bộ Slide</span>
              </button>

              <button
                onClick={handleExportPptx}
                disabled={isExportingPptx}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExportingPptx ? 'Đang nạp CDN & Xuất .pptx...' : 'Xuất File PowerPoint (.pptx)'}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Slide Thumbnails List */}
            <div className="space-y-2">
              {slides.map((s, idx) => (
                <button
                  key={s.slideNumber}
                  onClick={() => setCurrentSlideIdx(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    currentSlideIdx === idx
                      ? 'bg-zinc-800 border-cyan-500 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span>Slide {s.slideNumber}</span>
                    <span>[{s.competencyHighlight || '5512'}]</span>
                  </div>
                  <p className="text-xs font-bold truncate">{s.title}</p>
                </button>
              ))}
            </div>

            {/* 16:9 Slide Canvas Preview + Speaker Notes */}
            <div className="lg:col-span-3 space-y-4">
              <div className="rounded-xl bg-slate-950 border-2 border-zinc-800 overflow-hidden shadow-2xl">
                {/* Top Competency Accent Bar */}
                <div
                  className={`h-2 w-full ${
                    currentSlide.competencyHighlight === 'NLS'
                      ? 'bg-blue-600'
                      : currentSlide.competencyHighlight === 'NLAI'
                      ? 'bg-red-600'
                      : 'bg-amber-600'
                  }`}
                />

                <div className="p-6 sm:p-8 min-h-[340px] flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                      <span>
                        SLIDE {currentSlide.slideNumber} / {slides.length} · NĂNG LỰC TRỌNG TÂM: [{currentSlide.competencyHighlight || '5512'}]
                      </span>
                      <span>16:9 WIDESCREEN</span>
                    </div>

                    <h4 className="text-xl sm:text-2xl font-bold text-white">
                      {currentSlide.title}
                    </h4>
                    <p className="text-sm text-zinc-400 italic">
                      {currentSlide.subtitle}
                    </p>

                    <div className="pt-3 space-y-2.5">
                      {currentSlide.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2.5 text-sm text-zinc-200 leading-relaxed">
                          <span className="text-cyan-400 font-bold mt-0.5">•</span>
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {currentSlide.interactiveQuestion && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 text-sm text-cyan-300 font-semibold">
                      Câu hỏi tương tác lớp học: {currentSlide.interactiveQuestion}
                    </div>
                  )}
                </div>

                {/* Slide Footer Navigation */}
                <div className="px-6 py-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setCurrentSlideIdx((p) => Math.max(0, p - 1))}
                    disabled={currentSlideIdx === 0}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 disabled:opacity-40 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Slide trước</span>
                  </button>

                  <span className="font-mono text-zinc-400">
                    Slide {currentSlideIdx + 1} / {slides.length}
                  </span>

                  <button
                    onClick={() => setCurrentSlideIdx((p) => Math.min(slides.length - 1, p + 1))}
                    disabled={currentSlideIdx === slides.length - 1}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 disabled:opacity-40 flex items-center gap-1"
                  >
                    <span>Slide tiếp</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Speaker Notes Box */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Speaker Notes — Lời thoại Giáo viên (Tự động nhúng vào từng Slide khi xuất .pptx):
                </p>
                <p className="text-sm text-zinc-200 leading-relaxed">
                  {currentSlide.speakerNotes}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 9: MICRO-VIDEO STUDIO (2-3 MINUTES) */}
      {activeSubTab === 'video' && currentScene && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Phân Hệ 09: Xưởng Video Bài Giảng Vi Mô (2-3 Phút) — Hook / Warm-up
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Tổng thời lượng: {microVideo.totalDurationSec} giây (2 phút 30 giây) · Đồng bộ Timeline từng giây, Phụ đề & Giọng đọc AI
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handlePlayMicroVideoWithVoice}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {isPlayingVideo ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-4 h-4" />}
                <span>{isPlayingVideo ? 'Dừng Phát' : 'Phát Cảnh & Giọng Đọc AI'}</span>
              </button>

              <button
                onClick={handleRecordAndDownloadVideo}
                disabled={isRecordingVideo}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isRecordingVideo ? 'Đang Ghi Video...' : 'Xuất Video Ngắn (.webm)'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live HTML5 Canvas Video Preview */}
            <div className="lg:col-span-7 space-y-3">
              <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-xl">
                <canvas
                  ref={canvasRef}
                  width={760}
                  height={420}
                  className="w-full h-auto block"
                />
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                <p className="text-xs font-bold text-cyan-400">
                  Lời bình Voiceover AI (Cảnh {currentScene.sceneNumber} · {currentScene.timeRange}):
                </p>
                <p className="text-sm text-zinc-200 leading-relaxed">
                  "{currentScene.voiceoverScript}"
                </p>
              </div>
            </div>

            {/* Timeline Script Cards */}
            <div className="lg:col-span-5 space-y-3">
              <h4 className="text-sm font-bold text-white">
                Kịch Bản Phân Cảnh Chi Tiết Theo Giây (00:00 → 02:30)
              </h4>
              {microVideo.scenes.map((sc, idx) => (
                <div
                  key={sc.sceneNumber}
                  onClick={() => setActiveSceneIdx(idx)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                    activeSceneIdx === idx
                      ? 'bg-zinc-800/90 border-cyan-500'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-cyan-400">
                      Cảnh {sc.sceneNumber}: {sc.timeRange} ({sc.durationSec}s)
                    </span>
                    <span className="text-zinc-400">{sc.phase}</span>
                  </div>
                  <p className="text-xs text-zinc-200 font-semibold">
                    Phụ đề: {sc.subtitleText}
                  </p>
                  <p className="text-xs text-zinc-400">
                    Chuyển động: {sc.motionEffect}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 10: SCAFFOLDING WORKSHEET & REVIEW MINI-GAME */}
      {activeSubTab === 'worksheet_game' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Scaffolding Worksheet */}
          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Phiếu Học Tập Khuyết Thiếu (Scaffolding Worksheet)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Thiết kế chuẩn in ấn phát cho nhóm học sinh trong Hoạt động 2 & 3
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-700"
                  >
                    {showWorksheetAnswers ? 'Ẩn gợi ý đáp án' : 'Hiện gợi ý đáp án'}
                  </button>
                  <button
                    onClick={() => {
                      exportWorksheetToWord(worksheetGame);
                      onLog('Đã xuất file Word Phiếu học tập khuyết thiếu (.doc)', 'info');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất Word (.docx)</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono">
                {worksheetGame.studentGroupGuide}
              </div>

              <div className="space-y-4">
                {worksheetGame.tasks.map((task) => (
                  <div
                    key={task.taskNumber}
                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-400">{task.taskTitle}</span>
                      <span className="font-mono text-zinc-400">[{task.competencyTag}]</span>
                    </div>
                    <p className="text-xs text-zinc-400 italic">{task.instructions}</p>
                    <div className="space-y-1.5 pt-1 text-xs sm:text-sm text-zinc-200">
                      {task.promptsWithBlanks.map((line, i) => (
                        <p key={i} className="leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                    {showWorksheetAnswers && (
                      <div className="mt-2 pt-2 border-t border-zinc-800 text-xs text-emerald-400 space-y-1">
                        <p className="font-bold">Gợi ý đáp án giáo viên:</p>
                        {task.answerKey.map((ans, i) => (
                          <p key={i}>• {ans}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Interactive Classroom Mini-Game */}
          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>{worksheetGame.gameTitle}</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Mini-game tương tác ôn tập nhanh cuối giờ + Xuất dữ liệu JSON chuẩn
                  </p>
                </div>

                <button
                  onClick={handleExportGameJson}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Xuất Data Game (.json)</span>
                </button>
              </div>

              {/* Score Bar */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs font-mono">
                <span>
                  Câu hỏi: <b>{gameStep + 1} / {worksheetGame.gameQuestions.length}</b>
                </span>
                <span className="text-amber-400 font-bold text-sm">
                  ĐIỂM SỐ: {gameScore} PTS
                </span>
              </div>

              {!gameFinished && currentGameQ ? (
                <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                  <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                    {currentGameQ.question}
                  </p>

                  <div className="space-y-2.5">
                    {currentGameQ.options.map((opt, idx) => {
                      const isPicked = selectedGameOption === idx;
                      const isCorrect = idx === currentGameQ.correctIndex;
                      let btnStyle = 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700';

                      if (selectedGameOption !== null) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold';
                        } else if (isPicked) {
                          btnStyle = 'bg-rose-950/40 border-rose-500 text-rose-300';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectGameAnswer(idx)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>
                            <b>{String.fromCharCode(65 + idx)}.</b> {opt}
                          </span>
                          {selectedGameOption !== null && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedGameOption !== null && (
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs text-cyan-400">{currentGameQ.hint}</span>
                      <button
                        onClick={handleNextGameQuestion}
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                      >
                        Câu tiếp theo →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-4">
                  <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
                  <h4 className="text-lg font-bold text-white">
                    Hoàn thành Đấu Trường Tri Thức!
                  </h4>
                  <p className="text-2xl font-black text-emerald-400 font-mono">
                    Tổng điểm: {gameScore} PTS
                  </p>
                  <button
                    onClick={handleResetGame}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold inline-flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Chơi Lại Từ Đầu</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

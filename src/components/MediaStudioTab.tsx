import React, { useState, useRef, useEffect } from 'react';
import {
  Presentation,
  Film,
  Gamepad2,
  Download,
  Square,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Volume2,
  Trophy,
  RotateCcw,
  FileSpreadsheet,
  Plus,
  Upload,
  Edit3,
  Trash2,
} from 'lucide-react';
import {
  SlideItem,
  MicroVideoPackage,
  WorksheetAndGamePackage,
} from '../types/pedagogyTypes';
import {
  exportSlidesToPptx,
  exportWorksheetToWord,
  detectCompetencyTypeFromText,
} from '../utils/exportHelpers';
import { cleanPedagogyText } from '../data/pedagogyPresets';
import { soundSynth } from '../utils/audioSynth';

interface MediaStudioTabProps {
  lessonTitle: string;
  slides: SlideItem[];
  microVideo: MicroVideoPackage;
  worksheetGame: WorksheetAndGamePackage;
  onUpdateSlides?: (slides: SlideItem[]) => void;
  onUpdateMicroVideo?: (video: MicroVideoPackage) => void;
  onUpdateWorksheetGame?: (wg: WorksheetAndGamePackage) => void;
  isGenerating: boolean;
  onRegenerateModule: (task: 'slides' | 'microvideo' | 'worksheet') => void;
  onLog: (msg: string, level?: 'info' | 'engine' | 'warning') => void;
}

export const MediaStudioTab: React.FC<MediaStudioTabProps> = ({
  lessonTitle,
  slides,
  microVideo,
  worksheetGame,
  onUpdateSlides,
  onUpdateMicroVideo,
  onUpdateWorksheetGame,
  isGenerating,
  onRegenerateModule,
  onLog,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'slides' | 'video' | 'worksheet_game'>('slides');
  const [currentSlideIdx, setCurrentSlideIdx] = useState<number>(0);
  const [isExportingPptx, setIsExportingPptx] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  // Video Studio state
  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Worksheet & Mini-game state
  const [showWorksheetAnswers, setShowWorksheetAnswers] = useState<boolean>(false);
  const [gameStep, setGameStep] = useState<number>(0);
  const [gameScore, setGameScore] = useState<number>(0);
  const [selectedGameOption, setSelectedGameOption] = useState<number | null>(null);
  const [gameFinished, setGameFinished] = useState<boolean>(false);

  const currentSlide = slides[currentSlideIdx] || slides[0];
  const currentScene = microVideo.scenes[activeSceneIdx] || microVideo.scenes[0];

  const getCompetencyColorClass = (text: string) => {
    const cleaned = cleanPedagogyText(text);
    const kind = detectCompetencyTypeFromText(cleaned);
    if (kind === 'NLS') return 'text-[#60a5fa] font-semibold';
    if (kind === 'NLAI') return 'text-[#f87171] font-semibold';
    if (kind === 'THLM') return 'text-[#fbbf24] font-semibold';
    return 'text-zinc-100';
  };

  // Add / Upload / Delete handlers for Slides, Video, and Game
  const handleAddItem = () => {
    if (activeSubTab === 'slides' && onUpdateSlides) {
      const nextNum = slides.length + 1;
      const newSlide: SlideItem = {
        slideNumber: nextNum,
        title: `Slide ${nextNum}: Nội dung mở rộng - ${cleanPedagogyText(lessonTitle)}`,
        subtitle: 'Hoạt động vận dụng & thảo luận nhóm',
        bullets: [
          'Khai thác học liệu số và bảng dữ liệu trực quan để rút ra nhận xét.',
          'Liên hệ kiến thức liên môn Toán học, Công nghệ và bối cảnh thực tế.',
        ],
        interactiveQuestion: 'Câu hỏi thảo luận: Giải pháp tối ưu nhất trong tình huống này là gì?',
        speakerNotes: 'Giáo viên mời đại diện các nhóm trình bày kết quả và chốt kiến thức.',
      };
      onUpdateSlides([...slides, newSlide]);
      setCurrentSlideIdx(slides.length);
      setIsEditing(true);
      onLog(`Đã thêm Slide số ${nextNum}.`, 'info');
    } else if (activeSubTab === 'video' && onUpdateMicroVideo) {
      const nextNum = microVideo.scenes.length + 1;
      const newScene = {
        sceneNumber: nextNum,
        timeRange: '02:30 - 03:00',
        durationSec: 30,
        phase: 'Call to Action' as const,
        visualDirection: 'Sơ đồ tổng kết bài học và câu hỏi mở rộng.',
        motionEffect: 'Zoom-in mượt vào từ khóa trọng tâm',
        voiceoverScript: 'Các em hãy hoàn thành thử thách thực hành và chia sẻ kết quả cùng cả lớp.',
        subtitleText: 'Thử thách vận dụng thực tiễn sau bài học.',
        accentColor: '#10b981',
      };
      onUpdateMicroVideo({
        ...microVideo,
        totalDurationSec: microVideo.totalDurationSec + 30,
        scenes: [...microVideo.scenes, newScene],
      });
      setActiveSceneIdx(microVideo.scenes.length);
      setIsEditing(true);
      onLog(`Đã thêm Cảnh video số ${nextNum}.`, 'info');
    } else if (activeSubTab === 'worksheet_game' && onUpdateWorksheetGame) {
      const nextGameQ = {
        id: `game-q-${Date.now()}`,
        question: `Câu hỏi tương tác bổ sung: Ứng dụng thực tế quan trọng nhất của "${cleanPedagogyText(lessonTitle)}" là gì?`,
        options: [
          'Tối ưu hóa hiệu suất và giải quyết bài toán thực tiễn',
          'Chỉ dùng để ghi nhớ lý thuyết thuần túy',
          'Không liên quan đến dữ liệu thực nghiệm',
          'Bỏ qua các điều kiện biên kỹ thuật',
        ],
        correctIndex: 0,
        points: 100,
        hint: 'Gợi ý: Liên hệ hoạt động Vận dụng.',
      };
      onUpdateWorksheetGame({
        ...worksheetGame,
        gameQuestions: [...worksheetGame.gameQuestions, nextGameQ],
      });
      setIsEditing(true);
      onLog('Đã thêm câu hỏi mới vào Trò chơi học tập.', 'info');
    }
  };

  const handleDeleteCurrentItem = () => {
    if (activeSubTab === 'slides' && onUpdateSlides) {
      if (slides.length <= 1) {
        onLog('Cần giữ lại ít nhất 1 Slide.', 'warning');
        return;
      }
      const next = slides
        .filter((_, idx) => idx !== currentSlideIdx)
        .map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
      onUpdateSlides(next);
      setCurrentSlideIdx(Math.max(0, currentSlideIdx - 1));
      onLog('Đã xóa Slide hiện tại.', 'warning');
    } else if (activeSubTab === 'video' && onUpdateMicroVideo) {
      if (microVideo.scenes.length <= 1) return;
      const nextScenes = microVideo.scenes
        .filter((_, idx) => idx !== activeSceneIdx)
        .map((sc, idx) => ({ ...sc, sceneNumber: idx + 1 }));
      onUpdateMicroVideo({ ...microVideo, scenes: nextScenes });
      setActiveSceneIdx(Math.max(0, activeSceneIdx - 1));
      onLog('Đã xóa phân cảnh video.', 'warning');
    } else if (activeSubTab === 'worksheet_game' && onUpdateWorksheetGame) {
      if (worksheetGame.gameQuestions.length <= 1) return;
      const nextQs = worksheetGame.gameQuestions.filter((_, idx) => idx !== gameStep);
      onUpdateWorksheetGame({ ...worksheetGame, gameQuestions: nextQs });
      setGameStep(0);
      onLog('Đã xóa câu hỏi khỏi Trò chơi ôn tập.', 'warning');
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text
        .split('\n')
        .map((l) => cleanPedagogyText(l))
        .filter(Boolean);
      if (activeSubTab === 'slides' && onUpdateSlides && lines.length > 0) {
        const nextNum = slides.length + 1;
        onUpdateSlides([
          ...slides,
          {
            slideNumber: nextNum,
            title: lines[0] || `Slide ${nextNum}`,
            subtitle: lines[1] || cleanPedagogyText(lessonTitle),
            bullets: lines.slice(2, 6).length > 0 ? lines.slice(2, 6) : lines,
            interactiveQuestion: 'Câu hỏi thảo luận từ tài liệu tải lên.',
            speakerNotes: lines.join(' '),
          },
        ]);
        setCurrentSlideIdx(slides.length);
        setIsEditing(true);
        onLog(`Đã tải lên tệp "${file.name}" vào Slide Studio!`, 'info');
      } else if (activeSubTab === 'worksheet_game' && onUpdateWorksheetGame) {
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            onUpdateWorksheetGame({ ...worksheetGame, gameQuestions: parsed });
            onLog(`Đã nạp gói câu hỏi Game từ "${file.name}"!`, 'info');
          }
        } catch {
          if (lines.length > 0) {
            onUpdateWorksheetGame({
              ...worksheetGame,
              tasks: [
                ...worksheetGame.tasks,
                {
                  taskNumber: worksheetGame.tasks.length + 1,
                  taskTitle: `Nhiệm vụ ${worksheetGame.tasks.length + 1}: ${lines[0]}`,
                  instructions: 'Hoàn thành nội dung phiếu học tập:',
                  promptsWithBlanks: lines.slice(1),
                  answerKey: ['Đáp án từ tệp tải lên.'],
                  competencyTag: 'NLS',
                },
              ],
            });
            setIsEditing(true);
            onLog(`Đã tải lên tệp "${file.name}" vào Phiếu học tập!`, 'info');
          }
        }
      }
    } catch {
      onLog('Không thể đọc tệp tải lên.', 'warning');
    }
    e.target.value = '';
  };

  const handleExportPptx = async () => {
    setIsExportingPptx(true);
    try {
      await exportSlidesToPptx(slides, cleanPedagogyText(lessonTitle));
      onLog('Đã tải về file PowerPoint (.pptx) chuẩn Times New Roman 12pt!', 'info');
    } catch (err) {
      onLog(`Lỗi xuất PPTX: ${err instanceof Error ? err.message : String(err)}`, 'warning');
    } finally {
      setIsExportingPptx(false);
    }
  };

  // Render 60 FPS Canvas frame for current scene
  useEffect(() => {
    if (activeSubTab !== 'video') return;
    const canvas = canvasRef.current;
    if (!canvas || !currentScene) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const startTick = performance.now();

    const renderFrame = (now: number) => {
      const elapsed = (now - startTick) / 1000;
      const w = canvas.width;
      const h = canvas.height;

      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#09090b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = currentScene.accentColor || '#06b6d4';
      ctx.fillRect(0, 0, w, 8);

      const pulseRadius = 36 + Math.sin(elapsed * 3) * 6;
      ctx.beginPath();
      ctx.arc(w - 65, 55, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = `${currentScene.accentColor}22`;
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px "Times New Roman", serif';
      ctx.fillText(
        `CẢNH ${currentScene.sceneNumber}/${microVideo.scenes.length}  ·  ${currentScene.timeRange}`,
        32,
        46
      );

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px "Times New Roman", serif';
      ctx.fillText(cleanPedagogyText(lessonTitle).slice(0, 56), 32, 84);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(32, 108, w - 64, 58);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px "Times New Roman", serif';
      ctx.fillText(`Hiệu ứng: ${cleanPedagogyText(currentScene.motionEffect)}`, 46, 132);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`Bối cảnh: ${cleanPedagogyText(currentScene.visualDirection).slice(0, 72)}`, 46, 154);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = currentScene.accentColor || '#06b6d4';
      ctx.lineWidth = 2;
      ctx.fillRect(32, h - 125, w - 64, 88);
      ctx.strokeRect(32, h - 125, w - 64, 88);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 16px "Times New Roman", serif';
      const sub = cleanPedagogyText(currentScene.subtitleText);
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
    onLog(`Đang phát Cảnh ${currentScene.sceneNumber} kèm giọng đọc...`, 'info');

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(cleanPedagogyText(currentScene.voiceoverScript));
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

  const handleRecordAndDownloadVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRecordingVideo) return;

    try {
      setIsRecordingVideo(true);
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
        a.download = `Video_Bai_Giang_Canh_${currentScene.sceneNumber}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecordingVideo(false);
        onLog('Đã tải về file Video bài giảng (.webm)!', 'info');
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 3500);
    } catch {
      setIsRecordingVideo(false);
      onLog('Trình duyệt hiện tại không hỗ trợ ghi video trực tiếp.', 'warning');
    }
  };

  // Mini-game handler
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
    a.download = 'Goi_Cau_Hoi_Game_Hoc_Tap.json';
    a.click();
    URL.revokeObjectURL(url);
    onLog('Đã tải về gói câu hỏi Game (.json).', 'info');
  };

  return (
    <div className="space-y-6">
      {/* 3D Sub-navigation & Full CRUD Toolbar */}
      <div className="p-4 rounded-2xl bg-zinc-900 border-2 border-purple-400 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('slides')}
            className={`btn-3d px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 ${
              activeSubTab === 'slides' ? 'btn-3d-cyan' : 'bg-slate-800 text-slate-200'
            }`}
          >
            <Presentation className="w-4 h-4" />
            <span>Bài Giảng PowerPoint (.PPTX)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('video')}
            className={`btn-3d px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 ${
              activeSubTab === 'video' ? 'btn-3d-purple' : 'bg-slate-800 text-slate-200'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Video Bài Giảng</span>
          </button>

          <button
            onClick={() => setActiveSubTab('worksheet_game')}
            className={`btn-3d px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 ${
              activeSubTab === 'worksheet_game' ? 'btn-3d-emerald' : 'bg-slate-800 text-slate-200'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Phiếu Học Tập & Game Học Tập</span>
          </button>
        </div>

        {/* Universal 3D CRUD Buttons: Thêm, Tải lên, Chỉnh sửa, Xóa */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={uploadInputRef}
            type="file"
            accept=".txt,.json,.doc,.docx,.md"
            onChange={handleUploadFile}
            className="hidden"
          />

          <button
            onClick={handleAddItem}
            className="btn-3d btn-3d-emerald px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Mới</span>
          </button>

          <button
            onClick={() => uploadInputRef.current?.click()}
            className="btn-3d btn-3d-purple px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Tải Lên</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`btn-3d px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
              isEditing ? 'btn-3d-amber' : 'btn-3d-indigo'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Hoàn Tất Sửa' : 'Chỉnh Sửa'}</span>
          </button>

          <button
            onClick={handleDeleteCurrentItem}
            className="btn-3d btn-3d-rose px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa</span>
          </button>
        </div>
      </div>

      {/* SLIDE STUDIO (PPTX) */}
      {activeSubTab === 'slides' && currentSlide && (
        <div className="space-y-6 doc-times-12pt">
          <div className="p-5 rounded-2xl bg-zinc-900 border-2 border-cyan-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white uppercase">
                TRÌNH CHIẾU BÀI GIẢNG POWERPOINT (.PPTX)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 font-sans">
              <button
                onClick={() => onRegenerateModule('slides')}
                disabled={isGenerating}
                className="btn-3d btn-3d-indigo px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tạo Lại Bộ Slide</span>
              </button>

              <button
                onClick={handleExportPptx}
                disabled={isExportingPptx}
                className="btn-3d btn-3d-cyan px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExportingPptx ? 'Đang tải về .pptx...' : 'Tải Về PowerPoint (.PPTX)'}
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
                      ? 'bg-zinc-800 border-cyan-400 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-cyan-300 mb-1">Slide {s.slideNumber}</div>
                  <p className="truncate font-semibold">{cleanPedagogyText(s.title)}</p>
                </button>
              ))}
            </div>

            {/* 16:9 Slide Canvas Preview */}
            <div className="lg:col-span-3 space-y-4">
              <div className="rounded-2xl bg-slate-950 border-2 border-cyan-400 overflow-hidden shadow-2xl">
                <div className="p-6 sm:p-8 min-h-[340px] flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-cyan-400 font-bold">
                      <span>
                        SLIDE {currentSlide.slideNumber} / {slides.length}
                      </span>
                    </div>

                    {isEditing && onUpdateSlides ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={cleanPedagogyText(currentSlide.title)}
                          onChange={(e) => {
                            const next = [...slides];
                            next[currentSlideIdx] = { ...currentSlide, title: e.target.value };
                            onUpdateSlides(next);
                          }}
                          className="w-full p-2.5 rounded-lg bg-slate-900 border border-cyan-500 text-white font-bold"
                        />
                        <input
                          type="text"
                          value={cleanPedagogyText(currentSlide.subtitle)}
                          onChange={(e) => {
                            const next = [...slides];
                            next[currentSlideIdx] = { ...currentSlide, subtitle: e.target.value };
                            onUpdateSlides(next);
                          }}
                          className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-zinc-300"
                        />
                        <textarea
                          value={currentSlide.bullets.map((b) => cleanPedagogyText(b)).join('\n')}
                          onChange={(e) => {
                            const next = [...slides];
                            next[currentSlideIdx] = {
                              ...currentSlide,
                              bullets: e.target.value.split('\n'),
                            };
                            onUpdateSlides(next);
                          }}
                          rows={5}
                          className="w-full p-2.5 rounded-lg bg-slate-900 border border-cyan-500 text-white"
                        />
                      </div>
                    ) : (
                      <>
                        <h4 className="font-bold text-white uppercase">
                          {cleanPedagogyText(currentSlide.title)}
                        </h4>
                        <p className="text-zinc-300 italic">
                          {cleanPedagogyText(currentSlide.subtitle)}
                        </p>

                        <div className="pt-3 space-y-2.5">
                          {currentSlide.bullets.map((b, bIdx) => (
                            <div
                              key={bIdx}
                              className={`flex items-start gap-2.5 ${getCompetencyColorClass(b)}`}
                            >
                              <span className="text-cyan-400 font-bold">•</span>
                              <span>{cleanPedagogyText(b)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {currentSlide.interactiveQuestion && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 font-semibold">
                      Câu hỏi tương tác: {cleanPedagogyText(currentSlide.interactiveQuestion)}
                    </div>
                  )}
                </div>

                {/* Slide Footer Navigation */}
                <div className="px-6 py-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between font-sans text-xs">
                  <button
                    onClick={() => setCurrentSlideIdx((p) => Math.max(0, p - 1))}
                    disabled={currentSlideIdx === 0}
                    className="btn-3d btn-3d-indigo px-3.5 py-1.5 rounded-xl font-bold disabled:opacity-40 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Slide trước</span>
                  </button>

                  <span className="font-bold text-zinc-300">
                    Slide {currentSlideIdx + 1} / {slides.length}
                  </span>

                  <button
                    onClick={() => setCurrentSlideIdx((p) => Math.min(slides.length - 1, p + 1))}
                    disabled={currentSlideIdx === slides.length - 1}
                    className="btn-3d btn-3d-indigo px-3.5 py-1.5 rounded-xl font-bold disabled:opacity-40 flex items-center gap-1"
                  >
                    <span>Slide tiếp</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Speaker Notes Box */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <p className="font-bold text-amber-300">
                  Ghi chú thuyết trình của Giáo viên:
                </p>
                {isEditing && onUpdateSlides ? (
                  <textarea
                    value={cleanPedagogyText(currentSlide.speakerNotes)}
                    onChange={(e) => {
                      const next = [...slides];
                      next[currentSlideIdx] = { ...currentSlide, speakerNotes: e.target.value };
                      onUpdateSlides(next);
                    }}
                    rows={2}
                    className="w-full p-2 rounded bg-slate-950 border border-amber-500 text-white"
                  />
                ) : (
                  <p className="text-zinc-200">
                    {cleanPedagogyText(currentSlide.speakerNotes)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MICRO-VIDEO STUDIO */}
      {activeSubTab === 'video' && currentScene && (
        <div className="space-y-6 doc-times-12pt">
          <div className="p-5 rounded-2xl bg-zinc-900 border-2 border-purple-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white uppercase">
                XƯỞNG VIDEO BÀI GIẢNG TRỰC QUAN
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 font-sans">
              <button
                onClick={handlePlayMicroVideoWithVoice}
                className="btn-3d btn-3d-emerald px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
              >
                {isPlayingVideo ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-4 h-4" />}
                <span>{isPlayingVideo ? 'Dừng Phát' : 'Phát Cảnh & Giọng Đọc'}</span>
              </button>

              <button
                onClick={handleRecordAndDownloadVideo}
                disabled={isRecordingVideo}
                className="btn-3d btn-3d-cyan px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isRecordingVideo ? 'Đang Ghi Video...' : 'Tải Về Video (.WEBM)'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-3">
              <div className="rounded-2xl overflow-hidden border-2 border-purple-400 bg-zinc-950 shadow-xl">
                <canvas
                  ref={canvasRef}
                  width={760}
                  height={420}
                  className="w-full h-auto block"
                />
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
                <p className="font-bold text-cyan-400">
                  Lời bình thuyết minh (Cảnh {currentScene.sceneNumber}):
                </p>
                {isEditing && onUpdateMicroVideo ? (
                  <textarea
                    value={cleanPedagogyText(currentScene.voiceoverScript)}
                    onChange={(e) => {
                      const nextScenes = [...microVideo.scenes];
                      nextScenes[activeSceneIdx] = {
                        ...currentScene,
                        voiceoverScript: e.target.value,
                      };
                      onUpdateMicroVideo({ ...microVideo, scenes: nextScenes });
                    }}
                    rows={2}
                    className="w-full p-2 rounded bg-slate-950 border border-cyan-500 text-white"
                  />
                ) : (
                  <p className="text-zinc-200">
                    "{cleanPedagogyText(currentScene.voiceoverScript)}"
                  </p>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-3">
              <h4 className="font-bold text-white uppercase">
                Danh Sách Phân Cảnh Video
              </h4>
              {microVideo.scenes.map((sc, idx) => (
                <div
                  key={sc.sceneNumber}
                  onClick={() => setActiveSceneIdx(idx)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                    activeSceneIdx === idx
                      ? 'bg-zinc-800/90 border-cyan-400'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400">
                      Cảnh {sc.sceneNumber}: {sc.timeRange}
                    </span>
                    <span className="text-zinc-400">{sc.phase}</span>
                  </div>
                  <p className="text-zinc-200 font-semibold">
                    {cleanPedagogyText(sc.subtitleText)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WORKSHEET & MINI-GAME (STRICT 12PT TIMES NEW ROMAN) */}
      {activeSubTab === 'worksheet_game' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 doc-times-12pt">
          {/* Left: Scaffolding Worksheet */}
          <div className="p-6 rounded-2xl bg-zinc-900 border-2 border-emerald-400 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-white uppercase">
                  PHIẾU HỌC TẬP
                </h3>

                <div className="flex items-center gap-2 font-sans">
                  <button
                    onClick={() => setShowWorksheetAnswers(!showWorksheetAnswers)}
                    className="btn-3d btn-3d-indigo px-3 py-1.5 rounded-xl text-xs font-extrabold"
                  >
                    {showWorksheetAnswers ? 'Ẩn Đáp Án' : 'Hiện Đáp Án'}
                  </button>
                  <button
                    onClick={() => {
                      exportWorksheetToWord(worksheetGame);
                      onLog('Đã tải về Phiếu học tập Word (.doc) Times New Roman 12pt.', 'info');
                    }}
                    className="btn-3d btn-3d-cyan px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải Về Word (.DOC 12pt)</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200">
                {cleanPedagogyText(worksheetGame.studentGroupGuide)}
              </div>

              <div className="space-y-4">
                {worksheetGame.tasks.map((task, tIdx) => (
                  <div
                    key={task.taskNumber}
                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2"
                  >
                    <div className="font-bold text-cyan-400">
                      {cleanPedagogyText(task.taskTitle)}
                    </div>
                    <p className="text-zinc-300 italic">
                      {cleanPedagogyText(task.instructions)}
                    </p>
                    {isEditing && onUpdateWorksheetGame ? (
                      <textarea
                        value={task.promptsWithBlanks.map((l) => cleanPedagogyText(l)).join('\n')}
                        onChange={(e) => {
                          const nextTasks = [...worksheetGame.tasks];
                          nextTasks[tIdx] = {
                            ...task,
                            promptsWithBlanks: e.target.value.split('\n'),
                          };
                          onUpdateWorksheetGame({ ...worksheetGame, tasks: nextTasks });
                        }}
                        rows={4}
                        className="w-full p-2 rounded bg-slate-900 border border-emerald-500 text-white"
                      />
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        {task.promptsWithBlanks.map((line, i) => (
                          <p key={i} className={getCompetencyColorClass(line)}>
                            {cleanPedagogyText(line)}
                          </p>
                        ))}
                      </div>
                    )}
                    {showWorksheetAnswers && (
                      <div className="mt-2 pt-2 border-t border-zinc-800 text-emerald-400 space-y-1">
                        <p className="font-bold">Đáp án chuẩn:</p>
                        {task.answerKey.map((ans, i) => (
                          <p key={i}>• {cleanPedagogyText(ans)}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Interactive Classroom Mini-Game */}
          <div className="p-6 rounded-2xl bg-zinc-900 border-2 border-amber-400 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-bold text-white flex items-center gap-2 uppercase">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>{cleanPedagogyText(worksheetGame.gameTitle)}</span>
                </h3>

                <button
                  onClick={handleExportGameJson}
                  className="btn-3d btn-3d-emerald px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 font-sans"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Tải Về Game (.JSON)</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <span>
                  Câu hỏi: <b>{gameStep + 1} / {worksheetGame.gameQuestions.length}</b>
                </span>
                <span className="text-amber-400 font-bold">
                  ĐIỂM SỐ: {gameScore}
                </span>
              </div>

              {!gameFinished && currentGameQ ? (
                <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                  {isEditing && onUpdateWorksheetGame ? (
                    <textarea
                      value={cleanPedagogyText(currentGameQ.question)}
                      onChange={(e) => {
                        const nextQs = [...worksheetGame.gameQuestions];
                        nextQs[gameStep] = { ...currentGameQ, question: e.target.value };
                        onUpdateWorksheetGame({ ...worksheetGame, gameQuestions: nextQs });
                      }}
                      rows={2}
                      className="w-full p-2 rounded bg-slate-900 border border-amber-500 text-white"
                    />
                  ) : (
                    <p className={`font-bold ${getCompetencyColorClass(currentGameQ.question)}`}>
                      {cleanPedagogyText(currentGameQ.question)}
                    </p>
                  )}

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
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>
                            <b>{String.fromCharCode(65 + idx)}.</b> {cleanPedagogyText(opt)}
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
                      <span className="text-cyan-400">{cleanPedagogyText(currentGameQ.hint)}</span>
                      <button
                        onClick={handleNextGameQuestion}
                        className="btn-3d btn-3d-cyan px-4 py-2 rounded-xl text-xs font-extrabold font-sans"
                      >
                        Câu tiếp theo →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-zinc-950 border border-zinc-800 text-center space-y-4">
                  <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
                  <h4 className="font-bold text-white">
                    Hoàn thành Trò Chơi Học Tập!
                  </h4>
                  <p className="font-bold text-emerald-400">
                    Tổng điểm: {gameScore}
                  </p>
                  <button
                    onClick={handleResetGame}
                    className="btn-3d btn-3d-cyan px-5 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 font-sans"
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

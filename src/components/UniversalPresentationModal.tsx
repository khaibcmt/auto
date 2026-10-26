import React, { useState, useEffect, useMemo } from 'react';
import {
  Presentation,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  Clock,
  Play,
  Pause,
  Sparkles,
  BookOpenCheck,
  FileCheck2,
  Gamepad2,
  Users,
  Download,
  Crosshair,
  Layers,
} from 'lucide-react';
import {
  LessonPlan5512,
  DifferentiatedExamPackage,
  SlideItem,
  MicroVideoPackage,
  WorksheetAndGamePackage,
} from '../types/pedagogyTypes';
import { cleanPedagogyText } from '../data/pedagogyPresets';
import { detectCompetencyTypeFromText } from '../utils/exportHelpers';

export type PresentationSourceType =
  | 'lesson5512'
  | 'slides'
  | 'examsuite'
  | 'worksheet_game'
  | 'video'
  | 'simulator'
  | 'humanizer'
  | 'custom';

export interface PresentationSlideDeckItem {
  id: string;
  badge: string;
  title: string;
  subtitle?: string;
  lines: string[];
  twoColumnRow?: {
    leftTitle: string;
    leftLines: string[];
    rightTitle: string;
    rightLines: string[];
  };
  interactivePrompt?: string;
  answerRevealText?: string;
  teacherNote?: string;
}

interface UniversalPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSourceType?: PresentationSourceType;
  customTitle?: string;
  customText?: string;
  onUpdateCustomText?: (newText: string) => void;
  lessonPlan?: LessonPlan5512;
  slides?: SlideItem[];
  examPackage?: DifferentiatedExamPackage;
  microVideo?: MicroVideoPackage;
  worksheetGame?: WorksheetAndGamePackage;
  simulatorText?: string;
  onLog?: (msg: string, level?: 'info' | 'engine' | 'warning') => void;
}

export const UniversalPresentationModal: React.FC<UniversalPresentationModalProps> = ({
  isOpen,
  onClose,
  initialSourceType = 'lesson5512',
  customTitle,
  customText,
  onUpdateCustomText,
  lessonPlan,
  slides,
  examPackage,
  microVideo,
  worksheetGame,
  simulatorText,
  onLog,
}) => {
  const [sourceType, setSourceType] = useState<PresentationSourceType>(initialSourceType);
  const [viewMode, setViewMode] = useState<'deck' | 'document'>('deck');
  const [fontSizePt, setFontSizePt] = useState<number>(24);
  const [theme, setTheme] = useState<'cyber-stage' | 'chalkboard' | 'paper-12pt'>('cyber-stage');
  const [currentCardIdx, setCurrentCardIdx] = useState<number>(0);
  const [revealAnswer, setRevealAnswer] = useState<boolean>(false);
  const [showTeacherNotes, setShowTeacherNotes] = useState<boolean>(false);
  const [laserLineIdx, setLaserLineIdx] = useState<number | null>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Classroom Teaching Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(180); // 3 minutes default
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Sync initial source type when modal opens
  useEffect(() => {
    if (isOpen) {
      setSourceType(initialSourceType);
      setCurrentCardIdx(0);
      setRevealAnswer(false);
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {
            // Ignore iframe permission restriction; fixed inset-0 z-[160] handles full viewport
          });
        }
      } catch {
        // Ignore
      }
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {
        // Ignore
      }
    }
  }, [isOpen, initialSourceType]);

  // Classroom timer countdown
  useEffect(() => {
    if (!isOpen || !isTimerRunning) return;
    const t = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isOpen, isTimerRunning]);

  // Build interactive deck items from whichever source is active
  const generatedDeck = useMemo<PresentationSlideDeckItem[]>(() => {
    if (sourceType === 'slides' && slides && slides.length > 0) {
      return slides.map((s, idx) => ({
        id: `slide-${idx}`,
        badge: `SLIDE PPT 16:9 · ${idx + 1}/${slides.length}`,
        title: cleanPedagogyText(s.title),
        subtitle: cleanPedagogyText(s.subtitle),
        lines: s.bullets.map((b) => cleanPedagogyText(b)),
        interactivePrompt: s.interactiveQuestion
          ? cleanPedagogyText(s.interactiveQuestion)
          : undefined,
        teacherNote: s.speakerNotes ? cleanPedagogyText(s.speakerNotes) : undefined,
      }));
    }

    if (sourceType === 'lesson5512' && lessonPlan) {
      const items: PresentationSlideDeckItem[] = [
        {
          id: 'lp-objectives',
          badge: `GIÁO ÁN 5512 · MỤC TIÊU BÀI HỌC`,
          title: cleanPedagogyText(lessonPlan.lessonTitle),
          subtitle: `Môn: ${cleanPedagogyText(lessonPlan.subject)} · Khối: ${cleanPedagogyText(lessonPlan.grade)}`,
          lines: [
            ...lessonPlan.knowledgeObjectives.map((k) => cleanPedagogyText(k)),
            cleanPedagogyText(lessonPlan.digitalCompetencyNLS),
            cleanPedagogyText(lessonPlan.aiCompetencyNLAI),
            cleanPedagogyText(lessonPlan.interdisciplinaryTHLM),
          ],
          interactivePrompt:
            'Học sinh quan sát mục tiêu bài học và xác định 3 trụ cột năng lực trọng tâm.',
        },
        ...lessonPlan.activities.map((act, idx) => {
          const firstRow = act.twoColumnRows[0];
          return {
            id: `lp-act-${act.id}`,
            badge: `GIÁO ÁN 5512 · HOẠT ĐỘNG ${idx + 1}/${lessonPlan.activities.length}`,
            title: cleanPedagogyText(act.title),
            subtitle: cleanPedagogyText(act.content),
            lines: [
              ...act.objectives.map((o) => `Mục tiêu: ${cleanPedagogyText(o)}`),
              ...act.products.map((p) => `Sản phẩm: ${cleanPedagogyText(p)}`),
            ],
            twoColumnRow: firstRow
              ? {
                  leftTitle: 'HOẠT ĐỘNG CỦA GIÁO VIÊN VÀ HỌC SINH',
                  leftLines: act.twoColumnRows.flatMap((r) =>
                    r.teacherStudentAction.map((l) => cleanPedagogyText(l))
                  ),
                  rightTitle: 'DỰ KIẾN SẢN PHẨM',
                  rightLines: act.twoColumnRows.flatMap((r) =>
                    r.expectedProduct.map((l) => cleanPedagogyText(l))
                  ),
                }
              : undefined,
          };
        }),
      ];
      return items;
    }

    if (sourceType === 'examsuite' && examPackage) {
      const part1Cards: PresentationSlideDeckItem[] = examPackage.part1.map((q) => {
        const correctOpt = q.options.find((o) => o.isCorrect);
        return {
          id: `ex-p1-${q.id}`,
          badge: `ĐỀ THI 2025 · PHẦN I (4 LỰA CHỌN) · CÂU ${q.number}`,
          title: `Câu ${q.number} (${q.bloomLevel}): ${cleanPedagogyText(q.stem)}`,
          lines: q.options.map(
            (o) => `${o.letter}. ${cleanPedagogyText(o.text)}`
          ),
          answerRevealText: `ĐÁP ÁN ĐÚNG: Phương án ${correctOpt?.letter || 'A'} — ${cleanPedagogyText(
            correctOpt?.text || ''
          )}\nGiải thích: ${cleanPedagogyText(q.explanation || 'Đối chiếu trực tiếp từ kiến thức trọng tâm.')}`,
        };
      });

      const part2Cards: PresentationSlideDeckItem[] = examPackage.part2.map((q) => ({
        id: `ex-p2-${q.id}`,
        badge: `ĐỀ THI 2025 · PHẦN II (ĐÚNG / SAI) · CÂU ${q.number}`,
        title: `Câu ${q.number}: ${cleanPedagogyText(q.contextStem)}`,
        lines: q.statements.map(
          (st) => `${st.letter}) ${cleanPedagogyText(st.text)}`
        ),
        answerRevealText: `ĐÁP ÁN ĐÚNG/SAI CHUẨN:\n${q.statements
          .map((st) => `• Ý ${st.letter}): ${st.isTrue ? 'ĐÚNG (Gạch chân)' : 'SAI'}`)
          .join('   |   ')}`,
      }));

      const part3Cards: PresentationSlideDeckItem[] = examPackage.part3.map((q) => ({
        id: `ex-p3-${q.id}`,
        badge: `ĐỀ THI 2025 · PHẦN III (TRẢ LỜI NGẮN) · CÂU ${q.number}`,
        title: `Câu ${q.number} (${q.bloomLevel}): ${cleanPedagogyText(q.stem)}`,
        lines: [
          'Học sinh tính toán và điền kết quả ngắn gọn vào phiếu trả lời.',
        ],
        answerRevealText: `ĐÁP SỐ CHUẨN: ${q.correctAnswer}`,
      }));

      return [...part1Cards, ...part2Cards, ...part3Cards];
    }

    if (sourceType === 'worksheet_game' && worksheetGame) {
      const taskCards: PresentationSlideDeckItem[] = worksheetGame.tasks.map((t) => ({
        id: `wg-task-${t.taskNumber}`,
        badge: `PHIẾU HỌC TẬP · NHIỆM VỤ ${t.taskNumber}`,
        title: cleanPedagogyText(t.taskTitle),
        subtitle: cleanPedagogyText(t.instructions),
        lines: t.promptsWithBlanks.map((p) => cleanPedagogyText(p)),
        answerRevealText: `ĐÁP ÁN PHIẾU HỌC TẬP:\n${t.answerKey
          .map((a) => `• ${cleanPedagogyText(a)}`)
          .join('\n')}`,
      }));

      const gameCards: PresentationSlideDeckItem[] = worksheetGame.gameQuestions.map(
        (gq, idx) => ({
          id: `wg-game-${gq.id}`,
          badge: `GAME HỌC TẬP TƯƠNG TÁC · CÂU ${idx + 1}/${worksheetGame.gameQuestions.length} (${gq.points} ĐIỂM)`,
          title: cleanPedagogyText(gq.question),
          lines: gq.options.map(
            (opt, oIdx) => `${String.fromCharCode(65 + oIdx)}. ${cleanPedagogyText(opt)}`
          ),
          interactivePrompt: cleanPedagogyText(gq.hint),
          answerRevealText: `ĐÁP ÁN CHÍNH XÁC: ${String.fromCharCode(
            65 + gq.correctIndex
          )}. ${cleanPedagogyText(gq.options[gq.correctIndex] || '')} (+${gq.points} điểm!)`,
        })
      );

      return [...taskCards, ...gameCards];
    }

    if (sourceType === 'video' && microVideo) {
      return microVideo.scenes.map((sc) => ({
        id: `vid-sc-${sc.sceneNumber}`,
        badge: `VIDEO BÀI GIẢNG · CẢNH ${sc.sceneNumber} (${sc.timeRange})`,
        title: `Cảnh ${sc.sceneNumber}: ${sc.phase}`,
        subtitle: `Bối cảnh trực quan: ${cleanPedagogyText(sc.visualDirection)}`,
        lines: [
          `Phụ đề trình chiếu: ${cleanPedagogyText(sc.subtitleText)}`,
          `Lời giảng thuyết minh: "${cleanPedagogyText(sc.voiceoverScript)}"`,
          `Hiệu ứng chuyển động: ${cleanPedagogyText(sc.motionEffect)}`,
        ],
      }));
    }

    // Default / Custom / Simulator / Humanizer text split into presentation blocks
    const rawSource =
      sourceType === 'simulator'
        ? simulatorText || customText || ''
        : customText || simulatorText || '';
    const cleanedLines = rawSource
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (cleanedLines.length === 0) {
      return [
        {
          id: 'empty-card',
          badge: 'TRÌNH CHIẾU GIẢNG DẠY',
          title: customTitle || 'Nội dung trình chiếu bài giảng',
          lines: ['Nhấn nút Thêm hoặc Chỉnh Sửa để bổ sung nội dung trình chiếu.'],
        },
      ];
    }

    // Group every 5 lines into a presentation card
    const chunks: PresentationSlideDeckItem[] = [];
    for (let i = 0; i < cleanedLines.length; i += 5) {
      const slice = cleanedLines.slice(i, i + 5);
      chunks.push({
        id: `custom-chunk-${i}`,
        badge: `${(customTitle || 'BÀI GIẢNG TRÌNH CHIẾU').toUpperCase()} · TRANG ${
          Math.floor(i / 5) + 1
        }`,
        title: slice[0] || customTitle || 'Nội dung bài học',
        lines: slice.slice(1).length > 0 ? slice.slice(1) : [slice[0]],
      });
    }
    return chunks;
  }, [
    sourceType,
    slides,
    lessonPlan,
    examPackage,
    worksheetGame,
    microVideo,
    simulatorText,
    customText,
    customTitle,
  ]);

  const [editableDeck, setEditableDeck] = useState<PresentationSlideDeckItem[]>(generatedDeck);
  const [savedDeckSnapshot, setSavedDeckSnapshot] = useState<PresentationSlideDeckItem[]>(generatedDeck);

  useEffect(() => {
    setEditableDeck(generatedDeck);
    setSavedDeckSnapshot(generatedDeck);
    setCurrentCardIdx(0);
    setRevealAnswer(false);
  }, [generatedDeck]);

  // Keyboard shortcuts in Fullscreen Presentation Mode
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (!isEditing && (e.key === 'ArrowRight' || e.key === 'PageDown')) {
        e.preventDefault();
        setCurrentCardIdx((prev) => Math.min(editableDeck.length - 1, prev + 1));
        setRevealAnswer(false);
      } else if (!isEditing && (e.key === 'ArrowLeft' || e.key === 'PageUp')) {
        e.preventDefault();
        setCurrentCardIdx((prev) => Math.max(0, prev - 1));
        setRevealAnswer(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditing, editableDeck.length, onClose]);

  if (!isOpen) return null;

  const currentCard = editableDeck[currentCardIdx] || editableDeck[0];

  const allDocumentLines = editableDeck.flatMap((c) => [
    `=== ${c.badge}: ${c.title} ===`,
    ...(c.subtitle ? [c.subtitle] : []),
    ...c.lines,
    ...(c.twoColumnRow
      ? [
          `[${c.twoColumnRow.leftTitle}]:`,
          ...c.twoColumnRow.leftLines,
          `[${c.twoColumnRow.rightTitle}]:`,
          ...c.twoColumnRow.rightLines,
        ]
      : []),
    ...(c.answerRevealText && revealAnswer ? [c.answerRevealText] : []),
  ]);

  const renderCompetencyLine = (text: string) => {
    const cleaned = cleanPedagogyText(text);
    const comp = detectCompetencyTypeFromText(cleaned);
    if (comp === 'NLS') {
      return (
        <span
          className={
            theme === 'paper-12pt'
              ? 'text-blue-700 font-bold'
              : 'text-sky-300 font-bold'
          }
        >
          {cleaned}
        </span>
      );
    }
    if (comp === 'NLAI') {
      return (
        <span
          className={
            theme === 'paper-12pt'
              ? 'text-red-700 font-bold'
              : 'text-rose-300 font-bold'
          }
        >
          {cleaned}
        </span>
      );
    }
    if (comp === 'THLM') {
      return (
        <span
          className={
            theme === 'paper-12pt'
              ? 'text-amber-700 font-bold'
              : 'text-amber-300 font-bold'
          }
        >
          {cleaned}
        </span>
      );
    }
    return <span>{cleaned}</span>;
  };

  // 4 Standard CRUD Handlers inside Fullscreen Stage
  const handleAddSlideCard = () => {
    setSavedDeckSnapshot(editableDeck);
    const newCard: PresentationSlideDeckItem = {
      id: `added-card-${Date.now()}`,
      badge: `TRANG TRÌNH CHIẾU BỔ SUNG · ${editableDeck.length + 1}`,
      title: 'Nội dung giảng dạy bổ sung trực tiếp trên lớp',
      subtitle: 'Giáo viên nhấn mạnh kiến thức trọng tâm và câu hỏi thảo luận',
      lines: [
        '- Năng lực số: Học sinh quan sát trực quan trên màn hình trình chiếu và đối chiếu dữ liệu.',
        '- Năng lực trí tuệ nhân tạo: Học sinh phản biện nhanh tình huống thực tiễn cùng giáo viên.',
      ],
      interactivePrompt: 'Câu hỏi thảo luận lớp học: Em hãy nêu ví dụ thực tế cho nội dung trên?',
    };
    const next = [...editableDeck, newCard];
    setEditableDeck(next);
    setCurrentCardIdx(next.length - 1);
    setIsEditing(true);
    onLog?.('Đã thêm trang trình chiếu mới trong Chế độ Full Màn Hình Giảng Dạy.', 'info');
  };

  const handleDeleteSlideCard = () => {
    if (editableDeck.length <= 1) return;
    setSavedDeckSnapshot(editableDeck);
    const next = editableDeck.filter((_, idx) => idx !== currentCardIdx);
    setEditableDeck(next);
    setCurrentCardIdx(Math.max(0, currentCardIdx - 1));
    onLog?.('Đã xóa trang trình chiếu hiện tại (Bấm Khôi Phục Lại để hoàn tác).', 'warning');
  };

  const handleRestoreSlideDeck = () => {
    setEditableDeck(savedDeckSnapshot.length > 0 ? savedDeckSnapshot : generatedDeck);
    setCurrentCardIdx(0);
    setIsEditing(false);
    onLog?.('Đã khôi phục lại toàn bộ nội dung trình chiếu về trạng thái chuẩn.', 'info');
  };

  const handleDownloadPresentationDoc = () => {
    const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="vi">
<head>
<meta charset="utf-8">
<title>Tai_Lieu_Trinh_Chieu_Giang_Day_12pt</title>
<style>
  body, p, div, li { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; text-align: justify; }
  h1, h2, h3 { font-family: "Times New Roman", Times, serif; font-size: 12pt; font-weight: bold; }
</style>
</head>
<body>
  <h1>TÀI LIỆU TRÌNH CHIẾU & GIẢNG DẠY LỚP HỌC (CHUẨN 12PT TIMES NEW ROMAN)</h1>
  ${editableDeck
    .map(
      (c) => `
    <h2>${c.badge}: ${c.title}</h2>
    ${c.subtitle ? `<p><i>${c.subtitle}</i></p>` : ''}
    ${c.lines.map((l) => `<p>• ${l}</p>`).join('')}
    ${c.answerRevealText ? `<p><b>${c.answerRevealText}</b></p>` : ''}
  `
    )
    .join('<hr/>')}
</body>
</html>`;
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Bai_Giang_Trinh_Chieu_Full_Man_Hinh_12pt.doc';
    a.click();
    URL.revokeObjectURL(url);
    onLog?.('Đã tải về nội dung Trình chiếu (.DOC Word 12pt Times New Roman).', 'info');
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const stageBgClass =
    theme === 'paper-12pt'
      ? 'bg-amber-50 text-slate-950 border-amber-500'
      : theme === 'chalkboard'
      ? 'bg-[#0b3b24] text-emerald-50 border-emerald-400 shadow-[inset_0_0_80px_rgba(0,0,0,0.65)]'
      : 'bg-slate-950 text-white border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.25)]';

  return (
    <div className="fixed inset-0 z-[160] w-screen h-screen bg-slate-950 flex flex-col justify-between overflow-hidden select-none">
      {/* Top 3D Projector Control Bar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b-2 border-cyan-400 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left: Brand & Content Source Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center text-slate-950 font-black shadow-lg">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
                SÂN KHẤU TRÌNH CHIẾU & GIẢNG DẠY FULL MÀN HÌNH
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black">
                PROJECTOR VIP 4K
              </span>
            </div>
            <p className="text-[11px] text-cyan-200 hidden sm:block">
              Chuyển đổi tức thì giữa Giáo án 5512 · Slide PPT · Đề thi · Phiếu học tập & Game · Lớp học ảo
            </p>
          </div>

          {/* Quick Content Selector inside Presentation Mode */}
          <div className="flex flex-wrap items-center gap-1 ml-1 bg-slate-950 p-1 rounded-xl border border-sky-500/40">
            {lessonPlan && (
              <button
                onClick={() => setSourceType('lesson5512')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                  sourceType === 'lesson5512'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <BookOpenCheck className="w-3.5 h-3.5" />
                <span>Giáo Án 5512</span>
              </button>
            )}
            {slides && slides.length > 0 && (
              <button
                onClick={() => setSourceType('slides')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                  sourceType === 'slides'
                    ? 'bg-purple-500 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Slide PPT ({slides.length})</span>
              </button>
            )}
            {examPackage && (
              <button
                onClick={() => setSourceType('examsuite')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                  sourceType === 'examsuite'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Đề Thi 3 Phần</span>
              </button>
            )}
            {worksheetGame && (
              <button
                onClick={() => setSourceType('worksheet_game')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                  sourceType === 'worksheet_game'
                    ? 'bg-emerald-400 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Phiếu & Game</span>
              </button>
            )}
            {(customText || simulatorText) && (
              <button
                onClick={() => setSourceType('custom')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                  sourceType === 'custom' || sourceType === 'simulator' || sourceType === 'humanizer'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nội Dung Tab Hiện Tại</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Font Zoom, Theme, Classroom Timer, 4 CRUD Buttons & Exit */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* View Mode: Deck vs Full Document */}
          <button
            onClick={() => setViewMode((v) => (v === 'deck' ? 'document' : 'deck'))}
            className="btn-3d btn-3d-indigo px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1"
            title="Chuyển đổi giữa Trình chiếu từng Slide và Văn bản toàn trang có Laser dẫn dòng"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{viewMode === 'deck' ? 'Chế Độ Từng Slide' : 'Chế Độ Toàn Văn Bản + Laser'}</span>
          </button>

          {/* Font Size Zoom */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-cyan-500/40">
            <button
              onClick={() => setFontSizePt((s) => Math.max(12, s - 2))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
              title="Thu nhỏ cỡ chữ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-black text-amber-300 px-1.5 min-w-[44px] text-center">
              {fontSizePt}pt
            </span>
            <button
              onClick={() => setFontSizePt((s) => Math.min(48, s + 2))}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
              title="Phóng to cỡ chữ máy chiếu"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFontSizePt(12)}
              className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold"
            >
              12pt
            </button>
            <button
              onClick={() => setFontSizePt(26)}
              className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold"
            >
              26pt
            </button>
          </div>

          {/* 3 Projector Themes */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-purple-500/40">
            <button
              onClick={() => setTheme('cyber-stage')}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold ${
                theme === 'cyber-stage' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300'
              }`}
            >
              Sân Khấu 3D
            </button>
            <button
              onClick={() => setTheme('chalkboard')}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold ${
                theme === 'chalkboard' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300'
              }`}
            >
              Bảng Phấn Xanh
            </button>
            <button
              onClick={() => setTheme('paper-12pt')}
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold ${
                theme === 'paper-12pt' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'
              }`}
            >
              Giấy Trắng
            </button>
          </div>

          {/* Classroom Activity Countdown Timer */}
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-xl border border-amber-400/50">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span className="text-xs font-mono font-black text-amber-300">
              {formatTimer(timerSeconds)}
            </span>
            <button
              onClick={() => setIsTimerRunning((r) => !r)}
              className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black"
            >
              {isTimerRunning ? 'Dừng' : 'Đếm Giờ'}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(180);
              }}
              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold"
            >
              3p
            </button>
          </div>

          {/* 4 Standard CRUD Buttons: Thêm, Chỉnh Sửa, Xóa, Khôi Phục Lại */}
          <button
            onClick={handleAddSlideCard}
            className="btn-3d btn-3d-emerald px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>

          <button
            onClick={() => setIsEditing((e) => !e)}
            className={`btn-3d px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 ${
              isEditing ? 'btn-3d-emerald' : 'btn-3d-amber'
            }`}
          >
            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Xong' : 'Chỉnh Sửa'}</span>
          </button>

          <button
            onClick={handleDeleteSlideCard}
            className="btn-3d btn-3d-rose px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa</span>
          </button>

          <button
            onClick={handleRestoreSlideDeck}
            className="btn-3d btn-3d-cyan px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi Phục Lại</span>
          </button>

          <button
            onClick={handleDownloadPresentationDoc}
            className="btn-3d btn-3d-purple px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1"
            title="Tải về bản Word 12pt Times New Roman"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tải Về</span>
          </button>

          <button
            onClick={onClose}
            className="btn-3d btn-3d-rose px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Thoát (ESC)</span>
          </button>
        </div>
      </div>

      {/* Main Center Projection Stage */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col">
        <div
          className={`flex-1 rounded-3xl border-4 p-6 sm:p-10 flex flex-col justify-between transition-all ${stageBgClass}`}
          style={{
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: `${fontSizePt}pt`,
            lineHeight: 1.55,
          }}
        >
          {viewMode === 'deck' && currentCard ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-5">
                {/* Top Slide Badge & Show/Hide Answer Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-current/20 font-sans">
                  <span className="px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs sm:text-sm font-black tracking-wider">
                    {currentCard.badge}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentCard.answerRevealText && (
                      <button
                        onClick={() => setRevealAnswer((r) => !r)}
                        className={`btn-3d px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                          revealAnswer ? 'btn-3d-emerald' : 'btn-3d-amber'
                        }`}
                      >
                        {revealAnswer ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        <span>
                          {revealAnswer
                            ? 'Ẩn Đáp Án Giảng Dạy'
                            : 'Hiện Đáp Án & Giải Thích Cho Học Sinh'}
                        </span>
                      </button>
                    )}

                    {currentCard.teacherNote && (
                      <button
                        onClick={() => setShowTeacherNotes((n) => !n)}
                        className="btn-3d btn-3d-purple px-3.5 py-2 rounded-xl text-xs font-extrabold"
                      >
                        {showTeacherNotes ? 'Ẩn Ghi Chú GV' : 'Ghi Chú Giảng Dạy GV'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Slide / Activity Title & Subtitle */}
                {isEditing ? (
                  <div className="space-y-3 font-sans">
                    <input
                      type="text"
                      value={currentCard.title}
                      onChange={(e) => {
                        const next = [...editableDeck];
                        next[currentCardIdx] = { ...currentCard, title: e.target.value };
                        setEditableDeck(next);
                      }}
                      className="w-full p-3 rounded-xl bg-slate-900 border-2 border-cyan-400 text-white font-bold text-lg"
                    />
                    <textarea
                      value={currentCard.lines.join('\n')}
                      onChange={(e) => {
                        const next = [...editableDeck];
                        next[currentCardIdx] = {
                          ...currentCard,
                          lines: e.target.value.split('\n'),
                        };
                        setEditableDeck(next);
                        if (onUpdateCustomText && sourceType === 'custom') {
                          onUpdateCustomText(e.target.value);
                        }
                      }}
                      rows={6}
                      className="w-full p-4 rounded-xl bg-slate-900 border-2 border-cyan-400 text-white doc-times-12pt text-base"
                    />
                  </div>
                ) : (
                  <>
                    <h2
                      className={`font-bold leading-snug ${
                        theme === 'paper-12pt' ? 'text-slate-950' : 'text-amber-300'
                      }`}
                      style={{ fontSize: `${Math.min(52, Math.round(fontSizePt * 1.18))}pt` }}
                    >
                      {currentCard.title}
                    </h2>

                    {currentCard.subtitle && (
                      <p
                        className={`italic ${
                          theme === 'paper-12pt' ? 'text-slate-700' : 'text-cyan-200'
                        }`}
                      >
                        {currentCard.subtitle}
                      </p>
                    )}

                    {/* Bullet / Content Lines with Click-to-Highlight Laser Focus */}
                    <div className="space-y-3 pt-2">
                      {currentCard.lines.map((line, idx) => {
                        const isLaserActive = laserLineIdx === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() =>
                              setLaserLineIdx((prev) => (prev === idx ? null : idx))
                            }
                            className={`p-3 rounded-2xl cursor-pointer transition-all flex items-start gap-3 ${
                              isLaserActive
                                ? theme === 'paper-12pt'
                                  ? 'bg-yellow-200/90 border-2 border-amber-600 shadow-md'
                                  : 'bg-cyan-500/20 border-2 border-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.3)]'
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <span className="text-cyan-400 font-bold select-none">•</span>
                            <div className="flex-1 text-justify">
                              {renderCompetencyLine(line)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Optional 2-Column Table for Lesson Plan 5512 */}
                    {currentCard.twoColumnRow && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                        <div
                          className={`p-5 rounded-2xl border-2 ${
                            theme === 'paper-12pt'
                              ? 'bg-white border-slate-400'
                              : 'bg-slate-900/80 border-cyan-400/60'
                          }`}
                        >
                          <div className="font-bold text-cyan-400 uppercase mb-3 border-b border-current/20 pb-2">
                            {currentCard.twoColumnRow.leftTitle}
                          </div>
                          <div className="space-y-2">
                            {currentCard.twoColumnRow.leftLines.map((l, i) => (
                              <p key={i} className="text-justify">
                                - {renderCompetencyLine(l)}
                              </p>
                            ))}
                          </div>
                        </div>

                        <div
                          className={`p-5 rounded-2xl border-2 ${
                            theme === 'paper-12pt'
                              ? 'bg-white border-slate-400'
                              : 'bg-slate-900/80 border-amber-400/60'
                          }`}
                        >
                          <div className="font-bold text-amber-400 uppercase mb-3 border-b border-current/20 pb-2">
                            {currentCard.twoColumnRow.rightTitle}
                          </div>
                          <div className="space-y-2">
                            {currentCard.twoColumnRow.rightLines.map((l, i) => (
                              <p key={i} className="text-justify">
                                - {renderCompetencyLine(l)}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Bottom Interactive Question / Revealed Answer / Teacher Notes */}
              <div className="space-y-4 pt-6">
                {currentCard.interactivePrompt && (
                  <div
                    className={`p-4 rounded-2xl border-2 ${
                      theme === 'paper-12pt'
                        ? 'bg-sky-100 border-sky-600 text-sky-950'
                        : 'bg-indigo-950/90 border-cyan-400 text-cyan-200'
                    }`}
                  >
                    <strong className="uppercase mr-2">💡 Hoạt động tương tác lớp học:</strong>
                    <span>{currentCard.interactivePrompt}</span>
                  </div>
                )}

                {revealAnswer && currentCard.answerRevealText && (
                  <div className="p-5 rounded-2xl bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 font-bold whitespace-pre-line shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                    ✓ {currentCard.answerRevealText}
                  </div>
                )}

                {showTeacherNotes && currentCard.teacherNote && (
                  <div className="p-4 rounded-2xl bg-amber-950/90 border border-amber-400 text-amber-200 text-base font-sans">
                    <strong>Ghi chú Sư phạm dành cho Giáo viên:</strong> {currentCard.teacherNote}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Full Document Continuous View with Laser Line Pointer */
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-current/20 pb-3 mb-4 font-sans text-xs">
                <span className="font-extrabold text-cyan-300 flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-rose-400" />
                  <span>
                    CHẾ ĐỘ VĂN BẢN TOÀN TRANG KÈM THANH LASER DẪN DÒNG (Nhấp vào bất kỳ dòng nào để làm nổi bật cho học sinh theo dõi)
                  </span>
                </span>
              </div>
              {allDocumentLines.map((line, idx) => {
                const isHeading = line.startsWith('===');
                const isLaser = laserLineIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setLaserLineIdx(idx)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                      isLaser
                        ? theme === 'paper-12pt'
                          ? 'bg-yellow-300 text-slate-950 font-bold border-l-8 border-rose-600 pl-4'
                          : 'bg-cyan-500/25 border-l-8 border-amber-400 pl-4 shadow-lg'
                        : isHeading
                        ? 'font-bold text-amber-400 pt-4'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {renderCompetencyLine(line)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Slide Deck Navigation & Quick Jump Bar */}
      <div className="px-6 py-3 bg-slate-900 border-t-2 border-cyan-400 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentCardIdx((p) => Math.max(0, p - 1));
              setRevealAnswer(false);
            }}
            disabled={currentCardIdx === 0}
            className="btn-3d btn-3d-indigo px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Trang Trước (←)</span>
          </button>

          <span className="px-4 py-1.5 rounded-xl bg-slate-950 border border-cyan-400/60 text-xs font-black text-cyan-300">
            TRANG {currentCardIdx + 1} / {editableDeck.length}
          </span>

          <button
            onClick={() => {
              setCurrentCardIdx((p) => Math.min(editableDeck.length - 1, p + 1));
              setRevealAnswer(false);
            }}
            disabled={currentCardIdx >= editableDeck.length - 1}
            className="btn-3d btn-3d-emerald px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-40"
          >
            <span>Trang Tiếp Theo (→)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Page Dots */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-xl py-1">
          {editableDeck.map((card, idx) => (
            <button
              key={card.id}
              onClick={() => {
                setCurrentCardIdx(idx);
                setRevealAnswer(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                currentCardIdx === idx
                  ? 'bg-amber-400 text-slate-950 scale-105 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <div className="text-xs font-bold text-amber-300 hidden md:flex items-center gap-3">
          <span>Màu chữ chuẩn:</span>
          <span className="text-sky-400">● Năng lực số</span>
          <span className="text-rose-400">● Năng lực AI</span>
          <span className="text-amber-300">● Tích hợp liên môn</span>
        </div>
      </div>
    </div>
  );
};

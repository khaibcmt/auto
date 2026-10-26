import React, { useState, useRef } from 'react';
import {
  CheckSquare,
  ShieldAlert,
  Table2,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Wand2,
  Plus,
  Upload,
  Edit3,
  Trash2,
  FileCode2,
  RotateCcw,
} from 'lucide-react';
import {
  DifferentiatedExamPackage,
  MultipleChoiceQuestion,
} from '../types/pedagogyTypes';
import {
  exportExamAndKeyToWord,
  exportExamAndKeyToHtml,
  detectCompetencyTypeFromText,
} from '../utils/exportHelpers';
import { cleanPedagogyText } from '../data/pedagogyPresets';
import { runAdversarialAuditInWorker } from '../utils/pedagogyWorkerRunner';

interface ExamSuiteTabProps {
  examPackage: DifferentiatedExamPackage;
  onUpdateExam: (updated: DifferentiatedExamPackage) => void;
  isGenerating: boolean;
  onRegenerate: () => void;
  onSendToTyper: (text: string) => void;
  onLog: (msg: string, level?: 'info' | 'engine' | 'warning') => void;
}

export const ExamSuiteTab: React.FC<ExamSuiteTabProps> = ({
  examPackage,
  onUpdateExam,
  isGenerating,
  onRegenerate,
  onSendToTyper,
  onLog,
}) => {
  const [activeSubView, setActiveSubView] = useState<'exam_key' | 'audit' | 'matrix'>('exam_key');
  const [underlineKeyMode, setUnderlineKeyMode] = useState<boolean>(true);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [savedExamSnapshot, setSavedExamSnapshot] = useState<DifferentiatedExamPackage>(examPackage);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getCompetencyColorClass = (text: string) => {
    const cleaned = cleanPedagogyText(text);
    const kind = detectCompetencyTypeFromText(cleaned);
    if (kind === 'NLS') return 'text-[#60a5fa] font-semibold';
    if (kind === 'NLAI') return 'text-[#f87171] font-semibold';
    if (kind === 'THLM') return 'text-[#fbbf24] font-semibold';
    return 'text-zinc-100';
  };

  const handleRunWorkerAudit = async () => {
    setIsAuditing(true);
    const report = await runAdversarialAuditInWorker(examPackage.part1);
    onUpdateExam({
      ...examPackage,
      auditReport: report,
    });
    setIsAuditing(false);
    onLog(
      `Đã hoàn tất Thanh tra Phản biện đề thi: Điểm chất lượng ${report.overallQualityScore}/100`,
      'engine'
    );
  };

  const handleAutoOptimizeDistractors = async () => {
    setIsAuditing(true);
    const optimizedPart1 = examPackage.part1.map((q) => {
      const correctOpt = q.options.find((o) => o.isCorrect);
      const targetLen = correctOpt ? correctOpt.text.length : 100;
      const newOptions = q.options.map((opt) => {
        if (opt.isCorrect) return opt;
        let cleaned = opt.text
          .replace(/luôn luôn/gi, 'thường xuyên')
          .replace(/tuyệt đối/gi, 'hầu như')
          .replace(/hoàn toàn ngẫu nhiên/gi, 'biến thiên tự do');
        if (cleaned.length < targetLen * 0.72) {
          cleaned = `${cleaned.replace(/\.$/, '')} trong các điều kiện khảo sát thực nghiệm tiêu chuẩn.`;
        }
        return { ...opt, text: cleaned };
      });
      return { ...q, options: newOptions };
    });

    const newReport = await runAdversarialAuditInWorker(optimizedPart1);
    onUpdateExam({
      ...examPackage,
      part1: optimizedPart1,
      auditReport: newReport,
    });
    setIsAuditing(false);
    onLog(
      `Đã tối ưu hóa độ nhiễu phương án sai -> Điểm chất lượng mới: ${newReport.overallQualityScore}/100`,
      'engine'
    );
  };

  // Add new question to Part I
  const handleAddQuestion = () => {
    const nextNum = examPackage.part1.length + 1;
    const newQ: MultipleChoiceQuestion = {
      id: `p1-q${Date.now()}`,
      number: nextNum,
      bloomLevel: 'Vận dụng',
      stem: `Câu hỏi vận dụng bổ sung số ${nextNum}: Khai thác phần mềm mô phỏng số và đối chiếu dữ liệu thực nghiệm của bài học.`,
      options: [
        { letter: 'A', text: 'Phương án đúng phản ánh quy luật biến thiên thực nghiệm.', isCorrect: true },
        { letter: 'B', text: 'Phương án nhiễu số 1 có cùng độ dài và cấu trúc ngữ pháp.', isCorrect: false },
        { letter: 'C', text: 'Phương án nhiễu số 2 kiểm tra khả năng phân biệt khái niệm.', isCorrect: false },
        { letter: 'D', text: 'Phương án nhiễu số 3 kiểm tra kỹ năng suy luận định lượng.', isCorrect: false },
      ],
      explanation: 'Giải thích đáp án chuẩn.',
    };
    onUpdateExam({
      ...examPackage,
      part1: [...examPackage.part1, newQ],
    });
    setIsEditing(true);
    onLog(`Đã thêm Câu ${nextNum} vào Đề thi.`, 'info');
  };

  const handleDeletePart1Question = (idx: number) => {
    if (examPackage.part1.length <= 1) {
      onLog('Cần giữ lại ít nhất 1 câu hỏi trong Phần I.', 'warning');
      return;
    }
    const nextPart1 = examPackage.part1
      .filter((_, i) => i !== idx)
      .map((q, i) => ({ ...q, number: i + 1 }));
    onUpdateExam({ ...examPackage, part1: nextPart1 });
    onLog('Đã xóa câu hỏi khỏi Phần I.', 'warning');
  };

  const handleClearOrResetExam = () => {
    onRegenerate();
    onLog('Đã làm mới đề kiểm tra.', 'info');
  };

  const handleUploadExamFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      try {
        const parsed = JSON.parse(text);
        if (parsed && parsed.part1 && parsed.part2) {
          onUpdateExam(parsed);
          onLog(`Đã tải lên gói đề thi JSON "${file.name}" thành công!`, 'info');
          e.target.value = '';
          return;
        }
      } catch {
        // Plain text import -> create a question from uploaded text
      }
      const lines = text
        .split('\n')
        .map((l) => cleanPedagogyText(l))
        .filter(Boolean);
      if (lines.length > 0) {
        const nextNum = examPackage.part1.length + 1;
        const importedQ: MultipleChoiceQuestion = {
          id: `p1-import-${Date.now()}`,
          number: nextNum,
          bloomLevel: 'Thông hiểu',
          stem: lines[0],
          options: [
            { letter: 'A', text: lines[1] || 'Phương án A (Đúng)', isCorrect: true },
            { letter: 'B', text: lines[2] || 'Phương án B', isCorrect: false },
            { letter: 'C', text: lines[3] || 'Phương án C', isCorrect: false },
            { letter: 'D', text: lines[4] || 'Phương án D', isCorrect: false },
          ],
          explanation: 'Nhập từ tệp tải lên.',
        };
        onUpdateExam({
          ...examPackage,
          part1: [...examPackage.part1, importedQ],
        });
        setIsEditing(true);
        onLog(`Đã tải lên tệp "${file.name}" và thêm vào Đề thi để chỉnh sửa!`, 'info');
      }
    } catch {
      onLog('Không thể đọc tệp đề thi tải lên.', 'warning');
    }
    e.target.value = '';
  };

  const handleSendExamToTyper = () => {
    const lines: string[] = [
      cleanPedagogyText(examPackage.examTitle),
      `Môn: ${examPackage.subject} - ${examPackage.grade} | Mã đề: ${examPackage.examCode}`,
      ``,
      `PHẦN I. TRẮC NGHIỆM 4 LỰA CHỌN`,
      ...examPackage.part1.flatMap((q) => [
        `Câu ${q.number}. ${cleanPedagogyText(q.stem)}`,
        ...q.options.map((o) => `  ${o.letter}. ${cleanPedagogyText(o.text)}`),
      ]),
      ``,
      `PHẦN II. TRẮC NGHIỆM ĐÚNG/SAI`,
      ...examPackage.part2.flatMap((q) => [
        `Câu ${q.number}. ${cleanPedagogyText(q.contextStem)}`,
        ...q.statements.map((s) => `  ${s.letter}) ${cleanPedagogyText(s.text)}`),
      ]),
      ``,
      `PHẦN III. TRẢ LỜI NGẮN`,
      ...examPackage.part3.map(
        (q) => `Câu ${q.number}. ${cleanPedagogyText(q.stem)} => ${q.correctAnswer}`
      ),
    ];
    onSendToTyper(lines.join('\n'));
  };

  return (
    <div className="space-y-6">
      {/* Top 3D Action Toolbar: Thêm, Tải lên, Chỉnh sửa, Xóa, Tải về */}
      <div className="p-5 rounded-2xl bg-zinc-900 border-2 border-amber-400 flex flex-col gap-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              {cleanPedagogyText(examPackage.examTitle)}
            </h2>
            <p className="text-xs font-semibold text-amber-300 mt-1">
              Môn: {examPackage.subject} · {examPackage.grade} · Mã đề: {examPackage.examCode} · Font: Times New Roman 12pt
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.json,.doc,.docx,.md"
              onChange={handleUploadExamFile}
              className="hidden"
            />

            <button
              onClick={() => {
                setSavedExamSnapshot(examPackage);
                handleAddQuestion();
              }}
              className="btn-3d btn-3d-emerald px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm</span>
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`btn-3d px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
                isEditing ? 'btn-3d-emerald' : 'btn-3d-amber'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'Hoàn Tất Sửa' : 'Chỉnh Sửa'}</span>
            </button>

            <button
              onClick={() => {
                setSavedExamSnapshot(examPackage);
                if (examPackage.part1.length > 1) {
                  handleDeletePart1Question(examPackage.part1.length - 1);
                } else {
                  handleClearOrResetExam();
                }
              }}
              disabled={isGenerating}
              className="btn-3d btn-3d-rose px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa</span>
            </button>

            <button
              onClick={() => {
                if (savedExamSnapshot) {
                  onUpdateExam(savedExamSnapshot);
                  onLog('Đã khôi phục lại bộ Đề thi về trạng thái trước đó.', 'info');
                } else {
                  onRegenerate();
                }
              }}
              disabled={isGenerating}
              className="btn-3d btn-3d-cyan px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Khôi Phục Lại</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-3d btn-3d-purple px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Tải Lên</span>
            </button>

            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="btn-3d btn-3d-indigo px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Đang sinh đề...' : 'Sinh Đề Mới'}</span>
            </button>

            <button
              onClick={handleSendExamToTyper}
              className="btn-3d btn-3d-indigo px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <span>Gõ AutoTyper</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                exportExamAndKeyToWord(examPackage, true);
                onLog('Đã tải về Đề thi Word (.doc) Times New Roman 12pt kèm Đáp án gạch chân.', 'info');
              }}
              className="btn-3d btn-3d-cyan px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Tải Về (.DOC 12pt)</span>
            </button>

            <button
              onClick={() => {
                exportExamAndKeyToHtml(examPackage, true);
                onLog('Đã tải về Đề thi (.html) giữ nguyên 100% mã màu và kích thước 12pt.', 'info');
              }}
              className="btn-3d btn-3d-amber px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <FileCode2 className="w-4 h-4" />
              <span>Tải Bản In (.HTML)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3D Sub-navigation Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-2xl bg-zinc-900 border-2 border-sky-400">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubView('exam_key')}
            className={`btn-3d px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 ${
              activeSubView === 'exam_key' ? 'btn-3d-cyan' : 'bg-slate-800 text-slate-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Đề Thi 3 Phần & Đáp Án Gạch Chân</span>
          </button>

          <button
            onClick={() => setActiveSubView('audit')}
            className={`btn-3d px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 ${
              activeSubView === 'audit' ? 'btn-3d-amber' : 'bg-slate-800 text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Thanh Tra Phản Biện ({examPackage.auditReport.overallQualityScore}/100)</span>
          </button>

          <button
            onClick={() => setActiveSubView('matrix')}
            className={`btn-3d px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 ${
              activeSubView === 'matrix' ? 'btn-3d-emerald' : 'bg-slate-800 text-slate-200'
            }`}
          >
            <Table2 className="w-4 h-4" />
            <span>Ma Trận & Bảng Đặc Tả</span>
          </button>
        </div>

        {activeSubView === 'exam_key' && (
          <label className="flex items-center gap-2 text-xs text-zinc-200 cursor-pointer px-3.5 py-2 rounded-xl bg-slate-950 border border-sky-500/50">
            <input
              type="checkbox"
              checked={underlineKeyMode}
              onChange={(e) => setUnderlineKeyMode(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-700 text-cyan-500"
            />
            <span>
              Đáp án gạch chân: <b><u>A</u>, <u>B</u>, <u>C</u>, <u>D</u> / <u>a</u>, <u>b</u>, <u>c</u>, <u>d</u></b>
            </span>
          </label>
        )}
      </div>

      {/* VIEW 1: 3-PART EXAM & UNDERLINED KEY (STRICT 12PT TIMES NEW ROMAN) */}
      {activeSubView === 'exam_key' && (
        <div className="space-y-6 doc-times-12pt">
          {/* PART I */}
          <div className="p-6 rounded-2xl bg-zinc-900 border-2 border-sky-400 space-y-5">
            <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-white uppercase">
                PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn
              </h3>
              <button
                onClick={handleAddQuestion}
                className="btn-3d btn-3d-emerald px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 font-sans"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm câu Phần I</span>
              </button>
            </div>

            <div className="space-y-5">
              {examPackage.part1.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300">
                      Câu {q.number} ({q.bloomLevel})
                    </span>
                    <button
                      onClick={() => handleDeletePart1Question(qIdx)}
                      className="btn-3d btn-3d-rose px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 font-sans"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>

                  {isEditing ? (
                    <textarea
                      value={cleanPedagogyText(q.stem)}
                      onChange={(e) => {
                        const next = [...examPackage.part1];
                        next[qIdx] = { ...q, stem: e.target.value };
                        onUpdateExam({ ...examPackage, part1: next });
                      }}
                      rows={2}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-cyan-500 text-white"
                    />
                  ) : (
                    <p className={`text-justify font-semibold ${getCompetencyColorClass(q.stem)}`}>
                      {cleanPedagogyText(q.stem)}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {q.options.map((opt, oIdx) => {
                      const isUnderlined = underlineKeyMode && opt.isCorrect;
                      return (
                        <div
                          key={opt.letter}
                          className={`p-2.5 rounded-lg border transition-colors ${
                            isUnderlined
                              ? 'bg-emerald-950/25 border-emerald-500/50 text-zinc-100'
                              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-200'
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={opt.isCorrect}
                                onChange={() => {
                                  const nextOpts = q.options.map((o, idx) => ({
                                    ...o,
                                    isCorrect: idx === oIdx,
                                  }));
                                  const nextPart1 = [...examPackage.part1];
                                  nextPart1[qIdx] = { ...q, options: nextOpts };
                                  onUpdateExam({ ...examPackage, part1: nextPart1 });
                                }}
                              />
                              <span className="font-bold text-cyan-300">{opt.letter}.</span>
                              <input
                                type="text"
                                value={cleanPedagogyText(opt.text)}
                                onChange={(e) => {
                                  const nextOpts = [...q.options];
                                  nextOpts[oIdx] = { ...opt, text: e.target.value };
                                  const nextPart1 = [...examPackage.part1];
                                  nextPart1[qIdx] = { ...q, options: nextOpts };
                                  onUpdateExam({ ...examPackage, part1: nextPart1 });
                                }}
                                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                              />
                            </div>
                          ) : (
                            <>
                              <span
                                className={
                                  isUnderlined
                                    ? 'underline decoration-2 underline-offset-4 font-bold text-emerald-400 mr-1.5'
                                    : 'font-bold text-zinc-200 mr-1.5'
                                }
                              >
                                {opt.letter}
                              </span>
                              <span className={getCompetencyColorClass(opt.text)}>
                                . {cleanPedagogyText(opt.text)}
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PART II */}
          <div className="p-6 rounded-2xl bg-zinc-900 border-2 border-purple-400 space-y-5">
            <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-white uppercase">
                PHẦN II. Câu trắc nghiệm Đúng / Sai
              </h3>
            </div>

            <div className="space-y-5">
              {examPackage.part2.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3"
                >
                  {isEditing ? (
                    <textarea
                      value={cleanPedagogyText(q.contextStem)}
                      onChange={(e) => {
                        const next = [...examPackage.part2];
                        next[qIdx] = { ...q, contextStem: e.target.value };
                        onUpdateExam({ ...examPackage, part2: next });
                      }}
                      rows={2}
                      className="w-full p-2.5 rounded-lg bg-slate-900 border border-purple-500 text-white"
                    />
                  ) : (
                    <p className={`font-semibold text-justify ${getCompetencyColorClass(q.contextStem)}`}>
                      <span className="text-cyan-400 font-bold mr-1.5">Câu {q.number}:</span>
                      {cleanPedagogyText(q.contextStem)}
                    </p>
                  )}

                  <div className="space-y-2 pl-2">
                    {q.statements.map((st, sIdx) => {
                      const isUnderlined = underlineKeyMode && st.isTrue;
                      return (
                        <div
                          key={st.letter}
                          className={`p-3 rounded-lg border flex items-start justify-between gap-4 ${
                            isUnderlined
                              ? 'bg-emerald-950/25 border-emerald-500/50 text-zinc-100'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-200'
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-2 w-full">
                              <input
                                type="checkbox"
                                checked={st.isTrue}
                                onChange={(e) => {
                                  const nextSt = [...q.statements];
                                  nextSt[sIdx] = { ...st, isTrue: e.target.checked };
                                  const nextPart2 = [...examPackage.part2];
                                  nextPart2[qIdx] = { ...q, statements: nextSt };
                                  onUpdateExam({ ...examPackage, part2: nextPart2 });
                                }}
                              />
                              <span className="font-bold text-cyan-300">{st.letter})</span>
                              <input
                                type="text"
                                value={cleanPedagogyText(st.text)}
                                onChange={(e) => {
                                  const nextSt = [...q.statements];
                                  nextSt[sIdx] = { ...st, text: e.target.value };
                                  const nextPart2 = [...examPackage.part2];
                                  nextPart2[qIdx] = { ...q, statements: nextSt };
                                  onUpdateExam({ ...examPackage, part2: nextPart2 });
                                }}
                                className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                              />
                            </div>
                          ) : (
                            <div className="text-justify">
                              <span
                                className={
                                  isUnderlined
                                    ? 'underline decoration-2 underline-offset-4 font-bold text-emerald-400 mr-1.5'
                                    : 'font-bold text-zinc-200 mr-1.5'
                                }
                              >
                                {st.letter}
                              </span>
                              <span className={getCompetencyColorClass(st.text)}>
                                ) {cleanPedagogyText(st.text)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PART III */}
          <div className="p-6 rounded-2xl bg-zinc-900 border-2 border-emerald-400 space-y-5">
            <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-white uppercase">
                PHẦN III. Câu trắc nghiệm trả lời ngắn
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {examPackage.part3.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="text-cyan-400 font-bold">
                      Câu {q.number} ({q.bloomLevel})
                    </div>
                    {isEditing ? (
                      <textarea
                        value={cleanPedagogyText(q.stem)}
                        onChange={(e) => {
                          const next = [...examPackage.part3];
                          next[qIdx] = { ...q, stem: e.target.value };
                          onUpdateExam({ ...examPackage, part3: next });
                        }}
                        rows={2}
                        className="w-full p-2 rounded bg-slate-900 border border-emerald-500 text-white"
                      />
                    ) : (
                      <p className={`text-justify ${getCompetencyColorClass(q.stem)}`}>
                        {cleanPedagogyText(q.stem)}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-400">Đáp số:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={q.correctAnswer}
                        onChange={(e) => {
                          const next = [...examPackage.part3];
                          next[qIdx] = { ...q, correctAnswer: e.target.value };
                          onUpdateExam({ ...examPackage, part3: next });
                        }}
                        className="bg-slate-900 border border-emerald-500 rounded px-2 py-1 text-emerald-300 font-bold"
                      />
                    ) : underlineKeyMode ? (
                      <span className="underline decoration-2 underline-offset-4 font-bold text-emerald-400">
                        {q.correctAnswer}
                      </span>
                    ) : (
                      <span className="text-zinc-500">....................</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ADVERSARIAL AUDIT */}
      {activeSubView === 'audit' && (
        <div className="space-y-6 doc-times-12pt">
          <div className="p-5 rounded-2xl bg-zinc-900 border-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white">
                Thanh Tra Phản Biện Đề Thi & Phân Tích Độ Nhiễu
              </h3>
            </div>

            <div className="flex items-center gap-2.5 font-sans">
              <button
                onClick={handleRunWorkerAudit}
                disabled={isAuditing}
                className="btn-3d btn-3d-cyan px-3.5 py-2 rounded-xl text-xs font-extrabold"
              >
                {isAuditing ? 'Đang quét...' : 'Quét Lại Đề Thi'}
              </button>

              <button
                onClick={handleAutoOptimizeDistractors}
                disabled={isAuditing}
                className="btn-3d btn-3d-amber px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Tự Động Cân Bằng Phương Án Nhiễu</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <p className="text-zinc-400">Chỉ Số Chất Lượng</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {examPackage.auditReport.overallQualityScore}/100
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <p className="text-zinc-400">Độ Nhiễu Phương Án Sai</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">
                {examPackage.auditReport.distractorIndex}%
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <p className="text-zinc-400">Độ Tường Minh Câu Dẫn</p>
              <p className="text-2xl font-bold text-zinc-100 mt-1">
                {examPackage.auditReport.clarityIndex}%
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <p className="text-zinc-400">Cân Bằng Thang Nhận Thức</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {examPackage.auditReport.bloomBalanceIndex}%
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
            <h4 className="font-bold text-white">
              Chi Tiết Báo Cáo Phản Biện Từng Câu Hỏi
            </h4>
            <div className="space-y-3">
              {examPackage.auditReport.findings.map((f, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {f.severity === 'optimal' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="font-bold text-white">{f.questionRef}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-zinc-400">{f.category}</span>
                    </div>
                    <p className="text-zinc-300">{f.issueDescription}</p>
                    <p className="text-cyan-400">Khuyến nghị: {f.recommendation}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-emerald-400">
                      {f.distractorScore}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: EXAM MATRIX (STRICT 12PT TIMES NEW ROMAN) */}
      {activeSubView === 'matrix' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border-2 border-emerald-400 space-y-4 doc-times-12pt">
          <h3 className="font-bold text-white uppercase">
            BẢNG MA TRẬN & ĐẶC TẢ KỸ THUẬT ĐỀ KIỂM TRA
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-zinc-700">
              <thead>
                <tr className="bg-zinc-950 text-zinc-200">
                  <th className="border border-zinc-700 p-3 text-center">TT</th>
                  <th className="border border-zinc-700 p-3 text-left">Chủ đề / Bài học</th>
                  <th className="border border-zinc-700 p-3 text-left">Đơn vị kiến thức</th>
                  <th className="border border-zinc-700 p-3 text-left">Đặc tả yêu cầu cần đạt</th>
                  <th className="border border-zinc-700 p-3 text-center">Phần I (B/H/VD/VDC)</th>
                  <th className="border border-zinc-700 p-3 text-center">Phần II (B/H/VD/VDC)</th>
                  <th className="border border-zinc-700 p-3 text-center">Phần III (B/H/VD/VDC)</th>
                  <th className="border border-zinc-700 p-3 text-center">Tỷ lệ điểm</th>
                </tr>
              </thead>
              <tbody>
                {examPackage.matrix.map((row) => (
                  <tr key={row.topicNumber} className="align-top hover:bg-zinc-950/60">
                    <td className="border border-zinc-800 p-3 text-center">
                      {row.topicNumber}
                    </td>
                    <td className="border border-zinc-800 p-3 font-semibold text-white">
                      {cleanPedagogyText(row.topicName)}
                    </td>
                    <td className="border border-zinc-800 p-3 text-zinc-300">
                      {cleanPedagogyText(row.contentUnit)}
                    </td>
                    <td className="border border-zinc-800 p-3 text-zinc-200 whitespace-pre-line">
                      {cleanPedagogyText(row.learningOutcomeSpec)}
                    </td>
                    <td className="border border-zinc-800 p-3 text-center text-cyan-300">
                      {row.part1Counts.biet} / {row.part1Counts.hieu} / {row.part1Counts.vanDung} / {row.part1Counts.vanDungCao}
                    </td>
                    <td className="border border-zinc-800 p-3 text-center text-emerald-300">
                      {row.part2Counts.biet} / {row.part2Counts.hieu} / {row.part2Counts.vanDung} / {row.part2Counts.vanDungCao}
                    </td>
                    <td className="border border-zinc-800 p-3 text-center text-amber-300">
                      {row.part3Counts.biet} / {row.part3Counts.hieu} / {row.part3Counts.vanDung} / {row.part3Counts.vanDungCao}
                    </td>
                    <td className="border border-zinc-800 p-3 text-center font-bold text-white">
                      {row.percentScore}% ({row.totalPoints.toFixed(1)}đ)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

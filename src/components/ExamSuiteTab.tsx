import React, { useState } from 'react';
import {
  CheckSquare,
  ShieldAlert,
  Table2,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Wand2
} from 'lucide-react';
import { DifferentiatedExamPackage } from '../types/pedagogyTypes';
import { exportExamAndKeyToWord } from '../utils/exportHelpers';
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

  const handleRunWorkerAudit = async () => {
    setIsAuditing(true);
    const report = await runAdversarialAuditInWorker(examPackage.part1);
    onUpdateExam({
      ...examPackage,
      auditReport: report,
    });
    setIsAuditing(false);
    onLog(
      `Web Worker đã hoàn tất Thanh tra Phản biện đề thi: Điểm chất lượng ${report.overallQualityScore}/100`,
      'engine'
    );
  };

  // Auto-optimize distractors to fix length bias or extreme words
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
      `Đã tối ưu hóa độ nhiễu phương án sai qua Web Worker -> Điểm chất lượng mới: ${newReport.overallQualityScore}/100`,
      'engine'
    );
  };

  const handleSendExamToTyper = () => {
    const lines: string[] = [
      examPackage.examTitle,
      `Môn: ${examPackage.subject} - ${examPackage.grade} | Thời gian: ${examPackage.durationMinutes} phút | Mã đề: ${examPackage.examCode}`,
      ``,
      `PHẦN I. TRẮC NGHIỆM 4 LỰA CHỌN`,
      ...examPackage.part1.flatMap((q) => [
        `Câu ${q.number}. ${q.stem}`,
        ...q.options.map((o) => `  ${o.letter}. ${o.text}`),
      ]),
      ``,
      `PHẦN II. TRẮC NGHIỆM ĐÚNG/SAI (4 Ý a, b, c, d)`,
      ...examPackage.part2.flatMap((q) => [
        `Câu ${q.number}. ${q.contextStem}`,
        ...q.statements.map((s) => `  ${s.letter}) ${s.text}`),
      ]),
      ``,
      `PHẦN III. TRẢ LỜI NGẮN`,
      ...examPackage.part3.map((q) => `Câu ${q.number}. ${q.stem} => ${q.correctAnswer}`),
    ];
    onSendToTyper(lines.join('\n'));
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation for Modules 5, 6, 7 */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <span>Phân hệ 05 · 06 · 07</span>
            <span aria-hidden="true">·</span>
            <span>Đề Thi 3 Phần Mới</span>
            <span aria-hidden="true">·</span>
            <span>Adversarial Audit</span>
            <span aria-hidden="true">·</span>
            <span>Đáp Án Gạch Chân & Ma Trận</span>
          </div>
          <h2 className="text-lg font-bold text-white">{examPackage.examTitle}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isGenerating ? 'Đang sinh đề...' : 'Sinh Đề Mới (On-Demand)'}</span>
          </button>

          <button
            onClick={handleSendExamToTyper}
            className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <span>Gõ trên AutoTyper</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              exportExamAndKeyToWord(examPackage, true);
              onLog('Đã xuất file Word Đề thi kèm Đáp án gạch chân chuẩn Module 7', 'info');
            }}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Word (.docx) Đáp Án Gạch Chân</span>
          </button>
        </div>
      </div>

      {/* Sub-module Segmented Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
        <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
          <button
            onClick={() => setActiveSubView('exam_key')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubView === 'exam_key'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-cyan-400" />
            <span>05 & 07. Đề Thi 3 Phần & Đáp Án Gạch Chân</span>
          </button>

          <button
            onClick={() => setActiveSubView('audit')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubView === 'audit'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>
              06. Thanh Tra Phản Biện & Bẫy Nhiễu ({examPackage.auditReport.overallQualityScore}/100)
            </span>
          </button>

          <button
            onClick={() => setActiveSubView('matrix')}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubView === 'matrix'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Table2 className="w-4 h-4 text-emerald-400" />
            <span>07. Ma Trận & Bảng Đặc Tả Khảo Thí</span>
          </button>
        </div>

        {/* Strict Underline Rule Toggle */}
        {activeSubView === 'exam_key' && (
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <input
              type="checkbox"
              checked={underlineKeyMode}
              onChange={(e) => setUnderlineKeyMode(e.target.checked)}
              className="rounded bg-zinc-900 border-zinc-700 text-cyan-500"
            />
            <span>
              Quy chuẩn Đáp án chuẩn: <b>Chỉ gạch chân chữ cái đúng (<u>A</u>, <u>B</u>, <u>C</u>, <u>D</u> / <u>a</u>, <u>b</u>, <u>c</u>, <u>d</u>)</b>, không nhãn thừa
            </span>
          </label>
        )}
      </div>

      {/* VIEW 1: 3-PART EXAM & UNDERLINED KEY */}
      {activeSubView === 'exam_key' && (
        <div className="space-y-6">
          {/* PART I: 4-Option Multiple Choice */}
          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-5">
            <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (4 phương án A, B, C, D)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Phân hóa 4 mức độ nhận thức: Nhận biết · Thông hiểu · Vận dụng · Vận dụng cao
                </p>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {examPackage.part1.length} câu hỏi
              </span>
            </div>

            <div className="space-y-5">
              {examPackage.part1.map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-bold text-cyan-400">
                      Câu {q.number} · Mức độ: {q.bloomLevel}
                    </span>
                    {q.competencyTag && (
                      <span className="font-mono text-zinc-400">
                        Năng lực: [{q.competencyTag}]
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-zinc-100 leading-relaxed text-justify">
                    {q.stem}
                  </p>

                  {/* Options with strict underlined letter only */}
                  <div className="grid grid-cols-1 gap-2 pl-2">
                    {q.options.map((opt) => {
                      const isUnderlined = underlineKeyMode && opt.isCorrect;
                      return (
                        <div
                          key={opt.letter}
                          className={`p-2.5 rounded-lg border text-sm leading-relaxed transition-colors ${
                            isUnderlined
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-zinc-100'
                              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300'
                          }`}
                        >
                          <span
                            className={
                              isUnderlined
                                ? 'underline decoration-2 underline-offset-4 font-black text-emerald-400 mr-1.5'
                                : 'font-bold text-zinc-300 mr-1.5'
                            }
                          >
                            {opt.letter}
                          </span>
                          <span>. {opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PART II: True/False 4-Statement Questions (a, b, c, d) */}
          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-5">
            <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  PHẦN II. Câu trắc nghiệm Đúng / Sai (Mỗi câu gồm 4 ý a, b, c, d)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Khi bật Đáp án chuẩn: Chỉ gạch chân trực tiếp chữ cái (<u>a</u>, <u>b</u>, <u>c</u>, <u>d</u>) của mệnh đề Đúng
                </p>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {examPackage.part2.length} câu ({examPackage.part2.length * 4} mệnh đề)
              </span>
            </div>

            <div className="space-y-5">
              {examPackage.part2.map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3"
                >
                  <p className="text-sm font-semibold text-zinc-100 leading-relaxed text-justify">
                    <span className="text-cyan-400 font-bold mr-1.5">Câu {q.number}:</span>
                    {q.contextStem}
                  </p>

                  <div className="space-y-2 pl-2">
                    {q.statements.map((st) => {
                      const isUnderlined = underlineKeyMode && st.isTrue;
                      return (
                        <div
                          key={st.letter}
                          className={`p-3 rounded-lg border text-sm flex items-start justify-between gap-4 ${
                            isUnderlined
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-zinc-100'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="leading-relaxed text-justify">
                            <span
                              className={
                                isUnderlined
                                  ? 'underline decoration-2 underline-offset-4 font-black text-emerald-400 mr-1.5'
                                  : 'font-bold text-zinc-300 mr-1.5'
                              }
                            >
                              {st.letter}
                            </span>
                            <span>) {st.text}</span>
                          </div>
                          <span className="text-xs text-zinc-500 whitespace-nowrap shrink-0 font-mono">
                            {st.bloomLevel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PART III: Short Answer */}
          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-5">
            <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  PHẦN III. Câu trắc nghiệm trả lời ngắn (Short Answer)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Đánh giá năng lực tính toán, vận dụng và điền đáp số trực tiếp
                </p>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {examPackage.part3.length} câu hỏi
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {examPackage.part3.map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="text-xs text-cyan-400 font-bold">
                      Câu {q.number} · {q.bloomLevel}
                    </div>
                    <p className="text-sm text-zinc-100 leading-relaxed text-justify">
                      {q.stem}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-sm">
                    <span className="text-xs text-zinc-400">Kết quả chuẩn:</span>
                    {underlineKeyMode ? (
                      <span className="underline decoration-2 underline-offset-4 font-black text-emerald-400 font-mono text-base">
                        {q.correctAnswer}
                      </span>
                    ) : (
                      <span className="text-zinc-500 font-mono">....................</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MODULE 6 - ADVERSARIAL AUDIT & DISTRACTOR ANALYSIS */}
      {activeSubView === 'audit' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Phân Hệ 06: Thanh Tra Phản Biện Đề Thi & Phân Tích Độ Nhiễu (Adversarial Audit)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Thực thi trên luồng Web Worker độc lập (0% UI Freeze) · Quét bẫy độ dài phương án, từ ngữ cực đoan và độ phân cách
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleRunWorkerAudit}
                disabled={isAuditing}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 transition-colors"
              >
                {isAuditing ? 'Đang quét...' : 'Quét Lại Đề (Web Worker)'}
              </button>

              <button
                onClick={handleAutoOptimizeDistractors}
                disabled={isAuditing}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Tự Động Cân Bằng Phương Án Nhiễu</span>
              </button>
            </div>
          </div>

          {/* 4 Quality Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <p className="text-xs text-zinc-400">Chỉ Số Chất Lượng Tổng Thể</p>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {examPackage.auditReport.overallQualityScore}/100
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">Chuẩn khảo thí quốc gia</p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <p className="text-xs text-zinc-400">Độ Nhiễu Phương Án Sai</p>
              <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                {examPackage.auditReport.distractorIndex}%
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">Distractor Effectiveness</p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <p className="text-xs text-zinc-400">Độ Tường Minh Câu Dẫn</p>
              <p className="text-2xl font-bold font-mono text-zinc-100 mt-1">
                {examPackage.auditReport.clarityIndex}%
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">0 câu hỏi mơ hồ đa nghĩa</p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
              <p className="text-xs text-zinc-400">Cân Bằng Thang Bloom</p>
              <p className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {examPackage.auditReport.bloomBalanceIndex}%
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">Đủ 4 cấp độ nhận thức</p>
            </div>
          </div>

          {/* Detailed Findings */}
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
            <h4 className="text-sm font-bold text-white">
              Chi Tiết Báo Cáo Phản Biện Từng Câu Hỏi & Khuyến Nghị Chỉnh Sửa
            </h4>
            <div className="space-y-3">
              {examPackage.auditReport.findings.map((f, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      {f.severity === 'optimal' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="font-bold text-white">{f.questionRef}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-zinc-400">{f.category}</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {f.issueDescription}
                    </p>
                    <p className="text-xs text-cyan-400">
                      Khuyến nghị: {f.recommendation}
                    </p>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <span className="text-sm font-bold text-emerald-400">
                      {f.distractorScore}/100
                    </span>
                    <span className="block text-[11px] text-zinc-500">Điểm độ nhiễu</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: MODULE 7 - EXAM MATRIX & SPECIFICATION TABLE */}
      {activeSubView === 'matrix' && (
        <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Phân Hệ 07: Bảng Ma Trận & Đặc Tả Kỹ Thuật Đề Kiểm Tra Chuẩn Mới
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Phân bổ tỷ lệ nhận thức chuẩn: Nhận biết (40%) · Thông hiểu (30%) · Vận dụng (20%) · Vận dụng cao (10%)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-zinc-700 text-xs sm:text-sm">
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
                    <td className="border border-zinc-800 p-3 text-center font-mono">
                      {row.topicNumber}
                    </td>
                    <td className="border border-zinc-800 p-3 font-semibold text-white">
                      {row.topicName}
                    </td>
                    <td className="border border-zinc-800 p-3 text-zinc-300">
                      {row.contentUnit}
                    </td>
                    <td className="border border-zinc-800 p-3 text-zinc-300 whitespace-pre-line">
                      {row.learningOutcomeSpec}
                    </td>
                    <td className="border border-zinc-800 p-3 text-center font-mono text-cyan-300">
                      {row.part1Counts.biet} / {row.part1Counts.hieu} / {row.part1Counts.vanDung} / {row.part1Counts.vanDungCao}
                    </td>
                    <td className="border border-zinc-800 p-3 text-center font-mono text-emerald-300">
                      {row.part2Counts.biet} / {row.part2Counts.hieu} / {row.part2Counts.vanDung} / {row.part2Counts.vanDungCao}
                    </td>
                    <td className="border border-zinc-800 p-3 text-center font-mono text-amber-300">
                      {row.part3Counts.biet} / {row.part3Counts.hieu} / {row.part3Counts.vanDung} / {row.part3Counts.vanDungCao}
                    </td>
                    <td className="border border-zinc-800 p-3 text-center font-bold text-white font-mono">
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

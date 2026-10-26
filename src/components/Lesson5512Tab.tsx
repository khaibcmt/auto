import React, { useState } from 'react';
import {
  FileText,
  Download,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Layers,
  Filter
} from 'lucide-react';
import { LessonPlan5512, CompetencyType } from '../types/pedagogyTypes';
import { exportLesson5512ToWord } from '../utils/exportHelpers';

interface Lesson5512TabProps {
  lessonPlan: LessonPlan5512;
  isGenerating: boolean;
  onRegenerate: () => void;
  onSendToTyper: (text: string) => void;
  onLog: (msg: string, level?: 'info' | 'engine' | 'warning') => void;
}

export const Lesson5512Tab: React.FC<Lesson5512TabProps> = ({
  lessonPlan,
  isGenerating,
  onRegenerate,
  onSendToTyper,
  onLog,
}) => {
  const [activeCompetencyFilter, setActiveCompetencyFilter] = useState<'ALL' | CompetencyType>('ALL');

  // Helper to highlight [NLS] Blue, [NLAI] Red, [THLM] Amber inline
  const renderColoredText = (text: string) => {
    const parts = text.split(/(\[(?:NLS|NLAI|THLM)[^\]]*\])/g);
    return parts.map((part, idx) => {
      if (part.startsWith('[NLS')) {
        const dimmed = activeCompetencyFilter !== 'ALL' && activeCompetencyFilter !== 'NLS';
        return (
          <span
            key={idx}
            className={`font-semibold px-1.5 py-0.5 rounded mx-0.5 transition-opacity ${
              dimmed
                ? 'opacity-30 bg-blue-950/40 text-blue-300'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
            }`}
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('[NLAI')) {
        const dimmed = activeCompetencyFilter !== 'ALL' && activeCompetencyFilter !== 'NLAI';
        return (
          <span
            key={idx}
            className={`font-semibold px-1.5 py-0.5 rounded mx-0.5 transition-opacity ${
              dimmed
                ? 'opacity-30 bg-red-950/40 text-red-300'
                : 'bg-red-500/20 text-red-300 border border-red-500/40'
            }`}
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('[THLM')) {
        const dimmed = activeCompetencyFilter !== 'ALL' && activeCompetencyFilter !== 'THLM';
        return (
          <span
            key={idx}
            className={`font-semibold px-1.5 py-0.5 rounded mx-0.5 transition-opacity ${
              dimmed
                ? 'opacity-30 bg-amber-950/40 text-amber-300'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const handleExportWord = () => {
    exportLesson5512ToWord(lessonPlan);
    onLog(`Đã xuất file Word (.doc) Kế hoạch bài dạy 5512: ${lessonPlan.lessonTitle}`, 'info');
  };

  const handleSendPlanToTyper = () => {
    const plainLines: string[] = [
      `KẾ HOẠCH BÀI DẠY CHUẨN CÔNG VĂN 5512`,
      `${lessonPlan.lessonTitle} (${lessonPlan.subject} - ${lessonPlan.grade})`,
      ``,
      `I. MỤC TIÊU`,
      ...lessonPlan.knowledgeObjectives.map((k) => `- ${k}`),
      `- ${lessonPlan.digitalCompetencyNLS}`,
      `- ${lessonPlan.aiCompetencyNLAI}`,
      `- ${lessonPlan.interdisciplinaryTHLM}`,
      ``,
      `II. TIẾN TRÌNH DẠY HỌC`,
      ...lessonPlan.activities.flatMap((a) => [
        `${a.title} (${a.durationMinutes} phút)`,
        `- Nội dung: ${a.content}`,
        ...a.twoColumnRows.flatMap((r) => [
          `  ${r.stepTitle}:`,
          ...r.teacherStudentAction.map((t) => `    ${t}`),
          ...r.expectedProduct.map((p) => `    => Sản phẩm: ${p}`),
        ]),
      ]),
    ];
    onSendToTyper(plainLines.join('\n'));
  };

  return (
    <div className="space-y-6">
      {/* Module 3 & 4 Header Bar */}
      <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <span>Phân hệ 03 & 04</span>
            <span aria-hidden="true">·</span>
            <span>Chuẩn Công văn 5512/BGDĐT</span>
            <span aria-hidden="true">·</span>
            <span>Bảng 2 cột đối ứng & Bản đồ năng lực 3 màu</span>
          </div>
          <h2 className="text-lg font-bold text-white">
            {lessonPlan.lessonTitle}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold border border-zinc-700 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isGenerating ? 'Đang tái tạo...' : 'Tái tạo Giáo Án 5512 (On-Demand)'}</span>
          </button>

          <button
            onClick={handleSendPlanToTyper}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-xs font-semibold border border-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <span>Gõ trên AutoTyper</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExportWord}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Xuất File Word (.docx) Chuẩn 5512</span>
          </button>
        </div>
      </div>

      {/* Module 4: Competency Color Map & Filter Bar */}
      <div className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Phân Hệ 04: Bản Đồ Năng Lực & Hệ Mã Màu Đồng Bộ Toàn Văn Bản
            </h3>
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
            <Filter className="w-3.5 h-3.5 text-zinc-500 ml-2 mr-1" />
            {(
              [
                { id: 'ALL', label: 'Tất cả (3 màu)' },
                { id: 'NLS', label: 'Xanh dương: Năng lực số' },
                { id: 'NLAI', label: 'Đỏ: Năng lực AI' },
                { id: 'THLM', label: 'Vàng: Liên môn' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                onClick={() => setActiveCompetencyFilter(btn.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeCompetencyFilter === btn.id
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Competency Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Blue: Digital Competency */}
          <div className="p-4 rounded-lg bg-blue-950/25 border border-blue-500/30 space-y-1.5">
            <div className="text-xs font-bold text-blue-400 flex items-center justify-between">
              <span>MÃ MÀU XANH DƯƠNG — NĂNG LỰC SỐ [NLS]</span>
              <span>NLS-1.2</span>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed text-justify">
              {lessonPlan.digitalCompetencyNLS}
            </p>
          </div>

          {/* Red: AI Competency */}
          <div className="p-4 rounded-lg bg-red-950/25 border border-red-500/30 space-y-1.5">
            <div className="text-xs font-bold text-red-400 flex items-center justify-between">
              <span>MÃ MÀU ĐỎ — NĂNG LỰC TRÍ TUỆ NHÂN TẠO [NLAI]</span>
              <span>NLAI-2.1</span>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed text-justify">
              {lessonPlan.aiCompetencyNLAI}
            </p>
          </div>

          {/* Gold: Interdisciplinary */}
          <div className="p-4 rounded-lg bg-amber-950/25 border border-amber-500/30 space-y-1.5">
            <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
              <span>MÃ MÀU VÀNG — TÍCH HỢP LIÊN MÔN [THLM]</span>
              <span>THLM-3.1</span>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed text-justify">
              {lessonPlan.interdisciplinaryTHLM}
            </p>
          </div>
        </div>
      </div>

      {/* Document Preview Paper (Standard 5512 Format) */}
      <div className="p-6 sm:p-8 rounded-xl bg-zinc-900 border border-zinc-800 space-y-6">
        <div className="border-b border-zinc-800 pb-4 text-center space-y-1">
          <p className="text-xs text-zinc-400 uppercase tracking-widest">
            KẾ HOẠCH BÀI DẠY CHUẨN CÔNG VĂN 5512/BGDĐT-GDTrH
          </p>
          <h3 className="text-xl font-bold text-white uppercase">
            {lessonPlan.lessonTitle}
          </h3>
          <p className="text-xs text-zinc-300">
            Môn học: <b>{lessonPlan.subject}</b> · Khối lớp: <b>{lessonPlan.grade}</b> · Thời lượng: <b>{lessonPlan.duration}</b>
          </p>
        </div>

        {/* Section I: Objectives */}
        <div className="space-y-3 text-sm text-zinc-200">
          <h4 className="font-bold text-white uppercase tracking-wide text-sm border-l-2 border-cyan-500 pl-3">
            I. MỤC TIÊU BÀI HỌC
          </h4>
          <div className="pl-3 space-y-2 text-justify">
            <p className="font-semibold text-zinc-100">1. Về kiến thức:</p>
            {lessonPlan.knowledgeObjectives.map((item, idx) => (
              <p key={idx} className="text-zinc-300 leading-relaxed">
                - {renderColoredText(item)}
              </p>
            ))}

            <p className="font-semibold text-zinc-100 pt-1">2. Về năng lực:</p>
            {lessonPlan.generalCompetencies.map((item, idx) => (
              <p key={idx} className="text-zinc-300 leading-relaxed">
                - {renderColoredText(item)}
              </p>
            ))}
            {lessonPlan.specificCompetencies.map((item, idx) => (
              <p key={idx} className="text-zinc-300 leading-relaxed">
                - {renderColoredText(item)}
              </p>
            ))}
            <p className="text-zinc-300 leading-relaxed">
              - {renderColoredText(lessonPlan.digitalCompetencyNLS)}
            </p>
            <p className="text-zinc-300 leading-relaxed">
              - {renderColoredText(lessonPlan.aiCompetencyNLAI)}
            </p>
            <p className="text-zinc-300 leading-relaxed">
              - {renderColoredText(lessonPlan.interdisciplinaryTHLM)}
            </p>

            <p className="font-semibold text-zinc-100 pt-1">3. Về phẩm chất:</p>
            {lessonPlan.qualities.map((item, idx) => (
              <p key={idx} className="text-zinc-300 leading-relaxed">
                - {renderColoredText(item)}
              </p>
            ))}
          </div>
        </div>

        {/* Section II: Equipment */}
        <div className="space-y-2 text-sm text-zinc-200">
          <h4 className="font-bold text-white uppercase tracking-wide text-sm border-l-2 border-cyan-500 pl-3">
            II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
          </h4>
          <div className="pl-3 space-y-1.5 text-justify">
            <p className="font-semibold text-zinc-100">1. Đối với giáo viên:</p>
            {lessonPlan.teacherEquipment.map((item, idx) => (
              <p key={idx} className="text-zinc-300">- {renderColoredText(item)}</p>
            ))}
            <p className="font-semibold text-zinc-100 pt-1">2. Đối với học sinh:</p>
            {lessonPlan.studentEquipment.map((item, idx) => (
              <p key={idx} className="text-zinc-300">- {renderColoredText(item)}</p>
            ))}
          </div>
        </div>

        {/* Section III: 4 Teaching Activities */}
        <div className="space-y-6 text-sm text-zinc-200">
          <h4 className="font-bold text-white uppercase tracking-wide text-sm border-l-2 border-cyan-500 pl-3">
            III. TIẾN TRÌNH DẠY HỌC (4 HOẠT ĐỘNG CHUẨN 5512)
          </h4>

          {lessonPlan.activities.map((act) => (
            <div
              key={act.id}
              className="p-5 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                <h5 className="font-bold text-cyan-300 text-sm">
                  {act.title}
                </h5>
                <span className="text-xs text-zinc-400 font-mono">
                  Thời lượng: {act.durationMinutes} phút
                </span>
              </div>

              <div className="space-y-1.5 text-justify text-xs sm:text-sm">
                <p className="font-semibold text-zinc-200">a) Mục tiêu:</p>
                {act.objectives.map((o, i) => (
                  <p key={i} className="text-zinc-300 pl-2">- {renderColoredText(o)}</p>
                ))}

                <p className="font-semibold text-zinc-200 pt-1">b) Nội dung:</p>
                <p className="text-zinc-300 pl-2">- {renderColoredText(act.content)}</p>

                <p className="font-semibold text-zinc-200 pt-1">c) Sản phẩm:</p>
                {act.products.map((p, i) => (
                  <p key={i} className="text-zinc-300 pl-2">- {renderColoredText(p)}</p>
                ))}

                <p className="font-semibold text-zinc-200 pt-2">
                  d) Tổ chức thực hiện (Bảng 2 cột đối ứng chuẩn 5512):
                </p>
              </div>

              {/* 2-Column Corresponding Table */}
              <div className="overflow-x-auto pt-1">
                <table className="w-full border-collapse border border-zinc-700 text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-zinc-900 text-zinc-200">
                      <th className="border border-zinc-700 p-3 text-left w-[52%] font-bold">
                        HOẠT ĐỘNG CỦA GIÁO VIÊN VÀ HỌC SINH
                      </th>
                      <th className="border border-zinc-700 p-3 text-left w-[48%] font-bold">
                        DỰ KIẾN SẢN PHẨM / NỘI DUNG CỐT LÕI
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {act.twoColumnRows.map((row, rIdx) => (
                      <tr key={rIdx} className="align-top hover:bg-zinc-900/40">
                        <td className="border border-zinc-800 p-3.5 space-y-2 text-justify">
                          <p className="font-bold text-white">{row.stepTitle}</p>
                          {row.teacherStudentAction.map((line, lIdx) => (
                            <p key={lIdx} className="text-zinc-300 leading-relaxed">
                              {renderColoredText(line.startsWith('-') ? line : `- ${line}`)}
                            </p>
                          ))}
                        </td>
                        <td className="border border-zinc-800 p-3.5 space-y-2 text-justify bg-zinc-950/50">
                          {row.expectedProduct.map((line, lIdx) => (
                            <p key={lIdx} className="text-emerald-200/90 leading-relaxed">
                              {renderColoredText(
                                line.startsWith('-') || line.startsWith('I') ? line : `- ${line}`
                              )}
                            </p>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

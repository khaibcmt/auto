import React, { useState } from 'react';
import {
  Download,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  Check,
  Upload,
  FileText,
  RotateCcw,
  Presentation,
  Users,
} from 'lucide-react';
import { LessonPlan5512, CompetencyType } from '../types/pedagogyTypes';
import {
  exportLesson5512ToWord,
  exportLesson5512ToHtml,
  detectCompetencyTypeFromText,
} from '../utils/exportHelpers';
import { cleanPedagogyText, buildLessonPlan5512FromInput } from '../data/pedagogyPresets';
import { UniversalPresentationModal } from './UniversalPresentationModal';

interface Lesson5512TabProps {
  lessonPlan: LessonPlan5512;
  onUpdateLessonPlan?: (plan: LessonPlan5512) => void;
  isGenerating: boolean;
  onRegenerate: () => void;
  onSendToTyper: (text: string) => void;
  onOpenSimulator?: () => void;
  onLog: (msg: string, level?: 'info' | 'engine' | 'warning') => void;
}

export const Lesson5512Tab: React.FC<Lesson5512TabProps> = ({
  lessonPlan,
  onUpdateLessonPlan,
  isGenerating,
  onRegenerate,
  onSendToTyper,
  onOpenSimulator,
  onLog,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [savedPlanSnapshot, setSavedPlanSnapshot] = useState<LessonPlan5512>(lessonPlan);
  const [isPresentationOpen, setIsPresentationOpen] = useState<boolean>(false);

  const updatePlan = (next: LessonPlan5512) => {
    setSavedPlanSnapshot(lessonPlan);
    onUpdateLessonPlan?.(next);
  };

  /**
   * Renders a full line of text:
   * - Cleans all bracket tags, minute counts, and redundant strings
   * - Colors the ENTIRE line in Blue (Năng lực số), Red (Năng lực AI), or Yellow/Gold (Tích hợp liên môn)
   */
  const renderFullCompetencyColoredLine = (
    rawText: string,
    forcedType?: CompetencyType
  ) => {
    const cleaned = cleanPedagogyText(rawText);
    const cType = detectCompetencyTypeFromText(rawText, forcedType);

    if (cType === 'NLS') {
      return <span className="text-sky-400 font-bold">{cleaned}</span>;
    }
    if (cType === 'NLAI') {
      return <span className="text-red-400 font-bold">{cleaned}</span>;
    }
    if (cType === 'THLM') {
      return <span className="text-amber-300 font-bold">{cleaned}</span>;
    }
    return <span>{cleaned}</span>;
  };

  // Add a new Teaching Activity
  const handleAddActivity = () => {
    const nextIdx = lessonPlan.activities.length + 1;
    const newAct = {
      id: `act-${Date.now()}`,
      title: `Hoạt động ${nextIdx}: Hoạt động bổ sung`,
      durationMinutes: 0,
      objectives: ['Nêu mục tiêu cần đạt của hoạt động.'],
      content: 'Nội dung nhiệm vụ học tập của học sinh.',
      products: ['Sản phẩm học tập dự kiến của học sinh.'],
      isTwoColumnTable: true,
      twoColumnRows: [
        {
          stepTitle: 'Các bước tổ chức thực hiện',
          teacherStudentAction: [
            '- Giáo viên chuyển giao nhiệm vụ và hướng dẫn học sinh thực hiện.',
            '- Học sinh thảo luận, thực hiện nhiệm vụ và báo cáo kết quả.',
          ],
          expectedProduct: ['- Nội dung kiến thức và sản phẩm đạt được.'],
        },
      ],
    };
    updatePlan({
      ...lessonPlan,
      activities: [...lessonPlan.activities, newAct],
    });
    setIsEditing(true);
    onLog(`Đã thêm ${newAct.title} vào Giáo án`, 'info');
  };

  // Delete a Teaching Activity
  const handleDeleteActivity = (actId: string) => {
    if (lessonPlan.activities.length <= 1) return;
    updatePlan({
      ...lessonPlan,
      activities: lessonPlan.activities.filter((a) => a.id !== actId),
    });
    onLog('Đã xóa hoạt động khỏi Giáo án', 'info');
  };

  // Add a step row inside an Activity's 2-column table
  const handleAddRowToActivity = (actIdx: number) => {
    const nextActs = [...lessonPlan.activities];
    const target = { ...nextActs[actIdx] };
    target.twoColumnRows = [
      ...target.twoColumnRows,
      {
        stepTitle: `Bước ${target.twoColumnRows.length + 1}: Tổ chức thực hiện`,
        teacherStudentAction: ['- Giáo viên hướng dẫn học sinh thực hiện nhiệm vụ.'],
        expectedProduct: ['- Kết quả thực hiện của học sinh.'],
      },
    ];
    nextActs[actIdx] = target;
    updatePlan({ ...lessonPlan, activities: nextActs });
  };

  // Delete a step row inside an Activity
  const handleDeleteRowFromActivity = (actIdx: number, rowIdx: number) => {
    const nextActs = [...lessonPlan.activities];
    const target = { ...nextActs[actIdx] };
    if (target.twoColumnRows.length <= 1) return;
    target.twoColumnRows = target.twoColumnRows.filter((_, i) => i !== rowIdx);
    nextActs[actIdx] = target;
    updatePlan({ ...lessonPlan, activities: nextActs });
  };

  // Upload file (.json or .txt/.doc) to populate Lesson Plan
  const handleUploadLessonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '');
      try {
        const parsed = JSON.parse(content);
        if (parsed && parsed.lessonTitle && Array.isArray(parsed.activities)) {
          updatePlan(parsed as LessonPlan5512);
          onLog(`Đã tải lên Giáo án từ tệp JSON: ${file.name}`, 'engine');
          return;
        }
      } catch {
        // Treat as text document and synthesize clean lesson plan
      }
      const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const firstLine = file.name.replace(/\.[^.]+$/, '') || lessonPlan.lessonTitle;
      const built = buildLessonPlan5512FromInput(
        firstLine,
        lessonPlan.subject,
        lessonPlan.grade,
        plainText
      );
      updatePlan(built);
      onLog(`Đã tải lên và chuẩn hóa Giáo án 12pt từ tệp: ${file.name}`, 'engine');
    };
    reader.readAsText(file);
  };

  const handleExportWord = () => {
    exportLesson5512ToWord(lessonPlan);
    onLog(`Đã tải về Giáo án Word (.doc - Times New Roman 12pt chuẩn màu)`, 'info');
  };

  const handleExportHtml = () => {
    exportLesson5512ToHtml(lessonPlan);
    onLog(`Đã tải về Giáo án Bản in (.html - Times New Roman 12pt giữ nguyên màu sắc)`, 'info');
  };

  const handleSendPlanToTyper = () => {
    const plainLines: string[] = [
      `KẾ HOẠCH BÀI DẠY`,
      `${cleanPedagogyText(lessonPlan.lessonTitle)} (${lessonPlan.subject} - ${lessonPlan.grade})`,
      ``,
      `I. MỤC TIÊU`,
      ...lessonPlan.knowledgeObjectives.map((k) => `- ${cleanPedagogyText(k)}`),
      `- ${cleanPedagogyText(lessonPlan.digitalCompetencyNLS)}`,
      `- ${cleanPedagogyText(lessonPlan.aiCompetencyNLAI)}`,
      `- ${cleanPedagogyText(lessonPlan.interdisciplinaryTHLM)}`,
      ``,
      `II. TIẾN TRÌNH DẠY HỌC`,
      ...lessonPlan.activities.flatMap((a) => [
        cleanPedagogyText(a.title),
        `- Nội dung: ${cleanPedagogyText(a.content)}`,
        ...a.twoColumnRows.flatMap((r) => [
          `  ${cleanPedagogyText(r.stepTitle)}:`,
          ...r.teacherStudentAction.map((t) => `    ${cleanPedagogyText(t)}`),
          ...r.expectedProduct.map((p) => `    ${cleanPedagogyText(p)}`),
        ]),
      ]),
    ];
    onSendToTyper(plainLines.join('\n'));
  };

  return (
    <div className="space-y-6">
      <UniversalPresentationModal
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        initialSourceType="lesson5512"
        lessonPlan={lessonPlan}
        onLog={onLog}
      />

      {/* 3D Action & CRUD Toolbar: Trình chiếu · Lớp học ảo · Thêm · Tải lên · Chỉnh sửa · Xóa · Tải về */}
      <div className="p-5 rounded-2xl bg-zinc-900 border-2 border-cyan-400 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white doc-times-12pt">
            {cleanPedagogyText(lessonPlan.lessonTitle)}
          </h2>
          <p className="text-xs text-cyan-200 mt-0.5">
            Phông chữ chuẩn <b>Times New Roman 12pt</b> · Tự động đồng bộ màu chữ: <span className="text-sky-400 font-bold">Năng lực số (Xanh dương)</span> · <span className="text-red-400 font-bold">Năng lực AI (Đỏ)</span> · <span className="text-amber-300 font-bold">Tích hợp liên môn (Vàng)</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Trình Chiếu Giảng Dạy Full Màn Hình */}
          <button
            onClick={() => {
              setIsPresentationOpen(true);
              onLog('Đã bật Chế Độ Full Màn Hình Trình Chiếu & Giảng Dạy Giáo Án 5512!', 'info');
            }}
            className="btn-3d btn-3d-amber px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-[0_0_18px_rgba(245,158,11,0.45)]"
          >
            <Presentation className="w-4 h-4" />
            <span>Full Màn Hình Trình Chiếu Giảng Dạy</span>
          </button>

          {onOpenSimulator && (
            <button
              onClick={onOpenSimulator}
              className="btn-3d btn-3d-purple px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>Thử Tải Ở Lớp Học Ảo 36 HS</span>
            </button>
          )}

          {/* Thêm */}
          <button
            onClick={handleAddActivity}
            className="btn-3d btn-3d-emerald px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm</span>
          </button>

          {/* Chỉnh sửa */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`btn-3d px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
              isEditing ? 'btn-3d-emerald' : 'btn-3d-amber'
            }`}
          >
            {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span>{isEditing ? 'Hoàn Tất Sửa' : 'Chỉnh Sửa'}</span>
          </button>

          {/* Xóa */}
          <button
            onClick={() => {
              if (lessonPlan.activities.length > 1) {
                const lastAct = lessonPlan.activities[lessonPlan.activities.length - 1];
                handleDeleteActivity(lastAct.id);
              } else {
                setSavedPlanSnapshot(lessonPlan);
                onUpdateLessonPlan?.({
                  ...lessonPlan,
                  knowledgeObjectives: ['Nhấn Khôi Phục Lại hoặc Chỉnh Sửa để nhập nội dung mới.'],
                });
                onLog('Đã xóa bớt nội dung Giáo án (Bấm Khôi Phục Lại để hoàn tác).', 'warning');
              }
            }}
            className="btn-3d btn-3d-rose px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa</span>
          </button>

          {/* Khôi phục lại */}
          <button
            onClick={() => {
              if (savedPlanSnapshot) {
                onUpdateLessonPlan?.(savedPlanSnapshot);
                onLog('Đã khôi phục lại Giáo án 5512 về trạng thái trước đó.', 'info');
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

          {/* Tải lên */}
          <label className="btn-3d btn-3d-purple px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Tải Lên</span>
            <input
              type="file"
              accept=".txt,.doc,.docx,.html,.json"
              onChange={handleUploadLessonFile}
              className="hidden"
            />
          </label>

          {/* Gõ tự động */}
          <button
            onClick={handleSendPlanToTyper}
            className="btn-3d btn-3d-rose px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <span>Gõ Tự Động</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Tải về Word 12pt */}
          <button
            onClick={handleExportWord}
            className="btn-3d btn-3d-cyan px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Tải Về (.DOC 12pt)</span>
          </button>

          {/* Tải về HTML giữ nguyên màu */}
          <button
            onClick={handleExportHtml}
            className="btn-3d btn-3d-emerald px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Tải Bản In (.HTML Chuẩn Màu)</span>
          </button>
        </div>
      </div>

      {/* Document Paper (Times New Roman 12pt Standard) */}
      <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900 border-2 border-cyan-400 space-y-6 doc-times-12pt">
        <div className="border-b border-slate-700 pb-4 text-center space-y-1.5">
          <p className="font-bold text-cyan-300 uppercase tracking-wider">
            KẾ HOẠCH BÀI DẠY
          </p>
          {isEditing ? (
            <div className="max-w-2xl mx-auto space-y-2 pt-1">
              <input
                type="text"
                value={lessonPlan.lessonTitle}
                onChange={(e) => updatePlan({ ...lessonPlan, lessonTitle: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-400 text-center font-bold text-white"
              />
              <div className="flex justify-center gap-3">
                <input
                  type="text"
                  value={lessonPlan.subject}
                  onChange={(e) => updatePlan({ ...lessonPlan, subject: e.target.value })}
                  className="w-40 px-3 py-1 rounded-lg bg-slate-950 border border-cyan-400 text-center text-white"
                />
                <input
                  type="text"
                  value={lessonPlan.grade}
                  onChange={(e) => updatePlan({ ...lessonPlan, grade: e.target.value })}
                  className="w-32 px-3 py-1 rounded-lg bg-slate-950 border border-cyan-400 text-center text-white"
                />
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold text-white uppercase">
                {cleanPedagogyText(lessonPlan.lessonTitle)}
              </h3>
              <p className="text-slate-200">
                Môn học: <b>{cleanPedagogyText(lessonPlan.subject)}</b> · Lớp: <b>{cleanPedagogyText(lessonPlan.grade)}</b>
              </p>
            </>
          )}
        </div>

        {/* Section I: Objectives */}
        <div className="space-y-3 text-slate-100">
          <h4 className="font-bold text-cyan-300 uppercase">
            I. MỤC TIÊU
          </h4>
          <div className="pl-2 space-y-2 text-justify">
            <p className="font-bold text-white">1. Về kiến thức:</p>
            {lessonPlan.knowledgeObjectives.map((item, idx) =>
              isEditing ? (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={cleanPedagogyText(item)}
                    onChange={(e) => {
                      const next = [...lessonPlan.knowledgeObjectives];
                      next[idx] = e.target.value;
                      updatePlan({ ...lessonPlan, knowledgeObjectives: next });
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              ) : (
                <p key={idx} className="leading-relaxed">
                  - {renderFullCompetencyColoredLine(item)}
                </p>
              )
            )}

            <p className="font-bold text-white pt-1">2. Về năng lực:</p>
            {lessonPlan.generalCompetencies.map((item, idx) => (
              <p key={idx} className="leading-relaxed">
                - {renderFullCompetencyColoredLine(item)}
              </p>
            ))}
            {lessonPlan.specificCompetencies.map((item, idx) => (
              <p key={idx} className="leading-relaxed">
                - {renderFullCompetencyColoredLine(item)}
              </p>
            ))}

            {/* 3 Full-Sentence Colored Competencies (Blue = NLS, Red = NLAI, Yellow = THLM) */}
            {isEditing ? (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={cleanPedagogyText(lessonPlan.digitalCompetencyNLS)}
                  onChange={(e) =>
                    updatePlan({ ...lessonPlan, digitalCompetencyNLS: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-sky-400 text-sky-400 font-bold"
                />
                <input
                  type="text"
                  value={cleanPedagogyText(lessonPlan.aiCompetencyNLAI)}
                  onChange={(e) =>
                    updatePlan({ ...lessonPlan, aiCompetencyNLAI: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-red-400 text-red-400 font-bold"
                />
                <input
                  type="text"
                  value={cleanPedagogyText(lessonPlan.interdisciplinaryTHLM)}
                  onChange={(e) =>
                    updatePlan({ ...lessonPlan, interdisciplinaryTHLM: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-400 text-amber-300 font-bold"
                />
              </div>
            ) : (
              <>
                <p className="leading-relaxed">
                  - {renderFullCompetencyColoredLine(lessonPlan.digitalCompetencyNLS, 'NLS')}
                </p>
                <p className="leading-relaxed">
                  - {renderFullCompetencyColoredLine(lessonPlan.aiCompetencyNLAI, 'NLAI')}
                </p>
                <p className="leading-relaxed">
                  - {renderFullCompetencyColoredLine(lessonPlan.interdisciplinaryTHLM, 'THLM')}
                </p>
              </>
            )}

            <p className="font-bold text-white pt-1">3. Về phẩm chất:</p>
            {lessonPlan.qualities.map((item, idx) => (
              <p key={idx} className="leading-relaxed">
                - {renderFullCompetencyColoredLine(item)}
              </p>
            ))}
          </div>
        </div>

        {/* Section II: Equipment */}
        <div className="space-y-2 text-slate-100">
          <h4 className="font-bold text-cyan-300 uppercase">
            II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
          </h4>
          <div className="pl-2 space-y-1.5 text-justify">
            <p className="font-bold text-white">1. Đối với giáo viên:</p>
            {lessonPlan.teacherEquipment.map((item, idx) => (
              <p key={idx}>- {renderFullCompetencyColoredLine(item)}</p>
            ))}
            <p className="font-bold text-white pt-1">2. Đối với học sinh:</p>
            {lessonPlan.studentEquipment.map((item, idx) => (
              <p key={idx}>- {renderFullCompetencyColoredLine(item)}</p>
            ))}
          </div>
        </div>

        {/* Section III: Teaching Activities (Zero minute counts, clean 2-column headers) */}
        <div className="space-y-6 text-slate-100">
          <h4 className="font-bold text-cyan-300 uppercase">
            III. TIẾN TRÌNH DẠY HỌC
          </h4>

          {lessonPlan.activities.map((act, actIdx) => (
            <div
              key={act.id}
              className="p-5 rounded-2xl bg-slate-950/90 border-2 border-sky-400/60 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                {isEditing ? (
                  <input
                    type="text"
                    value={cleanPedagogyText(act.title)}
                    onChange={(e) => {
                      const nextActs = [...lessonPlan.activities];
                      nextActs[actIdx] = { ...act, title: e.target.value };
                      updatePlan({ ...lessonPlan, activities: nextActs });
                    }}
                    className="flex-1 px-3 py-1 rounded-lg bg-slate-900 border border-cyan-400 font-bold text-cyan-300"
                  />
                ) : (
                  <h5 className="font-bold text-cyan-300">
                    {cleanPedagogyText(act.title)}
                  </h5>
                )}

                <div className="flex items-center gap-2">
                  {isEditing && (
                    <button
                      onClick={() => handleAddRowToActivity(actIdx)}
                      className="btn-3d btn-3d-emerald px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Bước</span>
                    </button>
                  )}
                  {lessonPlan.activities.length > 1 && (
                    <button
                      onClick={() => handleDeleteActivity(act.id)}
                      className="btn-3d btn-3d-rose px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                      title="Xóa hoạt động này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-justify">
                <p className="font-bold text-white">a) Mục tiêu:</p>
                {act.objectives.map((o, i) => (
                  <p key={i} className="pl-2">- {renderFullCompetencyColoredLine(o)}</p>
                ))}

                <p className="font-bold text-white pt-1">b) Nội dung:</p>
                {isEditing ? (
                  <textarea
                    value={cleanPedagogyText(act.content)}
                    onChange={(e) => {
                      const nextActs = [...lessonPlan.activities];
                      nextActs[actIdx] = { ...act, content: e.target.value };
                      updatePlan({ ...lessonPlan, activities: nextActs });
                    }}
                    rows={2}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                ) : (
                  <p className="pl-2">- {renderFullCompetencyColoredLine(act.content)}</p>
                )}

                <p className="font-bold text-white pt-1">c) Sản phẩm:</p>
                {act.products.map((p, i) => (
                  <p key={i} className="pl-2">- {renderFullCompetencyColoredLine(p)}</p>
                ))}

                <p className="font-bold text-white pt-2">
                  d) Tổ chức thực hiện:
                </p>
              </div>

              {/* 2-Column Table: HOẠT ĐỘNG CỦA GIÁO VIÊN VÀ HỌC SINH | DỰ KIẾN SẢN PHẨM */}
              <div className="overflow-x-auto pt-1">
                <table className="w-full border-collapse border border-slate-600">
                  <thead>
                    <tr className="bg-slate-900 text-cyan-200">
                      <th className="border border-slate-600 p-3 text-center w-[52%] font-bold">
                        HOẠT ĐỘNG CỦA GIÁO VIÊN VÀ HỌC SINH
                      </th>
                      <th className="border border-slate-600 p-3 text-center w-[48%] font-bold">
                        DỰ KIẾN SẢN PHẨM
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {act.twoColumnRows.map((row, rIdx) => (
                      <tr key={rIdx} className="align-top hover:bg-slate-900/40">
                        <td className="border border-slate-700 p-3.5 space-y-2 text-justify">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-white">
                              {cleanPedagogyText(row.stepTitle)}
                            </p>
                            {isEditing && act.twoColumnRows.length > 1 && (
                              <button
                                onClick={() => handleDeleteRowFromActivity(actIdx, rIdx)}
                                className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa bước</span>
                              </button>
                            )}
                          </div>
                          {isEditing ? (
                            <textarea
                              value={row.teacherStudentAction
                                .map((l) => cleanPedagogyText(l))
                                .join('\n')}
                              onChange={(e) => {
                                const nextActs = [...lessonPlan.activities];
                                const nextRows = [...act.twoColumnRows];
                                nextRows[rIdx] = {
                                  ...row,
                                  teacherStudentAction: e.target.value
                                    .split('\n')
                                    .filter(Boolean),
                                };
                                nextActs[actIdx] = { ...act, twoColumnRows: nextRows };
                                updatePlan({ ...lessonPlan, activities: nextActs });
                              }}
                              rows={4}
                              className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                            />
                          ) : (
                            row.teacherStudentAction.map((line, lIdx) => {
                              const cleaned = cleanPedagogyText(line);
                              return (
                                <p key={lIdx} className="leading-relaxed">
                                  {renderFullCompetencyColoredLine(
                                    cleaned.startsWith('-') ? cleaned : `- ${cleaned}`
                                  )}
                                </p>
                              );
                            })
                          )}
                        </td>
                        <td className="border border-slate-700 p-3.5 space-y-2 text-justify bg-slate-950/60">
                          {isEditing ? (
                            <textarea
                              value={row.expectedProduct
                                .map((l) => cleanPedagogyText(l))
                                .join('\n')}
                              onChange={(e) => {
                                const nextActs = [...lessonPlan.activities];
                                const nextRows = [...act.twoColumnRows];
                                nextRows[rIdx] = {
                                  ...row,
                                  expectedProduct: e.target.value
                                    .split('\n')
                                    .filter(Boolean),
                                };
                                nextActs[actIdx] = { ...act, twoColumnRows: nextRows };
                                updatePlan({ ...lessonPlan, activities: nextActs });
                              }}
                              rows={4}
                              className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                            />
                          ) : (
                            row.expectedProduct.map((line, lIdx) => {
                              const cleaned = cleanPedagogyText(line);
                              return (
                                <p key={lIdx} className="leading-relaxed">
                                  {renderFullCompetencyColoredLine(
                                    cleaned.startsWith('-') || cleaned.startsWith('I')
                                      ? cleaned
                                      : `- ${cleaned}`
                                  )}
                                </p>
                              );
                            })
                          )}
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

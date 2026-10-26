import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Scissors, 
  Ban, 
  CheckCheck, 
  HelpCircle, 
  BookOpen, 
  Sliders, 
  Sparkles,
  ArrowRight,
  RotateCcw,
  Plus,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Language, UserSettings } from '../types';
import { 
  AI_CLICHES, 
  PROSE_RULES, 
  GENERAL_HUMANIZE_RULES, 
  ASSESSMENT_PROSE_RULES, 
  DEFAULT_SYSTEM_PROMPT,
  STACK_OVERFLOW_PROFILES 
} from '../data/proseRules';

interface ProseRulesTabProps {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  language: Language;
  onLog: (msg: string, level?: 'info' | 'hotkey' | 'engine' | 'warning' | 'error') => void;
}

export const ProseRulesTab: React.FC<ProseRulesTabProps> = ({
  settings,
  updateSettings,
  language,
  onLog,
}) => {
  const isVi = language === 'vi';
  const [clicheList, setClicheList] = useState(AI_CLICHES);
  const [isEditingCliches, setIsEditingCliches] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [testSentence, setTestSentence] = useState(
    'Furthermore, it is important to note that leveraging this comprehensive architecture plays a crucial role in navigating the ever-evolving landscape of modern software engineering.'
  );

  const filteredCliches = clicheList.filter(
    (c) =>
      c.phrase.toLowerCase().includes(filterQuery.toLowerCase()) ||
      c.replacement.toLowerCase().includes(filterQuery.toLowerCase())
  );

  // Test sentence character count
  const isSentenceTooLong = testSentence.length > 130;

  const handleSplitSentence = () => {
    // Quick demo splitting
    const split = testSentence
      .replace(/Furthermore,\s*/i, '')
      .replace(/it is important to note that\s*/i, 'Keep in mind: ')
      .replace(/leveraging this comprehensive architecture\s*/i, 'using this architecture ')
      .replace(/plays a crucial role in navigating the ever-evolving landscape of modern software engineering\./i, 'matters in production. It keeps the stack stable.');
    setTestSentence(split);
    onLog(isVi ? 'Đã ngắt câu và thay thế AI cliché' : 'Split sentence and replaced AI clichés', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner with Thêm, Chỉnh Sửa, Xóa, Khôi Phục Lại */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 border border-zinc-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {isVi ? 'Bộ Quy Tắc Văn Phong Chống Phát Hiện AI (Anti-AI Prose Engine)' : 'Anti-AI Prose Rules & Style Engine'}
            </h2>
            <p className="text-sm text-zinc-300 mt-1 max-w-3xl leading-relaxed">
              {isVi 
                ? 'Được trích xuất trực tiếp từ prose_rules.py. Các thuật toán phát hiện AI (GPTZero, Turnitin, Copyleaks) dựa vào độ dài câu đơn điệu (low burstiness), sự thiếu vắng từ rút gọn, và những từ nối sáo rỗng. Bộ quy tắc này triệt tiêu hoàn toàn các dấu hiệu đó.'
                : 'Directly extracted from prose_rules.py. AI detectors look for monotonous sentence lengths (low burstiness), missing contractions, and formulaic transitional phrases. These rules enforce punchy senior engineer prose.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setClicheList((prev) => [
                { phrase: 'in today’s fast-paced world', replacement: 'now / in production' },
                ...prev,
              ]);
              setIsEditingCliches(true);
              onLog('Đã thêm cụm từ cấm mới vào Bộ Quy Tắc Văn Phong.', 'info');
            }}
            className="btn-3d btn-3d-emerald px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isVi ? 'Thêm' : 'Add'}</span>
          </button>

          <button
            onClick={() => setIsEditingCliches(!isEditingCliches)}
            className={`btn-3d px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
              isEditingCliches ? 'btn-3d-emerald' : 'btn-3d-amber'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditingCliches ? 'Hoàn Tất Sửa' : 'Chỉnh Sửa'}</span>
          </button>

          <button
            onClick={() => {
              if (clicheList.length > 1) {
                setClicheList((prev) => prev.slice(1));
                onLog('Đã xóa quy tắc đầu danh sách (Bấm Khôi Phục Lại để lấy lại).', 'warning');
              }
            }}
            className="btn-3d btn-3d-rose px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isVi ? 'Xóa' : 'Delete'}</span>
          </button>

          <button
            onClick={() => {
              setClicheList(AI_CLICHES);
              setTestSentence(
                'Furthermore, it is important to note that leveraging this comprehensive architecture plays a crucial role in navigating the ever-evolving landscape of modern software engineering.'
              );
              onLog('Đã khôi phục lại toàn bộ Bộ Quy Tắc Văn Phong gốc.', 'info');
            }}
            className="btn-3d btn-3d-cyan px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isVi ? 'Khôi Phục Lại' : 'Restore'}</span>
          </button>
        </div>
      </div>

      {/* The 4 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pillar 1: Sentence Cap < 130 Chars */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Scissors className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {isVi ? '1. Giới Hạn Cứng: Câu Dưới 130 Ký Tự' : '1. Hard Sentence Cap (< 130 Chars)'}
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {isVi 
                ? 'Mô hình AI thường tạo ra những câu ghép liên miên dài 180 - 250 ký tự nối bằng "and", "which", dấu gạch ngang em-dash (—) hoặc chấm phẩy (;). Quy tắc yêu cầu ngắt dứt khoát bằng dấu chấm (.).'
                : 'LLMs generate run-on sentences 180-250 chars long joined with em-dashes or semicolons. Break them into tight, punchy sentences with periods.'}
            </p>

            {/* Interactive Sandbox for splitting */}
            <div className="mt-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-400">{isVi ? 'Thử nghiệm ngắt câu:' : 'Sentence break tester:'}</span>
                <span className={`font-mono font-bold ${isSentenceTooLong ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {testSentence.length} / 130 {isSentenceTooLong ? (isVi ? '(Vượt chuẩn)' : '(Over limit)') : (isVi ? '(Chuẩn)' : '(Compliant)')}
                </span>
              </div>
              <textarea
                value={testSentence}
                onChange={(e) => setTestSentence(e.target.value)}
                rows={3}
                className="w-full bg-transparent text-xs text-zinc-200 font-mono resize-none focus:outline-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleSplitSentence}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 text-xs flex items-center gap-1.5 transition-colors font-medium"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isVi ? 'Tự Động Ngắt Câu & Sửa Cliché' : 'Auto Split & Fix'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Natural Contractions */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {isVi ? '2. Từ Rút Gọn Tự Nhiên (Contractions)' : '2. Natural Contractions'}
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {isVi
                ? 'Con người thường xuyên sử dụng từ rút gọn khi viết kỹ thuật: "isn\'t", "won\'t", "that\'s", "it\'s", "I\'d". AI mặc định thường viết dài: "is not", "will not", "that is". Việc chuyển đổi làm câu văn tự nhiên và có hồn hơn.'
                : 'Humans instinctively use contractions in engineering prose ("isn\'t", "won\'t", "that\'s", "I\'d"). Raw AI prefers stiff formal phrasing ("is not", "will not"). Enforcing contractions dramatically raises the human likeness score.'}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-rose-400 line-through block">it is / that is</span>
                <span className="text-emerald-400 font-bold">→ it's / that's</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-rose-400 line-through block">I would / I have</span>
                <span className="text-emerald-400 font-bold">→ I'd / I've</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-rose-400 line-through block">do not / does not</span>
                <span className="text-emerald-400 font-bold">→ don't / doesn't</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                <span className="text-rose-400 line-through block">will not / cannot</span>
                <span className="text-emerald-400 font-bold">→ won't / can't</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pillar 3: Blacklisted AI Clichés Table */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {isVi ? 'Danh Sách Đen Từ Ngữ AI Clichés (Blacklisted Phrases)' : 'Blacklisted AI Cliché Lexicon'}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
              {AI_CLICHES.length} {isVi ? 'cụm từ' : 'phrases'}
            </span>
          </div>

          <input
            type="text"
            placeholder={isVi ? 'Tìm kiếm từ ngữ...' : 'Filter clichés...'}
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[11px] uppercase">
                <th className="py-2 px-3">{isVi ? 'Từ Ngữ AI Hay Dùng (Bị Cấm)' : 'AI Red Flag Phrase'}</th>
                <th className="py-2 px-3">{isVi ? 'Từ Thay Thế Chuẩn Con Người' : 'Recommended Human Alternative'}</th>
                <th className="py-2 px-3 hidden md:table-cell">{isVi ? 'Lý do bị cấm' : 'Detection Rationale'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filteredCliches.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 px-3 text-rose-400 font-bold">
                    {isEditingCliches ? (
                      <input
                        type="text"
                        value={item.phrase}
                        onChange={(e) =>
                          setClicheList((prev) =>
                            prev.map((c, i) => (i === idx ? { ...c, phrase: e.target.value } : c))
                          )
                        }
                        className="px-2 py-1 rounded bg-slate-950 border border-rose-400 text-xs text-rose-300 w-full"
                      />
                    ) : (
                      <span className="line-through">{item.phrase}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400 font-medium">
                    {isEditingCliches ? (
                      <input
                        type="text"
                        value={item.replacement}
                        onChange={(e) =>
                          setClicheList((prev) =>
                            prev.map((c, i) => (i === idx ? { ...c, replacement: e.target.value } : c))
                          )
                        }
                        className="px-2 py-1 rounded bg-slate-950 border border-emerald-400 text-xs text-emerald-300 w-full"
                      />
                    ) : (
                      item.replacement
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 text-[11px] font-sans hidden md:table-cell">
                    {isVi ? 'Từ đệm sáo rỗng đặc trưng của mô hình ngôn ngữ lớn' : 'Signature LLM synthetic filler phrase'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stack Overflow Persona Cards */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {isVi ? 'Hồ Sơ Phong Cách Trả Lời Stack Overflow' : 'Stack Overflow Persona Profiles'}
          </h3>
        </div>
        <p className="text-xs text-zinc-300">
          {isVi
            ? 'Được xây dựng từ việc phân tích câu trả lời thực tế của các kỹ sư hàng đầu thế giới trên Stack Overflow (CC BY-SA).'
            : 'Derived from real public answers by top Stack Overflow engineers with specific sentence lengths and opening habits.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STACK_OVERFLOW_PROFILES.filter(p => p.id !== 'none').map((prof) => {
            const isSelected = settings.soProfileId === prof.id;
            return (
              <div 
                key={prof.id}
                onClick={() => {
                  updateSettings({ soProfileId: prof.id });
                  onLog(`Selected style persona: ${prof.author}`, 'info');
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/50' 
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-white">{prof.label}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    Rep: {prof.reputation}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {prof.topTags.map((tag) => (
                    <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-cyan-400 border border-zinc-800">
                      #{tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-zinc-300 line-clamp-2">
                  {prof.openingStyle}
                </p>
                <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Avg: {prof.avgSentenceLength} words/sentence</span>
                  <span className={isSelected ? 'text-indigo-400 font-bold' : ''}>
                    {isSelected ? '✓ Đang chọn' : 'Nhấp để kích hoạt'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Prompt Customizer */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {isVi ? 'Tùy Chỉnh Lời Nhắc Hệ Thống (System Prompt Editor)' : 'System Prompt Customizer'}
            </h3>
          </div>
          <button
            onClick={() => {
              updateSettings({ customPrompt: DEFAULT_SYSTEM_PROMPT });
              onLog('Reset system prompt to default', 'info');
            }}
            className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isVi ? 'Khôi phục mặc định' : 'Reset default'}</span>
          </button>
        </div>

        <textarea
          value={settings.customPrompt || DEFAULT_SYSTEM_PROMPT}
          onChange={(e) => updateSettings({ customPrompt: e.target.value })}
          rows={8}
          className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500"
        />
      </div>
    </div>
  );
};

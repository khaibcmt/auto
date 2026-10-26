import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Zap, 
  Copy, 
  Check, 
  ArrowRight, 
  RotateCcw, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  HelpCircle,
  TrendingUp,
  Split
} from 'lucide-react';
import { Language, UserSettings } from '../types';
import { 
  HUMANIZE_STRENGTHS, 
  STACK_OVERFLOW_PROFILES, 
  SAMPLE_INPUT_TEXT,
  DEFAULT_SYSTEM_PROMPT
} from '../data/proseRules';
import { CURATED_MODELS, PROVIDERS_META } from '../data/modelCatalog';
import { analyzeProse } from '../utils/proseAnalyzer';
import { ruleBasedHumanize, stripRewritePreamble } from '../utils/ruleBasedHumanizer';

interface HumanizeTabProps {
  settings: UserSettings;
  updateSettings: (partial: Partial<UserSettings>) => void;
  language: Language;
  onSendToTyper: (text: string) => void;
  onLog: (msg: string, level?: 'info' | 'hotkey' | 'engine' | 'warning' | 'error') => void;
}

export const HumanizeTab: React.FC<HumanizeTabProps> = ({
  settings,
  updateSettings,
  language,
  onSendToTyper,
  onLog,
}) => {
  const isVi = language === 'vi';
  const [inputText, setInputText] = useState(SAMPLE_INPUT_TEXT);
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'editor' | 'analysis' | 'diff'>('editor');
  const [showPromptDetails, setShowPromptDetails] = useState(false);

  // Analysis of input and output
  const inputAnalysis = useMemo(() => analyzeProse(inputText), [inputText]);
  const outputAnalysis = useMemo(() => analyzeProse(outputText), [outputText]);

  const activeProfile = STACK_OVERFLOW_PROFILES.find(p => p.id === settings.soProfileId) || STACK_OVERFLOW_PROFILES[0];
  const activeStrength = HUMANIZE_STRENGTHS[settings.strength];

  // Compose the full system prompt matching Python backend
  const composedSystemPrompt = useMemo(() => {
    let prompt = settings.customPrompt.trim() || DEFAULT_SYSTEM_PROMPT;
    if (activeProfile && activeProfile.promptSnippet) {
      prompt += `\n\n--- STYLE PROFILE ---\n${activeProfile.promptSnippet}`;
    }
    if (activeStrength.hint) {
      prompt += `\n\n${activeStrength.hint}`;
    }
    return prompt;
  }, [settings.customPrompt, activeProfile, activeStrength]);

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onLog(isVi ? 'Đã sao chép văn bản humanized vào Clipboard' : 'Copied humanized text to clipboard', 'info');
  };

  const handleLoadSample = () => {
    setInputText(SAMPLE_INPUT_TEXT);
    onLog(isVi ? 'Đã tải bộ câu hỏi mẫu phỏng vấn kỹ sư (answer.txt)' : 'Loaded sample interview assessment text (answer.txt)', 'info');
  };

  // Perform Real API Humanization
  const handleAiHumanize = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    onLog(
      isVi 
        ? `Bắt đầu Humanize qua ${settings.provider} (${settings.model}), chế độ: ${settings.strength}...`
        : `Calling ${settings.provider} (${settings.model}) in ${settings.strength} mode...`,
      'engine'
    );

    try {
      const payload = {
        text: inputText,
        provider: settings.provider,
        model: settings.model,
        systemPrompt: composedSystemPrompt,
        temperature: activeStrength.temperature,
        apiKey: settings.apiKeys[settings.provider] || '',
        ollamaHost: settings.ollamaHost,
      };

      const res = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const finalResult = data.result || '';
      setOutputText(finalResult);
      onLog(
        isVi
          ? `Humanize hoàn tất thành công! (${finalResult.length} ký tự)`
          : `Humanize completed successfully (${finalResult.length} chars)`,
        'engine'
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      onLog(
        isVi
          ? `Lỗi gọi API: ${errMsg}. Đang kích hoạt bộ chuyển đổi thông minh cục bộ (Fallback Engine)...`
          : `API Error: ${errMsg}. Triggering local smart rule-based fallback...`,
        'warning'
      );

      // Smart rule-based fallback
      const fallback = ruleBasedHumanize(inputText, settings.strength);
      setOutputText(fallback);
      onLog(
        isVi
          ? `Hoàn tất chuyển đổi cục bộ bằng bộ quy tắc Anti-AI Cliché (${fallback.length} ký tự).`
          : `Applied rule-based anti-cliche transformation (${fallback.length} chars).`,
        'info'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Client-Side Rule-Based Humanize
  const handleQuickRuleHumanize = () => {
    if (!inputText.trim()) return;
    const res = ruleBasedHumanize(inputText, settings.strength);
    setOutputText(res);
    onLog(
      isVi
        ? `Đã áp dụng chuyển đổi nhanh qua bộ quy tắc quy chuẩn câu < 130 ký tự và loại bỏ AI Cliché`
        : `Applied instant rule-based humanizer (enforcing < 130 chars & removing AI cliches)`,
      'info'
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Bar: Provider, Model, Strength & Style */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Provider Select */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
              {isVi ? 'Nhà cung cấp LLM' : 'LLM Provider'}
            </label>
            <select
              value={settings.provider}
              onChange={(e) => {
                const prov = e.target.value;
                const defaultModel = PROVIDERS_META[prov]?.defaultModel || 'gemini-2.0-flash';
                updateSettings({ provider: prov, model: defaultModel });
                onLog(`Switched provider to ${prov}`, 'info');
              }}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-medium focus:outline-none focus:border-cyan-500"
            >
              {Object.values(PROVIDERS_META).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.id === 'google' ? '(Gemini Native)' : p.id === 'ollama' ? '(Local Free)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Model Select */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
              {isVi ? 'Mô hình AI' : 'Active Model'}
            </label>
            <select
              value={settings.model}
              onChange={(e) => {
                updateSettings({ model: e.target.value });
                onLog(`Selected model: ${e.target.value}`, 'info');
              }}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-medium focus:outline-none focus:border-cyan-500"
            >
              {CURATED_MODELS.filter(m => m.provider === settings.provider).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.badge ? `[${m.badge}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Rewrite Strength */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider flex items-center justify-between">
              <span>{isVi ? 'Mức độ viết lại' : 'Rewrite Strength'}</span>
              <span className="text-[11px] font-mono text-cyan-400">T={activeStrength.temperature}</span>
            </label>
            <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              {(Object.keys(HUMANIZE_STRENGTHS) as Array<keyof typeof HUMANIZE_STRENGTHS>).map((strKey) => {
                const s = HUMANIZE_STRENGTHS[strKey];
                const isSelected = settings.strength === strKey;
                return (
                  <button
                    key={strKey}
                    type="button"
                    onClick={() => updateSettings({ strength: strKey })}
                    className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-zinc-950 font-bold shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {isVi ? s.labelVi : s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Persona / Stack Overflow Style */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
              {isVi ? 'Phong cách Văn phong' : 'Style Profile / Persona'}
            </label>
            <select
              value={settings.soProfileId}
              onChange={(e) => updateSettings({ soProfileId: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 font-medium focus:outline-none focus:border-cyan-500"
            >
              {STACK_OVERFLOW_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Strength explanation banner */}
        <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 font-mono text-[11px]">
              {isVi ? activeStrength.labelVi : activeStrength.label}
            </span>
            <span>{isVi ? activeStrength.descriptionVi : activeStrength.description}</span>
          </div>
          <button
            onClick={() => setShowPromptDetails(!showPromptDetails)}
            className="text-zinc-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showPromptDetails ? (isVi ? 'Ẩn System Prompt' : 'Hide System Prompt') : (isVi ? 'Xem System Prompt' : 'Inspect Prompt')}</span>
          </button>
        </div>

        {/* Collapsible System Prompt Inspector */}
        {showPromptDetails && (
          <div className="mt-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
            <div className="text-zinc-500 text-[11px] mb-1 font-sans">
              {isVi ? 'System instructions gửi tới mô hình AI:' : 'System prompt injected into LLM context:'}
            </div>
            {composedSystemPrompt}
          </div>
        )}
      </div>

      {/* Main Dual-Pane Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Pane: Original Input */}
        <div className="flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
          {/* Header */}
          <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-semibold text-zinc-200">
                {isVi ? 'Văn Bản Gốc (AI / Cần Humanize)' : 'Original Text (Raw / AI)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadSample}
                className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
                title={isVi ? 'Tải tệp câu hỏi mẫu answer.txt' : 'Load sample file answer.txt'}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isVi ? 'Tải Mẫu' : 'Sample'}</span>
              </button>
              <button
                onClick={() => setInputText('')}
                className="text-xs px-2.5 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                {isVi ? 'Xóa' : 'Clear'}
              </button>
            </div>
          </div>

          {/* Text Area */}
          <div className="relative flex-1 p-4 bg-zinc-950/50">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isVi ? 'Dán văn bản bạn muốn humanize tại đây...' : 'Paste text to humanize here...'}
              rows={14}
              className="w-full h-full bg-transparent text-sm text-zinc-100 font-mono leading-relaxed resize-none focus:outline-none"
            />
          </div>

          {/* Input Footer & Analysis Pill */}
          <div className="px-4 py-2.5 bg-zinc-950/90 border-t border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>{inputAnalysis.totalChars} chars</span>
              <span>•</span>
              <span>{inputAnalysis.totalWords} words</span>
              <span>•</span>
              <span>{inputAnalysis.sentenceCount} sents</span>
            </div>
            {/* Quick stats on input */}
            <div className="flex items-center gap-2">
              {inputAnalysis.overLimitCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-amber-400 font-mono text-[11px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <AlertTriangle className="w-3 h-3" />
                  {inputAnalysis.overLimitCount} {isVi ? 'câu > 130 ký tự' : 'sents > 130c'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                  <CheckCircle2 className="w-3 h-3" />
                  {isVi ? 'Độ dài đạt chuẩn' : 'Length compliant'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Pane: Humanized Result */}
        <div className="flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
          {/* Header */}
          <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-zinc-200">
                {isVi ? 'Kết Quả Humanized (Chuẩn Con Người)' : 'Humanized Output'}
              </span>
              {outputText && (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {outputAnalysis.verdict}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {outputText && (
                <>
                  <button
                    onClick={handleCopy}
                    className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? (isVi ? 'Đã chép' : 'Copied') : (isVi ? 'Sao chép' : 'Copy')}</span>
                  </button>
                  <button
                    onClick={() => onSendToTyper(outputText)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 transition-colors flex items-center gap-1.5 font-medium"
                    title={isVi ? 'Chuyển sang bộ giả lập gõ phím AutoTyper' : 'Send to AutoTyper live typing simulator'}
                  >
                    <span>{isVi ? 'Gõ Phím' : 'Send to Typer'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Text Area / View */}
          <div className="relative flex-1 p-4 bg-zinc-950/50">
            {isLoading ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center space-y-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                  <Sparkles className="w-5 h-5 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <p className="text-sm text-zinc-300 font-medium">
                  {isVi ? 'Đang viết lại văn bản theo chuẩn Senior Engineer...' : 'Rewriting prose per senior engineer rules...'}
                </p>
                <p className="text-xs text-zinc-400">
                  {isVi ? 'Loại bỏ từ ngữ AI cliches & điều chỉnh nhịp câu...' : 'Stripping AI preambles & smoothing sentence cadence...'}
                </p>
              </div>
            ) : outputText ? (
              <textarea
                value={outputText}
                onChange={(e) => setOutputText(e.target.value)}
                rows={14}
                className="w-full h-full bg-transparent text-sm text-emerald-300/90 font-mono leading-relaxed resize-none focus:outline-none"
              />
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <Sparkles className="w-8 h-8 mb-2 opacity-30 text-cyan-400" />
                <p className="text-sm font-medium text-zinc-400">
                  {isVi ? 'Chưa có kết quả viết lại' : 'No humanized text yet'}
                </p>
                <p className="text-xs max-w-sm mt-1">
                  {isVi 
                    ? 'Bấm nút "Humanize Với AI" hoặc "Chuyển Đổi Nhanh" bên dưới để tiến hành viết lại văn bản tự nhiên.'
                    : 'Click "Humanize with AI" or "Quick Rule Humanize" below to rewrite text.'}
                </p>
              </div>
            )}
          </div>

          {/* Output Footer & Analysis Pill */}
          <div className="px-4 py-2.5 bg-zinc-950/90 border-t border-zinc-800 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>{outputAnalysis.totalChars} chars</span>
              <span>•</span>
              <span>{outputAnalysis.totalWords} words</span>
              <span>•</span>
              <span>{outputAnalysis.sentenceCount} sents</span>
            </div>
            {outputText && (
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-mono text-[11px] font-bold">
                  {outputAnalysis.humanScore}% {isVi ? 'Điểm Người Viết' : 'Human Score'}
                </span>
                <span>•</span>
                <span className="text-zinc-400 font-mono text-[11px]">
                  {outputAnalysis.contractionsFound.length} {isVi ? 'từ rút gọn' : 'contractions'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <HelpCircle className="w-4 h-4 text-zinc-400" />
          <span>
            {isVi 
              ? 'Phím tắt nhanh: Chọn văn bản và nhấn Ctrl+Shift+H trên bản Desktop hoặc chạy giả lập bên tab AutoTyper.'
              : 'Shortcut tip: Use Ctrl+Shift+H to humanize clipboard on desktop or test in AutoTyper simulator.'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Local Rule Humanize */}
          <button
            onClick={handleQuickRuleHumanize}
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold transition-colors flex items-center gap-2 border border-zinc-700 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{isVi ? 'Chuyển Đổi Nhanh (Local Rules)' : 'Quick Rule Humanize'}</span>
          </button>

          {/* Main AI Humanize */}
          <button
            onClick={handleAiHumanize}
            disabled={isLoading || !inputText.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-cyan-950/50 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? (isVi ? 'Đang Xử Lý...' : 'Rewriting...') : (isVi ? 'Humanize Với AI' : 'Humanize with AI')}</span>
          </button>
        </div>
      </div>

      {/* Prose Shield & AI Likeness Inspection Card */}
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {isVi ? 'Bộ Phân Tích Độ Chuẩn Văn Phong & Chống AI Detection' : 'Prose Quality & AI Detection Shield'}
            </h3>
          </div>
          <span className="text-xs text-zinc-400">
            {isVi ? 'Dựa trên quy chuẩn: Giới hạn 130 ký tự/câu, xóa AI cliches, từ rút gọn' : 'Rules: < 130 chars/sentence, no AI clichés, senior engineer contractions'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Metric 1: Human Score */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">{isVi ? 'Điểm Người Viết (Human Score)' : 'Human Score'}</p>
              <p className={`text-2xl font-bold font-mono mt-1 ${outputAnalysis.verdictColor}`}>
                {outputText ? `${outputAnalysis.humanScore}%` : `${inputAnalysis.humanScore}%`}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {outputText ? outputAnalysis.verdict : inputAnalysis.verdict}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
              <CheckCircle2 className={`w-6 h-6 ${outputAnalysis.verdictColor}`} />
            </div>
          </div>

          {/* Metric 2: Over Limit Sentences */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">{isVi ? 'Câu Vượt 130 Ký Tự (> 130 chars)' : 'Sentences > 130 Chars'}</p>
              <p className="text-2xl font-bold font-mono mt-1 text-zinc-100">
                {outputText ? outputAnalysis.overLimitCount : inputAnalysis.overLimitCount}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {isVi ? 'Quy chuẩn cứng: tách câu dài bằng dấu chấm' : 'Hard cap: split long sentences with period'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
          </div>

          {/* Metric 3: AI Cliches Found */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">{isVi ? 'Từ Ngữ AI Clichés Còn Lại' : 'AI Clichés Present'}</p>
              <p className="text-2xl font-bold font-mono mt-1 text-zinc-100">
                {outputText ? outputAnalysis.clichéMatches.length : inputAnalysis.clichéMatches.length}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {isVi ? 'Loại bỏ: furthermore, delve, robust, leverage...' : 'Target zero: delve, furthermore, robust...'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
              <Split className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Cliché Breakdown if any */}
        {(outputText ? outputAnalysis.clichéMatches : inputAnalysis.clichéMatches).length > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <span className="font-semibold text-amber-300">
              {isVi ? 'Cảnh báo từ ngữ AI phát hiện trong văn bản:' : 'AI cliché patterns detected:'}
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {(outputText ? outputAnalysis.clichéMatches : inputAnalysis.clichéMatches).map((c, i) => (
                <span key={i} className="px-2 py-1 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono">
                  <span className="text-rose-400 line-through mr-1">{c.phrase}</span>
                  <span className="text-emerald-400 font-medium">→ {c.replacement}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

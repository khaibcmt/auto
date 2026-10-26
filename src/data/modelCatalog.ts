/**
 * Model Catalog and Provider Registry updated with the latest generation AI models
 */

export interface ModelItem {
  id: string;
  name: string;
  provider: string;
  contextWindow?: string;
  badge?: string;
  description?: string;
  isPopular?: boolean;
}

export interface ProviderMeta {
  id: string;
  name: string;
  tagline: string;
  badgeClass: string;
  defaultModel: string;
  defaultHost?: string;
  docUrl: string;
}

export const PROVIDERS_META: Record<string, ProviderMeta> = {
  google: {
    id: 'google',
    name: 'Google Gemini',
    tagline: 'Ultra-fast native Gemini 3.8 Flash & Gemini 4 Argon reasoning models',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    defaultModel: 'gemini-3.8-flash',
    docUrl: 'https://ai.google.dev/'
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    tagline: 'GPT-5.2, GPT-5, GPT-4.1, o4-mini, and o3 reasoning series',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    defaultModel: 'gpt-5-mini',
    docUrl: 'https://platform.openai.com/'
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    tagline: 'Claude Opus 4.1, Claude Sonnet 4 & Claude 3.7 Sonnet literary prose',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    defaultModel: 'claude-sonnet-4-20250514',
    docUrl: 'https://console.anthropic.com/'
  },
  groq: {
    id: 'groq',
    name: 'Groq (LPU)',
    tagline: 'Sub-second inference for Llama 3.3 70B, DeepSeek R1 & Qwen 2.5',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    defaultModel: 'llama-3.3-70b-versatile',
    docUrl: 'https://groq.com/'
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local CPU/GPU)',
    tagline: '100% free & private local inference (Llama 3.3, DeepSeek R1, Qwen 2.5)',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    defaultModel: 'llama3.2',
    defaultHost: 'http://127.0.0.1:11434',
    docUrl: 'https://ollama.com/'
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    tagline: 'Unified gateway for Claude 4, GPT-5, DeepSeek R1 & 250+ models',
    badgeClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    defaultModel: 'anthropic/claude-sonnet-4',
    docUrl: 'https://openrouter.ai/'
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    tagline: 'Mistral Large, Pixtral Large & Codestral from Paris',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    defaultModel: 'mistral-large-latest',
    docUrl: 'https://mistral.ai/'
  },
  together: {
    id: 'together',
    name: 'Together AI',
    tagline: 'High-throughput cloud for DeepSeek R1, Llama 3.3 70B & Qwen 2.5 72B',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    docUrl: 'https://together.ai/'
  }
};

export const CURATED_MODELS: ModelItem[] = [
  // Google Gemini (Latest Gen)
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'google', contextWindow: '1M tokens', badge: 'Default & Fast', isPopular: true, description: 'High-speed flagship flash model with natural human-like phrasing and low latency' },
  { id: 'gemini-4-argon', name: 'Gemini 4 Argon (Pro)', provider: 'google', contextWindow: '2M tokens', badge: 'Flagship Gen 4', isPopular: true, description: 'Most advanced reasoning & deep structural rewriting for complex technical text' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', provider: 'google', contextWindow: '1M tokens', badge: 'Ultra Light', description: 'Lightweight, rapid model for high-frequency clipboard humanization' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', provider: 'google', contextWindow: '1M tokens', badge: 'Auto-Updated', description: 'Always points to the latest stable Gemini Flash release' },

  // OpenAI (GPT-5 & GPT-4.1 & o-series)
  { id: 'gpt-5.2', name: 'GPT-5.2 Flagship', provider: 'openai', contextWindow: '256k', badge: 'Newest Gen', isPopular: true, description: 'Latest OpenAI flagship with nuanced senior-engineer prose calibration' },
  { id: 'gpt-5', name: 'GPT-5', provider: 'openai', contextWindow: '256k', badge: 'Flagship', isPopular: true, description: 'Deep context mastery and zero-cliché natural writing' },
  { id: 'gpt-5-mini', name: 'GPT-5 mini', provider: 'openai', contextWindow: '256k', badge: 'Fast & Smart', isPopular: true, description: 'Best balance of speed, cost, and human rhythm' },
  { id: 'gpt-5-nano', name: 'GPT-5 nano', provider: 'openai', contextWindow: '128k', badge: 'Instant', description: 'Sub-second lightweight rewriter for short clipboard snippets' },
  { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai', contextWindow: '1M tokens', badge: '1M Context', description: 'Superior coding & technical documentation rewriting' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 mini', provider: 'openai', contextWindow: '1M tokens', description: 'Fast 1M token context workhorse' },
  { id: 'o4-mini', name: 'o4-mini (Reasoning)', provider: 'openai', contextWindow: '200k', badge: 'Reasoning', description: 'Fast STEM and algorithmic reasoning before rewriting' },
  { id: 'o3', name: 'o3 (Deep Reasoning)', provider: 'openai', contextWindow: '200k', badge: 'Deep STEM', description: 'Full reasoning model for complex architecture & code reviews' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: '128k', description: 'Omni model for general humanization' },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'openai', contextWindow: '128k', description: 'Classic lightweight cloud default' },

  // Anthropic Claude (Claude 4 & 3.7)
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4.1', provider: 'anthropic', contextWindow: '200k', badge: 'Ultimate Literary', isPopular: true, description: 'Unmatched human nuance, dry wit, and indistinguishable organic cadence' },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', contextWindow: '200k', badge: 'Top Pick', isPopular: true, description: 'Gold standard for senior software engineer tone and terse prose' },
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', provider: 'anthropic', contextWindow: '200k', badge: 'Hybrid Thinking', description: 'Extended thinking capability with crisp technical output' },
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', provider: 'anthropic', contextWindow: '200k', description: 'Proven favorite for natural code comments and Q&A' },
  { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', provider: 'anthropic', contextWindow: '200k', badge: 'Rapid', description: 'Fastest Claude model for instant clipboard rewrites' },

  // Groq (LPU Ultra-Fast)
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'groq', contextWindow: '128k', badge: '800+ tok/s', isPopular: true, description: 'Blazingly fast 70B open-weights model on Groq LPU hardware' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', provider: 'groq', contextWindow: '128k', badge: 'Reasoning LPU', isPopular: true, description: 'DeepSeek R1 reasoning at Groq LPU speed' },
  { id: 'qwen-2.5-32b', name: 'Qwen 2.5 32B (Groq)', provider: 'groq', contextWindow: '128k', badge: 'Coding & Prose', description: 'Crisp technical and multilingual humanizer' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'groq', contextWindow: '128k', badge: '1200 tok/s', description: 'Near-zero latency for instant hotkey workflow' },

  // Ollama (Local CPU / GPU)
  { id: 'llama3.2', name: 'Llama 3.2 (Local Default)', provider: 'ollama', contextWindow: '128k', badge: 'Free & Local', isPopular: true, description: 'Runs 100% offline on CPU/GPU without any cloud API requirements' },
  { id: 'llama3.3', name: 'Llama 3.3 70B (Local)', provider: 'ollama', contextWindow: '128k', badge: 'High Quality', description: 'Flagship local Meta model for workstation setups' },
  { id: 'deepseek-r1:8b', name: 'DeepSeek R1 8B (Local)', provider: 'ollama', contextWindow: '64k', badge: 'Local Reasoning', isPopular: true, description: 'Distilled reasoning model running locally via Ollama' },
  { id: 'qwen2.5:14b', name: 'Qwen 2.5 14B (Local)', provider: 'ollama', contextWindow: '128k', description: 'Excellent bilingual (Vietnamese/English) and technical fidelity' },
  { id: 'mistral', name: 'Mistral 7B (Local)', provider: 'ollama', contextWindow: '32k', description: 'Fast European open-weights model with low RAM footprint' },
  { id: 'gemma2', name: 'Gemma 2 9B (Local)', provider: 'ollama', contextWindow: '8k', description: 'Google open-weights model optimized for local consumer hardware' },

  // OpenRouter
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4 (OR)', provider: 'openrouter', contextWindow: '200k', badge: 'Top Router', isPopular: true, description: 'Claude Sonnet 4 routed via OpenRouter' },
  { id: 'openai/gpt-5', name: 'GPT-5 (OR)', provider: 'openrouter', contextWindow: '256k', description: 'OpenAI GPT-5 via unified OpenRouter endpoint' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (OR)', provider: 'openrouter', contextWindow: '128k', badge: 'Reasoning King', isPopular: true, description: 'Full 671B MoE DeepSeek R1 model' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (OR)', provider: 'openrouter', contextWindow: '128k', badge: 'Value Leader', description: 'DeepSeek V3 for clean, direct technical prose' },
  { id: 'google/gemini-3.8-flash', name: 'Gemini 3.8 Flash (OR)', provider: 'openrouter', contextWindow: '1M tokens', description: 'Google Gemini 3.8 Flash via OpenRouter' },

  // Mistral
  { id: 'mistral-large-latest', name: 'Mistral Large 2.1', provider: 'mistral', contextWindow: '128k', badge: 'Flagship EU', isPopular: true, description: 'Top-tier multilingual and dense analytical precision' },
  { id: 'codestral-latest', name: 'Codestral 25.01', provider: 'mistral', contextWindow: '256k', badge: 'Code Specialist', description: 'Ideal for humanizing code review comments and technical docs' },
  { id: 'mistral-small-latest', name: 'Mistral Small 3', provider: 'mistral', contextWindow: '32k', description: 'Low-latency, concise European model' },

  // Together AI
  { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', provider: 'together', contextWindow: '128k', badge: 'FP8 Turbo', isPopular: true, description: 'High-speed quantized Llama 3.3 70B on Together cloud' },
  { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1 Full (Together)', provider: 'together', contextWindow: '128k', badge: 'Full 671B', description: 'Dedicated US/EU hosted DeepSeek R1' },
  { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B Turbo', provider: 'together', contextWindow: '128k', description: 'Strong multilingual and structured prose model' }
];

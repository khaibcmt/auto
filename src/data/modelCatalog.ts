/**
 * Model Catalog and Provider Registry matching model_catalog.py
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
  requiresApiKey: boolean;
  keyPlaceholder: string;
  keyEnvVar: string;
  docUrl: string;
}

export const PROVIDERS_META: Record<string, ProviderMeta> = {
  google: {
    id: 'google',
    name: 'Google Gemini',
    tagline: 'High-speed, native multimodal, integrated Gemini 3.8 / 2.5 models',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    defaultModel: 'gemini-3.8-flash',
    requiresApiKey: false, // Injected via system or optional
    keyPlaceholder: 'AIzaSy... (Automatically provided or custom key)',
    keyEnvVar: 'GEMINI_API_KEY',
    docUrl: 'https://ai.google.dev/'
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    tagline: 'GPT-4o, GPT-4.1, o3-mini and GPT-3.5 turbo series',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    defaultModel: 'gpt-4o-mini',
    requiresApiKey: true,
    keyPlaceholder: 'sk-...',
    keyEnvVar: 'OPENAI_API_KEY',
    docUrl: 'https://platform.openai.com/'
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    tagline: 'Claude 3.7 Sonnet, Claude 3.5 Sonnet & Haiku with nuanced prose',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    defaultModel: 'claude-3-5-sonnet-latest',
    requiresApiKey: true,
    keyPlaceholder: 'sk-ant-...',
    keyEnvVar: 'ANTHROPIC_API_KEY',
    docUrl: 'https://console.anthropic.com/'
  },
  groq: {
    id: 'groq',
    name: 'Groq (LPUs)',
    tagline: 'Ultra-low latency inference for Llama 3.3 70B & Mixtral',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    defaultModel: 'llama-3.3-70b-versatile',
    requiresApiKey: true,
    keyPlaceholder: 'gsk_...',
    keyEnvVar: 'GROQ_API_KEY',
    docUrl: 'https://groq.com/'
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local CPU/GPU)',
    tagline: 'Free, 100% private local inference (Llama 3.2, Mistral, Qwen)',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    defaultModel: 'llama3.2',
    defaultHost: 'http://127.0.0.1:11434',
    requiresApiKey: false,
    keyPlaceholder: 'No API key needed (Connects to localhost:11434)',
    keyEnvVar: 'OLLAMA_HOST',
    docUrl: 'https://ollama.com/'
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    tagline: 'Universal API gateway accessing 200+ open and proprietary models',
    badgeClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    defaultModel: 'openai/gpt-4o-mini',
    requiresApiKey: true,
    keyPlaceholder: 'sk-or-...',
    keyEnvVar: 'OPENROUTER_API_KEY',
    docUrl: 'https://openrouter.ai/'
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral AI',
    tagline: 'Mistral Large, Mistral Small, Codestral from Paris',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    defaultModel: 'mistral-small-latest',
    requiresApiKey: true,
    keyPlaceholder: 'mis_...',
    keyEnvVar: 'MISTRAL_API_KEY',
    docUrl: 'https://mistral.ai/'
  },
  together: {
    id: 'together',
    name: 'Together AI',
    tagline: 'Fast cloud compute for open-source Llama 3.1 70B & Qwen 2.5',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    defaultModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    requiresApiKey: true,
    keyPlaceholder: 'tog_...',
    keyEnvVar: 'TOGETHER_API_KEY',
    docUrl: 'https://together.ai/'
  }
};

export const CURATED_MODELS: ModelItem[] = [
  // Google Gemini
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', provider: 'google', contextWindow: '1M tokens', badge: 'Latest & Fastest', isPopular: true, description: 'Cutting-edge speed with exceptional rewriting fluency' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', contextWindow: '1M tokens', badge: 'Smart & Stable', description: 'Next-gen balanced model for large batch text rewriting' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', contextWindow: '2M tokens', badge: 'Deep Reasoning', description: 'Deep context comprehension for nuanced long-form restructuring' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', contextWindow: '1M tokens', description: 'Balanced lightweight workhorse' },

  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: '128k', badge: 'Flagship', isPopular: true, description: 'Versatile, high fidelity prose and structure retention' },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'openai', contextWindow: '128k', badge: 'Default Cloud', isPopular: true, description: 'Cost-efficient daily humanizer' },
  { id: 'gpt-4.1', name: 'GPT-4.1 Preview', provider: 'openai', contextWindow: '128k', description: 'Next-gen coding and prose capabilities' },
  { id: 'o3-mini', name: 'o3-mini (Reasoning)', provider: 'openai', contextWindow: '200k', badge: 'Reasoning', description: 'Deep analytical decomposition of arguments' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', contextWindow: '16k', description: 'Legacy fast model' },

  // Anthropic Claude
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', provider: 'anthropic', contextWindow: '200k', badge: 'State-of-the-Art', isPopular: true, description: 'Hybrid reasoning and prose indistinguishable from human writing' },
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', provider: 'anthropic', contextWindow: '200k', badge: 'Top Literary', isPopular: true, description: 'Premier choice for eloquent, non-robotic flow' },
  { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', provider: 'anthropic', contextWindow: '200k', badge: 'Rapid', description: 'Swift execution for everyday rewrites' },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic', contextWindow: '200k', description: 'Maximum depth and philosophical rigor' },

  // Groq
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq)', provider: 'groq', contextWindow: '128k', badge: 'Ultra-Fast', isPopular: true, description: 'Sub-second humanization on dedicated LPU hardware' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Groq)', provider: 'groq', contextWindow: '128k', description: 'Instant response time, ~800 tokens/sec' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (Groq)', provider: 'groq', contextWindow: '32k', description: 'Dense MoE model with clean syntax preservation' },

  // Ollama
  { id: 'llama3.2', name: 'Llama 3.2 (3B/1B)', provider: 'ollama', contextWindow: '128k', badge: 'Free & Local', isPopular: true, description: 'Recommended default local model running 100% on CPU/GPU without cloud costs' },
  { id: 'llama3.1:8b', name: 'Llama 3.1 (8B)', provider: 'ollama', contextWindow: '128k', description: 'Higher intelligence local model for mid-range desktops' },
  { id: 'mistral', name: 'Mistral 7B (Ollama)', provider: 'ollama', contextWindow: '32k', description: 'Concise European open weights' },
  { id: 'qwen2.5', name: 'Qwen 2.5 (Ollama)', provider: 'ollama', contextWindow: '32k', description: 'Strong multi-language and logic adherence' },
  { id: 'gemma2', name: 'Gemma 2 (Ollama)', provider: 'ollama', contextWindow: '8k', description: 'Google open weights lightweight model' },

  // Mistral
  { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'mistral', contextWindow: '128k', badge: 'Flagship EU', description: 'Top-tier multilingual and analytical accuracy' },
  { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'mistral', contextWindow: '32k', description: 'Crisp and direct output' },
  { id: 'codestral-latest', name: 'Codestral', provider: 'mistral', contextWindow: '32k', badge: 'Code Focus', description: 'Specialized for code review comments and docstrings' },

  // OpenRouter
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (via OR)', provider: 'openrouter', contextWindow: '200k', description: 'Accessible via unified OpenRouter balance' },
  { id: 'openai/gpt-4o', name: 'GPT-4o (via OR)', provider: 'openrouter', contextWindow: '128k', description: 'OpenRouter routed GPT-4o' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (via OR)', provider: 'openrouter', contextWindow: '64k', badge: 'Value King', isPopular: true, description: 'Leading cost/intelligence performance' }
];

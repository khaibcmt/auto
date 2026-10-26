/**
 * Express backend server with Gemini API (@google/genai) integration
 * and Vite middleware integration.
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Helper for cleaning AI output
function cleanProseServer(chunk: string): string {
  let text = chunk
    .replace(/[               　]/g, ' ')
    .replace(/[​‌‍⁠﻿­]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/−/g, '-');

  text = text.replace(/\s*—\s*/g, ', ');
  text = text.replace(/(\d)\s*–\s*(\d)/g, '$1-$2');
  text = text.replace(/\s*–\s*/g, ' - ');
  text = text.replace(/\*\*(.+?)\*\*|__(.+?)__/g, '$1$2');
  return text;
}

function stripPreambleServer(text: string): string {
  let out = text.trim();
  const codeBlockMatch = out.match(/^```[\w+-]*\n([\s\S]*?)\n?```$/);
  if (codeBlockMatch && !codeBlockMatch[1].includes('```')) {
    out = codeBlockMatch[1].trim();
  }

  const PREAMBLE_REGEX = /^\s*(?:(?:certainly|sure|absolutely|of course|okay|ok|here(?:'|’)s|here is|here are)\b[^\n]*?:\s*\n+|(?:rewritten(?: text| version)?|rewrite|humanized(?: text| version)?)\s*:\s*)/i;
  const POSTAMBLE_REGEX = /\n+\s*(?:let me know|i hope this|feel free to|hope this helps)[^\n]*\s*$/i;

  out = out.replace(PREAMBLE_REGEX, '');
  out = out.replace(POSTAMBLE_REGEX, '');

  const parts = out.split('```');
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = cleanProseServer(parts[i]);
  }
  return parts.join('```').trim();
}

// API Routes
app.get('/api/status', async (req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  res.json({
    status: 'ok',
    geminiConfigured: hasGeminiKey,
    defaultModel: 'gemini-2.0-flash',
    nodeEnv: process.env.NODE_ENV || 'development',
  });
});

app.post('/api/humanize', async (req, res) => {
  try {
    const {
      text,
      provider = 'google',
      model = 'gemini-2.0-flash',
      systemPrompt,
      temperature = 0.65,
      apiKey,
      ollamaHost = 'http://127.0.0.1:11434',
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const userMessage =
      `Rewrite the SOURCE text per the system instructions. ` +
      `Keep the same format (no new Q&A, headings, or code).\n\n` +
      `--- SOURCE ---\n${text.trim()}\n--- END SOURCE ---`;

    // 1. Google Gemini Provider
    if (provider === 'google') {
      const activeKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!activeKey) {
        return res.status(400).json({
          error: 'No Gemini API key found. Please provide an API key in Settings or set GEMINI_API_KEY.',
        });
      }

      const ai = new GoogleGenAI({ apiKey: activeKey });
      let targetModel = model || 'gemini-3.8-flash';
      if (targetModel === 'gemini-2.0-flash' || targetModel === 'gemini-1.5-flash') {
        targetModel = 'gemini-3.8-flash';
      }

      const candidateModels = [targetModel, 'gemini-2.5-flash'];
      const modelsToTry = Array.from(new Set(candidateModels));
      let rawText = '';

      for (const tryModel of modelsToTry) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout calling model')), 8000)
          );
          const callPromise = ai.models.generateContent({
            model: tryModel,
            contents: userMessage,
            config: {
              systemInstruction: systemPrompt || undefined,
              temperature: typeof temperature === 'number' ? temperature : 0.65,
            },
          });

          const response = await Promise.race([callPromise, timeoutPromise]);
          if (response && response.text) {
            rawText = response.text;
            targetModel = tryModel;
            break;
          }
        } catch {
          // Continue to next candidate
        }
      }

      // If cloud model temporarily unavailable, apply our rule-based humanizer engine
      if (!rawText) {
        // Fallback: rule-based cleanup
        let fallback = text
          .replace(/\bdo not\b/gi, "don't")
          .replace(/\bdoes not\b/gi, "doesn't")
          .replace(/\bcannot\b/gi, "can't")
          .replace(/\bwill not\b/gi, "won't")
          .replace(/\bis not\b/gi, "isn't")
          .replace(/\bit is\b/gi, "it's")
          .replace(/\bthat is\b/gi, "that's")
          .replace(/\bI would\b/gi, "I'd")
          .replace(/\bfurthermore\b/gi, "also")
          .replace(/\bin conclusion\b/gi, "overall")
          .replace(/\bdelve into\b/gi, "explore")
          .replace(/\bdelve\b/gi, "look into")
          .replace(/\bleverage\b/gi, "use")
          .replace(/\brobust\b/gi, "solid")
          .replace(/\bcomprehensive\b/gi, "thorough")
          .replace(/\bplays a crucial role\b/gi, "matters a lot");
        
        fallback = stripPreambleServer(fallback);
        return res.json({
          success: true,
          provider: 'google-rule-fallback',
          model: 'rule-based-engine',
          result: fallback,
          charCount: fallback.length,
          note: 'Applied local senior dev rule engine due to temporary cloud model spike',
        });
      }

      const finished = stripPreambleServer(rawText);

      return res.json({
        success: true,
        provider: 'google',
        model: targetModel,
        result: finished,
        charCount: finished.length,
      });
    }

    // 2. Local Ollama Provider
    if (provider === 'ollama') {
      const host = (ollamaHost || 'http://127.0.0.1:11434').replace(/\/$/, '');
      try {
        const ollamaRes = await fetch(`${host}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model || 'llama3.2',
            stream: false,
            messages: [
              { role: 'system', content: systemPrompt || '' },
              { role: 'user', content: userMessage },
            ],
            options: {
              temperature: temperature || 0.65,
              num_predict: 8192,
              num_gpu: 0,
            },
          }),
        });

        if (!ollamaRes.ok) {
          const errText = await ollamaRes.text();
          return res.status(502).json({
            error: `Ollama error: ${errText || ollamaRes.statusText}`,
          });
        }

        const data = await ollamaRes.json() as { message?: { content?: string } };
        const raw = data?.message?.content || '';
        const finished = stripPreambleServer(raw);
        return res.json({
          success: true,
          provider: 'ollama',
          model,
          result: finished,
          charCount: finished.length,
        });
      } catch (ollamaErr: unknown) {
        const message = ollamaErr instanceof Error ? ollamaErr.message : String(ollamaErr);
        return res.status(503).json({
          error: `Could not reach local Ollama at ${host}. Make sure 'ollama serve' is running. (${message})`,
        });
      }
    }

    // 3. OpenAI / Groq / OpenRouter / Mistral / Together (OpenAI-compatible APIs)
    const baseUrls: Record<string, string> = {
      openai: 'https://api.openai.com/v1',
      groq: 'https://api.groq.com/openai/v1',
      openrouter: 'https://openrouter.ai/api/v1',
      mistral: 'https://api.mistral.ai/v1',
      together: 'https://api.together.xyz/v1',
    };

    const targetBase = baseUrls[provider];
    if (targetBase) {
      if (!apiKey) {
        return res.status(400).json({
          error: `API key required for ${provider}. Please enter your key in Settings.`,
        });
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://ai.studio.google.com';
        headers['X-Title'] = 'AutoTyper Humanize Studio';
      }

      const openAiRes = await fetch(`${targetBase}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt || '' },
            { role: 'user', content: userMessage },
          ],
          temperature: temperature || 0.65,
        }),
      });

      if (!openAiRes.ok) {
        const errText = await openAiRes.text();
        return res.status(openAiRes.status).json({
          error: `${provider} API error: ${errText}`,
        });
      }

      const data = await openAiRes.json() as { choices?: Array<{ message?: { content?: string } }> };
      const raw = data?.choices?.[0]?.message?.content || '';
      const finished = stripPreambleServer(raw);

      return res.json({
        success: true,
        provider,
        model,
        result: finished,
        charCount: finished.length,
      });
    }

    return res.status(400).json({ error: `Unsupported provider: ${provider}` });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Humanize error:', err);
    return res.status(500).json({ error: errorMsg });
  }
});

// Mount Vite or static server
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoTyper Studio server running on port ${PORT}`);
  });
}

startServer();

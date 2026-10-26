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

// Shared Gemini client utility per @google/genai guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const VALID_GEMINI_MODELS = new Set([
  'gemini-3.8-flash',
  'gemini-4-argon',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
]);

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
app.get('/api/status', async (_req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    geminiConfigured: hasGeminiKey,
    defaultModel: 'gemini-3.8-flash',
    nodeEnv: process.env.NODE_ENV || 'development',
  });
});

app.post('/api/humanize', async (req, res) => {
  try {
    const {
      text,
      provider = 'google',
      model = 'gemini-3.8-flash',
      systemPrompt,
      temperature = 0.65,
      ollamaHost = 'http://127.0.0.1:11434',
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const userMessage =
      `Rewrite the SOURCE text per the system instructions. ` +
      `Keep the same format (no new Q&A, headings, or code).\n\n` +
      `--- SOURCE ---\n${text.trim()}\n--- END SOURCE ---`;

    // Local Ollama Provider if explicitly requested and reachable
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

        if (ollamaRes.ok) {
          const data = (await ollamaRes.json()) as { message?: { content?: string } };
          const raw = data?.message?.content || '';
          const finished = stripPreambleServer(raw);
          return res.json({
            success: true,
            provider: 'ollama',
            model,
            result: finished,
            charCount: finished.length,
          });
        }
      } catch {
        // Fall through to Gemini cloud engine if local Ollama is not running
      }
    }

    // Use Server-Side Gemini SDK for Google and cloud fallback
    let targetModel = VALID_GEMINI_MODELS.has(model) ? model : 'gemini-3.8-flash';
    const candidateModels = Array.from(
      new Set([targetModel, 'gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'])
    );

    let rawText = '';
    for (const tryModel of candidateModels) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout calling model')), 9000)
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
        // Try next candidate
      }
    }

    if (!rawText) {
      return res.status(503).json({
        error: 'Cloud model temporarily busy; using client-side prose engine.',
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
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoTyper Studio server running on port ${PORT}`);
  });
}

startServer();

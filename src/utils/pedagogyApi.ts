/**
 * Progressive On-Demand Generation & Exponential Backoff API Client (T=0 Structured JSON).
 * Prevents HTTP 429 rate-limiting by executing only the requested module on demand,
 * retrying with 2s / 4s exponential backoff, and falling back to deterministic synthesis on static GitHub Pages.
 */

import {
  LessonPlan5512,
  DifferentiatedExamPackage,
  SlideItem,
  MicroVideoPackage,
  WorksheetAndGamePackage,
} from '../types/pedagogyTypes';
import {
  buildLessonPlan5512FromInput,
  buildExamPackageFromInput,
  buildSlidesFromInput,
  buildMicroVideoFromInput,
  buildWorksheetAndGameFromInput,
} from '../data/pedagogyPresets';
import { runAdversarialAuditInWorker } from './pedagogyWorkerRunner';

export type PedagogyModuleTask =
  | 'lesson5512'
  | 'exam3part'
  | 'slides'
  | 'microvideo'
  | 'worksheet';

async function fetchWithExponentialBackoff(
  url: string,
  options: RequestInit,
  maxRetries = 2
): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(url, options);
      if ((res.status === 429 || res.status === 503) && attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt + 1) * 1000; // 2000ms, 4000ms
        await new Promise((r) => setTimeout(r, delayMs));
        attempt++;
        continue;
      }
      return res;
    } catch (err) {
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt + 1) * 1000;
        await new Promise((r) => setTimeout(r, delayMs));
        attempt++;
        continue;
      }
      throw err;
    }
  }
}

export async function generatePedagogyModuleOnDemand<T>(
  task: PedagogyModuleTask,
  params: {
    lessonTitle: string;
    subject: string;
    grade: string;
    coreKnowledgeText: string;
    model?: string;
  },
  onLog?: (msg: string, level?: 'info' | 'engine' | 'warning') => void
): Promise<{ data: T; source: 'gemini-structured-json' | 'worker-deterministic' }> {
  const { lessonTitle, subject, grade, coreKnowledgeText, model = 'gemini-3.8-flash' } = params;

  try {
    const res = await fetchWithExponentialBackoff(
      '/api/pedagogy',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task,
          lessonTitle,
          subject,
          grade,
          coreKnowledgeText,
          model,
          temperature: 0,
        }),
      },
      1
    );

    if (res.ok) {
      const payload = await res.json();
      if (payload && payload.success && payload.data) {
        // If exam3part, run Web Worker Adversarial Audit on the returned questions
        if (task === 'exam3part' && payload.data.part1) {
          payload.data.auditReport = await runAdversarialAuditInWorker(payload.data.part1);
        }
        onLog?.(
          `Đã sinh module [${task}] qua Gemini Structured JSON (T=0, Schema chuẩn)`,
          'engine'
        );
        return { data: payload.data as T, source: 'gemini-structured-json' };
      }
    }
  } catch {
    // Static GitHub Pages or offline mode -> proceed to Web Worker / deterministic synthesizer
  }

  // Deterministic Synthesis + Background Web Worker (0% UI Freeze, works 100% on GitHub Pages)
  let synthesized: unknown;
  switch (task) {
    case 'lesson5512':
      synthesized = buildLessonPlan5512FromInput(
        lessonTitle,
        subject,
        grade,
        coreKnowledgeText
      ) satisfies LessonPlan5512;
      break;
    case 'exam3part': {
      const pkg = buildExamPackageFromInput(
        lessonTitle,
        subject,
        grade,
        coreKnowledgeText
      );
      pkg.auditReport = await runAdversarialAuditInWorker(pkg.part1);
      synthesized = pkg satisfies DifferentiatedExamPackage;
      break;
    }
    case 'slides':
      synthesized = buildSlidesFromInput(
        lessonTitle,
        subject,
        grade,
        coreKnowledgeText
      ) satisfies SlideItem[];
      break;
    case 'microvideo':
      synthesized = buildMicroVideoFromInput(
        lessonTitle,
        subject,
        grade,
        coreKnowledgeText
      ) satisfies MicroVideoPackage;
      break;
    case 'worksheet':
      synthesized = buildWorksheetAndGameFromInput(
        lessonTitle,
        subject,
        grade,
        coreKnowledgeText
      ) satisfies WorksheetAndGamePackage;
      break;
  }

  onLog?.(
    `Đã tổng hợp module [${task}] bằng Engine Phân Lập & Web Worker (0% UI Freeze)`,
    'info'
  );
  return { data: synthesized as T, source: 'worker-deterministic' };
}

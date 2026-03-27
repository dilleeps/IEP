/**
 * E2E test: IEP PDF extraction via Gemini API
 *
 * Compares three strategies:
 *  1. Monolithic — one Gemini call extracts everything (Pro model)
 *  2. Sectioned  — five parallel Gemini calls, one per section (Pro model)
 *  3. Sectioned  — five parallel Gemini calls, one per section (Flash model)
 *
 * Run:
 *   npx vitest run tests/e2e/iep-extraction.e2e.test.ts --reporter=verbose
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load env manually from .env file (no dotenv dependency)
const envPath = resolve(__dirname, '../../.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env not found — rely on existing env */ }

// ── Config ──────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const PDF_PATH = process.env.TEST_PDF_PATH || '/Users/muthuishere/Downloads/IEP Patel.pdf';

const FLASH_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const PRO_MODEL = 'gemini-2.5-pro';

// ── Schemas (imported inline for self-contained test) ───────────────────────

const goalsSchema = {
  type: 'object',
  properties: {
    goals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          goalText:          { type: 'string' },
          goalName:          { type: 'string' },
          domain:            { type: 'string' },
          baseline:          { type: 'string' },
          target:            { type: 'string' },
          measurementMethod: { type: 'string' },
          criteria:          { type: 'string' },
          frequency:         { type: 'string' },
          startDate:         { type: 'string', format: 'date' },
        },
      },
    },
  },
};

const goalsSystemPrompt = `You are an IEP goals specialist. Extract ONLY annual goals from this document.
For each goal:
- goalText: full goal statement verbatim
- goalName: short title 50 chars max
- domain: one of reading|math|writing|behavior|social|communication|motor|adaptive|self_care_independent_living|vocational|transition|social_emotional|speech_language|occupational_therapy|physical_therapy|other
- baseline: current performance level
- target: expected achievement
- measurementMethod: how progress is measured
- criteria: success criteria e.g. "80% accuracy over 3 trials"
- frequency: e.g. weekly, monthly`;

const monolithicSchema = {
  type: 'object',
  properties: {
    studentName:       { type: 'string' },
    studentDob:        { type: 'string', format: 'date' },
    grade:             { type: 'string' },
    primaryDisability: { type: 'string' },
    iepStartDate:      { type: 'string', format: 'date' },
    iepEndDate:        { type: 'string', format: 'date' },
    iepMeetingDate:    { type: 'string', format: 'date' },
    schoolYear:        { type: 'string' },
    goals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          goalText:          { type: 'string' },
          goalName:          { type: 'string' },
          domain:            { type: 'string' },
          baseline:          { type: 'string' },
          target:            { type: 'string' },
          measurementMethod: { type: 'string' },
          criteria:          { type: 'string' },
          frequency:         { type: 'string' },
        },
      },
    },
    services: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          serviceType:       { type: 'string' },
          provider:          { type: 'string' },
          minutesPerSession: { type: 'number' },
          sessionsPerWeek:   { type: 'number' },
        },
      },
    },
    accommodations: { type: 'array', items: { type: 'string' } },
    modifications:  { type: 'array', items: { type: 'string' } },
    summary:        { type: 'string' },
    redFlags:       { type: 'array', items: { type: 'string' } },
    legalLens:      { type: 'string' },
    confidence: {
      type: 'object',
      properties: {
        overall:  { type: 'number' },
        goals:    { type: 'number' },
        services: { type: 'number' },
        dates:    { type: 'number' },
      },
    },
  },
};

const monolithicSystemPrompt = `You are an IEP document extraction expert. Extract structured data from the IEP document.
Important: Pay close attention to checkboxes, "X" marks, or filled-in boxes.
For goals: extract ALL annual goals. goalName max 50 chars. domain must be one of: reading|math|writing|behavior|social|communication|motor|adaptive|self_care_independent_living|vocational|transition|social_emotional|speech_language|occupational_therapy|physical_therapy|other.
For services: serviceType must be one of: speech_therapy|occupational_therapy|physical_therapy|counseling|behavior_support|transportation|other.
Return YYYY-MM-DD dates. confidence scores 0.0-1.0.`;

// ── Gemini call helper ──────────────────────────────────────────────────────

async function callGemini(
  model: string,
  prompt: string,
  schema: Record<string, any>,
  systemPrompt: string,
  fileData: { mimeType: string; data: string },
  temperature = 0.0,
  maxTokens = 8192,
): Promise<{ result: any; raw: any; durationMs: number }> {
  const contents: any[] = [];

  if (systemPrompt) {
    contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
  }

  contents.push({
    role: 'user',
    parts: [
      { text: prompt },
      { inlineData: { mimeType: fileData.mimeType, data: fileData.data } },
    ],
  });

  const start = Date.now();
  const response = await fetch(
    `${BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      }),
    },
  );
  const durationMs = Date.now() - start;

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini ${response.status}: ${errorText}`);
  }

  const raw = await response.json();
  const jsonText = raw.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const result = JSON.parse(jsonText);

  return { result, raw, durationMs };
}

// ── Load PDF ────────────────────────────────────────────────────────────────

function loadPdf(): { mimeType: string; data: string } {
  const buffer = readFileSync(PDF_PATH);
  return { mimeType: 'application/pdf', data: buffer.toString('base64') };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('IEP PDF Extraction — E2E', () => {
  const fileData = loadPdf();

  it('Strategy 1: Monolithic extraction with Pro model', async () => {
    console.log(`\n🔵 Strategy 1: Monolithic — ${PRO_MODEL}`);

    const { result, raw, durationMs } = await callGemini(
      PRO_MODEL,
      'Extract ALL data from this IEP document: student info, annual goals, services, accommodations, modifications, summary, red flags, legal perspective, and confidence scores.',
      monolithicSchema,
      monolithicSystemPrompt,
      fileData,
      0.0,
      16384,
    );

    console.log(`  ⏱  Duration: ${durationMs}ms`);
    console.log(`  📊 Student: ${result.studentName || 'N/A'}`);
    console.log(`  🎯 Goals extracted: ${result.goals?.length ?? 0}`);
    console.log(`  🔧 Services extracted: ${result.services?.length ?? 0}`);
    console.log(`  📋 Accommodations: ${result.accommodations?.length ?? 0}`);
    console.log(`  ⚠️  Red flags: ${result.redFlags?.length ?? 0}`);
    console.log(`  🔒 Finish reason: ${raw.candidates?.[0]?.finishReason}`);

    if (result.goals?.length > 0) {
      console.log(`  📝 Goals:`);
      result.goals.forEach((g: any, i: number) => {
        console.log(`     ${i + 1}. [${g.domain}] ${g.goalName} — ${(g.goalText || '').slice(0, 100)}...`);
      });
    }

    expect(result.goals?.length).toBeGreaterThan(0);
  }, 120_000);

  it('Strategy 2: Goals-only extraction with Pro model', async () => {
    console.log(`\n🟢 Strategy 2: Goals-only — ${PRO_MODEL}`);

    const { result, raw, durationMs } = await callGemini(
      PRO_MODEL,
      'Extract ALL annual goals from this IEP document. Do not omit any goal.',
      goalsSchema,
      goalsSystemPrompt,
      fileData,
    );

    console.log(`  ⏱  Duration: ${durationMs}ms`);
    console.log(`  🎯 Goals extracted: ${result.goals?.length ?? 0}`);
    console.log(`  🔒 Finish reason: ${raw.candidates?.[0]?.finishReason}`);

    if (result.goals?.length > 0) {
      console.log(`  📝 Goals:`);
      result.goals.forEach((g: any, i: number) => {
        console.log(`     ${i + 1}. [${g.domain}] ${g.goalName} — ${(g.goalText || '').slice(0, 100)}...`);
      });
    }

    expect(result.goals?.length).toBeGreaterThan(0);
  }, 120_000);

  it('Strategy 3: Goals-only extraction with Flash model', async () => {
    console.log(`\n🟡 Strategy 3: Goals-only — ${FLASH_MODEL}`);

    const { result, raw, durationMs } = await callGemini(
      FLASH_MODEL,
      'Extract ALL annual goals from this IEP document. Do not omit any goal.',
      goalsSchema,
      goalsSystemPrompt,
      fileData,
    );

    console.log(`  ⏱  Duration: ${durationMs}ms`);
    console.log(`  🎯 Goals extracted: ${result.goals?.length ?? 0}`);
    console.log(`  🔒 Finish reason: ${raw.candidates?.[0]?.finishReason}`);

    if (result.goals?.length > 0) {
      console.log(`  📝 Goals:`);
      result.goals.forEach((g: any, i: number) => {
        console.log(`     ${i + 1}. [${g.domain}] ${g.goalName} — ${(g.goalText || '').slice(0, 100)}...`);
      });
    }

    expect(result.goals?.length).toBeGreaterThan(0);
  }, 120_000);

  it('Strategy 4: Monolithic extraction with Flash model', async () => {
    console.log(`\n🟠 Strategy 4: Monolithic — ${FLASH_MODEL}`);

    const { result, raw, durationMs } = await callGemini(
      FLASH_MODEL,
      'Extract ALL data from this IEP document: student info, annual goals, services, accommodations, modifications, summary, red flags, legal perspective, and confidence scores.',
      monolithicSchema,
      monolithicSystemPrompt,
      fileData,
      0.0,
      16384,
    );

    console.log(`  ⏱  Duration: ${durationMs}ms`);
    console.log(`  📊 Student: ${result.studentName || 'N/A'}`);
    console.log(`  🎯 Goals extracted: ${result.goals?.length ?? 0}`);
    console.log(`  🔧 Services extracted: ${result.services?.length ?? 0}`);
    console.log(`  📋 Accommodations: ${result.accommodations?.length ?? 0}`);
    console.log(`  ⚠️  Red flags: ${result.redFlags?.length ?? 0}`);
    console.log(`  🔒 Finish reason: ${raw.candidates?.[0]?.finishReason}`);

    if (result.goals?.length > 0) {
      console.log(`  📝 Goals:`);
      result.goals.forEach((g: any, i: number) => {
        console.log(`     ${i + 1}. [${g.domain}] ${g.goalName} — ${(g.goalText || '').slice(0, 100)}...`);
      });
    }

    expect(result.goals?.length).toBeGreaterThan(0);
  }, 120_000);
});

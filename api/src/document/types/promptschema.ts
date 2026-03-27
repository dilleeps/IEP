// ─── Sectioned schemas for parallel extraction ────────────────────────────────

/** Section A — Identity & Dates */
export const metadataSchema = {
  type: 'object',
  properties: {
    iepStartDate:    { type: 'string' },
    iepEndDate:      { type: 'string' },
    iepMeetingDate:  { type: 'string' },
    schoolYear:      { type: 'string' },
    studentName:     { type: 'string' },
    studentDob:      { type: 'string' },
    grade:           { type: 'string' },
    schoolName:      { type: 'string' },
    schoolDistrict:  { type: 'string' },
    homeAddress:     { type: 'string' },
    phoneNumber:     { type: 'string' },
    country:         { type: 'string' },
    primaryDisability:    { type: 'string' },
    secondaryDisability:  { type: 'string' },
    otherDisabilities:    { type: 'array', items: { type: 'string' } },
    documentTypeHint: {
      type: 'string',
      enum: ['iep', 'progress_report', 'evaluation', 'pwn', 'other'],
    },
  },
};
export const metadataSystemPrompt = `You are an IEP document reader. Extract ONLY student identity, school, contact, and date fields from this document.
Return YYYY-MM-DD dates. For disability, extract exactly what appears in the eligibility section (e.g. "Autism", "Specific Learning Disability").
For schoolName, extract the school the student currently attends. For schoolDistrict, extract the district of responsibility or service.
For homeAddress, extract the student's home/residential address if listed. For phoneNumber, extract the parent/guardian phone number if listed.
For country, extract the country if explicitly stated; otherwise infer from the state/district context (e.g. "United States" for US school districts).`;

/** Section B — Goals */
export const goalsSchema = {
  type: 'object',
  properties: {
    goals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          goalText:          { type: 'string', nullable: true },
          goalName:          { type: 'string', nullable: true },
          domain:            { type: 'string', nullable: true },
          baseline:          { type: 'string', nullable: true },
          target:            { type: 'string', nullable: true },
          measurementMethod: { type: 'string', nullable: true },
          criteria:          { type: 'string', nullable: true },
          frequency:         { type: 'string', nullable: true },
          startDate:         { type: 'string', nullable: true },
        },
        required: ['goalText', 'goalName', 'domain'],
      },
    },
  },
  required: ['goals'],
};
export const goalsSystemPrompt = `You are an IEP goals specialist. Extract ONLY annual goals from this document.
For each goal:
- goalText: full goal statement verbatim
- goalName: short title 50 chars max
- domain: one of reading|math|writing|behavior|social|communication|motor|adaptive|self_care_independent_living|vocational|transition|social_emotional|speech_language|occupational_therapy|physical_therapy|other
- baseline: current performance level
- target: expected achievement
- measurementMethod: how progress is measured
- criteria: success criteria e.g. "80% accuracy over 3 trials"
- frequency: e.g. weekly, monthly`;

/** Section C — Services */
export const servicesSchema = {
  type: 'object',
  properties: {
    services: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          serviceType:       { type: 'string' },
          provider:          { type: 'string', nullable: true },
          minutesPerSession: { type: 'number', nullable: true },
          sessionsPerWeek:   { type: 'number', nullable: true },
          startDate:         { type: 'string', nullable: true },
          endDate:           { type: 'string', nullable: true },
        },
        required: ['serviceType'],
      },
    },
  },
  required: ['services'],
};
export const servicesSystemPrompt = `You are an IEP services specialist. Extract ONLY related services from this document.
serviceType must be one of: speech_therapy|occupational_therapy|physical_therapy|counseling|behavior_support|transportation|other.
minutesPerSession and sessionsPerWeek must be numbers.`;

/** Section D — Accommodations & Modifications */
export const supportsSchema = {
  type: 'object',
  properties: {
    accommodations: { type: 'array', items: { type: 'string' } },
    modifications:  { type: 'array', items: { type: 'string' } },
  },
};
export const supportsSystemPrompt = `You are an IEP accommodations specialist. Extract ONLY accommodations and modifications.
- Accommodations: changes to HOW student accesses content (no change to standards)
- Modifications: changes to WHAT is expected (altered content/standards)`;

/** Section E — Analysis (summary, red flags, legal lens, confidence) */
export const analysisSchema = {
  type: 'object',
  properties: {
    summary:   { type: 'string' },
    redFlags:  { type: 'array', items: { type: 'string' } },
    legalLens: { type: 'string' },
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
export const analysisSystemPrompt = `You are a special-education advocate and legal analyst.
Provide:
- summary: 3–5 sentence plain-language overview of the full IEP
- redFlags: list of specific concerns, compliance gaps, vague goals, missing services, or IDEA violations
- legalLens: 2–4 sentence legal/FAPE perspective; note any procedural or substantive issues
- confidence: 0.0–1.0 scores for overall, goals, services, dates based on document quality and completeness`;

// ─── Legacy monolithic schema (kept for backward-compat) ─────────────────────

/**
 * Type definition for the result of the IEP document extraction.
 */
export interface ExtractionResult {
  iepStartDate?: string;
  iepEndDate?: string;
  iepMeetingDate?: string;
  schoolYear?: string;
  studentName?: string;
  studentDob?: string;
  grade?: string;
  schoolName?: string;
  schoolDistrict?: string;
  homeAddress?: string;
  phoneNumber?: string;
  country?: string;
  primaryDisability?: string;
  secondaryDisability?: string;
  otherDisabilities?: string[];
  goals?: Array<{
    goalText: string;
    goalName: string;
    domain: string;
    baseline?: string;
    target?: string;
    measurementMethod?: string;
    criteria?: string;
    frequency?: string;
    startDate?: string;
  }>;
  services?: Array<{
    serviceType: string;
    provider?: string;
    minutesPerSession?: number;
    sessionsPerWeek?: number;
    startDate?: string;
    endDate?: string;
  }>;
  accommodations?: string[];
  modifications?: string[];
  summary?: string;
  redFlags?: string[];
  legalLens?: string;
  metadata: Record<string, any>;
  confidence: Record<string, number>;
}

/**
 * JSON Schema for Gemini structured extraction of IEP data.
 */
export const extractionSchema = {
  type: 'object',
  properties: {
    iepStartDate: { type: 'string' },
    iepEndDate: { type: 'string' },
    iepMeetingDate: { type: 'string' },
    schoolYear: { type: 'string' },
    studentName: { type: 'string' },
    studentDob: { type: 'string' },
    grade: { type: 'string' },
    primaryDisability: { type: 'string' },
    secondaryDisability: { type: 'string' },
    otherDisabilities: { type: 'array', items: { type: 'string' } },
    goals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          goalText: { type: 'string' },
          goalName: { type: 'string' },
          domain: { type: 'string' },
          baseline: { type: 'string' },
          target: { type: 'string' },
          measurementMethod: { type: 'string' },
          criteria: { type: 'string' },
          frequency: { type: 'string' },
          startDate: { type: 'string', nullable: true },
        },
      },
    },
    services: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          serviceType: { type: 'string' },
          provider: { type: 'string' },
          minutesPerSession: { type: 'number' },
          sessionsPerWeek: { type: 'number' },
          startDate: { type: 'string', nullable: true },
          endDate: { type: 'string', nullable: true },
        },
      },
    },
    accommodations: { type: 'array', items: { type: 'string' } },
    modifications: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    redFlags: { type: 'array', items: { type: 'string' } },
    legalLens: { type: 'string' },
    metadata: {
      type: 'object',
      properties: {
        extractionNotes: { type: 'string' },
        documentQuality: { type: 'string' },
      },
    },
    confidence: {
      type: 'object',
      properties: {
        overall: { type: 'number' },
        goals: { type: 'number' },
        services: { type: 'number' },
        dates: { type: 'number' },
      },
    },
  },
};

/**
 * System prompt for the AI to guide it on how to extract and categorize IEP data.
 */
export const systemPrompt = `You are an IEP document extraction expert. Extract structured data from the IEP document text.

Important Analysis Guidelines:
- The document contains many checkboxes, "X" marks, or filled-in boxes (ticked items).
- Pay close attention to these indicators to determine selected options (e.g., Eligibility, Services, Supports).
- Only extract information that is explicitly marked or filled in.
- For lists of categories (like Eligibility/Disability), identify which specific category has been "ticked" or marked.
            
For goals:
- goalText: Full detailed goal description
- goalName: Short title/summary (50 chars max)
- domain: Category - use one of these values: "reading", "math", "writing", "behavior", "social", "communication", "motor", "adaptive", "self_care_independent_living", "vocational", "transition", "social_emotional", "speech_language", "occupational_therapy", "physical_therapy", "other"
- baseline: Current performance level
- target: Expected achievement level
- measurementMethod: How progress is measured
- criteria: Success criteria (e.g., "80% accuracy over 3 trials")
- frequency: Measurement frequency (e.g., "weekly", "monthly")

For services:
- serviceType: "speech_therapy", "occupational_therapy", "physical_therapy", "counseling", "behavior_support", "transportation", or "other"

For disabilities:
- primaryDisability: The main/primary disability classification marked on the IEP (e.g., "Autism", "Specific Learning Disability", "Other Health Impairment")
- secondaryDisability: A second disability category if listed (many IEPs support two disability areas)
- otherDisabilities: Any additional disability categories marked beyond primary and secondary

For confidence: Return a score 0.0-1.0 for each major field indicating extraction confidence.

For summary: Provide a concise overview of the IEP document, highlighting key aspects of the student's needs and planned support.

For redFlags: Identify any concerning issues, gaps, or potential compliance problems in the IEP (e.g., missing services, vague goals, inadequate accommodations, procedural violations).

For legalLens: Provide a legal/compliance perspective on the IEP, noting alignment with IDEA requirements, appropriateness of FAPE, and any legal considerations.

Return properly formatted dates (YYYY-MM-DD) and structured data.`;

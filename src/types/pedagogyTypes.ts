/**
 * Complete TypeScript definitions for AutoTyper Studio Pro v3.0 (10-in-1 Pedagogical Platform)
 */

export type CompetencyType = 'NLS' | 'NLAI' | 'THLM';

export interface CompetencyItem {
  code: string;
  type: CompetencyType;
  label: string;
  description: string;
  activityApplied: string;
}

export interface LessonRow2Col {
  stepTitle: string;
  teacherStudentAction: string[];
  expectedProduct: string[];
  competencyTags?: CompetencyType[];
}

export interface LessonActivity5512 {
  id: string;
  title: string;
  durationMinutes: number;
  objectives: string[];
  content: string;
  products: string[];
  isTwoColumnTable: boolean;
  twoColumnRows: LessonRow2Col[];
}

export interface LessonPlan5512 {
  lessonTitle: string;
  subject: string;
  grade: string;
  duration: string;
  knowledgeObjectives: string[];
  generalCompetencies: string[];
  specificCompetencies: string[];
  digitalCompetencyNLS: string;
  aiCompetencyNLAI: string;
  interdisciplinaryTHLM: string;
  qualities: string[];
  teacherEquipment: string[];
  studentEquipment: string[];
  activities: LessonActivity5512[];
  competencyMap: CompetencyItem[];
}

export type BloomLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';

// Phần I: Trắc nghiệm 4 lựa chọn (A, B, C, D)
export interface ExamPart1Question {
  id: string;
  number: number;
  stem: string;
  options: {
    letter: 'A' | 'B' | 'C' | 'D';
    text: string;
    isCorrect: boolean;
    distractorTrap?: string;
  }[];
  bloomLevel: BloomLevel;
  competencyTag?: CompetencyType;
  explanation: string;
}

export type MultipleChoiceQuestion = ExamPart1Question;

// Phần II: Trắc nghiệm Đúng/Sai 4 ý (a, b, c, d)
export interface ExamPart2Question {
  id: string;
  number: number;
  contextStem: string;
  statements: {
    letter: 'a' | 'b' | 'c' | 'd';
    text: string;
    isTrue: boolean;
    bloomLevel: BloomLevel;
    explanation: string;
  }[];
  competencyTag?: CompetencyType;
}

// Phần III: Trắc nghiệm Trả lời ngắn
export interface ExamPart3Question {
  id: string;
  number: number;
  stem: string;
  correctAnswer: string;
  unitOrNote: string;
  bloomLevel: BloomLevel;
  solutionSteps: string[];
  competencyTag?: CompetencyType;
}

export interface ExamMatrixRow {
  topicNumber: number;
  topicName: string;
  contentUnit: string;
  learningOutcomeSpec: string;
  part1Counts: { biet: number; hieu: number; vanDung: number; vanDungCao: number };
  part2Counts: { biet: number; hieu: number; vanDung: number; vanDungCao: number };
  part3Counts: { biet: number; hieu: number; vanDung: number; vanDungCao: number };
  totalPoints: number;
  percentScore: number;
}

export interface AdversarialFinding {
  questionRef: string;
  severity: 'high' | 'medium' | 'optimal';
  category: string;
  issueDescription: string;
  recommendation: string;
  distractorScore: number;
}

export interface AdversarialAuditReport {
  overallQualityScore: number;
  clarityIndex: number;
  distractorIndex: number;
  bloomBalanceIndex: number;
  duplicateCount: number;
  findings: AdversarialFinding[];
}

export interface DifferentiatedExamPackage {
  examTitle: string;
  subject: string;
  grade: string;
  durationMinutes: number;
  examCode: string;
  part1: ExamPart1Question[];
  part2: ExamPart2Question[];
  part3: ExamPart3Question[];
  matrix: ExamMatrixRow[];
  auditReport: AdversarialAuditReport;
}

// Module 8: Slide Studio (PPTX)
export interface SlideItem {
  slideNumber: number;
  slideType?: 'title' | 'hook' | 'concept' | 'activity' | 'quiz' | 'summary' | string;
  title: string;
  subtitle: string;
  bullets: string[];
  interactiveQuestion?: string;
  competencyHighlight?: CompetencyType;
  speakerNotes: string;
}

// Module 9: Micro-Video Studio (2-3 minutes)
export interface VideoScene {
  sceneNumber: number;
  timeRange: string;
  durationSec: number;
  phase: string;
  visualDirection: string;
  motionEffect: string;
  subtitleText: string;
  voiceoverScript: string;
  accentColor: string;
}

export interface MicroVideoPackage {
  videoTitle: string;
  totalDurationSec: number;
  targetAudience: string;
  hookQuestion: string;
  scenes: VideoScene[];
}

// Module 10: Scaffolding Worksheet & Mini-Game
export interface WorksheetTask {
  taskNumber: number;
  taskTitle: string;
  scaffoldingType?: string;
  instructions: string;
  promptsWithBlanks: string[];
  answerKey: string[];
  competencyTag: CompetencyType;
}

export interface MiniGameQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  points: number;
  timeLimitSec?: number;
  hint: string;
}

export interface WorksheetAndGamePackage {
  worksheetTitle: string;
  studentGroupGuide: string;
  tasks: WorksheetTask[];
  gameTitle: string;
  gameQuestions: MiniGameQuestion[];
}

export interface CentralPedagogyState {
  lessonTitle: string;
  subject: string;
  grade: string;
  coreKnowledgeText: string;
  lessonPlan: LessonPlan5512 | null;
  examPackage: DifferentiatedExamPackage | null;
  slides: SlideItem[] | null;
  microVideo: MicroVideoPackage | null;
  worksheetGame: WorksheetAndGamePackage | null;
}

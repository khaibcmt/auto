/**
 * Complete TypeScript definitions for AutoTyper Studio Pro v3.0 (10-in-1 Pedagogical Platform)
 */

export type CompetencyType = 'NLS' | 'NLAI' | 'THLM';

export interface CompetencyItem {
  code: string;
  type: CompetencyType; // NLS = Blue (Năng lực số), NLAI = Red (Năng lực AI), THLM = Amber (Tích hợp liên môn)
  label: string;
  description: string;
  activityApplied: string;
}

export interface LessonRow2Col {
  stepTitle: string; // Bước 1: Chuyển giao nhiệm vụ, Bước 2: Thực hiện, Bước 3: Báo cáo, Bước 4: Kết luận
  teacherStudentAction: string[]; // Cột 1: Hoạt động của GV & HS (gạch đầu dòng -)
  expectedProduct: string[]; // Cột 2: Dự kiến sản phẩm / Nội dung cốt lõi (gạch đầu dòng -)
  competencyTags: CompetencyType[];
}

export interface LessonActivity5512 {
  id: string;
  title: string; // Hoạt động 1: Khởi động, Hoạt động 2: Hình thành kiến thức mới, Hoạt động 3: Luyện tập, Hoạt động 4: Vận dụng
  durationMinutes: number;
  objectives: string[];
  content: string;
  products: string[];
  isTwoColumnTable: boolean; // True for Activity 2 (and optionally others)
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
  digitalCompetencyNLS: string; // Xanh dương
  aiCompetencyNLAI: string; // Đỏ
  interdisciplinaryTHLM: string; // Vàng
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
  correctAnswer: string; // Đáp số ngắn (tối đa 4 ký tự theo chuẩn mới hoặc cụm ngắn)
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
  category: 'Độ nhiễu phương án (Distractor)' | 'Cấu trúc câu dẫn (Stem)' | 'Ma trận nhận thức (Bloom)' | 'Bẫy độ dài (Length Bias)';
  issueDescription: string;
  recommendation: string;
  distractorScore: number; // 0 - 100
}

export interface AdversarialAuditReport {
  overallQualityScore: number; // 0 - 100
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
  slideType: 'title' | 'hook' | 'concept' | 'activity' | 'quiz' | 'summary';
  title: string;
  subtitle: string;
  bullets: string[];
  interactiveQuestion?: string;
  competencyHighlight?: CompetencyType;
  speakerNotes: string; // Lời thoại giáo viên ở từng slide
}

// Module 9: Micro-Video Studio (2-3 minutes)
export interface VideoScene {
  sceneNumber: number;
  timeRange: string; // e.g. "00:00 - 00:25"
  durationSec: number;
  phase: 'Hook gây tò mò' | 'Đặt vấn đề thực tiễn' | 'Giải mã khái niệm lõi' | 'Thử thách nhanh & Kết nối bài học';
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
  scaffoldingType: 'Khuyết thiếu từ khóa (Cloze)' | 'Bản đồ tư duy 2 cột' | 'Giải quyết tình huống thực tế';
  instructions: string;
  promptsWithBlanks: string[];
  answerKey: string[];
  competencyTag: CompetencyType;
}

export interface MiniGameQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  points: number;
  timeLimitSec: number;
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

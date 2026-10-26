import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Brain,
  Flame,
  Hand,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Award,
  Plus,
  Trash2,
  Edit3,
  Download,
  Upload,
  Send,
  ArrowRight,
  Activity,
  Eye,
  MessageSquareWarning,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { Language } from '../types';
import { cleanPedagogyText } from '../data/pedagogyPresets';
import { detectCompetencyTypeFromText } from '../utils/exportHelpers';

export type StudentCohort = 'A' | 'B' | 'C' | 'D';

export interface VirtualStudentAgent {
  id: string;
  name: string;
  cohort: StudentCohort;
  personaTitle: string;
  cognitiveTrait: string;
  comprehension: number; // 0 - 100
  engagement: number; // 0 - 100
  status: 'focused' | 'questioning' | 'confused' | 'distracted' | 'mastered';
  currentThought: string;
}

export interface SentenceCognitiveAnalysis {
  index: number;
  text: string;
  isMisconceptionRisk: boolean;
  riskCohort: ('B' | 'C' | 'D' | 'A')[];
  riskReason: string;
  suggestedFix: string;
  comprehensionImpact: number;
  engagementImpact: number;
  interruptionQuestion?: {
    studentName: string;
    cohort: StudentCohort;
    questionText: string;
    copilotInjection: string;
  };
}

export interface ActiveClassroomInterruption {
  id: string;
  sentenceIndex: number;
  studentName: string;
  cohort: StudentCohort;
  questionText: string;
  copilotInjection: string;
  resolved: boolean;
  resolutionMethod?: 'teacher' | 'copilot';
  teacherResponse?: string;
}

export const COHORT_META: Record<
  StudentCohort,
  {
    code: StudentCohort;
    badge: string;
    title: string;
    description: string;
    colorClass: string;
    borderClass: string;
    bgClass: string;
  }
> = {
  A: {
    code: 'A',
    badge: 'Học sinh A · Giỏi (Phản biện cao)',
    title: 'Học sinh A (Giỏi – Tư duy phản biện cao)',
    description: 'Luôn tìm kẽ hở logic, đặt câu hỏi vặn vẹo điều kiện biên và bản chất bài học.',
    colorClass: 'text-cyan-300',
    borderClass: 'border-cyan-400/70',
    bgClass: 'bg-cyan-950/70',
  },
  B: {
    code: 'B',
    badge: 'Học sinh B · Trung bình (Dễ ngộ nhận)',
    title: 'Học sinh B (Trung bình – Dễ mắc ngộ nhận)',
    description: 'Hay hiểu sai hoặc đánh đồng giữa hai khái niệm tương đồng nếu thiếu ví dụ đối chiếu.',
    colorClass: 'text-amber-300',
    borderClass: 'border-amber-400/70',
    bgClass: 'bg-amber-950/70',
  },
  C: {
    code: 'C',
    badge: 'Học sinh C · Mất gốc (Thụ động)',
    title: 'Học sinh C (Mất gốc – Thụ động)',
    description: 'Chỉ đọc lướt, dễ choáng ngợp và không hiểu các thuật ngữ học thuật chuyên sâu.',
    colorClass: 'text-rose-300',
    borderClass: 'border-rose-400/70',
    bgClass: 'bg-rose-950/70',
  },
  D: {
    code: 'D',
    badge: 'Học sinh D · Tăng động (Dễ mất tập trung)',
    title: 'Học sinh D (Tăng động / Dễ mất tập trung)',
    description: 'Dễ chán nếu bài giảng dài quá 3 phút mà không có câu hỏi tương tác hoặc hình ảnh trực quan.',
    colorClass: 'text-purple-300',
    borderClass: 'border-purple-400/70',
    bgClass: 'bg-purple-950/70',
  },
};

export const INITIAL_VIRTUAL_STUDENTS: VirtualStudentAgent[] = [
  // Cohort A (9 students)
  { id: 'st-a1', name: 'Nguyễn Minh Quân', cohort: 'A', personaTitle: 'Tư duy phản biện logic', cognitiveTrait: 'Soi điều kiện cần và đủ', comprehension: 92, engagement: 90, status: 'focused', currentThought: 'Đang kiểm chứng tính chặt chẽ của định nghĩa.' },
  { id: 'st-a2', name: 'Trần Bảo Ngọc', cohort: 'A', personaTitle: 'Phân tích hệ thống', cognitiveTrait: 'Tìm ngoại lệ của quy tắc', comprehension: 94, engagement: 88, status: 'focused', currentThought: 'Muốn biết trường hợp biên khi tham số tiến tới 0.' },
  { id: 'st-a3', name: 'Lê Hoàng Nam', cohort: 'A', personaTitle: 'Tư duy phản biện cao', cognitiveTrait: 'Đặt câu hỏi vặn vẹo giả thiết', comprehension: 90, engagement: 86, status: 'questioning', currentThought: 'Tại sao không dùng phương pháp đối chứng nhanh hơn?' },
  { id: 'st-a4', name: 'Phạm Gia Hân', cohort: 'A', personaTitle: 'Tổng hợp liên môn', cognitiveTrait: 'Kết nối thực tiễn và AI', comprehension: 95, engagement: 92, status: 'mastered', currentThought: 'Đã nắm rõ cấu trúc cốt lõi.' },
  { id: 'st-a5', name: 'Vũ Quốc Khánh', cohort: 'A', personaTitle: 'Tư duy thuật toán', cognitiveTrait: 'Kiểm tra độ phức tạp', comprehension: 89, engagement: 85, status: 'focused', currentThought: 'Đang đối chiếu bước chuyển tiếp.' },
  { id: 'st-a6', name: 'Đặng Phương Linh', cohort: 'A', personaTitle: 'Phản biện học thuật', cognitiveTrait: 'Yêu cầu chứng minh tường minh', comprehension: 91, engagement: 89, status: 'focused', currentThought: 'Cần làm rõ mối quan hệ nhân quả ở bước 2.' },
  { id: 'st-a7', name: 'Bùi Tuấn Kiệt', cohort: 'A', personaTitle: 'Sáng tạo giải pháp', cognitiveTrait: 'Thử nghiệm hướng giải ngược', comprehension: 93, engagement: 87, status: 'focused', currentThought: 'Nếu đảo ngược điều kiện thì kết quả ra sao?' },
  { id: 'st-a8', name: 'Đỗ Thùy Dương', cohort: 'A', personaTitle: 'Tư duy định lượng', cognitiveTrait: 'Kiểm tra số liệu thực nghiệm', comprehension: 90, engagement: 91, status: 'focused', currentThought: 'Đang theo dõi sát luận điểm chính.' },
  { id: 'st-a9', name: 'Hoàng Anh Tuấn', cohort: 'A', personaTitle: 'Phản biện mở rộng', cognitiveTrait: 'Đặt câu hỏi ứng dụng thực tế', comprehension: 88, engagement: 84, status: 'focused', currentThought: 'Áp dụng mô hình này ngoài đời thực thế nào?' },

  // Cohort B (10 students)
  { id: 'st-b1', name: 'Nguyễn Tuấn Minh', cohort: 'B', personaTitle: 'Dễ nhầm khái niệm tương đồng', cognitiveTrait: 'Hay lẫn lộn điều kiện X và Y', comprehension: 68, engagement: 78, status: 'questioning', currentThought: 'Tại sao ở bước 2 lại không dùng điều kiện X?' },
  { id: 'st-b2', name: 'Lê Thị Mai', cohort: 'B', personaTitle: 'Học theo mẫu cố định', cognitiveTrait: 'Ngộ nhận khi đổi ký hiệu', comprehension: 65, engagement: 75, status: 'confused', currentThought: 'Hai khái niệm này nghe giống hệt nhau...' },
  { id: 'st-b3', name: 'Trần Văn Hùng', cohort: 'B', personaTitle: 'Trung bình khá', cognitiveTrait: 'Nhầm lẫn nguyên nhân - hệ quả', comprehension: 70, engagement: 80, status: 'focused', currentThought: 'Đang cố phân biệt phần định nghĩa với tính chất.' },
  { id: 'st-b4', name: 'Phạm Ngọc Ánh', cohort: 'B', personaTitle: 'Dễ mắc bẫy nhiễu', cognitiveTrait: 'Nhớ công thức nhưng quên điều kiện', comprehension: 64, engagement: 74, status: 'confused', currentThought: 'Ủa vậy khi nào dùng công thức 1, khi nào dùng công thức 2?' },
  { id: 'st-b5', name: 'Hoàng Đức Duy', cohort: 'B', personaTitle: 'Tư duy trực관 cảm tính', cognitiveTrait: 'Dễ suy diễn quá mức từ ví dụ', comprehension: 67, engagement: 76, status: 'focused', currentThought: 'Cần một bảng so sánh trực diện 2 khái niệm.' },
  { id: 'st-b6', name: 'Vũ Thanh Trúc', cohort: 'B', personaTitle: 'Cẩn thận nhưng chậm', cognitiveTrait: 'Bối rối khi chuyển bước nhanh', comprehension: 69, engagement: 79, status: 'focused', currentThought: 'Bước trung gian vừa rồi hơi nhanh.' },
  { id: 'st-b7', name: 'Đặng Quốc Bảo', cohort: 'B', personaTitle: 'Dễ ngộ nhận thuật ngữ', cognitiveTrait: 'Đánh đồng 2 đại lượng liên đới', comprehension: 62, engagement: 72, status: 'confused', currentThought: 'Đang hiểu nhầm bản chất cơ chế tác động.' },
  { id: 'st-b8', name: 'Bùi Khánh Huyền', cohort: 'B', personaTitle: 'Ghi nhớ máy móc', cognitiveTrait: 'Lúng túng với câu hỏi biến tướng', comprehension: 66, engagement: 77, status: 'focused', currentThought: 'Nếu đề đổi số liệu thì áp dụng sao?' },
  { id: 'st-b9', name: 'Đỗ Minh Khôi', cohort: 'B', personaTitle: 'Trung bình', cognitiveTrait: 'Hay bỏ sót giả thiết phụ', comprehension: 71, engagement: 75, status: 'focused', currentThought: 'Đang ghi chép lại ý chính.' },
  { id: 'st-b10', name: 'Ngô Lan Hương', cohort: 'B', personaTitle: 'Dễ nhầm chiều biến thiên', cognitiveTrait: 'Ngộ nhận tỷ lệ thuận - nghịch', comprehension: 63, engagement: 73, status: 'confused', currentThought: 'Tưởng tăng A thì B cũng phải tăng chứ?' },

  // Cohort C (9 students)
  { id: 'st-c1', name: 'Trần Quốc Trung', cohort: 'C', personaTitle: 'Mất gốc nền tảng', cognitiveTrait: 'Choáng khi gặp từ học thuật dài', comprehension: 42, engagement: 55, status: 'confused', currentThought: 'Nhiều thuật ngữ chuyên môn quá, đọc không hiểu...' },
  { id: 'st-c2', name: 'Nguyễn Hải Yến', cohort: 'C', personaTitle: 'Thụ động đọc lướt', cognitiveTrait: 'Bỏ qua các câu văn dài trên 30 từ', comprehension: 45, engagement: 52, status: 'confused', currentThought: 'Câu này dài quá, chưa nắm được ý chính là gì.' },
  { id: 'st-c3', name: 'Lê Văn Tùng', cohort: 'C', personaTitle: 'Hổng kiến thức lớp dưới', cognitiveTrait: 'Không nhớ khái niệm tiền đề', comprehension: 38, engagement: 48, status: 'confused', currentThought: 'Cần giải thích lại bằng ngôn ngữ đời thường.' },
  { id: 'st-c4', name: 'Phạm Thu Hà', cohort: 'C', personaTitle: 'E ngại phát biểu', cognitiveTrait: 'Im lặng khi không hiểu bài', comprehension: 46, engagement: 58, status: 'confused', currentThought: 'Muốn có hình ảnh hoặc ví dụ thật dễ hiểu.' },
  { id: 'st-c5', name: 'Hoàng Văn Nam', cohort: 'C', personaTitle: 'Đọc lướt bề mặt', cognitiveTrait: 'Chỉ nhớ từ khóa đầu câu', comprehension: 44, engagement: 50, status: 'distracted', currentThought: 'Đang bị quá tải thông tin lý thuyết.' },
  { id: 'st-c6', name: 'Vũ Thị Thảo', cohort: 'C', personaTitle: 'Thụ động ghi chép', cognitiveTrait: 'Chép nguyên văn nhưng không hiểu bản chất', comprehension: 48, engagement: 60, status: 'confused', currentThought: 'Chép kịp nhưng chưa hiểu tại sao làm vậy.' },
  { id: 'st-c7', name: 'Đặng Minh Đức', cohort: 'C', personaTitle: 'Mất gốc thuật ngữ', cognitiveTrait: 'Không hiểu từ Hán Việt học thuật', comprehension: 40, engagement: 49, status: 'confused', currentThought: 'Thuật ngữ này nghĩa tiếng Việt đơn giản là gì ạ?' },
  { id: 'st-c8', name: 'Bùi Ngọc Trâm', cohort: 'C', personaTitle: 'Cần hướng dẫn từng bước', cognitiveTrait: 'Không tự suy luận được bước ẩn', comprehension: 47, engagement: 56, status: 'confused', currentThought: 'Mong thầy cô tách nhỏ câu văn thành gạch đầu dòng.' },
  { id: 'st-c9', name: 'Đỗ Quang Huy', cohort: 'C', personaTitle: 'Yếu tư duy trừu tượng', cognitiveTrait: 'Chỉ hiểu khi có vật thật/mô phỏng', comprehension: 43, engagement: 53, status: 'confused', currentThought: 'Trừu tượng quá, chưa hình dung ra được.' },

  // Cohort D (8 students)
  { id: 'st-d1', name: 'Nguyễn Gia Bảo', cohort: 'D', personaTitle: 'Tăng động / Chu kỳ chú ý ngắn', cognitiveTrait: 'Mất tập trung sau 3 phút độc thoại', comprehension: 58, engagement: 45, status: 'distracted', currentThought: 'Giảng lý thuyết hơi lâu rồi, bao giờ có trò chơi/tương tác?' },
  { id: 'st-d2', name: 'Trần Khánh Duy', cohort: 'D', personaTitle: 'Ưa hoạt động thị giác', cognitiveTrait: 'Chán văn bản thuần chữ kéo dài', comprehension: 60, engagement: 48, status: 'distracted', currentThought: 'Cần câu hỏi đố nhanh hoặc mô phỏng trực quan!' },
  { id: 'st-d3', name: 'Lê Minh Khang', cohort: 'D', personaTitle: 'Dễ phân tâm', cognitiveTrait: 'Tụt hứng thú nếu thiếu tình huống thực tế', comprehension: 55, engagement: 42, status: 'distracted', currentThought: 'Đang nhìn ra ngoài cửa sổ vì đoạn văn dài.' },
  { id: 'st-d4', name: 'Phạm Tuấn Anh', cohort: 'D', personaTitle: 'Năng lượng cao', cognitiveTrait: 'Thích tranh luận & bấm chọn nhanh', comprehension: 62, engagement: 50, status: 'questioning', currentThought: 'Thầy ơi cho cả lớp thử làm 1 câu trắc nghiệm nhanh đi ạ!' },
  { id: 'st-d5', name: 'Hoàng Bảo Long', cohort: 'D', personaTitle: 'Nhanh chán lý thuyết khô khan', cognitiveTrait: 'Cần đổi nhịp điệu bài giảng mỗi 2-3 phút', comprehension: 57, engagement: 46, status: 'distracted', currentThought: 'Đoạn này nhiều chữ quá, hơi buồn ngủ.' },
  { id: 'st-d6', name: 'Vũ Nhật Minh', cohort: 'D', personaTitle: 'Tò mò thực nghiệm', cognitiveTrait: 'Hứng thú cao khi có ví dụ đời sống', comprehension: 64, engagement: 52, status: 'focused', currentThought: 'Chờ xem phần này ứng dụng gì thú vị.' },
  { id: 'st-d7', name: 'Đặng Hải Đăng', cohort: 'D', personaTitle: 'Dễ mất tập trung', cognitiveTrait: 'Bỏ lỡ mạch bài khi giáo viên đọc đều đều', comprehension: 54, engagement: 44, status: 'distracted', currentThought: 'Bị rơi rụng sự chú ý ở đoạn giải thích dài.' },
  { id: 'st-d8', name: 'Bùi Quốc Việt', cohort: 'D', personaTitle: 'Thích tương tác nhóm', cognitiveTrait: 'Tăng 100% tập trung khi được gọi tên', comprehension: 61, engagement: 49, status: 'distracted', currentThought: 'Muốn có hoạt động thảo luận cặp đôi.' },
];

export const DEFAULT_SIMULATOR_LESSON_TEXT = `I. MỤC TIÊU BÀI HỌC
- Năng lực số: Học sinh khai thác phần mềm mô phỏng số và bảng dữ liệu số trực tuyến để quan sát sự biến thiên của đại lượng trong thời gian thực.
- Năng lực trí tuệ nhân tạo: Học sinh sử dụng công cụ AI để kiểm chứng giả thuyết, phân tích sai số và phản biện các nhận định do AI sinh ra.
- Tích hợp liên môn: Vận dụng kiến thức Toán học thống kê, Vật lý thực nghiệm và Tin học ứng dụng để giải quyết bài toán tối ưu hóa trong đời sống.
II. TIẾN TRÌNH DẠY HỌC
Hoạt động 1: Khởi động
- Giáo viên đặt vấn đề về hiện tượng truyền dẫn tín hiệu và biến đổi năng lượng trong hệ thống thông minh nhưng giả sử toàn bộ môi trường là lý tưởng tuyệt đối và bỏ qua ma sát nội tại.
Hoạt động 2: Hình thành kiến thức mới
- Khái niệm đồng bộ hóa pha và điều biến biên độ là hai cơ chế nền tảng có biểu hiện tương đồng trên đồ thị sóng khiến nhiều học sinh dễ đánh đồng bản chất vật lý và toán học của hai quá trình này.
- Ở bước 2 của thuật toán tối ưu hóa vi phân, hệ thống áp dụng trực tiếp định lý hội tụ tiệm cận phi tuyến tính trên không gian đa chiều mà không xét điều kiện biên khởi tạo ban đầu.
- Khi chuỗi lý thuyết kéo dài liên tục qua nhiều mệnh đề học thuật trừu tượng về biến đổi tích phân Fourier, ma trận hiệp phương sai và đạo hàm riêng cấp hai mà thiếu câu hỏi tương tác trực quan, học sinh sẽ nhanh chóng giảm sự tập trung.
Hoạt động 3: Luyện tập và Vận dụng
- Học sinh thực hành thiết kế quy trình kiểm định thực tế và đối chiếu kết quả trên phần mềm mô phỏng số.`;

/**
 * Analyzes lesson text sentence-by-sentence to detect cognitive load, misconception risks for Cohort B/C,
 * logic gaps for Cohort A, and attention drop-offs for Cohort D.
 */
export function analyzeLessonForCognitiveTwin(rawText: string): SentenceCognitiveAnalysis[] {
  const cleaned = cleanPedagogyText(rawText || DEFAULT_SIMULATOR_LESSON_TEXT);
  const rawSentences = cleaned
    .split(/(?<=[.!?;\n])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return rawSentences.map((sentence, idx) => {
    const lower = sentence.toLowerCase();
    const wordCount = sentence.split(/\s+/).length;

    const hasJargonOrAbstract =
      lower.includes('tiệm cận') ||
      lower.includes('phi tuyến') ||
      lower.includes('hiệp phương sai') ||
      lower.includes('biến đổi') ||
      lower.includes('trừu tượng') ||
      lower.includes('đạo hàm') ||
      lower.includes('thuật toán') ||
      lower.includes('không gian đa chiều') ||
      wordCount > 32;

    const hasSimilarConceptTrap =
      lower.includes('tương đồng') ||
      lower.includes('đánh đồng') ||
      lower.includes('bước 2') ||
      lower.includes('điều kiện') ||
      lower.includes('hai cơ chế') ||
      lower.includes('분 biệt') ||
      lower.includes('khái niệm');

    const hasAttentionDrop =
      wordCount > 28 ||
      lower.includes('kéo dài') ||
      lower.includes('thiếu câu hỏi') ||
      (idx > 3 && idx % 3 === 0);

    const hasLogicBoundaryGap =
      lower.includes('lý tưởng tuyệt đối') ||
      lower.includes('bỏ qua') ||
      lower.includes('không xét điều kiện') ||
      lower.includes('giả sử');

    const isMisconceptionRisk =
      hasJargonOrAbstract || hasSimilarConceptTrap || hasLogicBoundaryGap;

    const riskCohort: ('A' | 'B' | 'C' | 'D')[] = [];
    if (hasLogicBoundaryGap) riskCohort.push('A');
    if (hasSimilarConceptTrap) riskCohort.push('B');
    if (hasJargonOrAbstract) riskCohort.push('C');
    if (hasAttentionDrop) riskCohort.push('D');

    let riskReason = 'Câu văn rõ ràng, nhịp độ sư phạm ổn định.';
    let suggestedFix = sentence;
    let interruptionQuestion: SentenceCognitiveAnalysis['interruptionQuestion'] = undefined;

    if (hasSimilarConceptTrap || lower.includes('bước 2')) {
      riskReason =
        'Cảnh báo Ngộ nhận (Nhóm B & C): Hai khái niệm tương đồng hoặc bước chuyển tiếp thiếu điều kiện đối chiếu tường minh khiến học sinh B hiểu sai bản chất.';
      suggestedFix = `${sentence} [Chú giải trực quan cho HS Nhóm B & C: Ta lập bảng đối chiếu 2 tiêu chí cốt lõi và kiểm tra điều kiện biên X trước khi qua bước 2 để tránh nhầm lẫn].`;
      interruptionQuestion = {
        studentName: 'Nguyễn Tuấn Minh (Agent B)',
        cohort: 'B',
        questionText: `Thưa thầy/cô, bạn Minh (Agent B) vừa giơ tay thắc mắc: "Tại sao ở bước này lại không dùng điều kiện X để phân tách hai khái niệm tương đồng trước khi áp dụng công thức ạ?"`,
        copilotInjection: `\n- Ví dụ thực tế giải tỏa thắc mắc (AI Co-pilot chèn tự động): Hãy hình dung điều kiện X giống như van an toàn của bình áp suất; nếu ta kiểm tra điều kiện X ngay từ đầu, ta sẽ phân biệt rõ trường hợp ổn định và trường hợp biến thiên mà không bao giờ nhầm lẫn hai khái niệm này.`,
      };
    } else if (hasLogicBoundaryGap) {
      riskReason =
        'Phản biện Logic (Nhóm A): Học sinh giỏi phát hiện giả thiết lý tưởng hóa bỏ qua ma sát/điều kiện thực tế.';
      suggestedFix = `${sentence} [Mở rộng phản biện cho HS Nhóm A: Trong thực tế có sai số môi trường, ta dùng công cụ AI để mô phỏng hệ số hiệu chỉnh].`;
      interruptionQuestion = {
        studentName: 'Nguyễn Minh Quân (Agent A)',
        cohort: 'A',
        questionText: `Thưa thầy/cô, bạn Quân (Agent A - Tư duy phản biện cao) vừa đặt câu hỏi: "Nếu trong môi trường thực tế không lý tưởng và có nhiễu ngoại cảnh thì quy tắc trên có còn đúng không ạ?"`,
        copilotInjection: `\n- Năng lực trí tuệ nhân tạo: Học sinh sử dụng công cụ AI để chạy mô phỏng đối chứng giữa môi trường lý tưởng và môi trường thực tế có ma sát nhằm đánh giá biên độ sai số.`,
      };
    } else if (hasJargonOrAbstract) {
      riskReason =
        'Quá tải Thuật ngữ (Nhóm C & D): Mật độ thuật ngữ học thuật cao và câu dài trên 30 từ khiến học sinh C mất gốc không theo kịp, học sinh D giảm tập trung.';
      suggestedFix = `${sentence} [Giải nghĩa dễ hiểu cho HS Nhóm C & Câu hỏi tương tác nhanh 30 giây cho HS Nhóm D].`;
      interruptionQuestion = {
        studentName: 'Trần Quốc Trung (Agent C)',
        cohort: 'C',
        questionText: `Thưa thầy/cô, bạn Trung (Agent C - Mất gốc) ngập ngừng hỏi: "Thưa thầy, cụm thuật ngữ học thuật trong câu này nghĩa đời thường là gì ạ? Em đọc lướt qua thấy trừu tượng quá chưa hình dung được!"`,
        copilotInjection: `\n- Năng lực số: Giáo viên mở ngay hình ảnh mô phỏng số trực quan 3D và giải thích bằng ví dụ đời sống hằng ngày trong 30 giây giúp 100% học sinh nắm bắt bản chất ngay lập tức.`,
      };
    } else if (hasAttentionDrop) {
      riskReason =
        'Rơi rụng Chú ý (Nhóm D): Đoạn thuyết giảng liên tục chưa có điểm neo tương tác trực quan.';
      interruptionQuestion = {
        studentName: 'Nguyễn Gia Bảo (Agent D)',
        cohort: 'D',
        questionText: `Thưa thầy/cô, hệ thống Radar phát hiện Nhóm D (Gia Bảo, Khánh Duy) đang giảm tập trung: "Thầy ơi, mình có thể xem một ví dụ thực tế hoặc trả lời nhanh 1 câu hỏi tình huống ở đoạn này không ạ?"`,
        copilotInjection: `\n- Tích hợp liên môn: Giáo viên tổ chức thử thách phản xạ nhanh 45 giây liên hệ thực tiễn đời sống giúp cả lớp hào hứng tương tác 100%.`,
      };
    }

    return {
      index: idx,
      text: sentence,
      isMisconceptionRisk,
      riskCohort,
      riskReason,
      suggestedFix,
      comprehensionImpact: isMisconceptionRisk ? -8 : +4,
      engagementImpact: hasAttentionDrop ? -10 : +5,
      interruptionQuestion,
    };
  });
}

/**
 * Generates an Auto-Evolved version of the lesson that resolves all misconceptions,
 * adds real-world analogies for Cohort B & C, boundary conditions for Cohort A,
 * and interactive micro-hooks for Cohort D, while preserving 12pt Times New Roman & Competency colors.
 */
export function buildAutoEvolvedLesson(rawText: string): string {
  const analyses = analyzeLessonForCognitiveTwin(rawText);
  const evolvedLines: string[] = [];

  analyses.forEach((item, idx) => {
    const cleanedLine = cleanPedagogyText(item.text);
    evolvedLines.push(cleanedLine);

    if (item.isMisconceptionRisk && item.interruptionQuestion) {
      evolvedLines.push(item.interruptionQuestion.copilotInjection.trim());
    } else if (idx === 2 && analyses.length > 3) {
      evolvedLines.push(
        '- Năng lực số: Học sinh tương tác trực tiếp trên biểu đồ mô phỏng số để tự kiểm nghiệm sự khác biệt giữa hai khái niệm tương đồng, giúp triệt tiêu 100% ngộ nhận.'
      );
    }
  });

  // Ensure all 3 competency pillars are present with full-sentence color triggers
  const joined = evolvedLines.join('\n');
  const additions: string[] = [];
  if (!joined.toLowerCase().includes('năng lực số')) {
    additions.push(
      '- Năng lực số: Học sinh thao tác trực tiếp trên học liệu số và phần mềm mô phỏng để trực quan hóa toàn bộ khái niệm trừu tượng.'
    );
  }
  if (!joined.toLowerCase().includes('năng lực trí tuệ nhân tạo') && !joined.toLowerCase().includes('công cụ ai')) {
    additions.push(
      '- Năng lực trí tuệ nhân tạo: Học sinh sử dụng công cụ AI để đặt câu hỏi phản biện, kiểm tra điều kiện biên và phân tích các trường hợp ngoại lệ.'
    );
  }
  if (!joined.toLowerCase().includes('tích hợp liên môn')) {
    additions.push(
      '- Tích hợp liên môn: Kết nối kiến thức bài học với bài toán thực tiễn liên môn thông qua hoạt động tương tác nhanh mỗi 3 phút.'
    );
  }

  return [...evolvedLines, ...additions].join('\n');
}

interface LiveClassroomTwinPanelProps {
  sourceText: string;
  typedText: string;
  isTyping: boolean;
  onInjectCopilotText: (injectedExample: string, updatedFullText: string) => void;
  onPauseTyping?: () => void;
  onResumeTyping?: () => void;
  onOpenFullSimulatorTab?: () => void;
  onLog?: (msg: string, level?: 'info' | 'engine' | 'warning') => void;
}

/**
 * Embedded Real-Time Digital Twin Classroom Companion for AutoTyperTab.
 * Runs in parallel while AutoTyper is typing out text!
 */
export const LiveClassroomTwinPanel: React.FC<LiveClassroomTwinPanelProps> = ({
  sourceText,
  typedText,
  isTyping,
  onInjectCopilotText,
  onPauseTyping,
  onResumeTyping,
  onOpenFullSimulatorTab,
  onLog,
}) => {
  const [DismissedIndices, setDismissedIndices] = useState<number[]>([]);
  const [teacherAnswer, setTeacherAnswer] = useState('');
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [copilotCount, setCopilotCount] = useState(0);
  const [teacherAgilityScore, setTeacherAgilityScore] = useState(88);

  const sentenceAnalyses = useMemo(
    () => analyzeLessonForCognitiveTwin(sourceText),
    [sourceText]
  );

  // Determine how many sentences have been typed so far
  const activeTypedRatio =
    sourceText.length > 0
      ? Math.min(1, typedText.length / Math.max(1, sourceText.length))
      : 0;

  const activeSentenceCount = Math.max(
    1,
    Math.ceil(activeTypedRatio * sentenceAnalyses.length)
  );

  const visibleAnalyses = sentenceAnalyses.slice(0, activeSentenceCount);

  // Compute live metrics based on currently typed sentences + Co-pilot interventions
  const riskSentencesSoFar = visibleAnalyses.filter((s) => s.isMisconceptionRisk).length;
  const resolvedCount = DismissedIndices.length + copilotCount;

  const liveComprehension = Math.min(
    99,
    Math.max(
      52,
      Math.round(86 - riskSentencesSoFar * 6 + resolvedCount * 9 + (activeTypedRatio > 0.8 ? 4 : 0))
    )
  );

  const liveEngagement = Math.min(
    98,
    Math.max(
      48,
      Math.round(88 - Math.floor(activeSentenceCount / 3) * 5 + copilotCount * 10)
    )
  );

  const passProbability = Math.min(
    98,
    Math.round(liveComprehension * 0.65 + liveEngagement * 0.35)
  );

  // Check if there is an active hand-raise interruption in the currently typed sentences
  const currentInterruption = useMemo(() => {
    if (typedText.length < 25) return null;
    for (let i = visibleAnalyses.length - 1; i >= 0; i--) {
      const item = visibleAnalyses[i];
      if (
        item.isMisconceptionRisk &&
        item.interruptionQuestion &&
        !DismissedIndices.includes(item.index)
      ) {
        return item;
      }
    }
    return null;
  }, [visibleAnalyses, typedText.length, DismissedIndices]);

  const handleCopilotSteer = (item: SentenceCognitiveAnalysis) => {
    if (!item.interruptionQuestion) return;
    const injection = item.interruptionQuestion.copilotInjection;
    const updatedSource = `${sourceText.trim()}\n${injection.trim()}`;
    onInjectCopilotText(injection, updatedSource);
    setDismissedIndices((prev) => [...prev, item.index]);
    setCopilotCount((c) => c + 1);
    setTeacherAgilityScore((s) => Math.min(100, s + 4));
    onLog?.(
      `AI Co-pilot đã tự động bẻ lái mạch bài giảng & chèn ví dụ thực tế giải tỏa thắc mắc của ${item.interruptionQuestion.studentName}!`,
      'engine'
    );
    onResumeTyping?.();
  };

  const handleTeacherDirectAnswer = (item: SentenceCognitiveAnalysis) => {
    if (!teacherAnswer.trim()) return;
    const injection = `\n- Giải đáp trực tiếp của Giáo viên cho ${item.interruptionQuestion?.studentName}: ${teacherAnswer.trim()}`;
    const updatedSource = `${sourceText.trim()}\n${injection.trim()}`;
    onInjectCopilotText(injection, updatedSource);
    setDismissedIndices((prev) => [...prev, item.index]);
    setTeacherAnswer('');
    setShowAnswerInput(false);
    setCopilotCount((c) => c + 1);
    setTeacherAgilityScore((s) => Math.min(100, s + 5));
    onLog?.(
      `Giáo viên đã trực tiếp giải đáp thắc mắc của ${item.interruptionQuestion?.studentName} (Chỉ số ứng biến sư phạm: ${Math.min(100, teacherAgilityScore + 5)}/100).`,
      'info'
    );
    onResumeTyping?.();
  };

  const handleAutoEvolveInline = () => {
    const evolved = buildAutoEvolvedLesson(sourceText);
    onInjectCopilotText('', evolved);
    setCopilotCount((c) => c + 3);
    setTeacherAgilityScore(99);
    onLog?.(
      'Đã kích hoạt Auto-Evolve (Tiến hóa bài giảng 1-Click): Đã tối ưu hóa toàn bộ câu từ gây ngộ nhận cho 36 học sinh ảo!',
      'engine'
    );
  };

  return (
    <div className="frame-3d p-5 rounded-2xl bg-slate-900/95 border-2 border-cyan-400/70 space-y-4">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-sky-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                Digital Twin Classroom Simulator · Lớp Học Ảo 36 Học Sinh AI Chạy Song Song
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                  isTyping
                    ? 'bg-emerald-500 text-slate-950 animate-pulse'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                }`}
              >
                {isTyping ? 'ĐANG ĐỌC THEO TỐC ĐỘ GÕ REAL-TIME' : 'SẴN SÀNG THỬ TẢI'}
              </span>
            </div>
            <p className="text-xs text-sky-200">
              36 Agent Học Sinh (Nhóm A Giỏi Phản Biện · Nhóm B Dễ Ngộ Nhận · Nhóm C Mất Gốc · Nhóm D Dễ Mất Tập Trung) đang phân tích văn bản theo thời gian thực
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAutoEvolveInline}
            className="btn-3d btn-3d-amber px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            title="Tự động viết lại bài giảng dựa trên các vấp váp của học sinh ảo"
          >
            <Sparkles className="w-4 h-4" />
            <span>Auto-Evolve (Tiến Hóa Bài Giảng)</span>
          </button>
          {onOpenFullSimulatorTab && (
            <button
              onClick={onOpenFullSimulatorTab}
              className="btn-3d btn-3d-purple px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <Brain className="w-4 h-4" />
              <span>Mở Phòng Lab 36 Học Sinh Toàn Màn Hình</span>
            </button>
          )}
        </div>
      </div>

      {/* Cognitive Dashboard 4 Live Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/40">
          <div className="flex items-center justify-between text-xs text-cyan-200 mb-1">
            <span className="font-bold flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
              Mức Độ Hiểu Bài (Comprehension)
            </span>
            <span className="text-base font-black text-cyan-300">{liveComprehension}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${liveComprehension}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-300 mt-1.5">
            Nhóm A: 94% · Nhóm B: {Math.max(55, liveComprehension - 12)}% · Nhóm C: {Math.max(42, liveComprehension - 24)}%
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-purple-500/40">
          <div className="flex items-center justify-between text-xs text-purple-200 mb-1">
            <span className="font-bold flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              Tập Trung & Hứng Thú (Engagement)
            </span>
            <span className="text-base font-black text-purple-300">{liveEngagement}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-300"
              style={{ width: `${liveEngagement}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-300 mt-1.5">
            Nhóm D (Tăng động): {Math.max(45, liveEngagement - 15)}% · Đã chèn {copilotCount} tương tác
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-rose-500/40">
          <div className="flex items-center justify-between text-xs text-rose-200 mb-1">
            <span className="font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Điểm Nóng Ngộ Nhận (Heatmap)
            </span>
            <span className="text-base font-black text-rose-300">
              {Math.max(0, riskSentencesSoFar - DismissedIndices.length)} cảnh báo
            </span>
          </div>
          <p className="text-[11px] text-rose-200/90 mt-1">
            Bôi đỏ tự động các câu khiến Học sinh B & C hiểu sai bản chất hoặc quá tải thuật ngữ.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/40">
          <div className="flex items-center justify-between text-xs text-emerald-200 mb-1">
            <span className="font-bold flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              Xác Suất Vượt Qua Đánh Giá
            </span>
            <span className="text-base font-black text-emerald-300">{passProbability}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-300"
              style={{ width: `${passProbability}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-300 mt-1.5">
            Năng lực ứng biến GV: <strong className="text-amber-300">{teacherAgilityScore}/100</strong>
          </p>
        </div>
      </div>

      {/* Dynamic Classroom Interruption Pop-up (if triggered) */}
      {currentInterruption && currentInterruption.interruptionQuestion && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/95 via-rose-950/95 to-purple-950/95 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.45)] space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-md">
                <Hand className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-xs font-black uppercase">
                    HỌC SINH ẢO GIƠ TAY NGẮT LỜI ĐỘT XUẤT!
                  </span>
                  <span className="text-xs font-bold text-amber-200">
                    {COHORT_META[currentInterruption.interruptionQuestion.cohort].badge}
                  </span>
                </div>
                <p className="text-sm font-bold text-white mt-1.5 leading-relaxed">
                  {currentInterruption.interruptionQuestion.questionText}
                </p>
                <p className="text-xs text-rose-200 mt-1">
                  Đoạn gây vấp: &ldquo;{currentInterruption.text}&rdquo;
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleCopilotSteer(currentInterruption)}
                className="btn-3d btn-3d-emerald px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Co-pilot (Tự Bẻ Lái & Chèn Ví Dụ Thực Tế)</span>
              </button>
              <button
                onClick={() => {
                  onPauseTyping?.();
                  setShowAnswerInput((prev) => !prev);
                }}
                className="btn-3d btn-3d-cyan px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Giáo Viên Trực Tiếp Trả Lời</span>
              </button>
              <button
                onClick={() =>
                  setDismissedIndices((prev) => [...prev, currentInterruption.index])
                }
                className="btn-3d btn-3d-rose px-2.5 py-2 rounded-xl text-xs font-bold"
              >
                Bỏ qua
              </button>
            </div>
          </div>

          {showAnswerInput && (
            <div className="pt-2 border-t border-amber-400/30 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={teacherAnswer}
                onChange={(e) => setTeacherAnswer(e.target.value)}
                placeholder="Nhập lời giải thích hoặc ví dụ thực tế của thầy/cô để chèn vào bài giảng..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-amber-400/60 text-xs text-white focus:outline-none"
              />
              <button
                onClick={() => handleTeacherDirectAnswer(currentInterruption)}
                className="btn-3d btn-3d-amber px-4 py-2 rounded-xl text-xs font-extrabold"
              >
                Chèn Giải Đáp & Tiếp Tục Gõ
              </button>
            </div>
          )}
        </div>
      )}

      {/* Live Misconception Heatmap Preview */}
      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-sky-500/30 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-cyan-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-400" />
            Bản Đồ Nhiệt Ngộ Nhận Thời Gian Thực (Misconception Heatmap - 12pt Times New Roman):
          </span>
          <span className="text-[11px] text-slate-300">
            Câu bôi đỏ = Học sinh B & C dễ hiểu sai bản chất
          </span>
        </div>
        <div className="max-h-40 overflow-y-auto p-3 rounded-lg bg-slate-900/90 doc-times-12pt space-y-1.5">
          {visibleAnalyses.map((item) => {
            const isResolved = DismissedIndices.includes(item.index);
            const comp = detectCompetencyTypeFromText(item.text);
            const compClass =
              comp === 'NLS'
                ? 'competency-nls-text'
                : comp === 'NLAI'
                ? 'competency-nlai-text'
                : comp === 'THLM'
                ? 'competency-thlm-text'
                : 'text-slate-100';

            return (
              <div
                key={item.index}
                className={`p-2 rounded-lg transition-all ${
                  item.isMisconceptionRisk && !isResolved
                    ? 'bg-rose-600/30 border border-rose-400 text-rose-100'
                    : isResolved
                    ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-950/60'
                }`}
              >
                <div className={compClass}>{item.text}</div>
                {item.isMisconceptionRisk && !isResolved && (
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans text-rose-200">
                    <span>⚠️ {item.riskReason}</span>
                    {item.interruptionQuestion && (
                      <button
                        onClick={() => handleCopilotSteer(item)}
                        className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-extrabold hover:bg-emerald-400"
                      >
                        + AI Co-pilot Sửa Ngay
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface ClassroomSimulatorTabProps {
  language: Language;
  initialLessonText?: string;
  onSyncToAutoTyper: (text: string) => void;
  onLog: (msg: string, level?: 'info' | 'engine' | 'warning' | 'error') => void;
}

/**
 * Full-Screen Dedicated Tab: Digital Twin Classroom Simulator
 * (Phòng Thí Nghiệm Giả Lập Học Sinh Ảo Thời Gian Thực)
 */
export const ClassroomSimulatorTab: React.FC<ClassroomSimulatorTabProps> = ({
  initialLessonText,
  onSyncToAutoTyper,
  onLog,
}) => {
  const [lessonText, setLessonText] = useState<string>(
    initialLessonText && initialLessonText.trim().length > 20
      ? initialLessonText
      : DEFAULT_SIMULATOR_LESSON_TEXT
  );
  const [savedLessonSnapshot, setSavedLessonSnapshot] = useState<string>(
    initialLessonText && initialLessonText.trim().length > 20
      ? initialLessonText
      : DEFAULT_SIMULATOR_LESSON_TEXT
  );
  const [students, setStudents] = useState<VirtualStudentAgent[]>(INITIAL_VIRTUAL_STUDENTS);
  const [selectedCohortFilter, setSelectedCohortFilter] = useState<StudentCohort | 'ALL'>('ALL');
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number>(0);
  const [resolvedSentences, setResolvedSentences] = useState<number[]>([]);
  const [copilotInterventions, setCopilotInterventions] = useState<number>(0);
  const [teacherAgility, setTeacherAgility] = useState<number>(90);
  const [teacherCustomReply, setTeacherCustomReply] = useState<string>('');
  const [evolvedPreview, setEvolvedPreview] = useState<string>('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentCohort, setNewStudentCohort] = useState<StudentCohort>('B');
  const [newStudentTrait, setNewStudentTrait] = useState<string>('');
  const lessonTextareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Sync if initialLessonText updates externally
  useEffect(() => {
    if (initialLessonText && initialLessonText.trim().length > 20) {
      setLessonText(initialLessonText);
    }
  }, [initialLessonText]);

  const sentenceAnalyses = useMemo(
    () => analyzeLessonForCognitiveTwin(lessonText),
    [lessonText]
  );

  // Live simulation timer stepping through sentences like AutoTyper
  useEffect(() => {
    if (!isSimulating) return;
    const timer = setInterval(() => {
      setActiveSentenceIdx((prev) => {
        if (prev + 1 >= sentenceAnalyses.length) {
          setIsSimulating(false);
          onLog(
            'Hoàn tất phiên Thử tải Bài giảng Thời gian thực (Live Teaching Stress-Test) với 36 học sinh AI!',
            'engine'
          );
          return prev;
        }
        return prev + 1;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, [isSimulating, sentenceAnalyses.length, onLog]);

  // Dynamically update student states based on activeSentenceIdx and resolvedSentences
  const liveStudents = useMemo(() => {
    const currentSentence = sentenceAnalyses[activeSentenceIdx];
    const unresolvedRisks = sentenceAnalyses
      .slice(0, activeSentenceIdx + 1)
      .filter((s) => s.isMisconceptionRisk && !resolvedSentences.includes(s.index)).length;

    return students.map((st, idx) => {
      let compDelta = copilotInterventions * 4 - unresolvedRisks * 3;
      let engDelta = copilotInterventions * 5 - Math.floor(activeSentenceIdx / 3) * 3;

      if (st.cohort === 'A') {
        compDelta += 4;
      } else if (st.cohort === 'B') {
        compDelta -= unresolvedRisks * 4;
      } else if (st.cohort === 'C') {
        compDelta -= unresolvedRisks * 5;
      } else if (st.cohort === 'D') {
        engDelta -= unresolvedRisks * 4;
      }

      const comprehension = Math.min(100, Math.max(25, st.comprehension + compDelta));
      const engagement = Math.min(100, Math.max(30, st.engagement + engDelta));

      let status: VirtualStudentAgent['status'] = 'focused';
      let thought = st.currentThought;

      if (currentSentence?.isMisconceptionRisk && !resolvedSentences.includes(currentSentence.index)) {
        if (currentSentence.riskCohort.includes(st.cohort)) {
          status = st.cohort === 'A' || idx % 3 === 0 ? 'questioning' : st.cohort === 'D' ? 'distracted' : 'confused';
          thought = currentSentence.riskReason;
        }
      } else if (comprehension >= 85) {
        status = 'mastered';
        thought = 'Đã hiểu rõ luận điểm và ví dụ thực tế của bài giảng.';
      }

      return {
        ...st,
        comprehension,
        engagement,
        status,
        currentThought: thought,
      };
    });
  }, [students, sentenceAnalyses, activeSentenceIdx, resolvedSentences, copilotInterventions]);

  const filteredStudents = useMemo(() => {
    if (selectedCohortFilter === 'ALL') return liveStudents;
    return liveStudents.filter((s) => s.cohort === selectedCohortFilter);
  }, [liveStudents, selectedCohortFilter]);

  // Aggregate Cognitive Metrics
  const avgComprehension = useMemo(() => {
    if (!liveStudents.length) return 0;
    return Math.round(
      liveStudents.reduce((acc, s) => acc + s.comprehension, 0) / liveStudents.length
    );
  }, [liveStudents]);

  const avgEngagement = useMemo(() => {
    if (!liveStudents.length) return 0;
    return Math.round(
      liveStudents.reduce((acc, s) => acc + s.engagement, 0) / liveStudents.length
    );
  }, [liveStudents]);

  const passProbabilityBefore = useMemo(() => {
    const riskCount = sentenceAnalyses.filter((s) => s.isMisconceptionRisk).length;
    return Math.max(48, Math.min(82, 84 - riskCount * 7));
  }, [sentenceAnalyses]);

  const passProbabilityAfter = useMemo(() => {
    return Math.min(
      98,
      Math.max(passProbabilityBefore + 14, Math.round(avgComprehension * 0.65 + avgEngagement * 0.35 + (evolvedPreview ? 12 : 0)))
    );
  }, [avgComprehension, avgEngagement, passProbabilityBefore, evolvedPreview]);

  // Active interruption pop-up in Simulator tab
  const activeInterruption = useMemo(() => {
    for (let i = activeSentenceIdx; i >= 0; i--) {
      const item = sentenceAnalyses[i];
      if (item && item.isMisconceptionRisk && item.interruptionQuestion && !resolvedSentences.includes(item.index)) {
        return item;
      }
    }
    return null;
  }, [sentenceAnalyses, activeSentenceIdx, resolvedSentences]);

  const handleCopilotFixSentence = (item: SentenceCognitiveAnalysis) => {
    if (!item.interruptionQuestion) return;
    const injection = item.interruptionQuestion.copilotInjection.trim();
    const updatedSentences = sentenceAnalyses.map((s) =>
      s.index === item.index ? `${s.text}\n${injection}` : s.text
    );
    const updatedText = updatedSentences.join('\n');
    setLessonText(updatedText);
    setResolvedSentences((prev) => [...prev, item.index]);
    setCopilotInterventions((c) => c + 1);
    setTeacherAgility((a) => Math.min(100, a + 4));
    onLog(
      `AI Co-pilot đã chèn ví dụ thực tế giải tỏa thắc mắc của ${item.interruptionQuestion.studentName}!`,
      'engine'
    );
  };

  const handleTeacherAnswerSubmit = (item: SentenceCognitiveAnalysis) => {
    if (!teacherCustomReply.trim()) return;
    const replyLine = `- Giải thích trực tiếp của Giáo viên (Giải đáp ${item.interruptionQuestion?.studentName}): ${teacherCustomReply.trim()}`;
    const updatedSentences = sentenceAnalyses.map((s) =>
      s.index === item.index ? `${s.text}\n${replyLine}` : s.text
    );
    setLessonText(updatedSentences.join('\n'));
    setResolvedSentences((prev) => [...prev, item.index]);
    setTeacherCustomReply('');
    setCopilotInterventions((c) => c + 1);
    setTeacherAgility((a) => Math.min(100, a + 5));
    onLog(`Giáo viên đã trả lời câu hỏi đột xuất của học sinh ảo!`, 'info');
  };

  const handleRunAutoEvolve = () => {
    const evolved = buildAutoEvolvedLesson(lessonText);
    setEvolvedPreview(evolved);
    setLessonText(evolved);
    setResolvedSentences(sentenceAnalyses.map((s) => s.index));
    setCopilotInterventions((c) => c + 4);
    setTeacherAgility(99);
    onLog(
      'Đã thực thi Auto-Evolve (Tiến hóa bài giảng 1-Click): Xác suất học sinh vượt qua bài kiểm tra cuối bài đạt ' +
        Math.min(98, passProbabilityBefore + 26) +
        '%!',
      'engine'
    );
  };

  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;
    const meta = COHORT_META[newStudentCohort];
    const newAgent: VirtualStudentAgent = {
      id: `st-custom-${Date.now()}`,
      name: newStudentName.trim(),
      cohort: newStudentCohort,
      personaTitle: meta.title,
      cognitiveTrait: newStudentTrait.trim() || meta.description,
      comprehension: newStudentCohort === 'A' ? 92 : newStudentCohort === 'B' ? 68 : newStudentCohort === 'C' ? 45 : 60,
      engagement: newStudentCohort === 'D' ? 48 : 82,
      status: 'focused',
      currentThought: 'Sẵn sàng tham gia thử tải bài giảng thời gian thực.',
    };
    setStudents((prev) => [newAgent, ...prev]);
    setNewStudentName('');
    setNewStudentTrait('');
    onLog(`Đã thêm học sinh ảo "${newAgent.name}" (${meta.badge}) vào lớp học Digital Twin.`, 'info');
  };

  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    onLog('Đã xóa học sinh ảo khỏi danh sách lớp.', 'info');
  };

  const handleDownloadReportWord = () => {
    const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="vi">
<head>
<meta charset="utf-8">
<title>Bao_Cao_Kiem_Dinh_Su_Pham_Digital_Twin</title>
<style>
  body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; color: #000000; }
  h1, h2, h3 { font-family: "Times New Roman", Times, serif; font-size: 12pt; font-weight: bold; margin-top: 8pt; margin-bottom: 4pt; }
  p, li, td, th { font-family: "Times New Roman", Times, serif; font-size: 12pt; text-align: justify; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0; }
  th, td { border: 1pt solid #000; padding: 6pt; vertical-align: top; }
  .nls { color: #0052cc; font-weight: bold; }
  .nlai { color: #c81e1e; font-weight: bold; }
  .thlm { color: #b45309; font-weight: bold; }
</style>
</head>
<body>
  <h1>BÁO CÁO KIỂM ĐỊNH SƯ PHẠM & TỐI ƯU HÓA BÀI GIẢNG (DIGITAL TWIN CLASSROOM SIMULATOR)</h1>
  <p>- Quy mô lớp học giả lập: ${students.length} Học sinh AI (4 Nhóm nhận thức A, B, C, D).</p>
  <p>- Mức độ hiểu bài trung bình (Comprehension Rate): ${avgComprehension}%</p>
  <p>- Chỉ số tập trung & hứng thú (Engagement Index): ${avgEngagement}%</p>
  <p>- Chỉ số Vượt qua Đánh giá (Pass Probability): Tăng từ ${passProbabilityBefore}% lên ${passProbabilityAfter}% sau khi tối ưu Auto-Evolve.</p>
  <h2>NỘI DUNG BÀI GIẢNG ĐÃ TIẾN HÓA SƯ PHẠM (CHUẨN 12PT TIMES NEW ROMAN)</h2>
  ${lessonText
    .split('\n')
    .filter((l) => l.trim())
    .map((line) => {
      const comp = detectCompetencyTypeFromText(line);
      const cls = comp === 'NLS' ? 'nls' : comp === 'NLAI' ? 'nlai' : comp === 'THLM' ? 'thlm' : '';
      return `<p class="${cls}">${cleanPedagogyText(line)}</p>`;
    })
    .join('\n')}
</body>
</html>`;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Bao_Cao_Digital_Twin_Classroom_12pt.doc';
    a.click();
    URL.revokeObjectURL(url);
    onLog('Đã tải về Báo cáo Kiểm định Sư phạm & Bài giảng Tiến hóa (.DOC Word 12pt Times New Roman).', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Top 3D Hero Banner */}
      <div className="frame-3d p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-cyan-400">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 text-xs font-extrabold">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>GENERATIVE MULTI-AGENT PEDAGOGICAL LAB · {students.length} HỌC SINH AI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Digital Twin Classroom Simulator : Phòng Thí Nghiệm Giả Lập Học Sinh Ảo Thời Gian Thực
            </h2>
            <p className="text-xs sm:text-sm text-sky-200 max-w-4xl">
              Thử tải bài giảng trước khi lên lớp thật với {students.length} học sinh AI thuộc 4 hồ sơ tâm lý - nhận thức (A: Giỏi phản biện, B: Trung bình dễ ngộ nhận, C: Mất gốc thụ động, D: Tăng động dễ mất tập trung). Tự động bôi đỏ điểm mù ngộ nhận, mô phỏng học sinh giơ tay hỏi xoáy và tiến hóa bài giảng chỉ với 1 cú click.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setActiveSentenceIdx(0);
                setIsSimulating((prev) => !prev);
              }}
              className={`btn-3d px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 ${
                isSimulating ? 'btn-3d-rose' : 'btn-3d-emerald'
              }`}
            >
              {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>
                {isSimulating
                  ? 'Tạm Dừng Thử Tải Lớp Học'
                  : 'Bắt Đầu Thử Tải Bài Giảng (Live Stress-Test)'}
              </span>
            </button>

            <button
              onClick={handleRunAutoEvolve}
              className="btn-3d btn-3d-amber px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Auto-Evolve (Tiến Hóa Bài Giảng 1-Click)</span>
            </button>

            <button
              onClick={() => {
                onSyncToAutoTyper(lessonText);
                onLog('Đã chuyển bài giảng đã tối ưu sang AutoTyper Simulator để gõ trình diễn!', 'info');
              }}
              className="btn-3d btn-3d-cyan px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Gõ Bài Giảng Này Trên AutoTyper</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: 4 Student Persona Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['A', 'B', 'C', 'D'] as StudentCohort[]).map((cohort) => {
          const meta = COHORT_META[cohort];
          const groupStudents = liveStudents.filter((s) => s.cohort === cohort);
          const groupComp = groupStudents.length
            ? Math.round(groupStudents.reduce((a, b) => a + b.comprehension, 0) / groupStudents.length)
            : 0;
          const groupEng = groupStudents.length
            ? Math.round(groupStudents.reduce((a, b) => a + b.engagement, 0) / groupStudents.length)
            : 0;

          return (
            <div
              key={cohort}
              onClick={() =>
                setSelectedCohortFilter((prev) => (prev === cohort ? 'ALL' : cohort))
              }
              className={`frame-3d p-4 rounded-2xl cursor-pointer transition-all ${meta.bgClass} border-2 ${
                selectedCohortFilter === cohort ? 'border-yellow-300 scale-[1.02]' : meta.borderClass
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`text-xs font-black uppercase ${meta.colorClass}`}>
                  {meta.badge}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-950/80 text-white text-xs font-extrabold">
                  {groupStudents.length} HS
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed mb-3">{meta.description}</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Độ hiểu bài:</span>
                  <span className="font-extrabold text-white">{groupComp}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400"
                    style={{ width: `${groupComp}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-300">Độ tập trung:</span>
                  <span className="font-extrabold text-white">{groupEng}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${groupEng}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section 2: Cognitive Radar Dashboard + Dynamic Classroom Interruption Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Lesson Input, Misconception Heatmap & Auto-Evolve */}
        <div className="lg:col-span-2 space-y-5">
          {/* Dynamic Classroom Interruption Pop-up */}
          {activeInterruption && activeInterruption.interruptionQuestion && (
            <div className="frame-3d p-5 rounded-2xl bg-gradient-to-r from-amber-950 via-rose-950 to-indigo-950 border-2 border-amber-300 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-black">
                    <Hand className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-amber-300 text-slate-950 text-xs font-black">
                        PHẢN ỨNG & ĐẶT CÂU HỎI ĐỘT XUẤT (DYNAMIC INTERRUPTION)
                      </span>
                      <span className="text-xs font-extrabold text-cyan-300">
                        Điểm ứng biến GV: {teacherAgility}/100
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-white mt-1.5">
                      {activeInterruption.interruptionQuestion.questionText}
                    </p>
                    <p className="text-xs text-amber-200/90 mt-1">
                      Câu đang giảng: &ldquo;{activeInterruption.text}&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => handleCopilotFixSentence(activeInterruption)}
                  className="btn-3d btn-3d-emerald px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI Co-pilot (Bẻ Lái Mạch Bài Giảng & Chèn Ví Dụ Thực Tế)</span>
                </button>
                <div className="flex-1 flex items-center gap-2 min-w-[240px]">
                  <input
                    type="text"
                    value={teacherCustomReply}
                    onChange={(e) => setTeacherCustomReply(e.target.value)}
                    placeholder="Hoặc giáo viên trực tiếp nhập câu trả lời ứng biến tại đây..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-amber-400/60 text-xs text-white focus:outline-none"
                  />
                  <button
                    onClick={() => handleTeacherAnswerSubmit(activeInterruption)}
                    className="btn-3d btn-3d-cyan px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap"
                  >
                    Trả Lời
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Misconception Heatmap & Lesson Editor */}
          <div className="frame-3d p-5 rounded-2xl bg-slate-900/95 border-2 border-sky-400/60 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-sky-500/30">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Bản Đồ Nhiệt Ngộ Nhận (Misconception Heatmap) & Kịch Bản Bài Giảng (12pt Times New Roman)
                </h3>
              </div>

              {/* Full CRUD Toolbar: Thêm, Chỉnh Sửa, Xóa, Khôi Phục Lại */}
              <div className="flex flex-wrap items-center gap-1.5">
                <label className="btn-3d btn-3d-purple px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải Lên</span>
                  <input
                    type="file"
                    accept=".txt,.md,.doc,.docx"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const txt = await f.text();
                      setSavedLessonSnapshot(txt);
                      setLessonText(txt);
                      setResolvedSentences([]);
                      onLog(`Đã tải bài giảng "${f.name}" vào Phòng Thí Nghiệm Lớp Học Ảo.`, 'info');
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => {
                    if (lessonText.trim()) setSavedLessonSnapshot(lessonText);
                    setLessonText((prev) =>
                      `${prev.trim()}\n- Năng lực số: Học sinh thực hành trực tiếp trên bảng mô phỏng số để kiểm chứng kết quả.`
                    );
                    onLog('Đã thêm đoạn bài giảng mới vào Phòng Lab Lớp Học Ảo.', 'info');
                  }}
                  className="btn-3d btn-3d-emerald px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>

                <button
                  onClick={() => {
                    lessonTextareaRef.current?.focus();
                    onLog('Đang chỉnh sửa kịch bản bài giảng trong Phòng Lab Lớp Học Ảo.', 'info');
                  }}
                  className="btn-3d btn-3d-amber px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh Sửa</span>
                </button>

                <button
                  onClick={() => {
                    if (lessonText.trim()) setSavedLessonSnapshot(lessonText);
                    setLessonText('');
                    onLog('Đã xóa kịch bản bài giảng (Bấm Khôi Phục Lại để lấy lại).', 'warning');
                  }}
                  className="btn-3d btn-3d-rose px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>

                <button
                  onClick={() => {
                    setLessonText(savedLessonSnapshot || DEFAULT_SIMULATOR_LESSON_TEXT);
                    setResolvedSentences([]);
                    setEvolvedPreview('');
                    onLog('Đã khôi phục lại kịch bản bài giảng trong Phòng Lab Lớp Học Ảo.', 'info');
                  }}
                  className="btn-3d btn-3d-cyan px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi Phục Lại</span>
                </button>

                <button
                  onClick={handleDownloadReportWord}
                  className="btn-3d btn-3d-indigo px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải Về Word (.DOC 12pt)</span>
                </button>
              </div>
            </div>

            {/* Interactive Heatmap Sentences */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto p-3 rounded-xl bg-slate-950/90 border border-sky-500/30 doc-times-12pt">
              {sentenceAnalyses.map((item) => {
                const isCurrent = item.index === activeSentenceIdx && isSimulating;
                const isResolved = resolvedSentences.includes(item.index);
                const comp = detectCompetencyTypeFromText(item.text);
                const compClass =
                  comp === 'NLS'
                    ? 'competency-nls-text'
                    : comp === 'NLAI'
                    ? 'competency-nlai-text'
                    : comp === 'THLM'
                    ? 'competency-thlm-text'
                    : 'text-slate-100';

                return (
                  <div
                    key={item.index}
                    onClick={() => setActiveSentenceIdx(item.index)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      isCurrent
                        ? 'ring-2 ring-cyan-400 bg-cyan-950/60'
                        : item.isMisconceptionRisk && !isResolved
                        ? 'bg-rose-600/30 border-2 border-rose-400/90 text-rose-100'
                        : isResolved
                        ? 'bg-emerald-950/50 border border-emerald-400/60 text-emerald-100'
                        : 'bg-slate-900/80 border border-slate-800 hover:border-sky-500/50'
                    }`}
                  >
                    <div className={compClass}>{item.text}</div>

                    {item.isMisconceptionRisk && !isResolved && (
                      <div className="mt-2 pt-2 border-t border-rose-400/30 flex flex-wrap items-center justify-between gap-2 font-sans text-xs">
                        <span className="text-rose-200 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          {item.riskReason}
                        </span>
                        {item.interruptionQuestion && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopilotFixSentence(item);
                            }}
                            className="btn-3d btn-3d-emerald px-2.5 py-1 rounded-lg text-[11px] font-extrabold"
                          >
                            + AI Co-pilot Chèn Ví Dụ Giải Tỏa
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Direct Editable Lesson Textarea (12pt Times New Roman) */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa trực tiếp văn bản bài giảng / giáo án (Chuẩn Times New Roman 12pt):</span>
              </label>
              <textarea
                ref={lessonTextareaRef}
                value={lessonText}
                onChange={(e) => setLessonText(e.target.value)}
                rows={6}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-sky-500/40 text-white doc-times-12pt focus:outline-none focus:border-cyan-400"
                placeholder="Dán bài giảng hoặc giáo án vào đây để 36 học sinh AI thử tải..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Cognitive Radar Dashboard & Self-Evolving Report */}
        <div className="space-y-5">
          <div className="frame-3d p-5 rounded-2xl bg-slate-900/95 border-2 border-purple-400/70 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-300" />
                <h3 className="text-sm font-extrabold text-white uppercase">
                  Bảng Radar Nhận Thức (Cognitive Dashboard)
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                Real-Time
              </span>
            </div>

            {/* SVG Cognitive Radar Visualization */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/90 border border-sky-500/30">
              <svg viewBox="0 0 220 180" className="w-full max-w-[230px] h-40">
                <polygon
                  points="110,15 195,90 110,165 25,90"
                  fill="rgba(14,165,233,0.08)"
                  stroke="rgba(56,189,248,0.4)"
                  strokeWidth="1.5"
                />
                <polygon
                  points="110,40 165,90 110,140 55,90"
                  fill="rgba(14,165,233,0.05)"
                  stroke="rgba(56,189,248,0.25)"
                  strokeWidth="1"
                />
                {/* Dynamic Polygon based on Comprehension, Engagement, PassProb, Agility */}
                <polygon
                  points={`110,${90 - (avgComprehension / 100) * 72} ${
                    110 + (avgEngagement / 100) * 82
                  },90 110,${90 + (passProbabilityAfter / 100) * 72} ${
                    110 - (teacherAgility / 100) * 82
                  },90`}
                  fill="rgba(34,211,238,0.32)"
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                />
                <text x="110" y="11" textAnchor="middle" fill="#67e8f9" fontSize="9" fontWeight="bold">
                  HIỂU BÀI ({avgComprehension}%)
                </text>
                <text x="215" y="93" textAnchor="end" fill="#f0abfc" fontSize="9" fontWeight="bold">
                  HỨNG THÚ ({avgEngagement}%)
                </text>
                <text x="110" y="177" textAnchor="middle" fill="#6ee7b7" fontSize="9" fontWeight="bold">
                  VƯỢT QUA ({passProbabilityAfter}%)
                </text>
                <text x="5" y="93" textAnchor="start" fill="#fcd34d" fontSize="9" fontWeight="bold">
                  ỨNG BIẾN ({teacherAgility}%)
                </text>
              </svg>
            </div>

            {/* Pass Probability Before vs After Auto-Evolve */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/90 to-teal-950/90 border border-emerald-400/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-200">
                  CHỈ SỐ VƯỢT QUA ĐÁNH GIÁ (PASS PROBABILITY)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-400 text-slate-950 text-xs font-black">
                  +{passProbabilityAfter - passProbabilityBefore}% Tăng Trưởng
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-center">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-700">
                  <div className="text-[11px] text-slate-300">Bài Giảng Gốc</div>
                  <div className="text-xl font-black text-amber-300">{passProbabilityBefore}%</div>
                  <div className="text-[10px] text-slate-400">HS B & C dễ sai bẫy nhiễu</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-emerald-400">
                  <div className="text-[11px] text-emerald-200 font-bold">Sau Auto-Evolve</div>
                  <div className="text-xl font-black text-emerald-300">{passProbabilityAfter}%</div>
                  <div className="text-[10px] text-emerald-200">Triệt tiêu góc chết ngộ nhận</div>
                </div>
              </div>
              <button
                onClick={handleRunAutoEvolve}
                className="w-full btn-3d btn-3d-amber py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Kích Hoạt Auto-Evolve (Tiến Hóa Bài Giảng)</span>
              </button>
            </div>
          </div>

          {/* Add New Student Agent Box */}
          <div className="frame-3d p-4 rounded-2xl bg-slate-900/95 border border-sky-400/50 space-y-3">
            <h4 className="text-xs font-extrabold text-cyan-300 uppercase flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Thêm Học Sinh Ảo Mới Vào Ma Trận ({students.length} HS)</span>
            </h4>
            <div className="space-y-2">
              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Họ và tên học sinh ảo (VD: Lê Minh Châu)..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
              <select
                value={newStudentCohort}
                onChange={(e) => setNewStudentCohort(e.target.value as StudentCohort)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              >
                <option value="A">Nhóm A: Giỏi – Tư duy phản biện cao</option>
                <option value="B">Nhóm B: Trung bình – Dễ mắc ngộ nhận</option>
                <option value="C">Nhóm C: Mất gốc – Thụ động</option>
                <option value="D">Nhóm D: Tăng động / Dễ mất tập trung</option>
              </select>
              <input
                type="text"
                value={newStudentTrait}
                onChange={(e) => setNewStudentTrait(e.target.value)}
                placeholder="Đặc điểm nhận thức (VD: Hay nhầm điều kiện biên)..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
              />
              <button
                onClick={handleAddStudent}
                className="w-full btn-3d btn-3d-emerald py-2 rounded-xl text-xs font-extrabold"
              >
                + Thêm Học Sinh Vào Lớp Học Ảo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Live 36-Student Virtual Classroom Matrix Grid */}
      <div className="frame-3d p-5 rounded-2xl bg-slate-900/95 border-2 border-cyan-400/60 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-sky-500/30">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-300" />
              <span>
                Sơ Đồ Lớp Học Ảo Thời Gian Thực ({filteredStudents.length} / {students.length} Học Sinh AI)
              </span>
            </h3>
            <p className="text-xs text-sky-200">
              Theo dõi trạng thái nhận thức, mức độ hiểu bài và suy nghĩ tức thời của từng Agent học sinh trong lớp
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'A', 'B', 'C', 'D'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedCohortFilter(filter)}
                className={`btn-3d px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                  selectedCohortFilter === filter ? 'btn-3d-cyan' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {filter === 'ALL' ? `Tất cả (${students.length})` : `Nhóm ${filter}`}
              </button>
            ))}
            <button
              onClick={() => {
                setStudents(INITIAL_VIRTUAL_STUDENTS);
                onLog('Đã khôi phục lại danh sách 36 Học sinh AI mặc định.', 'info');
              }}
              className="btn-3d btn-3d-emerald px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi Phục Lại (36 HS)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {filteredStudents.map((st) => {
            const meta = COHORT_META[st.cohort];
            const isEditingSt = editingStudentId === st.id;
            return (
              <div
                key={st.id}
                className={`p-3 rounded-xl border ${meta.borderClass} bg-slate-950/90 flex flex-col justify-between gap-2`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    {isEditingSt ? (
                      <input
                        type="text"
                        value={st.name}
                        onChange={(e) =>
                          setStudents((prev) =>
                            prev.map((item) => (item.id === st.id ? { ...item, name: e.target.value } : item))
                          )
                        }
                        className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-400 text-xs text-white font-bold w-28"
                      />
                    ) : (
                      <span className="text-xs font-extrabold text-white truncate">{st.name}</span>
                    )}
                    <div className="flex items-center gap-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black ${meta.bgClass} ${meta.colorClass}`}
                      >
                        Nhóm {st.cohort}
                      </span>
                      <button
                        onClick={() => setEditingStudentId(isEditingSt ? null : st.id)}
                        className="text-slate-400 hover:text-amber-300 p-0.5"
                        title="Chỉnh sửa học sinh"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(st.id)}
                        className="text-slate-400 hover:text-rose-400 p-0.5"
                        title="Xóa học sinh"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-cyan-200/90 font-semibold mt-0.5">{st.cognitiveTrait}</p>
                  <p className="text-[11px] text-slate-300 italic mt-1 line-clamp-2">
                    &ldquo;{st.currentThought}&rdquo;
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-cyan-300 font-bold">Hiểu: {st.comprehension}%</span>
                  <span className="text-amber-300 font-bold">Tập trung: {st.engagement}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Why This Feature Is Unprecedented (Comparison Table) */}
      <div className="frame-3d p-5 rounded-2xl bg-slate-900/95 border-2 border-amber-400/70 space-y-3">
        <h3 className="text-base font-extrabold text-amber-300 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          <span>Bảng Đối Sánh Giá Trị Độc Bản: Công Cụ AI Thông Thường vs. Digital Twin Classroom Simulator</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-cyan-300 border-b border-sky-500/40">
                <th className="p-3 font-extrabold border border-slate-800 w-1/2">
                  Công cụ AI thông thường
                </th>
                <th className="p-3 font-extrabold border border-slate-800 w-1/2 text-amber-300">
                  Tính năng Classroom Simulator Đỉnh cao (AutoTyper Studio Pro v3.0)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              <tr>
                <td className="p-3 border border-slate-800">
                  Chỉ kiểm tra lỗi chính tả, ngữ pháp hoặc đạo văn.
                </td>
                <td className="p-3 border border-slate-800 font-semibold text-emerald-300">
                  Kiểm tra &ldquo;Độ thấm nhận thức&rdquo; của bài giảng lên não bộ của 36 học sinh AI thuộc 4 nhóm tâm lý A, B, C, D.
                </td>
              </tr>
              <tr>
                <td className="p-3 border border-slate-800">
                  Giáo viên soạn bài trong &ldquo;phòng tối&rdquo;, lên lớp thật mới biết học sinh không hiểu.
                </td>
                <td className="p-3 border border-slate-800 font-semibold text-cyan-300">
                  Giáo viên được &ldquo;dạy thử&rdquo; với 36 học sinh AI có cá tính trước khi bước vào lớp học thực tế.
                </td>
              </tr>
              <tr>
                <td className="p-3 border border-slate-800">
                  AutoTyper chỉ gõ chữ vô tri từ đầu đến cuối.
                </td>
                <td className="p-3 border border-slate-800 font-semibold text-amber-300">
                  AutoTyper trở thành &ldquo;Dòng thời gian bài giảng sống động&rdquo;, tương tác hai chiều với đám đông Agent học sinh và tự động chèn ví dụ qua AI Co-pilot.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

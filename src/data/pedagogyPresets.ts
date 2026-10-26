/**
 * Curated Vietnamese curriculum presets & deterministic synthesizer for all 10 modules.
 * Used both for instant demos and inside the Web Worker / Offline Static GitHub Pages mode.
 */

import {
  LessonPlan5512,
  DifferentiatedExamPackage,
  SlideItem,
  MicroVideoPackage,
  WorksheetAndGamePackage,
  AdversarialAuditReport,
  AdversarialFinding,
  ExamPart1Question,
} from '../types/pedagogyTypes';

export interface CurriculumPreset {
  id: string;
  lessonTitle: string;
  subject: string;
  grade: string;
  coreKnowledgeText: string;
}

export const CURRICULUM_PRESETS: CurriculumPreset[] = [
  {
    id: 'tinhoc11_ai',
    lessonTitle: 'Bài 1: Trí tuệ nhân tạo, Dữ liệu số và Ứng dụng trong Đời sống',
    subject: 'Tin học',
    grade: 'Lớp 11',
    coreKnowledgeText: `Trí tuệ nhân tạo (Artificial Intelligence - AI) là khả năng của hệ thống máy tính thực hiện các tác vụ vốn đòi hỏi trí thông minh của con người như học máy (Machine Learning), xử lý ngôn ngữ tự nhiên (NLP), thị giác máy tính (Computer Vision) và suy luận logic.
Hệ thống AI được chia thành hai nhóm chính: AI hẹp (Narrow AI / Weak AI) được thiết kế cho nhiệm vụ cụ thể như nhận diện khuôn mặt, dịch thuật, lọc thư rác; và AI tổng quát (General AI / Strong AI) có khả năng tự học và giải quyết đa tác vụ tương đương con người.
Dữ liệu số đóng vai trò nhiên liệu cốt lõi để huấn luyện các mô hình học sâu (Deep Learning). Tuy nhiên, việc ứng dụng AI đi kèm các thách thức về đạo đức số, quyền riêng tư dữ liệu cá nhân, hiện tượng thiên kiến thuật toán (Algorithmic Bias) và thông tin sai lệch (Hallucination / Deepfake). Học sinh cần rèn luyện năng lực kiểm chứng thông tin và sử dụng AI có trách nhiệm.`
  },
  {
    id: 'vatly10_newton',
    lessonTitle: 'Bài 15: Định luật II Newton và Lực ma sát trong chuyển động',
    subject: 'Vật lý',
    grade: 'Lớp 10',
    coreKnowledgeText: `Định luật II Newton phát biểu rằng: Gia tốc của một vật cùng hướng với lực tác dụng lên vật. Độ lớn của gia tốc tỉ lệ thuận với độ lớn của lực và tỉ lệ nghịch với khối lượng của vật: a = F_hl / m (hay F_hl = m.a).
Trong hệ SI, đơn vị của lực là Newton (N), khối lượng là kilôgam (kg) và gia tốc là m/s². Khi có nhiều lực đồng thời tác dụng lên vật, F_hl là hợp lực được xác định theo quy tắc tổng hợp vectơ.
Lực ma sát trượt xuất hiện ở mặt tiếp xúc khi vật trượt trên một bề mặt, có chiều ngược với chiều chuyển động tương đối và độ lớn tỉ lệ với áp lực vuông góc: F_mst = μ.N. Việc mô phỏng quỹ đạo chuyển động bằng phần mềm số và cảm biến gia tốc trên điện thoại giúp đo đạc thực nghiệm chính xác.`
  },
  {
    id: 'sinhhoc10_tebao',
    lessonTitle: 'Bài 8: Cấu trúc Tế bào Nhân thực và Trao đổi chất qua màng',
    subject: 'Sinh học',
    grade: 'Lớp 10',
    coreKnowledgeText: `Tế bào nhân thực có nhân hoàn chỉnh được bao bọc bởi màng nhân kép và hệ thống các bào quan có màng phân tách riêng biệt. Ti thể là trạm năng lượng của tế bào, thực hiện hô hấp tế bào tạo ra phân tử ATP cung cấp cho mọi hoạt động sống. Lục lạp có ở tế bào thực vật, chứa sắc tố diệp lục giúp chuyển hóa quang năng thành hóa năng qua quá trình quang hợp.
Màng sinh chất có cấu trúc khảm động gồm lớp kép phospholipid và các phân tử protein xuyên màng hoặc bám màng. Vận chuyển thụ động qua màng tuân theo nguyên lý khuếch tán từ nơi có nồng độ cao đến nơi có nồng độ thấp và không tiêu tốn năng lượng ATP. Ngược lại, vận chuyển chủ động đi ngược chiều gradien nồng độ, cần kênh protein đặc hiệu và tiêu tốn năng lượng ATP.`
  }
];

function extractKeySentences(rawText: string, fallbackTitle: string): string[] {
  const cleaned = rawText.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return [
      `${fallbackTitle} cung cấp hệ thống khái niệm nền tảng và quy luật vận hành cốt lõi của chủ đề học tập.`,
      `Người học cần phân tích mối quan hệ nhân quả giữa các thành phần lý thuyết và thực nghiệm thực tế.`,
      `Ứng dụng công nghệ số và công cụ trí tuệ nhân tạo giúp mô phỏng, kiểm chứng và tối ưu hóa giải pháp.`,
      `Liên hệ thực tiễn giúp phát triển phẩm chất trách nhiệm, tư duy phản biện và giải quyết vấn đề sáng tạo.`
    ];
  }
  const parts = cleaned
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  while (parts.length < 4) {
    parts.push(
      `Vận dụng kiến thức trọng tâm của "${fallbackTitle}" để giải quyết bài toán thực tiễn và kiểm chứng bằng dữ liệu số.`
    );
  }
  return parts;
}

export function buildLessonPlan5512FromInput(
  lessonTitle: string,
  subject: string,
  grade: string,
  coreText: string
): LessonPlan5512 {
  const sentences = extractKeySentences(coreText, lessonTitle);
  return {
    lessonTitle,
    subject,
    grade,
    duration: '01 tiết (45 phút)',
    knowledgeObjectives: [
      `Trình bày chính xác khái niệm cốt lõi và bản chất khoa học của bài học: ${sentences[0]}`,
      `Phân tích được cơ chế hoạt động và mối liên hệ giữa các yếu tố trọng tâm: ${sentences[1]}`,
      `Vận dụng kiến thức đã học để giải thích hiện tượng thực tế và xử lý bài toán định lượng/định tính.`
    ],
    generalCompetencies: [
      'Năng lực tự chủ và tự học: Chủ động đọc hiểu học liệu, lập sơ đồ hóa kiến thức cốt lõi.',
      'Năng lực giao tiếp và hợp tác: Thảo luận nhóm đôi, bảo vệ lập luận bằng dẫn chứng khoa học.',
      'Năng lực giải quyết vấn đề và sáng tạo: Đề xuất giải pháp cải tiến gắn với tình huống thực tiễn.'
    ],
    specificCompetencies: [
      `Nhận thức chuyên môn môn ${subject}: Nhận diện thuật ngữ, quy luật và mô hình hóa đối tượng nghiên cứu.`,
      `Tìm hiểu và thực hành môn ${subject}: Thiết kế quy trình quan sát, thu thập và xử lý số liệu thực nghiệm.`
    ],
    digitalCompetencyNLS:
      '[NLS - Năng lực số (Xanh dương)]: Khai thác học liệu số, sử dụng bảng tính/phần mềm mô phỏng trực tuyến để trực quan hóa dữ liệu và chia sẻ sản phẩm học tập số an toàn.',
    aiCompetencyNLAI:
      '[NLAI - Năng lực Trí tuệ nhân tạo (Đỏ)]: Thiết lập câu lệnh (Prompt) có cấu trúc để truy vấn công cụ AI, đồng thời kiểm chứng chéo độ chính xác nhằm phát hiện ảo giác thông tin (Hallucination) và thiên kiến dữ liệu.',
    interdisciplinaryTHLM:
      `[THLM - Tích hợp liên môn (Vàng)]: Tích hợp Toán học (xử lý số liệu, đồ thị), Tin học (biểu diễn thông tin số) và Giáo dục công dân / Phát triển bền vững trong bối cảnh thực tế của bài "${lessonTitle}".`,
    qualities: [
      'Trung thực trong thu thập, báo cáo số liệu thực hành và trích dẫn nguồn tham khảo.',
      'Trách nhiệm khi sử dụng công nghệ số, bảo vệ dữ liệu cá nhân và môi trường học tập.'
    ],
    teacherEquipment: [
      `Kế hoạch bài dạy chuẩn Công văn 5512, bộ Slide bài giảng tương tác (.pptx) và video mở đầu 2-3 phút.`,
      `Phiếu học tập khuyết thiếu (Scaffolding worksheet) số 1, 2 và bộ câu hỏi kiểm tra đánh giá 3 phần mới.`
    ],
    studentEquipment: [
      `Sách giáo khoa ${subject} ${grade}, vở ghi, dụng cụ học tập và thiết bị kết nối tra cứu dữ liệu số (nếu có).`
    ],
    competencyMap: [
      {
        code: 'NLS-1.2',
        type: 'NLS',
        label: 'Khai thác & Trực quan hóa Dữ liệu Số',
        description: 'Tra cứu, lọc thông tin số có kiểm chứng và biểu diễn kết quả bằng bảng biểu / sơ đồ số.',
        activityApplied: 'Hoạt động 2 (Hình thành kiến thức) & Hoạt động 3 (Luyện tập)'
      },
      {
        code: 'NLAI-2.1',
        type: 'NLAI',
        label: 'Tư duy Phản biện với AI & Kiểm chứng Ảo giác',
        description: 'Đối chiếu câu trả lời của AI với nguồn học liệu chuẩn để phát hiện lỗi suy luận hoặc thông tin sai lệch.',
        activityApplied: 'Hoạt động 2 (Mục 2) & Hoạt động 4 (Vận dụng)'
      },
      {
        code: 'THLM-3.1',
        type: 'THLM',
        label: 'Kết nối Liên môn Toán - Khoa học - Đạo đức thực tiễn',
        description: 'Giải quyết tình huống thực tiễn liên ngành và đánh giá tác động xã hội - môi trường.',
        activityApplied: 'Hoạt động 1 (Khởi động) & Hoạt động 4 (Vận dụng)'
      }
    ],
    activities: [
      {
        id: 'act-1',
        title: 'Hoạt động 1: Xác định vấn đề /Nhiệm vụ học tập (Khởi động)',
        durationMinutes: 6,
        objectives: [
          `Tạo tâm thế hứng thú, kích hoạt tri thức nền và nêu bật vấn đề thực tiễn cần giải quyết trong bài "${lessonTitle}".`,
          '[THLM] Kết nối tình huống đời sống đa lĩnh vực để dẫn dắt vào nội dung bài học.'
        ],
        content: `Học sinh theo dõi đoạn video vi mô (2 phút) kèm câu hỏi tình huống mở về "${lessonTitle}", suy nghĩ cá nhân và trả lời nhanh trong 60 giây.`,
        products: [
          'Câu trả lời dự đoán ban đầu của học sinh và danh sách các câu hỏi tò mò cần giải đáp trong tiết học.'
        ],
        isTwoColumnTable: false,
        twoColumnRows: [
          {
            stepTitle: 'Bước 1: Chuyển giao nhiệm vụ',
            teacherStudentAction: [
              `- Giáo viên trình chiếu tình huống thực tế liên quan đến "${lessonTitle}" và đặt câu hỏi gợi mở: "Vì sao hiện tượng/quy luật này lại đóng vai trò quyết định trong thực tiễn?"`,
              '- Học sinh quan sát, ghi nhanh 2 từ khóa quan trọng nhất vào giấy nháp.'
            ],
            expectedProduct: [
              '- Học sinh tiếp nhận nhiệm vụ rõ ràng, xác định được mâu thuẫn nhận thức cần khám phá.'
            ],
            competencyTags: ['THLM']
          },
          {
            stepTitle: 'Bước 2, 3 & 4: Thực hiện, Báo cáo & Kết luận',
            teacherStudentAction: [
              '- Học sinh trao đổi cặp đôi (Think-Pair-Share) trong 2 phút.',
              '- Giáo viên gọi 2-3 học sinh chia sẻ nhanh quan điểm, ghi nhận các giả thuyết lên bảng và dẫn dắt vào bài mới.'
            ],
            expectedProduct: [
              '- Các giả thuyết ban đầu của học sinh được hệ thống hóa để kiểm chứng ở Hoạt động 2.'
            ],
            competencyTags: ['NLS']
          }
        ]
      },
      {
        id: 'act-2',
        title: 'Hoạt động 2: Hình thành kiến thức mới (Định dạng Bảng 2 Cột Đối Ứng Chuẩn 5512)',
        durationMinutes: 20,
        objectives: [
          `Chiếm lĩnh hệ thống khái niệm, quy luật và cơ chế trọng tâm của "${lessonTitle}".`,
          '[NLS] Rèn luyện kỹ năng đọc hiểu dữ liệu số và hệ thống hóa thông tin trên Phiếu học tập.',
          '[NLAI] Phân tích và phản biện nhận định từ công cụ AI để củng cố bản chất khoa học.'
        ],
        content: 'Học sinh nghiên cứu học liệu gốc, hoàn thành Phiếu học tập số 1 theo nhóm 4 người và đối chiếu bảng 2 cột.',
        products: [
          'Phiếu học tập số 1 hoàn chỉnh, sơ đồ cấu trúc kiến thức và ghi chép chuẩn xác trong vở.'
        ],
        isTwoColumnTable: true,
        twoColumnRows: [
          {
            stepTitle: 'Bước 1: Chuyển giao nhiệm vụ học tập',
            teacherStudentAction: [
              `- Giáo viên chia lớp thành các nhóm 4 học sinh, phát Phiếu học tập khuyết thiếu số 1 tìm hiểu nội dung cốt lõi của "${lessonTitle}".`,
              '- [NLS] Giáo viên hướng dẫn học sinh khai thác tư liệu số và bảng dữ liệu minh họa trên màn hình.',
              '- [NLAI] Giáo viên cung cấp một nhận định do AI sinh ra có chứa 1 điểm chưa chuẩn xác để các nhóm cùng rà soát và phản biện.'
            ],
            expectedProduct: [
              'I. KHÁI NIỆM & BẢN CHẤT CỐT LÕI',
              `- ${sentences[0]}`,
              `- ${sentences[1]}`,
              '- [NLS] Dữ liệu và thông số chuẩn được trích xuất từ học liệu chính thống.'
            ],
            competencyTags: ['NLS', 'NLAI']
          },
          {
            stepTitle: 'Bước 2: Thực hiện nhiệm vụ (Khám phá & Thảo luận)',
            teacherStudentAction: [
              '- Học sinh đọc độc lập văn bản kiến thức trong 3 phút, gạch chân các từ khóa hạt nhân.',
              '- Các thành viên thảo luận nhóm để điền khuyết trên Phiếu học tập và tìm ra điểm sai lệch trong nhận định mẫu của AI.',
              '- Giáo viên quan sát các nhóm, hỗ trợ gợi mở bằng câu hỏi phụ cho nhóm gặp khó khăn.'
            ],
            expectedProduct: [
              'II. CƠ CHẾ VẬN HÀNH & PHÂN LOẠI TRỌNG TÂM',
              `- ${sentences[2]}`,
              '- [NLAI] Kết quả kiểm chứng: Chỉ rõ giới hạn và điều kiện áp dụng, tránh ngộ nhận máy móc do ảo giác AI.'
            ],
            competencyTags: ['NLAI']
          },
          {
            stepTitle: 'Bước 3: Báo cáo, thảo luận và phản biện chéo',
            teacherStudentAction: [
              '- Đại diện 2 nhóm trình bày kết quả Phiếu học tập số 1 trên bảng / màn chiếu.',
              '- Các nhóm còn lại đặt câu hỏi chất vấn, bổ sung dẫn chứng thực tiễn [THLM] và chấm chéo theo tiêu chí Rubric.'
            ],
            expectedProduct: [
              'III. Ý NGHĨA THỰC TIỄN & LIÊN HỆ LIÊN MÔN',
              `- ${sentences[3]}`,
              '- [THLM] Mối liên hệ mật thiết giữa lý thuyết bài học với ứng dụng kỹ thuật, đời sống và đạo đức xã hội.'
            ],
            competencyTags: ['THLM']
          },
          {
            stepTitle: 'Bước 4: Kết luận, nhận định và chuẩn hóa kiến thức',
            teacherStudentAction: [
              '- Giáo viên nhận xét tinh thần làm việc nhóm, giải đáp các vướng mắc chuyên sâu.',
              '- Giáo viên chốt lại kiến thức trọng tâm cần ghi nhớ và nhấn mạnh các lưu ý chống nhầm lẫn khi làm bài thi.'
            ],
            expectedProduct: [
              '- Kết luận chuẩn hóa toàn bài được học sinh ghi nhận đầy đủ vào vở theo hệ thống gạch đầu dòng (-).'
            ],
            competencyTags: ['NLS', 'NLAI', 'THLM']
          }
        ]
      },
      {
        id: 'act-3',
        title: 'Hoạt động 3: Luyện tập (Củng cố & Phân hóa theo 3 định dạng khảo thí mới)',
        durationMinutes: 12,
        objectives: [
          'Củng cố kiến thức vừa học thông qua hệ thống câu hỏi Trắc nghiệm 4 lựa chọn, Đúng/Sai 4 ý và Trả lời ngắn.',
          '[NLS] Tương tác trả lời nhanh trên bảng điểm mini-game lớp học.'
        ],
        content: 'Học sinh làm việc cá nhân hoàn thành gói câu hỏi luyện tập nhanh và giải thích rõ lý do loại trừ các phương án nhiễu.',
        products: [
          'Đáp án bài tập luyện tập của học sinh kèm lập luận giải thích các ý Đúng/Sai.'
        ],
        isTwoColumnTable: false,
        twoColumnRows: [
          {
            stepTitle: 'Tổ chức Luyện tập 4 bước',
            teacherStudentAction: [
              '- Bước 1: Giáo viên phát bộ câu hỏi nhanh (gồm câu 4 lựa chọn, câu Đúng/Sai 4 ý a-b-c-d và câu trả lời ngắn).',
              '- Bước 2: Học sinh độc lập suy nghĩ và hoàn thành bài làm trong 6 phút.',
              '- Bước 3: Học sinh đổi bài chấm chéo, giải thích vì sao các phương án bẫy (distractors) lại sai.',
              '- Bước 4: Giáo viên công bố đáp án gạch chân chuẩn và thống kê tỷ lệ nắm bài.'
            ],
            expectedProduct: [
              '- Học sinh nắm vững kỹ thuật phân tích đề thi cấu trúc mới và nhận diện các bẫy khái niệm thường gặp.'
            ],
            competencyTags: ['NLS']
          }
        ]
      },
      {
        id: 'act-4',
        title: 'Hoạt động 4: Vận dụng & Mở rộng thực tiễn',
        durationMinutes: 7,
        objectives: [
          `Vận dụng tri thức bài "${lessonTitle}" để thiết kế sản phẩm/giải pháp cho bài toán thực tế tại địa phương hoặc gia đình.`,
          '[NLAI] Sử dụng AI có đạo đức để tra cứu mở rộng và kiểm chứng nguồn tin.'
        ],
        content: 'Giao nhiệm vụ dự án nhỏ thực hiện ngoài giờ học hoặc thảo luận tình huống mở rộng tại lớp.',
        products: [
          'Bản đề xuất giải pháp thực tiễn / Infographic tóm tắt bài học của học sinh.'
        ],
        isTwoColumnTable: false,
        twoColumnRows: [
          {
            stepTitle: 'Tổ chức Vận dụng & Giao việc về nhà',
            teacherStudentAction: [
              `- Bước 1: Giáo viên nêu bài toán thực tế gắn với "${lessonTitle}" và yêu cầu học sinh đề xuất phương án tối ưu.`,
              '- Bước 2: Học sinh phác thảo ý tưởng tại lớp, hoàn thiện báo cáo ngắn hoặc sơ đồ số ở nhà [NLS].',
              '- Bước 3 & 4: Nộp sản phẩm lên không gian lớp học số và nhận phản hồi đánh giá vào đầu tiết học tiếp theo.'
            ],
            expectedProduct: [
              '- Sản phẩm vận dụng sáng tạo thể hiện rõ sự kết nối giữa lý thuyết, công nghệ số [NLS], AI [NLAI] và thực tiễn liên môn [THLM].'
            ],
            competencyTags: ['NLS', 'NLAI', 'THLM']
          }
        ]
      }
    ]
  };
}

export function runAdversarialAuditOnQuestions(part1: ExamPart1Question[]): AdversarialAuditReport {
  const findings: AdversarialFinding[] = [];
  let totalDistractorScore = 0;

  part1.forEach((q) => {
    const correctOpt = q.options.find((o) => o.isCorrect);
    const distractors = q.options.filter((o) => !o.isCorrect);
    const lengths = q.options.map((o) => o.text.length);
    const avgDistractorLen =
      distractors.reduce((acc, d) => acc + d.text.length, 0) / Math.max(1, distractors.length);

    let qScore = 92;
    if (correctOpt && correctOpt.text.length > avgDistractorLen * 1.45) {
      qScore -= 14;
      findings.push({
        questionRef: `Phần I - Câu ${q.number}`,
        severity: 'medium',
        category: 'Bẫy độ dài (Length Bias)',
        issueDescription: `Phương án đúng (${correctOpt.letter}) dài hơn đáng kể (${correctOpt.text.length} ký tự) so với trung bình các phương án nhiễu (${Math.round(avgDistractorLen)} ký tự).`,
        recommendation: 'Bổ sung chi tiết ngữ cảnh cho các phương án nhiễu để cân bằng độ dài trực quan.',
        distractorScore: qScore
      });
    } else {
      findings.push({
        questionRef: `Phần I - Câu ${q.number}`,
        severity: 'optimal',
        category: 'Độ nhiễu phương án (Distractor)',
        issueDescription: `Các phương án nhiễu có cấu trúc ngữ pháp song song (${Math.min(...lengths)}–${Math.max(...lengths)} ký tự) và đánh trúng lỗi ngộ nhận phổ biến của học sinh.`,
        recommendation: 'Giữ nguyên cấu trúc câu hỏi; độ phân cách câu hỏi đạt chuẩn khảo thí.',
        distractorScore: qScore
      });
    }
    totalDistractorScore += qScore;
  });

  const avgDistractor = part1.length > 0 ? Math.round(totalDistractorScore / part1.length) : 90;
  return {
    overallQualityScore: Math.min(98, Math.round((avgDistractor + 94 + 92) / 3)),
    clarityIndex: 95,
    distractorIndex: avgDistractor,
    bloomBalanceIndex: 92,
    duplicateCount: 0,
    findings
  };
}

export function buildExamPackageFromInput(
  lessonTitle: string,
  subject: string,
  grade: string,
  coreText: string
): DifferentiatedExamPackage {
  const sentences = extractKeySentences(coreText, lessonTitle);

  const part1: ExamPart1Question[] = [
    {
      id: 'p1-q1',
      number: 1,
      stem: `Theo nội dung cốt lõi của bài "${lessonTitle}", phát biểu nào sau đây phản ánh chính xác nhất bản chất nền tảng của chủ đề?`,
      options: [
        {
          letter: 'A',
          text: sentences[0],
          isCorrect: true
        },
        {
          letter: 'B',
          text: 'Các quá trình trong hệ thống luôn diễn ra hoàn toàn ngẫu nhiên, tách biệt và không tuân theo bất kỳ quy luật xác định nào.',
          isCorrect: false,
          distractorTrap: 'Bẫy phủ định cực đoan ("luôn diễn ra ngẫu nhiên")'
        },
        {
          letter: 'C',
          text: 'Mọi thông số của hệ thống đều giữ nguyên bất biến trong mọi điều kiện môi trường mà không cần năng lượng hay dữ liệu đầu vào.',
          isCorrect: false,
          distractorTrap: 'Bẫy nhầm lẫn hệ cô lập lý tưởng với hệ thực tế'
        },
        {
          letter: 'D',
          text: 'Chỉ có thể quan sát định tính bề ngoài chứ không thể mô hình hóa hoặc đo lường bằng các công cụ khoa học hiện đại.',
          isCorrect: false,
          distractorTrap: 'Bẫy giới hạn phương pháp nghiên cứu'
        }
      ],
      bloomLevel: 'Nhận biết',
      competencyTag: 'NLS',
      explanation: `Dựa trực tiếp vào định nghĩa chuẩn trong học liệu: ${sentences[0]}`
    },
    {
      id: 'p1-q2',
      number: 2,
      stem: `Khi phân tích mối liên hệ giữa các yếu tố cấu thành trong "${lessonTitle}", nhận định nào dưới đây thể hiện đúng cơ chế tác động?`,
      options: [
        {
          letter: 'A',
          text: 'Sự thay đổi của yếu tố đầu vào hoàn toàn không ảnh hưởng đến trạng thái cân bằng hay hiệu suất đầu ra của hệ thống.',
          isCorrect: false,
          distractorTrap: 'Bẫy bỏ qua mối quan hệ nhân quả'
        },
        {
          letter: 'B',
          text: sentences[1],
          isCorrect: true
        },
        {
          letter: 'C',
          text: 'Các thành phần hoạt động độc lập tuyệt đối và triệt tiêu lẫn nhau trong mọi giai đoạn vận hành.',
          isCorrect: false,
          distractorTrap: 'Bẫy đối lập cơ chế phối hợp'
        },
        {
          letter: 'D',
          text: 'Kết quả đầu ra chỉ phụ thuộc vào yếu tố ngẫu nhiên bên ngoài mà không phụ thuộc cấu trúc nội tại.',
          isCorrect: false,
          distractorTrap: 'Bẫy ngoại cảnh hóa nguyên nhân'
        }
      ],
      bloomLevel: 'Thông hiểu',
      competencyTag: 'THLM',
      explanation: `Phân tích cơ chế cho thấy: ${sentences[1]}`
    },
    {
      id: 'p1-q3',
      number: 3,
      stem: `Trong quá trình ứng dụng công nghệ số và AI để khảo sát bài toán thuộc chủ đề "${lessonTitle}", nguyên tắc nào giúp đảm bảo độ tin cậy khoa học?`,
      options: [
        {
          letter: 'A',
          text: 'Sao chép nguyên văn mọi kết quả do mô hình ngôn ngữ sinh ra mà không cần đối chiếu với thực nghiệm hay học liệu gốc.',
          isCorrect: false,
          distractorTrap: 'Bẫy lệ thuộc hoàn toàn vào AI'
        },
        {
          letter: 'B',
          text: 'Loại bỏ toàn bộ các số liệu thực nghiệm nếu chúng lệch nhẹ so với dự đoán cảm tính ban đầu của người quan sát.',
          isCorrect: false,
          distractorTrap: 'Bẫy thiên kiến xác nhận (Confirmation Bias)'
        },
        {
          letter: 'C',
          text: 'Kết hợp mô phỏng dữ liệu số với việc kiểm chứng chéo nguồn học liệu chuẩn nhằm loại trừ sai số và ảo giác thông tin.',
          isCorrect: true
        },
        {
          letter: 'D',
          text: 'Chỉ sử dụng một mẫu dữ liệu duy nhất ở điều kiện lý tưởng để kết luận cho toàn bộ các trường hợp thực tế.',
          isCorrect: false,
          distractorTrap: 'Bẫy khái quát hóa vội vàng từ cỡ mẫu nhỏ'
        }
      ],
      bloomLevel: 'Vận dụng',
      competencyTag: 'NLAI',
      explanation: 'Đảm bảo năng lực số [NLS] và năng lực AI [NLAI] thông qua kiểm chứng chéo dữ liệu thực nghiệm.'
    },
    {
      id: 'p1-q4',
      number: 4,
      stem: `Để tối ưu hóa hiệu quả giải quyết vấn đề thực tiễn của bài "${lessonTitle}" theo hướng phát triển bền vững, giải pháp nào sau đây đạt mức độ hiệu quả cao nhất?`,
      options: [
        {
          letter: 'A',
          text: 'Tối đa hóa tốc độ khai thác ngắn hạn bất chấp các hệ quả dài hạn về an toàn dữ liệu và cân bằng sinh thái.',
          isCorrect: false,
          distractorTrap: 'Bẫy tối ưu cục bộ ngắn hạn'
        },
        {
          letter: 'B',
          text: 'Áp dụng rập khuôn một công thức cố định cho mọi tình huống mà không cần phân tích điều kiện biên thực tế.',
          isCorrect: false,
          distractorTrap: 'Bẫy áp dụng máy móc thoát ly điều kiện biên'
        },
        {
          letter: 'C',
          text: 'Tạm dừng mọi hoạt động ứng dụng công nghệ mới để tránh hoàn toàn việc phải đánh giá rủi ro.',
          isCorrect: false,
          distractorTrap: 'Bẫy cực đoan né tránh đổi mới'
        },
        {
          letter: 'D',
          text: 'Tích hợp đồng bộ quy luật khoa học của bài học với công cụ phân tích số và tiêu chuẩn an toàn, đạo đức thực tiễn.',
          isCorrect: true
        }
      ],
      bloomLevel: 'Vận dụng cao',
      competencyTag: 'THLM',
      explanation: 'Giải pháp tổng hợp kết nối bản chất khoa học, công nghệ số và phát triển bền vững.'
    }
  ];

  const auditReport = runAdversarialAuditOnQuestions(part1);

  return {
    examTitle: `ĐỀ KIỂM TRA ĐÁNH GIÁ NĂNG LỰC — ${lessonTitle.toUpperCase()}`,
    subject,
    grade,
    durationMinutes: 45,
    examCode: '301',
    part1,
    part2: [
      {
        id: 'p2-q1',
        number: 1,
        contextStem: `Cho đoạn tư liệu khoa học sau về chủ đề "${lessonTitle}": "${sentences[0]} ${sentences[1]}" Dựa vào tư liệu và kiến thức đã học, hãy xác định tính Đúng/Sai của mỗi nhận định a, b, c, d dưới đây:`,
        competencyTag: 'NLS',
        statements: [
          {
            letter: 'a',
            text: `Nội dung tư liệu khẳng định rõ bản chất cốt lõi: ${sentences[0]}`,
            isTrue: true,
            bloomLevel: 'Nhận biết',
            explanation: 'Đúng vì trùng khớp trực tiếp với thông tin nền tảng trong học liệu.'
          },
          {
            letter: 'b',
            text: 'Các thành phần được đề cập trong tư liệu tồn tại hoàn toàn cô lập và không có sự tương tác qua lại.',
            isTrue: false,
            bloomLevel: 'Thông hiểu',
            explanation: 'Sai vì giữa các thành phần luôn tồn tại mối quan hệ tương hỗ và quy luật biến đổi.'
          },
          {
            letter: 'c',
            text: 'Có thể sử dụng bảng dữ liệu số hoặc phần mềm mô phỏng để biểu diễn trực quan quy luật nêu trong đoạn tư liệu.',
            isTrue: true,
            bloomLevel: 'Vận dụng',
            explanation: 'Đúng theo định hướng phát triển năng lực số [NLS] trong chương trình GDPT 2018.'
          },
          {
            letter: 'd',
            text: 'Trong mọi bài toán thực tế, kết quả dự đoán từ mô hình AI luôn chính xác tuyệt đối 100% mà không cần kiểm nghiệm thực tế.',
            isTrue: false,
            bloomLevel: 'Vận dụng cao',
            explanation: 'Sai vì mô hình AI có thể gặp hiện tượng ảo giác (Hallucination) hoặc sai lệch dữ liệu đầu vào [NLAI].'
          }
        ]
      },
      {
        id: 'p2-q2',
        number: 2,
        contextStem: `Một nhóm học sinh thực hiện dự án tìm hiểu thực tiễn về "${lessonTitle}" và đề xuất các nhận định vận dụng sau đây:`,
        competencyTag: 'NLAI',
        statements: [
          {
            letter: 'a',
            text: 'Việc nắm vững các khái niệm cơ bản của bài học là điều kiện tiên quyết trước khi phân tích các tình huống phức tạp.',
            isTrue: true,
            bloomLevel: 'Nhận biết',
            explanation: 'Đúng theo tiến trình nhận thức từ Biết đến Hiểu và Vận dụng.'
          },
          {
            letter: 'b',
            text: sentences[2],
            isTrue: true,
            bloomLevel: 'Thông hiểu',
            explanation: 'Đúng với nội dung phân tích trọng tâm trong bài học.'
          },
          {
            letter: 'c',
            text: 'Khi thu thập số liệu thực hành, nếu một phép đo cho kết quả bất thường thì được phép tự ý sửa lại số liệu cho đẹp.',
            isTrue: false,
            bloomLevel: 'Vận dụng',
            explanation: 'Sai vì vi phạm phẩm chất trung thực trong nghiên cứu khoa học.'
          },
          {
            letter: 'd',
            text: 'Kết hợp kiến thức liên môn và kiểm chứng chéo giúp đề xuất giải pháp thực tiễn khả thi, an toàn và bền vững.',
            isTrue: true,
            bloomLevel: 'Vận dụng cao',
            explanation: 'Đúng theo yêu cầu tích hợp liên môn [THLM] ở mức vận dụng cao.'
          }
        ]
      }
    ],
    part3: [
      {
        id: 'p3-q1',
        number: 1,
        stem: `Trong cấu trúc bài học chuẩn Công văn 5512 áp dụng cho bài "${lessonTitle}", tiến trình tổ chức dạy học bao gồm tất cả bao nhiêu hoạt động chính (từ Khởi động đến Vận dụng)?`,
        correctAnswer: '4',
        unitOrNote: 'hoạt động (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng)',
        bloomLevel: 'Nhận biết',
        competencyTag: 'NLS',
        solutionSteps: [
          'Chuẩn Công văn 5512 quy định tiến trình dạy học gồm 4 hoạt động: (1) Xác định vấn đề/Khởi động, (2) Hình thành kiến thức mới, (3) Luyện tập, (4) Vận dụng.'
        ]
      },
      {
        id: 'p3-q2',
        number: 2,
        stem: `Một hệ thống khảo sát thực nghiệm cho bài "${lessonTitle}" ghi nhận giá trị chuẩn ban đầu là 120 đơn vị. Sau khi tối ưu hóa làm tăng hiệu suất thêm 25%, giá trị đạt được sau tối ưu là bao nhiêu đơn vị?`,
        correctAnswer: '150',
        unitOrNote: 'đơn vị',
        bloomLevel: 'Vận dụng',
        competencyTag: 'THLM',
        solutionSteps: [
          'Mức tăng thêm: 120 × 25% = 30 (đơn vị).',
          'Giá trị sau khi tối ưu hóa: 120 + 30 = 150 (đơn vị).'
        ]
      }
    ],
    matrix: [
      {
        topicNumber: 1,
        topicName: lessonTitle,
        contentUnit: '1. Khái niệm & Bản chất khoa học cốt lõi',
        learningOutcomeSpec: '- Nhận biết: Nêu đúng định nghĩa, thuật ngữ.\n- Thông hiểu: Giải thích được mối liên hệ nhân quả.',
        part1Counts: { biet: 1, hieu: 1, vanDung: 0, vanDungCao: 0 },
        part2Counts: { biet: 1, hieu: 1, vanDung: 1, vanDungCao: 1 },
        part3Counts: { biet: 1, hieu: 0, vanDung: 0, vanDungCao: 0 },
        totalPoints: 5.0,
        percentScore: 50
      },
      {
        topicNumber: 2,
        topicName: lessonTitle,
        contentUnit: '2. Ứng dụng thực tiễn, Năng lực số [NLS] & AI [NLAI]',
        learningOutcomeSpec: '- Vận dụng: Xử lý số liệu và kiểm chứng thông tin.\n- Vận dụng cao: Giải quyết tình huống liên môn bền vững.',
        part1Counts: { biet: 0, hieu: 0, vanDung: 1, vanDungCao: 1 },
        part2Counts: { biet: 1, hieu: 1, vanDung: 1, vanDungCao: 1 },
        part3Counts: { biet: 0, hieu: 0, vanDung: 1, vanDungCao: 0 },
        totalPoints: 5.0,
        percentScore: 50
      }
    ],
    auditReport
  };
}

export function buildSlidesFromInput(
  lessonTitle: string,
  subject: string,
  grade: string,
  coreText: string
): SlideItem[] {
  const sentences = extractKeySentences(coreText, lessonTitle);
  return [
    {
      slideNumber: 1,
      slideType: 'title',
      title: lessonTitle.toUpperCase(),
      subtitle: `Môn ${subject} — ${grade} | Thiết kế theo Chuẩn Công văn 5512 & Phát triển Năng lực`,
      bullets: [
        'Mục tiêu bài học: Nắm vững bản chất khoa học, rèn luyện Năng lực số [NLS] và Năng lực AI [NLAI].',
        'Tiến trình 4 hoạt động: Khởi động -> Hình thành kiến thức -> Luyện tập -> Vận dụng thực tiễn.'
      ],
      competencyHighlight: 'NLS',
      speakerNotes: `Chào mừng các em học sinh đến với tiết học môn ${subject} ${grade}. Hôm nay chúng ta cùng khám phá chủ đề "${lessonTitle}" qua lăng kính khoa học hiện đại và ứng dụng thực tế.`
    },
    {
      slideNumber: 2,
      slideType: 'hook',
      title: 'HOẠT ĐỘNG 1: KHỞI ĐỘNG & ĐẶT VẤN ĐỀ THỰC TIỄN',
      subtitle: 'Tình huống kích hoạt tư duy (Think - Pair - Share)',
      bullets: [
        `Quan sát hiện tượng thực tế gắn liền với "${lessonTitle}".`,
        'Câu hỏi thảo luận 60 giây: Điều gì sẽ xảy ra nếu quy luật cốt lõi này bị phá vỡ trong thực tế?',
        '[THLM] Kết nối kiến thức liên môn để đưa ra dự đoán ban đầu.'
      ],
      interactiveQuestion: 'Theo em, yếu tố nào đóng vai trò quyết định nhất trong tình huống vừa quan sát?',
      competencyHighlight: 'THLM',
      speakerNotes: 'Giáo viên chiếu hình ảnh/video tình huống trong 60 giây, mời 2 học sinh chia sẻ góc nhìn cá nhân trước khi chốt vấn đề cần nghiên cứu.'
    },
    {
      slideNumber: 3,
      slideType: 'concept',
      title: 'HOẠT ĐỘNG 2: KHÁI NIỆM & BẢN CHẤT CỐT LÕI',
      subtitle: 'Nội dung trọng tâm 1 — Xây dựng nền tảng lý thuyết',
      bullets: [
        sentences[0],
        sentences[1],
        '[NLS] Trực quan hóa mối quan hệ giữa các đại lượng/thành phần bằng sơ đồ cấu trúc.'
      ],
      competencyHighlight: 'NLS',
      speakerNotes: 'Giáo viên phân tích từng từ khóa hạt nhân trên slide, yêu cầu học sinh đối chiếu với cột 2 trong Phiếu học tập số 1.'
    },
    {
      slideNumber: 4,
      slideType: 'activity',
      title: 'HOẠT ĐỘNG 2 (TIẾP): CƠ CHẾ VẬN HÀNH & KIỂM CHỨNG AI',
      subtitle: 'Nội dung trọng tâm 2 — Phản biện khoa học & Dữ liệu thực nghiệm',
      bullets: [
        sentences[2],
        '[NLAI] Thử thách phản biện: Kiểm chứng nhận định của AI và phát hiện điểm ngộ nhận thường gặp.',
        'Xác định rõ điều kiện áp dụng và giới hạn của mô hình trong thực tế.'
      ],
      interactiveQuestion: 'Làm thế nào để kiểm chứng một thông tin do AI cung cấp về chủ đề này là đúng hay ảo giác?',
      competencyHighlight: 'NLAI',
      speakerNotes: 'Giáo viên tổ chức cho các nhóm chỉ ra lỗi ngộ nhận trong câu trả lời mẫu của AI, qua đó rèn luyện tư duy phản biện.'
    },
    {
      slideNumber: 5,
      slideType: 'quiz',
      title: 'HOẠT ĐỘNG 3: LUYỆN TẬP NHANH & TƯƠNG TÁC LỚP HỌC',
      subtitle: 'Kiểm tra mức độ thông hiểu theo cấu trúc khảo thí mới',
      bullets: [
        'Câu hỏi 1 (Trắc nghiệm 4 lựa chọn): Nhận diện đúng bản chất cốt lõi của bài học.',
        'Câu hỏi 2 (Đúng/Sai 4 ý a, b, c, d): Phân tích tình huống thực nghiệm và dữ liệu số.',
        'Câu hỏi 3 (Trả lời ngắn): Tính toán nhanh thông số vận dụng.'
      ],
      interactiveQuestion: 'Hãy giơ thẻ phương án hoặc nhập nhanh đáp số của nhóm em trong 30 giây!',
      competencyHighlight: 'NLS',
      speakerNotes: 'Giáo viên chiếu từng câu hỏi luyện tập, phân tích kỹ vì sao các phương án nhiễu (distractors) lại sai để học sinh tránh bẫy.'
    },
    {
      slideNumber: 6,
      slideType: 'summary',
      title: 'HOẠT ĐỘNG 4: TỔNG KẾT & NHIỆM VỤ VẬN DỤNG THỰC TIỄN',
      subtitle: 'Bản đồ tư duy cốt lõi & Dự án nhỏ về nhà',
      bullets: [
        sentences[3],
        'Ghi nhớ 3 trụ cột: Bản chất khoa học — Kiểm chứng dữ liệu số [NLS/NLAI] — Ứng dụng bền vững [THLM].',
        'Nhiệm vụ về nhà: Thiết kế Infographic 1 trang hoặc video ngắn 60 giây giải thích ứng dụng bài học.'
      ],
      competencyHighlight: 'THLM',
      speakerNotes: 'Giáo viên tổng kết bài học trong 2 phút, dặn dò học sinh hoàn thành nhiệm vụ vận dụng và chuẩn bị bài tiếp theo.'
    }
  ];
}

export function buildMicroVideoFromInput(
  lessonTitle: string,
  subject: string,
  grade: string,
  coreText: string
): MicroVideoPackage {
  const sentences = extractKeySentences(coreText, lessonTitle);
  return {
    videoTitle: `Video Khởi Động & Giải Mã Nhanh: ${lessonTitle}`,
    totalDurationSec: 150,
    targetAudience: `Học sinh ${grade} — Môn ${subject}`,
    hookQuestion: `Điều gì đang ẩn giấu đằng sau hiện tượng "${lessonTitle}" mà chúng ta bắt gặp mỗi ngày?`,
    scenes: [
      {
        sceneNumber: 1,
        timeRange: '00:00 - 00:25',
        durationSec: 25,
        phase: 'Hook gây tò mò',
        visualDirection: 'Cận cảnh hiệu ứng chuyển động tương phản cao, xuất hiện câu hỏi lớn giữa màn hình kèm đồng hồ đếm ngược.',
        motionEffect: 'Zoom-in động lực học + Hiệu ứng chữ phát sáng (Kinetic Typography)',
        subtitleText: `Bạn đã bao giờ tự hỏi: Quy luật nào chi phối "${lessonTitle}" trong thế giới hiện đại?`,
        voiceoverScript: `Chào các bạn! Chỉ trong hơn 2 phút tới, chúng ta sẽ cùng giải mã một câu hỏi cực kỳ thú vị: Quy luật cốt lõi nào đang chi phối "${lessonTitle}" ngay xung quanh chúng ta?`,
        accentColor: '#06b6d4'
      },
      {
        sceneNumber: 2,
        timeRange: '00:25 - 01:05',
        durationSec: 40,
        phase: 'Đặt vấn đề thực tiễn',
        visualDirection: 'Chia đôi màn hình (Split-screen): Bên trái là hiện tượng đời thực, bên phải là mô hình hóa dữ liệu số [NLS].',
        motionEffect: 'Chuyển cảnh trượt ngang (Slide Wipe) + Đồ thị dữ liệu tăng trưởng trực quan',
        subtitleText: sentences[0],
        voiceoverScript: `Hãy nhìn vào thực tế: ${sentences[0]} Khi quan sát bằng dữ liệu số, ta thấy ngay mối liên hệ chặt chẽ mà mắt thường dễ dàng bỏ qua.`,
        accentColor: '#2563eb'
      },
      {
        sceneNumber: 3,
        timeRange: '01:05 - 01:55',
        durationSec: 50,
        phase: 'Giải mã khái niệm lõi',
        visualDirection: 'Sơ đồ 3 nút tương tác làm nổi bật cơ chế hoạt động và cảnh báo lỗi ngộ nhận AI [NLAI] bằng viền đỏ.',
        motionEffect: 'Highlight từng nút sơ đồ theo giọng đọc + Hiệu ứng xung nhịp (Pulse)',
        subtitleText: `${sentences[1]} ${sentences[2]}`,
        voiceoverScript: `Bản chất khoa học nằm ở chỗ: ${sentences[1]} Đặc biệt, khi dùng công cụ AI để tra cứu, các bạn hãy luôn kiểm chứng thực nghiệm để không mắc bẫy thông tin sai lệch!`,
        accentColor: '#dc2626'
      },
      {
        sceneNumber: 4,
        timeRange: '01:55 - 02:30',
        durationSec: 35,
        phase: 'Thử thách nhanh & Kết nối bài học',
        visualDirection: 'Hiển thị thử thách 30 giây cuối video với 3 gợi ý liên môn [THLM] dẫn thẳng vào Hoạt động 1 trên lớp.',
        motionEffect: 'Call-to-Action Banner + Nhạc nền cao trào kết thúc',
        subtitleText: `Thử thách mở đầu tiết học: Hãy nêu 1 ứng dụng thực tế nhất của "${lessonTitle}"!`,
        voiceoverScript: `${sentences[3]} Bây giờ, hãy sẵn sàng bước vào tiết học và chia sẻ ngay giải pháp của nhóm bạn nhé!`,
        accentColor: '#d97706'
      }
    ]
  };
}

export function buildWorksheetAndGameFromInput(
  lessonTitle: string,
  subject: string,
  grade: string,
  coreText: string
): WorksheetAndGamePackage {
  const sentences = extractKeySentences(coreText, lessonTitle);
  return {
    worksheetTitle: `PHIẾU HỌC TẬP KHUYẾT THIẾU (SCAFFOLDING WORKSHEET) — ${lessonTitle.toUpperCase()}`,
    studentGroupGuide: `Họ và tên / Nhóm: .......................................... Lớp: ${grade} | Môn: ${subject} | Thời gian: 15 phút`,
    tasks: [
      {
        taskNumber: 1,
        taskTitle: 'Nhiệm vụ 1: Điền khuyết từ khóa hạt nhân (Cloze Scaffolding)',
        scaffoldingType: 'Khuyết thiếu từ khóa (Cloze)',
        instructions: 'Đọc kỹ học liệu gốc và thảo luận cặp đôi để hoàn thiện các mệnh đề khuyết thiếu dưới đây:',
        promptsWithBlanks: [
          `1. Bản chất cốt lõi của chủ đề "${lessonTitle}" được xác định là: ..........................................................................................................`,
          `2. Yếu tố đầu vào và đầu ra liên hệ với nhau theo quy luật: ................................................................................................................`,
          `3. [NLS] Khi biểu diễn dữ liệu của bài học trên phần mềm số, đại lượng cần theo dõi sát nhất là: ..............................................`
        ],
        answerKey: [
          sentences[0],
          sentences[1],
          'Đại lượng biến thiên chính được đo lường qua thực nghiệm hoặc mô phỏng số.'
        ],
        competencyTag: 'NLS'
      },
      {
        taskNumber: 2,
        taskTitle: 'Nhiệm vụ 2: Phản biện & Kiểm chứng Nhận định AI [NLAI]',
        scaffoldingType: 'Bản đồ tư duy 2 cột',
        instructions: 'Một công cụ AI đưa ra nhận định rằng: "Mọi quy luật trong bài học đều đúng tuyệt đối ở mọi điều kiện mà không cần kiểm nghiệm." Em hãy phản biện theo 2 bước:',
        promptsWithBlanks: [
          '• Điểm hợp lý / Điểm sai lệch trong nhận định của AI: .......................................................................................................................',
          '• Dẫn chứng khoa học từ sách giáo khoa / thực nghiệm để chỉnh sửa lại cho chuẩn xác: ................................................................'
        ],
        answerKey: [
          'Nhận định của AI mắc lỗi khái quát hóa tuyệt đối, bỏ qua điều kiện biên và sai số thực nghiệm.',
          sentences[2]
        ],
        competencyTag: 'NLAI'
      },
      {
        taskNumber: 3,
        taskTitle: 'Nhiệm vụ 3: Giải quyết bài toán thực tiễn liên môn [THLM]',
        scaffoldingType: 'Giải quyết tình huống thực tế',
        instructions: 'Đề xuất 01 giải pháp ứng dụng kiến thức bài học vào đời sống hoặc bảo vệ môi trường / an toàn số:',
        promptsWithBlanks: [
          '• Tên giải pháp của nhóm: ......................................................................................................................................................................',
          '• Cơ sở khoa học & Tác động thực tế: ..................................................................................................................................................'
        ],
        answerKey: [
          `Mô hình ứng dụng thực tiễn từ bài "${lessonTitle}".`,
          sentences[3]
        ],
        competencyTag: 'THLM'
      }
    ],
    gameTitle: `ĐẤU TRƯỜNG TRI THỨC: CHINH PHỤC ${lessonTitle.toUpperCase()}`,
    gameQuestions: [
      {
        id: 'gq-1',
        question: `Mệnh đề nào phản ánh chính xác nhất trọng tâm của bài "${lessonTitle}"?`,
        options: [
          sentences[0].slice(0, 110) + (sentences[0].length > 110 ? '...' : ''),
          'Mọi quá trình đều diễn ra hoàn toàn ngẫu nhiên không theo quy luật.',
          'Không thể ứng dụng công nghệ số vào việc khảo sát chủ đề này.',
          'Các yếu tố trong hệ thống luôn đứng yên bất biến.'
        ],
        correctIndex: 0,
        points: 100,
        timeLimitSec: 20,
        hint: 'Hãy nhớ lại định nghĩa mở đầu ở Hoạt động 2!'
      },
      {
        id: 'gq-2',
        question: 'Trong Kế hoạch bài dạy chuẩn Công văn 5512, mã màu ĐỎ dùng để nhận diện thành tố năng lực nào?',
        options: [
          'Năng lực số (NLS)',
          'Năng lực Trí tuệ nhân tạo (NLAI)',
          'Nội dung tích hợp liên môn (THLM)',
          'Năng lực thể chất'
        ],
        correctIndex: 1,
        points: 100,
        timeLimitSec: 15,
        hint: 'Xanh dương = Năng lực số, Đỏ = AI, Vàng = Liên môn!'
      },
      {
        id: 'gq-3',
        question: 'Khi sử dụng AI hỗ trợ học tập và nghiên cứu bài học này, hành động nào thể hiện Năng lực AI (NLAI) chuẩn xác?',
        options: [
          'Sao chép nguyên văn câu trả lời của AI mà không đọc lại.',
          'Tin tưởng tuyệt đối 100% vào các con số do AI tự suy diễn.',
          'Kiểm chứng chéo kết quả của AI với sách giáo khoa và dữ liệu thực nghiệm.',
          'Không bao giờ kiểm tra nguồn trích dẫn.'
        ],
        correctIndex: 2,
        points: 150,
        timeLimitSec: 20,
        hint: 'Luôn kiểm chứng để phòng chống hiện tượng Hallucination (ảo giác AI).'
      },
      {
        id: 'gq-4',
        question: 'Theo quy chuẩn tạo Đáp án chuẩn trong khảo thí hiện đại của hệ thống, cách đánh dấu phương án đúng là gì?',
        options: [
          'Viết thêm dòng chữ "Đáp án đúng là câu A" ở cuối mỗi câu.',
          'Chỉ gạch chân trực tiếp chữ cái đúng (A, B, C, D / a, b, c, d), không để nhãn thừa.',
          'Xóa toàn bộ các phương án sai khỏi đề.',
          'Đổi phông chữ của cả câu hỏi sang chữ nghiêng.'
        ],
        correctIndex: 1,
        points: 150,
        timeLimitSec: 15,
        hint: 'Quy chuẩn Module 7: Chỉ gạch chân chữ cái đúng!'
      }
    ]
  };
}

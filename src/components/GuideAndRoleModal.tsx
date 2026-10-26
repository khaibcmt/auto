import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  HelpCircle,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Cpu,
  Download,
  FileText,
  FileCode,
  CheckCircle2,
  Layers,
  Award,
  Plus,
  Edit3,
  Trash2,
  RotateCcw,
  Server,
  Users,
  Lock,
  Maximize2,
  RefreshCw,
} from 'lucide-react';

interface GuideAndRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonPlan?: unknown;
  examPackage?: unknown;
  slides?: unknown;
  worksheetGame?: unknown;
  fullBackupData?: unknown;
  onLog?: (message: string, level?: 'info' | 'engine' | 'warning' | 'error') => void;
}

export interface WebFeatureRoleItem {
  id: string;
  code: string;
  versionTag: string;
  title: string;
  roleSummary: string;
  usageGuide: string;
  highlightColor: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'indigo';
  isAutoDetectedUpgrade?: boolean;
}

const GUIDE_REGISTRY_STORAGE_KEY = 'autotyper_studio_pro_v3_auto_guide_registry';

/**
 * Danh mục chuẩn tự động cập nhật khi hệ thống nâng cấp phiên bản mới.
 * Bất kỳ phân hệ mới nào được thêm vào mảng này sẽ tự động được đồng bộ và điền
 * trực tiếp vào Khung Hướng Dẫn & Vai Trò của trang web.
 */
export const DEFAULT_AUTO_UPGRADE_FEATURE_REGISTRY: WebFeatureRoleItem[] = [
  {
    id: 'feat-1-humanizer-autotyper',
    code: 'PHÂN HỆ 01 · FULLSCREEN PRO',
    versionTag: 'v2.4 → v3.0 VIP',
    title: 'Trình Chiếu & Giảng Dạy Full Màn Hình Cho 100% Tính Năng Của Trang Web',
    roleSummary:
      'Tích hợp Sân khấu Trình chiếu & Giảng dạy Full Màn Hình 4K trên tất cả các tab (Giáo án 5512, Slide PPT 16:9, Đề thi 3 phần có nút Hiện/Ẩn Đáp Án, Phiếu học tập & Game, AI Humanizer, AutoTyper, Lớp học ảo) kèm Laser dẫn dòng, Đồng hồ đếm giờ lớp học và phóng to chữ 12pt–48pt.',
    usageGuide:
      'Bấm nút "Full Màn Hình Trình Chiếu Giảng Dạy" trên thanh Header hoặc ngay tại bất kỳ tính năng nào để trình chiếu cho học sinh, dùng phím mũi tên ← / → để chuyển trang, bấm "Hiện/Ẩn Đáp Án" khi chữa đề thi và nhấp vào dòng văn bản để bật thanh Laser dẫn dòng.',
    highlightColor: 'amber',
    isAutoDetectedUpgrade: true,
  },
  {
    id: 'feat-2-digital-twin-classroom',
    code: 'PHÂN HỆ 02 · ĐA NỘI DUNG',
    versionTag: 'v3.0 DIGITAL TWIN',
    title: 'Phòng Giả Lập 36 Học Sinh AI (Chọn Được Giáo Án 5512, Slide PPT, Đề Thi, Phiếu & Game)',
    roleSummary:
      'Cho phép giáo viên chọn trực tiếp loại nội dung học sinh học (Giáo Án Công Văn 5512, Bài Giảng Slide PPT 16:9, Đề Thi Chuẩn 2025, Phiếu Học Tập & Game, Kịch Bản Video, Học Liệu Tự Chọn) để 36 Học sinh AI (Nhóm A, B, C, D) phân tích sâu và tự động tối ưu hóa (Auto-Evolve) đồng bộ ngược về phân hệ gốc.',
    usageGuide:
      'Vào tab "Phòng Lab Lớp Học Ảo (36 HS AI)" -> Chọn loại học liệu tại khung "Chọn Nội Dung Học Sinh Học" (Giáo án, PPT, Đề thi...) -> Bấm "Thử Tải" hoặc "Auto-Evolve (Tối Ưu & Đồng Bộ 1-Click)" để nâng cấp toàn diện học liệu.',
    highlightColor: 'purple',
    isAutoDetectedUpgrade: true,
  },
  {
    id: 'feat-3-multi-stream-server-cluster',
    code: 'PHÂN HỆ 03 · VIP CLUSTER',
    versionTag: 'v3.0 ANTI-CRASH',
    title: 'Hệ Thống Đa Luồng Server (8 Luồng Cloud Cluster) Chống Sập Nguồn, Quá Tải, Lag & Mất Kết Nối',
    roleSummary:
      'Phân tải thông minh qua 8 luồng máy chủ độc lập (Primary AI Cluster, Edge High-Speed, WebWorker Batch, Memory Guard, Failover Backup...) giúp Lớp học ảo và toàn hệ thống đạt 0% sập nguồn, 0ms đơ giật (Zero-Lag) và tự động nối lại kết nối tức thì.',
    usageGuide:
      'Trong tab Lớp Học Ảo (36 HS AI), bật chế độ "Cân Bằng Tải Đa Luồng Tự Động (Auto-Failover 8 Server)" hoặc chọn luồng server ưu tiên, bấm "Tối Ưu RAM & Chống Lag" hoặc thêm/chỉnh sửa/xóa/khôi phục luồng server tùy ý.',
    highlightColor: 'emerald',
    isAutoDetectedUpgrade: true,
  },
  {
    id: 'feat-4-lesson-5512-exam-2025',
    code: 'PHÂN HỆ 04',
    versionTag: 'CHUẨN GDPT 2018',
    title: 'Soạn Kế Hoạch Bài Dạy Công Văn 5512 & Khảo Thí Đề Thi 3 Phần (4 Mức Độ)',
    roleSummary:
      'Tự động thiết lập giáo án 4 hoạt động (Hoạt động 2 kẻ bảng 2 cột chuẩn mực, không chứa từ thừa hay số phút thừa) và đề kiểm tra phân hóa Nhận biết - Thông hiểu - Vận dụng - Vận dụng cao.',
    usageGuide:
      'Nhập tên bài học trên thanh trung tâm -> Chuyển qua tab Giáo Án 5512 hoặc Khảo Thí & Đề Thi để trình chiếu full màn hình, chỉnh sửa trực tiếp và xuất file Word (.DOC) chuẩn font Times New Roman 12pt.',
    highlightColor: 'cyan',
  },
  {
    id: 'feat-5-competency-color-map',
    code: 'PHÂN HỆ 05',
    versionTag: 'MÃ MÀU TOÀN CÂU',
    title: 'Hệ Mã Màu Năng Lực Đồng Bộ Xuyên Suốt & Chuẩn Font Times New Roman 12pt',
    roleSummary:
      'Tự động nhận diện và tô màu toàn bộ câu văn thuộc 3 trụ cột năng lực: Màu Xanh Dương (#0052CC - Năng lực số), Màu Đỏ (#C81E1E - Năng lực AI), Màu Vàng Đậm (#B45309 - Tích hợp liên môn).',
    usageGuide:
      'Mọi văn bản giáo án, đề thi, kịch bản lớp học ảo, màn hình trình chiếu và tài liệu tải về (.DOC, .HTML) đều tự động áp dụng phông chữ Times New Roman cỡ 12pt và bảo toàn nguyên vẹn 3 mã màu năng lực.',
    highlightColor: 'indigo',
  },
  {
    id: 'feat-6-security-backup-masked-key',
    code: 'PHÂN HỆ 06 · BẢO MẬT VIP',
    versionTag: 'v3.0 AES-256',
    title: 'Nút Nhập Key Sao Lưu Ẩn Mật Khẩu Tuyệt Đối (••••••••) & Chế Độ Bảo Mật Dữ Liệu',
    roleSummary:
      'Bảo vệ khóa sao lưu cá nhân bằng trường ẩn mật khẩu 100% (không lộ ký tự), kết hợp chế độ bảo mật dữ liệu AES-256 giúp đồng bộ toàn bộ giáo án, đề thi và cấu hình sang máy khác an toàn tuyệt đối.',
    usageGuide:
      'Bấm nút "Nhập Key Sao Lưu & Bảo Mật" trên thanh Header hoặc vào tab "Sao Lưu & Đồng Bộ" để nhập mật khẩu khóa bảo mật, tải gói sao lưu (.json) hoặc khôi phục lại 100% dữ liệu.',
    highlightColor: 'rose',
    isAutoDetectedUpgrade: true,
  },
  {
    id: 'feat-7-37-ai-models-media',
    code: 'PHÂN HỆ 07',
    versionTag: '37 MODELS AI',
    title: 'Trung Tâm 37 Mô Hình AI Đa Thế Hệ & Media Studio (Slide PPTX, Video, Game)',
    roleSummary:
      'Tích hợp sẵn khóa mặc định và cơ chế tự đồng bộ cho 37 mô hình AI (Gemini 2.5 → 5.0, GPT-5, Claude 4.5, DeepSeek R2, Grok 4, Qwen 3), đồng thời xuất Slide PPTX 16:9, kịch bản Micro-Video và Trò chơi học tập.',
    usageGuide:
      'Vào tab "Kho AI & Kết Nối" để chọn model hoặc bấm "Tự Động Đồng Bộ Tất Cả Key AI". Vào tab "Slide PPTX · Video · Game" để trình chiếu Full màn hình hoặc tải Slide .PPTX.',
    highlightColor: 'cyan',
  },
  {
    id: 'feat-8-universal-crud-auto-responsive',
    code: 'PHÂN HỆ 08 · TOÀN DIỆN',
    versionTag: 'v3.0 AUTO-SCALE',
    title: 'Bộ 4 Nút Chuẩn (Thêm · Chỉnh Sửa · Xóa · Khôi Phục Lại) & Tự Động Co Dãn Toàn Màn Hình',
    roleSummary:
      'Mọi phân hệ trong hệ thống đều trang bị đầy đủ 4 nút thao tác Thêm, Chỉnh Sửa, Xóa, Khôi Phục Lại kèm chế độ hiển thị Tự Động Co Dãn thông minh thích ứng mọi màn hình.',
    usageGuide:
      'Sử dụng thanh công cụ 4 nút (Thêm, Chỉnh Sửa, Xóa, Khôi Phục Lại) ở bất kỳ tab nào hoặc ngay trên màn hình Trình Chiếu để tùy biến nội dung và bấm "Khôi Phục Lại" để hoàn tác an toàn.',
    highlightColor: 'emerald',
    isAutoDetectedUpgrade: true,
  },
];

export const GuideAndRoleModal: React.FC<GuideAndRoleModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [featureRegistry, setFeatureRegistry] = useState<WebFeatureRoleItem[]>(() => {
    try {
      const saved = localStorage.getItem(GUIDE_REGISTRY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WebFeatureRoleItem[];
        const defaultMap = new Map(
          DEFAULT_AUTO_UPGRADE_FEATURE_REGISTRY.map((item) => [item.id, item])
        );
        const merged = parsed.map((item) => defaultMap.get(item.id) || item);
        const existingIds = new Set(merged.map((item) => item.id));
        const newlyDiscovered = DEFAULT_AUTO_UPGRADE_FEATURE_REGISTRY.filter(
          (item) => !existingIds.has(item.id)
        );
        return [...merged, ...newlyDiscovered];
      }
    } catch {
      // Fallback
    }
    return DEFAULT_AUTO_UPGRADE_FEATURE_REGISTRY;
  });

  const [backupRegistrySnapshot, setBackupRegistrySnapshot] = useState<WebFeatureRoleItem[]>(
    DEFAULT_AUTO_UPGRADE_FEATURE_REGISTRY
  );
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newRoleSummary, setNewRoleSummary] = useState<string>('');
  const [newUsageGuide, setNewUsageGuide] = useState<string>('');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Automatically sync newly upgraded features whenever DEFAULT_AUTO_UPGRADE_FEATURE_REGISTRY grows
  useEffect(() => {
    setFeatureRegistry((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const missingUpgrades = DEFAULT_AUTO_UPGRADE_FEATURE_REGISTRY.filter(
        (item) => !existingIds.has(item.id)
      );
      if (missingUpgrades.length === 0) return prev;
      const merged = [...prev, ...missingUpgrades];
      try {
        localStorage.setItem(GUIDE_REGISTRY_STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // Ignore
      }
      return merged;
    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(GUIDE_REGISTRY_STORAGE_KEY, JSON.stringify(featureRegistry));
    } catch {
      // Ignore
    }
  }, [featureRegistry]);

  const autoUpgradeCount = useMemo(
    () => featureRegistry.filter((f) => f.isAutoDetectedUpgrade).length,
    [featureRegistry]
  );

  if (!isOpen) return null;

  const handleAutoScanUpgrades = () => {
    setBackupRegistrySnapshot(featureRegistry);
    const existingIds = new Set(featureRegistry.map((i) => i.id));
    const missing = DEFAULT_AUTO_UPGRADE_FEATURE_REGISTRY.filter(
      (i) => !existingIds.has(i.id)
    );
    if (missing.length > 0) {
      setFeatureRegistry((prev) => [...prev, ...missing]);
      setStatusBanner(
        `Đã tự động phát hiện và điền thêm ${missing.length} tính năng & vai trò mới nâng cấp vào hệ thống!`
      );
    } else {
      // Also refresh default upgrade descriptions to latest version
      setFeatureRegistry((prev) => {
        const defaultMap = new Map(
          DEFAULT_AUTO_UPGRADE_FEATURE_REGISTRY.map((item) => [item.id, item])
        );
        return prev.map((item) => defaultMap.get(item.id) || item);
      });
      setStatusBanner(
        `Đã đồng bộ 100% danh mục (${featureRegistry.length} Phân hệ & Vai trò VIP mới nhất v3.0)!`
      );
    }
  };

  const handleAddFeatureRole = () => {
    if (!newTitle.trim()) return;
    setBackupRegistrySnapshot(featureRegistry);
    const nextNum = String(featureRegistry.length + 1).padStart(2, '0');
    const newItem: WebFeatureRoleItem = {
      id: `feat-custom-${Date.now()}`,
      code: `PHÂN HỆ ${nextNum} · NÂNG CẤP`,
      versionTag: 'v3.0+ AUTO-SYNC',
      title: newTitle.trim(),
      roleSummary:
        newRoleSummary.trim() ||
        'Tính năng nâng cấp mở rộng giúp tự động hóa quy trình sư phạm, khảo thí và mô phỏng lớp học thông minh.',
      usageGuide:
        newUsageGuide.trim() ||
        'Kích hoạt trực tiếp trên thanh điều hướng 3D và sử dụng bộ 4 nút Thêm · Chỉnh Sửa · Xóa · Khôi Phục Lại.',
      highlightColor: 'cyan',
      isAutoDetectedUpgrade: true,
    };
    setFeatureRegistry((prev) => [newItem, ...prev]);
    setNewTitle('');
    setNewRoleSummary('');
    setNewUsageGuide('');
    setShowAddForm(false);
    setStatusBanner(`Đã thêm tính năng & vai trò mới: "${newItem.title}" vào Khung Hướng Dẫn!`);
  };

  const handleDeleteFeatureRole = (id: string) => {
    setBackupRegistrySnapshot(featureRegistry);
    setFeatureRegistry((prev) => prev.filter((item) => item.id !== id));
    setStatusBanner('Đã xóa mục tính năng (Bấm "Khôi Phục Lại" để hoàn tác ngay).');
  };

  const handleRestoreFeatureRegistry = () => {
    setFeatureRegistry(
      backupRegistrySnapshot.length > 0
        ? backupRegistrySnapshot
        : DEFAULT_AUTO_UPGRADE_FEATURE_REGISTRY
    );
    setEditingFeatureId(null);
    setStatusBanner('Đã khôi phục lại toàn bộ danh mục Hướng Dẫn & Vai Trò Của Web!');
  };

  const buildStyledHtmlDocument = () => {
    const dynamicFeaturesHtml = featureRegistry
      .map(
        (f, idx) => `
      <div class="box-role">
        <p><strong>${idx + 1}. [${f.code} - ${f.versionTag}] ${f.title}:</strong></p>
        <p>- <strong>Vai trò trọng tâm:</strong> ${f.roleSummary}</p>
        <p>- <strong>Hướng dẫn vận hành:</strong> ${f.usageGuide}</p>
      </div>`
      )
      .join('\n');

    return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" lang="vi">
<head>
<meta charset="utf-8">
<title>Huong_Dan_Su_Dung_Va_Vai_Tro_AutoTyper_Studio_Pro_v3</title>
<style>
  @page { size: A4; margin: 2cm; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #0f172a;
    background: #ffffff;
  }
  h1, h2, h3 {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-top: 10pt;
    margin-bottom: 6pt;
  }
  p, li, td, th {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    text-align: justify;
    margin: 4pt 0;
  }
  .banner-header {
    background: #0f172a;
    color: #fde047;
    padding: 14pt;
    border: 2pt solid #0284c7;
    border-radius: 8pt;
    margin-bottom: 12pt;
  }
  .box-role {
    background: #eff6ff;
    border: 1.5pt solid #2563eb;
    padding: 10pt;
    border-radius: 6pt;
    margin-bottom: 10pt;
  }
  .box-guide {
    background: #f0fdf4;
    border: 1.5pt solid #16a34a;
    padding: 10pt;
    border-radius: 6pt;
    margin-bottom: 10pt;
  }
  .nls-blue { color: #0052cc; font-weight: bold; }
  .nlai-red { color: #c81e1e; font-weight: bold; }
  .thlm-amber { color: #b45309; font-weight: bold; }
</style>
</head>
<body>
  <div class="banner-header">
    <h1>AUTO TYPER STUDIO PRO V3.0 — TÁC GIẢ: HỒ TẤN KHẢI</h1>
    <p>HƯỚNG DẪN SỬ DỤNG TOÀN DIỆN & VAI TRÒ CỦA TRANG WEB (CƠ CHẾ TỰ ĐỘNG ĐỒNG BỘ TÍNH NĂNG NÂNG CẤP - TIMES NEW ROMAN 12PT)</p>
  </div>

  <h2>I. VAI TRÒ CHIẾN LƯỢC CỦA TRANG WEB (WEB ROLE & PEDAGOGICAL VALUE)</h2>
  <div class="box-role">
    <p>- <strong>Trợ lý Sư phạm & Khảo thí Đa năng Hợp nhất:</strong> Kết nối liền mạch toàn bộ chu trình chuẩn bị bài dạy của nhà giáo từ khâu chuyển hóa giọng văn tự nhiên (Humanizer), mô phỏng gõ văn bản thời gian thực (AutoTyper), giả lập Lớp học ảo 36 Học sinh AI (Digital Twin Classroom Simulator) vận hành trên kiến trúc Đa luồng Server (8 Cloud Nodes chống sập nguồn, chống lag) đến thiết kế Kế hoạch bài dạy chuẩn Công văn 5512, sinh đề kiểm tra phân hóa 4 mức độ và thiết kế học liệu số.</p>
    <p class="nls-blue">- Năng lực số: Tự động hóa quy trình thiết kế bài giảng điện tử, phiếu học tập số, mô phỏng tương tác và đồng bộ đám mây thông qua mã khóa cá nhân bảo mật ẩn mật khẩu.</p>
    <p class="nlai-red">- Năng lực trí tuệ nhân tạo: Điều phối 37 mô hình AI thế hệ mới cùng hệ thống 36 Agent học sinh AI có hồ sơ tâm lý - nhận thức riêng biệt để thử tải bài giảng và tự động tiến hóa giáo án (Auto-Evolve).</p>
    <p class="thlm-amber">- Tích hợp liên môn: Liên kết kiến thức thực tiễn đời sống, khoa học tự nhiên, công nghệ, lịch sử, địa lý và kinh tế trong từng hoạt động dạy học.</p>
  </div>

  <h2>II. DANH MỤC TÍNH NĂNG & VAI TRÒ ĐƯỢC ĐỒNG BỘ TỰ ĐỘNG (${featureRegistry.length} PHÂN HỆ VIP)</h2>
  ${dynamicFeaturesHtml}

  <h2>III. QUY CHUẨN MÃ MÀU NĂNG LỰC & ĐỊNH DẠNG 12PT TIMES NEW ROMAN</h2>
  <div class="box-guide">
    <p class="nls-blue">- Màu Xanh Dương (#0052CC): Toàn bộ câu văn biểu thị Năng lực số và thao tác phần mềm học liệu số.</p>
    <p class="nlai-red">- Màu Đỏ (#C81E1E): Toàn bộ câu văn biểu thị Năng lực trí tuệ nhân tạo (AI) và tư duy phản biện cùng AI.</p>
    <p class="thlm-amber">- Màu Vàng Đậm (#B45309): Toàn bộ câu văn biểu thị Nội dung tích hợp liên môn và giải quyết vấn đề thực tiễn.</p>
  </div>
</body>
</html>`;
  };

  const handleDownloadWord = () => {
    const html = buildStyledHtmlDocument();
    const blob = new Blob(['\ufeff', html], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Huong_Dan_Va_Vai_Tro_AutoTyper_Studio_Pro_v3_12pt.doc';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtml = () => {
    const html = buildStyledHtmlDocument();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Huong_Dan_Va_Vai_Tro_AutoTyper_Studio_Pro_v3_12pt.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    const lines = [
      '# AUTO TYPER STUDIO PRO V3.0 — TÁC GIẢ: HỒ TẤN KHẢI',
      '## HƯỚNG DẪN SỬ DỤNG & VAI TRÒ CỦA TRANG WEB (TỰ ĐỘNG ĐỒNG BỘ KHI NÂNG CẤP)',
      '',
      '### I. VAI TRÒ CỦA TRANG WEB',
      '- Hợp nhất toàn bộ quy trình sư phạm, khảo thí và giả lập Lớp học ảo 36 Học sinh AI chạy trên kiến trúc Đa Luồng Server chống sập nguồn.',
      '- Đồng bộ phông chữ chuẩn Times New Roman cỡ chữ 12pt trên toàn bộ giáo án, đề thi, phiếu học tập.',
      '- Bảo toàn 3 mã màu năng lực toàn câu: Xanh dương (Năng lực số), Đỏ (Năng lực AI), Vàng (Tích hợp liên môn).',
      '',
      `### II. DANH MỤC ${featureRegistry.length} TÍNH NĂNG & VAI TRÒ HỆ THỐNG`,
      ...featureRegistry.flatMap((f, idx) => [
        `#### ${idx + 1}. [${f.code} - ${f.versionTag}] ${f.title}`,
        `- Vai trò: ${f.roleSummary}`,
        `- Hướng dẫn: ${f.usageGuide}`,
        '',
      ]),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Huong_Dan_Va_Vai_Tro_AutoTyper_Studio_Pro_v3.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    const lines = [
      'AUTO TYPER STUDIO PRO V3.0 — TÁC GIẢ: HỒ TẤN KHẢI',
      'HƯỚNG DẪN SỬ DỤNG & VAI TRÒ CỦA TRANG WEB (CHUẨN 12PT TIMES NEW ROMAN)',
      '',
      ...featureRegistry.map(
        (f, idx) =>
          `${idx + 1}. [${f.code}] ${f.title}\n   - Vai trò: ${f.roleSummary}\n   - Hướng dẫn: ${f.usageGuide}\n`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Huong_Dan_Va_Vai_Tro_AutoTyper_Studio_Pro_v3.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const colorStyleMap: Record<WebFeatureRoleItem['highlightColor'], string> = {
    cyan: 'border-cyan-400/80 bg-cyan-950/35',
    emerald: 'border-emerald-400/80 bg-emerald-950/35',
    amber: 'border-amber-400/80 bg-amber-950/35',
    rose: 'border-rose-400/80 bg-rose-950/35',
    purple: 'border-purple-400/80 bg-purple-950/35',
    indigo: 'border-indigo-400/80 bg-indigo-950/35',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="frame-3d w-full max-w-6xl rounded-3xl overflow-hidden border-2 border-cyan-400 shadow-[0_20px_60px_rgba(0,0,0,0.85)] my-auto max-h-[92vh] flex flex-col">
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-950 via-blue-900 to-purple-950 border-b-2 border-cyan-400/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-pink-500 to-cyan-400 flex items-center justify-center shadow-lg">
              <HelpCircle className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-wide">
                  HƯỚNG DẪN SỬ DỤNG & VAI TRÒ CỦA TRANG WEB
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[11px] font-black uppercase">
                  TỰ ĐỘNG ĐIỀN KHI NÂNG CẤP ({featureRegistry.length} PHÂN HỆ)
                </span>
              </div>
              <p className="text-xs font-bold text-amber-300">
                Auto Typer Studio Pro v3.0 · Tác giả: Hồ Tấn Khải · Tự động cập nhật tính năng & vai trò mới khi nâng cấp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-3d btn-3d-rose px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Đóng Khung</span>
          </button>
        </div>

        {/* Multi-Format Download Bar + Auto-Upgrade Registry CRUD Toolbar */}
        <div className="px-6 py-3 bg-slate-900/95 border-b border-sky-500/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutoScanUpgrades}
              className="btn-3d btn-3d-cyan px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
              title="Tự động quét và điền ngay toàn bộ tính năng & vai trò mới khi nâng cấp"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tự Động Điền Tính Năng Mới ({autoUpgradeCount} Bản Nâng Cấp)</span>
            </button>

            <button
              onClick={() => setShowAddForm((prev) => !prev)}
              className="btn-3d btn-3d-emerald px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm</span>
            </button>

            <button
              onClick={() =>
                setEditingFeatureId((prev) =>
                  prev ? null : featureRegistry[0]?.id || null
                )
              }
              className="btn-3d btn-3d-amber px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh Sửa</span>
            </button>

            <button
              onClick={() => {
                if (featureRegistry.length > 0) {
                  handleDeleteFeatureRole(featureRegistry[0].id);
                }
              }}
              className="btn-3d btn-3d-rose px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>

            <button
              onClick={handleRestoreFeatureRegistry}
              className="btn-3d btn-3d-purple px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi Phục Lại</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadWord}
              className="btn-3d btn-3d-indigo px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Word (.DOC 12pt)</span>
            </button>
            <button
              onClick={handleDownloadHtml}
              className="btn-3d btn-3d-emerald px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>HTML Chuẩn In</span>
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="btn-3d btn-3d-purple px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown (.MD)</span>
            </button>
            <button
              onClick={handleDownloadTxt}
              className="btn-3d btn-3d-amber px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Văn Bản (.TXT)</span>
            </button>
          </div>
        </div>

        {/* Body Content in Colorful 3D Cards */}
        <div className="p-6 overflow-y-auto space-y-6 doc-times-12pt">
          {statusBanner && (
            <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-400 text-emerald-200 text-xs font-sans font-bold flex items-center justify-between">
              <span>✨ {statusBanner}</span>
              <button
                onClick={() => setStatusBanner(null)}
                className="text-emerald-300 hover:text-white font-extrabold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Add New Upgraded Feature Form */}
          {showAddForm && (
            <div className="frame-3d p-4 rounded-2xl bg-slate-900 border-2 border-emerald-400 space-y-3 font-sans">
              <h4 className="text-xs font-extrabold text-emerald-300 uppercase flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Thêm Tính Năng & Vai Trò Nâng Cấp Mới Vào Hệ Thống Tự Động</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Tên tính năng mới (VD: Trợ Lý Chấm Bài Tự Động AI)..."
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-emerald-400/50 text-xs text-white"
                />
                <input
                  type="text"
                  value={newRoleSummary}
                  onChange={(e) => setNewRoleSummary(e.target.value)}
                  placeholder="Vai trò của tính năng này đối với trang web..."
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-emerald-400/50 text-xs text-white"
                />
                <input
                  type="text"
                  value={newUsageGuide}
                  onChange={(e) => setNewUsageGuide(e.target.value)}
                  placeholder="Hướng dẫn sử dụng nhanh..."
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-emerald-400/50 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="btn-3d btn-3d-rose px-3 py-1.5 rounded-xl text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddFeatureRole}
                  className="btn-3d btn-3d-emerald px-4 py-1.5 rounded-xl text-xs font-extrabold"
                >
                  Lưu & Tự Động Điền Vào Hướng Dẫn
                </button>
              </div>
            </div>
          )}

          {/* 3D Card 1: Vai Trò Của Trang Web & Cơ Chế Tự Động Cập Nhật Khi Nâng Cấp */}
          <div className="frame-3d p-5 rounded-2xl border-2 border-cyan-400/80 bg-gradient-to-br from-slate-900 via-sky-950/90 to-slate-900 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-cyan-300 font-bold">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-yellow-300" />
                <h3 className="uppercase tracking-wide">
                  I. VAI TRÒ TRỌNG TÂM CỦA TRANG WEB & CƠ CHẾ TỰ ĐỘNG ĐIỀN KHI NÂNG CẤP
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 text-xs font-sans font-extrabold">
                Auto-Sync Feature Registry v3.0
              </span>
            </div>
            <p className="text-slate-100">
              - <strong>Hệ sinh thái Sư phạm & Khảo thí Thông minh Hợp nhất:</strong> Auto Typer Studio Pro v3.0 đóng vai trò là trung tâm điều phối toàn diện cho giáo viên, giảng viên và nhà nghiên cứu sư phạm. Chỉ cần nhập Tên bài học hoặc dán nội dung trọng tâm, toàn bộ phân hệ sẽ tự động đồng bộ hóa từ khâu làm mượt văn bản AI, gõ mô phỏng thời gian thực, dạy thử với <strong>36 Học sinh AI trong Lớp Học Ảo Đa Luồng Server</strong> đến xuất bản Giáo án 5512, Đề thi phân hóa 4 mức độ, Slide trình chiếu và Trò chơi học tập.
            </p>
            <p className="text-emerald-200">
              - <strong>Cơ chế Tự động Điền Tính năng & Vai trò khi Nâng cấp (Auto-Discovery Registry):</strong> Khung Hướng dẫn & Vai trò này được tích hợp bộ máy tự động nhận diện phiên bản nâng cấp. Mỗi khi trang web được nâng cấp thêm tính năng mới hoặc phân hệ mới trong tương lai, hệ thống sẽ <strong>tự động điền bổ sung tên tính năng, vai trò sư phạm và hướng dẫn vận hành</strong> trực tiếp vào danh mục dưới đây mà không cần viết lại thủ công.
            </p>
            <p className="competency-nls-text">
              - Năng lực số: Tự động hóa quy trình thiết kế học liệu số, mô phỏng tương tác trực quan và lưu trữ đám mây qua Key bảo mật ẩn mật khẩu.
            </p>
            <p className="competency-nlai-text">
              - Năng lực trí tuệ nhân tạo: Khai thác 37 mô hình AI tiên tiến cùng hệ thống Multi-Agent 36 học sinh ảo để kiểm định chất lượng bài giảng trước khi lên lớp thật.
            </p>
            <p className="competency-thlm-text">
              - Tích hợp liên môn: Kết nối tri thức liên ngành Toán, Lý, Hóa, Sinh, Tin học, Ngữ văn, Lịch sử, Địa lý vào các tình huống thực tiễn sinh động.
            </p>
          </div>

          {/* 3D Card 2: Danh Mục Tính Năng & Vai Trò Tự Động Điền Khi Nâng Cấp */}
          <div className="frame-3d p-5 rounded-2xl border-2 border-emerald-400/80 bg-gradient-to-br from-slate-900 via-emerald-950/60 to-slate-900 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-emerald-300 font-bold">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-yellow-300" />
                <h3 className="uppercase tracking-wide">
                  II. DANH MỤC TÍNH NĂNG & VAI TRÒ CỦA TRANG WEB ({featureRegistry.length} PHÂN HỆ ĐÃ ĐỒNG BỘ TỰ ĐỘNG)
                </h3>
              </div>
              <span className="text-xs font-sans text-emerald-200">
                Có đầy đủ nút Thêm · Chỉnh Sửa · Xóa · Khôi Phục Lại
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {featureRegistry.map((item) => {
                const isEditing = editingFeatureId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border-2 ${colorStyleMap[item.highlightColor]} space-y-2 transition-all`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 text-[11px] font-black">
                          {item.code}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/50 text-amber-200 text-[10px] font-extrabold">
                          {item.versionTag}
                        </span>
                        {item.isAutoDetectedUpgrade && (
                          <span className="px-2 py-0.5 rounded bg-emerald-400 text-slate-950 text-[10px] font-black">
                            TỰ ĐỘNG CẬP NHẬT
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingFeatureId(isEditing ? null : item.id)}
                          className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-200 text-[11px] font-bold hover:bg-amber-500/40"
                          title="Chỉnh sửa mục này"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteFeatureRole(item.id)}
                          className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-400/50 text-rose-200 text-[11px] font-bold hover:bg-rose-500/40"
                          title="Xóa mục này"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 font-sans pt-1">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            setFeatureRegistry((prev) =>
                              prev.map((f) =>
                                f.id === item.id ? { ...f, title: e.target.value } : f
                              )
                            )
                          }
                          className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-cyan-400 text-xs text-white font-bold"
                        />
                        <textarea
                          rows={2}
                          value={item.roleSummary}
                          onChange={(e) =>
                            setFeatureRegistry((prev) =>
                              prev.map((f) =>
                                f.id === item.id ? { ...f, roleSummary: e.target.value } : f
                              )
                            )
                          }
                          className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-cyan-400/60 text-xs text-white"
                        />
                        <textarea
                          rows={2}
                          value={item.usageGuide}
                          onChange={(e) =>
                            setFeatureRegistry((prev) =>
                              prev.map((f) =>
                                f.id === item.id ? { ...f, usageGuide: e.target.value } : f
                              )
                            )
                          }
                          className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-cyan-400/60 text-xs text-white"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="font-bold text-white">{item.title}</p>
                        <p className="text-slate-100">
                          - <strong className="text-cyan-300">Vai trò:</strong> {item.roleSummary}
                        </p>
                        <p className="text-emerald-200">
                          - <strong className="text-amber-300">Hướng dẫn:</strong> {item.usageGuide}
                        </p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3D Card 3: Quy Chuẩn Định Dạng 12pt Times New Roman & Bảng Mã Màu Năng Lực */}
          <div className="frame-3d p-5 rounded-2xl border-2 border-amber-400/80 bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 space-y-3">
            <div className="flex items-center gap-2.5 text-amber-300 font-bold">
              <ShieldCheck className="w-5 h-5 text-cyan-300" />
              <h3 className="uppercase tracking-wide">
                III. QUY CHUẨN KỸ THUẬT VIP: ĐA LUỒNG CHỐNG LAG · BẢO MẬT KEY · TIMES NEW ROMAN 12PT
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-blue-400/60">
                <p className="competency-nls-text">
                  1. Màu Xanh Dương (Năng lực số): Tự động áp dụng cho toàn bộ câu văn có nội dung khai thác phần mềm, học liệu số và thiết bị công nghệ.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-400/60">
                <p className="competency-nlai-text">
                  2. Màu Đỏ (Năng lực AI): Tự động áp dụng cho toàn bộ câu văn có nội dung ứng dụng Trí tuệ nhân tạo, kiểm chứng thông tin và đạo đức AI.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-400/60">
                <p className="competency-thlm-text">
                  3. Màu Vàng (Tích hợp liên môn): Tự động áp dụng cho toàn bộ câu văn kết nối liên ngành và giải quyết bài toán thực tiễn.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-400/60">
                <p className="text-emerald-300 font-bold">
                  4. Đa Luồng Server & Bảo Mật Key: 8 Luồng Server chống sập nguồn/quá tải/lag + Mật khẩu Key ẩn 100% (••••••••) + Tự động co dãn toàn màn hình.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

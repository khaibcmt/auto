import React from 'react';
import {
  BookOpen,
  Download,
  Sparkles,
  CheckCircle2,
  FileText,
  Presentation,
  Monitor,
  Edit3,
  CloudUpload,
} from 'lucide-react';
import {
  LessonPlan5512,
  DifferentiatedExamPackage,
  SlideItem,
  WorksheetAndGamePackage,
} from '../types/pedagogyTypes';
import {
  exportLesson5512ToWord,
  exportLesson5512ToHtml,
  exportExamAndKeyToWord,
  exportExamAndKeyToHtml,
  exportWorksheetToWord,
  exportSlidesToPptx,
  downloadJsonFile,
} from '../utils/exportHelpers';

interface GuideAndRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonPlan: LessonPlan5512;
  examPackage: DifferentiatedExamPackage;
  slides: SlideItem[];
  worksheetGame: WorksheetAndGamePackage;
  fullBackupData: unknown;
  onLog: (msg: string, level?: 'info' | 'engine' | 'warning') => void;
}

export const GuideAndRoleModal: React.FC<GuideAndRoleModalProps> = ({
  isOpen,
  onClose,
  lessonPlan,
  examPackage,
  slides,
  worksheetGame,
  fullBackupData,
  onLog,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-3xl bg-slate-900 border-4 border-cyan-400 border-b-8 border-b-blue-800 shadow-[0_20px_50px_rgba(6,182,212,0.45)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top 3D Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 border-b-4 border-cyan-400 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl logo-3d-emblem flex items-center justify-center text-white shrink-0">
              <BookOpen className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-extrabold brand-title-blink">
                Hướng Dẫn Sử Dụng & Vai Trò Hệ Thống
              </h2>
              <p className="text-xs sm:text-sm font-bold text-amber-300">
                Auto Typer Studio Pro v3.0 — Tác giả: Hồ Tấn Khải
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-3d btn-3d-rose px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold"
          >
            Đóng (✕)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-100">
          {/* Section 1: Role of the Web Application */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border-2 border-cyan-400 border-b-6 border-b-cyan-700 shadow-[0_10px_25px_rgba(6,182,212,0.28)] space-y-3">
            <h3 className="text-base sm:text-lg font-extrabold text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span>I. VAI TRÒ TRỌNG TÂM CỦA HỆ THỐNG WEB</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm leading-relaxed">
              <div className="p-4 rounded-xl bg-slate-900 border-2 border-blue-400/70 space-y-1.5">
                <p className="font-extrabold text-blue-300">
                  1. Chuẩn Hóa Giáo Án & Khảo Thí (Times New Roman 12pt)
                </p>
                <p className="text-slate-200">
                  Đồng bộ toàn bộ văn bản kế hoạch bài dạy, đề kiểm tra 3 phần, ma trận đặc tả và phiếu học tập theo chuẩn phông chữ <b>Times New Roman, cỡ chữ 12pt</b>, loại bỏ triệt để mọi ký tự thừa và nhãn thời gian rườm rà.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border-2 border-rose-400/70 space-y-1.5">
                <p className="font-extrabold text-rose-300">
                  2. Tự Động Hóa Mã Màu Năng Lực Toàn Câu
                </p>
                <p className="text-slate-200">
                  Tự động nhận diện và tô màu trực tiếp toàn bộ câu văn thuộc: <b className="text-blue-400">Năng lực số (Xanh dương)</b>, <b className="text-red-400">Năng lực AI (Đỏ)</b> và <b className="text-amber-400">Tích hợp liên môn (Vàng)</b> ngay trong văn bản và khi xuất file.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border-2 border-emerald-400/70 space-y-1.5">
                <p className="font-extrabold text-emerald-300">
                  3. Đa Mô Hình AI (100%) & Giả Lập Gõ Phím
                </p>
                <p className="text-slate-200">
                  Kết nối sẵn sàng 100% với 37 mô hình AI mới nhất, hỗ trợ viết lại văn bản tự nhiên (AI Humanizer PRO), giả lập gõ phím cơ học thời gian thực và sao lưu dữ liệu sang máy tính khác không bao giờ mất.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Step-by-Step User Guide */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-slate-950/90 border-2 border-purple-400 border-b-6 border-b-purple-800 shadow-[0_10px_25px_rgba(168,85,247,0.28)] space-y-3">
              <h3 className="text-base font-extrabold text-purple-300 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-300" />
                <span>II. HƯỚNG DẪN THÊM · TẢI LÊN · CHỈNH SỬA · XÓA</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <b>Nút Tải Lên (Upload):</b> Nhấp để tải tệp từ máy tính (<code>.txt, .doc, .html, .json</code>) lên bất kỳ phân hệ nào để hệ thống tự động nạp và chuẩn hóa định dạng.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <b>Nút Chỉnh Sửa (Edit):</b> Bật chế độ chỉnh sửa trực tiếp từng dòng mục tiêu, hoạt động bảng 2 cột, câu hỏi trắc nghiệm, slide hoặc kịch bản video ngay trên màn hình.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <b>Nút Thêm & Xóa (Add / Delete):</b> Thêm mới hoạt động dạy học, bước thực hiện, câu hỏi đề thi, trang slide hoặc xóa nhanh các mục không cần thiết.
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/90 border-2 border-amber-400 border-b-6 border-b-amber-700 shadow-[0_10px_25px_rgba(245,158,11,0.28)] space-y-3">
              <h3 className="text-base font-extrabold text-amber-300 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-cyan-300" />
                <span>III. CHẾ ĐỘ HIỂN THỊ ĐA THIẾT BỊ & ĐỒNG BỘ MÁY KHÁC</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <b>Tự động co giãn đa màn hình:</b> Chọn nhanh chế độ hiển thị trên thanh công cụ: <b>Tự động · PC / Máy bàn · Laptop · Máy tính bảng · Điện thoại · Máy chiếu lớp học</b>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CloudUpload className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <b>Đồng bộ sang máy khác:</b> Mở mục <b>Sao Lưu & Đồng Bộ Máy Khác</b> để lấy Mã Đồng Bộ (<code>HTK-PRO-...</code>) hoặc Chuỗi Khóa Di Động, giúp chuyển 100% dữ liệu sang máy mới.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 3: Multi-Format Exact-Size & Exact-Color Download Center */}
          <div className="p-5 rounded-2xl bg-slate-950/95 border-2 border-emerald-400 border-b-6 border-b-emerald-800 shadow-[0_12px_28px_rgba(16,185,129,0.3)] space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-emerald-300 flex items-center gap-2">
                <Download className="w-5 h-5 text-yellow-300" />
                <span>
                  IV. TRUNG TÂM TẢI VỀ ĐA ĐỊNH DẠNG (GIỮ NGUYÊN CỠ CHỮ 12PT TIMES NEW ROMAN & MÀU SẮC)
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Nhấp vào định dạng bất kỳ bên dưới để tải ngay học liệu với phông chữ Times New Roman 12pt và hệ màu năng lực (Xanh dương · Đỏ · Vàng) được bảo toàn 100%:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  exportLesson5512ToWord(lessonPlan);
                  onLog('Đã tải Kế hoạch bài dạy (.doc - Times New Roman 12pt giữ nguyên màu)', 'info');
                }}
                className="btn-3d btn-3d-cyan p-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 text-left">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Tải Giáo Án Chuẩn (.DOC 12pt Giữ Màu)</span>
                </div>
                <Download className="w-4 h-4 shrink-0" />
              </button>

              <button
                onClick={() => {
                  exportLesson5512ToHtml(lessonPlan);
                  onLog('Đã tải Giáo án Bản in (.html - Times New Roman 12pt chuẩn màu)', 'info');
                }}
                className="btn-3d btn-3d-indigo p-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 text-left">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Tải Giáo Án Bản In (.HTML Chuẩn Màu)</span>
                </div>
                <Download className="w-4 h-4 shrink-0" />
              </button>

              <button
                onClick={() => {
                  exportExamAndKeyToWord(examPackage, true);
                  onLog('Đã tải Đề thi & Đáp án gạch chân (.doc - Times New Roman 12pt)', 'info');
                }}
                className="btn-3d btn-3d-amber p-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 text-left">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Tải Đề Thi & Đáp Án (.DOC 12pt)</span>
                </div>
                <Download className="w-4 h-4 shrink-0" />
              </button>

              <button
                onClick={() => {
                  exportExamAndKeyToHtml(examPackage, true);
                  onLog('Đã tải Đề thi & Ma trận (.html - Times New Roman 12pt chuẩn màu)', 'info');
                }}
                className="btn-3d btn-3d-rose p-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 text-left">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Tải Đề Thi Bản In (.HTML Chuẩn Màu)</span>
                </div>
                <Download className="w-4 h-4 shrink-0" />
              </button>

              <button
                onClick={() => {
                  exportSlidesToPptx(slides, lessonPlan.lessonTitle);
                  onLog('Đã tải Slide trình chiếu (.pptx 16:9 giữ nguyên màu sắc)', 'info');
                }}
                className="btn-3d btn-3d-purple p-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 text-left">
                  <Presentation className="w-4 h-4 shrink-0" />
                  <span>Tải Slide Bài Giảng (.PPTX Chuẩn Màu)</span>
                </div>
                <Download className="w-4 h-4 shrink-0" />
              </button>

              <button
                onClick={() => {
                  exportWorksheetToWord(worksheetGame);
                  downloadJsonFile(fullBackupData, 'Ho_So_AutoTyper_Studio_Pro_v3.json');
                  onLog('Đã tải Phiếu học tập (.doc 12pt) & Hồ sơ toàn phần (.json)', 'info');
                }}
                className="btn-3d btn-3d-emerald p-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 text-left">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Tải Phiếu Học Tập (.DOC) & Gói (.JSON)</span>
                </div>
                <Download className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

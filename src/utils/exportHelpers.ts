/**
 * Multi-Format Export Engine (Word .doc, Print HTML, PPTX, TXT, JSON)
 * - Enforces Times New Roman 12pt across all Lesson Plans, Exams, and Worksheets
 * - Applies full-sentence Competency Color Coding (Blue = Năng lực số, Red = Năng lực AI, Amber/Gold = Tích hợp liên môn)
 * - Zero redundant bracket tags, zero minute counts, clean 2-column header (HOẠT ĐỘNG CỦA GIÁO VIÊN VÀ HỌC SINH | DỰ KIẾN SẢN PHẨM)
 */

import {
  LessonPlan5512,
  DifferentiatedExamPackage,
  SlideItem,
  WorksheetAndGamePackage,
  CompetencyType,
} from '../types/pedagogyTypes';
import { cleanPedagogyText } from '../data/pedagogyPresets';

const loadedScripts = new Map<string, Promise<void>>();

export function loadScriptOnce(url: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const existing = loadedScripts.get(url);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadedScripts.delete(url);
      reject(new Error(`Không thể tải thư viện từ CDN: ${url}`));
    };
    document.head.appendChild(script);
  });

  loadedScripts.set(url, promise);
  return promise;
}

/**
 * Detects whether a line belongs to Năng lực số (NLS - Blue), Năng lực AI (NLAI - Red),
 * or Tích hợp liên môn (THLM - Amber/Gold) so the ENTIRE sentence is colored without bracket boxes.
 */
export function detectCompetencyTypeFromText(
  rawText: string,
  forcedType?: CompetencyType
): CompetencyType | null {
  if (forcedType) return forcedType;
  const lower = rawText.toLowerCase();
  if (
    rawText.includes('[NLS') ||
    lower.includes('năng lực số') ||
    lower.includes('học liệu số') ||
    lower.includes('dữ liệu số') ||
    lower.includes('phần mềm mô phỏng') ||
    lower.includes('sơ đồ số')
  ) {
    return 'NLS';
  }
  if (
    rawText.includes('[NLAI') ||
    lower.includes('năng lực trí tuệ nhân tạo') ||
    lower.includes('năng lực ai') ||
    lower.includes('công cụ ai') ||
    lower.includes('truy vấn công cụ ai') ||
    lower.includes('nhận định của ai')
  ) {
    return 'NLAI';
  }
  if (
    rawText.includes('[THLM') ||
    lower.includes('tích hợp liên môn') ||
    lower.includes('liên môn')
  ) {
    return 'THLM';
  }
  return null;
}

function escapeHtml(raw: string): string {
  return cleanPedagogyText(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Formats a line for Word/HTML export: colors the entire text in Blue (NLS), Red (NLAI), or Gold (THLM)
 * with Times New Roman 12pt and zero bracket tags.
 */
export function formatLineWithCompetencyColorHtml(
  rawText: string,
  forcedType?: CompetencyType
): string {
  const detected = detectCompetencyTypeFromText(rawText, forcedType);
  const cleaned = escapeHtml(rawText);

  if (detected === 'NLS') {
    return `<span style="color:#0052cc;font-weight:bold;">${cleaned}</span>`;
  }
  if (detected === 'NLAI') {
    return `<span style="color:#c81e1e;font-weight:bold;">${cleaned}</span>`;
  }
  if (detected === 'THLM') {
    return `<span style="color:#b45309;font-weight:bold;">${cleaned}</span>`;
  }
  return cleaned;
}

function buildStandardDocumentHtml(htmlBody: string, title: string): string {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40" lang="vi">
<head>
<meta charset="utf-8">
<title>${title}</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page {
    size: 21cm 29.7cm;
    margin: 2cm 2cm 2cm 2.5cm;
  }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.45;
    text-align: justify;
    color: #000000;
  }
  h1, h2, h3, h4 {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    font-weight: bold;
    margin-top: 8pt;
    margin-bottom: 4pt;
  }
  h2 {
    font-size: 13pt;
  }
  p, div, span, li {
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    margin-top: 2pt;
    margin-bottom: 3pt;
    text-align: justify;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6pt;
    margin-bottom: 8pt;
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
  }
  th, td {
    border: 1pt solid #000000;
    padding: 6pt 8pt;
    vertical-align: top;
    text-align: justify;
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
  }
  th {
    background-color: #e0f2fe;
    font-weight: bold;
    text-align: center;
  }
</style>
</head>
<body>
${htmlBody}
</body>
</html>`;
}

export function downloadWordDocument(htmlBody: string, filename: string) {
  const fullHtml = buildStandardDocumentHtml(htmlBody, filename);
  const blob = new Blob(['\ufeff', fullHtml], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    filename.endsWith('.doc') || filename.endsWith('.docx')
      ? filename
      : `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadHtmlDocumentWithExactColors(htmlBody: string, filename: string) {
  const fullHtml = buildStandardDocumentHtml(htmlBody, filename);
  const blob = new Blob([fullHtml], {
    type: 'text/html;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPlainTextFile(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadJsonFile(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function buildLesson5512HtmlBody(plan: LessonPlan5512): string {
  const activitiesHtml = plan.activities
    .map((act) => {
      const cleanActTitle = cleanPedagogyText(act.title);
      const objLines = act.objectives
        .map((o) => `<p>- ${formatLineWithCompetencyColorHtml(o)}</p>`)
        .join('');
      const prodLines = act.products
        .map((p) => `<p>- ${formatLineWithCompetencyColorHtml(p)}</p>`)
        .join('');

      const tableRows = act.twoColumnRows
        .map((row) => {
          const col1 = row.teacherStudentAction
            .map((line) => {
              const cleaned = cleanPedagogyText(line);
              const normalized = cleaned.startsWith('-') ? cleaned : `- ${cleaned}`;
              return `<p>${formatLineWithCompetencyColorHtml(normalized)}</p>`;
            })
            .join('');
          const col2 = row.expectedProduct
            .map((line) => {
              const cleaned = cleanPedagogyText(line);
              const normalized =
                cleaned.startsWith('-') || cleaned.startsWith('I')
                  ? cleaned
                  : `- ${cleaned}`;
              return `<p>${formatLineWithCompetencyColorHtml(normalized)}</p>`;
            })
            .join('');
          return `
            <tr>
              <td width="52%">
                <p><b>${escapeHtml(row.stepTitle)}</b></p>
                ${col1}
              </td>
              <td width="48%">
                ${col2}
              </td>
            </tr>
          `;
        })
        .join('');

      return `
        <h3>${escapeHtml(cleanActTitle)}</h3>
        <p><b>a) Mục tiêu:</b></p>
        ${objLines}
        <p><b>b) Nội dung:</b></p>
        <p>- ${formatLineWithCompetencyColorHtml(act.content)}</p>
        <p><b>c) Sản phẩm:</b></p>
        ${prodLines}
        <p><b>d) Tổ chức thực hiện:</b></p>
        <table>
          <thead>
            <tr>
              <th width="52%">HOẠT ĐỘNG CỦA GIÁO VIÊN VÀ HỌC SINH</th>
              <th width="48%">DỰ KIẾN SẢN PHẨM</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;
    })
    .join('');

  return `
    <h2 style="text-align:center;text-transform:uppercase;">KẾ HOẠCH BÀI DẠY</h2>
    <h3 style="text-align:center;text-transform:uppercase;">${escapeHtml(plan.lessonTitle)}</h3>
    <p style="text-align:center;"><b>Môn học:</b> ${escapeHtml(plan.subject)} — <b>Lớp:</b> ${escapeHtml(plan.grade)}</p>

    <h3>I. MỤC TIÊU</h3>
    <p><b>1. Về kiến thức:</b></p>
    ${plan.knowledgeObjectives.map((k) => `<p>- ${formatLineWithCompetencyColorHtml(k)}</p>`).join('')}
    <p><b>2. Về năng lực:</b></p>
    ${plan.generalCompetencies.map((g) => `<p>- ${formatLineWithCompetencyColorHtml(g)}</p>`).join('')}
    ${plan.specificCompetencies.map((s) => `<p>- ${formatLineWithCompetencyColorHtml(s)}</p>`).join('')}
    <p>- ${formatLineWithCompetencyColorHtml(plan.digitalCompetencyNLS, 'NLS')}</p>
    <p>- ${formatLineWithCompetencyColorHtml(plan.aiCompetencyNLAI, 'NLAI')}</p>
    <p>- ${formatLineWithCompetencyColorHtml(plan.interdisciplinaryTHLM, 'THLM')}</p>
    <p><b>3. Về phẩm chất:</b></p>
    ${plan.qualities.map((q) => `<p>- ${formatLineWithCompetencyColorHtml(q)}</p>`).join('')}

    <h3>II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU</h3>
    <p><b>1. Đối với giáo viên:</b></p>
    ${plan.teacherEquipment.map((t) => `<p>- ${formatLineWithCompetencyColorHtml(t)}</p>`).join('')}
    <p><b>2. Đối với học sinh:</b></p>
    ${plan.studentEquipment.map((s) => `<p>- ${formatLineWithCompetencyColorHtml(s)}</p>`).join('')}

    <h3>III. TIẾN TRÌNH DẠY HỌC</h3>
    ${activitiesHtml}
  `;
}

export function exportLesson5512ToWord(plan: LessonPlan5512) {
  const html = buildLesson5512HtmlBody(plan);
  downloadWordDocument(html, `Ke_Hoach_Bai_Day_${plan.subject}_${plan.grade}.doc`);
}

export function exportLesson5512ToHtml(plan: LessonPlan5512) {
  const html = buildLesson5512HtmlBody(plan);
  downloadHtmlDocumentWithExactColors(html, `Ke_Hoach_Bai_Day_${plan.subject}_${plan.grade}.html`);
}

export function buildExamHtmlBody(
  exam: DifferentiatedExamPackage,
  underlineCorrectKey: boolean = true
): string {
  const part1Html = exam.part1
    .map((q) => {
      const optsHtml = q.options
        .map((opt) => {
          const letterRender =
            underlineCorrectKey && opt.isCorrect
              ? `<u><b>${opt.letter}</b></u>`
              : `<b>${opt.letter}</b>`;
          return `<p>${letterRender}. ${formatLineWithCompetencyColorHtml(opt.text)}</p>`;
        })
        .join('');
      return `
        <p><b>Câu ${q.number}:</b> ${formatLineWithCompetencyColorHtml(q.stem)}</p>
        ${optsHtml}
      `;
    })
    .join('');

  const part2Html = exam.part2
    .map((q) => {
      const stmtsHtml = q.statements
        .map((st) => {
          const letterRender =
            underlineCorrectKey && st.isTrue
              ? `<u><b>${st.letter}</b></u>`
              : `<b>${st.letter}</b>`;
          return `<p>${letterRender}) ${formatLineWithCompetencyColorHtml(st.text)}</p>`;
        })
        .join('');
      return `
        <p><b>Câu ${q.number}:</b> ${formatLineWithCompetencyColorHtml(q.contextStem)}</p>
        ${stmtsHtml}
      `;
    })
    .join('');

  const part3Html = exam.part3
    .map((q) => {
      return `
        <p><b>Câu ${q.number}:</b> ${formatLineWithCompetencyColorHtml(q.stem)}</p>
        ${
          underlineCorrectKey
            ? `<p><u><b>${escapeHtml(q.correctAnswer)}</b></u></p>`
            : `<p>Đáp số: ............................</p>`
        }
      `;
    })
    .join('');

  const matrixRowsHtml = exam.matrix
    .map(
      (row) => `
      <tr>
        <td style="text-align:center;">${row.topicNumber}</td>
        <td>${escapeHtml(row.topicName)}</td>
        <td>${escapeHtml(row.contentUnit)}</td>
        <td>${escapeHtml(row.learningOutcomeSpec).replace(/\n/g, '<br/>')}</td>
        <td style="text-align:center;">${row.part1Counts.biet}/${row.part1Counts.hieu}/${row.part1Counts.vanDung}/${row.part1Counts.vanDungCao}</td>
        <td style="text-align:center;">${row.part2Counts.biet}/${row.part2Counts.hieu}/${row.part2Counts.vanDung}/${row.part2Counts.vanDungCao}</td>
        <td style="text-align:center;">${row.part3Counts.biet}/${row.part3Counts.hieu}/${row.part3Counts.vanDung}/${row.part3Counts.vanDungCao}</td>
        <td style="text-align:center;"><b>${row.percentScore}%</b></td>
      </tr>
    `
    )
    .join('');

  return `
    <h2 style="text-align:center;">${escapeHtml(exam.examTitle)}</h2>
    <p style="text-align:center;"><b>Môn:</b> ${escapeHtml(exam.subject)} — <b>${escapeHtml(exam.grade)}</b> | <b>Mã đề:</b> ${escapeHtml(exam.examCode)}</p>
    <hr/>

    <h3>PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn</h3>
    ${part1Html}

    <h3>PHẦN II. Câu trắc nghiệm đúng sai</h3>
    ${part2Html}

    <h3>PHẦN III. Câu trắc nghiệm trả lời ngắn</h3>
    ${part3Html}

    <hr/>
    <h3>BẢNG MA TRẬN VÀ ĐẶC TẢ ĐỀ KIỂM TRA</h3>
    <table>
      <thead>
        <tr>
          <th>TT</th>
          <th>Chủ đề / Bài học</th>
          <th>Đơn vị kiến thức</th>
          <th>Yêu cầu cần đạt</th>
          <th>Phần I</th>
          <th>Phần II</th>
          <th>Phần III</th>
          <th>Tỷ lệ %</th>
        </tr>
      </thead>
      <tbody>
        ${matrixRowsHtml}
      </tbody>
    </table>
  `;
}

export function exportExamAndKeyToWord(
  exam: DifferentiatedExamPackage,
  underlineCorrectKey: boolean = true
) {
  const html = buildExamHtmlBody(exam, underlineCorrectKey);
  const suffix = underlineCorrectKey ? 'Kem_Dap_An_Gach_Chan' : 'De_Chinh_Thuc';
  downloadWordDocument(html, `De_Kiem_Tra_${suffix}.doc`);
}

export function exportExamAndKeyToHtml(
  exam: DifferentiatedExamPackage,
  underlineCorrectKey: boolean = true
) {
  const html = buildExamHtmlBody(exam, underlineCorrectKey);
  downloadHtmlDocumentWithExactColors(html, `De_Kiem_Tra_Chuan_12pt.html`);
}

export function exportWorksheetToWord(pkg: WorksheetAndGamePackage) {
  const tasksHtml = pkg.tasks
    .map(
      (t) => `
      <h3>${escapeHtml(t.taskTitle)}</h3>
      <p><i>${formatLineWithCompetencyColorHtml(t.instructions, t.competencyTag)}</i></p>
      ${t.promptsWithBlanks.map((line) => `<p>${formatLineWithCompetencyColorHtml(line)}</p>`).join('')}
    `
    )
    .join('');

  const html = `
    <h2 style="text-align:center;">${escapeHtml(pkg.worksheetTitle)}</h2>
    <p style="text-align:center;"><b>${escapeHtml(pkg.studentGroupGuide)}</b></p>
    <hr/>
    ${tasksHtml}
  `;

  downloadWordDocument(html, `Phieu_Hoc_Tap_12pt.doc`);
}

export async function exportSlidesToPptx(
  slides: SlideItem[],
  lessonTitle: string
): Promise<void> {
  const PPTX_CDN = 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js';
  const win = window as unknown as { PptxGenJS?: new () => unknown };

  if (!win.PptxGenJS) {
    await loadScriptOnce(PPTX_CDN);
  }

  if (!win.PptxGenJS) {
    throw new Error('PptxGenJS library failed to initialize');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pptx: any = new win.PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'Hồ Tấn Khải - Auto Typer Studio Pro v3.0';
  pptx.title = cleanPedagogyText(lessonTitle);

  slides.forEach((item) => {
    const slide = pptx.addSlide();
    slide.background = { color: '0F172A' };

    const badgeColor =
      item.competencyHighlight === 'NLS'
        ? '2563EB'
        : item.competencyHighlight === 'NLAI'
        ? 'DC2626'
        : 'D97706';

    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.14,
      fill: { color: badgeColor },
    });

    slide.addText(cleanPedagogyText(item.title), {
      x: 0.6,
      y: 0.55,
      w: 8.8,
      h: 0.7,
      fontSize: 22,
      bold: true,
      color: 'FFFFFF',
      fontFace: 'Times New Roman',
    });

    slide.addText(cleanPedagogyText(item.subtitle), {
      x: 0.6,
      y: 1.25,
      w: 8.8,
      h: 0.4,
      fontSize: 14,
      italic: true,
      color: '94A3B8',
      fontFace: 'Times New Roman',
    });

    const bulletTextObjs = item.bullets.map((b) => {
      const cType = detectCompetencyTypeFromText(b);
      const colorHex =
        cType === 'NLS'
          ? '60A5FA'
          : cType === 'NLAI'
          ? 'F87171'
          : cType === 'THLM'
          ? 'FBBF24'
          : 'F8FAFC';
      return {
        text: cleanPedagogyText(b),
        options: { bullet: true, color: colorHex, fontSize: 14, breakLine: true },
      };
    });

    slide.addText(bulletTextObjs, {
      x: 0.6,
      y: 1.85,
      w: 8.8,
      h: item.interactiveQuestion ? 2.2 : 3.0,
      fontFace: 'Times New Roman',
      valign: 'top',
      lineSpacing: 22,
    });

    if (item.interactiveQuestion) {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6,
        y: 4.25,
        w: 8.8,
        h: 0.85,
        fill: { color: '1E293B' },
        line: { color: '38BDF8', width: 1.5 },
      });
      slide.addText(`Câu hỏi thảo luận: ${cleanPedagogyText(item.interactiveQuestion)}`, {
        x: 0.8,
        y: 4.35,
        w: 8.4,
        h: 0.65,
        fontSize: 13,
        bold: true,
        color: '38BDF8',
        fontFace: 'Times New Roman',
      });
    }

    if (item.speakerNotes) {
      slide.addNotes(cleanPedagogyText(item.speakerNotes));
    }
  });

  const safeName =
    cleanPedagogyText(lessonTitle).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35) ||
    'Bai_Giang';
  await pptx.writeFile({ fileName: `Slide_${safeName}.pptx` });
}

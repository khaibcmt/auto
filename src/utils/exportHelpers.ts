/**
 * Lazy-Loading Export Engine (export_helpers.ts)
 * Dynamically loads heavy libraries (PptxGenJS, etc.) only on user click (< 0.8s initial page load)
 * and builds formatted Word (.docx) & PowerPoint (.pptx) documents with Competency Color Coding.
 */

import {
  LessonPlan5512,
  DifferentiatedExamPackage,
  SlideItem,
  WorksheetAndGamePackage,
} from '../types/pedagogyTypes';

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
 * Highlights [NLS] in Blue, [NLAI] in Red, and [THLM] in Amber/Gold inside Word HTML content.
 */
function formatCompetencyColorsForWord(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    .replace(
      /\[NLS[^\]]*\]/g,
      (m) =>
        `<span style="color:#1d4ed8;background-color:#dbeafe;font-weight:bold;">${m}</span>`
    )
    .replace(
      /\[NLAI[^\]]*\]/g,
      (m) =>
        `<span style="color:#b91c1c;background-color:#fee2e2;font-weight:bold;">${m}</span>`
    )
    .replace(
      /\[THLM[^\]]*\]/g,
      (m) =>
        `<span style="color:#b45309;background-color:#fef3c7;font-weight:bold;">${m}</span>`
    );
}

function downloadWordDocument(htmlBody: string, filename: string) {
  const fullHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${filename}</title>
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
    font-size: 13pt;
    line-height: 1.35;
    text-align: justify;
    color: #111827;
  }
  h1, h2, h3, h4 {
    font-family: "Times New Roman", Times, serif;
    margin-top: 10pt;
    margin-bottom: 6pt;
  }
  p {
    margin-top: 3pt;
    margin-bottom: 4pt;
    text-align: justify;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8pt;
    margin-bottom: 10pt;
  }
  th, td {
    border: 1pt solid #111827;
    padding: 6pt 8pt;
    vertical-align: top;
    text-align: justify;
    font-size: 12.5pt;
  }
  th {
    background-color: #f3f4f6;
    font-weight: bold;
    text-align: center;
  }
</style>
</head>
<body>
${htmlBody}
</body>
</html>`;

  const blob = new Blob(['\ufeff', fullHtml], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.doc') || filename.endsWith('.docx') ? filename : `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Module 3 & 4: Export Lesson Plan 5512 to Word (.doc/.docx) with 2-Column Activity 2 Table & 3-Color Competency Map
 */
export function exportLesson5512ToWord(plan: LessonPlan5512) {
  const activitiesHtml = plan.activities
    .map((act) => {
      const objLines = act.objectives
        .map((o) => `<p>- ${formatCompetencyColorsForWord(o)}</p>`)
        .join('');
      const prodLines = act.products
        .map((p) => `<p>- ${formatCompetencyColorsForWord(p)}</p>`)
        .join('');

      const tableRows = act.twoColumnRows
        .map((row) => {
          const col1 = row.teacherStudentAction
            .map((line) => {
              const normalized = line.trim().startsWith('-') ? line.trim() : `- ${line.trim()}`;
              return `<p>${formatCompetencyColorsForWord(normalized)}</p>`;
            })
            .join('');
          const col2 = row.expectedProduct
            .map((line) => {
              const normalized = line.trim().startsWith('-') || line.trim().startsWith('I') ? line.trim() : `- ${line.trim()}`;
              return `<p>${formatCompetencyColorsForWord(normalized)}</p>`;
            })
            .join('');
          return `
            <tr>
              <td width="52%">
                <p><b>${formatCompetencyColorsForWord(row.stepTitle)}</b></p>
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
        <h3>${formatCompetencyColorsForWord(act.title)} (${act.durationMinutes} phút)</h3>
        <p><b>a) Mục tiêu:</b></p>
        ${objLines}
        <p><b>b) Nội dung:</b></p>
        <p>- ${formatCompetencyColorsForWord(act.content)}</p>
        <p><b>c) Sản phẩm:</b></p>
        ${prodLines}
        <p><b>d) Tổ chức thực hiện:</b></p>
        <table>
          <thead>
            <tr>
              <th width="52%">HOẠT ĐỘNG CỦA GIÁO VIÊN VÀ HỌC SINH</th>
              <th width="48%">DỰ KIẾN SẢN PHẨM / NỘI DUNG CỐT LÕI</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;
    })
    .join('');

  const html = `
    <h2 style="text-align:center;text-transform:uppercase;">KẾ HOẠCH BÀI DẠY CHUẨN CÔNG VĂN 5512</h2>
    <h3 style="text-align:center;">${formatCompetencyColorsForWord(plan.lessonTitle)}</h3>
    <p style="text-align:center;"><b>Môn học:</b> ${plan.subject} — <b>Lớp:</b> ${plan.grade} — <b>Thời lượng:</b> ${plan.duration}</p>
    <hr/>
    <p><b>Quy ước Mã màu Năng lực tích hợp:</b>
      <span style="color:#1d4ed8;background-color:#dbeafe;font-weight:bold;padding:2pt 4pt;">[NLS: Năng lực số - Xanh dương]</span> |
      <span style="color:#b91c1c;background-color:#fee2e2;font-weight:bold;padding:2pt 4pt;">[NLAI: Năng lực AI - Đỏ]</span> |
      <span style="color:#b45309;background-color:#fef3c7;font-weight:bold;padding:2pt 4pt;">[THLM: Tích hợp liên môn - Vàng]</span>
    </p>

    <h3>I. MỤC TIÊU BÀI HỌC</h3>
    <p><b>1. Về kiến thức:</b></p>
    ${plan.knowledgeObjectives.map((k) => `<p>- ${formatCompetencyColorsForWord(k)}</p>`).join('')}
    <p><b>2. Về năng lực:</b></p>
    <p><i>* Năng lực chung:</i></p>
    ${plan.generalCompetencies.map((g) => `<p>- ${formatCompetencyColorsForWord(g)}</p>`).join('')}
    <p><i>* Năng lực đặc thù môn ${plan.subject}:</i></p>
    ${plan.specificCompetencies.map((s) => `<p>- ${formatCompetencyColorsForWord(s)}</p>`).join('')}
    <p><i>* Hệ thống Năng lực Số, AI & Tích hợp liên môn:</i></p>
    <p>- ${formatCompetencyColorsForWord(plan.digitalCompetencyNLS)}</p>
    <p>- ${formatCompetencyColorsForWord(plan.aiCompetencyNLAI)}</p>
    <p>- ${formatCompetencyColorsForWord(plan.interdisciplinaryTHLM)}</p>
    <p><b>3. Về phẩm chất:</b></p>
    ${plan.qualities.map((q) => `<p>- ${formatCompetencyColorsForWord(q)}</p>`).join('')}

    <h3>II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU</h3>
    <p><b>1. Đối với giáo viên:</b></p>
    ${plan.teacherEquipment.map((t) => `<p>- ${formatCompetencyColorsForWord(t)}</p>`).join('')}
    <p><b>2. Đối với học sinh:</b></p>
    ${plan.studentEquipment.map((s) => `<p>- ${formatCompetencyColorsForWord(s)}</p>`).join('')}

    <h3>III. TIẾN TRÌNH DẠY HỌC (4 HOẠT ĐỘNG CHUẨN 5512)</h3>
    ${activitiesHtml}
  `;

  downloadWordDocument(html, `Giao_An_5512_${plan.subject}_${plan.grade}.doc`);
}

/**
 * Module 5 & 7: Export 3-Part Exam + Matrix + Underlined Standard Key to Word
 * STRICT RULE: Only underline the correct letter (A, B, C, D / a, b, c, d), zero redundant labels!
 */
export function exportExamAndKeyToWord(exam: DifferentiatedExamPackage, underlineCorrectKey: boolean = true) {
  const part1Html = exam.part1
    .map((q) => {
      const optsHtml = q.options
        .map((opt) => {
          const letterRender =
            underlineCorrectKey && opt.isCorrect
              ? `<u><b>${opt.letter}</b></u>`
              : `<b>${opt.letter}</b>`;
          return `<p>${letterRender}. ${formatCompetencyColorsForWord(opt.text)}</p>`;
        })
        .join('');
      return `
        <p><b>Câu ${q.number} (${q.bloomLevel}):</b> ${formatCompetencyColorsForWord(q.stem)}</p>
        ${optsHtml}
      `;
    })
    .join('');

  const part2Html = exam.part2
    .map((q) => {
      const stmtsHtml = q.statements
        .map((st) => {
          // Rule: Underline letter (a, b, c, d) if statement is True when exporting underlined key
          const letterRender =
            underlineCorrectKey && st.isTrue
              ? `<u><b>${st.letter}</b></u>`
              : `<b>${st.letter}</b>`;
          return `<p>${letterRender}) ${formatCompetencyColorsForWord(st.text)}</p>`;
        })
        .join('');
      return `
        <p><b>Câu ${q.number}:</b> ${formatCompetencyColorsForWord(q.contextStem)}</p>
        ${stmtsHtml}
      `;
    })
    .join('');

  const part3Html = exam.part3
    .map((q) => {
      return `
        <p><b>Câu ${q.number} (${q.bloomLevel}):</b> ${formatCompetencyColorsForWord(q.stem)}</p>
        ${
          underlineCorrectKey
            ? `<p><u><b>${q.correctAnswer}</b></u> (${q.unitOrNote})</p>`
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
        <td>${row.topicName}</td>
        <td>${row.contentUnit}</td>
        <td>${row.learningOutcomeSpec.replace(/\n/g, '<br/>')}</td>
        <td style="text-align:center;">${row.part1Counts.biet}/${row.part1Counts.hieu}/${row.part1Counts.vanDung}/${row.part1Counts.vanDungCao}</td>
        <td style="text-align:center;">${row.part2Counts.biet}/${row.part2Counts.hieu}/${row.part2Counts.vanDung}/${row.part2Counts.vanDungCao}</td>
        <td style="text-align:center;">${row.part3Counts.biet}/${row.part3Counts.hieu}/${row.part3Counts.vanDung}/${row.part3Counts.vanDungCao}</td>
        <td style="text-align:center;"><b>${row.percentScore}%</b></td>
      </tr>
    `
    )
    .join('');

  const html = `
    <h2 style="text-align:center;">${exam.examTitle}</h2>
    <p style="text-align:center;"><b>Môn:</b> ${exam.subject} — <b>${exam.grade}</b> | <b>Thời gian:</b> ${exam.durationMinutes} phút | <b>Mã đề:</b> ${exam.examCode}</p>
    <hr/>

    <h3>PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn</h3>
    <p><i>Thí sinh trả lời từ câu 1 đến câu ${exam.part1.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.</i></p>
    ${part1Html}

    <h3>PHẦN II. Câu trắc nghiệm đúng sai</h3>
    <p><i>Thí sinh trả lời từ câu 1 đến câu ${exam.part2.length}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai (Chữ cái gạch chân là mệnh đề Đúng).</i></p>
    ${part2Html}

    <h3>PHẦN III. Câu trắc nghiệm trả lời ngắn</h3>
    <p><i>Thí sinh trả lời từ câu 1 đến câu ${exam.part3.length}.</i></p>
    ${part3Html}

    <hr/>
    <h3>BẢNG MA TRẬN & ĐẶC TẢ ĐỀ KIỂM TRA ĐÁNH GIÁ</h3>
    <table>
      <thead>
        <tr>
          <th>TT</th>
          <th>Chủ đề / Bài học</th>
          <th>Đơn vị kiến thức</th>
          <th>Mức độ đánh giá</th>
          <th>Phần I (B/H/VD/VDC)</th>
          <th>Phần II (B/H/VD/VDC)</th>
          <th>Phần III (B/H/VD/VDC)</th>
          <th>Tỷ lệ %</th>
        </tr>
      </thead>
      <tbody>
        ${matrixRowsHtml}
      </tbody>
    </table>
  `;

  const suffix = underlineCorrectKey ? 'Kem_Dap_An_Gach_Chan' : 'De_Thi';
  downloadWordDocument(html, `De_Khao_Thi_3_Phan_${suffix}.doc`);
}

/**
 * Module 10: Export Scaffolding Worksheet to Word
 */
export function exportWorksheetToWord(pkg: WorksheetAndGamePackage) {
  const tasksHtml = pkg.tasks
    .map(
      (t) => `
      <h3>${t.taskTitle} [${t.competencyTag}]</h3>
      <p><i>Hướng dẫn: ${formatCompetencyColorsForWord(t.instructions)}</i></p>
      ${t.promptsWithBlanks.map((line) => `<p>${formatCompetencyColorsForWord(line)}</p>`).join('')}
    `
    )
    .join('');

  const html = `
    <h2 style="text-align:center;">${pkg.worksheetTitle}</h2>
    <p style="text-align:center;"><b>${pkg.studentGroupGuide}</b></p>
    <hr/>
    ${tasksHtml}
  `;

  downloadWordDocument(html, `Phieu_Hoc_Tap_Scaffolding.doc`);
}

/**
 * Module 8: Lazy-Load PptxGenJS on demand and export .pptx with Speaker Notes
 */
export async function exportSlidesToPptx(slides: SlideItem[], lessonTitle: string): Promise<void> {
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
  pptx.author = 'AutoTyper Studio Pro v3.0';
  pptx.title = lessonTitle;

  slides.forEach((item) => {
    const slide = pptx.addSlide();
    slide.background = { color: '0F172A' };

    // Accent bar color based on Competency
    const badgeColor =
      item.competencyHighlight === 'NLS'
        ? '2563EB'
        : item.competencyHighlight === 'NLAI'
        ? 'DC2626'
        : 'D97706';

    // Top bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.14,
      fill: { color: badgeColor },
    });

    // Slide number & Competency label
    slide.addText(
      `SLIDE ${item.slideNumber}  |  ${item.competencyHighlight || '5512 STANDARD'}`,
      {
        x: 0.6,
        y: 0.35,
        w: 8.8,
        h: 0.35,
        fontSize: 11,
        bold: true,
        color: '38BDF8',
        fontFace: 'Arial',
      }
    );

    // Title
    slide.addText(item.title, {
      x: 0.6,
      y: 0.75,
      w: 8.8,
      h: 0.7,
      fontSize: 22,
      bold: true,
      color: 'FFFFFF',
      fontFace: 'Arial',
    });

    // Subtitle
    slide.addText(item.subtitle, {
      x: 0.6,
      y: 1.45,
      w: 8.8,
      h: 0.4,
      fontSize: 13,
      italic: true,
      color: '94A3B8',
      fontFace: 'Arial',
    });

    // Bullets
    const bulletTextObjs = item.bullets.map((b) => ({
      text: b,
      options: { bullet: true, color: 'E2E8F0', fontSize: 14, breakLine: true },
    }));

    slide.addText(bulletTextObjs, {
      x: 0.6,
      y: 2.0,
      w: 8.8,
      h: item.interactiveQuestion ? 2.1 : 2.9,
      fontFace: 'Arial',
      valign: 'top',
      lineSpacing: 22,
    });

    // Interactive Question Box if present
    if (item.interactiveQuestion) {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.6,
        y: 4.25,
        w: 8.8,
        h: 0.85,
        fill: { color: '1E293B' },
        line: { color: '38BDF8', width: 1.5 },
      });
      slide.addText(`Câu hỏi tương tác: ${item.interactiveQuestion}`, {
        x: 0.8,
        y: 4.35,
        w: 8.4,
        h: 0.65,
        fontSize: 13,
        bold: true,
        color: '38BDF8',
        fontFace: 'Arial',
      });
    }

    // Add Teacher Speaker Notes on every slide
    if (item.speakerNotes) {
      slide.addNotes(item.speakerNotes);
    }
  });

  const safeName = lessonTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35) || 'Bai_Giang';
  await pptx.writeFile({ fileName: `Slide_5512_${safeName}.pptx` });
}

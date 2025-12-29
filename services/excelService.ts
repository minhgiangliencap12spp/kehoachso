import * as XLSX from 'xlsx';
import { PPCTEntry, ScheduleRow, EquipmentRow, EquipmentConfigEntry, DAYS_OF_WEEK } from '../types';

export const importPPCTFromExcel = (file: File, subjectName: string): Promise<PPCTEntry[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON (Header: A, B, C...)
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        
        const result: PPCTEntry[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row.length >= 2) {
             let num = row[0];
             let name = row[1];

             if (row.length > 2 && (String(row[1]).match(/^\d+$/) || !isNaN(Number(row[1])))) {
                num = row[1];
                name = row[2];
             }

             if (num && name) {
               result.push({
                 lessonNumber: String(num).trim(),
                 lessonName: String(name).trim(),
                 subject: subjectName // Tag with subject
               });
             }
          }
        }
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const importEquipmentConfigFromExcel = (file: File, subjectName: string): Promise<EquipmentConfigEntry[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        
        // Use a Map to aggregate items by Lesson Number
        // Key: LessonNumber (string) -> Entry
        const entryMap = new Map<string, EquipmentConfigEntry>();
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          // Expecting: [LessonNumber, EquipmentName, Quantity] or [LessonNumber, LessonName, EquipmentName, Quantity]
          if (row.length >= 2) {
             let num = row[0];
             let eqName = row[1];
             let qty = row[2];

             // Heuristic: If col 2 looks like equipment name and col 1 is number, assume col 0 is number
             // If col 1 is Lesson Name (string) and col 2 is Equipment, shift
             if (row.length >= 3 && typeof row[1] === 'string' && row[1].length > 5 && isNaN(Number(row[1]))) {
                 // Format: [Num, LessonName, Equipment, Qty]
                 if (row[2]) {
                   eqName = row[2];
                   qty = row[3];
                 } else {
                   continue;
                 }
             }

             if (num && eqName) {
               const lessonKey = String(num).trim();
               const cleanName = String(eqName).trim();
               const cleanQty = qty ? String(qty).trim() : '1';

               if (entryMap.has(lessonKey)) {
                 // Merge existing entry
                 const existing = entryMap.get(lessonKey)!;
                 // Avoid duplicates if exactly same
                 if (!existing.equipmentName.includes(cleanName)) {
                   existing.equipmentName = `${existing.equipmentName}, ${cleanName}`;
                   // For quantity, we assume '1' is default, so we don't merge '1, 1' repeatedly unless different
                 }
               } else {
                 entryMap.set(lessonKey, {
                   lessonNumber: lessonKey,
                   equipmentName: cleanName,
                   quantity: cleanQty,
                   subject: subjectName
                 });
               }
             }
          }
        }
        
        resolve(Array.from(entryMap.values()));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const readExcelToText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Convert sheet to CSV text
        const csv = XLSX.utils.sheet_to_csv(sheet);
        resolve(csv);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

const formatDayNumber = (dayName: string) => {
  if (dayName.toLowerCase().includes('chủ nhật')) return 'CN';
  const match = dayName.match(/\d+/);
  return match ? match[0] : dayName;
};

// Helper to calculate date string dd/MM from start date string dd/MM/YYYY and offset
const calculateDate = (startDateStr: string, dayOffset: number): string => {
  try {
    const parts = startDateStr.split('/');
    if (parts.length !== 3) return "";
    const [d, m, y] = parts.map(Number);
    // Use UTC to avoid timezone issues
    const date = new Date(Date.UTC(y, m - 1, d)); 
    date.setUTCDate(date.getUTCDate() + dayOffset);
    
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  } catch (e) {
    return "";
  }
};

const getPeriodLabel = (p: number) => {
  if (p <= 4) return p.toString();
  return (p - 4).toString();
};

const generateBaseHTML = (
  weekNumber: number,
  startDateStr: string,
  endDateStr: string,
  title: string,
  headers: string[],
  rowsGenerator: (dayName: string, dateStr: string, dayNum: string) => string,
  customFooter?: string
) => {
  // Default footer with 2 columns if not provided
  return `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <style>
      @page {
        size: A4 landscape;
        margin: 2cm 1cm 2cm 2cm; /* Top Right Bottom Left */
        mso-page-orientation: landscape;
      }
      body { font-family: 'Times New Roman', serif; color: #000; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 20px; table-layout: fixed; }
      td, th { border: 1px solid #000; padding: 4px; vertical-align: middle; text-align: center; font-size: 12pt; word-wrap: break-word; }
      
      /* Specific Styles */
      .header-title { font-size: 16pt; font-weight: bold; border: none; padding: 10px; text-transform: uppercase; text-align: center; color: #ea580c; }
      .header-sub { font-size: 12pt; font-style: italic; border: none; padding-bottom: 20px; text-align: center; color: #4b5563; }
      
      .thead-cell { background-color: #fce7f3; font-weight: bold; color: #831843; font-size: 14pt; height: 35px; }
      
      .day-cell { background-color: #fff7ed; width: 60px; font-size: 12pt; }
      .day-num { font-size: 18pt; font-weight: bold; color: #c2410c; display: block; line-height: 1; }
      .day-date { font-size: 10pt; font-style: italic; color: #555; display: block; margin-top: 5px; }
      
      .session-cell { font-weight: bold; width: 40px; writing-mode: vertical-rl; transform: rotate(180deg); text-transform: uppercase; font-size: 12pt; }
      .session-morning { color: #d97706; background-color: #ffedd5; }
      .session-afternoon { color: #2563eb; background-color: #eff6ff; }

      /* Columns requested to be 14pt */
      .col-period { width: 30px; font-weight: bold; color: #666; font-size: 14pt; }
      .col-subject { width: 120px; text-align: left; padding-left: 5px; font-weight: bold; color: #9a3412; font-size: 14pt; }
      .col-class { width: 50px; font-weight: bold; color: #047857; font-size: 14pt; }
      .col-ppct { width: 50px; color: #7c3aed; font-weight: bold; font-size: 14pt; }
      .col-main { text-align: left; padding-left: 5px; font-size: 14pt; } /* Lesson or Equipment */
      .col-note { width: 100px; text-align: left; padding-left: 5px; font-style: italic; color: #555; font-size: 14pt; } /* Note or Quantity */
      
      .period-afternoon { color: #2563eb; font-style: italic; }

      /* Footer Signature Section */
      .footer-table td { border: none; padding: 10px; vertical-align: top; font-size: 12pt; }
      .sign-title { font-weight: bold; text-transform: uppercase; font-size: 12pt; }
      .sign-space { height: 80px; }
      .sign-name { font-weight: bold; font-size: 12pt; }
    </style>
  </head>
  <body>
    <!-- Main Table -->
    <table>
      <colgroup>
        <col style="width: 60px;"> <!-- Day -->
        <col style="width: 40px;"> <!-- Session -->
        <col style="width: 30px;"> <!-- Period -->
        <col style="width: 120px;"> <!-- Subject -->
        <col style="width: 50px;"> <!-- Class -->
        <col style="width: 50px;"> <!-- PPCT -->
        <col>                      <!-- Main Content -->
        <col style="width: 100px;"> <!-- Note/Qty -->
      </colgroup>
      <!-- Title Section -->
      <tr>
        <td colspan="8" class="header-title">${title} TUẦN ${weekNumber}</td>
      </tr>
      <tr>
        <td colspan="8" class="header-sub">(Từ ngày ${startDateStr} đến ngày ${endDateStr})</td>
      </tr>
      
      <!-- Table Header -->
      <tr>
        ${headers.map(h => `<th class="thead-cell">${h}</th>`).join('')}
      </tr>
      ${DAYS_OF_WEEK.map((dayName, index) => {
        const dateStr = calculateDate(startDateStr, index);
        const dayNum = formatDayNumber(dayName);
        return rowsGenerator(dayName, dateStr, dayNum);
      }).join('')}
    </table>

    <!-- Signature Footer Table -->
    ${customFooter}
  </body>
  </html>
  `;
}

// --- SCHEDULE GENERATOR ---

const generateScheduleHTML = (
  schedule: ScheduleRow[], 
  weekNumber: number, 
  startDateStr: string, 
  endDateStr: string,
  isWord: boolean = false,
  teacherName?: string
) => {
  const defaultFooter = `
    <table class="footer-table" style="margin-top: 10px; border: none; width: 100%;">
      <tr>
        <td style="width: 50%; text-align: center;">
          <div class="sign-title">NGƯỜI LẬP BIỂU</div>
          <div style="font-style: italic; font-size: 11pt;">(Ký và ghi rõ họ tên)</div>
          <div class="sign-space"></div>
          <div class="sign-name">${teacherName || '................................................'}</div>
        </td>
        <td style="width: 50%; text-align: center;">
          <div class="sign-title">DUYỆT CỦA BAN GIÁM HIỆU</div>
          <div style="font-style: italic; font-size: 11pt;">(Ký và đóng dấu)</div>
          <div class="sign-space"></div>
          <div class="sign-name">................................................</div>
        </td>
      </tr>
    </table>
  `;

  return generateBaseHTML(
    weekNumber, startDateStr, endDateStr,
    "LỊCH BÁO GIẢNG",
    ["Thứ / Ngày", "Buổi", "Tiết", "Môn", "Lớp", "PPCT", "Tên Bài Dạy", "Ghi Chú"],
    (dayName, dateStr, dayNum) => {
      let rowsHtml = '';
      for (let period = 1; period <= 7; period++) {
        const rowData = schedule.find(
          s => s.week === weekNumber && s.dayOfWeek === dayName && s.period === period
        );
        const periodLabel = getPeriodLabel(period);
        const isAfternoon = period > 4;

        rowsHtml += `<tr>`;
        if (period === 1) {
          rowsHtml += `<td rowspan="7" class="day-cell"><span class="day-num">${dayNum}</span><br/><span class="day-date">${dateStr}</span></td>`;
        }
        if (period === 1) rowsHtml += `<td rowspan="4" class="session-cell session-morning">SÁNG</td>`;
        if (period === 5) rowsHtml += `<td rowspan="3" class="session-cell session-afternoon">CHIỀU</td>`;

        rowsHtml += `
          <td class="col-period ${isAfternoon ? 'period-afternoon' : ''}">${periodLabel}</td>
          <td class="col-subject">${rowData?.subject || ''}</td>
          <td class="col-class">${rowData?.className || ''}</td>
          <td class="col-ppct">${rowData?.ppctNumber || ''}</td>
          <td class="col-main">${rowData?.lessonName || ''}</td>
          <td class="col-note">${rowData?.notes || ''}</td>
        </tr>`;
      }
      return rowsHtml;
    },
    defaultFooter
  );
};

// --- EQUIPMENT GENERATOR ---

const generateEquipmentHTML = (
  equipment: EquipmentRow[], 
  weekNumber: number, 
  startDateStr: string, 
  endDateStr: string,
  isWord: boolean = false,
  teacherName?: string
) => {
  // 3-Column Footer for Equipment
  const equipmentFooter = `
    <table class="footer-table" style="margin-top: 20px; border: none; width: 100%;">
      <tr>
        <td style="width: 33%; text-align: center;">
          <div class="sign-title">NGƯỜI LẬP BIỂU</div>
          <div style="font-style: italic; font-size: 11pt;">(Ký và ghi rõ họ tên)</div>
          <div class="sign-space"></div>
          <div class="sign-name">${teacherName || '................................................'}</div>
        </td>
        <td style="width: 33%; text-align: center;">
          <div class="sign-title">CÁN BỘ TV - TB</div>
          <div style="font-style: italic; font-size: 11pt;">(Ký và ghi rõ họ tên)</div>
          <div class="sign-space"></div>
          <div class="sign-name">................................................</div>
        </td>
        <td style="width: 34%; text-align: center;">
          <div class="sign-title">DUYỆT CỦA BAN GIÁM HIỆU</div>
          <div style="font-style: italic; font-size: 11pt;">(Ký và đóng dấu)</div>
          <div class="sign-space"></div>
          <div class="sign-name">................................................</div>
        </td>
      </tr>
    </table>
  `;

  return generateBaseHTML(
    weekNumber, startDateStr, endDateStr,
    "PHIẾU ĐĂNG KÝ SỬ DỤNG THIẾT BỊ",
    ["Thứ / Ngày", "Buổi", "Tiết", "Môn", "Lớp", "PPCT", "Tên Thiết Bị", "Số Lượng"],
    (dayName, dateStr, dayNum) => {
      let rowsHtml = '';
      for (let period = 1; period <= 7; period++) {
        const rowData = equipment.find(
          s => s.week === weekNumber && s.dayOfWeek === dayName && s.period === period
        );
        const periodLabel = getPeriodLabel(period);
        const isAfternoon = period > 4;

        // Logic for Quantity: Show existing qty OR show '1' if Equipment Name exists. Empty otherwise.
        const eqName = rowData?.equipmentName || '';
        const qty = rowData?.quantity || (eqName ? '1' : '');

        rowsHtml += `<tr>`;
        if (period === 1) {
          rowsHtml += `<td rowspan="7" class="day-cell"><span class="day-num">${dayNum}</span><br/><span class="day-date">${dateStr}</span></td>`;
        }
        if (period === 1) rowsHtml += `<td rowspan="4" class="session-cell session-morning">SÁNG</td>`;
        if (period === 5) rowsHtml += `<td rowspan="3" class="session-cell session-afternoon">CHIỀU</td>`;

        rowsHtml += `
          <td class="col-period ${isAfternoon ? 'period-afternoon' : ''}">${periodLabel}</td>
          <td class="col-subject">${rowData?.subject || ''}</td>
          <td class="col-class">${rowData?.className || ''}</td>
          <td class="col-ppct">${rowData?.ppctNumber || ''}</td>
          <td class="col-main">${eqName}</td>
          <td class="col-note" style="text-align: center;">${qty}</td>
        </tr>`;
      }
      return rowsHtml;
    },
    equipmentFooter
  );
};

const downloadFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const exportScheduleToExcel = (schedule: ScheduleRow[], week: number, start: string, end: string, teacherName?: string) => {
  const html = generateScheduleHTML(schedule, week, start, end, false, teacherName);
  downloadFile(html, `Lich_Bao_Giang_Tuan_${week}.xls`, 'application/vnd.ms-excel');
};

export const exportScheduleToWord = (schedule: ScheduleRow[], week: number, start: string, end: string, teacherName?: string) => {
  const html = generateScheduleHTML(schedule, week, start, end, true, teacherName);
  downloadFile(html, `Lich_Bao_Giang_Tuan_${week}.doc`, 'application/msword');
};

export const exportEquipmentToExcel = (equipment: EquipmentRow[], week: number, start: string, end: string, teacherName?: string) => {
  const html = generateEquipmentHTML(equipment, week, start, end, false, teacherName);
  downloadFile(html, `Phieu_Thiet_Bi_Tuan_${week}.xls`, 'application/vnd.ms-excel');
};

export const exportEquipmentToWord = (equipment: EquipmentRow[], week: number, start: string, end: string, teacherName?: string) => {
  const html = generateEquipmentHTML(equipment, week, start, end, true, teacherName);
  downloadFile(html, `Phieu_Thiet_Bi_Tuan_${week}.doc`, 'application/msword');
};
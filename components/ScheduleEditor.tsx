import React, { useState, useMemo } from 'react';
import { ScheduleRow, PPCTEntry, DAYS_OF_WEEK, TimetableEntry } from '../types';
import { exportScheduleToExcel, exportScheduleToWord } from '../services/excelService';
import { Calendar, Download, Trash2, Settings, X, Plus, FileText, CheckCircle2, User, Eye, Grid3X3 } from 'lucide-react';

interface Props {
  schedule: ScheduleRow[];
  ppct: PPCTEntry[];
  onUpdateSchedule: (newSchedule: ScheduleRow[]) => void;
  availableSubjects: string[];
  onUpdateSubjects: (subjects: string[]) => void;
  availableClasses: string[];
  onUpdateClasses: (classes: string[]) => void;
  // Synchronized props
  currentWeek: number;
  onWeekChange: (week: number) => void;
  weekStartDate: string;
  onDateChange: (date: string) => void;
  // Teacher Name
  teacherName: string;
  onTeacherNameChange: (name: string) => void;
  // Reference
  referenceTimetable?: TimetableEntry[];
  onApplyReference?: (entries: TimetableEntry[]) => void;
}

const PERIODS = [1, 2, 3, 4, 5, 6, 7];
const PERIODS_MORNING = [1, 2, 3, 4];
const PERIODS_AFTERNOON = [5, 6, 7];

const ScheduleEditor: React.FC<Props> = ({ 
  schedule, 
  ppct, 
  onUpdateSchedule,
  availableSubjects,
  onUpdateSubjects,
  availableClasses,
  onUpdateClasses,
  currentWeek,
  onWeekChange,
  weekStartDate,
  onDateChange,
  teacherName,
  onTeacherNameChange,
  referenceTimetable = [],
  onApplyReference
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newClass, setNewClass] = useState('');

  // Helper to normalize strings for comparison (remove spaces, lowercase)
  const normalizeStr = (s: string) => s.toLowerCase().replace(/\s+/g, '');

  // Lookup map for PPCT: Key = `${Subject}_${LessonNumber}`
  const ppctMap = useMemo(() => {
    const map = new Map<string, string>();
    ppct.forEach(p => {
      // Normalize keys
      const key = `${normalizeStr(p.subject || '')}_${String(p.lessonNumber).trim()}`;
      map.set(key, p.lessonName);
    });
    return map;
  }, [ppct]);

  // Filter Reference Timetable for current teacher
  const filteredReference = useMemo(() => {
     if(!teacherName || referenceTimetable.length === 0) return [];
     return referenceTimetable.filter(d => 
       (d.teacherName || '').toLowerCase().includes(teacherName.toLowerCase())
     );
  }, [referenceTimetable, teacherName]);

  const getReferenceCell = (day: string, period: number) => {
    return filteredReference.find(d => 
      d.period === period && 
      (d.dayOfWeek.toLowerCase() === day.toLowerCase() || d.dayOfWeek.toLowerCase().includes(day.toLowerCase()))
    );
  }

  // Helper to find lesson name based on subject and number
  const getLessonNameFromPPCT = (subject: string, number: string): string | undefined => {
    if (!subject || !number) return undefined;
    return ppctMap.get(`${normalizeStr(subject)}_${String(number).trim()}`);
  }

  // Helper to format date DD/MM/YYYY
  const formatDateVN = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${day}/${month}/${year}`;
  };

  // Helper to add days to a date string securely using UTC
  const getDayDate = (baseDate: string, daysToAdd: number): string => {
    if (!baseDate) return '';
    try {
      const parts = baseDate.split('-');
      if (parts.length !== 3) return '';
      
      const d = new Date(Date.UTC(
        parseInt(parts[0], 10), 
        parseInt(parts[1], 10) - 1, 
        parseInt(parts[2], 10)
      ));
      
      if (isNaN(d.getTime())) return '';
      
      d.setUTCDate(d.getUTCDate() + daysToAdd);
      return d.toISOString().split('T')[0];
    } catch (e) {
      console.error("Date calculation error", e);
      return '';
    }
  };

  const getPeriodLabel = (p: number) => {
    // Reset period number for afternoon (5->1, 6->2, 7->3)
    if (p <= 4) return p.toString();
    return (p - 4).toString();
  };

  // Core update logic
  const handleCellChange = (
    dayIndex: number, // 0 = Mon, 5 = Sat
    period: number,   // 1-7
    field: keyof ScheduleRow,
    value: any
  ) => {
    const dayOfWeek = DAYS_OF_WEEK[dayIndex];
    const currentDate = getDayDate(weekStartDate, dayIndex);

    // Find existing row or create new
    const existingRowIndex = schedule.findIndex(
      r => r.week === currentWeek && r.dayOfWeek === dayOfWeek && r.period === period
    );

    let newSchedule = [...schedule];

    if (existingRowIndex >= 0) {
      // Update existing
      const currentRow = newSchedule[existingRowIndex];
      const updatedRow = {
        ...currentRow,
        [field]: value,
        date: currentDate, // Always sync date just in case start date changed
        teacherName: teacherName // Ensure teacher name stays current
      };

      // Auto-fill logic
      if (field === 'ppctNumber') {
        if (!value || String(value).trim() === '') {
          updatedRow.lessonName = '';
        } else {
          const foundName = getLessonNameFromPPCT(updatedRow.subject, String(value));
          if (foundName) updatedRow.lessonName = foundName;
        }
      } else if (field === 'subject') {
        const foundName = getLessonNameFromPPCT(String(value), updatedRow.ppctNumber);
        if (foundName) updatedRow.lessonName = foundName;
      }

      newSchedule[existingRowIndex] = updatedRow;
    } else {
      // Create new
      const newRow: ScheduleRow = {
        id: crypto.randomUUID(),
        week: currentWeek,
        dayOfWeek,
        date: currentDate,
        period,
        subject: '',
        className: '',
        ppctNumber: '',
        lessonName: '',
        notes: '',
        teacherName: teacherName, // IMPORTANT: Assign current teacher
        [field]: value,
      };

      if (field === 'ppctNumber') {
         if (!value || String(value).trim() === '') {
            newRow.lessonName = '';
         } else {
            const foundName = getLessonNameFromPPCT(newRow.subject, String(value));
            if (foundName) newRow.lessonName = foundName;
         }
      } else if (field === 'subject') {
         const foundName = getLessonNameFromPPCT(String(value), newRow.ppctNumber);
         if (foundName) newRow.lessonName = foundName;
      }

      newSchedule.push(newRow);
    }

    onUpdateSchedule(newSchedule);
  };

  const getValue = (dayIndex: number, period: number, field: keyof ScheduleRow) => {
    const dayOfWeek = DAYS_OF_WEEK[dayIndex];
    const row = schedule.find(
      r => r.week === currentWeek && r.dayOfWeek === dayOfWeek && r.period === period
    );
    return row ? row[field] : '';
  };

  const getEndDate = () => {
     const end = getDayDate(weekStartDate, 5); // Saturday
     return formatDateVN(end);
  };

  const clearWeek = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu (Môn, Lớp, PPCT, Tên bài) của tuần này không? Ghi chú sẽ được giữ lại.")) {
       const updatedSchedule = schedule.map(s => {
         if (s.week === currentWeek) {
           return {
             ...s,
             subject: '',
             className: '',
             ppctNumber: '',
             lessonName: ''
             // Notes are preserved
           };
         }
         return s;
       });
       onUpdateSchedule(updatedSchedule);
    }
  };

  const handleExportExcel = () => {
    exportScheduleToExcel(
      schedule, 
      currentWeek, 
      formatDateVN(weekStartDate), 
      getEndDate(),
      teacherName
    );
  };

  const handleExportWord = () => {
    exportScheduleToWord(
      schedule, 
      currentWeek, 
      formatDateVN(weekStartDate), 
      getEndDate(),
      teacherName
    );
  };

  const handleAddSubject = () => {
    if (newSubject.trim() && !availableSubjects.includes(newSubject.trim())) {
      onUpdateSubjects([...availableSubjects, newSubject.trim()]);
      setNewSubject('');
    }
  };

  const handleDeleteSubject = (sub: string) => {
    onUpdateSubjects(availableSubjects.filter(s => s !== sub));
  };

  const handleAddClass = () => {
    if (newClass.trim() && !availableClasses.includes(newClass.trim())) {
      onUpdateClasses([...availableClasses, newClass.trim()]);
      setNewClass('');
    }
  };

  const handleDeleteClass = (cls: string) => {
    onUpdateClasses(availableClasses.filter(c => c !== cls));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-pink-100 p-6 h-full flex flex-col relative">
      {/* Header Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-pink-600" />
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Lịch Báo Giảng</span>
          </h2>
          <div className="flex items-center gap-1 text-xs text-green-600 mt-1 font-medium">
             <CheckCircle2 className="w-3 h-3"/> Dữ liệu tự động lưu
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-orange-50/80 p-3 rounded-xl border border-orange-100">
           
           <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-orange-700 whitespace-nowrap">Giáo viên:</label>
            <div className="relative">
              <input 
                type="text" 
                value={teacherName}
                onChange={(e) => onTeacherNameChange(e.target.value)}
                placeholder="Nhập tên..."
                className="w-32 md:w-40 p-1.5 pl-7 text-sm font-bold text-slate-700 border border-orange-300 rounded focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <User className="absolute left-2 top-2 w-3.5 h-3.5 text-orange-400 pointer-events-none" />
            </div>
           </div>

           <div className="h-6 w-px bg-orange-200 hidden sm:block"></div>

           <div className="flex items-center gap-2">
            <label className="text-sm font-bold text-orange-700 whitespace-nowrap">Tuần:</label>
            <input 
              type="number" min={1} max={52} 
              value={currentWeek}
              onChange={(e) => onWeekChange(parseInt(e.target.value) || 1)}
              className="w-14 p-1.5 text-center text-sm font-bold text-purple-700 border border-orange-300 rounded focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

           <div className="text-sm text-slate-500 italic font-medium hidden md:block">
             (<span className="text-purple-600">{formatDateVN(weekStartDate)}</span> → <span className="text-purple-600">{getEndDate()}</span>)
           </div>

           <div className="h-6 w-px bg-orange-200 mx-2 hidden lg:block"></div>

           <div className="flex gap-2">
             {referenceTimetable.length > 0 && teacherName && (
               <button 
                onClick={() => setShowReferenceModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-violet-100 text-violet-700 hover:bg-violet-200 rounded-lg text-sm font-bold transition-colors border border-violet-200"
                title="Xem TKB Mẫu đã lưu"
              >
                <Grid3X3 className="w-4 h-4" /> TKB Mẫu
              </button>
             )}

            <button 
              onClick={() => setShowConfig(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-sm font-bold transition-colors border border-purple-200"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={handleExportWord}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
              title="Tải file Word để in ấn A4"
            >
              <FileText className="w-4 h-4" /> Word
            </button>
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
              title="Tải file Excel"
            >
              <Download className="w-4 h-4" /> Excel
            </button>
            <button 
              onClick={clearWeek}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-600 hover:bg-rose-200 rounded-lg text-sm font-bold transition-colors border border-rose-200"
              title="Xóa dữ liệu tuần này"
            >
              <Trash2 className="w-4 h-4" />
            </button>
           </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="flex-1 overflow-auto custom-scrollbar border border-purple-100 rounded-lg bg-white shadow-inner">
        <datalist id="list-subjects">
          {availableSubjects.map(s => <option key={s} value={s} />)}
        </datalist>
        <datalist id="list-classes">
          {availableClasses.map(c => <option key={c} value={c} />)}
        </datalist>

        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="text-sm sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-orange-100 via-pink-100 to-purple-100 text-slate-800">
              <th className="border border-purple-200 px-2 py-3 text-center w-32 font-bold text-purple-900">Ngày thứ</th>
              <th className="border border-purple-200 px-2 py-3 text-center w-16 font-bold text-blue-900">Buổi</th>
              <th className="border border-purple-200 px-2 py-3 text-center w-16 font-bold text-pink-900">Tiết</th>
              <th className="border border-purple-200 px-2 py-3 text-center w-24 font-bold text-orange-900">Môn</th>
              <th className="border border-purple-200 px-2 py-3 text-center w-20 font-bold text-emerald-900">Lớp</th>
              <th className="border border-purple-200 px-2 py-3 text-center w-20 font-bold text-indigo-900">PPCT</th>
              <th className="border border-purple-200 px-4 py-3 text-center font-bold text-slate-800">Tên Bài Dạy</th>
              <th className="border border-purple-200 px-2 py-3 text-center w-48 font-bold text-slate-600">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700">
            {DAYS_OF_WEEK.map((dayName, dayIndex) => {
              const dateStr = getDayDate(weekStartDate, dayIndex);
              const formattedDate = formatDateVN(dateStr);
              const isEvenDay = dayIndex % 2 === 0;
              const rowBg = isEvenDay ? 'bg-white' : 'bg-slate-50/30';
              const isMonday = dayIndex === 0;

              return (
                <React.Fragment key={dayName}>
                  {PERIODS.map((period) => {
                    const isAfternoon = period > 4;
                    const periodLabel = getPeriodLabel(period);
                    
                    return (
                    <tr key={`${dayName}-${period}`} className={`${rowBg} ${isAfternoon ? 'bg-blue-50/50' : ''} hover:bg-orange-50 transition-colors group`}>
                      {/* Merged Day Cell */}
                      {period === 1 && (
                        <td 
                          rowSpan={PERIODS.length} 
                          className="border border-purple-200 px-2 py-2 text-center align-middle font-medium bg-white/50 backdrop-blur-sm"
                        >
                          <div className="flex flex-col gap-1 items-center">
                            <span className="text-xl font-black bg-gradient-to-br from-pink-500 to-purple-600 bg-clip-text text-transparent">{dayName.replace('Thứ ', '')}</span>
                            {isMonday ? (
                              <div className="w-full">
                                <input 
                                  type="date"
                                  value={weekStartDate}
                                  onChange={(e) => onDateChange(e.target.value)}
                                  className="w-full text-xs p-1 border border-pink-200 rounded bg-pink-50 text-center focus:ring-1 focus:ring-pink-500 outline-none font-bold text-pink-700 cursor-pointer"
                                  title="Chọn ngày bắt đầu (Thứ 2)"
                                />
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400">{formattedDate}</span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Merged Session (Buổi) Cell */}
                      {period === 1 && (
                        <td rowSpan={4} className="border border-purple-200 px-1 py-1 text-center font-bold text-orange-600 bg-orange-50/50 vertical-middle writing-mode-vertical">
                           Sáng
                        </td>
                      )}
                      {period === 5 && (
                        <td rowSpan={3} className="border border-purple-200 px-1 py-1 text-center font-bold text-blue-600 bg-blue-50/50 vertical-middle">
                           Chiều
                        </td>
                      )}
                      
                      {/* Period */}
                      <td className={`border border-purple-200 px-2 py-1 text-center font-bold group-hover:text-pink-500 ${isAfternoon ? 'text-blue-500' : 'text-slate-500'}`}>
                        {periodLabel}
                      </td>

                      {/* Subject */}
                      <td className="border border-purple-200 px-1 py-1">
                        <input
                           type="text"
                           list="list-subjects"
                           value={getValue(dayIndex, period, 'subject') as string}
                           onChange={(e) => handleCellChange(dayIndex, period, 'subject', e.target.value)}
                           className="w-full h-full p-1.5 outline-none bg-transparent text-center focus:bg-orange-100/50 focus:text-orange-900 font-medium rounded"
                           placeholder="..."
                        />
                      </td>

                      {/* Class */}
                      <td className="border border-purple-200 px-1 py-1">
                        <input
                           type="text"
                           list="list-classes"
                           value={getValue(dayIndex, period, 'className') as string}
                           onChange={(e) => handleCellChange(dayIndex, period, 'className', e.target.value)}
                           className="w-full h-full p-1.5 outline-none bg-transparent text-center uppercase focus:bg-emerald-100/50 focus:text-emerald-900 font-bold rounded"
                           placeholder="..."
                        />
                      </td>

                      {/* PPCT */}
                      <td className="border border-purple-200 px-1 py-1">
                        <input
                           type="text"
                           value={getValue(dayIndex, period, 'ppctNumber') as string}
                           onChange={(e) => handleCellChange(dayIndex, period, 'ppctNumber', e.target.value)}
                           className="w-full h-full p-1.5 outline-none bg-transparent text-center font-bold text-purple-600 focus:bg-purple-100/50 rounded"
                           placeholder="#"
                        />
                      </td>

                      {/* Lesson Name (Auto-filled) */}
                      <td className="border border-purple-200 px-2 py-1 align-middle">
                        <div className="min-h-[24px] flex items-center font-medium text-slate-700">
                          {getValue(dayIndex, period, 'lessonName') as string}
                        </div>
                      </td>

                      {/* Notes */}
                      <td className="border border-purple-200 px-1 py-1">
                         <input
                           type="text"
                           value={getValue(dayIndex, period, 'notes') as string}
                           onChange={(e) => handleCellChange(dayIndex, period, 'notes', e.target.value)}
                           className="w-full h-full p-1.5 outline-none bg-transparent focus:bg-slate-100 rounded text-slate-500 italic"
                        />
                      </td>
                    </tr>
                  )})}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-xs text-slate-500 font-medium">
         * <span className="text-pink-500">Mẹo:</span> Tiết 1-4 là Sáng, Tiết 1-3 (màu xanh) là Chiều.
      </div>

      {/* Settings Modal */}
      {showConfig && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm rounded-lg">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-purple-100 flex flex-col max-h-full">
            <div className="flex justify-between items-center p-4 border-b border-purple-100 bg-purple-50 rounded-t-xl">
              <h3 className="font-bold text-lg text-purple-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600"/>
                Khai báo Môn & Lớp dạy
              </h3>
              <button onClick={() => setShowConfig(false)} className="text-purple-400 hover:text-purple-700 p-1 hover:bg-purple-200 rounded transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
              {/* Subject Column */}
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-orange-700 flex items-center justify-between border-b border-orange-200 pb-2">
                  Danh sách Môn dạy
                  <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">{availableSubjects.length}</span>
                </h4>
                <div className="flex gap-2">
                   <input 
                     value={newSubject}
                     onChange={(e) => setNewSubject(e.target.value)}
                     className="flex-1 border border-orange-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                     placeholder="Thêm môn mới..."
                     onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                   />
                   <button 
                     onClick={handleAddSubject}
                     className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition shadow-sm"
                   >
                     <Plus className="w-4 h-4" />
                   </button>
                </div>
                <div className="flex flex-wrap gap-2 content-start">
                  {availableSubjects.map(sub => (
                    <span key={sub} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 bg-orange-50 text-orange-700 rounded-full text-sm border border-orange-200 group font-medium">
                      {sub}
                      <button onClick={() => handleDeleteSubject(sub)} className="p-1 hover:bg-orange-200 rounded-full text-orange-400 hover:text-orange-800 transition">
                        <X className="w-3 h-3"/>
                      </button>
                    </span>
                  ))}
                  {availableSubjects.length === 0 && (
                    <span className="text-sm text-slate-400 italic">Chưa có môn nào.</span>
                  )}
                </div>
              </div>

              {/* Class Column */}
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-emerald-700 flex items-center justify-between border-b border-emerald-200 pb-2">
                  Danh sách Lớp dạy
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{availableClasses.length}</span>
                </h4>
                <div className="flex gap-2">
                   <input 
                     value={newClass}
                     onChange={(e) => setNewClass(e.target.value)}
                     className="flex-1 border border-emerald-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                     placeholder="Thêm lớp mới..."
                     onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
                   />
                   <button 
                     onClick={handleAddClass}
                     className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition shadow-sm"
                   >
                     <Plus className="w-4 h-4" />
                   </button>
                </div>
                <div className="flex flex-wrap gap-2 content-start">
                  {availableClasses.map(cls => (
                    <span key={cls} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm border border-emerald-200 group font-bold">
                      {cls}
                      <button onClick={() => handleDeleteClass(cls)} className="p-1 hover:bg-emerald-200 rounded-full text-emerald-400 hover:text-emerald-800 transition">
                        <X className="w-3 h-3"/>
                      </button>
                    </span>
                  ))}
                  {availableClasses.length === 0 && (
                    <span className="text-sm text-slate-400 italic">Chưa có lớp nào.</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end rounded-b-xl">
              <button onClick={() => setShowConfig(false)} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition font-bold text-sm">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference Modal */}
      {showReferenceModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm rounded-lg">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl border border-violet-100 flex flex-col h-[90%]">
             <div className="flex justify-between items-center p-4 border-b border-violet-200 bg-violet-50 rounded-t-xl">
               <div>
                  <h3 className="font-bold text-lg text-violet-900 flex items-center gap-2">
                    <Grid3X3 className="w-5 h-5 text-violet-600"/>
                    Thời Khóa Biểu Mẫu: {teacherName}
                  </h3>
                  <p className="text-xs text-violet-600">Đây là lịch dạy cố định dùng để tham chiếu.</p>
               </div>
              <button onClick={() => setShowReferenceModal(false)} className="text-violet-400 hover:text-violet-700 p-1 hover:bg-violet-200 rounded transition">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
               {filteredReference.length === 0 ? (
                 <div className="text-center p-12 text-slate-500">Chưa có TKB mẫu cho giáo viên này. Vui lòng tải TKB ở Tab 1.</div>
               ) : (
                  <table className="w-full border-collapse text-sm shadow-sm rounded-lg overflow-hidden">
                    <thead>
                      <tr className="bg-violet-600 text-white">
                        <th className="p-2 border border-violet-500 w-16 text-center">Buổi</th>
                        <th className="p-2 border border-violet-500 w-12 text-center">Tiết</th>
                        {DAYS_OF_WEEK.map(day => (
                          <th key={day} className="p-2 border border-violet-500 text-center">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white text-slate-800">
                      {PERIODS_MORNING.map((period, index) => (
                        <tr key={`sang-${period}`} className="hover:bg-violet-50">
                          {index === 0 && <td rowSpan={4} className="p-2 border border-violet-100 text-center font-bold bg-orange-50 text-orange-600 writing-mode-vertical uppercase">Sáng</td>}
                          <td className="p-2 border border-violet-100 text-center font-bold text-slate-500">{period}</td>
                          {DAYS_OF_WEEK.map(day => {
                             const cell = getReferenceCell(day, period);
                             return (
                               <td key={day} className="p-2 border border-violet-100 text-center h-14">
                                  {cell ? (
                                    <div>
                                      <div className="font-bold text-emerald-700">{cell.className}</div>
                                      <div className="text-xs text-slate-600">{cell.subject}</div>
                                    </div>
                                  ) : <span className="text-slate-200">-</span>}
                               </td>
                             )
                          })}
                        </tr>
                      ))}
                      <tr className="bg-slate-100 h-2"><td colSpan={2 + DAYS_OF_WEEK.length}></td></tr>
                      {PERIODS_AFTERNOON.map((period, index) => (
                         <tr key={`chieu-${period}`} className="hover:bg-blue-50">
                          {index === 0 && <td rowSpan={3} className="p-2 border border-violet-100 text-center font-bold bg-blue-50 text-blue-600 writing-mode-vertical uppercase">Chiều</td>}
                          <td className="p-2 border border-violet-100 text-center font-bold text-slate-500">{period - 4}</td>
                          {DAYS_OF_WEEK.map(day => {
                             const cell = getReferenceCell(day, period);
                             return (
                               <td key={day} className="p-2 border border-violet-100 text-center h-14">
                                  {cell ? (
                                    <div>
                                      <div className="font-bold text-emerald-700">{cell.className}</div>
                                      <div className="text-xs text-slate-600">{cell.subject}</div>
                                    </div>
                                  ) : <span className="text-slate-200">-</span>}
                               </td>
                             )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
               )}
            </div>
            <div className="p-4 border-t border-violet-200 bg-violet-50 flex justify-end gap-3 rounded-b-xl">
               <button 
                onClick={() => {
                   if (filteredReference.length === 0) return alert("Không có dữ liệu TKB mẫu để áp dụng.");
                   if (confirm(`Áp dụng TKB mẫu vào lịch tuần ${currentWeek}?\n(Các ô đã có dữ liệu sẽ được giữ nguyên nếu trùng môn, hoặc cập nhật nếu khác).`)) {
                     onApplyReference?.(filteredReference);
                     setShowReferenceModal(false);
                   }
                }}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition font-bold text-sm flex items-center gap-2 shadow-lg shadow-violet-200"
              >
                <CheckCircle2 className="w-4 h-4" />
                Áp dụng vào Tuần {currentWeek}
              </button>
              <button onClick={() => setShowReferenceModal(false)} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition font-bold text-sm">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ScheduleEditor;
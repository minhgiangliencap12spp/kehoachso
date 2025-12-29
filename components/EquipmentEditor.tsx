import React, { useState, useMemo } from 'react';
import { EquipmentRow, EquipmentConfigEntry, DAYS_OF_WEEK } from '../types';
import { exportEquipmentToExcel, exportEquipmentToWord } from '../services/excelService';
import { Microscope, Download, Trash2, Settings, X, Plus, FileText, CheckCircle2, User } from 'lucide-react';

interface Props {
  data: EquipmentRow[];
  equipmentConfig: EquipmentConfigEntry[];
  onUpdate: (newData: EquipmentRow[]) => void;
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
}

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const EquipmentEditor: React.FC<Props> = ({ 
  data, 
  equipmentConfig,
  onUpdate,
  availableSubjects,
  onUpdateSubjects,
  availableClasses,
  onUpdateClasses,
  currentWeek,
  onWeekChange,
  weekStartDate,
  onDateChange,
  teacherName,
  onTeacherNameChange
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newClass, setNewClass] = useState('');

  // Map for Equipment Lookup
  // Key: Subject_LessonNumber
  const equipmentMap = useMemo(() => {
    const map = new Map<string, EquipmentConfigEntry>();
    equipmentConfig.forEach(e => {
       const key = `${e.subject?.trim() || ''}_${String(e.lessonNumber).trim()}`;
       
       if (map.has(key)) {
         // Merge if exists (in case manual entry in storage has duplicates that weren't cleaned)
         const existing = map.get(key)!;
         if (!existing.equipmentName.includes(e.equipmentName)) {
            existing.equipmentName = `${existing.equipmentName}, ${e.equipmentName}`;
         }
       } else {
         map.set(key, { ...e });
       }
    });
    return map;
  }, [equipmentConfig]);

  const getEquipmentFromConfig = (subject: string, number: string): EquipmentConfigEntry | undefined => {
     if (!subject || !number) return undefined;
     return equipmentMap.get(`${subject.trim()}_${String(number).trim()}`);
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
      const d = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
      if (isNaN(d.getTime())) return '';
      d.setUTCDate(d.getUTCDate() + daysToAdd);
      return d.toISOString().split('T')[0];
    } catch (e) {
      console.error("Date calculation error", e);
      return '';
    }
  };

  const getPeriodLabel = (p: number) => {
    if (p <= 4) return p.toString();
    return (p - 4).toString();
  };

  // Core update logic
  const handleCellChange = (
    dayIndex: number,
    period: number,
    field: keyof EquipmentRow,
    value: any
  ) => {
    const dayOfWeek = DAYS_OF_WEEK[dayIndex];
    const currentDate = getDayDate(weekStartDate, dayIndex);

    const existingRowIndex = data.findIndex(
      r => r.week === currentWeek && r.dayOfWeek === dayOfWeek && r.period === period
    );

    let newData = [...data];
    let currentRow: EquipmentRow;

    if (existingRowIndex >= 0) {
      currentRow = {
        ...newData[existingRowIndex],
        [field]: value,
        date: currentDate,
        teacherName: teacherName // Ensure teacher ownership
      };
      newData[existingRowIndex] = currentRow;
    } else {
      currentRow = {
        id: crypto.randomUUID(),
        week: currentWeek,
        dayOfWeek,
        date: currentDate,
        period,
        subject: '',
        className: '',
        ppctNumber: '',
        equipmentName: '',
        quantity: '', // New rows start empty
        teacherName: teacherName, // IMPORTANT: Assign current teacher
        [field]: value,
      };
      newData.push(currentRow);
    }

    // Auto-logic: 
    // 1. If Equipment Name changes and is NOT empty, default quantity to '1' if it's currently empty.
    // 2. If Equipment Name is cleared, clear Quantity.
    if (field === 'equipmentName') {
        const newName = value;
        if (newName && !currentRow.quantity) {
             currentRow.quantity = '1';
        }
        if (!newName) {
             currentRow.quantity = '';
        }
        // Save back to array (needed if we pushed a new row)
        if (existingRowIndex >= 0) newData[existingRowIndex] = currentRow;
    }

    // Auto-fill logic based on PPCT Number or Subject change
    if (field === 'ppctNumber' || field === 'subject') {
       const sub = currentRow.subject;
       const num = currentRow.ppctNumber;
       
       if (sub && num) {
          const found = getEquipmentFromConfig(sub, num);
          if (found) {
             // Find index again because we might have pushed a new row
             const idx = newData.findIndex(
                r => r.week === currentWeek && r.dayOfWeek === dayOfWeek && r.period === period
             );
             if (idx >= 0) {
                newData[idx] = {
                   ...newData[idx],
                   equipmentName: found.equipmentName,
                   quantity: found.quantity || '1' // If config found, use its qty or 1
                }
             }
          }
       }
    }

    onUpdate(newData);
  };

  const getValue = (dayIndex: number, period: number, field: keyof EquipmentRow) => {
    const dayOfWeek = DAYS_OF_WEEK[dayIndex];
    const row = data.find(
      r => r.week === currentWeek && r.dayOfWeek === dayOfWeek && r.period === period
    );
    return row ? row[field] : '';
  };

  const getEndDate = () => {
     const end = getDayDate(weekStartDate, 5); 
     return formatDateVN(end);
  };

  const clearWeek = () => {
    if (confirm("Bạn có chắc chắn muốn xóa dữ liệu thiết bị của tuần này không?")) {
       onUpdate(data.filter(s => s.week !== currentWeek));
    }
  };

  const handleExportExcel = () => {
    exportEquipmentToExcel(data, currentWeek, formatDateVN(weekStartDate), getEndDate(), teacherName);
  };

  const handleExportWord = () => {
    exportEquipmentToWord(data, currentWeek, formatDateVN(weekStartDate), getEndDate(), teacherName);
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
    <div className="bg-white rounded-xl shadow-lg border border-teal-100 p-6 h-full flex flex-col relative">
      {/* Header Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Microscope className="w-6 h-6 text-teal-600" />
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Phiếu Thiết Bị</span>
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
              className="w-14 p-1.5 text-center text-sm font-bold text-teal-700 border border-orange-300 rounded focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

           <div className="text-sm text-slate-500 italic font-medium hidden md:block">
             (<span className="text-teal-600">{formatDateVN(weekStartDate)}</span> → <span className="text-teal-600">{getEndDate()}</span>)
           </div>

           <div className="h-6 w-px bg-orange-200 mx-2 hidden lg:block"></div>

           <div className="flex gap-2">
            <button 
              onClick={() => setShowConfig(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-teal-100 text-teal-700 hover:bg-teal-200 rounded-lg text-sm font-bold transition-colors border border-teal-200"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={handleExportWord}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" /> Word
            </button>
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Excel
            </button>
            <button 
              onClick={clearWeek}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-600 hover:bg-rose-200 rounded-lg text-sm font-bold transition-colors border border-rose-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
           </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="flex-1 overflow-auto custom-scrollbar border border-teal-100 rounded-lg bg-white shadow-inner">
        <datalist id="list-subjects">
          {availableSubjects.map(s => <option key={s} value={s} />)}
        </datalist>
        <datalist id="list-classes">
          {availableClasses.map(c => <option key={c} value={c} />)}
        </datalist>

        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="text-sm sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-teal-50 via-cyan-50 to-sky-100 text-slate-800">
              <th className="border border-teal-200 px-2 py-3 text-center w-32 font-bold text-teal-900">Ngày thứ</th>
              <th className="border border-teal-200 px-2 py-3 text-center w-16 font-bold text-blue-900">Buổi</th>
              <th className="border border-teal-200 px-2 py-3 text-center w-16 font-bold text-pink-900">Tiết</th>
              <th className="border border-teal-200 px-2 py-3 text-center w-24 font-bold text-orange-900">Môn</th>
              <th className="border border-teal-200 px-2 py-3 text-center w-20 font-bold text-emerald-900">Lớp</th>
              <th className="border border-teal-200 px-2 py-3 text-center w-20 font-bold text-indigo-900">PPCT</th>
              <th className="border border-teal-200 px-4 py-3 text-center font-bold text-slate-800">Tên Thiết Bị</th>
              <th className="border border-teal-200 px-2 py-3 text-center w-24 font-bold text-slate-600">Số lượng</th>
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
                    <tr key={`${dayName}-${period}`} className={`${rowBg} ${isAfternoon ? 'bg-blue-50/50' : ''} hover:bg-teal-50 transition-colors group`}>
                      {period === 1 && (
                        <td 
                          rowSpan={PERIODS.length} 
                          className="border border-teal-200 px-2 py-2 text-center align-middle font-medium bg-white/50 backdrop-blur-sm"
                        >
                          <div className="flex flex-col gap-1 items-center">
                            <span className="text-xl font-black bg-gradient-to-br from-teal-500 to-cyan-600 bg-clip-text text-transparent">{dayName.replace('Thứ ', '')}</span>
                            {isMonday ? (
                              <div className="w-full">
                                <input 
                                  type="date"
                                  value={weekStartDate}
                                  onChange={(e) => onDateChange(e.target.value)}
                                  className="w-full text-xs p-1 border border-teal-200 rounded bg-teal-50 text-center focus:ring-1 focus:ring-teal-500 outline-none font-bold text-teal-700 cursor-pointer"
                                />
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400">{formattedDate}</span>
                            )}
                          </div>
                        </td>
                      )}

                      {period === 1 && (
                        <td rowSpan={4} className="border border-teal-200 px-1 py-1 text-center font-bold text-orange-600 bg-orange-50/50 vertical-middle writing-mode-vertical">Sáng</td>
                      )}
                      {period === 5 && (
                        <td rowSpan={3} className="border border-teal-200 px-1 py-1 text-center font-bold text-blue-600 bg-blue-50/50 vertical-middle">Chiều</td>
                      )}
                      
                      <td className={`border border-teal-200 px-2 py-1 text-center font-bold group-hover:text-teal-500 ${isAfternoon ? 'text-blue-500' : 'text-slate-500'}`}>
                        {periodLabel}
                      </td>

                      <td className="border border-teal-200 px-1 py-1">
                        <input
                           type="text" list="list-subjects"
                           value={getValue(dayIndex, period, 'subject') as string}
                           onChange={(e) => handleCellChange(dayIndex, period, 'subject', e.target.value)}
                           className="w-full h-full p-1.5 outline-none bg-transparent text-center focus:bg-orange-100/50 focus:text-orange-900 font-medium rounded"
                           placeholder="..."
                        />
                      </td>

                      <td className="border border-teal-200 px-1 py-1">
                        <input
                           type="text" list="list-classes"
                           value={getValue(dayIndex, period, 'className') as string}
                           onChange={(e) => handleCellChange(dayIndex, period, 'className', e.target.value)}
                           className="w-full h-full p-1.5 outline-none bg-transparent text-center uppercase focus:bg-emerald-100/50 focus:text-emerald-900 font-bold rounded"
                           placeholder="..."
                        />
                      </td>

                      <td className="border border-teal-200 px-1 py-1">
                        <input
                           type="text"
                           value={getValue(dayIndex, period, 'ppctNumber') as string}
                           onChange={(e) => handleCellChange(dayIndex, period, 'ppctNumber', e.target.value)}
                           className="w-full h-full p-1.5 outline-none bg-transparent text-center font-bold text-purple-600 focus:bg-purple-100/50 rounded"
                           placeholder="#"
                        />
                      </td>

                      {/* Equipment Name */}
                      <td className="border border-teal-200 px-1 py-1">
                        <input
                           type="text"
                           value={getValue(dayIndex, period, 'equipmentName') as string}
                           onChange={(e) => handleCellChange(dayIndex, period, 'equipmentName', e.target.value)}
                           className="w-full h-full p-1.5 outline-none bg-transparent focus:bg-teal-100/50 rounded font-medium text-slate-700"
                           placeholder="Nhập tên thiết bị..."
                        />
                      </td>

                      {/* Quantity */}
                      <td className="border border-teal-200 px-1 py-1">
                         <input
                           type="text"
                           value={getValue(dayIndex, period, 'quantity') as string}
                           onChange={(e) => handleCellChange(dayIndex, period, 'quantity', e.target.value)}
                           className="w-full h-full p-1.5 outline-none bg-transparent text-center focus:bg-slate-100 rounded text-slate-600 font-bold"
                           placeholder="SL"
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

      {/* Settings Modal (Copied from ScheduleEditor but simplified for consistency) */}
      {showConfig && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm rounded-lg">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-teal-100 flex flex-col max-h-full">
            <div className="flex justify-between items-center p-4 border-b border-teal-100 bg-teal-50 rounded-t-xl">
              <h3 className="font-bold text-lg text-teal-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-teal-600"/>
                Khai báo Môn & Lớp dạy
              </h3>
              <button onClick={() => setShowConfig(false)} className="text-teal-400 hover:text-teal-700 p-1 hover:bg-teal-200 rounded transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
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
                   <button onClick={handleAddSubject} className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition shadow-sm"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2 content-start">
                  {availableSubjects.map(sub => (
                    <span key={sub} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 bg-orange-50 text-orange-700 rounded-full text-sm border border-orange-200 group font-medium">
                      {sub}
                      <button onClick={() => handleDeleteSubject(sub)} className="p-1 hover:bg-orange-200 rounded-full text-orange-400 hover:text-orange-800 transition"><X className="w-3 h-3"/></button>
                    </span>
                  ))}
                </div>
              </div>

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
                   <button onClick={handleAddClass} className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition shadow-sm"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2 content-start">
                  {availableClasses.map(cls => (
                    <span key={cls} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm border border-emerald-200 group font-bold">
                      {cls}
                      <button onClick={() => handleDeleteClass(cls)} className="p-1 hover:bg-emerald-200 rounded-full text-emerald-400 hover:text-emerald-800 transition"><X className="w-3 h-3"/></button>
                    </span>
                  ))}
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
    </div>
  );
};

export default EquipmentEditor;
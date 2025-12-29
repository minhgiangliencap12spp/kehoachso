import React, { useState, useEffect, useMemo } from 'react';
import { AppTab, PPCTEntry, ScheduleRow, EquipmentRow, EquipmentConfigEntry, DAYS_OF_WEEK, TimetableEntry } from './types';
import PPCTManager from './components/PPCTManager';
import ScheduleEditor from './components/ScheduleEditor';
import EquipmentEditor from './components/EquipmentEditor';
import EquipmentManager from './components/EquipmentManager';
import TimetableManager from './components/TimetableManager';
import { Layout, CalendarDays, FileText, Microscope, Settings2, CalendarCheck } from 'lucide-react';

const STORAGE_KEYS = {
  PPCT: 'TS_PPCT_DATA',
  SCHEDULE: 'TS_SCHEDULE_DATA',
  EQUIPMENT: 'TS_EQUIPMENT_DATA',
  EQUIPMENT_CONFIG: 'TS_EQUIPMENT_CONFIG',
  SUBJECTS: 'TS_SUBJECTS',
  CLASSES: 'TS_CLASSES',
  CURRENT_WEEK: 'TS_CURRENT_WEEK',
  WEEK_START_DATE: 'TS_WEEK_START_DATE',
  TEACHER_NAME: 'TS_TEACHER_NAME',
  TIMETABLE_DATA: 'TS_TIMETABLE_DATA',
  TIMETABLE_FILE: 'TS_TIMETABLE_FILE'
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.TIMETABLE);

  // Initialize state with lazy loading from localStorage
  const [ppctData, setPpctData] = useState<PPCTEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PPCT);
    return saved ? JSON.parse(saved) : [];
  });

  const [scheduleData, setScheduleData] = useState<ScheduleRow[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    return saved ? JSON.parse(saved) : [];
  });

  const [equipmentData, setEquipmentData] = useState<EquipmentRow[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
    return saved ? JSON.parse(saved) : [];
  });

  const [equipmentConfigData, setEquipmentConfigData] = useState<EquipmentConfigEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EQUIPMENT_CONFIG);
    return saved ? JSON.parse(saved) : [];
  });

  // Timetable State
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TIMETABLE_DATA);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [timetableFileName, setTimetableFileName] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.TIMETABLE_FILE) || '';
  });

  // Global Teacher Name State
  const [teacherName, setTeacherName] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.TEACHER_NAME) || '';
  });

  // State for Global Configuration (Subjects & Classes)
  const [subjects, setSubjects] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
    return saved ? JSON.parse(saved) : [
      'Toán(Đ)', 'Toán(H)', 'Ngữ Văn', 'Tiếng Anh', 'KHTN', 'Lịch Sử & ĐL', 'GDCD', 
      'Tin Học 7', 'Tin Học 9', 'Tin học 7', 'Tin học 9', 'Công Nghệ', 'HĐTN', 'GDTC', 'Âm Nhạc', 'Mỹ Thuật'
    ];
  });

  // Unique filter for subjects to avoid duplicates if old data persisted
  useEffect(() => {
     setSubjects(prev => Array.from(new Set(prev)));
  }, []);

  const [classes, setClasses] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
    // If saved data exists, use it; otherwise use the requested default list
    return saved ? JSON.parse(saved) : [
      '9D1', '9D2', '9D3', '9D4', '7B1', '7B2', '7B3', '7B4'
    ];
  });

  // Synchronized State for Week and Date
  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_WEEK);
    return saved ? parseInt(saved, 10) : 13;
  });

  const [weekStartDate, setWeekStartDate] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WEEK_START_DATE);
    return saved ? saved : new Date().toISOString().split('T')[0];
  });

  // Effects to save data whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PPCT, JSON.stringify(ppctData));
  }, [ppctData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(scheduleData));
  }, [scheduleData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(equipmentData));
  }, [equipmentData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT_CONFIG, JSON.stringify(equipmentConfigData));
  }, [equipmentConfigData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEACHER_NAME, teacherName);
  }, [teacherName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE_DATA, JSON.stringify(timetableData));
  }, [timetableData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIMETABLE_FILE, timetableFileName);
  }, [timetableFileName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_WEEK, currentWeek.toString());
  }, [currentWeek]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WEEK_START_DATE, weekStartDate);
  }, [weekStartDate]);

  // Helper to normalize strings for comparison (remove spaces, lowercase)
  const normalizeStr = (s: string) => s.toLowerCase().replace(/\s+/g, '');

  // --- DERIVED DATA FOR CURRENT TEACHER ---
  // We only pass the schedule/equipment data belonging to the current teacher to the child components
  const currentTeacherSchedule = useMemo(() => {
    return scheduleData.filter(row => 
      // Match exact name, or if row has no teacherName but we have a teacherName (legacy migration support can happen here, but better to keep strict)
      (row.teacherName || '') === teacherName
    );
  }, [scheduleData, teacherName]);

  const currentTeacherEquipment = useMemo(() => {
     return equipmentData.filter(row => (row.teacherName || '') === teacherName);
  }, [equipmentData, teacherName]);


  // --- AUTOMATIC EXTRACTION LOGIC ---
  // Whenever Timetable Data or Teacher Name changes, update the Subject and Class lists
  useEffect(() => {
    if (timetableData.length > 0 && teacherName) {
      // 1. Try strict match first
      let teacherEntries = timetableData.filter(d => 
        (d.teacherName || '').toLowerCase().trim() === teacherName.toLowerCase().trim()
      );

      // 2. Fallback to 'includes' match if strict match yields nothing (legacy data support)
      if (teacherEntries.length === 0) {
        teacherEntries = timetableData.filter(d => 
          (d.teacherName || '').toLowerCase().includes(teacherName.toLowerCase())
        );
      }

      if (teacherEntries.length > 0) {
        const newSubjects = new Set<string>();
        const newClasses = new Set<string>();

        teacherEntries.forEach(entry => {
           if (entry.subject && entry.subject.trim()) {
             newSubjects.add(entry.subject.trim());
           }
           if (entry.className && entry.className.trim()) {
             newClasses.add(entry.className.trim());
           }
        });

        // Strictly replace the lists to match the new teacher
        setSubjects(Array.from(newSubjects).sort());
        setClasses(Array.from(newClasses).sort());
      }
    }
  }, [timetableData, teacherName]);

  // Helper to calculate date string dd/MM from start date string dd/MM/YYYY and offset
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
      return '';
    }
  };

  // Helper to get matching PPCT Lesson Name
  const getLessonName = (subject: string, ppctNum: string): string => {
      if (!subject || !ppctNum) return '';
      const entry = ppctData.find(p => 
          normalizeStr(p.subject || '') === normalizeStr(subject) && 
          String(p.lessonNumber).trim() === String(ppctNum).trim()
      );
      return entry ? entry.lessonName : '';
  };

  // Logic: Apply Timetable to Schedule (Manual Button)
  const handleApplyTimetable = (entries: TimetableEntry[]) => {
    if (entries.length > 0 && entries[0].teacherName) {
      setTeacherName(entries[0].teacherName);
    }
    
    // Manual apply forces generation even if data exists (it overwrites/merges)
    const newRows = generateScheduleForWeek(currentWeek, weekStartDate, entries);
    
    // IMPORTANT: Merge new rows for THIS teacher into the global scheduleData
    setScheduleData(prevSchedule => {
       // Filter out existing rows for THIS teacher in THIS week to prevent duplication before adding new ones
       // Or simpler: remove all rows for THIS teacher, then add the new set (which contains both old preserved rows and new generated ones).
       // Actually, generateScheduleForWeek creates a fresh set based on TKB.
       // But we need to preserve rows that were manually added? 
       // The 'generateScheduleForWeek' function in current implementation reads 'scheduleData' for history counters, 
       // but returns NEW rows based on TKB. 
       
       // Strategy: Remove ALL existing rows for THIS teacher for THIS week, then add new rows.
       const otherRows = prevSchedule.filter(s => 
          (s.teacherName !== teacherName) || (s.week !== currentWeek)
       );
       
       // However, generateScheduleForWeek above creates NEW rows from TKB. 
       // We should merge smart:
       // The `generateScheduleForWeek` function (below) creates a list of rows based on TKB.
       // We need to merge these into the global state.
       
       return [...otherRows, ...newRows];
    });
    
    setActiveTab(AppTab.SCHEDULE);
    alert(`Đã áp dụng thời khóa biểu mẫu vào tuần ${currentWeek}.`);
  };

  // Sync Logic: Schedule -> Equipment
  // Receive ONLY the updated rows for the current teacher from ScheduleEditor
  const handleScheduleUpdate = (updatedTeacherSchedule: ScheduleRow[]) => {
    // 1. Update Global Schedule Data
    setScheduleData(prevGlobal => {
      // Remove all rows belonging to current teacher
      const others = prevGlobal.filter(row => row.teacherName !== teacherName);
      // Add the updated rows (which already contain all rows for this teacher)
      // Ensure all rows are tagged with teacherName
      const taggedRows = updatedTeacherSchedule.map(r => ({ ...r, teacherName }));
      return [...others, ...taggedRows];
    });

    // 2. Sync Equipment Data (For current teacher only)
    setEquipmentData(prevGlobalEquipment => {
      const otherTeachersEquipment = prevGlobalEquipment.filter(e => e.teacherName !== teacherName);
      let myEquipment = prevGlobalEquipment.filter(e => e.teacherName === teacherName);
      
      const currentWeekScheduleRows = updatedTeacherSchedule.filter(s => s.week === currentWeek);

      currentWeekScheduleRows.forEach(schRow => {
        const eqIndex = myEquipment.findIndex(e =>
          e.week === schRow.week &&
          e.dayOfWeek === schRow.dayOfWeek &&
          e.period === schRow.period
        );

        const configEntry = equipmentConfigData.find(c => 
          normalizeStr(c.subject || '') === normalizeStr(schRow.subject || '') && 
          String(c.lessonNumber).trim() === String(schRow.ppctNumber).trim()
        );

        let nextEqName = '';
        let nextQty = '';

        if (eqIndex !== -1) {
          // Existing equipment row
          nextEqName = configEntry ? configEntry.equipmentName : myEquipment[eqIndex].equipmentName;
          if (configEntry && configEntry.quantity) {
             nextQty = configEntry.quantity;
          } else if (nextEqName) {
             nextQty = myEquipment[eqIndex].quantity || '1';
          } else {
             nextQty = '';
          }
          
          // Update existing
          myEquipment[eqIndex] = {
            ...myEquipment[eqIndex],
            subject: schRow.subject,
            className: schRow.className,
            ppctNumber: schRow.ppctNumber,
            date: schRow.date,
            equipmentName: nextEqName,
            quantity: nextQty,
            teacherName: teacherName
          };
        } else {
          // New equipment row needed?
          // Only create if there is subject/class
          if (schRow.subject || schRow.className) {
            nextEqName = configEntry ? configEntry.equipmentName : '';
            nextQty = configEntry ? (configEntry.quantity || '1') : (nextEqName ? '1' : '');

            myEquipment.push({
              id: crypto.randomUUID(),
              week: schRow.week,
              dayOfWeek: schRow.dayOfWeek,
              date: schRow.date,
              period: schRow.period,
              subject: schRow.subject,
              className: schRow.className,
              ppctNumber: schRow.ppctNumber,
              equipmentName: nextEqName,
              quantity: nextQty,
              teacherName: teacherName
            });
          }
        }
      });

      return [...otherTeachersEquipment, ...myEquipment];
    });
  };

  // Wrapper for EquipmentEditor update
  const handleEquipmentUpdate = (updatedTeacherEquipment: EquipmentRow[]) => {
      setEquipmentData(prevGlobal => {
          const others = prevGlobal.filter(r => r.teacherName !== teacherName);
          const tagged = updatedTeacherEquipment.map(r => ({ ...r, teacherName }));
          return [...others, ...tagged];
      });
  };

  // Generator Function used by Effect and Handlers
  const generateScheduleForWeek = (week: number, startDate: string, entriesSource: TimetableEntry[] = []) => {
      // If entriesSource is provided, use it. Otherwise filter from timetableData
      let teacherEntries = entriesSource;
      
      if (teacherEntries.length === 0) {
         if (!teacherName || timetableData.length === 0) return [];
         teacherEntries = timetableData.filter(d => 
           (d.teacherName || '').toLowerCase().includes(teacherName.toLowerCase())
         );
      }

      if (teacherEntries.length === 0) return [];

      const counters: Record<string, number> = {}; 
      // Count history only for THIS teacher
      const myHistorySchedule = scheduleData.filter(s => s.teacherName === teacherName);
      
      myHistorySchedule.forEach(row => {
         // Count from history BEFORE this week
         if (row.week < week && row.subject && row.ppctNumber) {
            const key = `${normalizeStr(row.subject)}_${normalizeStr(row.className || '')}`;
            const match = String(row.ppctNumber).match(/\d+/);
            if (match) {
               const num = parseInt(match[0], 10);
               if (!isNaN(num)) counters[key] = Math.max(counters[key] || 0, num);
            }
         }
      });
      
      // Also need to sort entries by day/period to ensure PPCT increments correctly within the week
      const sortedEntries = [...teacherEntries].sort((a, b) => {
         const da = DAYS_OF_WEEK.findIndex(d => normalizeStr(d) === normalizeStr(a.dayOfWeek) || a.dayOfWeek.includes(d));
         const db = DAYS_OF_WEEK.findIndex(d => normalizeStr(d) === normalizeStr(b.dayOfWeek) || b.dayOfWeek.includes(d));
         if (da !== db) return da - db;
         return a.period - b.period;
      });

      const newRows: ScheduleRow[] = [];
      sortedEntries.forEach(entry => {
         const dayIndex = DAYS_OF_WEEK.findIndex(d => 
            normalizeStr(d) === normalizeStr(entry.dayOfWeek) || 
            entry.dayOfWeek.toLowerCase().includes(d.toLowerCase())
         );
         if (dayIndex === -1) return;

         const dateStr = getDayDate(startDate, dayIndex);
         
         const key = `${normalizeStr(entry.subject)}_${normalizeStr(entry.className || '')}`;
         const currentMax = counters[key] || 0;
         const nextPPCT = currentMax + 1;
         counters[key] = nextPPCT; 

         const nextLessonName = getLessonName(entry.subject, nextPPCT.toString());

         newRows.push({
            id: crypto.randomUUID(),
            week: week,
            dayOfWeek: DAYS_OF_WEEK[dayIndex],
            date: dateStr,
            period: entry.period,
            subject: entry.subject,
            className: entry.className,
            ppctNumber: nextPPCT.toString(), 
            lessonName: nextLessonName,     
            notes: '',
            teacherName: teacherName // Ensure generated rows belong to current teacher
         });
      });

      return newRows;
  };

  // --- AUTO-POPULATE EFFECT ---
  // Runs when currentWeek changes, or teacher/timetable changes
  useEffect(() => {
     if (!teacherName) return;

     // Check if current week is empty for THIS teacher
     const hasData = scheduleData.some(row => row.week === currentWeek && row.teacherName === teacherName);
     
     if (!hasData && timetableData.length > 0) {
         const newRows = generateScheduleForWeek(currentWeek, weekStartDate);
         if (newRows.length > 0) {
            // Using functional update to avoid stale state in effect
            setScheduleData(prev => {
                // Double check inside to prevent race conditions
                if (prev.some(r => r.week === currentWeek && r.teacherName === teacherName)) return prev;
                // Merge carefully: Keep other teachers' data, add new rows for this teacher
                return [...prev, ...newRows];
            });
            
            // Trigger equipment sync for the new rows
            setEquipmentData(prevEq => {
                 const others = prevEq.filter(e => e.teacherName !== teacherName);
                 const myNewEq: EquipmentRow[] = [];
                 
                 newRows.forEach(schRow => {
                    const configEntry = equipmentConfigData.find(c => 
                      normalizeStr(c.subject || '') === normalizeStr(schRow.subject || '') && 
                      String(c.lessonNumber).trim() === String(schRow.ppctNumber).trim()
                    );
                    myNewEq.push({
                      id: crypto.randomUUID(),
                      week: schRow.week,
                      dayOfWeek: schRow.dayOfWeek,
                      date: schRow.date,
                      period: schRow.period,
                      subject: schRow.subject,
                      className: schRow.className,
                      ppctNumber: schRow.ppctNumber,
                      equipmentName: configEntry ? configEntry.equipmentName : '',
                      quantity: configEntry ? (configEntry.quantity || '1') : '',
                      teacherName: teacherName
                    });
                 });
                 
                 // If there were existing equipment rows for this week (unlikely if schedule was empty, but safe to filter)
                 const myExistingEq = prevEq.filter(e => e.teacherName === teacherName && e.week !== currentWeek);

                 return [...others, ...myExistingEq, ...myNewEq];
            });
         }
     }
  }, [currentWeek, teacherName, timetableData]); // Dependent on teacherName to trigger when switching

  // --- SMART WEEK CHANGE HANDLER ---
  const handleWeekChange = (newWeek: number) => {
    const weekDiff = newWeek - currentWeek;
    setCurrentWeek(newWeek);

    if (weekStartDate && weekDiff !== 0) {
      try {
        const d = new Date(weekStartDate);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + (7 * weekDiff));
          setWeekStartDate(d.toISOString().split('T')[0]);
        }
      } catch (e) {}
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-orange-50/30 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-pink-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-2.5 rounded-xl shadow-lg shadow-orange-200">
               <Layout className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent hidden sm:block">
              TeacherScheduler AI
            </h1>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent sm:hidden">
              TS AI
            </h1>
          </div>
          
          <nav className="flex gap-1 bg-pink-50 p-1 rounded-xl border border-pink-100 overflow-x-auto max-w-full custom-scrollbar">
            {/* 1. Thời khóa biểu */}
            <button
              onClick={() => setActiveTab(AppTab.TIMETABLE)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === AppTab.TIMETABLE 
                  ? 'bg-white text-violet-600 shadow-md shadow-violet-100' 
                  : 'text-slate-500 hover:text-violet-500'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span className="hidden sm:inline">1. Thời khóa biểu</span>
              <span className="sm:hidden">1. TKB</span>
            </button>

            {/* 2. Cấu hình PPCT */}
            <button
              onClick={() => setActiveTab(AppTab.PPCT)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === AppTab.PPCT 
                  ? 'bg-white text-orange-600 shadow-md shadow-orange-100' 
                  : 'text-slate-500 hover:text-orange-500'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">2. Cấu hình PPCT</span>
              <span className="sm:hidden">2. PPCT</span>
            </button>

            {/* 3. Cấu hình TB (DEVICE_LIST) */}
            <button
              onClick={() => setActiveTab(AppTab.DEVICE_LIST)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === AppTab.DEVICE_LIST 
                  ? 'bg-white text-teal-600 shadow-md shadow-teal-100' 
                  : 'text-slate-500 hover:text-teal-500'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">3. Cấu hình TB</span>
              <span className="sm:hidden">3. Cấu hình TB</span>
            </button>

            {/* 4. Lịch Báo Giảng (SCHEDULE) */}
            <button
              onClick={() => setActiveTab(AppTab.SCHEDULE)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === AppTab.SCHEDULE 
                  ? 'bg-white text-pink-600 shadow-md shadow-pink-100' 
                  : 'text-slate-500 hover:text-pink-500'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">4. Lịch Báo Giảng</span>
              <span className="sm:hidden">4. LBG</span>
            </button>

            {/* 5. Phiếu Thiết Bị (EQUIPMENT) */}
            <button
              onClick={() => setActiveTab(AppTab.EQUIPMENT)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === AppTab.EQUIPMENT
                  ? 'bg-white text-cyan-600 shadow-md shadow-cyan-100' 
                  : 'text-slate-500 hover:text-cyan-500'
              }`}
            >
              <Microscope className="w-4 h-4" />
              <span className="hidden sm:inline">5. Phiếu Thiết Bị</span>
              <span className="sm:hidden">5. PTB</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 overflow-hidden flex flex-col">
        {activeTab === AppTab.TIMETABLE && (
          <div className="flex-1 h-full min-h-[500px]">
             <TimetableManager
               onApply={handleApplyTimetable}
               savedData={timetableData}
               savedFileName={timetableFileName}
               onUpdateData={setTimetableData}
               onUpdateFileName={setTimetableFileName}
               // Pass teacher name control
               teacherName={teacherName}
               onUpdateTeacherName={setTeacherName}
             />
          </div>
        )}
        {activeTab === AppTab.PPCT && (
          <div className="flex-1 h-full min-h-[500px]">
             <PPCTManager 
               data={ppctData} 
               onUpdate={(newData) => {
                 setPpctData(newData);
               }}
               availableSubjects={subjects} 
             />
          </div>
        )}
        {activeTab === AppTab.DEVICE_LIST && (
           <div className="flex-1 h-full min-h-[500px]">
             <EquipmentManager
               data={equipmentConfigData}
               onUpdate={(newData) => setEquipmentConfigData(newData)}
               availableSubjects={subjects}
             />
           </div>
        )}
        {activeTab === AppTab.SCHEDULE && (
          <div className="flex-1 h-full min-h-[500px]">
            <ScheduleEditor 
              schedule={currentTeacherSchedule} // ONLY pass current teacher's data
              ppct={ppctData}
              onUpdateSchedule={handleScheduleUpdate}
              availableSubjects={subjects}
              onUpdateSubjects={setSubjects}
              availableClasses={classes}
              onUpdateClasses={setClasses}
              // Pass synchronized state and Smart Handler
              currentWeek={currentWeek}
              onWeekChange={handleWeekChange}
              weekStartDate={weekStartDate}
              onDateChange={setWeekStartDate}
              // Pass Teacher Name props
              teacherName={teacherName}
              onTeacherNameChange={setTeacherName}
              // Pass Reference Timetable Data
              referenceTimetable={timetableData}
              // NEW PROP
              onApplyReference={handleApplyTimetable}
            />
          </div>
        )}
        {activeTab === AppTab.EQUIPMENT && (
          <div className="flex-1 h-full min-h-[500px]">
            <EquipmentEditor
              data={currentTeacherEquipment} // ONLY pass current teacher's data
              equipmentConfig={equipmentConfigData}
              onUpdate={handleEquipmentUpdate}
              availableSubjects={subjects}
              onUpdateSubjects={setSubjects}
              availableClasses={classes}
              onUpdateClasses={setClasses}
              // Pass synchronized state and Smart Handler
              currentWeek={currentWeek}
              onWeekChange={handleWeekChange}
              weekStartDate={weekStartDate}
              onDateChange={setWeekStartDate}
              // Pass Teacher Name props
              teacherName={teacherName}
              onTeacherNameChange={setTeacherName}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-orange-100 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          <p>TeacherScheduler AI © 2024. Hỗ trợ bởi Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
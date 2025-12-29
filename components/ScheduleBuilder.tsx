import React, { useState, useEffect } from 'react';
import { DAYS_OF_WEEK, PPCTEntry } from '../types';
import { Save, Plus, Trash2, Download, RefreshCw } from 'lucide-react';

interface ScheduleItem {
  id: string;
  dayOfWeek: string;
  periodInday: number;
  className: string;
  subject: string;
  ppctPeriod: string;
  lessonName: string;
  notes: string;
}

interface ScheduleBuilderProps {
  ppct: PPCTEntry[];
  onExport: (items: ScheduleItem[]) => void;
}

export const ScheduleBuilder: React.FC<ScheduleBuilderProps> = ({ ppct, onExport }) => {
  // Initialize with some empty rows
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [defaultClass, setDefaultClass] = useState('');
  const [defaultSubject, setDefaultSubject] = useState('');

  // Helper to find lesson name
  const findLessonName = (period: number): string => {
    const entry = ppct.find(p => p.lessonNumber == period);
    return entry ? entry.lessonName : '--- Không tìm thấy trong PPCT ---';
  };

  const addItem = () => {
    const newItem: ScheduleItem = {
      id: crypto.randomUUID(),
      dayOfWeek: DAYS_OF_WEEK[0],
      periodInday: 1,
      className: defaultClass,
      subject: defaultSubject,
      ppctPeriod: '',
      lessonName: '',
      notes: ''
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof ScheduleItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, [field]: value };
      
      // Auto-fill logic
      if (field === 'ppctPeriod') {
        if (value && !isNaN(Number(value))) {
          updated.lessonName = findLessonName(Number(value));
        } else {
          updated.lessonName = '';
        }
      }
      return updated;
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Bulk add for a whole week structure? Maybe too complex for now.
  // Let's just create a "Standard Week" initializer
  const initWeek = () => {
    const newItems: ScheduleItem[] = [];
    DAYS_OF_WEEK.forEach(day => {
       // Add 2 periods per day as a starter template
       newItems.push({
         id: crypto.randomUUID(),
         dayOfWeek: day,
         periodInday: 1,
         className: defaultClass,
         subject: defaultSubject,
         ppctPeriod: '',
         lessonName: '',
         notes: ''
       });
    });
    setItems(prev => [...prev, ...newItems]);
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-4 items-center flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Lớp Mặc Định</label>
            <input 
              type="text" 
              placeholder="Vd: 10A1" 
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-24"
              value={defaultClass}
              onChange={e => setDefaultClass(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Môn Mặc Định</label>
            <input 
              type="text" 
              placeholder="Vd: Toán" 
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-32"
              value={defaultSubject}
              onChange={e => setDefaultSubject(e.target.value)}
            />
          </div>
          <div className="h-10 w-px bg-slate-200 mx-2"></div>
           <button 
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Thêm tiết
          </button>
           <button 
            onClick={initWeek}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Thêm mẫu tuần
          </button>
        </div>

        <button 
          onClick={() => onExport(items)}
          disabled={items.length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Download className="w-4 h-4" /> Xuất Excel
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-3 pl-4">Thứ</th>
                <th className="p-3 w-20">Tiết (Ngày)</th>
                <th className="p-3 w-24">Lớp</th>
                <th className="p-3 w-32">Môn</th>
                <th className="p-3 w-24 text-blue-700 bg-blue-50/50 border-l border-blue-100">Tiết PPCT</th>
                <th className="p-3 flex-1 min-w-[300px] text-blue-700 bg-blue-50/50">Tên Bài (Tự động)</th>
                <th className="p-3">Ghi chú</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 group">
                  <td className="p-2 pl-4">
                    <select 
                      className="w-full bg-transparent p-1 rounded hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer"
                      value={item.dayOfWeek}
                      onChange={(e) => updateItem(item.id, 'dayOfWeek', e.target.value)}
                    >
                      {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </td>
                  <td className="p-2">
                     <select 
                      className="w-full bg-transparent p-1 rounded hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer"
                      value={item.periodInday}
                      onChange={(e) => updateItem(item.id, 'periodInday', Number(e.target.value))}
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      className="w-full p-1 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white outline-none bg-transparent transition-all"
                      value={item.className}
                      onChange={(e) => updateItem(item.id, 'className', e.target.value)}
                      placeholder="Lớp..."
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      className="w-full p-1 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white outline-none bg-transparent transition-all"
                      value={item.subject}
                      onChange={(e) => updateItem(item.id, 'subject', e.target.value)}
                      placeholder="Môn..."
                    />
                  </td>
                  <td className="p-2 bg-blue-50/10 border-l border-slate-100">
                    <input 
                      type="number" 
                      className="w-full p-1 font-bold text-center rounded border border-blue-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-blue-700"
                      value={item.ppctPeriod}
                      onChange={(e) => updateItem(item.id, 'ppctPeriod', e.target.value)}
                      placeholder="#"
                    />
                  </td>
                  <td className="p-2 bg-blue-50/10">
                    <div className={`p-1.5 rounded w-full min-h-[28px] ${item.lessonName ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                        {item.lessonName || '...nhập tiết PPCT để hiện tên bài'}
                    </div>
                  </td>
                  <td className="p-2">
                    <input 
                      type="text" 
                      className="w-full p-1 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white outline-none bg-transparent"
                      value={item.notes}
                      onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                         <Plus className="w-8 h-8 text-slate-300" />
                      </div>
                      <p>Chưa có lịch. Nhấn "Thêm tiết" hoặc "Thêm mẫu tuần" để bắt đầu.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
           <span>Tổng số tiết: {items.length}</span>
           <span>Hệ thống tự động điền Tên Bài khi bạn nhập cột Tiết PPCT.</span>
        </div>
      </div>
    </div>
  );
};

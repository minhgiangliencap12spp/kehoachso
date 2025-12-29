import React from 'react';
import { ScheduleRow, DAYS_OF_WEEK } from '../types';
import { Pencil, Save, Trash2, Plus } from 'lucide-react';

interface ReportTableProps {
  items: ScheduleRow[];
  teacherName: string;
  onUpdateItem: (id: string, field: keyof ScheduleRow, value: any) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
}

export const ReportTable: React.FC<ReportTableProps> = ({ 
  items, 
  teacherName, 
  onUpdateItem, 
  onDeleteItem,
  onAddItem
}) => {
  // Sort items by Day index then Period
  const sortedItems = [...items].sort((a, b) => {
    const dayA = DAYS_OF_WEEK.indexOf(a.dayOfWeek);
    const dayB = DAYS_OF_WEEK.indexOf(b.dayOfWeek);
    if (dayA !== dayB) return dayA - dayB;
    return a.period - b.period;
  });

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-slate-200">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Lịch Báo Giảng: {teacherName}</h2>
          <p className="text-sm text-slate-500">Chỉnh sửa nội dung bài dạy trực tiếp vào bảng dưới đây</p>
        </div>
        <button
          onClick={onAddItem}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Thêm tiết
        </button>
      </div>

      {/* Print Header - Only visible when printing */}
      <div className="hidden print-only p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold uppercase">Lịch Báo Giảng</h1>
          <p className="text-lg">Giáo viên: {teacherName}</p>
          <p>Tuần: {items[0]?.week || 1}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 w-24">Thứ</th>
              <th className="px-4 py-3 w-16 text-center">Tiết</th>
              <th className="px-4 py-3 w-24">Lớp</th>
              <th className="px-4 py-3 w-32">Môn</th>
              <th className="px-4 py-3">Tên bài dạy / Nội dung</th>
              <th className="px-4 py-3 w-32">Ghi chú</th>
              <th className="px-4 py-3 w-16 text-center no-print">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedItems.length > 0 ? (
              sortedItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-2 font-medium text-slate-900">
                    <select 
                      value={item.dayOfWeek}
                      onChange={(e) => onUpdateItem(item.id, 'dayOfWeek', e.target.value)}
                      className="bg-transparent border-none focus:ring-0 p-0 w-full font-medium cursor-pointer"
                    >
                      {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input 
                      type="number" 
                      min="1" 
                      max="12"
                      value={item.period}
                      onChange={(e) => onUpdateItem(item.id, 'period', parseInt(e.target.value))}
                      className="w-full text-center bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded p-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="text" 
                      value={item.className}
                      onChange={(e) => onUpdateItem(item.id, 'className', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded p-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="text" 
                      value={item.subject}
                      onChange={(e) => onUpdateItem(item.id, 'subject', e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded p-1"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="relative">
                      <input 
                        type="text" 
                        value={item.lessonName}
                        placeholder="Nhập tên bài dạy..."
                        onChange={(e) => onUpdateItem(item.id, 'lessonName', e.target.value)}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none py-1 px-1 transition-colors"
                      />
                      <Pencil size={12} className="absolute right-0 top-2 text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                     <input 
                        type="text" 
                        value={item.notes || ''}
                        placeholder="..."
                        onChange={(e) => onUpdateItem(item.id, 'notes', e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded p-1 text-slate-500"
                      />
                  </td>
                  <td className="px-4 py-2 text-center no-print">
                    <button 
                      onClick={() => onDeleteItem(item.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Chưa có dữ liệu lịch dạy. Hãy tải lên thời khóa biểu hoặc thêm thủ công.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center print-only">
        <div className="w-1/2 text-center">
          <p className="font-semibold">Tổ trưởng chuyên môn</p>
          <p className="text-xs italic mt-16">(Ký và ghi rõ họ tên)</p>
        </div>
        <div className="w-1/2 text-center">
          <p className="font-semibold">Người báo giảng</p>
          <p className="text-xs italic mt-16">{teacherName}</p>
        </div>
      </div>
    </div>
  );
};
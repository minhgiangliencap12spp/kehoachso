import React, { useState } from 'react';
import { PPCTEntry } from '../types';
import { Check, Edit2, AlertCircle } from 'lucide-react';

interface PPCTPreviewProps {
  data: PPCTEntry[];
  onConfirm: (data: PPCTEntry[]) => void;
  onRetake: () => void;
}

export const PPCTPreview: React.FC<PPCTPreviewProps> = ({ data, onConfirm, onRetake }) => {
  const [entries, setEntries] = useState<PPCTEntry[]>(data);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (index: number, field: keyof PPCTEntry, value: string | number) => {
    const newEntries = [...entries];
    // @ts-ignore
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-full max-h-[600px]">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full border border-green-200">
              Đã tìm thấy {entries.length} bài
            </span>
            Xem trước Phân Phối Chương Trình
          </h3>
          <p className="text-xs text-slate-500 mt-1">Kiểm tra dữ liệu trước khi lên lịch.</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={onRetake}
            className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-200 transition-colors"
          >
            Tải file khác
          </button>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`text-sm px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors border ${isEditing ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
          >
            <Edit2 className="w-3 h-3" />
            {isEditing ? 'Dừng sửa' : 'Chỉnh sửa'}
          </button>
          <button 
            onClick={() => onConfirm(entries)}
            className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-md hover:bg-blue-700 flex items-center gap-2 shadow-sm"
          >
            <Check className="w-4 h-4" />
            Xác nhận & Dùng
          </button>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 font-medium text-slate-600 w-24 text-center border-b border-r border-slate-200">Tiết</th>
              <th className="p-3 font-medium text-slate-600 border-b border-slate-200">Tên Bài / Nội Dung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry, idx) => (
              <tr key={idx} className="hover:bg-blue-50/30">
                <td className="p-2 text-center border-r border-slate-100 font-mono text-slate-500">
                  {isEditing ? (
                    <input 
                      type="number" 
                      className="w-full text-center border border-slate-300 rounded px-1 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={entry.lessonNumber}
                      onChange={(e) => handleChange(idx, 'lessonNumber', parseInt(e.target.value))}
                    />
                  ) : entry.lessonNumber}
                </td>
                <td className="p-2 text-slate-800">
                  {isEditing ? (
                    <input 
                      type="text" 
                      className="w-full border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={entry.lessonName}
                      onChange={(e) => handleChange(idx, 'lessonName', e.target.value)}
                    />
                  ) : entry.lessonName}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={2} className="p-8 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8" />
                    <p>Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra file Excel.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

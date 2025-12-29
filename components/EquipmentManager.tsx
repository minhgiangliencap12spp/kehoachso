import React, { useState, useRef, useMemo, useEffect } from 'react';
import { EquipmentConfigEntry } from '../types';
import { importEquipmentConfigFromExcel } from '../services/excelService';
import { parseEquipmentConfigFromText } from '../services/geminiService';
import { Settings2, Upload, Bot, Loader2, Trash2, Filter, AlertCircle, Save, Microscope } from 'lucide-react';

interface Props {
  data: EquipmentConfigEntry[];
  onUpdate: (data: EquipmentConfigEntry[]) => void;
  availableSubjects: string[];
}

const EquipmentManager: React.FC<Props> = ({ data, onUpdate, availableSubjects }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>(availableSubjects[0] || '');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiText, setAiText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to sync selectedSubject when availableSubjects changes
  useEffect(() => {
    if (availableSubjects.length > 0) {
      if (!selectedSubject || !availableSubjects.includes(selectedSubject)) {
        setSelectedSubject(availableSubjects[0]);
      }
    } else {
      setSelectedSubject('');
    }
  }, [availableSubjects, selectedSubject]);

  // Filter data based on selected subject
  const filteredData = useMemo(() => {
    return data.filter(entry => entry.subject === selectedSubject);
  }, [data, selectedSubject]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedSubject) {
      alert("Vui lòng chọn môn học trước khi nhập.");
      return;
    }
    
    if (e.target.files && e.target.files[0]) {
      try {
        const newEntries = await importEquipmentConfigFromExcel(e.target.files[0], selectedSubject);
        
        // Remove old entries for this subject and add new ones
        const otherData = data.filter(d => d.subject !== selectedSubject);
        onUpdate([...otherData, ...newEntries]);
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        alert("Lỗi khi đọc file Excel. Đảm bảo file có cột: Số tiết, Tên thiết bị, Số lượng.");
      }
    }
  };

  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    if (!selectedSubject) {
      alert("Vui lòng chọn môn học trước khi nhập.");
      return;
    }

    setIsAiLoading(true);
    try {
      const parsedData = await parseEquipmentConfigFromText(aiText);
      const taggedData = parsedData.map(d => ({ ...d, subject: selectedSubject }));

      const otherData = data.filter(d => d.subject !== selectedSubject);
      onUpdate([...otherData, ...taggedData]);

      setShowAiInput(false);
      setAiText('');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const clearSubjectData = () => {
    if (confirm(`Bạn có chắc muốn xóa toàn bộ danh mục thiết bị của môn ${selectedSubject}?`)) {
      onUpdate(data.filter(d => d.subject !== selectedSubject));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-teal-100 p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-teal-600" />
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Cấu Hình Danh Mục Thiết Bị
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
             Khai báo thiết bị theo tiết dạy để tự động điền vào Phiếu Thiết Bị hàng tuần.
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 w-full md:w-auto min-w-[200px]">
           <label className="text-xs font-bold text-teal-700 uppercase tracking-wide">Môn học đang chọn</label>
           <div className="relative">
             <select
               value={selectedSubject}
               onChange={(e) => setSelectedSubject(e.target.value)}
               className="w-full p-2.5 pl-3 pr-10 bg-white border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none appearance-none font-bold text-slate-700 shadow-sm"
             >
                {availableSubjects.length === 0 && <option value="">Chưa cấu hình môn</option>}
                {availableSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
             </select>
             <Filter className="absolute right-3 top-3 w-4 h-4 text-teal-400 pointer-events-none" />
           </div>
        </div>

        <div className="flex gap-2 flex-wrap">
           <input 
             type="file" 
             accept=".xlsx,.xls" 
             className="hidden" 
             ref={fileInputRef}
             onChange={handleFileUpload}
           />
           <button 
             onClick={() => {
                if(!selectedSubject) return alert("Cần chọn môn trước.");
                fileInputRef.current?.click()
             }}
             className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-emerald-200"
             disabled={!selectedSubject}
           >
             <Upload className="w-4 h-4" />
             Nhập Excel
           </button>
           <button 
             onClick={() => {
               if(!selectedSubject) return alert("Cần chọn môn trước.");
               setShowAiInput(!showAiInput)
             }}
             className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-purple-200"
             disabled={!selectedSubject}
           >
             <Bot className="w-4 h-4" />
             Nhập bằng AI
           </button>
        </div>
        
        {filteredData.length > 0 && (
          <button 
             onClick={clearSubjectData}
             className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-white text-rose-500 border border-rose-200 hover:bg-rose-50 rounded-lg text-sm font-bold transition-colors"
           >
             <Trash2 className="w-4 h-4" />
             Xóa môn này
           </button>
        )}
      </div>

      {showAiInput && (
        <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200 shadow-inner animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between mb-2">
             <label className="block text-sm font-bold text-purple-900">
               Dán nội dung danh mục thiết bị cho môn: <span className="text-purple-600 underline">{selectedSubject}</span>
             </label>
             <button onClick={() => setShowAiInput(false)} className="text-purple-400 hover:text-purple-700 text-sm font-bold">Đóng</button>
          </div>
          <textarea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            className="w-full h-32 p-3 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none shadow-sm"
            placeholder={`Ví dụ:\nTiết 1: Tranh ảnh, 1 bộ\nTiết 2: Máy chiếu\n...`}
          />
          <div className="flex justify-end mt-2">
             <button 
               onClick={handleAiParse}
               disabled={isAiLoading || !aiText.trim()}
               className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-purple-700 transition"
             >
               {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
               Phân tích & Lưu
             </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="flex-1 overflow-auto custom-scrollbar border border-teal-200 rounded-lg relative bg-white">
        {!selectedSubject ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-teal-50/20">
               <AlertCircle className="w-10 h-10 mb-2 opacity-40 text-teal-400"/>
               <p>Vui lòng chọn môn học để xem danh mục thiết bị.</p>
             </div>
        ) : filteredData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Microscope className="w-12 h-12 mb-3 opacity-50 text-teal-400" />
            <p>Chưa có dữ liệu thiết bị cho môn <span className="font-bold text-teal-600">{selectedSubject}</span>.</p>
            <p className="text-sm mt-1">Hãy tải file Excel hoặc dùng AI để nhập.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="bg-teal-100/80 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 font-bold text-teal-800 w-24 border-b border-teal-200">Tiết PPCT</th>
                  <th className="px-4 py-3 font-bold text-teal-800 border-b border-teal-200">Tên Thiết Bị</th>
                   <th className="px-4 py-3 font-bold text-teal-800 border-b border-teal-200 w-32">Số Lượng</th>
                  <th className="px-4 py-3 font-bold text-teal-800 border-b border-teal-200 w-32 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-100">
                {filteredData.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-teal-50 transition-colors">
                    <td className="px-4 py-2 font-bold text-teal-600">{entry.lessonNumber}</td>
                    <td className="px-4 py-2 text-slate-800 font-medium">{entry.equipmentName}</td>
                     <td className="px-4 py-2 text-slate-600">{entry.quantity}</td>
                    <td className="px-4 py-2 text-right">
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                          <Save className="w-3 h-3"/> Đã lưu
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="sticky bottom-0 bg-white border-t border-teal-100 p-2 text-right text-xs text-teal-500 font-bold">
               Môn: {selectedSubject} • Tổng số: {filteredData.length} mục
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EquipmentManager;
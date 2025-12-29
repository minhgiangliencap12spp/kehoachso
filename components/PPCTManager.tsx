import React, { useState, useRef, useMemo, useEffect } from 'react';
import { PPCTEntry } from '../types';
import { importPPCTFromExcel } from '../services/excelService';
import { parsePPCTFromText } from '../services/geminiService';
import { SAMPLE_PPCT } from '../data/sampleData';
import { FileSpreadsheet, Upload, Bot, Loader2, Trash2, Filter, AlertCircle, Save, Database } from 'lucide-react';

interface Props {
  data: PPCTEntry[];
  onUpdate: (data: PPCTEntry[]) => void;
  availableSubjects: string[];
}

const PPCTManager: React.FC<Props> = ({ data, onUpdate, availableSubjects }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>(availableSubjects[0] || '');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiText, setAiText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to sync selectedSubject when availableSubjects changes (e.g. from Timetable import)
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
        const newEntries = await importPPCTFromExcel(e.target.files[0], selectedSubject);
        
        // Remove old entries for this subject and add new ones
        const otherData = data.filter(d => d.subject !== selectedSubject);
        onUpdate([...otherData, ...newEntries]);
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        alert("Lỗi khi đọc file Excel. Hãy đảm bảo file có cấu trúc đơn giản (Cột số tiết, Cột tên bài).");
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
      const parsedData = await parsePPCTFromText(aiText);
      // Map the subject to the parsed data
      const taggedData = parsedData.map(d => ({ ...d, subject: selectedSubject }));

      // Remove old entries for this subject and add new ones
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

  const handleLoadSample = () => {
    if (!selectedSubject) {
      alert("Vui lòng chọn môn học.");
      return;
    }

    // Check if we have sample data for this subject
    const samples = SAMPLE_PPCT.filter(s => s.subject === selectedSubject);

    if (samples.length === 0) {
      // If the selected subject isn't in samples, ask if they want to load ALL samples (Toan/Tin)
      if (confirm(`Chưa có mẫu cho môn "${selectedSubject}". Bạn có muốn nạp toàn bộ mẫu (Toán Đ/H, Tin 7/9) vào danh sách không?`)) {
         // Load all samples, merging with existing data (keeping existing non-sample data)
         // We filter out any existing data for the sample subjects to avoid duplicates if re-loading
         const sampleSubjects = ["Toán(Đ)", "Toán(H)", "Tin học 7", "Tin học 9"];
         const dataKeeping = data.filter(d => !sampleSubjects.includes(d.subject || ''));
         onUpdate([...dataKeeping, ...SAMPLE_PPCT]);
         alert("Đã nạp dữ liệu mẫu thành công!");
      }
      return;
    }

    if (confirm(`Bạn có muốn nạp ${samples.length} bài mẫu cho môn ${selectedSubject}? Dữ liệu cũ của môn này sẽ bị thay thế.`)) {
       const otherData = data.filter(d => d.subject !== selectedSubject);
       onUpdate([...otherData, ...samples]);
    }
  };

  const clearSubjectData = () => {
    if (confirm(`Bạn có chắc muốn xóa toàn bộ PPCT của môn ${selectedSubject}?`)) {
      onUpdate(data.filter(d => d.subject !== selectedSubject));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-orange-100 p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-orange-500" />
            <span className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
              Phân Phối Chương Trình (PPCT)
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Dữ liệu được lưu tự động. Chọn môn để xem hoặc cập nhật danh sách bài dạy.
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-200 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1 w-full md:w-auto min-w-[200px]">
           <label className="text-xs font-bold text-orange-700 uppercase tracking-wide">Môn học đang chọn</label>
           <div className="relative">
             <select
               value={selectedSubject}
               onChange={(e) => setSelectedSubject(e.target.value)}
               className="w-full p-2.5 pl-3 pr-10 bg-white border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none appearance-none font-bold text-slate-700 shadow-sm"
             >
                {availableSubjects.length === 0 && <option value="">Chưa cấu hình môn</option>}
                {availableSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
             </select>
             <Filter className="absolute right-3 top-3 w-4 h-4 text-orange-400 pointer-events-none" />
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
           <button 
             onClick={handleLoadSample}
             className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-bold transition-all shadow-md shadow-blue-200"
             title="Nạp dữ liệu mẫu cho môn hiện tại (hoặc tất cả các môn mẫu)"
           >
             <Database className="w-4 h-4" />
             Nạp dữ liệu mẫu
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
               Dán nội dung PPCT cho môn: <span className="text-purple-600 underline">{selectedSubject}</span>
             </label>
             <button onClick={() => setShowAiInput(false)} className="text-purple-400 hover:text-purple-700 text-sm font-bold">Đóng</button>
          </div>
          <textarea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            className="w-full h-32 p-3 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none shadow-sm"
            placeholder={`Ví dụ:\n1. Bài mở đầu\n2. Làm quen với...\n...`}
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
      <div className="flex-1 overflow-auto custom-scrollbar border border-orange-200 rounded-lg relative bg-white">
        {!selectedSubject ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-orange-50/20">
               <AlertCircle className="w-10 h-10 mb-2 opacity-40 text-orange-400"/>
               <p>Vui lòng chọn môn học để xem PPCT.</p>
             </div>
        ) : filteredData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <FileSpreadsheet className="w-12 h-12 mb-3 opacity-50 text-orange-400" />
            <p>Chưa có dữ liệu PPCT cho môn <span className="font-bold text-orange-600">{selectedSubject}</span>.</p>
            <p className="text-sm mt-1">Hãy tải file Excel, dùng AI, hoặc nhấn <span className="font-bold">"Nạp dữ liệu mẫu"</span>.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead className="bg-orange-100/80 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3 font-bold text-orange-800 w-24 border-b border-orange-200">Tiết số</th>
                  <th className="px-4 py-3 font-bold text-orange-800 border-b border-orange-200">Tên Bài</th>
                  <th className="px-4 py-3 font-bold text-orange-800 border-b border-orange-200 w-40 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {filteredData.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-orange-50 transition-colors">
                    <td className="px-4 py-2 font-bold text-orange-600">{entry.lessonNumber}</td>
                    <td className="px-4 py-2 text-slate-800 font-medium">{entry.lessonName}</td>
                    <td className="px-4 py-2 text-right">
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                          <Save className="w-3 h-3"/> Đã lưu
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="sticky bottom-0 bg-white border-t border-orange-100 p-2 text-right text-xs text-orange-400 font-bold">
               Môn: {selectedSubject} • Tổng số: {filteredData.length} bài
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PPCTManager;
import React, { useState, useEffect } from 'react';
import { ExamConfiguration } from '../types';
import { DEFAULT_CONFIG, SUBJECT_SUGGESTIONS } from '../constants';

interface ExamFormProps {
  onSubmit: (config: ExamConfiguration) => void;
  isLoading: boolean;
}

const ExamForm: React.FC<ExamFormProps> = ({ onSubmit, isLoading }) => {
  const [config, setConfig] = useState<ExamConfiguration>(DEFAULT_CONFIG);
  const [totalRatio, setTotalRatio] = useState(100);

  useEffect(() => {
    setTotalRatio(config.ratios.nb + config.ratios.th + config.ratios.vd + config.ratios.vdc);
  }, [config.ratios]);

  const handleChange = (field: keyof ExamConfiguration, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleRatioChange = (key: keyof typeof config.ratios, value: number) => {
    setConfig((prev) => ({
      ...prev,
      ratios: {
        ...prev.ratios,
        [key]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalRatio !== 100) {
      alert(`Tổng tỉ lệ phải là 100%. Hiện tại là ${totalRatio}%`);
      return;
    }
    onSubmit(config);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Thiết lập Đề kiểm tra
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Môn học</label>
          <input
            list="subjects"
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            value={config.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            placeholder="Ví dụ: Toán học"
          />
          <datalist id="subjects">
            {SUBJECT_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={config.grade}
            onChange={(e) => handleChange('grade', e.target.value)}
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={`${i + 1}`}>Lớp {i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề / Nội dung kiểm tra</label>
        <input
          type="text"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={config.topic}
          onChange={(e) => handleChange('topic', e.target.value)}
          placeholder="Ví dụ: Truyện Kiều, Vectơ, Thì hiện tại đơn..."
        />
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (phút)</label>
          <input
            type="number"
            min="15"
            max="180"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={config.duration}
            onChange={(e) => handleChange('duration', parseInt(e.target.value))}
          />
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số câu hỏi (ước tính)</label>
          <input
            type="number"
            min="1"
            max="100"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={config.questionCount}
            onChange={(e) => handleChange('questionCount', parseInt(e.target.value))}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ma trận nhận thức (%) - Tổng: <span className={`${totalRatio === 100 ? 'text-green-600' : 'text-red-600'} font-bold`}>{totalRatio}%</span>
        </label>
        <div className="grid grid-cols-4 gap-2 text-center text-xs text-gray-600 mb-1">
          <div>Nhận biết</div>
          <div>Thông hiểu</div>
          <div>Vận dụng</div>
          <div>Vận dụng cao</div>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min="0"
            max="100"
            className="w-full px-2 py-2 border border-blue-200 bg-blue-50 rounded text-center focus:ring-blue-500"
            value={config.ratios.nb}
            onChange={(e) => handleRatioChange('nb', parseInt(e.target.value) || 0)}
          />
          <input
            type="number"
            min="0"
            max="100"
            className="w-full px-2 py-2 border border-teal-200 bg-teal-50 rounded text-center focus:ring-teal-500"
            value={config.ratios.th}
            onChange={(e) => handleRatioChange('th', parseInt(e.target.value) || 0)}
          />
          <input
            type="number"
            min="0"
            max="100"
            className="w-full px-2 py-2 border border-orange-200 bg-orange-50 rounded text-center focus:ring-orange-500"
            value={config.ratios.vd}
            onChange={(e) => handleRatioChange('vd', parseInt(e.target.value) || 0)}
          />
          <input
            type="number"
            min="0"
            max="100"
            className="w-full px-2 py-2 border border-red-200 bg-red-50 rounded text-center focus:ring-red-500"
            value={config.ratios.vdc}
            onChange={(e) => handleRatioChange('vdc', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung chi tiết / Văn bản nguồn (Tùy chọn)</label>
        <textarea
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={config.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Dán văn bản đọc hiểu hoặc ghi chú cụ thể..."
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || totalRatio !== 100}
        className={`w-full py-3 px-4 rounded-lg text-white font-semibold shadow-md transition-all flex justify-center items-center gap-2
          ${isLoading || totalRatio !== 100 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5'}`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang tạo đề (30s-60s)...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Tạo Đề Ngay
          </>
        )}
      </button>
    </form>
  );
};

export default ExamForm;

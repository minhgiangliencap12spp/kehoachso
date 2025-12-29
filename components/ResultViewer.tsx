import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GeneratedExamData } from '../types';

interface ResultViewerProps {
  data: GeneratedExamData | null;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'spec' | 'exam' | 'key'>('exam');

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col items-center justify-center p-12 text-center text-gray-500">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-800">Chưa có dữ liệu</h3>
        <p className="mt-2 text-sm max-w-xs mx-auto">Vui lòng điền thông tin và nhấn "Tạo Đề Ngay" để AI sinh nội dung theo chuẩn 5512.</p>
      </div>
    );
  }

  const handleCopy = () => {
    let contentToCopy = "";
    switch (activeTab) {
      case 'matrix': contentToCopy = data.matrix; break;
      case 'spec': contentToCopy = data.specification; break;
      case 'exam': contentToCopy = data.examPaper; break;
      case 'key': contentToCopy = data.answerKey; break;
    }
    navigator.clipboard.writeText(contentToCopy);
    alert('Đã sao chép nội dung vào bộ nhớ tạm!');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-[800px] overflow-hidden">
      {/* Header Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex-1 py-4 px-6 text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'matrix' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          1. Ma trận
        </button>
        <button
          onClick={() => setActiveTab('spec')}
          className={`flex-1 py-4 px-6 text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'spec' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          2. Bản đặc tả
        </button>
        <button
          onClick={() => setActiveTab('exam')}
          className={`flex-1 py-4 px-6 text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'exam' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          3. Đề kiểm tra
        </button>
        <button
          onClick={() => setActiveTab('key')}
          className={`flex-1 py-4 px-6 text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'key' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          4. Đáp án
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-2 border-b border-gray-100 flex justify-end bg-white">
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Sao chép Markdown
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-white">
        <div className="markdown-body max-w-4xl mx-auto text-gray-800 leading-relaxed">
           <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {activeTab === 'matrix' ? data.matrix :
               activeTab === 'spec' ? data.specification :
               activeTab === 'exam' ? data.examPaper :
               data.answerKey}
            </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ResultViewer;

import React from 'react';

export const Loading: React.FC<{ text?: string }> = ({ text = "Đang tải..." }) => (
  <div className="flex flex-col items-center justify-center py-12 space-y-4">
    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    <p className="text-gray-500 font-medium">{text}</p>
  </div>
);
import React, { useState, useMemo } from 'react';
import { MathReviewTopic } from '../types';
import { Calculator, Plus, Trash2, Edit, Save, BookOpen, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  data: MathReviewTopic[];
  onUpdate: (data: MathReviewTopic[]) => void;
}

const GRADES = [6, 7, 8, 9];

const MathReviewManager: React.FC<Props> = ({ data, onUpdate }) => {
  const [selectedGrade, setSelectedGrade] = useState<number>(9);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<MathReviewTopic>>({});

  // Filter data by selected grade
  const filteredTopics = useMemo(() => {
    return data.filter(t => t.grade === selectedGrade).sort((a, b) => {
        // Simple sort by chapter then name
        const c1 = a.chapter || '';
        const c2 = b.chapter || '';
        if (c1 < c2) return -1;
        if (c1 > c2) return 1;
        return 0;
    });
  }, [data, selectedGrade]);

  const handleCreate = () => {
    const newTopic: MathReviewTopic = {
      id: crypto.randomUUID(),
      grade: selectedGrade,
      chapter: '',
      lessonName: 'Bài mới',
      theory: '',
      exercises: '',
      lastUpdated: new Date().toISOString()
    };
    onUpdate([...data, newTopic]);
    setEditingId(newTopic.id);
    setFormData(newTopic);
  };

  const handleEdit = (topic: MathReviewTopic) => {
    setEditingId(topic.id);
    setFormData({ ...topic });
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa chủ đề này?")) {
      onUpdate(data.filter(t => t.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setFormData({});
      }
    }
  };

  const handleSave = () => {
    if (!editingId) return;

    onUpdate(data.map(t => {
      if (t.id === editingId) {
        return {
          ...t,
          ...formData,
          lastUpdated: new Date().toISOString()
        } as MathReviewTopic;
      }
      return t;
    }));
    setEditingId(null);
    setFormData({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-indigo-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-indigo-600" />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Ôn tập Toán
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">Quản lý lý thuyết và bài tập trọng tâm theo Khối lớp.</p>
        </div>
      </div>

      {/* Grade Selector */}
      <div className="flex gap-2 mb-6 border-b border-slate-100 pb-4 overflow-x-auto">
        {GRADES.map(g => (
          <button
            key={g}
            onClick={() => { setSelectedGrade(g); setEditingId(null); }}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
              selectedGrade === g 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Khối {g}
          </button>
        ))}
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* List Side */}
        <div className="w-1/3 flex flex-col border-r border-slate-100 pr-4">
          <div className="flex justify-between items-center mb-3">
             <h3 className="font-bold text-slate-700">Danh sách bài</h3>
             <button 
               onClick={handleCreate}
               className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
               title="Thêm bài mới"
             >
               <Plus className="w-4 h-4" />
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
            {filteredTopics.length === 0 && (
               <div className="text-center text-slate-400 py-8 text-sm italic">
                 Chưa có bài nào cho Khối {selectedGrade}.
               </div>
            )}
            {filteredTopics.map(topic => (
              <div 
                key={topic.id}
                onClick={() => handleEdit(topic)}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm group ${
                  editingId === topic.id 
                  ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' 
                  : 'bg-white border-slate-200 hover:border-indigo-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{topic.chapter || 'Chưa có chương'}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(topic.id); }}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-2">{topic.lessonName}</h4>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                   <BookOpen className="w-3 h-3" /> 
                   {topic.theory ? 'Có lý thuyết' : 'Thiếu lý thuyết'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Side */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {editingId ? (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">
               <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Edit className="w-4 h-4 text-indigo-500" />
                    Chỉnh sửa nội dung
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCancel}
                      className="px-3 py-1.5 text-slate-500 hover:text-slate-700 font-medium text-sm hover:bg-slate-100 rounded"
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={handleSave}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded shadow-sm flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Lưu
                    </button>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Chương</label>
                      <input 
                        type="text"
                        className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.chapter || ''}
                        onChange={e => setFormData({...formData, chapter: e.target.value})}
                        placeholder="VD: Chương I"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Tên Bài</label>
                      <input 
                        type="text"
                        className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                        value={formData.lessonName || ''}
                        onChange={e => setFormData({...formData, lessonName: e.target.value})}
                        placeholder="VD: Căn bậc hai"
                      />
                    </div>
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                       <FileText className="w-3 h-3" /> Lý thuyết trọng tâm
                     </label>
                     <textarea 
                        className="w-full h-40 p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono bg-slate-50"
                        value={formData.theory || ''}
                        onChange={e => setFormData({...formData, theory: e.target.value})}
                        placeholder="Nhập các công thức, định lý quan trọng..."
                     />
                  </div>

                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                       <CheckCircle2 className="w-3 h-3" /> Bài tập tự luyện
                     </label>
                     <textarea 
                        className="w-full h-40 p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono bg-slate-50"
                        value={formData.exercises || ''}
                        onChange={e => setFormData({...formData, exercises: e.target.value})}
                        placeholder="Nhập danh sách bài tập..."
                     />
                  </div>
               </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                 <Calculator className="w-8 h-8 text-slate-300" />
               </div>
               <p className="text-sm">Chọn một bài từ danh sách để chỉnh sửa hoặc tạo mới.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MathReviewManager;
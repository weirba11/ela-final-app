
import React from 'react';
import { AVAILABLE_STANDARDS, CATEGORY_COLORS } from '../constants';
import { GenerationConfig, QuestionType, Question } from '../types';
import { BookOpen, Check, RefreshCw, FileText, AlertCircle, Layout, Type, Users, Settings, Plus, X, Trash2, Upload, ChevronDown, ChevronRight, FileSpreadsheet, AlignLeft, ListPlus, Link2 } from 'lucide-react';

interface SidebarProps {
  config: GenerationConfig;
  setConfig: React.Dispatch<React.SetStateAction<GenerationConfig>>;
  onGenerate: () => void;
  onAddToWorksheet: (extendLastPassage: boolean) => void;
  isGenerating: boolean;
  onAddQuestion: (q: Question) => void;
  onExportCSV: () => void;
  hasData: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ config, setConfig, onGenerate, onAddToWorksheet, isGenerating, onAddQuestion, onExportCSV, hasData }) => {

  // Custom Question Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [customQText, setCustomQText] = React.useState('');
  const [qType, setQType] = React.useState<'multiple-choice' | 'open-ended'>('multiple-choice');
  const [options, setOptions] = React.useState<string[]>(['', '', '', '']);
  const [correctIdx, setCorrectIdx] = React.useState(0);
  const [openEndedAnswer, setOpenEndedAnswer] = React.useState('');
  
  // New State for Standard Selection and Image Upload
  const [selectedStandard, setSelectedStandard] = React.useState<string>('Custom');
  const [uploadedImage, setUploadedImage] = React.useState<string | undefined>(undefined);
  
  // Expanded State for Subcategories
  const [expandedStandards, setExpandedStandards] = React.useState<string[]>([]);
  
  // State for Extend Passage
  const [extendLastPassage, setExtendLastPassage] = React.useState(false);

  const toggleStandard = (id: string) => {
    setConfig(prev => {
      const exists = prev.selectedStandards.includes(id);
      if (exists) {
        // Remove standard, its count, and its subcategories
        const newCounts = { ...prev.standardCounts };
        delete newCounts[id];
        const newSubs = { ...prev.selectedSubcategories };
        delete newSubs[id];
        return { 
            ...prev, 
            selectedStandards: prev.selectedStandards.filter(s => s !== id),
            standardCounts: newCounts,
            selectedSubcategories: newSubs
        };
      } else {
        // Add standard with default count of 5
        return { 
            ...prev, 
            selectedStandards: [...prev.selectedStandards, id],
            standardCounts: { ...prev.standardCounts, [id]: 5 }
        };
      }
    });
    
    // Auto-expand if adding
    if (!config.selectedStandards.includes(id)) {
        setExpandedStandards(prev => [...prev, id]);
    }
  };

  const toggleSubcategory = (stdId: string, sub: string) => {
      setConfig(prev => {
          const currentSubs = prev.selectedSubcategories[stdId] || [];
          let newSubs;
          if (currentSubs.includes(sub)) {
              newSubs = currentSubs.filter(s => s !== sub);
          } else {
              newSubs = [...currentSubs, sub];
          }
          return {
              ...prev,
              selectedSubcategories: {
                  ...prev.selectedSubcategories,
                  [stdId]: newSubs
              }
          };
      });
  };

  const updateStandardCount = (id: string, count: number) => {
      const validCount = Math.max(1, Math.min(50, count)); // Clamp between 1 and 50
      setConfig(prev => ({
          ...prev,
          standardCounts: { ...prev.standardCounts, [id]: validCount }
      }));
  };

  const selectAll = () => {
      const allIds = AVAILABLE_STANDARDS.map(s => s.id);
      const newCounts: Record<string, number> = {};
      allIds.forEach(id => newCounts[id] = 2); // Default 2 per standard if selecting all
      setConfig(prev => ({
          ...prev, 
          selectedStandards: allIds,
          standardCounts: newCounts
      }));
  }

  const deselectAll = () => {
      setConfig(prev => ({...prev, selectedStandards: [], standardCounts: {}, selectedSubcategories: {}}));
  }

  const toggleExpand = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedStandards(prev => 
         prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      );
  };

  const handleOpenModal = () => {
    setCustomQText('');
    setQType('multiple-choice');
    setOptions(['', '', '', '']);
    setCorrectIdx(0);
    setOpenEndedAnswer('');
    setSelectedStandard('Custom');
    setUploadedImage(undefined);
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const submitCustomQuestion = () => {
    if (!customQText.trim()) return;

    let finalOptions: string[] | undefined = undefined;
    let finalAnswer = openEndedAnswer;

    if (qType === 'multiple-choice') {
        finalOptions = options.filter(o => o.trim() !== '');
        if (finalOptions.length < 2) return; // Need at least 2 options for MC
        
        // Map correct index to the filtered array
        // We need to find the text of the selected correct index
        const correctText = options[correctIdx];
        if (!correctText.trim()) return; // Selected answer is empty
        
        finalAnswer = correctText;
    }

    const newQuestion: Question = {
        id: Date.now(),
        standardRef: selectedStandard,
        text: customQText,
        type: qType,
        options: finalOptions,
        correctAnswer: finalAnswer,
        visualInfo: uploadedImage ? { type: 'custom-image', imageUrl: uploadedImage } : undefined,
    };

    onAddQuestion(newQuestion);
    setIsModalOpen(false);
  };

  // Calculate total questions based on individual counts
  const totalQuestions = Object.values(config.standardCounts).reduce((sum: number, count: number) => sum + count, 0);

  return (
    <>
    <aside className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col h-full no-print shadow-lg z-10">
      <div className="p-5 border-b border-gray-100 bg-brand-50">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-brand-600 p-2 rounded-lg text-white">
            <BookOpen size={20} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Worksheet Gen</h1>
        </div>
        <p className="text-sm text-brand-700">Select standards and quantity.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        
        {/* Configuration Section */}
        <section className="space-y-5">
          
          {/* Title Config */}
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Type size={16} /> Title Settings
             </label>
             <div className="flex rounded-md shadow-sm mb-2">
                <button
                    onClick={() => setConfig(prev => ({...prev, titleMode: 'ai'}))}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-l-md border ${config.titleMode === 'ai' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >
                    AI Title
                </button>
                <button
                    onClick={() => setConfig(prev => ({...prev, titleMode: 'custom'}))}
                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-r-md border-t border-b border-r ${config.titleMode === 'custom' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >
                    Custom
                </button>
             </div>
             {config.titleMode === 'custom' && (
                 <input 
                    type="text"
                    placeholder="Enter worksheet title..."
                    value={config.customTitle}
                    onChange={(e) => setConfig(prev => ({...prev, customTitle: e.target.value}))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-brand-500 focus:border-brand-500"
                 />
             )}
          </div>

          {/* Student Names Config */}
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Users size={16} /> Student Names (Fiction Only)
             </label>
             <textarea
                placeholder="Enter names separated by commas. These will be used for Fiction stories or math problems."
                value={config.studentNames || ''}
                onChange={(e) => setConfig(prev => ({...prev, studentNames: e.target.value}))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs focus:ring-brand-500 focus:border-brand-500 min-h-[60px]"
             />
          </div>

          {/* Layout & Font Config */}
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Layout size={16} /> Layout & Font
             </label>
             <div className="flex gap-2 mb-3">
                 <button 
                    onClick={() => setConfig(prev => ({...prev, columns: 1}))}
                    className={`flex-1 py-2 text-xs font-medium rounded border ${config.columns === 1 ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-300 text-gray-600'}`}
                 >
                    1 Column
                 </button>
                 <button 
                    onClick={() => setConfig(prev => ({...prev, columns: 2}))}
                    className={`flex-1 py-2 text-xs font-medium rounded border ${config.columns === 2 ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-300 text-gray-600'}`}
                 >
                    2 Columns
                 </button>
             </div>

             <div className="flex gap-1 items-center bg-gray-50 p-2 rounded border border-gray-200">
                <Type size={14} className="text-gray-500 mr-2" />
                <span className="text-xs text-gray-600 mr-auto font-medium">Font Size:</span>
                <div className="flex rounded shadow-sm">
                   <button 
                      onClick={() => setConfig(prev => ({...prev, fontSize: 'small'}))}
                      className={`px-2 py-1 text-[10px] font-medium border rounded-l ${config.fontSize === 'small' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300'}`}
                   >
                     Sm
                   </button>
                   <button 
                      onClick={() => setConfig(prev => ({...prev, fontSize: 'medium'}))}
                      className={`px-2 py-1 text-[10px] font-medium border-t border-b ${config.fontSize === 'medium' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300'}`}
                   >
                     Md
                   </button>
                   <button 
                      onClick={() => setConfig(prev => ({...prev, fontSize: 'large'}))}
                      className={`px-2 py-1 text-[10px] font-medium border rounded-r ${config.fontSize === 'large' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300'}`}
                   >
                     Lg
                   </button>
                </div>
             </div>
          </div>

          {/* Passage Length Config */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
               <AlignLeft size={16} /> Passage Length
            </label>
            <div className="flex rounded-md shadow-sm">
               <button 
                  onClick={() => setConfig(prev => ({...prev, passageLength: 'short'}))}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium border rounded-l-md ${config.passageLength === 'short' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300'}`}
               >
                 Short
               </button>
               <button 
                  onClick={() => setConfig(prev => ({...prev, passageLength: 'medium'}))}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium border-t border-b ${config.passageLength === 'medium' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300'}`}
               >
                 Medium
               </button>
               <button 
                  onClick={() => setConfig(prev => ({...prev, passageLength: 'long'}))}
                  className={`flex-1 px-2 py-1.5 text-xs font-medium border rounded-r-md ${config.passageLength === 'long' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300'}`}
               >
                 Long
               </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 italic text-right">
                {config.passageLength === 'short' ? '~100-150 words' : config.passageLength === 'medium' ? '~200-300 words' : '~350-500 words'}
            </p>
          </div>

          {/* Header Options */}
          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Settings size={16} /> Page Options
             </label>
             <div className="space-y-2 ml-1">
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={config.includeName} 
                        onChange={(e) => setConfig(prev => ({...prev, includeName: e.target.checked}))}
                        className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                    />
                    Include Name Line
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={config.includeClass} 
                        onChange={(e) => setConfig(prev => ({...prev, includeClass: e.target.checked}))}
                        className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                    />
                    Include Class Line
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={config.includeDate} 
                        onChange={(e) => setConfig(prev => ({...prev, includeDate: e.target.checked}))}
                        className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                    />
                    Include Date Line
                </label>
             </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Question Type</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(QuestionType).map((type) => (
                <button
                  key={type}
                  onClick={() => setConfig(prev => ({ ...prev, questionType: type }))}
                  className={`px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
                    config.questionType === type
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

           <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="answerKey"
              checked={config.includeAnswerKey}
              onChange={(e) => setConfig(prev => ({ ...prev, includeAnswerKey: e.target.checked }))}
              className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
            />
            <label htmlFor="answerKey" className="text-sm text-gray-700 select-none cursor-pointer">
              Generate Answer Key
            </label>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Standards Selection */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Common Core Standards</h3>
            <div className="flex gap-2">
                <button onClick={selectAll} className="text-xs text-brand-600 hover:text-brand-800 font-medium">All (2 each)</button>
                <span className="text-gray-300">|</span>
                <button onClick={deselectAll} className="text-xs text-gray-500 hover:text-gray-700 font-medium">None</button>
            </div>
          </div>
          
          <div className="space-y-2">
            {AVAILABLE_STANDARDS.map((std) => {
              const isSelected = config.selectedStandards.includes(std.id);
              const count = config.standardCounts[std.id] || 0;
              const hasSubcategories = std.subcategories && std.subcategories.length > 0;
              const isExpanded = expandedStandards.includes(std.id);
              const selectedSubs = config.selectedSubcategories[std.id] || [];
              
              return (
                <div 
                  key={std.id}
                  className={`
                    relative rounded-lg border transition-all duration-200
                    ${isSelected 
                      ? 'border-brand-500 bg-brand-50 shadow-sm' 
                      : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="p-3 cursor-pointer" onClick={() => toggleStandard(std.id)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${CATEGORY_COLORS[std.category] || 'bg-gray-100 text-gray-600'}`}>
                            {std.code}
                          </span>
                          {hasSubcategories && isSelected && (
                              <button 
                                onClick={(e) => toggleExpand(std.id, e)} 
                                className="text-brand-600 hover:text-brand-800 p-1 rounded hover:bg-brand-100 transition-colors"
                              >
                                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 font-medium leading-snug">{std.description}</p>
                      </div>
                      
                      <div className={`
                        w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors
                        ${isSelected
                          ? 'bg-brand-600 border-brand-600'
                          : 'bg-white border-gray-300'
                        }
                      `}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quantity Input & Subcategories */}
                  {isSelected && (
                      <div className="px-3 pb-3 pt-0 border-t border-brand-100/50 mt-1">
                          {/* Subcategories */}
                          {hasSubcategories && isExpanded && (
                              <div className="mb-3 mt-2 pl-1 space-y-1.5 border-l-2 border-brand-200 ml-1">
                                  <div className="text-[10px] text-brand-600 font-bold uppercase px-2 mb-1">Subcategories:</div>
                                  {std.subcategories?.map(sub => (
                                      <label key={sub} className="flex items-center gap-2 px-2 cursor-pointer hover:bg-brand-100/50 rounded py-0.5">
                                          <input 
                                              type="checkbox" 
                                              checked={selectedSubs.includes(sub)}
                                              onChange={() => toggleSubcategory(std.id, sub)}
                                              className="w-3.5 h-3.5 text-brand-600 border-brand-300 rounded focus:ring-brand-500"
                                          />
                                          <span className="text-xs text-gray-700">{sub}</span>
                                      </label>
                                  ))}
                              </div>
                          )}

                          <div className="flex items-center justify-end gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                              <label className="text-[10px] uppercase font-bold text-brand-700">Qty:</label>
                              <div className="flex items-center bg-white rounded border border-brand-300">
                                  <input 
                                    type="number" 
                                    min="1" 
                                    max="50"
                                    value={count}
                                    onChange={(e) => updateStandardCount(std.id, parseInt(e.target.value) || 1)}
                                    className="w-12 text-center text-sm py-1 outline-none text-gray-800 font-medium"
                                  />
                              </div>
                          </div>
                      </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Footer Action */}
      <div className="p-5 border-t border-gray-200 bg-gray-50 flex flex-col gap-3">
        
        {/* Top Row: Add Custom / Export */}
        <div className="flex gap-2">
            <button
                onClick={handleOpenModal}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border-2 border-dashed border-brand-300 text-brand-700 font-semibold hover:bg-brand-50 hover:border-brand-400 transition-all text-xs"
            >
                <Plus size={16} />
                <span>Custom Q</span>
            </button>

            {hasData && (
                <button
                    onClick={onExportCSV}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-green-200 bg-green-50 text-green-700 font-semibold hover:bg-green-100 hover:border-green-300 transition-all text-xs"
                >
                    <FileSpreadsheet size={16} />
                    <span>CSV</span>
                </button>
            )}
        </div>

        <hr className="border-gray-200" />
        
        {/* Bottom Row: Generation Actions */}
        <div className="flex flex-col gap-2">
            {/* Add To Worksheet (Append) */}
            {hasData && (
                <div className="flex flex-col gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                     {/* Extend Last Passage Option */}
                    <label className="flex items-center gap-2 px-1 cursor-pointer select-none">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${extendLastPassage ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                             {extendLastPassage && <Check size={10} className="text-white" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={extendLastPassage} onChange={(e) => setExtendLastPassage(e.target.checked)} />
                        <span className="text-[10px] font-semibold text-blue-800 flex items-center gap-1">
                            <Link2 size={10} /> Extend Previous Passage?
                        </span>
                    </label>

                    <button
                        onClick={() => onAddToWorksheet(extendLastPassage)}
                        disabled={isGenerating || config.selectedStandards.length === 0}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded bg-blue-600 text-white hover:bg-blue-700 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs shadow-sm"
                    >
                         {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <ListPlus size={16} />}
                         <span>Append ({totalQuestions} Qs)</span>
                    </button>
                </div>
            )}

            {/* Generate New (Replace) */}
            <button
              onClick={onGenerate}
              disabled={isGenerating || config.selectedStandards.length === 0}
              className={`
                w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-semibold shadow-md transition-all
                ${isGenerating 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : config.selectedStandards.length === 0 
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-brand-600 hover:bg-brand-700 hover:shadow-lg active:transform active:scale-95'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FileText size={18} />
                  <span>{hasData ? "Generate NEW PDF" : "Generate PDF"} ({totalQuestions} Qs)</span>
                </>
              )}
            </button>
        </div>

        {config.selectedStandards.length === 0 && (
            <p className="text-center text-xs text-red-500 mt-0 flex items-center justify-center gap-1">
                <AlertCircle size={12} /> Select at least one standard
            </p>
        )}
      </div>
    </aside>

    {/* Custom Question Modal */}
    {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-all animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Plus size={20} className="text-brand-600"/> 
                        Add Custom Question
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                    {/* Standard Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Select Standard</label>
                        <select 
                            value={selectedStandard}
                            onChange={(e) => setSelectedStandard(e.target.value)}
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white"
                        >
                            <option value="Custom">Custom / None</option>
                            {AVAILABLE_STANDARDS.map(std => (
                                <option key={std.id} value={std.id}>{std.code} - {std.description}</option>
                            ))}
                        </select>
                    </div>

                    {/* Question Text */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Question Text</label>
                        <textarea 
                            value={customQText}
                            onChange={e => setCustomQText(e.target.value)}
                            className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 min-h-[80px]"
                            placeholder="Enter your question here..."
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Image (Optional)</label>
                        <div className="flex items-center gap-2">
                            <label className="flex-1 cursor-pointer border border-gray-300 bg-white rounded-lg p-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
                                <Upload size={16} />
                                <span>{uploadedImage ? "Change Image" : "Choose File"}</span>
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                            {uploadedImage && (
                                <button onClick={() => setUploadedImage(undefined)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                        {uploadedImage && (
                            <div className="mt-2 border rounded p-1 bg-gray-50">
                                <img src={uploadedImage} alt="Preview" className="h-20 object-contain mx-auto" />
                            </div>
                        )}
                    </div>

                    {/* Type Selection */}
                    <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-2">Question Type</label>
                         <div className="flex gap-2">
                            <button 
                                onClick={() => setQType('multiple-choice')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${qType === 'multiple-choice' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                Multiple Choice
                            </button>
                            <button 
                                onClick={() => setQType('open-ended')}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${qType === 'open-ended' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                Open Ended
                            </button>
                         </div>
                    </div>

                    {/* Options / Answer */}
                    {qType === 'multiple-choice' ? (
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Answer Choices</label>
                            <p className="text-xs text-gray-500 mb-2">Select the circle to mark the correct answer.</p>
                            {options.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setCorrectIdx(idx)}
                                        className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${correctIdx === idx ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-300'}`}
                                        title="Mark as correct answer"
                                    >
                                        {correctIdx === idx && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                                    </button>
                                    <input 
                                        type="text" 
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...options];
                                            newOpts[idx] = e.target.value;
                                            setOptions(newOpts);
                                        }}
                                        className="flex-1 border rounded-md px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                                        placeholder={`Option ${String.fromCharCode(65+idx)}`}
                                    />
                                    {options.length > 2 && (
                                        <button 
                                            onClick={() => {
                                                const newOpts = options.filter((_, i) => i !== idx);
                                                setOptions(newOpts);
                                                if (correctIdx === idx) setCorrectIdx(0);
                                                else if (correctIdx > idx) setCorrectIdx(correctIdx - 1);
                                            }} 
                                            className="text-gray-400 hover:text-red-500 p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {options.length < 6 && (
                                <button 
                                    onClick={() => setOptions([...options, ''])}
                                    className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1 mt-2"
                                >
                                    <Plus size={14} /> Add Option
                                </button>
                            )}
                        </div>
                    ) : (
                        <div>
                             <label className="block text-sm font-semibold text-gray-700 mb-1">Correct Answer (for Answer Key)</label>
                             <input 
                                type="text"
                                value={openEndedAnswer}
                                onChange={e => setOpenEndedAnswer(e.target.value)}
                                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                placeholder="Enter the expected answer..."
                             />
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-2">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={submitCustomQuestion}
                        disabled={!customQText.trim() || (qType === 'multiple-choice' && options.filter(o=>o.trim()).length < 2)}
                        className="px-6 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        Add Question
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};
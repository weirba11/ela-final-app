

import React, { useState } from 'react';
import { WorksheetData, GenerationConfig, Question, VisualData } from '../types';
import { Printer, RefreshCw, Download, ArrowUp, ArrowDown, BookOpen, Image, Upload, Sparkles, X, Check, Trash2 } from 'lucide-react';
import { VisualRenderer } from './VisualRenderer';
import { EditableField } from './EditableField';
import html2canvas from 'html2canvas';

interface WorksheetProps {
  data: WorksheetData | null;
  config: GenerationConfig;
  onRegenerateQuestion?: (index: number) => void;
  onRegeneratePassage?: (index: number) => void;
  onUpdateSpacing?: (index: number, newSpace: number) => void;
  onUpdateVisual?: (index: number, type: 'upload' | 'ai', fileOrPrompt: string | File) => void;
  onUpdateQuestionData?: (index: number, q: Question) => void;
  onUpdatePassageData?: (index: number, visualInfo: Partial<VisualData>) => void;
  onDeleteQuestion?: (index: number) => void;
  onDeletePassage?: (index: number) => void;
  isGeneratingImage?: boolean;
}

const formatText = (text: string) => {
    return <span dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br/>') }} />;
};

export const Worksheet: React.FC<WorksheetProps> = ({ 
    data, 
    config, 
    onRegenerateQuestion, 
    onRegeneratePassage, 
    onUpdateSpacing,
    onUpdateVisual,
    onUpdateQuestionData,
    onUpdatePassageData,
    onDeleteQuestion,
    onDeletePassage,
    isGeneratingImage
}) => {
  
  // State to track which passage is currently showing the "Add Illustration" options
  const [activeIllustrationMenu, setActiveIllustrationMenu] = useState<number | null>(null);
  
  // AI Generation Form State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isPrinterFriendly, setIsPrinterFriendly] = useState(true);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-10 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 no-print">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Printer size={32} className="text-gray-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-600">Ready to Create</h3>
        <p className="text-center text-sm mt-2 max-w-xs">
          Select ELA standards (Reading or Language) and click "Generate PDF".
        </p>
      </div>
    );
  }

  const hasHeader = config.includeName || config.includeClass || config.includeDate;

  const getFontClasses = () => {
      switch(config.fontSize) {
          case 'small': return { text: 'text-xs', option: 'text-xs', num: 'text-xs' };
          case 'large': return { text: 'text-lg', option: 'text-base', num: 'text-base' };
          default: return { text: 'text-sm', option: 'text-sm', num: 'text-sm' }; // medium
      }
  };
  const fonts = getFontClasses();

  const handlePrint = () => {
    window.print();
  };

  const handleSaveQuestion = async (index: number) => {
    const element = document.getElementById(`question-container-${index}`);
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2, logging: false, useCORS: true });
      const link = document.createElement('a');
      link.download = `question-${index + 1}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    } catch (error) { console.error(error); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      if (e.target.files && e.target.files[0] && onUpdateVisual) {
          onUpdateVisual(index, 'upload', e.target.files[0]);
          setActiveIllustrationMenu(null);
      }
  };

  const openIllustrationMenu = (index: number, passageTitle?: string, passageContent?: string) => {
      if (activeIllustrationMenu === index) {
          setActiveIllustrationMenu(null);
          return;
      }

      // Initialize Prompt
      let initialPrompt = `An illustration for a story titled "${passageTitle || 'The Story'}".`;
      if (passageContent) {
          const match = passageContent.match(/\[Illustration: (.*?)\]/i);
          if (match && match[1]) {
              initialPrompt = match[1];
          } else if (passageTitle) {
               initialPrompt = `A scene showing ${passageTitle}`;
          }
      }

      setAiPrompt(initialPrompt);
      setIsPrinterFriendly(true); // Default to printer friendly
      setActiveIllustrationMenu(index);
  };

  const handleAiGeneration = (index: number) => {
      if (!onUpdateVisual) return;
      
      let finalPrompt = aiPrompt;
      if (isPrinterFriendly) {
          finalPrompt += ", black and white line art, coloring book style, high contrast, white background, no shading, clean outlines";
      } else {
          finalPrompt += ", vibrant colors, detailed illustration";
      }
      
      onUpdateVisual(index, 'ai', finalPrompt);
      setActiveIllustrationMenu(null);
  };

  return (
    <div className="relative w-full h-full overflow-auto bg-gray-100 p-4 md:p-8 print:p-0 print:bg-white print:overflow-visible custom-scrollbar">
      <button 
        onClick={handlePrint}
        className={`fixed bottom-8 right-8 z-50 text-white p-4 rounded-full shadow-xl no-print flex items-center gap-2 transition-all active:scale-95 bg-brand-600 hover:bg-brand-700`}
      >
        <Printer size={24} />
        <span className="font-semibold pr-1">Print / Save PDF</span>
      </button>

      <div 
        id="worksheet-container" 
        className="mx-auto bg-white shadow-2xl print:shadow-none w-[8.5in] min-h-[11in] p-[0.5in] print:w-full print:max-w-none print:mx-0 print:p-0 relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none z-0 no-print" aria-hidden="true">
            <div className="absolute top-2 -right-32 w-28 text-xs text-red-500 italic opacity-70">&larr; Page bottom (11")</div>
            <div className="w-full h-full opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent calc(11in - 1px), #ef4444 calc(11in - 1px), #ef4444 11in)' }} />
        </div>

        {/* Background Image Layer */}
        {config.backgroundImage && (
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none print:fixed print:inset-0 print:h-full print:w-full">
                <img 
                    src={config.backgroundImage} 
                    className="w-full h-full object-cover"
                    style={{ opacity: config.backgroundOpacity ?? 0.15 }}
                    alt=""
                />
            </div>
        )}

        <div className="relative z-10">
            <header className="mb-4 border-b-2 border-black pb-1">
            {hasHeader && (
                <div className="flex items-end gap-4 mb-2 text-sm font-serif w-full">
                    {config.includeName && (<div className="flex-grow flex items-baseline gap-1"><span className="font-bold whitespace-nowrap">Name:</span><div className="flex-1 border-b border-gray-400 h-4"></div></div>)}
                    {config.includeClass && (<div className="w-32 flex-shrink-0 flex items-baseline gap-1"><span className="font-bold whitespace-nowrap">Class:</span><div className="flex-1 border-b border-gray-400 h-4"></div></div>)}
                    {config.includeDate && (<div className="w-32 flex-shrink-0 flex items-baseline gap-1"><span className="font-bold whitespace-nowrap">Date:</span><div className="flex-1 border-b border-gray-400 h-4"></div></div>)}
                </div>
            )}
            <div className="text-center group/title relative">
                <EditableField value={data.title} onSave={(val) => { /* Title updates usually in config, but could be local */ }}>
                    <h1 className="font-serif text-lg font-bold text-black uppercase tracking-wider mb-0 leading-tight">{data.title}</h1>
                </EditableField>
                <p className="font-serif italic text-gray-600 text-[10px] mt-0">{data.instructions}</p>
            </div>
            </header>

            <div className={`${config.columns === 2 ? 'grid grid-cols-2 gap-x-8 gap-y-4' : 'space-y-4'}`}>
            {data.questions.map((q, index) => {
                // Check if previous question had the SAME passage to avoid repetition
                const prevQ = data.questions[index - 1];
                const currentPassage = q.visualInfo?.passageContent;
                const prevPassage = prevQ?.visualInfo?.passageContent;
                
                // Show passage if it exists AND (it's the first question OR it's different from the previous one)
                // This groups questions under a single passage block
                const showPassage = currentPassage && (index === 0 || currentPassage !== prevPassage);

                return (
                <div key={q.id} className="print-break-inside-avoid relative group break-inside-avoid mb-2">
                    {/* Render Passage Only Once for a Group */}
                    {showPassage && (
                        <div className="mb-4 break-inside-avoid relative group/passage border border-dashed border-gray-300 p-2 rounded bg-gray-50/50 hover:bg-white hover:border-gray-400 transition-colors">
                             <div className="flex items-center justify-between mb-1 relative">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reading Passage</div>
                                <div className="flex gap-2">
                                    {/* Add Illustration Button */}
                                    <div className="relative">
                                        <button 
                                            onClick={() => openIllustrationMenu(index, q.visualInfo?.passageTitle, q.visualInfo?.passageContent)}
                                            className={`text-[10px] px-3 py-1 rounded shadow-sm border flex items-center gap-1.5 no-print transition-all font-medium ${activeIllustrationMenu === index ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white text-indigo-600 border-gray-200 hover:bg-indigo-50'}`}
                                        >
                                            <Image size={12} /> Add Illustration
                                        </button>
                                        
                                        {activeIllustrationMenu === index && (
                                            <div className="absolute right-0 top-full mt-1 bg-white shadow-xl rounded-lg border border-gray-200 z-50 flex flex-col w-72 overflow-hidden no-print animate-in fade-in slide-in-from-top-2 p-3 gap-3">
                                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                                    <span className="text-xs font-bold text-gray-700">Add Visual</span>
                                                    <button onClick={() => setActiveIllustrationMenu(null)} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>
                                                </div>

                                                {/* Upload Section */}
                                                <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer text-xs text-gray-700 transition-colors">
                                                    <Upload size={14} className="text-gray-400"/>
                                                    <span>Upload from Computer</span>
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, index)} />
                                                </label>
                                                
                                                <div className="flex items-center gap-2">
                                                    <div className="h-px bg-gray-100 flex-1"></div>
                                                    <span className="text-[10px] text-gray-400 uppercase">OR Generate AI</span>
                                                    <div className="h-px bg-gray-100 flex-1"></div>
                                                </div>

                                                {/* AI Prompt Section */}
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Image Description</label>
                                                    <textarea 
                                                        className="w-full text-xs border border-gray-300 rounded p-2 h-20 resize-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                                                        value={aiPrompt}
                                                        onChange={(e) => setAiPrompt(e.target.value)}
                                                        placeholder="Describe what you want to see..."
                                                    />
                                                    
                                                    <label className="flex items-center gap-2 cursor-pointer select-none bg-gray-50 p-2 rounded border border-gray-100 hover:bg-gray-100 transition-colors">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isPrinterFriendly ? 'bg-brand-600 border-brand-600' : 'bg-white border-gray-300'}`}>
                                                            {isPrinterFriendly && <Check size={10} className="text-white" />}
                                                        </div>
                                                        <input 
                                                            type="checkbox" 
                                                            className="hidden" 
                                                            checked={isPrinterFriendly} 
                                                            onChange={(e) => setIsPrinterFriendly(e.target.checked)} 
                                                        />
                                                        <span className="text-xs text-gray-700 font-medium">Printer Friendly (Line Art)</span>
                                                    </label>

                                                    <button 
                                                        onClick={() => handleAiGeneration(index)}
                                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 text-xs font-semibold shadow-sm transition-all"
                                                    >
                                                        <Sparkles size={14} />
                                                        <span>Generate Image</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {/* Overlay to close menu */}
                                        {activeIllustrationMenu === index && (
                                            <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setActiveIllustrationMenu(null)}></div>
                                        )}
                                    </div>

                                    {onRegeneratePassage && (
                                        <button 
                                            onClick={() => onRegeneratePassage(index)}
                                            className="text-[10px] bg-brand-600 text-white px-3 py-1 rounded shadow-sm hover:bg-brand-700 flex items-center gap-1.5 no-print transition-all font-medium"
                                            title="Generate a whole new passage and set of questions"
                                        >
                                            <RefreshCw size={12} /> New Passage
                                        </button>
                                    )}

                                    {onDeletePassage && (
                                        <button 
                                            onClick={() => onDeletePassage(index)}
                                            className="text-[10px] bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded shadow-sm hover:bg-red-200 flex items-center gap-1.5 no-print transition-all font-medium"
                                            title="Delete this entire passage and its questions"
                                        >
                                            <Trash2 size={12} /> Delete Passage
                                        </button>
                                    )}
                                </div>
                             </div>
                             
                             {/* Loading Indicator for AI Image */}
                             {isGeneratingImage && activeIllustrationMenu === null && (
                                 <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm rounded">
                                     <div className="flex flex-col items-center gap-2 text-brand-600 animate-pulse">
                                         <Sparkles size={24} />
                                         <span className="text-xs font-semibold">Creating Illustration...</span>
                                     </div>
                                 </div>
                             )}

                            <VisualRenderer 
                                data={q.visualInfo} 
                                onUpdatePassage={onUpdatePassageData ? (newData) => onUpdatePassageData(index, newData) : undefined} 
                            />
                            <hr className="border-gray-200 mt-2" />
                        </div>
                    )}

                    <div className="flex gap-2" style={{ marginBottom: `${q.extraSpace || 0}px` }}>
                        <div className="flex flex-col items-center w-6 flex-shrink-0 gap-1 pt-0.5">
                            <span className={`font-bold font-sans text-gray-800 ${fonts.num}`}>{index + 1}.</span>
                            
                            <div className="flex flex-col gap-1 no-print" data-html2canvas-ignore="true">
                                <button onClick={() => onRegenerateQuestion && onRegenerateQuestion(index)} className="p-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-full" title="Regenerate Question (Keep Passage)"><RefreshCw size={14} /></button>
                                <button onClick={() => handleSaveQuestion(index)} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full" title="Save JPG"><Download size={14} /></button>
                                {onDeleteQuestion && (
                                    <button onClick={() => onDeleteQuestion(index)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full" title="Delete Question"><Trash2 size={14} /></button>
                                )}
                                {onUpdateSpacing && (
                                    <>
                                    <button onClick={() => onUpdateSpacing(index, (q.extraSpace || 0) + 10)} className="p-1 text-gray-400 hover:text-blue-600"><ArrowDown size={14} /></button>
                                    {(q.extraSpace || 0) > 0 && <button onClick={() => onUpdateSpacing(index, Math.max(0, (q.extraSpace || 0) - 10))} className="p-1 text-gray-400 hover:text-blue-600"><ArrowUp size={14} /></button>}
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div id={`question-container-${index}`} className="flex-1 p-1 -m-1 rounded">
                            <div className={`${fonts.text} font-serif text-black leading-snug mb-1`}>
                                <EditableField 
                                    value={q.text} 
                                    onSave={(val) => onUpdateQuestionData && onUpdateQuestionData(index, { ...q, text: val })}
                                    multiline
                                >
                                    <p>{formatText(q.text)}</p>
                                </EditableField>
                            </div>
                            
                            {/* Render other visuals (like editing task) but skip passage as it is handled above */}
                            {q.visualInfo?.type !== 'text-passage' && (
                                <VisualRenderer 
                                    data={q.visualInfo} 
                                    onUpdatePassage={onUpdateQuestionData ? (newData) => onUpdateQuestionData(index, { ...q, visualInfo: { ...q.visualInfo!, ...newData } }) : undefined}
                                />
                            )}

                            {q.type === 'multiple-choice' && q.options ? (
                                <div className={`grid ${config.columns === 2 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-y-0.5 gap-x-4 ml-1 mt-1`}>
                                {q.options.map((option, i) => (
                                    <div key={i} className="flex items-baseline gap-1">
                                        <span className={`font-bold font-sans ${fonts.option}`}>{String.fromCharCode(65 + i)}.</span>
                                        <div className={`font-serif ${fonts.option} flex-1`}>
                                            <EditableField 
                                                value={option} 
                                                onSave={(val) => {
                                                    const newOpts = [...(q.options || [])];
                                                    newOpts[i] = val;
                                                    if(onUpdateQuestionData) onUpdateQuestionData(index, { ...q, options: newOpts });
                                                }}
                                            >
                                                <span>{formatText(option)}</span>
                                            </EditableField>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <div className="mt-8 border-b border-gray-200"></div>
                            )}
                        </div>
                    </div>
                </div>
            )})}
            </div>

            <div className="mt-4 pt-2 border-t border-gray-300 flex justify-between items-center text-[9px] text-gray-400 font-sans print:hidden">
                <span>educationalresource.org</span>
                <span>{new Date().getFullYear()} • Teacher Resource</span>
            </div>
            <div className="hidden print:flex fixed bottom-0 left-0 w-full justify-between items-end pb-1 text-[9px] text-gray-400 font-sans bg-white border-t border-gray-300">
                <span>educationalresource.org</span>
                <span>{new Date().getFullYear()} • Teacher Resource</span>
            </div>
        </div>
      </div>

      {config.includeAnswerKey && (
        <div className="mx-auto bg-white shadow-2xl print:shadow-none w-[8.5in] min-h-[11in] p-[0.5in] mt-8 print:mt-0 print:w-full print:max-w-none print:mx-0 print-break-before break-before-page print:p-0 relative overflow-hidden">
             
             {/* Background Image Layer for Key */}
             {config.backgroundImage && (
                <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none print:fixed print:inset-0 print:h-full print:w-full">
                    <img 
                        src={config.backgroundImage} 
                        className="w-full h-full object-cover"
                        style={{ opacity: config.backgroundOpacity ?? 0.15 }}
                        alt=""
                    />
                </div>
            )}

             <header className="mb-4 border-b-2 border-black pb-1 relative z-10">
                <h1 className="font-serif text-lg font-bold text-black text-center uppercase tracking-wider">Answer Key</h1>
             </header>
             <div className="grid grid-cols-2 gap-x-8 gap-y-1 relative z-10">
                {data.questions.map((q, index) => {
                    let displayAnswer = q.correctAnswer;
                    if (q.type === 'multiple-choice' && q.options) {
                        const matchIndex = q.options.findIndex(opt => opt.trim() === q.correctAnswer.trim());
                        if (matchIndex !== -1) displayAnswer = `${String.fromCharCode(65 + matchIndex)}. ${q.correctAnswer}`;
                    }
                    return (
                        <div key={q.id} className="flex gap-2 border-b border-gray-100 pb-0.5 print-break-inside-avoid break-inside-avoid group/key">
                            <span className="font-bold w-6 text-xs">{index + 1}.</span>
                            <div className="flex-1 flex justify-between items-baseline">
                                <EditableField 
                                    value={q.correctAnswer} 
                                    onSave={(val) => onUpdateQuestionData && onUpdateQuestionData(index, { ...q, correctAnswer: val })}
                                >
                                    <span className="font-semibold text-xs">{formatText(displayAnswer)}</span>
                                </EditableField>
                                <span className="text-[9px] text-gray-400">{q.standardRef}</span>
                            </div>
                        </div>
                    );
                })}
             </div>
        </div>
      )}
    </div>
  );
};
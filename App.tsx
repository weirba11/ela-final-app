
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Worksheet } from './components/Worksheet';
import { GenerationConfig, QuestionType, WorksheetData, Question, VisualData } from './types';
import { generateWorksheetContent, generateSingleQuestion, regenerateQuestionGroup, generateIllustration } from './services/geminiService';

const App: React.FC = () => {
  const [config, setConfig] = useState<GenerationConfig>({
    selectedStandards: [],
    standardCounts: {},
    selectedSubcategories: {}, 
    questionType: QuestionType.MULTIPLE_CHOICE,
    includeAnswerKey: true,
    titleMode: 'ai',
    customTitle: '',
    columns: 1,
    includeName: true,
    includeClass: true,
    includeDate: true,
    fontSize: 'medium',
    passageLength: 'medium',
    customTopic: ''
  });

  const [worksheetData, setWorksheetData] = useState<WorksheetData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const data = await generateWorksheetContent(config);
      
      if (config.titleMode === 'custom' && config.customTitle.trim() !== '') {
          data.title = config.customTitle;
      }
      setWorksheetData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate worksheet. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToWorksheet = async (extendLastPassage: boolean) => {
      setIsGenerating(true);
      setError(null);
      try {
          let existingPassageContext = undefined;
          
          // If extending, find the last passage info
          if (extendLastPassage && worksheetData && worksheetData.questions.length > 0) {
              const lastQ = worksheetData.questions[worksheetData.questions.length - 1];
              if (lastQ.visualInfo?.passageContent && lastQ.visualInfo?.passageTitle) {
                  existingPassageContext = {
                      title: lastQ.visualInfo.passageTitle,
                      content: lastQ.visualInfo.passageContent
                  };
              }
          }

          const newData = await generateWorksheetContent(config, existingPassageContext);
          
          setWorksheetData(prev => {
              if (!prev) {
                  // If no previous worksheet, use the new data entirely
                  if (config.titleMode === 'custom' && config.customTitle.trim() !== '') {
                      newData.title = config.customTitle;
                  }
                  return newData;
              }

              // Append new questions to existing ones
              // We re-ID the new questions to ensure uniqueness just in case
              const startingId = prev.questions.length > 0 ? Math.max(...prev.questions.map(q => q.id)) + 1 : Date.now();
              const newQuestions = newData.questions.map((q, idx) => ({
                  ...q,
                  id: startingId + idx
              }));

              return {
                  ...prev,
                  questions: [...prev.questions, ...newQuestions]
              };
          });

      } catch (err: any) {
          console.error(err);
          setError(err.message || "Failed to add questions. Please try again.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleExportCSV = () => {
    if (!worksheetData) return;
    const headers = ["Question #", "Question Text", "Answer 1", "Answer 2", "Answer 3", "Answer 4", "Correct Answer"];
    const rows = worksheetData.questions.map((q, index) => {
      const qNum = index + 1;
      let textContent = q.text;
      if (q.visualInfo?.passageContent) textContent = `[Passage: ${q.visualInfo.passageTitle}] ` + textContent;
      
      const qText = `"${textContent.replace(/"/g, '""')}"`;
      const opts = q.options || [];
      const a1 = `"${(opts[0] || "").replace(/"/g, '""')}"`;
      const a2 = `"${(opts[1] || "").replace(/"/g, '""')}"`;
      const a3 = `"${(opts[2] || "").replace(/"/g, '""')}"`;
      const a4 = `"${(opts[3] || "").replace(/"/g, '""')}"`;
      const correct = `"${(q.correctAnswer || "").replace(/"/g, '""')}"`;

      return [qNum, qText, a1, a2, a3, a4, correct].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${(worksheetData.title || "worksheet").replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddCustomQuestion = (question: Question) => {
      setWorksheetData(prev => {
          if (!prev) return { title: config.customTitle || "Custom Worksheet", instructions: "Answer the questions below.", questions: [question] };
          return { ...prev, questions: [...prev.questions, question] };
      });
  };

  const handleRegenerateQuestion = async (index: number) => {
      if (!worksheetData) return;
      const oldQ = worksheetData.questions[index];
      if (oldQ.standardRef === 'Custom') return;

      setIsGenerating(true); 
      try {
        const subcategories = config.selectedSubcategories[oldQ.standardRef];
        
        // Check if there is an existing passage to maintain context
        let contextPassage = undefined;
        if (oldQ.visualInfo?.type === 'text-passage' && oldQ.visualInfo.passageContent) {
            contextPassage = {
                title: oldQ.visualInfo.passageTitle || '',
                content: oldQ.visualInfo.passageContent
            };
        }

        const newQ = await generateSingleQuestion(oldQ.standardRef, index + 1, subcategories, contextPassage);
        
        // If we contextually regenerated, enforce the exact same passage content so grouping works
        if (contextPassage) {
            newQ.visualInfo = {
                ...newQ.visualInfo,
                type: 'text-passage',
                passageTitle: contextPassage.title,
                passageContent: contextPassage.content,
                imageUrl: oldQ.visualInfo?.imageUrl // Preserve existing image if present
            };
        }

        newQ.extraSpace = oldQ.extraSpace || 0;
        
        const newQuestions = [...worksheetData.questions];
        newQuestions[index] = newQ;
        
        setWorksheetData({ ...worksheetData, questions: newQuestions });
      } catch (e) {
        console.error("Failed to regenerate", e);
        setError("Could not regenerate question. Try again.");
      } finally {
        setIsGenerating(false);
      }
  };

  const handleRegeneratePassage = async (index: number) => {
      if (!worksheetData) return;
      const targetQ = worksheetData.questions[index];
      const targetPassage = targetQ.visualInfo?.passageContent;
      
      if (!targetPassage) return;

      setIsGenerating(true);
      try {
          // Identify all questions in this group
          const indicesToUpdate: number[] = [];
          worksheetData.questions.forEach((q, i) => {
              // Group by exact passage content match
              if (q.visualInfo?.passageContent === targetPassage) {
                  indicesToUpdate.push(i);
              }
          });

          // Assume all questions in the group share the standard (they should)
          const standard = targetQ.standardRef;
          const subcategories = config.selectedSubcategories[standard];
          const count = indicesToUpdate.length;

          // Generate a completely new group (New Passage + New Questions)
          const newQuestions = await regenerateQuestionGroup(standard, count, subcategories, config.passageLength);
          
          const updatedQuestions = [...worksheetData.questions];
          indicesToUpdate.forEach((idx, i) => {
             // Preserve extra spacing from previous layout if needed, or reset
             const q = newQuestions[i];
             q.extraSpace = worksheetData.questions[idx].extraSpace || 0;
             // Ensure IDs are unique-ish if they collided, though backend usually handles
             q.id = Date.now() + i; 
             updatedQuestions[idx] = q;
          });

          setWorksheetData({ ...worksheetData, questions: updatedQuestions });

      } catch (e) {
          console.error("Failed to regenerate passage group", e);
          setError("Could not regenerate passage. Try again.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleUpdateSpacing = (index: number, newSpace: number) => {
     if (!worksheetData) return;
     const newQuestions = [...worksheetData.questions];
     newQuestions[index] = { ...newQuestions[index], extraSpace: newSpace };
     setWorksheetData({ ...worksheetData, questions: newQuestions });
  };

  const handleUpdateVisual = async (index: number, type: 'upload' | 'ai', fileOrPrompt: string | File) => {
      if (!worksheetData) return;
      
      try {
          let imageUrl = '';
          
          if (type === 'upload' && fileOrPrompt instanceof File) {
             // Convert file to base64
             imageUrl = await new Promise<string>((resolve) => {
                 const reader = new FileReader();
                 reader.onloadend = () => resolve(reader.result as string);
                 reader.readAsDataURL(fileOrPrompt);
             });
          } else if (type === 'ai' && typeof fileOrPrompt === 'string') {
              setIsGeneratingImage(true);
              imageUrl = await generateIllustration(fileOrPrompt);
          }

          if (!imageUrl) return;

          // Identify all questions in this group to update the shared passage visual
          const targetQ = worksheetData.questions[index];
          const targetPassage = targetQ.visualInfo?.passageContent;
          
          const newQuestions = worksheetData.questions.map(q => {
              // If it's a passage group, update all members
              if (targetPassage && q.visualInfo?.passageContent === targetPassage) {
                  return {
                      ...q,
                      visualInfo: { ...q.visualInfo!, imageUrl: imageUrl }
                  };
              }
              // If it's just this specific question (e.g. custom or single)
              if (q.id === targetQ.id) {
                  // Ensure type is set if it was missing (which fixes the "Passage nor illustration work" bug)
                  const newType = q.visualInfo?.type || 'custom-image';
                  
                  return {
                      ...q,
                      visualInfo: { ...q.visualInfo!, imageUrl: imageUrl, type: newType }
                  };
              }
              return q;
          });

          setWorksheetData({ ...worksheetData, questions: newQuestions });

      } catch (e) {
          console.error("Failed to update visual", e);
          setError("Could not create illustration. Please try again.");
      } finally {
          setIsGeneratingImage(false);
      }
  };

  const handleUpdateQuestionData = (index: number, updatedQ: Question) => {
      if (!worksheetData) return;
      const newQuestions = [...worksheetData.questions];
      newQuestions[index] = updatedQ;
      setWorksheetData({ ...worksheetData, questions: newQuestions });
  };

  const handleUpdatePassageData = (index: number, newVisualInfo: Partial<VisualData>) => {
      if (!worksheetData) return;
      const targetQ = worksheetData.questions[index];
      const oldContent = targetQ.visualInfo?.passageContent;
      
      // Update ALL questions that share this passage content to maintain grouping
      const newQuestions = worksheetData.questions.map(q => {
          if (q.visualInfo?.type === 'text-passage' && q.visualInfo.passageContent === oldContent) {
              return {
                  ...q,
                  visualInfo: { ...q.visualInfo!, ...newVisualInfo }
              };
          }
          return q;
      });
      
      setWorksheetData({ ...worksheetData, questions: newQuestions });
  };

  const handleDeleteQuestion = (index: number) => {
    if (!worksheetData) return;
    const newQuestions = worksheetData.questions.filter((_, i) => i !== index);
    setWorksheetData({ ...worksheetData, questions: newQuestions });
  };

  const handleDeletePassage = (index: number) => {
      if (!worksheetData) return;
      const targetQ = worksheetData.questions[index];
      const targetPassage = targetQ.visualInfo?.passageContent;
  
      if (!targetPassage) {
          // Fallback: just delete the single question if no passage content to match against
          handleDeleteQuestion(index);
          return;
      }
  
      // Remove all questions that share this passage content
      const newQuestions = worksheetData.questions.filter(q => q.visualInfo?.passageContent !== targetPassage);
      setWorksheetData({ ...worksheetData, questions: newQuestions });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="w-full md:w-auto flex-shrink-0 h-full bg-white z-20 absolute md:relative transition-transform transform md:transform-none -translate-x-full md:translate-x-0 print:hidden">
         <Sidebar 
           config={config} 
           setConfig={setConfig} 
           onGenerate={handleGenerate}
           onAddToWorksheet={handleAddToWorksheet}
           isGenerating={isGenerating}
           onAddQuestion={handleAddCustomQuestion}
           onExportCSV={handleExportCSV}
           hasData={!!worksheetData}
         />
      </div>
      <main className="flex-1 h-full relative flex flex-col bg-gray-100">
        <div className="md:hidden p-4 bg-white shadow-sm flex items-center justify-between no-print">
            <span className="font-bold text-brand-600">educationalresource.org</span>
            <span className="text-xs text-gray-500">Use Desktop for best experience</span>
        </div>
        {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-xl z-50 no-print flex flex-col gap-2 items-center">
                <div className="flex items-center gap-2 font-semibold">
                    <span>Error</span>
                    <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600 font-bold text-lg">&times;</button>
                </div>
                <span className="text-sm text-center max-w-md">{error}</span>
            </div>
        )}
        <Worksheet 
            data={worksheetData} 
            config={config}
            onRegenerateQuestion={handleRegenerateQuestion}
            onRegeneratePassage={handleRegeneratePassage}
            onUpdateSpacing={handleUpdateSpacing}
            onUpdateVisual={handleUpdateVisual}
            onUpdateQuestionData={handleUpdateQuestionData}
            onUpdatePassageData={handleUpdatePassageData}
            onDeleteQuestion={handleDeleteQuestion}
            onDeletePassage={handleDeletePassage}
            isGeneratingImage={isGeneratingImage}
        />
      </main>
    </div>
  );
};

export default App;
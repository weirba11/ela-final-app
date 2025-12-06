import React from 'react';
import { VisualData } from '../types';
import { EditableField } from './EditableField';
import { Minimize, Maximize } from 'lucide-react';

interface VisualRendererProps {
  data?: VisualData;
  onUpdatePassage?: (newData: Partial<VisualData>) => void;
}

// Robust Markdown Parser for Bold and Italic
const formatMarkdown = (text: string): string => {
    if (!text) return '';
    let formatted = text;
    
    // Bold: **text** or __text__ -> <b>text</b>
    // The regex looks for ** or __, captures content in group 2, and matches the closing tag
    formatted = formatted.replace(/(\*\*|__)(.*?)\1/g, '<b>$2</b>');
    
    // Italic: *text* or _text_ -> <i>text</i>
    // The regex looks for * or _, captures content, and matches closing. 
    // We try to avoid matching * inside ** (bold has already been processed usually, but safety check helps)
    formatted = formatted.replace(/(\*|_)([^\*_]+?)\1/g, '<i>$2</i>');

    // Convert newlines to breaks for display
    formatted = formatted.replace(/\n/g, '<br/>');
    
    return formatted;
};

export const VisualRenderer: React.FC<VisualRendererProps> = ({ data, onUpdatePassage }) => {
  if (!data) return null;

  // Intelligent Fallback: Detect type if missing
  let visualType = data.type;
  if (!visualType) {
      if (data.passageContent || data.passageTitle) visualType = 'text-passage';
      else if (data.imageUrl) visualType = 'custom-image';
  }

  const handleResize = (delta: number) => {
      if (!onUpdatePassage) return;
      // Default widths: 40% for passage text wrapping, 50% for standalone images
      const currentWidth = data.imageWidth || (visualType === 'text-passage' ? 40 : 50);
      const newWidth = Math.max(10, Math.min(100, currentWidth + delta));
      onUpdatePassage({ imageWidth: newWidth });
  };

  const ResizeControls = () => (
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/image:opacity-100 transition-opacity bg-white/90 rounded shadow border border-gray-200 p-1 no-print z-20">
           <button 
                onClick={(e) => { e.stopPropagation(); handleResize(-10); }} 
                className="p-1 hover:bg-gray-200 rounded text-gray-700" 
                title="Decrease Size"
            >
               <Minimize size={14}/>
           </button>
           <button 
                onClick={(e) => { e.stopPropagation(); handleResize(10); }} 
                className="p-1 hover:bg-gray-200 rounded text-gray-700" 
                title="Increase Size"
            >
               <Maximize size={14}/>
           </button>
      </div>
  );

  // Handle image-only correctly within the renderer if needed
  if (visualType === 'custom-image' || (!visualType && data.imageUrl)) {
      const widthPercent = data.imageWidth || 50;
      return (
          <div className="relative group/image mx-auto my-2 transition-all" style={{ width: `${widthPercent}%` }}>
              <img 
                src={data.imageUrl} 
                alt="Visual" 
                className="w-full h-auto object-contain border border-gray-200 rounded" 
              />
              {onUpdatePassage && <ResizeControls />}
          </div>
      );
  }

  switch (visualType) {
    case 'text-passage':
        // Hide [Illustration: ...] tags from the student view
        // These tags are used by the system to generate images but shouldn't be read by the student
        const content = data.passageContent || '';
        const rawDisplayContent = content.replace(/\[Illustration:[\s\S]*?\]/gi, '').trim();
        const displayContentHtml = formatMarkdown(rawDisplayContent);
        const floatWidth = data.imageWidth || 40;

        return (
            <div className="my-4 p-5 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-serif leading-relaxed text-justify relative clearfix">
                {data.passageTitle && (
                     onUpdatePassage ? (
                        <EditableField
                            value={data.passageTitle}
                            onSave={(val) => onUpdatePassage({ passageTitle: val })}
                            className="mb-3 block"
                            label="Title"
                        >
                             <h4 className="font-bold text-center text-base text-gray-900 border-b border-gray-100 pb-2">
                                {data.passageTitle}
                            </h4>
                        </EditableField>
                     ) : (
                        <h4 className="font-bold text-center text-base mb-3 text-gray-900 border-b border-gray-100 pb-2">
                            {data.passageTitle}
                        </h4>
                     )
                )}
                {/* Generated or Uploaded Illustration for Passage */}
                {data.imageUrl && (
                    <div 
                        className="float-right ml-4 mb-2 relative group/image transition-all"
                        style={{ width: `${floatWidth}%` }}
                    >
                        <img 
                            src={data.imageUrl} 
                            alt="Passage Illustration" 
                            className="rounded shadow border border-gray-100 w-full object-cover"
                        />
                        {onUpdatePassage && <ResizeControls />}
                    </div>
                )}
                
                {onUpdatePassage ? (
                    <EditableField
                        value={content}
                        onSave={(val) => onUpdatePassage({ passageContent: val })}
                        multiline
                        className="w-full"
                    >
                        <div 
                            className="whitespace-pre-wrap text-gray-800"
                            dangerouslySetInnerHTML={{ __html: displayContentHtml }}
                        />
                    </EditableField>
                ) : (
                    <div 
                        className="whitespace-pre-wrap text-gray-800"
                        dangerouslySetInnerHTML={{ __html: displayContentHtml }}
                    />
                )}
                
                {/* Clearfix for floated image */}
                <div className="clear-both"></div>
            </div>
        );

    case 'editing-task':
        return (
            <div className="my-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center shadow-sm">
                <p className="font-mono text-lg text-gray-800 tracking-wide font-medium">{data.sentenceToEdit}</p>
            </div>
        );

    case 'table':
        if (!data.tableRows || !data.tableHeaders) return null;
        return (
            <div className="my-3 overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            {data.tableHeaders.map((h, i) => (
                                <th key={i} className="px-4 py-2 text-left font-bold text-gray-900 border-b border-gray-200">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {data.tableRows.map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                {row.map((cell, j) => (
                                    <td key={j} className="px-4 py-2 text-gray-700 border-b border-gray-100">{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );

    case 'bar-graph':
        if (!data.dataPoints) return null;
        const maxVal = Math.max(...data.dataPoints.map(d => d.value));
        return (
            <div className="my-4 p-4 border border-gray-200 rounded-lg bg-white w-full max-w-sm mx-auto">
                {data.graphTitle && <div className="text-center font-bold mb-2 text-sm">{data.graphTitle}</div>}
                <div className="flex items-end justify-around h-32 gap-2">
                    {data.dataPoints.map((d, i) => (
                        <div key={i} className="flex flex-col items-center justify-end h-full w-full group">
                            <span className="text-[10px] text-gray-500 mb-1">{d.value}</span>
                            <div 
                                className="w-full bg-blue-400 rounded-t-sm group-print:bg-gray-600 transition-all"
                                style={{ height: `${(d.value / maxVal) * 100}%` }}
                            ></div>
                            <span className="text-[10px] text-gray-700 mt-1 truncate w-full text-center">{d.label}</span>
                        </div>
                    ))}
                </div>
                {data.xAxisLabel && <div className="text-center text-xs text-gray-500 mt-2">{data.xAxisLabel}</div>}
            </div>
        );

    default: 
        return null;
  }
};
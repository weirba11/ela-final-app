
import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Check, X, Bold, Italic, Underline, Highlighter } from 'lucide-react';

interface EditableFieldProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  multiline?: boolean;
  children?: React.ReactNode; // Custom renderer for display mode
  placeholder?: string;
  label?: string;
}

export const EditableField: React.FC<EditableFieldProps> = ({ 
  value, 
  onSave, 
  className = '', 
  multiline = false,
  children,
  placeholder,
  label
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
        if (multiline && textareaRef.current) {
            // Auto-resize textarea
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
            textareaRef.current.focus();
        } else if (!multiline && inputRef.current) {
            inputRef.current.focus();
        }
    }
  }, [isEditing, multiline]);

  const handleSave = () => {
    onSave(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleCancel();
    // Allow Ctrl+Enter to save
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSave();
    }
  };

  const handleFormat = (tag: string, e: React.MouseEvent) => {
      e.preventDefault(); // Prevent losing focus
      const ref = multiline ? textareaRef.current : inputRef.current;
      if (!ref) return;

      const start = ref.selectionStart;
      const end = ref.selectionEnd;

      if (start === null || end === null || start === end) return;

      const text = tempValue;
      const selection = text.substring(start, end);
      const before = text.substring(0, start);
      const after = text.substring(end);

      let formattedSelection = '';
      // Simple toggle check could be added here, but for now we just wrap
      // Using standard HTML tags which the Worksheet renderer supports via dangerouslySetInnerHTML
      switch (tag) {
          case 'bold': formattedSelection = `<b>${selection}</b>`; break;
          case 'italic': formattedSelection = `<i>${selection}</i>`; break;
          case 'underline': formattedSelection = `<u>${selection}</u>`; break;
          case 'highlight': formattedSelection = `<mark class="bg-yellow-200 rounded-sm px-0.5">${selection}</mark>`; break;
      }

      const newText = before + formattedSelection + after;
      setTempValue(newText);

      // Restore focus and selection
      setTimeout(() => {
          ref.focus();
          // Move cursor to end of inserted tag
          const newCursorPos = start + formattedSelection.length;
          ref.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
  };

  if (isEditing) {
    return (
      <div className={`relative ${className} min-w-[200px] font-sans`}>
        {label && <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>}
        
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 mb-1 p-1 bg-gray-100 rounded border border-gray-200 w-fit">
            <button onMouseDown={(e) => handleFormat('bold', e)} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="Bold">
                <Bold size={14} />
            </button>
            <button onMouseDown={(e) => handleFormat('italic', e)} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="Italic">
                <Italic size={14} />
            </button>
            <button onMouseDown={(e) => handleFormat('underline', e)} className="p-1 hover:bg-gray-200 rounded text-gray-700" title="Underline">
                <Underline size={14} />
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <button onMouseDown={(e) => handleFormat('highlight', e)} className="p-1 hover:bg-yellow-200 rounded text-gray-700" title="Highlight">
                <Highlighter size={14} />
            </button>
        </div>

        {multiline ? (
          <textarea
            ref={textareaRef}
            value={tempValue}
            onChange={(e) => {
                setTempValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={handleKeyDown}
            className="w-full p-2 border-2 border-brand-400 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-200 bg-white shadow-sm text-sm font-sans"
            placeholder={placeholder}
            rows={3}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={(e) => {
                if(e.key === 'Enter') handleSave();
                handleKeyDown(e);
            }}
            className="w-full p-2 border-2 border-brand-400 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-200 bg-white shadow-sm text-sm font-sans"
            placeholder={placeholder}
          />
        )}
        <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] text-gray-400 italic">HTML tags supported</span>
            <div className="flex gap-1 z-50">
            <button 
                onClick={handleCancel}
                className="p-1 text-red-600 bg-red-50 hover:bg-red-100 rounded shadow-sm border border-red-200"
                title="Cancel"
            >
                <X size={14} />
            </button>
            <button 
                onClick={handleSave}
                className="p-1 text-green-600 bg-green-50 hover:bg-green-100 rounded shadow-sm border border-green-200"
                title="Save"
            >
                <Check size={14} />
            </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group/edit ${className}`}>
      {children || <span>{value}</span>}
      <button
        onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
        }}
        className="absolute -top-3 -right-3 opacity-0 group-hover/edit:opacity-100 transition-opacity bg-white text-gray-500 hover:text-brand-600 border border-gray-200 shadow-sm rounded-full p-1.5 no-print z-10"
        title="Edit Text"
      >
        <Pencil size={12} />
      </button>
    </div>
  );
};

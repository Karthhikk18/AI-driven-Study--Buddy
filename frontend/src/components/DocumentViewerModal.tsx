import React, { useState } from 'react';
import { X, FileText, Eye, Cpu, Download, Sparkles, BookOpen } from 'lucide-react';

interface DocumentViewerModalProps {
  document: any | null;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ document: doc, onClose }) => {
  const [activeView, setActiveView] = useState<'visual' | 'ocr'>('visual');

  if (!doc) return null;

  const fileUrl = `/api/v1/documents/${doc.id}/file`;
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'handwritten_note', 'image'].includes(doc.file_type?.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 md:p-6">
      <div className="bg-notion-lightSurface dark:bg-notion-darkSurface border border-notion-lightBorder dark:border-notion-darkBorder w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-4 border-b border-notion-lightBorder dark:border-notion-darkBorder flex items-center justify-between bg-notion-lightSurface dark:bg-notion-darkSurface">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-9 h-9 rounded-xl bg-notion-accent/10 text-notion-accent flex items-center justify-center flex-shrink-0 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="font-bold text-sm truncate">{doc.filename}</h3>
              <div className="flex items-center space-x-2 text-[10px] text-notion-lightMuted dark:text-notion-darkMuted">
                <span className="uppercase font-bold tracking-wider text-notion-accent">{doc.file_type}</span>
                <span>•</span>
                <span className="text-emerald-500 font-semibold">OCR Confidence: {doc.ocr_confidence || 95}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center space-x-1 bg-notion-lightBg dark:bg-notion-darkBg p-1 rounded-xl border border-notion-lightBorder dark:border-notion-darkBorder text-xs font-medium">
              <button
                onClick={() => setActiveView('visual')}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  activeView === 'visual'
                    ? 'bg-notion-accent text-white font-semibold shadow-sm'
                    : 'text-notion-lightMuted dark:text-notion-darkMuted hover:text-notion-lightText'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Original Document</span>
              </button>
              <button
                onClick={() => setActiveView('ocr')}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  activeView === 'ocr'
                    ? 'bg-notion-accent text-white font-semibold shadow-sm'
                    : 'text-notion-lightMuted dark:text-notion-darkMuted hover:text-notion-lightText'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Extracted OCR Text</span>
              </button>
            </div>

            <a
              href={fileUrl}
              download={doc.filename}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl border border-notion-lightBorder dark:border-notion-darkBorder hover:bg-notion-lightBg dark:hover:bg-notion-darkBg text-notion-lightMuted dark:text-notion-darkMuted"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-notion-lightBorder dark:border-notion-darkBorder hover:bg-notion-lightBg dark:hover:bg-notion-darkBg text-notion-lightMuted dark:text-notion-darkMuted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Viewer Body */}
        <div className="flex-1 overflow-hidden bg-notion-lightBg dark:bg-notion-darkBg p-4 flex flex-col justify-center items-center">
          {activeView === 'visual' ? (
            isImage ? (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                <img
                  src={fileUrl}
                  alt={doc.filename}
                  className="max-h-full max-w-full rounded-xl object-contain shadow-xl border border-notion-lightBorder dark:border-notion-darkBorder"
                />
              </div>
            ) : (
              <iframe
                src={fileUrl}
                title={doc.filename}
                className="w-full h-full rounded-xl border border-notion-lightBorder dark:border-notion-darkBorder shadow-inner bg-white"
              />
            )
          ) : (
            <div className="w-full h-full overflow-y-auto bg-notion-lightSurface dark:bg-notion-darkSurface p-6 rounded-xl border border-notion-lightBorder dark:border-notion-darkBorder space-y-4">
              <div className="flex items-center space-x-2 text-notion-accent font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Extracted Document Text & Intelligence Stream</span>
              </div>
              <div className="text-xs font-mono whitespace-pre-wrap leading-relaxed border p-4 rounded-xl bg-notion-lightBg dark:bg-notion-darkBg border-notion-lightBorder dark:border-notion-darkBorder">
                {doc.extracted_text || 'No text extracted for this document.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

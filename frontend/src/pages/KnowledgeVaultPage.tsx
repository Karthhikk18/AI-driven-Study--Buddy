import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { documentApi } from '../services/api';
import { FileText, Cpu, CheckCircle2, Plus, Search, Eye, BookOpen, Trash2, Radio, Quote } from 'lucide-react';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import { AIAudioPodcastModal } from '../components/AIAudioPodcastModal';

export const KnowledgeVaultPage: React.FC = () => {
  const { selectedSubject, setUploadModalOpen, refreshTrigger } = useStore();
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [activeViewDoc, setActiveViewDoc] = useState<any | null>(null);
  const [activePodcastDoc, setActivePodcastDoc] = useState<any | null>(null);
  const [activeCitationDoc, setActiveCitationDoc] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchDocs = async () => {
    try {
      const res = await documentApi.listDocuments(selectedSubject?.id);
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [selectedSubject, refreshTrigger]);

  const handleDeleteDoc = async (e: React.MouseEvent, docId: number) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document from the OS?")) return;
    setDeletingId(docId);
    try {
      await documentApi.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.intelligence_metadata?.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.file_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-black dark:text-white">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white">Knowledge Vault</h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Intelligence repository of processed handwritten notes, scanned PDFs, Wikipedia pages, & AI podcasts.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-black text-white dark:bg-white dark:text-black hover:opacity-90 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs">
        <div className="flex items-center space-x-2 w-full sm:w-72 bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700">
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search materials or concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none w-full text-black dark:text-white placeholder:text-zinc-400"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-zinc-600 dark:text-zinc-400 font-semibold">Format:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white rounded-xl px-3 py-1.5 outline-none font-bold text-xs"
          >
            <option value="all">All Formats</option>
            <option value="pdf">PDF Documents</option>
            <option value="wikipedia">Wikipedia & Web Links</option>
            <option value="youtube">YouTube Videos</option>
            <option value="handwritten_note">Handwritten Notes (OCR)</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-black rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
            No materials match your query. Click "Upload Material" to process handwritten notes or web links.
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between hover:border-black dark:hover:border-white transition-all shadow-sm space-y-3 cursor-pointer group relative"
              onClick={() => setActiveViewDoc(doc)}
            >
              <div>
                {/* Format, Status & Delete Button */}
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-zinc-800">
                    {doc.file_type}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePodcastDoc(doc);
                      }}
                      className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20 hover:bg-amber-500/20"
                      title="Listen to AI Audio Podcast"
                    >
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>AI Podcast</span>
                    </button>

                    <button
                      onClick={(e) => handleDeleteDoc(e, doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                      title="Delete Document from OS"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* File Title */}
                <h3 className="font-bold text-sm truncate mb-1 text-black dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" title={doc.filename}>
                  {doc.filename}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  Topic: <span className="text-black dark:text-white font-bold">{doc.intelligence_metadata?.topic || 'General'}</span>
                </p>

                {/* Intelligence Concepts Tags */}
                {doc.intelligence_metadata?.concepts?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {doc.intelligence_metadata.concepts.slice(0, 3).map((concept: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]"
                      >
                        #{concept}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveViewDoc(doc);
                  }}
                  className="flex items-center space-x-1 text-black dark:text-white hover:underline font-bold"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>View Document</span>
                </button>
                <span className="font-mono">{new Date(doc.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* In-App Interactive Document Viewer Modal */}
      {activeViewDoc && (
        <DocumentViewerModal
          document={activeViewDoc}
          onClose={() => setActiveViewDoc(null)}
        />
      )}

      {/* AI Audio Podcast Player Modal */}
      {activePodcastDoc && (
        <AIAudioPodcastModal
          title={activePodcastDoc.filename}
          text={activePodcastDoc.intelligence_metadata?.summary || activePodcastDoc.extracted_text || 'No summary available.'}
          onClose={() => setActivePodcastDoc(null)}
        />
      )}
    </div>
  );
};

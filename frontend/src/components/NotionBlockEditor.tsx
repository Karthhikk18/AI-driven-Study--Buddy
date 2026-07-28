import React, { useState, useEffect } from 'react';
import { pageApi, agentApi } from '../services/api';
import { Plus, Trash2, CheckSquare, Square, Sparkles, MessageSquare, Code, Heading1, Heading2, AlignLeft, Info, Quote } from 'lucide-react';

export interface NotionBlock {
  id: string;
  type: 'h1' | 'h2' | 'h3' | 'text' | 'todo' | 'callout' | 'quote' | 'code' | 'ai_block';
  content: string;
  completed?: boolean;
}

interface NotionBlockEditorProps {
  page: any;
  onPageUpdate?: (updatedPage: any) => void;
}

export const NotionBlockEditor: React.FC<NotionBlockEditorProps> = ({ page, onPageUpdate }) => {
  const [title, setTitle] = useState(page.title || 'Untitled Page');
  const [icon, setIcon] = useState(page.icon || '📄');
  const [blocks, setBlocks] = useState<NotionBlock[]>(
    page.blocks && page.blocks.length > 0
      ? page.blocks
      : [
          { id: '1', type: 'h1', content: page.title || 'Untitled Page' },
          { id: '2', type: 'callout', content: 'Welcome to your Study Canvas page! Type / to insert blocks.' },
          { id: '3', type: 'text', content: '' }
        ]
  );
  const [activeSlashIndex, setActiveSlashIndex] = useState<number | null>(null);
  const [aiLoadingIndex, setAiLoadingIndex] = useState<number | null>(null);

  useEffect(() => {
    setTitle(page.title || 'Untitled Page');
    setIcon(page.icon || '📄');
    setBlocks(page.blocks && page.blocks.length > 0 ? page.blocks : [
      { id: '1', type: 'h1', content: page.title || 'Untitled Page' },
      { id: '2', type: 'callout', content: 'Welcome to your Study Canvas page! Type / to insert blocks.' },
      { id: '3', type: 'text', content: '' }
    ]);
  }, [page.id]);

  const savePage = async (updatedTitle: string, updatedIcon: string, updatedBlocks: NotionBlock[]) => {
    try {
      const res = await pageApi.updatePage(page.id, updatedTitle, updatedIcon, updatedBlocks);
      if (onPageUpdate) onPageUpdate(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlockChange = (index: number, newContent: string) => {
    const nextBlocks = [...blocks];
    nextBlocks[index].content = newContent;
    setBlocks(nextBlocks);

    if (newContent.endsWith('/')) {
      setActiveSlashIndex(index);
    } else {
      if (activeSlashIndex === index) setActiveSlashIndex(null);
    }

    savePage(title, icon, nextBlocks);
  };

  const handleToggleTodo = (index: number) => {
    const nextBlocks = [...blocks];
    nextBlocks[index].completed = !nextBlocks[index].completed;
    setBlocks(nextBlocks);
    savePage(title, icon, nextBlocks);
  };

  const handleChangeBlockType = (index: number, newType: NotionBlock['type']) => {
    const nextBlocks = [...blocks];
    nextBlocks[index].type = newType;
    nextBlocks[index].content = nextBlocks[index].content.replace(/\/$/, '');
    setBlocks(nextBlocks);
    setActiveSlashIndex(null);
    savePage(title, icon, nextBlocks);
  };

  const handleAddBlock = (index: number) => {
    const nextBlocks = [...blocks];
    const newBlock: NotionBlock = {
      id: Date.now().toString(),
      type: 'text',
      content: ''
    };
    nextBlocks.splice(index + 1, 0, newBlock);
    setBlocks(nextBlocks);
    savePage(title, icon, nextBlocks);
  };

  const handleDeleteBlock = (index: number) => {
    if (blocks.length <= 1) return;
    const nextBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(nextBlocks);
    savePage(title, icon, nextBlocks);
  };

  const handleRunAIBlock = async (index: number) => {
    const targetBlock = blocks[index];
    if (!targetBlock.content.trim()) return;

    setAiLoadingIndex(index);
    try {
      const res = await agentApi.sendCommand(targetBlock.content, page.subject_id || 1, 'Intermediate');
      const nextBlocks = [...blocks];
      nextBlocks[index] = {
        id: targetBlock.id,
        type: 'callout',
        content: `✨ Buddy AI: ${res.data.message}`
      };
      setBlocks(nextBlocks);
      savePage(title, icon, nextBlocks);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoadingIndex(null);
    }
  };

  const blockMenuOptions = [
    { type: 'h1', label: 'Heading 1', icon: Heading1 },
    { type: 'h2', label: 'Heading 2', icon: Heading2 },
    { type: 'text', label: 'Text Paragraph', icon: AlignLeft },
    { type: 'todo', label: 'To-Do Checkbox', icon: CheckSquare },
    { type: 'callout', label: 'Callout Box', icon: Info },
    { type: 'quote', label: 'Quote', icon: Quote },
    { type: 'code', label: 'Code Block', icon: Code },
    { type: 'ai_block', label: 'Buddy AI Block', icon: Sparkles },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6">
      {/* Title & Icon Header */}
      <div className="flex items-center space-x-3 border-b border-notion-lightBorder dark:border-notion-darkBorder pb-4">
        <input
          type="text"
          value={icon}
          onChange={(e) => {
            setIcon(e.target.value);
            savePage(title, e.target.value, blocks);
          }}
          className="w-10 h-10 text-2xl text-center bg-notion-lightBg dark:bg-notion-darkBg border border-notion-lightBorder dark:border-notion-darkBorder rounded-xl outline-none"
        />
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            savePage(e.target.value, icon, blocks);
          }}
          placeholder="Untitled Page"
          className="text-2xl md:text-3xl font-bold bg-transparent outline-none w-full"
        />
      </div>

      {/* Block Stream Canvas */}
      <div className="space-y-3">
        {blocks.map((block, idx) => (
          <div key={block.id} className="group relative flex items-start space-x-2">
            
            {/* Left Controls */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 pt-1.5 flex-shrink-0">
              <button
                onClick={() => handleAddBlock(idx)}
                className="p-1 rounded hover:bg-notion-lightBg dark:hover:bg-notion-darkBg text-notion-lightMuted"
                title="Add block below"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeleteBlock(idx)}
                className="p-1 rounded hover:bg-red-500/10 text-notion-lightMuted hover:text-red-500"
                title="Delete block"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Block Render Types */}
            <div className="flex-1 min-w-0">
              {block.type === 'h1' && (
                <input
                  type="text"
                  value={block.content}
                  onChange={(e) => handleBlockChange(idx, e.target.value)}
                  placeholder="Heading 1"
                  className="text-xl font-bold bg-transparent outline-none w-full border-b border-transparent focus:border-notion-accent"
                />
              )}

              {block.type === 'h2' && (
                <input
                  type="text"
                  value={block.content}
                  onChange={(e) => handleBlockChange(idx, e.target.value)}
                  placeholder="Heading 2"
                  className="text-lg font-semibold bg-transparent outline-none w-full border-b border-transparent focus:border-notion-accent"
                />
              )}

              {block.type === 'text' && (
                <textarea
                  value={block.content}
                  onChange={(e) => handleBlockChange(idx, e.target.value)}
                  placeholder="Type '/' for Study blocks or Buddy AI..."
                  rows={1}
                  className="w-full bg-transparent outline-none text-xs leading-relaxed resize-none"
                />
              )}

              {block.type === 'todo' && (
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleToggleTodo(idx)} className="text-notion-accent">
                    {block.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                  <input
                    type="text"
                    value={block.content}
                    onChange={(e) => handleBlockChange(idx, e.target.value)}
                    placeholder="To-do task..."
                    className={`w-full bg-transparent outline-none text-xs ${block.completed ? 'line-through text-notion-lightMuted' : ''}`}
                  />
                </div>
              )}

              {block.type === 'callout' && (
                <div className="p-3.5 rounded-xl bg-notion-accent/10 border border-notion-accent/20 flex items-start space-x-2 text-xs">
                  <Sparkles className="w-4 h-4 text-notion-accent flex-shrink-0 mt-0.5" />
                  <textarea
                    value={block.content}
                    onChange={(e) => handleBlockChange(idx, e.target.value)}
                    className="w-full bg-transparent outline-none leading-relaxed resize-none"
                  />
                </div>
              )}

              {block.type === 'quote' && (
                <div className="border-l-4 border-notion-accent pl-3 py-1 text-xs italic text-notion-lightMuted">
                  <textarea
                    value={block.content}
                    onChange={(e) => handleBlockChange(idx, e.target.value)}
                    placeholder="Quote block..."
                    className="w-full bg-transparent outline-none resize-none"
                  />
                </div>
              )}

              {block.type === 'code' && (
                <div className="p-3 rounded-xl bg-notion-darkBg font-mono text-xs text-emerald-400 border border-notion-darkBorder">
                  <textarea
                    value={block.content}
                    onChange={(e) => handleBlockChange(idx, e.target.value)}
                    placeholder="// Code block"
                    className="w-full bg-transparent outline-none resize-none"
                  />
                </div>
              )}

              {block.type === 'ai_block' && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-indigo-500 font-bold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Buddy AI Prompt Block</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => handleBlockChange(idx, e.target.value)}
                      placeholder="Prompt Buddy AI (e.g. 'Summarize resume', 'Extract action items')..."
                      className="flex-1 bg-transparent outline-none border-b border-indigo-500/30"
                    />
                    <button
                      onClick={() => handleRunAIBlock(idx)}
                      disabled={aiLoadingIndex === idx}
                      className="px-2.5 py-1 bg-indigo-600 text-white font-semibold rounded-lg text-[10px]"
                    >
                      {aiLoadingIndex === idx ? 'Synthesizing...' : 'Run AI'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Slash Command Autocomplete Popover */}
            {activeSlashIndex === idx && (
              <div className="absolute left-8 top-8 z-30 bg-notion-lightSurface dark:bg-notion-darkSurface border border-notion-lightBorder dark:border-notion-darkBorder rounded-xl shadow-2xl p-1 w-56 space-y-0.5">
                <div className="px-2 py-1 text-[10px] uppercase font-bold text-notion-lightMuted tracking-wider">
                  Basic Workspace Blocks
                </div>
                {blockMenuOptions.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => handleChangeBlockType(idx, opt.type as any)}
                    className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-notion-lightBg dark:hover:bg-notion-darkBg text-xs text-left"
                  >
                    <opt.icon className="w-4 h-4 text-notion-accent" />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
};

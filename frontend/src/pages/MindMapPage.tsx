import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { mindmapApi } from '../services/api';
import { Brain, RefreshCw, ZoomIn, ZoomOut, Maximize2, Sparkles, X, ChevronRight, Loader2 } from 'lucide-react';

interface MindNode {
  id: string;
  label: string;
  description?: string;
  children?: string[];
  x: number;
  y: number;
  color: string;
  size: number;
  depth: number;
}

interface MindEdge {
  from: string;
  to: string;
}

interface MindMapData {
  nodes: MindNode[];
  edges: MindEdge[];
}

const NODE_COLORS = [
  '#f59e0b', // amber - root
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#fb923c', // orange
  '#84cc16', // lime
];

function layoutNodes(nodes: any[], edges: any[]): MindNode[] {
  if (!nodes || nodes.length === 0) return [];
  const centerX = 500;
  const centerY = 350;
  const laid: MindNode[] = [];

  // Build adjacency
  const childrenMap: Record<string, string[]> = {};
  edges.forEach((e) => {
    if (!childrenMap[e.from]) childrenMap[e.from] = [];
    childrenMap[e.from].push(e.to);
  });

  // BFS layout
  const visited = new Set<string>();
  const queue: { id: string; depth: number; parentX: number; parentY: number; angle: number; spread: number }[] = [];

  const root = nodes[0];
  queue.push({ id: root.id, depth: 0, parentX: centerX, parentY: centerY, angle: 0, spread: Math.PI * 2 });

  while (queue.length > 0) {
    const { id, depth, parentX, parentY, angle, spread } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = nodes.find((n) => n.id === id);
    if (!node) continue;

    let x = parentX;
    let y = parentY;
    if (depth > 0) {
      const radius = depth === 1 ? 220 : depth === 2 ? 150 : 100;
      x = parentX + Math.cos(angle) * radius;
      y = parentY + Math.sin(angle) * radius;
    }

    laid.push({
      ...node,
      x,
      y,
      color: NODE_COLORS[depth % NODE_COLORS.length],
      size: depth === 0 ? 56 : depth === 1 ? 44 : 36,
      depth,
    });

    const children = childrenMap[id] || [];
    children.forEach((childId, i) => {
      const childAngle = depth === 0
        ? (Math.PI * 2 * i) / children.length
        : angle - spread / 2 + (spread / (children.length || 1)) * i + spread / (2 * (children.length || 1));
      queue.push({
        id: childId,
        depth: depth + 1,
        parentX: x,
        parentY: y,
        angle: childAngle,
        spread: spread / 2,
      });
    });
  }

  return laid;
}

export const MindMapPage: React.FC = () => {
  const { selectedSubject } = useStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<MindNode[]>([]);
  const [edges, setEdges] = useState<MindEdge[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<MindNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [aiExplanation, setAiExplanation] = useState('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [rawData, setRawData] = useState<MindMapData | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSelectedNode(null);
    setAiExplanation('');
    try {
      const res = await mindmapApi.generate(selectedSubject?.id || 1);
      const data: MindMapData = res.data;
      setRawData(data);
      const laidNodes = layoutNodes(data.nodes, data.edges);
      setNodes(laidNodes);
      setEdges(data.edges);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } catch {
      // Fallback demo data
      const demo = generateDemoMap(selectedSubject?.name || 'Study');
      setRawData(demo);
      const laidNodes = layoutNodes(demo.nodes, demo.edges);
      setNodes(laidNodes);
      setEdges(demo.edges);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateDemoMap = (subject: string): MindMapData => {
    const topics = ['Core Concepts', 'Key Theories', 'Applications', 'Methods', 'History', 'Advanced Topics'];
    const subtopics = ['Definition', 'Examples', 'Importance', 'Challenges'];
    const nodes: any[] = [{ id: 'root', label: subject, description: `Central topic: ${subject}` }];
    const edgesList: MindEdge[] = [];
    topics.forEach((t, i) => {
      const tid = `t${i}`;
      nodes.push({ id: tid, label: t, description: `Explore ${t} in ${subject}` });
      edgesList.push({ from: 'root', to: tid });
      subtopics.slice(0, 2).forEach((s, j) => {
        const sid = `t${i}s${j}`;
        nodes.push({ id: sid, label: s, description: `${s} related to ${t}` });
        edgesList.push({ from: tid, to: sid });
      });
    });
    return { nodes, edges: edgesList };
  };

  const handleNodeClick = async (node: MindNode) => {
    setSelectedNode(node);
    setAiExplanation('');
    setLoadingExplanation(true);
    try {
      const res = await mindmapApi.explain(selectedSubject?.id || 1, node.label);
      setAiExplanation(res.data.explanation);
    } catch {
      setAiExplanation(`**${node.label}**\n\n${node.description || 'This is a key concept in your study material. Upload more documents to get an AI-powered explanation grounded in your notes.'}`);
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest('.mind-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(2.5, z - e.deltaY * 0.001)));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] text-black dark:text-white bg-white dark:bg-black">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex-shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold">AI Concept Mind Map</h2>
            <p className="text-[10px] text-zinc-500 font-semibold">Auto-generated from your study documents</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))} className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))} className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors" title="Reset View">
            <Maximize2 className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-lg">{Math.round(zoom * 100)}%</span>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-xs font-extrabold hover:opacity-90 transition-all disabled:opacity-50 shadow-md ml-2"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isGenerating ? 'Generating...' : 'Generate Mind Map'}</span>
          </button>
        </div>
      </div>

      {/* Canvas + Side Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* SVG Canvas */}
        <div className="flex-1 relative overflow-hidden bg-zinc-50 dark:bg-zinc-950 mind-canvas-bg">
          {nodes.length === 0 && !isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 pointer-events-none">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 flex items-center justify-center border border-violet-500/20">
                <Brain className="w-10 h-10 text-violet-400" />
              </div>
              <h3 className="text-lg font-extrabold text-black dark:text-white">No Mind Map Yet</h3>
              <p className="text-xs text-zinc-500 max-w-xs font-semibold">Click "Generate Mind Map" to auto-extract concepts and relationships from your uploaded study documents.</p>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-20">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                <Brain className="w-6 h-6 text-violet-500 absolute inset-0 m-auto" />
              </div>
              <p className="text-sm font-extrabold text-black dark:text-white">Building Concept Map...</p>
              <p className="text-xs text-zinc-500 font-semibold">Analyzing your study documents with AI</p>
            </div>
          )}

          <svg
            ref={svgRef}
            className="w-full h-full cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <defs>
              <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.2)" />
              </filter>
              <filter id="node-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {NODE_COLORS.map((color, i) => (
                <radialGradient key={i} id={`grad-${i}`} cx="30%" cy="30%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                </radialGradient>
              ))}
            </defs>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {edges.map((edge, i) => {
                const fromNode = nodes.find((n) => n.id === edge.from);
                const toNode = nodes.find((n) => n.id === edge.to);
                if (!fromNode || !toNode) return null;
                return (
                  <line
                    key={i}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={fromNode.color}
                    strokeWidth={fromNode.depth === 0 ? 2.5 : 1.5}
                    strokeOpacity={0.4}
                    strokeDasharray={fromNode.depth >= 2 ? "4 3" : undefined}
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map((node) => (
                <g
                  key={node.id}
                  className="mind-node"
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => handleNodeClick(node)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    r={node.size / 2}
                    fill={`url(#grad-${node.depth % NODE_COLORS.length})`}
                    filter={selectedNode?.id === node.id ? 'url(#node-glow)' : 'url(#node-shadow)'}
                    stroke={selectedNode?.id === node.id ? 'white' : 'transparent'}
                    strokeWidth={2}
                    style={{ transition: 'r 0.2s ease' }}
                  />
                  <text
                    textAnchor="middle"
                    dy=".35em"
                    fontSize={node.depth === 0 ? 11 : 9}
                    fontWeight="700"
                    fill="white"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.label.length > 12 ? node.label.substring(0, 11) + '…' : node.label}
                  </text>
                  {node.depth > 0 && (
                    <text
                      textAnchor="middle"
                      dy={node.size / 2 + 14}
                      fontSize={8}
                      fontWeight="600"
                      fill={node.color}
                      opacity={0.8}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {node.label.length > 16 ? node.label.substring(0, 15) + '…' : node.label}
                    </text>
                  )}
                </g>
              ))}
            </g>
          </svg>
        </div>

        {/* Right Panel — Node Details */}
        {selectedNode && (
          <div className="w-80 flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex flex-col overflow-hidden animate-slide-in-right">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: selectedNode.color + '30' }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color }} />
                </div>
                <div>
                  <p className="text-xs font-extrabold">{selectedNode.label}</p>
                  <p className="text-[10px] text-zinc-500 font-semibold">Depth level {selectedNode.depth}</p>
                </div>
              </div>
              <button onClick={() => setSelectedNode(null)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex items-center space-x-1.5 text-[10px] font-bold text-violet-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Explanation</span>
              </div>

              {loadingExplanation ? (
                <div className="flex items-center space-x-2 py-8 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                  <span className="text-xs font-semibold text-zinc-500">Generating explanation...</span>
                </div>
              ) : (
                <div className="text-xs leading-relaxed font-semibold text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {aiExplanation || selectedNode.description}
                </div>
              )}

              {/* Related nodes */}
              {edges.filter((e) => e.from === selectedNode.id || e.to === selectedNode.id).length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Connected Concepts</p>
                  {edges
                    .filter((e) => e.from === selectedNode.id || e.to === selectedNode.id)
                    .map((e, i) => {
                      const otherId = e.from === selectedNode.id ? e.to : e.from;
                      const other = nodes.find((n) => n.id === otherId);
                      if (!other) return null;
                      return (
                        <button
                          key={i}
                          onClick={() => handleNodeClick(other)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: other.color }} />
                            <span className="text-[11px] font-semibold truncate">{other.label}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GraphNode, GraphEdge } from '../../types/intelligence';
import { TargetNode, ProfileNode, ProjectNode, EventNode } from './CustomNodes';
import { Network, Filter, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { ConfidenceGauge } from '../shared/ConfidenceGauge';
import { motion, AnimatePresence } from 'framer-motion';

const nodeTypes = {
  target: TargetNode,
  profile: ProfileNode,
  project: ProjectNode,
  event: EventNode,
};

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightedId?: string | null;
  onHighlight?: (id: string) => void;
}

interface NodeDetailData {
  id: string;
  label: string;
  sublabel?: string | null;
  platform?: string | null;
  confidence?: number | null;
  url?: string | null;
  type: string;
  connectedEdges: GraphEdge[];
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  highlightedId,
  onHighlight,
}) => {
  const [selectedNode, setSelectedNode] = useState<NodeDetailData | null>(null);
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Get unique node types for filter
  const nodeTypesList = useMemo(() => Array.from(new Set(nodes.map((n) => n.type))), [nodes]);

  // Filter nodes by type
  const filteredNodes = useMemo(
    () => (typeFilters.size === 0 ? nodes : nodes.filter((n) => !typeFilters.has(n.type))),
    [nodes, typeFilters]
  );

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(
    () => edges.filter((e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)),
    [edges, filteredNodeIds]
  );

  const initialNodes = useMemo(() => {
    const typePositions: Record<string, { x: number; y: number; count: number }> = {
      target: { x: 400, y: 40, count: 0 },
      organization: { x: 720, y: 40, count: 0 },
      profile: { x: 80, y: 220, count: 0 },
      project: { x: 80, y: 400, count: 0 },
      event: { x: 520, y: 400, count: 0 },
      publication: { x: 760, y: 400, count: 0 },
      patent: { x: 900, y: 400, count: 0 },
    };

    return filteredNodes.map((n) => {
      const bucket = typePositions[n.type] || { x: 200, y: 300, count: 0 };
      const pos = {
        x: bucket.x + bucket.count * 210,
        y: bucket.y + (bucket.count % 2) * 30,
      };
      bucket.count += 1;

      const rfType =
        n.type === 'target' ? 'target' :
        n.type === 'profile' ? 'profile' :
        n.type === 'project' ? 'project' :
        n.type === 'event' ? 'event' :
        'profile';

      return {
        id: n.id,
        type: rfType,
        position: pos,
        data: {
          label: n.label,
          sublabel: n.sublabel,
          platform: n.platform,
          avatar: n.avatar,
          url: n.url,
          confidence: n.confidence,
          highlighted: highlightedId ? n.id.includes(highlightedId.replace('alias-', '')) : false,
        },
      };
    });
  }, [filteredNodes, highlightedId]);

  const initialEdges = useMemo(() => {
    return filteredEdges.map((e) => {
      const isRelated = !selectedNode || e.source === selectedNode.id || e.target === selectedNode.id;
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.relationship.replace(/_/g, ' '),
        type: 'smoothstep',
        animated: e.confidence >= 0.85 && isRelated,
        style: {
          stroke: e.confidence >= 0.85 ? '#10B981' : e.confidence >= 0.6 ? '#38BDF8' : '#F59E0B',
          strokeWidth: isRelated ? (e.confidence >= 0.85 ? 2 : 1.4) : 0.8,
          opacity: isRelated ? 1 : 0.2,
          transition: 'opacity 0.25s ease, stroke-width 0.25s ease',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: e.confidence >= 0.85 ? '#10B981' : '#38BDF8',
        },
        labelStyle: {
          fill: isRelated ? '#94A3B8' : '#475569',
          fontSize: 9,
          fontFamily: 'JetBrains Mono, monospace',
        },
        labelBgStyle: { fill: '#070b14', fillOpacity: isRelated ? 0.85 : 0.2 },
      };
    });
  }, [filteredEdges, selectedNode]);

  const [rfNodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onNodeClick = useCallback(
    (_: any, node: any) => {
      // Open detail panel instead of navigating away
      const connectedEdges = edges.filter(
        (e) => e.source === node.id || e.target === node.id
      );
      setSelectedNode({
        id: node.id,
        label: node.data?.label || 'Unknown',
        sublabel: node.data?.sublabel,
        platform: node.data?.platform,
        confidence: node.data?.confidence,
        url: node.data?.url,
        type: node.type || 'unknown',
        connectedEdges,
      });
      onHighlight?.(node.id);
    },
    [edges, onHighlight]
  );

  const toggleFilter = (type: string) => {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const typeColors: Record<string, string> = {
    target: 'text-cyan-400',
    profile: 'text-blue-400',
    project: 'text-emerald-400',
    event: 'text-amber-400',
    organization: 'text-violet-400',
    publication: 'text-sky-400',
    patent: 'text-fuchsia-400',
  };

  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  const onEdgeClick = useCallback(
    (_: any, edge: any) => {
      const fullEdge = edges.find((e) => e.id === edge.id);
      if (fullEdge) {
        setSelectedEdge(fullEdge);
        setSelectedNode(null);
      }
    },
    [edges]
  );

  return (
    <div className="cyber-card rounded-2xl border border-white/[0.08] overflow-hidden relative">
      {/* Header with controls */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between bg-[#090e1c]">
        <div className="flex items-center gap-2 text-white font-sans font-semibold text-xs tracking-tight">
          <Network className="w-4 h-4 text-blue-400" />
          <span>Interactive Relationship Topology Graph</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
              showFilters || typeFilters.size > 0
                ? 'bg-blue-600/20 border-blue-500/30 text-blue-300'
                : 'bg-slate-900 border-white/[0.08] text-slate-400 hover:text-white'
            }`}
          >
            <Filter className="w-3 h-3" />
            Filter{typeFilters.size > 0 ? ` (${typeFilters.size})` : ''}
          </button>

          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> ≥85% Verified</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> Correlated</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Unresolved</span>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-white/[0.04] bg-[#090e1c]"
          >
            <div className="px-4 py-2 flex flex-wrap gap-1.5">
              {nodeTypesList.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleFilter(type)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono border transition-all ${
                    typeFilters.has(type)
                      ? 'bg-slate-800 border-slate-600 text-slate-500 line-through'
                      : `bg-slate-900/80 border-slate-700 ${typeColors[type] || 'text-slate-300'}`
                  }`}
                >
                  {type}
                  <span className="text-slate-600">
                    ({nodes.filter((n) => n.type === type).length})
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Graph Canvas */}
      <div className="h-[640px] bg-[#070b14] relative">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          minZoom={0.4}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#172540" gap={22} />
          <MiniMap
            nodeColor={(n) =>
              n.type === 'target' ? '#3b82f6' :
              n.type === 'project' ? '#10B981' :
              n.type === 'event' ? '#F59E0B' : '#38BDF8'
            }
            maskColor="rgba(7,11,20,0.7)"
            style={{ background: '#0d1527' }}
          />
          <Controls showInteractive={false} />
        </ReactFlow>

        {/* Node Detail Panel — Slide in from right */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 360, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 360, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="absolute right-0 top-0 bottom-0 w-80 investigation-panel p-5 space-y-4 z-20 border-l border-white/[0.08]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider font-semibold">
                  {selectedNode.type} Entity details
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white font-sans">{selectedNode.label}</h4>
                {selectedNode.sublabel && (
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">{selectedNode.sublabel}</p>
                )}
              </div>

              {selectedNode.platform && (
                <div className="text-[11px] font-mono text-slate-400">
                  Platform: <span className="text-blue-300 font-semibold">{selectedNode.platform}</span>
                </div>
              )}

              {selectedNode.confidence != null && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.05]">
                  <ConfidenceGauge value={selectedNode.confidence * 100} size="sm" />
                  <div>
                    <span className="text-xs font-bold text-white font-sans">
                      {Math.round(selectedNode.confidence * 100)}% Confidence
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block">Attribution Weight</span>
                  </div>
                </div>
              )}

              {selectedNode.url && (
                <a
                  href={selectedNode.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Verified Source</span>
                </a>
              )}

              {/* Connected Relationships */}
              {selectedNode.connectedEdges.length > 0 && (
                <div className="pt-2 border-t border-white/[0.05]">
                  <h5 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 font-semibold">
                    Connected Relationships ({selectedNode.connectedEdges.length})
                  </h5>
                  <div className="space-y-2 evidence-chain">
                    {selectedNode.connectedEdges.map((edge) => (
                      <div
                        key={edge.id}
                        onClick={() => {
                          setSelectedEdge(edge);
                          setSelectedNode(null);
                        }}
                        className="evidence-chain-node text-xs text-slate-300 cursor-pointer hover:text-white group"
                      >
                        <span className="text-blue-300 font-medium group-hover:underline">
                          {edge.relationship.replace(/_/g, ' ')}
                        </span>
                        {edge.evidence_snippet && (
                          <p className="text-[11px] text-slate-400 mt-0.5 italic">"{edge.evidence_snippet}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edge Detail Panel — "WHY THIS RELATIONSHIP EXISTS" */}
        <AnimatePresence>
          {selectedEdge && (
            <motion.div
              initial={{ x: 360, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 360, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="absolute right-0 top-0 bottom-0 w-80 investigation-panel p-5 space-y-4 z-20 border-l border-white/[0.08]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  Relationship Provenance
                </span>
                <button
                  onClick={() => setSelectedEdge(null)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h4 className="text-xs font-mono uppercase text-slate-400 font-semibold">Why this link exists:</h4>
                <p className="text-sm font-bold text-white font-sans mt-1">
                  {selectedEdge.relationship.replace(/_/g, ' ')}
                </p>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  {selectedEdge.source} ➔ {selectedEdge.target}
                </p>
              </div>

              {/* Confidence Attribution */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/[0.05] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Attribution Strength</span>
                  <span className="text-sm font-bold text-white font-sans">
                    {Math.round(selectedEdge.confidence * 100)}% Provenance
                  </span>
                </div>
                <ConfidenceGauge value={Math.round(selectedEdge.confidence * 100)} size="sm" />
              </div>

              {/* Evidence Snippet */}
              {selectedEdge.evidence_snippet && (
                <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/20 text-xs text-slate-200">
                  <strong className="text-blue-300 block mb-1 font-semibold">Corroborating Signal:</strong>
                  <p className="leading-relaxed">{selectedEdge.evidence_snippet}</p>
                </div>
              )}

              {/* Source Link */}
              {selectedEdge.source_url && (
                <div>
                  <a
                    href={selectedEdge.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Originating Source Record</span>
                  </a>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

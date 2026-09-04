import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface WorkflowGraphProps {
  lastTransition?: { from?: string; to: string; timestamp: number };
}

interface Counts {
  접수: number;
  pending: number;
  판정: number;
  confirmed_auto: number;
  confirmed_human: number;
  review: number;
  rejected: number;
  asking: number;
}

const NODES = [
  { id: 'received', label: '접수', x: 50, y: 50, color: 'bg-slate-400' },
  { id: 'pending', label: '대기', x: 150, y: 50, color: 'bg-slate-400' },
  { id: 'judge', label: '판정', x: 250, y: 50, color: 'bg-white border-2 border-black' },
  { id: 'confirmed_auto', label: '확정-자동', x: 100, y: 150, color: 'bg-emerald-400' },
  { id: 'confirmed_human', label: '확정-수동', x: 250, y: 150, color: 'bg-emerald-400 border-2 border-emerald-600' },
  { id: 'review', label: '검토', x: 400, y: 150, color: 'bg-yellow-400' },
  { id: 'rejected', label: '기각', x: 250, y: 250, color: 'bg-red-400' },
  { id: 'asking', label: '질문', x: 400, y: 50, color: 'bg-blue-400' },
];

const EDGES = [
  { from: 'received', to: 'pending' },
  { from: 'pending', to: 'judge' },
  { from: 'judge', to: 'confirmed_auto' },
  { from: 'judge', to: 'confirmed_human' },
  { from: 'judge', to: 'review' },
  { from: 'judge', to: 'rejected' },
  { from: 'judge', to: 'asking' },
  { from: 'review', to: 'confirmed_human' },
  { from: 'asking', to: 'pending' },
  { from: 'confirmed_human', to: 'pending' },
];

export default function WorkflowGraph({ lastTransition }: WorkflowGraphProps) {
  const [counts, setCounts] = useState<Counts>({
    접수: 0,
    pending: 0,
    판정: 0,
    confirmed_auto: 0,
    confirmed_human: 0,
    review: 0,
    rejected: 0,
    asking: 0,
  });
  const [highlightedEdge, setHighlightedEdge] = useState<string | null>(null);

  useEffect(() => {
    fetchCounts();

    const channel = supabase.channel('bookings-board-workflow');
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (lastTransition) {
      const edgeKey = `${lastTransition.from}-${lastTransition.to}`;
      setHighlightedEdge(edgeKey);
      const timer = setTimeout(() => setHighlightedEdge(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastTransition]);

  const fetchCounts = async () => {
    const { data, error } = await supabase.from('bookings').select('decision');

    if (error) {
      console.error('Error fetching counts:', error);
      return;
    }

    const bookings = (data || []) as Array<{ decision?: string }>;
    const newCounts: Counts = {
      접수: bookings.filter((b) => !b.decision).length,
      pending: bookings.filter((b) => b.decision === 'pending').length,
      판정: 0,
      confirmed_auto: bookings.filter((b) => b.decision === 'confirmed_auto').length,
      confirmed_human: bookings.filter((b) => b.decision === 'confirmed_human').length,
      review: bookings.filter((b) => b.decision === 'review').length,
      rejected: bookings.filter((b) => b.decision === 'rejected').length,
      asking: bookings.filter((b) => b.decision === 'asking').length,
    };

    setCounts(newCounts);
  };

  const getNodeById = (id: string) => NODES.find((n) => n.id === id);

  const renderArrow = (from: string, to: string, isHighlighted: boolean) => {
    const fromNode = getNodeById(from);
    const toNode = getNodeById(to);
    if (!fromNode || !toNode) return null;

    const x1 = fromNode.x + 30;
    const y1 = fromNode.y + 30;
    const x2 = toNode.x + 30;
    const y2 = toNode.y + 30;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);

    const arrowLength = 15;
    const arrowX = x2 - arrowLength * Math.cos(angle);
    const arrowY = y2 - arrowLength * Math.sin(angle);

    return (
      <g key={`${from}-${to}`}>
        <line
          x1={x1}
          y1={y1}
          x2={arrowX}
          y2={arrowY}
          stroke={isHighlighted ? '#10b981' : '#cbd5e1'}
          strokeWidth={isHighlighted ? 3 : 1}
          markerEnd="url(#arrowhead)"
          opacity={isHighlighted ? 1 : 0.5}
        />
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* 워크플로 그래프 */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">워크플로</h3>
        <svg width="100%" height="500" viewBox="0 0 550 350" className="bg-slate-900/30 rounded-lg">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#cbd5e1" />
            </marker>
          </defs>

          {/* 엣지 */}
          {EDGES.map((edge) => {
            const edgeKey = `${edge.from}-${edge.to}`;
            const isHighlighted = highlightedEdge === edgeKey;
            return renderArrow(edge.from, edge.to, isHighlighted);
          })}

          {/* 노드 */}
          {NODES.map((node) => {
            const colorMap: Record<string, string> = {
              'bg-slate-400': '#78716c',
              'bg-white border-2 border-black': '#ffffff',
              'bg-emerald-400': '#4ade80',
              'bg-emerald-400 border-2 border-emerald-600': '#4ade80',
              'bg-yellow-400': '#facc15',
              'bg-red-400': '#f87171',
              'bg-blue-400': '#60a5fa',
            };
            const fill = colorMap[node.color] || '#ffffff';
            const isWhite = node.color.includes('white');

            return (
              <g key={node.id}>
                <circle
                  cx={node.x + 30}
                  cy={node.y + 30}
                  r="30"
                  fill={fill}
                  stroke={isWhite ? '#000000' : 'none'}
                  strokeWidth={isWhite ? 2 : 0}
                  opacity="0.9"
                />
                <text
                  x={node.x + 30}
                  y={node.y + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill={isWhite ? '#000000' : '#000000'}
                >
                  {node.label}
                </text>
                <text
                  x={node.x + 30}
                  y={node.y + 38}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="bold"
                  fill={isWhite ? '#000000' : '#000000'}
                >
                  {counts[node.id as keyof Counts] || 0}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import { 
  Sword, 
  Activity, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Zap,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { PredictionResult } from '../types';
import { cn, formatPercent } from '../utils';

interface ComparisonGridProps {
  data: PredictionResult[];
  isFetching: boolean;
  onBack: () => void;
}

export const ComparisonGrid: React.FC<ComparisonGridProps> = ({
  data,
  isFetching,
  onBack
}) => {
  if (isFetching) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-8">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full border-t-2 border-r-2 border-football-green/30"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sword className="w-8 h-8 text-football-green animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Assembling Combat Grid</h2>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-2 animate-pulse">Synchronizing multi-node inference streams...</p>
        </div>
      </div>
    );
  }

  const avgEdge = data.reduce((acc, curr) => acc + curr.orchestration.edge.calculated_edge, 0) / data.length;
  const totalKelly = data.reduce((acc, curr) => acc + curr.orchestration.edge.kelly_stake, 0);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-20"
    >
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">Tactical Deployment Matrix</h2>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest italic">Grid Size: {data.length} Nodes Operational</p>
        </div>
        <button onClick={onBack} className="text-[10px] font-mono text-football-green hover:text-emerald-400 uppercase tracking-widest flex items-center gap-2 px-4 py-2 bg-football-green/5 rounded-lg border border-football-green/10 transition-all font-black">
          <Zap className="w-3 h-3" /> Reconfigure Selection
        </button>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="oracle-glass p-6 rounded-2xl flex flex-col justify-between h-32 border-football-green/20">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Portfolio Alpha Edge</span>
          <div className="text-3xl font-black text-football-green">+{formatPercent(avgEdge)}</div>
        </div>
        <div className="oracle-glass p-6 rounded-2xl flex flex-col justify-between h-32 border-emerald-500/20">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Aggregate Kelly Limit</span>
          <div className="text-3xl font-black text-emerald-400">{totalKelly.toFixed(2)}%</div>
        </div>
        <div className="oracle-glass p-6 rounded-2xl flex flex-col justify-between h-32 border-amber-500/20">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Consensus Confidence</span>
          <div className="text-3xl font-black text-amber-400">OPTIMAL</div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="oracle-glass rounded-3xl overflow-hidden border-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="py-4 px-6 text-[10px] font-mono text-gray-500 uppercase">Fixture Node</th>
              <th className="py-4 px-6 text-[10px] font-mono text-gray-500 uppercase">Win Distribution (H-D-A)</th>
              <th className="py-4 px-6 text-[10px] font-mono text-gray-500 uppercase">Conflict Alert</th>
              <th className="py-4 px-6 text-[10px] font-mono text-gray-500 uppercase">Alpha Edge</th>
              <th className="py-4 px-6 text-[10px] font-mono text-gray-500 uppercase">Engine Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((match, i) => (
              <tr key={i} className="hover:bg-white/5 transition-all group">
                <td className="py-6 px-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white italic group-hover:text-football-green transition-colors uppercase">
                       {match.fixture.home} <span className="text-[10px] font-mono text-gray-600 not-italic mx-1">VS</span> {match.fixture.away}
                    </span>
                    <span className="text-[9px] font-mono text-gray-500 uppercase mt-1">{match.fixture.league}</span>
                  </div>
                </td>
                <td className="py-6 px-6 max-w-[200px]">
                   <div className="flex h-3 gap-1 rounded overflow-hidden">
                      <div style={{ width: `${match.orchestration.final_probabilities.home * 100}%` }} className="bg-football-green" />
                      <div style={{ width: `${match.orchestration.final_probabilities.draw * 100}%` }} className="bg-gray-800" />
                      <div style={{ width: `${match.orchestration.final_probabilities.away * 100}%` }} className="bg-rose-600" />
                   </div>
                   <div className="flex justify-between mt-2 text-[9px] font-mono text-gray-500">
                      <span>{formatPercent(match.orchestration.final_probabilities.home)}</span>
                      <span>{formatPercent(match.orchestration.final_probabilities.draw)}</span>
                      <span>{formatPercent(match.orchestration.final_probabilities.away)}</span>
                   </div>
                </td>
                <td className="py-6 px-6">
                   {match.orchestration.conflict_detected ? (
                     <div className="flex items-center gap-2 text-rose-400">
                        <AlertTriangle className="w-4 h-4 animate-pulse" />
                        <span className="text-[10px] font-mono font-bold uppercase">Delta Divergence</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-2 text-emerald-400">
                        <Activity className="w-4 h-4" />
                        <span className="text-[10px] font-mono font-bold uppercase">Alignment</span>
                     </div>
                   )}
                </td>
                <td className="py-6 px-6">
                   <div className={cn(
                     "text-sm font-black italic",
                     match.orchestration.edge.calculated_edge > 0.1 ? "text-emerald-400" : "text-amber-400"
                   )}>
                      +{formatPercent(match.orchestration.edge.calculated_edge)}
                   </div>
                </td>
                <td className="py-6 px-6 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-xs font-bold text-white uppercase italic">{match.orchestration.edge.outcome}</span>
                    <div className="p-2 bg-football-green rounded-lg group-hover:scale-110 transition-transform">
                      <ChevronRight className="w-4 h-4 text-black" />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Safe-Picks */}
      <div className="p-8 oracle-glass rounded-3xl border-emerald-500/20 bg-emerald-500/[0.02]">
         <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-500/10 rounded-2xl"><Target className="w-6 h-6 text-emerald-400" /></div>
            <div>
               <h3 className="text-lg font-black text-white italic uppercase tracking-widest">Consensus Core Portfolio</h3>
               <p className="text-[10px] font-mono text-gray-500 uppercase">Engine identification of lowest entropy outcomes</p>
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.filter(m => !m.orchestration.conflict_detected && m.orchestration.edge.calculated_edge > 0.05).map((m, i) => (
              <div key={i} className="p-4 bg-black/40 border border-emerald-500/20 rounded-2xl flex items-center justify-between group hover:border-emerald-500/50 transition-all">
                 <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-white uppercase">{m.fixture.home} / {m.fixture.away}</span>
                    <span className="text-[9px] font-mono text-emerald-500 uppercase">Selection: {m.orchestration.edge.outcome}</span>
                 </div>
                 <div className="p-2 bg-emerald-500/20 rounded-full">
                    <Zap className="w-3 h-3 text-emerald-400" />
                 </div>
              </div>
            ))}
         </div>
      </div>
    </motion.div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Radar, 
  Zap, 
  UserPlus, 
  Activity, 
  AlertTriangle,
  ArrowRight,
  Target
} from 'lucide-react';
import { cn } from '../utils';

interface IntelligenceQueryResult {
  type: 'recruitment' | 'signal' | 'cascade';
  title: string;
  items: any[];
}

export const ThreatMonitor: React.FC = () => {
  const [activeQuery, setActiveQuery] = useState<'recruitment' | 'signal' | 'cascade'>('recruitment');
  const [loading, setLoading] = useState(false);

  const getQueryData = () => {
    switch (activeQuery) {
      case 'recruitment':
        return [
          { name: 'Marcus R.', role: 'Linesman', score: 0.82, vector: 'Late wage payment + High Grooming index' },
          { name: 'Lukas K.', role: 'Player', score: 0.74, vector: 'Social proximity to FIXER_ALPHA (3 hits)' },
          { name: 'S. Gvardiol', role: 'Coach', score: 0.61, vector: 'Recent tactical influence deviation' }
        ];
      case 'signal':
        return [
          { match: 'LIV vs MCI', target: 'Ref A.', signal: 'Blue Hat / Handshake', confidence: 0.88 },
          { match: 'ARS vs TOT', target: 'D. Luiz', signal: 'Early Sub (Pre-60)', confidence: 0.72 }
        ];
      case 'cascade':
        return [
          { match: 'MUN vs AVL', risk: 0.79, factor: 'Cascade count >= 2 detected in yellow card market' },
          { match: 'NEW vs CHE', risk: 0.65, factor: 'Anomalous liquidity shift (Reverse Move)' }
        ];
      default:
        return [];
    }
  };

  const data = getQueryData();

  return (
    <div className="space-y-8">
      {/* Query Selector Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { id: 'recruitment', icon: UserPlus, label: 'Integrity Scout', desc: 'Behavioral Monitoring' },
          { id: 'signal', icon: Target, label: 'Live Signals', desc: 'Broadcasting Pulse' },
          { id: 'cascade', icon: Activity, label: 'Structural Risk', desc: 'Pattern Divergence' }
        ].map((q) => (
          <button
            key={q.id}
            onClick={() => setActiveQuery(q.id as any)}
            className={cn(
              "p-6 rounded-3xl border transition-all text-left space-y-3",
              activeQuery === q.id 
                ? "bg-rose-500/10 border-rose-500/50 shadow-2xl shadow-rose-500/10" 
                : "bg-black/40 border-white/5 hover:border-white/10"
            )}
          >
            <div className={cn("p-2 w-fit rounded-lg", activeQuery === q.id ? "bg-rose-500/20" : "bg-white/5")}>
              <q.icon className={cn("w-5 h-5", activeQuery === q.id ? "text-rose-500" : "text-gray-500")} />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest">{q.label}</p>
              <p className="text-[10px] text-gray-500 font-mono mt-1">{q.desc}</p>
            </div>
            {activeQuery === q.id && (
              <motion.div layoutId="activeThreat" className="h-1 bg-rose-500 rounded-full mt-4" />
            )}
          </button>
        ))}
      </div>

      {/* Intelligence Feed */}
      <div className="oracle-glass p-8 rounded-3xl border-rose-500/10 min-h-[400px]">
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-3">
              <Radar className="w-5 h-5 text-football-green" />
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Intelligence Matrix: {activeQuery.toUpperCase()}</h3>
           </div>
           <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-football-green animate-pulse" />
              <span className="text-[10px] font-mono text-football-green uppercase">Broadcasting Live</span>
           </div>
        </div>

        <div className="space-y-4">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeQuery}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-3"
             >
                {data.map((item, i) => (
                  <div key={i} className="p-5 bg-black/40 border border-white/5 rounded-2xl flex justify-between items-center group hover:border-rose-500/30 transition-all">
                    <div className="flex gap-6 items-center">
                       <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                          <span className="text-[10px] font-black text-rose-500">#{i+1}</span>
                       </div>
                       <div className="space-y-1">
                          <p className="text-sm font-bold text-white uppercase tracking-tight">
                            {activeQuery === 'recruitment' ? item.name : item.match}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono uppercase">
                            {activeQuery === 'recruitment' ? item.role : activeQuery === 'signal' ? `Target: ${item.target}` : item.factor}
                          </p>
                       </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                       <div className="flex items-center gap-3">
                          <div className="text-right">
                             <p className="text-[9px] text-gray-600 uppercase font-mono">Risk Weight</p>
                             <p className="text-sm font-black text-rose-500 italic">
                                {activeQuery === 'recruitment' ? item.score.toFixed(2) : activeQuery === 'signal' ? item.confidence.toFixed(2) : item.risk.toFixed(2)}
                             </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-rose-500 transition-colors" />
                       </div>
                       {activeQuery === 'recruitment' && (
                         <span className="px-2 py-0.5 bg-rose-500/5 text-[9px] text-rose-400 font-mono italic border border-rose-500/20 rounded">
                           {item.vector}
                         </span>
                       )}
                       {activeQuery === 'signal' && (
                         <span className="px-2 py-0.5 bg-amber-500/5 text-[9px] text-amber-400 font-mono italic border border-amber-500/20 rounded">
                           Signal: {item.signal}
                         </span>
                       )}
                    </div>
                  </div>
                ))}
             </motion.div>
           </AnimatePresence>
        </div>

        {data.length === 0 && (
          <div className="py-20 text-center opacity-20">
            <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
            <p className="text-xs font-mono uppercase tracking-widest">No critical threats detected in current segment</p>
          </div>
        )}
      </div>
    </div>
  );
};

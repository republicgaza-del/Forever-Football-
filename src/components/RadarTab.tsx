import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Radar, 
  Zap, 
  Filter, 
  ChevronRight, 
  Check, 
  Activity,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../utils';

interface RadarTabProps {
  fixtures: any[];
  scanning: boolean;
  onScan: () => void;
  onLoadMore: () => void;
  filterState: any;
  setFilterState: (state: any) => void;
  selectedMatchIds: string[];
  setSelectedMatchIds: (ids: string[]) => void;
  onSelectFixture: (f: any) => void;
  onStartComparison: () => void;
  isFetchingComparison: boolean;
}

export const RadarTab: React.FC<RadarTabProps> = ({
  fixtures,
  scanning,
  onScan,
  onLoadMore,
  filterState,
  setFilterState,
  selectedMatchIds,
  setSelectedMatchIds,
  onSelectFixture,
  onStartComparison,
  isFetchingComparison
}) => {
  const toggleMatchSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMatchIds(
      selectedMatchIds.includes(id) 
        ? selectedMatchIds.filter(mid => mid !== id) 
        : [...selectedMatchIds, id]
    );
  };

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !scanning && fixtures.length > 0) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    const currentTarget = observerTarget.current;
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [scanning, fixtures.length, onLoadMore]);

  return (
    <motion.div
      key="radar-tab"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter flex items-center gap-3">
            <Radar className="w-8 h-8 text-football-green animate-pulse" />
            Live Search Matrix
          </h2>
          <p className="text-[10px] font-mono text-gray-500 uppercase mt-1 italic">Tracking 24/7 • Real-Time Broadcast Sync</p>
        </div>
        <button 
          onClick={onScan} 
          disabled={scanning}
          className="px-8 py-3 bg-football-green hover:bg-emerald-500 text-black rounded-xl font-black text-[10px] tracking-widest transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 flex items-center gap-2"
        >
          {scanning ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          FORCE RE-SCAN
        </button>
      </div>

      {/* Grid Filters */}
      <div className="flex flex-wrap items-center gap-6 p-6 oracle-glass border-football-green/10 rounded-3xl">
        <div className="flex items-center gap-2 pr-6 border-r border-white/5">
          <Filter className="w-5 h-5 text-football-green" />
          <span className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-widest italic">Matrix Filters</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono text-gray-600 uppercase">Significance Threshold</span>
          <div className="flex gap-2">
            {['All', 'High', 'Medium'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterState({ ...filterState, significance: s })}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black border transition-all uppercase tracking-widest italic",
                  filterState.significance === s 
                    ? "bg-football-green/20 border-football-green text-white" 
                    : "bg-black/40 border-gray-800 text-gray-500 hover:border-gray-600"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 border-l border-white/5">
          <span className="text-[10px] font-mono text-gray-600 uppercase">Volatility Limit ({filterState.minVolatility}%)</span>
          <input 
            type="range" min="0" max="90" step="10"
            value={filterState.minVolatility}
            onChange={(e) => setFilterState({ ...filterState, minVolatility: parseInt(e.target.value) })}
            className="w-32 accent-football-green"
          />
        </div>

        <div className="flex items-center gap-6 ml-auto">
          <button
            onClick={() => setSelectedMatchIds([])}
            disabled={selectedMatchIds.length === 0}
            className="text-[10px] font-mono text-gray-600 hover:text-white uppercase tracking-widest transition-colors disabled:opacity-30"
          >
            Clear Selected ({selectedMatchIds.length})
          </button>
          <button
            onClick={onStartComparison}
            disabled={selectedMatchIds.length < 2 || isFetchingComparison}
            className={cn(
              "px-8 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all flex items-center gap-3",
              selectedMatchIds.length >= 2
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl shadow-emerald-600/30"
                : "bg-gray-900 text-gray-700 cursor-not-allowed border border-white/5"
            )}
          >
            {isFetchingComparison ? <Activity className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            INITIATE TACTICAL COMPARE ({selectedMatchIds.length})
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {fixtures.map((fix) => {
          const isSelected = selectedMatchIds.includes(fix.id);
          return (
            <div key={fix.id} className="relative group">
              <button
                onClick={() => onSelectFixture(fix)}
                className={cn(
                  "w-full oracle-glass p-8 rounded-3xl border transition-all text-left relative overflow-hidden h-full flex flex-col justify-between",
                  isSelected ? "border-emerald-500/50 bg-emerald-500/5" : "border-football-green/10 hover:border-football-green/40"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-2">
                    {fix.league && (
                       <div className="flex items-center gap-2">
                         <img src={`https://tse2.mm.bing.net/th?q=${encodeURIComponent(fix.league + " logo transparent")}&w=32&h=32&c=7&rs=1`} alt={fix.league} className="w-4 h-4 object-contain brightness-90 contrast-125 saturate-0 group-hover:saturate-100 transition-all opacity-80" />
                         <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none truncate max-w-[140px]">{fix.league}</span>
                       </div>
                    )}
                    <span className="text-[10px] font-mono text-gray-600 uppercase tabular-nums">
                      {(() => {
                        try {
                          const d = new Date(fix.date);
                          return isNaN(d.getTime()) ? fix.date : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                        } catch(e) {
                          return fix.date;
                        }
                      })()}
                    </span>
                  </div>
                  <div className={cn(
                    "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0",
                    fix.significance === 'High' ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                    fix.significance === 'Medium' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                    "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                  )}>
                    {fix.significance}
                  </div>
                </div>
                
                <div className="space-y-4 mb-8 mt-4">
                  <div className="flex items-center gap-3">
                    <img src={`https://tse2.mm.bing.net/th?q=${encodeURIComponent(fix.home + " football crest transparent")}&w=64&h=64&c=7&rs=1`} alt={fix.home} className="w-8 h-8 object-contain drop-shadow-md" />
                    <div className="text-lg font-black text-white italic group-hover:text-football-green transition-colors leading-none uppercase">{fix.home}</div>
                  </div>
                  <div className="text-[9px] text-gray-700 font-mono italic uppercase tracking-tighter ml-11">vs</div>
                  <div className="flex items-center gap-3">
                    <img src={`https://tse2.mm.bing.net/th?q=${encodeURIComponent(fix.away + " football crest transparent")}&w=64&h=64&c=7&rs=1`} alt={fix.away} className="w-8 h-8 object-contain drop-shadow-md" />
                    <div className="text-lg font-black text-white italic group-hover:text-football-green transition-colors leading-none uppercase">{fix.away}</div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                   <div className="flex items-center justify-between">
                     <span className="text-[9px] font-mono text-gray-600 uppercase">Conflict Logic</span>
                     <span className={cn("text-[9px] font-bold uppercase", fix.expected_conflict ? "text-red-400" : "text-emerald-400")}>
                        {fix.expected_conflict ? 'Probable' : 'Minimal'}
                     </span>
                   </div>
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <div className="w-16 h-1 bg-gray-900 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${fix.volatility_score}%` }}
                           className="h-full bg-football-green/50 shadow-[0_0_8px_rgba(34,197,94,0.3)]" 
                         />
                       </div>
                       <span className="text-[9px] font-mono text-gray-600 tabular-nums">{fix.volatility_score}%</span>
                     </div>
                     <ChevronRight className="w-4 h-4 text-gray-800 group-hover:text-football-green transition-all translate-x-0 group-hover:translate-x-1" />
                   </div>
                </div>
              </button>
              
              <button
                onClick={(e) => toggleMatchSelection(fix.id, e)}
                className={cn(
                  "absolute top-4 right-4 p-2 rounded-xl transition-all z-10",
                  isSelected 
                    ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/40 opacity-100" 
                    : "bg-black/60 text-transparent border border-white/10 hover:border-white/30 opacity-0 group-hover:opacity-100"
                )}
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Infinite scrolling target */}
      <div ref={observerTarget} className="h-1 w-full" />
      
      {fixtures.length > 0 && (
        <div className="flex justify-center pt-8 pb-12">
          <button
            onClick={onLoadMore}
            disabled={scanning}
            className="px-16 py-5 bg-black border border-white/10 hover:border-football-green/50 rounded-2xl text-xs font-black text-gray-400 hover:text-white uppercase tracking-[0.3em] transition-all group flex items-center gap-4 shadow-2xl relative overflow-hidden italic"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Zap className={cn("w-5 h-5 text-football-green", scanning && "animate-pulse")} />
            {scanning ? "Calibrating Neural Range..." : "Extend Search Horizon"}
          </button>
        </div>
      )}
    </motion.div>
  );
};

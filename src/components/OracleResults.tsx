import React from 'react';
import { motion } from 'motion/react';
import { 
  Brain, 
  Target, 
  Share2, 
  Activity, 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Zap, 
  AlertCircle,
  History,
  User,
  Search,
  Cpu,
  LogIn,
  ShieldAlert,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { PredictionResult, BrainType } from '../types';
import { cn, formatPercent, getOutcomeLabel } from '../utils';
import { TacticalVerdictDisplay } from './TacticalVerdictDisplay';
import { ScrapperStatus } from './ScrapperStatus';

interface OracleResultsProps {
  prediction: PredictionResult;
  user: any;
  sharing: boolean;
  shareUrl: string | null;
  copied: boolean;
  onShare: () => void;
  onCopy: () => void;
  onSignIn: () => void;
  feedbackState: any;
  setFeedbackState: (state: any) => void;
  submitFeedback: () => void;
  onRegenerateConflictExplanation: () => void;
}

const FactorItem: React.FC<{ factor: any, index: number }> = ({ factor, index }) => {
  const [expanded, setExpanded] = React.useState(false);
  const hasDetail = !!factor.detailed_explanation;
  
  return (
    <div className="flex gap-4 items-start group">
       <div className={cn("mt-1 w-2 h-2 rounded-full",
         factor.impact === 'High' ? 'bg-rose-500' :
         factor.impact === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
       )} />
       <div className="flex-1">
         <div className="flex justify-between items-center">
           <p className="text-xs font-bold text-white uppercase">{factor.factor}</p>
           {hasDetail && (
             <button
               onClick={() => setExpanded(!expanded)}
               className={cn("text-[9px] font-bold uppercase transition-colors", expanded ? "text-gray-500 hover:text-gray-400" : "text-rose-500/70 hover:text-rose-500")}
             >
               {expanded ? 'Hide Details' : 'View Details'}
             </button>
           )}
         </div>
         <p className="text-[10px] text-gray-500 font-mono mt-0.5">{factor.description}</p>
         {expanded && hasDetail && (
           <motion.div 
             initial={{ height: 0, opacity: 0 }} 
             animate={{ height: 'auto', opacity: 1 }}
             className="mt-2 p-3 bg-black/50 border border-violet-500/30 rounded-xl text-[10px] text-gray-300 font-mono italic leading-relaxed"
           >
             {factor.detailed_explanation}
           </motion.div>
         )}
       </div>
    </div>
  );
};

export const OracleResults: React.FC<OracleResultsProps> = ({
  prediction,
  user,
  sharing,
  shareUrl,
  copied,
  onShare,
  onCopy,
  onSignIn,
  feedbackState,
  setFeedbackState,
  submitFeedback,
  onRegenerateConflictExplanation
}) => {
  const [expandedReferee, setExpandedReferee] = React.useState(false);
  const [expandedConflict, setExpandedConflict] = React.useState(false);
  const [expandedMissingPoints, setExpandedMissingPoints] = React.useState<Record<number, boolean>>({});

  const winDistData = [
    { name: 'Home', value: prediction.h2h_history?.summary?.home_wins || 0, color: '#8b5cf6' },
    { name: 'Draw', value: prediction.h2h_history?.summary?.draws || 0, color: '#4b5563' },
    { name: 'Away', value: prediction.h2h_history?.summary?.away_wins || 0, color: '#f43f5e' }
  ];

  const goalsData = prediction.h2h_history?.last_5_meetings?.map((m, i) => {
    const goals = m.score.split('-').reduce((a, b) => parseInt(a) + parseInt(b), 0);
    return { name: `M${i+1}`, goals };
  }) || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      {/* Header with Share Button */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">
            {prediction.fixture.home} <span className="text-violet-500 font-mono not-italic text-sm mx-2">VS</span> {prediction.fixture.away}
          </h2>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-2">{prediction.fixture.league} • Node Synchronized</p>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <button 
              onClick={onShare}
              disabled={sharing}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-gray-400 hover:text-white transition-all flex items-center gap-2"
            >
              {sharing ? <Activity className="w-4 h-4 animate-spin text-violet-400" /> : <Share2 className="w-4 h-4 text-violet-400" />}
              SHARE INTEL
            </button>
          ) : (
            <button 
              onClick={onSignIn}
              className="px-6 py-2.5 bg-violet-600/10 border border-violet-500/20 rounded-xl text-[10px] font-bold text-violet-400 hover:bg-violet-600/20 transition-all flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" /> AUTH TO SHARE
            </button>
          )}
        </div>
      </div>

      {shareUrl && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="p-4 oracle-glass border-violet-500/30 rounded-2xl flex items-center gap-4"
        >
          <div className="flex-1 truncate text-xs font-mono text-violet-300">{shareUrl}</div>
          <button onClick={onCopy} className="px-4 py-2 bg-violet-600 rounded-xl text-[10px] font-bold text-white flex items-center gap-2">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'COPIED' : 'COPY'}
          </button>
        </motion.div>
      )}

      {/* Main Verdict */}
      <TacticalVerdictDisplay prediction={prediction} />

      {/* Probability Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 oracle-glass p-8 rounded-3xl relative overflow-hidden">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest italic">Probability Vector Matrix</h3>
              <div className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase border flex items-center gap-2",
                prediction.orchestration.conflict_detected 
                  ? "bg-red-500/10 border-red-500/30 text-red-400" 
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              )}>
                 {prediction.orchestration.conflict_detected ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                 {prediction.orchestration.conflict_detected ? 'Conflict Triggered' : 'Double Consensus'}
              </div>
           </div>

           {prediction.orchestration.conflict_detected && prediction.orchestration.conflict_note && (
             <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                <button
                  onClick={() => setExpandedConflict(!expandedConflict)}
                  className="w-full text-left flex justify-between items-center"
                >
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    Orchestration Conflict Detail
                  </span>
                  <span className="text-[10px] text-red-500/70">{expandedConflict ? 'Hide' : 'Expand'}</span>
                </button>
                <div className="flex justify-end gap-2 mt-2">
                   <button 
                     onClick={(e) => { e.stopPropagation(); onRegenerateConflictExplanation(); }}
                     className="text-[10px] text-red-400 hover:text-white transition-colors uppercase tracking-widest font-bold"
                   >
                     Regenerate
                   </button>
                </div>
                {expandedConflict && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-3 text-[11px] text-red-200/80 font-mono italic leading-relaxed"
                  >
                    {prediction.orchestration.conflict_note}
                  </motion.div>
                )}
             </div>
           )}

           <div className="grid grid-cols-3 gap-6">
              {['home', 'draw', 'away'].map((o) => {
                const p = prediction.orchestration.final_probabilities[o as keyof typeof prediction.orchestration.final_probabilities];
                const isSelection = prediction.orchestration.edge.outcome === o;
                return (
                  <div key={o} className={cn(
                    "p-6 rounded-3xl border transition-all flex flex-col justify-between h-48 relative overflow-hidden",
                    isSelection ? "bg-violet-600/10 border-violet-500 shadow-2xl shadow-violet-500/20" : "bg-black/40 border-gray-800"
                  )}>
                    {isSelection && <Target className="absolute top-4 right-4 w-5 h-5 text-violet-500" />}
                    <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">{o}</span>
                    <div className="space-y-4">
                      <span className="text-4xl font-black text-white italic">{formatPercent(p)}</span>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${p * 100}%` }}
                          className={cn("h-full", isSelection ? "bg-violet-500" : "bg-gray-700")} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>

        <div className="oracle-glass p-8 rounded-3xl border-emerald-500/10 flex flex-col justify-between">
           <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest italic mb-1">Market Alpha Edge</h3>
              <p className="text-[10px] font-mono text-gray-600 uppercase">Extraction Logic: v5.2</p>
           </div>
           
           <div className="my-10">
              <div className="text-6xl font-black text-emerald-400 italic">
                 +{formatPercent(prediction.orchestration.edge.calculated_edge)}
              </div>
              <p className="text-[11px] font-mono text-gray-500 mt-4 uppercase">Expected Value Alpha (EVA)</p>
           </div>

           <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                 <span className="text-gray-500 uppercase">Selection</span>
                 <span className="text-white font-bold uppercase">{prediction.orchestration.edge.outcome}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono">
                 <span className="text-gray-500 uppercase">Kelly Ratio</span>
                 <span className="text-emerald-400 font-bold">{prediction.orchestration.edge.kelly_stake.toFixed(2)}%</span>
              </div>
           </div>
        </div>
      </div>

      {/* Dual Brain breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="oracle-glass p-8 rounded-3xl border-amber-500/10 space-y-8">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-amber-500/10 rounded-lg"><Brain className="w-5 h-5 text-amber-500" /></div>
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">QPE Results</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-black/40 border border-gray-800 rounded-2xl">
                  <span className="text-[9px] font-mono text-gray-600 block uppercase mb-1">Form Volatility</span>
                  <span className="text-xl font-bold text-white tracking-widest">DECAY-H2</span>
               </div>
               <div className="p-4 bg-black/40 border border-gray-800 rounded-2xl">
                  <span className="text-[9px] font-mono text-gray-600 block uppercase mb-1">Psych Bias</span>
                  <span className="text-xl font-bold text-white tracking-widest">NULLIFIED</span>
               </div>
            </div>

            <div className="space-y-3">
               <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block ml-1 underline decoration-amber-500/30">Qualitative Insights</span>
               <p className="text-xs text-gray-400 leading-relaxed italic border-l-2 border-amber-500/30 pl-4">
                  {prediction.qpe_outputs.dual_lens_analysis.synthesis}
               </p>
            </div>

            {prediction.qpe_outputs.key_player_notes && prediction.qpe_outputs.key_player_notes.length > 0 && (
              <div className="space-y-3 border-t border-white/5 pt-6">
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block ml-1 underline decoration-amber-500/30">Key Player Notes</span>
                {prediction.qpe_outputs.key_player_notes.map((note, i) => (
                  <div key={i} className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-bold text-white">{note.name} <span className="text-[9px] text-gray-500">({note.team === 'home' ? prediction.fixture.home : prediction.fixture.away})</span></span>
                       <div className={cn("flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded",
                         note.psych_impact === 'Positive' ? 'text-emerald-500 bg-emerald-500/10' :
                         note.psych_impact === 'Negative' ? 'text-rose-500 bg-rose-500/10' : 'text-gray-400 bg-gray-500/10'
                       )}>
                         {note.psych_impact === 'Positive' && <CheckCircle2 className="w-3 h-3" />}
                         {note.psych_impact === 'Negative' && <AlertTriangle className="w-3 h-3" />}
                         {note.psych_impact === 'Neutral' && <Info className="w-3 h-3" />}
                         {note.psych_impact}
                       </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono italic leading-relaxed">{note.note}</p>
                  </div>
                ))}
              </div>
            )}
         </div>

         <div className="oracle-glass p-8 rounded-3xl border-cyan-500/10 space-y-8">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-cyan-500/10 rounded-lg"><Cpu className="w-5 h-5 text-cyan-500" /></div>
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">XSE Structural</h3>
            </div>

            <div className="h-48 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prediction.xse_outputs.top_features.slice(0, 6)} layout="vertical">
                     <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={true} vertical={false} />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={9} fontFamily="JetBrains Mono" width={100} />
                     <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                        {prediction.xse_outputs.top_features.map((e, i) => (
                           <Cell key={i} fill={e.impact > 0 ? '#22d3ee' : '#f43f5e'} opacity={0.6} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

       {prediction.integrity_assessment && (
        <div className={cn("oracle-glass p-8 rounded-3xl space-y-6 bg-rose-500/[0.02] transition-all",
           prediction.integrity_assessment.risk_level === 'High' 
             ? "border-2 border-rose-500 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.3)]"
             : prediction.integrity_assessment.risk_level === 'Medium'
             ? "border border-amber-500/50 animate-breath"
             : "border border-rose-500/20"
        )}>
           <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-lg"><ShieldAlert className="w-5 h-5 text-rose-500" /></div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Integrity Assessment</h3>
           </div>
           
           <div className={cn("text-xs font-bold uppercase", 
             prediction.integrity_assessment.risk_level === 'High' ? 'text-rose-500' : 
             prediction.integrity_assessment.risk_level === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
           )}>
             Risk Level: {prediction.integrity_assessment.risk_level}
           </div>

           <div className="space-y-4">
              {prediction.integrity_assessment.factors.map((f, i) => (
                <FactorItem key={`${f.factor}-${i}`} factor={f} index={i} />
              ))}
            </div>            {prediction.integrity_assessment.player_mistake_patterns && prediction.integrity_assessment.player_mistake_patterns.length > 0 && (
             <div className="pt-6 border-t border-white/5 space-y-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Player Behavior Analysis</p>
                {prediction.integrity_assessment.player_mistake_patterns.map((p, i) => (
                   <div key={`${p.player_name}-${p.mistake_type}-${i}`} className="p-3 bg-black/30 rounded-xl border border-white/5 space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                         <span className="font-bold text-white">{p.player_name} <span className="text-gray-500 font-normal">({p.position})</span></span>
                         <span className={cn("font-bold px-1.5 py-0.5 rounded",
                            p.correlation_with_betting_volatility === 'High' ? 'text-rose-500 bg-rose-500/10' :
                            p.correlation_with_betting_volatility === 'Medium' ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10'
                         )}>{p.correlation_with_betting_volatility} Correlation</span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono">{p.mistake_type}: {p.description}</p>
                   </div>
                ))}
             </div>
           )}
           {prediction.integrity_assessment.spot_fixing_markers && (
              <div className="pt-6 border-t border-white/5 space-y-4">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Spot-Fixing Indicators</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                      <p className="text-[9px] text-gray-500 uppercase">Yellow Card Activity</p>
                      <p className={cn("text-xs font-bold", prediction.integrity_assessment.spot_fixing_markers.yellow_card_market_activity === 'Suspicious' ? 'text-rose-500' : 'text-gray-300')}>
                        {prediction.integrity_assessment.spot_fixing_markers.yellow_card_market_activity}
                      </p>
                    </div>
                    <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                      <p className="text-[9px] text-gray-500 uppercase">Penalty/Corner Anomalies</p>
                      <p className={cn("text-xs font-bold", prediction.integrity_assessment.spot_fixing_markers.penalty_corner_anomalies === 'Severe' ? 'text-rose-500' : 'text-gray-300')}>
                        {prediction.integrity_assessment.spot_fixing_markers.penalty_corner_anomalies}
                      </p>
                    </div>
                 </div>
                 <div className="p-3 bg-black/30 rounded-xl border border-white/5 cursor-pointer group" onClick={() => setExpandedReferee(!expandedReferee)}>
                    <p className="text-[9px] text-gray-500 uppercase group-hover:text-rose-400">Referee Context</p>
                    <p className={cn("text-[10px] text-gray-300 font-mono mt-1", expandedReferee ? "" : "line-clamp-2")}>
                      {prediction.integrity_assessment.spot_fixing_markers.referee_history_context}
                    </p>
                 </div>
              </div>
            )}
           {prediction.integrity_assessment.pre_match_intelligence && prediction.integrity_assessment.pre_match_intelligence.length > 0 && (
             <div className="pt-6 border-t border-white/5 space-y-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pre-Match Intelligence</p>
                <div className="grid grid-cols-1 gap-3">
                   {prediction.integrity_assessment.pre_match_intelligence.map((intelligence, i) => (
                     <div key={`${intelligence.rumor_title}-${intelligence.source}-${i}`} className="p-3 bg-black/30 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                           <p className="text-xs font-bold text-white">{intelligence.rumor_title}</p>
                           <p className="text-[9px] text-gray-500">{intelligence.source}</p>
                        </div>
                        <span className={cn("text-[9px] font-bold px-2 py-1 rounded",
                           intelligence.impact === 'High' ? 'text-rose-500 bg-rose-500/10' :
                           intelligence.impact === 'Medium' ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10'
                        )}>{intelligence.impact} Impact</span>
                     </div>
                   ))}
                </div>
             </div>
           )}

           <div className="pt-4 border-t border-white/5 text-[10px] text-gray-400 italic">
              Oracle Recommendation: {prediction.integrity_assessment.recommendation}
           </div>
        </div>
      )}

      {/* Data Trace */}
      <div className="pt-8 border-t border-white/5 space-y-6">
        <div className="flex items-center gap-3">
           <Activity className="w-4 h-4 text-violet-500" />
           <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Node Retrieval Trace</span>
        </div>
        
        {prediction.data_collection_directives?.missing_points && prediction.data_collection_directives.missing_points.length > 0 && (
           <div className="space-y-2">
              <span className="text-[9px] font-mono text-rose-500 uppercase tracking-widest">Data Gaps Identified</span>
              <ul className="text-[10px] text-gray-400 font-mono space-y-2">
                 {prediction.data_collection_directives.missing_points.map((point, i) => (
                   <li key={i} className="flex flex-col items-start gap-2">
                      <div className="flex items-center gap-2">
                         <span className="mt-0.5">•</span>
                         <span>{point}</span>
                         <button
                           onClick={() => setExpandedMissingPoints(prev => ({ ...prev, [i]: !prev[i] }))}
                           className="text-[9px] font-bold text-violet-400 hover:text-violet-300 underline ml-2 cursor-pointer"
                         >
                           {expandedMissingPoints[i] ? 'Hide' : 'Explain'}
                         </button>
                      </div>
                      {expandedMissingPoints[i] && (
                         <div className="ml-5 p-3 bg-black/50 border border-violet-500/30 rounded-lg text-[10px] text-gray-300 font-mono leading-relaxed mt-1">
                            {(() => {
                               const factor = prediction.integrity_assessment?.factors.find(f => point.toLowerCase().includes(f.factor.toLowerCase()));
                               return factor 
                                 ? `Impact of missing data key '${point}': This relates to the '${factor.factor}' integrity factor. ${factor.detailed_explanation || factor.description}`
                                 : `Impact of missing data key '${point}': Data point essential for model refinement. Lack thereof increases prediction uncertainty regarding specific match dynamics.`;
                            })()}
                         </div>
                      )}
                   </li>
                 ))}
              </ul>
           </div>
        )}

        <div className="flex flex-wrap gap-2">
           {prediction.data_collection_directives?.target_sources.map((s, i) => (
             <ScrapperStatus key={i} label={s} />
           ))}
        </div>
      </div>
    </motion.div>
  );
};

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
  Info,
  ExternalLink,
  Globe,
  Database,
  Gavel,
  Scale,
  Fingerprint,
  Radar,
  Eye
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
             className="mt-2 p-3 bg-black/50 border border-football-green/30 rounded-xl text-[10px] text-gray-300 font-mono italic leading-relaxed"
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
            {prediction.fixture.home} <span className="text-football-green font-mono not-italic text-sm mx-2">VS</span> {prediction.fixture.away}
          </h2>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mt-2 italic">{prediction.fixture.league} • LIVE SYNC</p>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <button 
              onClick={onShare}
              disabled={sharing}
              className="px-6 py-2.5 bg-football-green/5 hover:bg-white/10 border border-football-green/20 rounded-xl text-[10px] font-black text-football-green hover:text-white transition-all flex items-center gap-2"
            >
              {sharing ? <Activity className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              SHARE INSIGHTS
            </button>
          ) : (
            <button 
              onClick={onSignIn}
              className="px-6 py-2.5 bg-football-green/10 border border-football-green/20 rounded-xl text-[10px] font-black text-football-green hover:bg-football-green/20 transition-all flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" /> AUTH TO SHARE
            </button>
          )}
        </div>
      </div>

      {shareUrl && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="p-4 oracle-glass border-football-green/30 rounded-2xl flex items-center gap-4"
        >
          <div className="flex-1 truncate text-xs font-mono text-football-green/70">{shareUrl}</div>
          <button onClick={onCopy} className="px-4 py-2 bg-football-green text-black rounded-xl text-[10px] font-black flex items-center gap-2">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'COPIED' : 'COPY LINK'}
          </button>
        </motion.div>
      )}

      {/* Main Verdict */}
      <TacticalVerdictDisplay prediction={prediction} />

      {/* New Sections: Lineups and Market Dynamics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Confirmed Lineups Section */}
      {prediction.confirmed_lineups && (
        <div className="oracle-glass p-8 rounded-3xl border-white/[0.05] space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-football-green/5 blur-3xl -mr-32 -mt-32 rounded-full" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-football-green/10 rounded-2xl border border-football-green/20 shadow-lg shadow-football-green/5">
                <Shield className="w-6 h-6 text-football-green" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Elite Tactical Deployment</h3>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Live Squad Verification • Node 7-FF</p>
              </div>
            </div>
            {prediction.confirmed_lineups.home.confirmed && prediction.confirmed_lineups.away.confirmed && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">OFFICIAL SQUADS</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
            {(['home', 'away'] as const).map((side) => {
              const data = prediction.confirmed_lineups![side];
              const teamName = side === 'home' ? prediction.fixture.home : prediction.fixture.away;
              const teamColor = data.team_color || (side === 'home' ? '#22c55e' : '#3b82f6');

              return (
                <div key={side} className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-900 border border-white/10 shadow-inner relative overflow-hidden group">
                      <img 
                        src={`https://tse2.mm.bing.net/th?q=${encodeURIComponent(teamName + " football logo transparent crest")}&w=64&h=64&c=7&rs=1`} 
                        alt={teamName}
                        className="w-8 h-8 object-contain drop-shadow-md relative z-10 group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 opacity-20" style={{ backgroundColor: teamColor }} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic tracking-tight">{teamName}</p>
                      <p className="text-[9px] font-mono text-gray-500 uppercase">Confirmed Deployment</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {data.players.map((player, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: side === 'home' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-3 glass-pill hover:bg-white/[0.05] transition-all group relative cursor-help overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-football-green/40 transition-all" />
                        
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full border border-white/10 bg-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
                              {player.photo_url ? (
                                <img 
                                  src={player.photo_url} 
                                  alt={player.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    // Fallback to a generic placeholder if the URL is broken
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=0f172a&color=fff`;
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                  <User className="w-5 h-5 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-[8px] font-black text-white shadow-lg">
                              {player.jersey_number || '??'}
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-white uppercase tracking-tight group-hover:text-football-green transition-colors">{player.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-mono text-gray-500 uppercase font-bold">{player.position_code || player.position}</span>
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <div key={i} className={cn("w-1 h-1 rounded-full", i < (player.rating / 20) ? "bg-football-gold" : "bg-white/5")} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-[9px] font-black text-football-gold italic">RTG: {player.rating}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {data.suspicious_absences.length > 0 && (
                    <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShieldAlert className="w-12 h-12 text-rose-500" />
                      </div>
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-3 h-3" /> System Outliers Detected
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {data.suspicious_absences.map((absent, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500/40" />
                            <p className="text-[10px] text-rose-300 font-mono italic tracking-tight">{absent}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="pt-6 border-t border-white/5 flex justify-center">
            <p className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.3em] animate-pulse">Structural integrity of squads: Verified by FOREVER FOOTBALL</p>
          </div>
        </div>
      )}

        {/* Betting Market Dynamics */}
        {prediction.market_dynamics && (
          <div className="oracle-glass p-8 rounded-3xl border-rose-500/10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 rounded-lg"><Activity className="w-5 h-5 text-rose-500" /></div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Market Liquidity Matrix</h3>
            </div>

            <div className="space-y-4">
              {prediction.market_dynamics.liquidity_shifts.map((shift, i) => (
                <div key={i} className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase">{shift.market}</span>
                    <span className={cn("text-[9px] font-black italic px-2 py-0.5 rounded", 
                      shift.direction === 'Steam' ? 'bg-rose-500/20 text-rose-400' : 
                      shift.direction === 'Reverse' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'
                    )}>
                      {shift.direction} MOVE
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] text-gray-600 uppercase font-mono">Shift Magnitude</p>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-football-green" style={{ width: `${shift.shift_magnitude * 100}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] text-gray-600 uppercase font-mono">Anomaly Score</p>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={cn("h-full", shift.anomaly_score > 0.7 ? "bg-rose-500" : "bg-emerald-500")} style={{ width: `${shift.anomaly_score * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-gray-500 uppercase font-mono">Market Volatility Index</span>
                <span className="text-sm font-bold text-white italic">{prediction.market_dynamics.volatility_index.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Historical Execution Analysis Section */}
      {prediction.historical_execution_analysis && (
        <div className="oracle-glass p-8 rounded-3xl border-football-green/10 space-y-8">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-football-green/10 rounded-lg"><History className="w-5 h-5 text-football-green" /></div>
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Performance Execution Trace</h3>
              </div>
              <div className="flex gap-4">
                 {prediction.historical_execution_analysis.unreliability_audit.flagged_teams.length > 0 && (
                   <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded text-[9px] font-black text-rose-500 uppercase font-mono italic animate-pulse">
                     VOLATILITY ALERT
                   </span>
                 )}
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {['home', 'away'].map((side) => {
                 const analysis = prediction.historical_execution_analysis![side as 'home' | 'away'];
                 const isFlagged = prediction.historical_execution_analysis!.unreliability_audit.flagged_teams.includes(analysis.team_name);
                 
                 return (
                   <div key={side} className={cn(
                     "p-6 rounded-2xl border transition-all space-y-6",
                     isFlagged ? "bg-rose-500/[0.03] border-rose-500/30" : "bg-black/30 border-white/5"
                   )}>
                      <div className="flex justify-between items-start">
                         <div>
                            <p className="text-xs font-black text-white uppercase italic tracking-tight">{analysis.team_name}</p>
                            <p className="text-[9px] text-gray-500 uppercase font-mono mt-1">Divergence Risk: {isFlagged ? 'HIGH' : 'LOW'}</p>
                         </div>
                         <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-black text-football-gold uppercase">Reliability Score</span>
                            <span className={cn("text-xl font-black italic", 
                               analysis.prediction_reliability_score < 0.5 ? "text-rose-500" : 
                               analysis.prediction_reliability_score < 0.75 ? "text-amber-500" : "text-emerald-500"
                            )}>
                               {formatPercent(analysis.prediction_reliability_score)}
                            </span>
                            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                               <div 
                                 className={cn("h-full", 
                                   analysis.prediction_reliability_score < 0.5 ? "bg-rose-500" : 
                                   analysis.prediction_reliability_score < 0.75 ? "bg-amber-500" : "bg-emerald-500"
                                 )} 
                                 style={{ width: `${analysis.prediction_reliability_score * 100}%` }} 
                               />
                            </div>
                         </div>
                      </div>
                      {/* Last 5 Matches Trace */}
                      <div className="space-y-4">
                         <div className="flex justify-between items-center border-b border-white/5 pb-2">
                           <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Execution Reality Traces</p>
                           <div className="flex gap-1">
                              {analysis.last_5_matches.map((m, idx) => (
                                <div 
                                  key={idx} 
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    m.result === 'W' ? "bg-emerald-500" :
                                    m.result === 'L' ? "bg-rose-500" : "bg-gray-600"
                                  )}
                                />
                              ))}
                           </div>
                         </div>
                         <div className="space-y-4">
                            {analysis.last_5_matches.map((match, i) => (
                               <div key={i} className="flex gap-4 group">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border flex-shrink-0 transition-all group-hover:scale-110",
                                       match.result === 'W' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]" :
                                       match.result === 'L' ? "bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.1)]" : "bg-gray-500/10 border-gray-500/30 text-gray-400"
                                    )}>
                                       {match.result}
                                    </div>
                                    <div className={cn("w-1.5 h-1.5 rounded-full", 
                                      match.flavour_realized ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-football-gold shadow-[0_0_5px_rgba(212,175,55,0.5)]"
                                    )} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <div className="flex justify-between items-start">
                                        <div className="space-y-0.5">
                                           <div className="flex items-center gap-2">
                                              <p className="text-[11px] font-black text-white uppercase italic tracking-tight">{match.opponent}</p>
                                              <span className="text-[8px] font-mono text-gray-600 px-1 border border-white/5 rounded">{match.score}</span>
                                           </div>
                                           <p className="text-[9px] text-gray-500 font-mono uppercase">{match.competition}</p>
                                        </div>
                                        <div className="text-right">
                                           <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase italic transition-all", 
                                              match.flavour_realized 
                                                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" 
                                                : "text-football-gold bg-football-gold/10 border border-football-gold/20"
                                           )}>
                                              {match.flavour_realized ? <CheckCircle2 className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                                              {match.flavour_realized ? "SUCCESS" : "DIVERGED"}
                                           </div>
                                        </div>
                                     </div>
                                     <div className="flex justify-between mt-2 pt-2 border-t border-white/[0.03]">
                                        <div className="flex items-center gap-2">
                                           <Target className="w-2.5 h-2.5 text-gray-600" />
                                           <p className="text-[9px] font-mono text-gray-500">Market: <span className="text-gray-300">{match.predicted_market_flavour}</span></p>
                                        </div>
                                        {!match.flavour_realized && match.reason_for_divergence && (
                                          <div className="flex items-center gap-1.5 max-w-[50%]">
                                             <AlertCircle className="w-2.5 h-2.5 text-football-gold flex-shrink-0" />
                                             <p className="text-[9px] font-mono text-football-gold/70 italic truncate">{match.reason_for_divergence}</p>
                                          </div>
                                        )}
                                     </div>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>

                      {analysis.divergence_alerts.length > 0 && (
                        <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-1">
                           <p className="text-[9px] font-bold text-rose-500 uppercase flex items-center gap-2">
                              <AlertCircle className="w-3 h-3" /> Divergence Alerts
                           </p>
                           {analysis.divergence_alerts.map((alert, i) => (
                             <p key={i} className="text-[9px] text-rose-300 font-mono italic leading-tight">• {alert}</p>
                           ))}
                        </div>
                      )}
                   </div>
                 );
              })}
           </div>

           <div className="p-4 bg-football-green/5 border border-football-green/10 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                 <Database className="w-4 h-4 text-football-green" />
                 <p className="text-[10px] text-football-green uppercase font-black tracking-widest">Deployment Audit</p>
              </div>
              <p className="text-[11px] text-gray-400 font-mono italic leading-relaxed">
                 {prediction.historical_execution_analysis.unreliability_audit.systemic_risk_summary}
              </p>
           </div>
        </div>
      )}

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
                    isSelection ? "bg-football-green/10 border-football-green shadow-2xl shadow-football-green/20" : "bg-black/40 border-gray-800"
                  )}>
                    {isSelection && <Target className="absolute top-4 right-4 w-5 h-5 text-football-green" />}
                    <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">{o}</span>
                    <div className="space-y-4">
                      <span className="text-4xl font-black text-white italic">{formatPercent(p)}</span>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${p * 100}%` }}
                          className={cn("h-full", isSelection ? "bg-football-green" : "bg-gray-700")} 
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

         <div className="oracle-glass p-8 rounded-3xl border-football-green/10 space-y-8">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-football-green/10 rounded-lg"><Cpu className="w-5 h-5 text-football-green" /></div>
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
        <div className={cn("oracle-glass p-8 rounded-3xl space-y-10 transition-all relative overflow-hidden",
           prediction.integrity_assessment.risk_level === 'High' 
             ? "border-2 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.2)]"
             : prediction.integrity_assessment.risk_level === 'Medium'
             ? "border border-amber-500/40"
             : "border border-rose-500/10"
        )}>
           {/* Background Scanner Effect */}
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent animate-scan z-0" />
           
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                 <div className={cn("p-3 rounded-2xl border flex items-center justify-center shadow-lg",
                    prediction.integrity_assessment.risk_level === 'High' ? "bg-rose-500/20 border-rose-500/50" : "bg-white/5 border-white/10"
                 )}>
                    <Radar className={cn("w-8 h-8", prediction.integrity_assessment.risk_level === 'High' ? "text-rose-500 animate-pulse" : "text-gray-400")} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Integrity Surveillance</h3>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em]">Omniscient Deep-Scan • Active Monitor</p>
                 </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-mono text-gray-500 uppercase">System Risk Rating</p>
                  <p className={cn("text-3xl font-black italic tracking-tighter",
                    prediction.integrity_assessment.risk_level === 'High' ? "text-rose-500" :
                    prediction.integrity_assessment.risk_level === 'Medium' ? "text-amber-500" : "text-emerald-500"
                  )}>
                    {prediction.integrity_assessment.risk_level.toUpperCase()}
                  </p>
                </div>
                <div className="h-12 w-[1px] bg-white/10 hidden md:block" />
                <div className="flex flex-col items-center">
                  <div className="relative w-16 h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { value: prediction.integrity_assessment.risk_score || 0 },
                            { value: 1 - (prediction.integrity_assessment.risk_score || 0) }
                          ]}
                          innerRadius={24}
                          outerRadius={30}
                          startAngle={90}
                          endAngle={450}
                          dataKey="value"
                        >
                          <Cell fill={prediction.integrity_assessment.risk_level === 'High' ? '#f43f5e' : '#fbbf24'} />
                          <Cell fill="rgba(255,255,255,0.05)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <span className="text-[10px] font-black text-white">{formatPercent(prediction.integrity_assessment.risk_score || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
           </div>
           
           {/* Detailed Metric Strips */}
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
              {[
                { label: 'Alert Tier', val: prediction.integrity_assessment.alert_level || 'N/A', icon: AlertCircle, color: 'text-rose-500' },
                { label: 'Cascade Risk', val: formatPercent(prediction.integrity_assessment.cascade_risk || 0), icon: Zap, color: 'text-amber-500' },
                { label: 'Court Evidence', val: 'Indexed', icon: Gavel, color: 'text-gray-400' },
                { label: 'Signal Vector', val: `${prediction.integrity_assessment.active_signals?.length || 0} Points`, icon: Activity, color: 'text-emerald-500' }
              ].map((m, i) => (
                <div key={i} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center gap-3">
                   <m.icon className={cn("w-4 h-4", m.color)} />
                   <div>
                      <p className="text-[8px] font-mono text-gray-500 uppercase">{m.label}</p>
                      <p className="text-xs font-black text-white italic">{m.val}</p>
                   </div>
                </div>
              ))}
           </div>

           {/* The 5 Chapters Visualizer - Enhanced */}
           <div className="py-10 bg-white/[0.02] border-y border-white/5 relative z-10">
              <div className="flex justify-between items-center max-w-2xl mx-auto px-4">
                 {[
                    { label: 'Vulnerability', icon: Fingerprint, active: true },
                    { label: 'Contact', icon: Share2, active: (prediction.integrity_assessment.risk_score || 0) > 0.4 },
                    { label: 'Signal', icon: Zap, active: (prediction.integrity_assessment.active_signals?.length || 0) > 0 },
                    { label: 'Execution', icon: Gavel, active: prediction.integrity_assessment.risk_level === 'High' },
                    { label: 'Cover-Up', icon: Eye, active: false }
                 ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-3 group relative">
                       <div className={cn(
                         "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-700",
                         step.active 
                           ? "bg-rose-500/20 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse scale-110" 
                           : "bg-black border-white/5 opacity-20 grayscale"
                       )}>
                          <step.icon className={cn("w-6 h-6", step.active ? "text-rose-500" : "text-gray-600")} />
                       </div>
                       <span className={cn("text-[9px] font-black uppercase tracking-widest transition-all", step.active ? "text-rose-400" : "text-gray-700")}>
                          {step.label}
                       </span>
                       {idx < 4 && (
                         <div className={cn("absolute left-full top-6 w-full h-[2px] -translate-x-1/2 z-[-1]", 
                           step.active ? "bg-rose-500/30" : "bg-white/5"
                         )} />
                       )}
                    </div>
                 ))}
              </div>
           </div>

           {/* Actor Intelligence - Emphasizing Full Names & Orgs */}
           {prediction.integrity_assessment.primary_actors && prediction.integrity_assessment.primary_actors.length > 0 && (
             <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-2">
                   <Fingerprint className="w-4 h-4 text-rose-500" />
                   <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Enriched Actor Intelligence (Searchable Identities)</h4>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {prediction.integrity_assessment.primary_actors.map((actor, i) => (
                     <motion.div 
                       key={i}
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ delay: i * 0.1 }}
                       className="group relative p-6 bg-black/60 border border-white/5 rounded-3xl hover:border-rose-500/40 transition-all overflow-hidden"
                     >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl -mr-16 -mt-16 rounded-full group-hover:bg-rose-500/10 transition-colors" />
                        
                        <div className="flex gap-6 items-start relative z-10">
                           <div className="relative">
                              <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-white/5 p-1 overflow-hidden group-hover:border-rose-500/50 transition-all">
                                 {actor.photo_url ? (
                                    <img src={actor.photo_url} alt={actor.full_name} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                                 ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center rounded-xl">
                                       <User className="w-10 h-10 text-gray-700" />
                                    </div>
                                 )}
                              </div>
                              <div className="absolute -bottom-2 -center-x w-full flex justify-center">
                                 <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase border",
                                    actor.vulnerability_score > 0.7 ? "bg-rose-500 border-rose-600 text-white" : "bg-black/80 border-white/20 text-gray-400"
                                 )}>
                                    Vuln: {actor.vulnerability_score.toFixed(2)}
                                 </span>
                              </div>
                           </div>

                           <div className="flex-1 space-y-4">
                              <div>
                                 <h5 className="text-xl font-black text-white italic tracking-tighter uppercase group-hover:text-rose-500 transition-colors">
                                    {actor.full_name || actor.name}
                                 </h5>
                                 <div className="flex items-center gap-3 mt-1 underline decoration-white/10 underline-offset-4 decoration-dotted">
                                    <span className="text-[10px] font-black text-rose-500 uppercase">{actor.role}</span>
                                    <span className="text-[10px] text-gray-500">•</span>
                                    <span className="text-[10px] font-black text-white/70 uppercase">{actor.team}</span>
                                 </div>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                 {actor.competitions.map((comp, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-white/5 rounded-lg text-[9px] font-mono text-gray-400 uppercase border border-white/5">
                                       {comp}
                                    </span>
                                 ))}
                              </div>
                           </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5 space-y-3 relative z-10">
                           <div className="flex items-center gap-2">
                              <Scale className="w-3 h-3 text-rose-400" />
                              <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Intelligence Rationale</p>
                           </div>
                           <p className="text-[11px] text-gray-400 font-mono italic leading-relaxed">
                              {actor.reason_for_inclusion}
                           </p>
                        </div>
                     </motion.div>
                   ))}
                </div>
             </div>
           )}

           {/* Spot Fixing & Referee Emphasized */}
           {prediction.integrity_assessment.spot_fixing_markers?.referee_appointment && (
              <div className="p-8 bg-black/40 border border-white/5 rounded-3xl relative z-10 group transition-all hover:border-amber-500/20">
                 <div className="flex flex-col md:flex-row gap-8 justify-between">
                    <div className="flex-1 space-y-4">
                       <div className="flex items-center gap-3">
                          <Gavel className="w-5 h-5 text-amber-500" />
                          <h4 className="text-sm font-black text-white uppercase italic tracking-widest">Judicial Oversight Trace</h4>
                       </div>
                       <div>
                          <p className="text-2xl font-black text-white uppercase italic tracking-tighter">
                             {prediction.integrity_assessment.spot_fixing_markers.referee_appointment.name}
                          </p>
                          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                             Official Regulatory Official • {prediction.fixture.league}
                          </p>
                       </div>
                       <p className="text-xs text-gray-400 font-mono italic leading-relaxed border-l-2 border-amber-500/30 pl-4 py-1">
                          {prediction.integrity_assessment.spot_fixing_markers.referee_history_context}
                       </p>
                    </div>

                    <div className="w-full md:w-80 space-y-6">
                       <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl space-y-4">
                          <p className="text-[10px] font-black text-gray-500 uppercase flex items-center justify-between">
                             Behavioral Metrics
                             <Activity className="w-3 h-3" />
                          </p>
                          <div className="space-y-3">
                            {[
                               { label: 'Booking Propensity', val: prediction.integrity_assessment.spot_fixing_markers.referee_appointment.statistical_profile?.avg_yellow_cards_per_game || 0, max: 6, color: 'bg-amber-400' },
                               { label: 'Home Advantage Bias', val: prediction.integrity_assessment.spot_fixing_markers.referee_appointment.statistical_profile?.home_win_percentage_under_referee || 0, max: 100, color: 'bg-emerald-400' }
                            ].map((s, i) => (
                               <div key={i} className="space-y-1">
                                  <div className="flex justify-between text-[9px] font-mono">
                                     <span className="text-gray-500 uppercase">{s.label}</span>
                                     <span className="text-white font-bold">{s.val}{s.label.includes('Bias') ? '%' : ''}</span>
                                  </div>
                                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                     <div className={cn("h-full", s.color)} style={{ width: `${(s.val / s.max) * 100}%` }} />
                                  </div>
                               </div>
                            ))}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {/* Recommendation Footer */}
           <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10 font-mono">
              <div className="flex items-center gap-3">
                 <Shield className="w-4 h-4 text-football-green" />
                 <p className="text-[10px] text-gray-500 uppercase">System Integrity Recommendation</p>
              </div>
              <p className="text-xs font-black text-football-green uppercase italic tracking-tighter">
                 {prediction.integrity_assessment.recommendation}
              </p>
           </div>
        </div>
      )}

      {/* Score Predictions */}
      {prediction.score_predictions && (
        <div className="oracle-glass p-8 rounded-3xl border-football-green/10 space-y-6">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-football-green/10 rounded-lg"><Target className="w-5 h-5 text-football-green" /></div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Expected Scoreline Matrix</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {prediction.score_predictions.map((score, i) => (
                <div key={i} className="p-6 bg-black/40 border border-white/5 rounded-2xl space-y-4 hover:border-football-green/30 transition-all group">
                   <div className="flex justify-between items-start">
                      <div className="text-3xl font-black text-white italic group-hover:text-football-green transition-colors">{score.scoreline}</div>
                      <div className="text-[10px] font-black text-football-green bg-football-green/10 px-2 py-0.5 rounded italic">{formatPercent(score.probability)}</div>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] text-gray-400 font-mono italic leading-relaxed line-clamp-4 min-h-[48px]">
                        {score.reasoning}
                      </p>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${score.probability * 100}%` }}
                           className="h-full bg-football-green"
                         />
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Data Trace */}
      <div className="pt-8 border-t border-white/5 space-y-6">
        <div className="flex items-center gap-3">
           <Activity className="w-4 h-4 text-football-green" />
           <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Neural Deployment Trace</span>
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
                           className="text-[9px] font-bold text-football-green hover:text-emerald-400 underline ml-2 cursor-pointer"
                         >
                           {expandedMissingPoints[i] ? 'Hide' : 'Explain'}
                         </button>
                      </div>
                      {expandedMissingPoints[i] && (
                         <div className="ml-5 p-3 bg-black/50 border border-football-green/30 rounded-lg text-[10px] text-gray-300 font-mono leading-relaxed mt-1">
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

      {/* Ground Truth Feedback */}
      <div className="oracle-glass p-8 rounded-3xl border-football-green/20 space-y-8 bg-football-green/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-football-green/10 rounded-lg"><CheckCircle2 className="w-5 h-5 text-football-green" /></div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Reality Calibration</h3>
        </div>

        {feedbackState.submitted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="p-6 text-center space-y-4"
          >
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-white uppercase italic">Feedback Synchronized</p>
              <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase">Intel integrated into current epoch</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Actual Outcome Match</p>
                <div className="flex gap-2">
                  {['home', 'draw', 'away'].map((outcome) => (
                    <button
                      key={outcome}
                      onClick={() => setFeedbackState({ ...feedbackState, actualOutcome: outcome })}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-black uppercase rounded-xl border transition-all",
                        feedbackState.actualOutcome === outcome 
                          ? "bg-football-green border-football-green text-black" 
                          : "bg-black/40 border-white/5 text-gray-500 hover:border-white/10"
                      )}
                    >
                      {outcome}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Prediction Accuracy Audit</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackState({ ...feedbackState, rating: star })}
                      className="p-2 transition-all hover:scale-110"
                    >
                      <Zap className={cn(
                        "w-5 h-5",
                        star <= feedbackState.rating ? "text-amber-500 fill-amber-500" : "text-gray-800"
                      )} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Contextual Notes</p>
                <textarea
                  value={feedbackState.comments}
                  onChange={(e) => setFeedbackState({ ...feedbackState, comments: e.target.value })}
                  placeholder="Optional: Neural drift detected? Match-fixing indicators? Tactical deviation?"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] font-mono focus:border-football-green/50 outline-none transition-all resize-none h-24"
                />
              </div>

              <button
                onClick={submitFeedback}
                disabled={feedbackState.submitting}
                className="w-full py-3 bg-football-green text-black hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                {feedbackState.submitting ? <Activity className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {feedbackState.submitting ? 'CALIBRATING...' : 'SUBMIT INSIGHTS'}
              </button>

              {feedbackState.error && (
                <p className="text-[9px] text-rose-500 font-mono italic animate-pulse">
                  Error: {feedbackState.error}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

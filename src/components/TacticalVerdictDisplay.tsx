import React from 'react';
import { motion } from 'motion/react';
import { Crosshair, ShieldCheck, AlertTriangle, Zap, Terminal, Activity, TrendingUp, Cpu } from 'lucide-react';
import { PredictionResult } from '../types';
import { cn } from '../utils';

interface TacticalVerdictDisplayProps {
  prediction: PredictionResult;
}

export const TacticalVerdictDisplay = ({ prediction }: TacticalVerdictDisplayProps) => {
  const verdict = prediction.tactical_verdict;
  if (!verdict) return null;

  const riskColors = {
    SURGICAL: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    SPECULATIVE: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    VOLATILE: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    CONTRARIAN: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
  };

  return (
    <div className="relative group">
      {/* Outer Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
      
      <div className="relative oracle-glass rounded-2xl border-white/10 overflow-hidden">
        {/* Top Segment: Status Trace */}
        <div className="px-6 py-3 border-b border-white/5 bg-white/20 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <Terminal className="w-3 h-3 text-violet-400" />
                <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest font-bold">
                    Tactical Execution Stream: {verdict.verdict_code}
                </span>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Activity className="w-3 h-3 text-gray-500" />
                    <span className="text-[9px] font-mono text-gray-500">LATENCY: 42ms</span>
                </div>
                <div className="flex items-center gap-2">
                    <Cpu className="w-3 h-3 text-gray-500" />
                    <span className="text-[9px] font-mono text-gray-500">NODES: 12</span>
                </div>
            </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Decisive Verdict Column */}
            <div className="md:col-span-4 flex flex-col justify-center space-y-4">
                <div>
                    <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Final Decision Vector</h4>
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl font-black italic tracking-tighter text-white leading-none uppercase"
                    >
                        {verdict.final_decision}
                    </motion.div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <div className={cn(
                        "px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest",
                        riskColors[verdict.risk_profile]
                    )}>
                        {verdict.risk_profile} RISK
                    </div>
                    {((prediction.orchestration?.edge?.kelly_stake || 0) > 0.15) && (
                        <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            ALL-IN OPPORTUNITY
                        </div>
                    )}
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        CONFIDENCE: {Math.round((1 - verdict.confidence_variance) * 100)}%
                    </div>
                </div>
            </div>

            {/* Logical Justification Column */}
            <div className="md:col-span-5 flex flex-col justify-center border-l border-white/5 md:pl-8 space-y-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-3 h-3 text-violet-400" />
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Execution Logic</span>
                    </div>
                    <p className="text-sm text-gray-200 font-medium leading-relaxed italic">
                        "{verdict.execution_logic}"
                    </p>
                </div>
            </div>

            {/* Pivot Factor Column */}
            <div className="md:col-span-3 flex flex-col justify-center border-l border-white/5 md:pl-8">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center gap-2">
                        <Crosshair className="w-3 h-3 text-cyan-400" />
                        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Primary Pivot</span>
                    </div>
                    <p className="text-[10px] font-bold text-white uppercase leading-tight">
                        {verdict.primary_pivot_factor}
                    </p>
                    <div className="w-full h-1 bg-gray-900 rounded-full mt-2 overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '85%' }}
                            className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                        />
                    </div>
                </div>
            </div>
        </div>
        
        {/* Why This Verdict Section */}
        <div className="mx-6 md:mx-8 mb-8 pt-6 border-t border-white/5">
            <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4">Why This Verdict?</h4>
            <div className="space-y-4">
                <p className="text-xs text-gray-300 leading-relaxed font-mono italic">
                    {prediction.qpe_outputs.dual_lens_analysis.synthesis}
                </p>
                
                {/* Confidence Variance Breakdown */}
                <div className="bg-gray-950 p-4 rounded border border-white/10 font-mono text-[10px] text-gray-400">
                    <p className="mb-4 text-white font-bold uppercase tracking-wider">Internal Simulation Variance: {(verdict.confidence_variance * 100).toFixed(1)}%</p>
                    <div className="space-y-3">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest underline decoration-white/20">Top Contributors to Variance</p>
                        {prediction.decision_trace.drift_factors
                            .sort((a,b) => Math.abs(b.shift) - Math.abs(a.shift))
                            .slice(0, 3)
                            .map((factor, i) => (
                                <div key={i} className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/5">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-bold text-white truncate">{factor.factor}</span>
                                        <span className="text-[9px] text-gray-500 font-mono">Brain: {factor.brain}</span>
                                    </div>
                                    <span className={cn("text-xs font-mono font-bold", factor.shift > 0 ? "text-emerald-400" : "text-rose-400")}>
                                        {factor.shift > 0 ? '+' : ''}{(factor.shift * 100).toFixed(2)}%
                                    </span>
                                </div>
                            ))
                        }
                    </div>
                </div>

                <div className="pl-4 border-l border-violet-500/30 text-[11px] text-gray-400 space-y-1">
                    {prediction.decision_trace.logical_steps.slice(0, 3).map((step, i) => (
                    <div key={i}>• {step}</div>
                    ))}
                </div>

                {prediction.integrity_assessment?.spot_fixing_markers?.referee_history_context && (
                    <div className="mt-4 p-4 rounded border border-rose-500/20 bg-rose-950/10 flex gap-3 text-rose-200">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1">Attention: Referee Integrity Context</p>
                            <p className="text-[10px] font-mono leading-relaxed">
                                {prediction.integrity_assessment.spot_fixing_markers.referee_history_context}
                            </p>
                            <p className="text-[9px] text-rose-400/60 mt-2 italic">
                                Reasoning: Referee history is mapped for behavioral patterns that correlate with historical manipulation markers, ensuring situational awareness of contextual officiating bias.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Bottom Deco */}
        <div className="h-1 bg-gradient-to-r from-violet-600 via-cyan-500 to-emerald-500 opacity-30" />
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CheckCircle2, AlertTriangle, Activity, Database, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../utils';

export function ScrapperStatus({ label }: any) {
  const [status, setStatus] = useState<'pending' | 'syncing' | 'completed' | 'blocked' | 'offline'>('pending');
  const [progress, setProgress] = useState(0);
  const [successRate, setSuccessRate] = useState(100);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!label) return;
    
    // Deterministic but realistic simulation
    const seed = label.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const isFragile = seed % 7 === 0;
    const isOffline = seed % 13 === 0;
    const delayBase = 1000 + (seed % 2000);
    
    let currentProgress = 0;
    const interval = setInterval(() => {
      setStatus(prev => {
        if (prev === 'pending') return 'syncing';
        return prev;
      });
      
      if (isOffline) {
        setStatus('offline');
        setDiagnosticLogs([
          `[ERR] Connection timed out after 5000ms`,
          `[SYS] Handshake failed with node peer IX-44`,
          `[NET] 504 Gateway Timeout on proxy layer`,
          `[WAR] Node marked as 'DEAD' in global routing table`
        ]);
        clearInterval(interval);
        return;
      }

      const increment = Math.random() * (isFragile ? 5 : 20);
      currentProgress += increment;
      
      if (isFragile) {
        setSuccessRate(prev => Math.max(40, prev - Math.random() * 5));
      }

      if (currentProgress >= 100) {
        currentProgress = 100;
        setStatus(prev => {
          if (prev === 'completed' || prev === 'blocked') return prev;
          const newStatus = isFragile && Math.random() > 0.5 ? 'blocked' : 'completed';
          return newStatus;
        });
        
        if (isFragile) {
          setDiagnosticLogs([
            `[ERR] 403 Forbidden: WAF Anti-Scrapping Triggered`,
            `[DET] Behavioral fingerprinting match: HEURISTIC_V3`,
            `[ACT] Client IP temporarily suppressed by origin`,
            `[RECO] Rotate user-agents or increase jitter interval`
          ]);
        }
        clearInterval(interval);
      }
      
      setProgress(currentProgress);
    }, delayBase);

    return () => clearInterval(interval);
  }, [label]);

  const statusColors = {
    pending: 'text-gray-600 border-gray-800',
    syncing: 'text-football-green border-football-green/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]',
    completed: 'text-emerald-500 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
    blocked: 'text-rose-500 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
    offline: 'text-gray-500 border-gray-800/50'
  };

  return (
    <div className={cn(
      "p-3 bg-black/40 border rounded-xl space-y-2 group transition-all duration-500 relative overflow-hidden",
      statusColors[status]
    )}>
      {/* Sweeping diagnostic light effect */}
      {status === 'syncing' && (
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-football-green/10 to-transparent skew-x-12 pointer-events-none"
        />
      )}

      <div className="flex justify-between items-start gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="relative">
             {status === 'syncing' && (
               <div className="absolute inset-0 rounded-full bg-football-green/20 animate-ping" />
             )}
             <div className={cn(
               "w-1.5 h-1.5 rounded-full",
               status === 'pending' ? 'bg-gray-700' :
               status === 'syncing' ? 'bg-football-green' :
               status === 'completed' ? 'bg-emerald-500' :
               status === 'blocked' ? 'bg-rose-500' : 'bg-gray-500'
             )} />
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono opacity-60">
              {status.toUpperCase()}
            </span>
            {(status === 'blocked' || status === 'offline') && (
              <button 
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="p-1 hover:bg-white/5 rounded transition-colors text-white/50 hover:text-white"
                title="View Diagnostic Logs"
              >
                {showDiagnostics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
        </div>
      </div>

      <div className="space-y-1.5 relative z-10">
        <div className="flex justify-between text-[8px] font-mono opacity-50">
          <span>PROGRESS: {Math.floor(progress)}%</span>
          <span>INTEGRITY: {Math.floor(successRate)}%</span>
        </div>
        <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={cn(
              "h-full rounded-full transition-colors duration-500",
              status === 'blocked' ? 'bg-rose-500' : 
              status === 'completed' ? 'bg-emerald-500' : 'bg-football-green'
            )}
          />
        </div>
      </div>

      <AnimatePresence>
        {showDiagnostics && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-3 bg-black/60 rounded-lg border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-white/5">
                <Terminal className="w-3 h-3 text-rose-400" />
                <span className="text-[9px] font-mono text-rose-400 font-bold uppercase">Diagnostic Out-Stream</span>
              </div>
              {diagnosticLogs.map((log, i) => (
                <div key={i} className={cn(
                  "text-[9px] font-mono leading-tight",
                  log.startsWith('[ERR]') ? 'text-rose-400' :
                  log.startsWith('[WAR]') ? 'text-amber-400' : 'text-gray-500'
                )}>
                  {log}
                </div>
              ))}
              <div className="pt-2">
                <button 
                  onClick={() => setShowDiagnostics(false)}
                  className="text-[8px] font-mono text-gray-600 hover:text-gray-400 uppercase tracking-tighter"
                >
                  [ CLOSE SESSION ]
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

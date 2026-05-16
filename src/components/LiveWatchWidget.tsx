import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Radio, Tv, Zap, Shield, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../utils';
import axios from 'axios';

export function LiveWatchWidget({ onAudit }: { onAudit?: (match: any) => void }) {
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [engineStatus, setEngineStatus] = useState<'IDLE' | 'WATCHING' | 'ANALYSING'>('IDLE');
  const [currentEvents, setCurrentEvents] = useState<any[]>([]);
  const [currentStats, setCurrentStats] = useState<any>(null);
  const activeIdxRef = React.useRef(activeIdx);

  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);

  const fetchDetails = React.useCallback(async (matchId: string) => {
    if (!matchId) return;
    try {
      const [eventsRes, statsRes] = await Promise.all([
        axios.get(`/api/livescore/events?match_id=${matchId}`),
        axios.get(`/api/livescore/stats?match_id=${matchId}`)
      ]);
      setCurrentEvents(eventsRes.data?.data?.event || []);
      setCurrentStats(statsRes.data?.data || null);
    } catch (e) {
      console.warn("Failed to fetch match details", e);
    }
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    
    const connectSSE = () => {
      setEngineStatus('WATCHING');
      eventSource = new EventSource('/api/livescore/stream');

      eventSource.onopen = () => {
        setLoading(false);
        setEngineStatus('IDLE');
      };

      eventSource.addEventListener('matches_update', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.match) {
            const matches = data.match.filter((m: any) => !String(m.id).startsWith('sim-'));
            
            setLiveMatches(prev => {
              const currentIdx = activeIdxRef.current;
              const activeMatch = matches[currentIdx];
              const prevActiveMatch = prev[currentIdx];
              
              if (activeMatch && prevActiveMatch && activeMatch.score !== prevActiveMatch.score) {
                 fetchDetails(activeMatch.id);
              }
              return matches;
            });

            setEngineStatus('WATCHING');
            setTimeout(() => setEngineStatus('IDLE'), 1500);
          }
        } catch (err) {
          console.error("Stream parse error", err);
        }
      });

      eventSource.onerror = (err) => {
        console.error("Stream connection lost. Reconnecting...", err);
        eventSource?.close();
        setEngineStatus('IDLE');
        // Exponential backoff or simple delay
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();
    return () => {
      eventSource?.close();
    };
  }, []);

  const currentMatch = liveMatches[activeIdx];

  useEffect(() => {
    if (currentMatch?.id) {
       fetchDetails(currentMatch.id);
    }
  }, [currentMatch?.id, fetchDetails]);

  return (
    <div className="fixed bottom-8 right-8 z-50 w-80">
      <AnimatePresence>
        {liveMatches.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="oracle-glass rounded-2xl border border-football-green/20 overflow-hidden shadow-2xl shadow-black"
          >
            <div className="bg-football-green/10 px-4 py-2 border-b border-white/5 flex justify-between items-center transition-all">
               <div className="flex items-center gap-2">
                 <Radio className="w-3 h-3 text-football-green animate-pulse" />
                 <span className="text-[10px] font-black text-football-green uppercase italic tracking-widest">Live Engine Feed</span>
               </div>
               <div className="flex items-center gap-1">
                 <div className={cn("w-1.5 h-1.5 rounded-full", engineStatus === 'WATCHING' ? "bg-football-green animate-ping" : "bg-gray-600")} />
                 <span className="text-[8px] font-mono text-gray-500 uppercase">{engineStatus}</span>
               </div>
            </div>

            {loading ? (
              <div className="p-12 flex flex-col items-center gap-4">
                <Activity className="w-8 h-8 text-gray-800 animate-spin" />
                <span className="text-[10px] font-mono text-gray-600 uppercase">Synchronizing Nodes...</span>
              </div>
            ) : currentMatch ? (
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center text-[9px] font-mono text-gray-500 uppercase tracking-tighter">
                  <span>{currentMatch.competition_name || 'Live Fixture'}</span>
                  <span className="text-football-green font-black">{currentMatch.time}'</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 font-black text-xs overflow-hidden">
                      <img 
                        src={`https://tse2.mm.bing.net/th?q=${encodeURIComponent(currentMatch.home_name + " football logo transparent")}&w=40&h=40&c=7&rs=1`} 
                        alt={currentMatch.home_name}
                        className="w-8 h-8 object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = currentMatch.home_name?.charAt(0);
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-center truncate w-full">{currentMatch.home_name}</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl font-black italic tracking-tighter">{currentMatch.score}</span>
                    <span className="text-[8px] font-mono text-gray-600 uppercase">LIVE</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 font-black text-xs overflow-hidden">
                      <img 
                        src={`https://tse2.mm.bing.net/th?q=${encodeURIComponent(currentMatch.away_name + " football logo transparent")}&w=40&h=40&c=7&rs=1`} 
                        alt={currentMatch.away_name}
                        className="w-8 h-8 object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = currentMatch.away_name?.charAt(0);
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-center truncate w-full">{currentMatch.away_name}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-4">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-mono text-gray-600 uppercase tracking-tighter">Attacks / Danger</span>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] font-black text-white italic">
                          {currentStats?.attacks?.home || 0}% / {currentStats?.dangerous_attacks?.home || 0}%
                        </span>
                      </div>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-mono text-gray-600 uppercase tracking-tighter">Omniscience Status</span>
                      <div className="flex items-center gap-1">
                        <Shield className="w-3 h-3 text-football-green" />
                        <span className="text-[10px] font-black text-white italic uppercase tracking-tighter">God's Eye Active</span>
                      </div>
                   </div>
                </div>

                {currentEvents.length > 0 && (
                  <div className="bg-black/40 rounded-lg p-2 border border-white/5 space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                    {currentEvents.slice(-3).reverse().map((event, i) => (
                      <div key={i} className="flex items-start gap-2 text-[8px] font-mono leading-tight">
                         <span className="text-football-green shrink-0">{event.time}'</span>
                         <span className="text-gray-400 capitalize">
                           <span className="text-white font-bold">{event.event}:</span> {event.player}
                         </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveIdx(prev => (prev - 1 + liveMatches.length) % liveMatches.length)}
                    className="p-2 hover:bg-white/5 rounded-lg border border-white/5"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => onAudit?.(currentMatch)}
                    className="flex-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest py-2 border border-white/5 transition-all"
                  >
                    Run Live Audit
                  </button>
                  <button 
                    onClick={() => setActiveIdx(prev => (prev + 1) % liveMatches.length)}
                    className="p-2 hover:bg-white/5 rounded-lg border border-white/5"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
                <div className="p-8 text-center text-[10px] font-mono text-gray-600 uppercase">
                    No active matches in surveillance grid
                </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

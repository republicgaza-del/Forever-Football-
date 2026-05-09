/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Brain, 
  Shield, 
  Activity, 
  LayoutDashboard, 
  Radar, 
  Sword, 
  History as HistoryIcon,
  User,
  LogOut,
  ShieldAlert,
  AlertTriangle,
  History
} from 'lucide-react';
import { analyzeFixture, fetchWeeklyFixtures, resolveConflict, OracleError, extractFixtureDetails } from './oracleService';
import { PredictionResult, BrainType } from './types';
import { cn } from './utils';
import { auth, signIn, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, getDoc, doc, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { Search } from 'lucide-react';

// Modular Components
import { OracleResults } from './components/OracleResults';
import { RadarTab } from './components/RadarTab';
import { ComparisonGrid } from './components/ComparisonGrid';
import { ScrapperStatus } from './components/ScrapperStatus';

export default function App() {
  const [activeTab, setActiveTab] = useState<'oracle' | 'radar' | 'tactical' | 'history'>('oracle');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [weeklyFixtures, setWeeklyFixtures] = useState<any[]>([]);
  const [filterState, setFilterState] = useState({
    significance: 'All',
    onlyConflicts: false,
    minVolatility: 0
  });
  const [error, setError] = useState<{ message: string, code?: string } | null>(null);

  const handleError = (e: any, defaultMessage: string) => {
    let message = defaultMessage;
    if (e instanceof OracleError) {
      message = e.message;
    } else if (e instanceof Error) {
      message = e.message;
    } else if (typeof e === 'string') {
      message = e;
    } else if (e && typeof e === 'object') {
      if ('message' in e && typeof e.message === 'string') {
        message = e.message;
      } else {
        // Handle SyntheticEvents or other objects without a friendly message
        try {
          message = JSON.stringify(e);
          if (message === '{}' && e.constructor?.name) {
            message = `Exception: ${e.constructor.name}`;
          }
        } catch (err) {
          message = String(e);
        }
      }
    }
    
    setError({ message: String(message), code: e?.code });
  };
  const [fixtureLimit, setFixtureLimit] = useState(12);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<PredictionResult[]>([]);
  const [isFetchingComparison, setIsFetchingComparison] = useState(false);
  const [searchState, setSearchState] = useState({ home: 'Arsenal', away: 'Manchester City', league: 'Premier League' });
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLastDoc, setHistoryLastDoc] = useState<any>(null);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  // Feedback & Share State
  const [feedbackState, setFeedbackState] = useState({
    actualOutcome: 'home' as any,
    rating: 5,
    comments: '',
    submitting: false,
    submitted: false
  });
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) fetchHistory(u.uid);
    });

    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (shareId) loadSharedPrediction(shareId);

    return () => unsubscribe();
  }, []);

  const fetchHistory = async (uid: string) => {
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'prediction_feedback'),
        where('userId', '==', uid),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistory(docs);
      if (snapshot.docs.length > 0) {
        setHistoryLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMoreHistory(snapshot.docs.length === 10);
      } else {
        setHasMoreHistory(false);
      }
    } catch (e) {
      console.error("History fetch failed:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadMoreHistory = async () => {
    if (!user || !hasMoreHistory || loadingHistory || !historyLastDoc) return;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'prediction_feedback'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        startAfter(historyLastDoc),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistory(prev => [...prev, ...docs]);
      if (snapshot.docs.length > 0) {
        setHistoryLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMoreHistory(snapshot.docs.length === 10);
      } else {
        setHasMoreHistory(false);
      }
    } catch (e) {
      console.error("More history fetch failed:", e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadSharedPrediction = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'shared_predictions', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPrediction(docSnap.data().predictionData);
        setActiveTab('oracle');
      } else {
        setError({ message: "The shared prediction could not be found or has expired." });
      }
    } catch (e) {
      handleError(e, "Failed to load search intel.");
    } finally {
      setLoading(false);
    }
  };

  const runOracle = React.useCallback(async (home?: string, away?: string, league?: string) => {
    const h = home || searchState.home;
    const a = away || searchState.away;
    const l = league || searchState.league;

    if (!h || !a) {
      setError({ message: "Please specify both tactical units (Home/Away Teams)." });
      return;
    }
    
    // Update search state if new values were provided and different
    const newHome = home !== undefined ? home : searchState.home;
    const newAway = away !== undefined ? away : searchState.away;
    const newLeague = league !== undefined ? league : searchState.league;

    if (newHome !== searchState.home || newAway !== searchState.away || newLeague !== searchState.league) {
      setSearchState({ home: newHome, away: newAway, league: newLeague });
    }

    setLoading(true);
    setPrediction(null);
    setError(null);
    setFeedbackState(prev => ({ ...prev, submitted: false, comments: '' }));
    try {
      const result = await analyzeFixture(h, a, l);
      setPrediction(result);
    } catch (e: any) {
      handleError(e, "Inference nodes failed to resolve. The Oracle is currently offline.");
    } finally {
      setLoading(false);
    }
  }, [searchState, feedbackState]);

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsExtracting(true);
    setError(null);
    try {
      const details = await extractFixtureDetails(searchQuery);
      if (details.home === 'Unknown' || details.away === 'Unknown') {
        throw new Error("Could not definitively extract team units from your query. Please use clear Home vs Away syntax.");
      }
      
      setSearchState({
        home: details.home,
        away: details.away,
        league: details.league !== 'Unknown' ? details.league : searchState.league
      });
      
      // Trigger Oracle with extracted results
      await runOracle(details.home, details.away, details.league !== 'Unknown' ? details.league : searchState.league);
    } catch (err: any) {
      handleError(err, "Oracle Parser failed to resolve the search string.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleScan = React.useCallback(async (limit: number = fixtureLimit) => {
    setScanning(true);
    setError(null);
    try {
      const fixtures = await fetchWeeklyFixtures(searchState.league, limit);
      const fixturesWithId = fixtures.map((f, i) => ({
        ...f,
        id: `fix-${i}-${f.home}-${f.away}-${f.date}`.replace(/\s+/g, '-').toLowerCase()
      }));
      setWeeklyFixtures(fixturesWithId);
    } catch (e: any) {
      handleError(e, "Surveillance nodes failed to resolve weekly fixture grid.");
    } finally {
      setScanning(false);
    }
  }, [searchState.league, fixtureLimit]);

  const startComparison = React.useCallback(async () => {
    if (selectedMatchIds.length < 2) return;
    setIsFetchingComparison(true);
    setActiveTab('tactical');
    try {
      const selected = weeklyFixtures.filter(f => selectedMatchIds.includes(f.id));
      const results = [];
      for (const fix of selected) {
        const res = await analyzeFixture(fix.home, fix.away, fix.league);
        results.push(res);
      }
      setComparisonData(results);
    } catch (err: any) {
      handleError(err, "Tactical comparison failed. Node overload.");
    } finally {
       setIsFetchingComparison(false);
    }
  }, [selectedMatchIds, weeklyFixtures]);

  const regenerateConflictExplanation = async (prediction: PredictionResult) => {
    setLoading(true);
    try {
      const { explanation, trace } = await resolveConflict(prediction);
      
      const newPrediction = {
        ...prediction,
        orchestration: {
          ...prediction.orchestration,
          conflict_note: explanation
        },
        decision_trace: {
          ...prediction.decision_trace,
          logical_steps: [...prediction.decision_trace.logical_steps, trace]
        }
      };
      
      setPrediction(newPrediction);
    } catch (err) {
      handleError(err, "Failed to regenerate explanation. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!prediction || !user) return;
    setSharing(true);
    try {
      const docRef = await addDoc(collection(db, 'shared_predictions'), {
        predictionData: prediction,
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      setShareUrl(`${window.location.origin}${window.location.pathname}?share=${docRef.id}`);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'shared_predictions');
    } finally {
      setSharing(false);
    }
  };

  const submitFeedback = async () => {
    if (!prediction || !user) return;
    setFeedbackState(prev => ({ ...prev, submitting: true }));
    try {
      await addDoc(collection(db, 'prediction_feedback'), {
        predictionId: `${prediction.fixture.home}-${prediction.fixture.away}-${Date.now()}`,
        fixtureHome: prediction.fixture.home,
        fixtureAway: prediction.fixture.away,
        predictedOutcome: prediction.orchestration.edge.outcome,
        actualOutcome: feedbackState.actualOutcome,
        accuracyRating: feedbackState.rating,
        comments: feedbackState.comments,
        timestamp: serverTimestamp(),
        userId: user.uid
      });
      setFeedbackState(prev => ({ ...prev, submitted: true, submitting: false }));
      fetchHistory(user.uid);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'prediction_feedback');
      setFeedbackState(prev => ({ ...prev, submitting: false }));
    }
  };

  const filteredFixtures = useMemo(() => {
    return weeklyFixtures.filter(f => {
      if (filterState.significance !== 'All' && f.significance !== filterState.significance) return false;
      if (f.volatility_score < filterState.minVolatility) return false;
      return true;
    });
  }, [weeklyFixtures, filterState]);

  return (
    <div className="flex h-screen bg-[#020205] text-white overflow-hidden font-sans selection:bg-violet-500/30">
      {/* Decisive Sidebar Navigation */}
      <nav className="w-20 md:w-24 bg-black border-r border-white/5 flex flex-col items-center py-8 gap-10 relative z-50">
        <div className="p-3 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl shadow-lg shadow-violet-500/20">
          <Shield className="w-7 h-7 text-white" />
        </div>

        <div className="flex flex-col gap-6 flex-1 w-full px-2">
          {[
            { id: 'oracle', icon: LayoutDashboard, label: 'Oracle' },
            { id: 'radar', icon: Radar, label: 'Radar' },
            { id: 'tactical', icon: Sword, label: 'Tactics' },
            { id: 'history', icon: HistoryIcon, label: 'Logs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "group relative w-full aspect-square flex flex-col items-center justify-center rounded-xl transition-all",
                activeTab === tab.id ? "bg-violet-500/10 text-violet-400" : "text-gray-600 hover:text-gray-300 hover:bg-white/5"
              )}
            >
              <tab.icon className={cn("w-5 h-5 mb-1", activeTab === tab.id && "animate-pulse")} />
              <span className="text-[8px] font-mono font-bold uppercase tracking-tighter">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div layoutId="activeTabIndicator" className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-violet-500 rounded-l-full shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 items-center">
          {user ? (
            <button 
              onClick={() => signOut(auth)}
              className="p-3 rounded-xl border border-white/5 hover:bg-white/5 text-gray-600 hover:text-rose-400 transition-all"
              title="Terminate Session"
            >
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={signIn}
              className="p-3 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-500/20 hover:scale-105 transition-all"
              title="Auth Access"
            >
              <User className="w-5 h-5" />
            </button>
          )}
        </div>
      </nav>

      {/* Main Command Deck */}
      <main className="flex-1 overflow-y-auto relative custom-scrollbar flex flex-col">
        <header className="sticky top-0 z-40 bg-[#020205]/80 backdrop-blur-md px-8 py-4 border-b border-white/5 flex justify-between items-center shrink-0">
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-[0.2em] text-white uppercase italic">
              {activeTab === 'oracle' && 'Dual-Brain Inference Console'}
              {activeTab === 'radar' && 'Surveillance Grid Radar'}
              {activeTab === 'tactical' && 'Combat Comparison Module'}
              {activeTab === 'history' && 'Predictive Audit Logs'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Global Status: Optimal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-mono text-gray-600 uppercase">Operator ID</span>
              <span className="text-[11px] font-bold text-violet-400">{user?.displayName || 'GUEST_USER_822'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-gray-500 px-4 border-l border-white/10">
               <Activity className="w-3 h-3" />
               <span>Latency: 42ms</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {/* Error Overlay */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between gap-6 overflow-hidden"
              >
                <div className="flex items-center gap-4">
                  <ShieldAlert className="w-8 h-8 text-red-500 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                       Link Exception
                       {error.code && <span className="px-2 py-0.5 rounded text-[9px] bg-red-500/20 text-red-400 font-mono tracking-wider">{error.code}</span>}
                    </h4>
                    <p className="text-xs text-red-400/80 font-mono mt-1 w-full max-w-3xl whitespace-pre-wrap">{error.message}</p>
                  </div>
                </div>
                <button onClick={() => setError(null)} className="shrink-0 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all">Dismiss</button>
              </motion.div>
            )}

            {/* Tab Rendering Logic */}
            {activeTab === 'oracle' && (
              <motion.div key="oracle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                  <div className="lg:col-span-12 oracle-glass p-8 rounded-3xl space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] italic">Global Intelligence Search</h3>
                        <form onSubmit={handleGlobalSearch} className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-gray-600 group-focus-within:text-violet-500 transition-colors" />
                            </div>
                            <input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Enter fixture search (e.g. Liverpool vs Chelsea in Premier League)"
                                className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-32 py-5 text-base focus:border-violet-500/50 outline-none transition-all placeholder:text-gray-700"
                            />
                            <button 
                                type="submit"
                                disabled={isExtracting || !searchQuery.trim()}
                                className="absolute right-2 top-2 bottom-2 px-6 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                {isExtracting ? 'Extracting...' : 'Search & Predict'}
                            </button>
                        </form>
                        <div className="flex gap-4">
                            <p className="text-[9px] text-gray-600 font-mono italic">Parser hint: "Team A vs Team B League Name"</p>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/5">
                        <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] italic mb-6">Manual Calibration Units</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-[9px] font-mono text-gray-600 uppercase ml-2">Home Unit</label>
                            <input value={searchState.home} onChange={e => setSearchState({...searchState, home: e.target.value})} className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-violet-500/50 outline-none transition-all font-bold tracking-tight" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-mono text-gray-600 uppercase ml-2">Away Unit</label>
                            <input value={searchState.away} onChange={e => setSearchState({...searchState, away: e.target.value})} className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-violet-500/50 outline-none transition-all font-bold tracking-tight" />
                          </div>
                          <div className="flex items-end">
                            <button onClick={() => runOracle()} disabled={loading} className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 active:scale-95 disabled:opacity-50 rounded-xl text-xs font-black tracking-[0.2em] uppercase transition-all shadow-xl shadow-violet-600/20 flex items-center justify-center gap-3">
                              {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                              {loading ? 'Processing...' : 'Run Oracle'}
                            </button>
                          </div>
                        </div>
                    </div>
                  </div>
                </div>

                {prediction && (
                  <OracleResults 
                    prediction={prediction} user={user} sharing={sharing} shareUrl={shareUrl} copied={copied} 
                    onShare={handleShare} onCopy={() => { navigator.clipboard.writeText(shareUrl!); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    onSignIn={signIn} feedbackState={feedbackState} setFeedbackState={setFeedbackState} submitFeedback={submitFeedback}
                    onRegenerateConflictExplanation={() => regenerateConflictExplanation(prediction)}
                  />
                )}
                
                {!prediction && !loading && (
                  <div className="py-20 flex flex-col items-center gap-6 opacity-30 select-none">
                     <div className="p-6 rounded-full border-2 border-gray-900"><Zap className="w-12 h-12 text-gray-800" /></div>
                     <p className="text-[10px] font-mono uppercase tracking-[0.4em]">Oracle awaiting calibration</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'radar' && (
              <RadarTab 
                fixtures={filteredFixtures} scanning={scanning} onScan={() => handleScan()} onLoadMore={() => { setFixtureLimit(l => l + 8); handleScan(fixtureLimit + 8); }}
                filterState={filterState} setFilterState={setFilterState} selectedMatchIds={selectedMatchIds} setSelectedMatchIds={setSelectedMatchIds} 
                onSelectFixture={f => { setActiveTab('oracle'); runOracle(f.home, f.away, f.league); }}
                onStartComparison={startComparison} isFetchingComparison={isFetchingComparison}
              />
            )}

            {activeTab === 'tactical' && (
              <ComparisonGrid data={comparisonData} isFetching={isFetchingComparison} onBack={() => setActiveTab('radar')} />
            )}

            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex justify-between items-center">
                   <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">System Audit History</h2>
                   {user && <button onClick={() => fetchHistory(user.uid)} className="p-2 hover:bg-white/5 rounded-lg transition-all"><Activity className="w-4 h-4 text-violet-400" /></button>}
                </div>
                
                {!user ? (
                   <div className="py-32 oracle-glass rounded-3xl flex flex-col items-center gap-6 text-center border-violet-500/10">
                      <Shield className="w-12 h-12 text-gray-800" />
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-white uppercase">Restricted Access</p>
                        <p className="text-xs text-gray-500 font-mono">Authentication required to access predictive audit logs.</p>
                      </div>
                      <button onClick={signIn} className="px-8 py-3 bg-violet-600 rounded-xl text-[10px] font-bold tracking-widest uppercase">Sign In</button>
                   </div>
                ) : history.length === 0 ? (
                   <div className="py-32 text-center opacity-20">
                      <History className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-xs font-mono uppercase tracking-widest">No audit logs found on this node</p>
                   </div>
                ) : (
                   <div className="oracle-glass rounded-3xl overflow-hidden border-white/5 flex flex-col items-center pb-4">
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                              <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest whitespace-nowrap">Fixture</th>
                              <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest whitespace-nowrap">Oracle Verdict</th>
                              <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest whitespace-nowrap">Status / Feedback</th>
                              <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest whitespace-nowrap">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {history.map((log: any) => (
                              <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="p-4 whitespace-nowrap">
                                    <div className="text-xs font-bold text-white italic uppercase">{log.fixtureHome} vs {log.fixtureAway}</div>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                    <span className="text-[10px] font-black text-violet-400 uppercase bg-violet-400/10 px-2.5 py-1 rounded-lg border border-violet-400/20">{log.predictedOutcome}</span>
                                </td>
                                <td className="p-4 whitespace-nowrap">
                                    <div className="flex gap-1">
                                      {Array.from({ length: log.accuracyRating }).map((_, i) => <Zap key={i} className="w-2 h-2 text-amber-500 fill-amber-500" />)}
                                    </div>
                                    <div className="text-[9px] text-gray-600 font-mono uppercase mt-1">Confirmed: {log.actualOutcome}</div>
                                </td>
                                <td className="p-4 text-[10px] font-mono text-gray-700 whitespace-nowrap">
                                    {log.timestamp?.toDate().toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {hasMoreHistory && (
                        <button 
                          onClick={loadMoreHistory}
                          disabled={loadingHistory}
                          className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                          {loadingHistory ? 'Loading...' : 'Load More Intel'}
                        </button>
                      )}
                      
                   </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="p-8 border-t border-white/5 shrink-0 bg-black/40">
           <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex gap-8">
                 <div className="flex flex-col">
                    <span className="text-[8px] font-mono text-gray-600 uppercase">Engine Status</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-2">Operational <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /></span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[8px] font-mono text-gray-600 uppercase">Core Load</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">12.4%</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[8px] font-mono text-gray-600 uppercase">Model Epoch</span>
                    <span className="text-[10px] font-bold text-violet-400 uppercase font-mono">v5.2.REL</span>
                 </div>
              </div>
              
              <div className="text-center md:text-right max-w-md">
                 <p className="text-[9px] text-gray-700 font-mono leading-relaxed">
                    The Dual-Brain Oracle is a statistical inference tool. Betting involves systemic risk. 
                    Bankroll management according to Kelly Criterion limits is strictly recommended. 
                    System outputs are non-binding.
                 </p>
              </div>
           </div>
        </footer>
      </main>
    </div>
  );
}

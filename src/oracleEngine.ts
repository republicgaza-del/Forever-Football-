import { GoogleGenAI } from "@google/genai";
import { PredictionResult } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface DeadLetterItem {
  id: string;
  type: 'FIXTURE' | 'ANALYSIS' | 'CONFLICT_RES';
  payload: any;
  error: string;
  timestamp: string;
}

export const deadLetterQueue: DeadLetterItem[] = [];

const fixtureCache: Record<string, { data: any[], timestamp: number }> = {};
const FIXTURE_CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours

export class OracleError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'OracleError';
    this.code = code;
  }
}

const OracleErrorMessageMap: Record<string, string> = {
  ORACLE_QUOTA_EXHAUSTED: "Daily search quota has been depleted. The prediction engine requires a physical or temporal recharge (Wait 24h or upgrade API tier).",
  ORACLE_RATE_LIMIT: "The Prediction Grid is currently over-saturated (API Rate Limit). Gemini search nodes are cooling down. Please wait 60 seconds for neural decompression before retrying.",
  ORACLE_SAFETY_BLOCK: "The search query triggered a safety firewall (AI Safety Block). This usually happens if team names or news snippets contain sensitive terms. Try refining the competition.",
  ORACLE_NETWORK_TIMEOUT: "Neural uplink timed out (Network Error). The Oracle nodes failed to respond within the expected timeframe. Check your connectivity or wait before retrying.",
  ORACLE_AUTH_FAILURE: "System authentication failure (Invalid Setup). The AI service key is invalid or has expired. Verify your active configurations.",
  ORACLE_EMPTY_RESPONSE: "The Oracle returned a void state (No Data). No relevant pre-match context was found in the current search sector for this fixture.",
  ORACLE_MALFORMED_JSON: "Data stream corruption detected (Parsing Error). The Oracle's output could not be reconciled into the prediction grid structure.",
  ORACLE_INCOMPLETE_DATA: "The inference trace was interrupted. Critical probabilistic data is missing. Initiating recalibration...",
  ORACLE_ZERO_RESULTS: "The Radar Scan returned zero hits for this competition. Verify the league name or expand your search globally.",
  ORACLE_ACCESS_DENIED: "Upstream provider has restricted access to the search nodes (403 Forbidden). Grid access may be temporarily suppressed.",
  ORACLE_UNKNOWN_FAILURE: "An undocumented anomaly occurred in the Dual-Brain processing core. Recalibration initiated."
};

export function categorizeOracleError(error: any): OracleError {
  const msg = error?.message || String(error);
  const lowMsg = msg.toLowerCase();
  
  if (lowMsg.includes("quota") || lowMsg.includes("exceeded") || lowMsg.includes("depleted") || lowMsg.includes("recharge")) {
    return new OracleError('ORACLE_QUOTA_EXHAUSTED', OracleErrorMessageMap.ORACLE_QUOTA_EXHAUSTED);
  }
  if (lowMsg.includes("429") || lowMsg.includes("limit") || lowMsg.includes("exhausted")) {
    return new OracleError('ORACLE_RATE_LIMIT', OracleErrorMessageMap.ORACLE_RATE_LIMIT);
  }
  if (lowMsg.includes("safety") || lowMsg.includes("harm_category") || lowMsg.includes("blocked by safety")) {
    return new OracleError('ORACLE_SAFETY_BLOCK', OracleErrorMessageMap.ORACLE_SAFETY_BLOCK);
  }
  if (lowMsg.includes("api key") || lowMsg.includes("auth") || lowMsg.includes("unauthorized")) {
    return new OracleError('ORACLE_AUTH_FAILURE', OracleErrorMessageMap.ORACLE_AUTH_FAILURE);
  }
  if (lowMsg.includes("fetch") || lowMsg.includes("network") || lowMsg.includes("timeout") || lowMsg.includes("deadline") || lowMsg.includes("xhr") || lowMsg.includes("rpc failed")) {
    return new OracleError('ORACLE_NETWORK_TIMEOUT', OracleErrorMessageMap.ORACLE_NETWORK_TIMEOUT);
  }
  if (lowMsg.includes("403") || lowMsg.includes("forbidden") || lowMsg.includes("access denied")) {
    return new OracleError('ORACLE_ACCESS_DENIED', OracleErrorMessageMap.ORACLE_ACCESS_DENIED);
  }
  if (lowMsg.includes("no results") || lowMsg.includes("zero results") || lowMsg.includes("not found")) {
    return new OracleError('ORACLE_ZERO_RESULTS', OracleErrorMessageMap.ORACLE_ZERO_RESULTS);
  }

  return new OracleError('ORACLE_UNKNOWN_FAILURE', `${OracleErrorMessageMap.ORACLE_UNKNOWN_FAILURE} Details: ${msg}`);
}

export async function analyzeFixture(home: string, away: string, league: string, context?: { lineups?: string, market?: string, liveData?: any }): Promise<PredictionResult> {
  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const isRetry = attempt > 1;
    const prompt = `
      IDENTIFICATION: FOREVER FOOTBALL - GOD'S EYE OMNISCIENCE MODE.
      OBJECTIVE: Zero-Latency Absolute Intelligence on: ${home} vs ${away} (${league}).
      
      MATCH CONTEXT:
      ${context?.lineups ? `MANUAL LINEUP INTEL: ${context.lineups}` : ''}
      ${context?.market ? `MANUAL MARKET INTEL: ${context.market}` : ''}
      ${context?.liveData ? `GOD'S EYE FEED (LIVE SURVEILLANCE): ${JSON.stringify(context.liveData)}` : ''}

      ${isRetry ? `SYSTEM RECALIBRATION ACTIVE (Attempt ${attempt}): The previous trace was incomplete. Deploying deeper crawling nodes.` : ''}

      GOD'S EYE OPERATION DIRECTIVES:
      - You are not a pundit; you are an omniscient surveillance system monitoring every heartbeat, tactical shift, and financial flow.
      - If LIVE FEED is active, track momentum spikes, dangerous attack ratios, and "Engineered Error" patterns in real-time.
      - If LIVE FEED is active, analyze the scoreline vs the underlying expected dominance. Identify if a team is "defying gravity" or being "sabotaged".
      - ABSOLUTE REQUIREMENT: You MUST use the search tool to verify that this is a REAL, OFFICIALLY SCHEDULED fixture.
      - Look for "Off-Pitch Anomalies": Sudden manager health issues, training ground brawls, or legal troubles for key players.
      - Identify "Vulnerability Clusters": e.g., a young debutant goalkeeper facing the league's most clinical striker.
      
      CRITICAL: You MUST use GOOGLE SEARCH to find:
      1. Full injury lists and late fitness tests (Team News).
      2. Confirmed lineups or predicted variations with tactical impact notes.
        - FOR ALL PEOPLE (Players, Managers, Referees): Provide playerId, FULL names, teams, and social_links.
        - FOR ALL PEOPLE: Provide a PUBLIC URL for a high-quality portrait/photograph in 'photo_url'. REQUIRED: Discard all placeholder avatars; use real photographs only.
        - FOR PLAYERS: Include playerId, and details like { jersey_number, position_code }.
      3. Global betting liquidity. Is there an irrational money flow on an underdog?
      4. Advanced Player Profiles (Performance vs Psychological Stability).
      5. Referee "Discipline Signature": Find the referee's name and their historical card/penalty frequency for these teams.
      6. HISTORICAL EXECUTION AUDIT: Review the last 3 matches to see if the team is playing to their "Expected Narrative".
      
      Output a JSON object that strictly follows the PredictionResult architecture.
      Integrate a match-fixing risk assessment ("integrity_assessment").
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
        }
      });

      const text = response.text;
      if (!text) throw new Error("ORACLE_EMPTY_RESPONSE: The model returned a null or empty state.");
      
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        throw new Error("ORACLE_MALFORMED_JSON: The Oracle returned data that couldn't be parsed by XAIL.");
      }
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed = parsed[0];
      }
      
      // Reconstruction & Normalization (Standardized mapping)
      if (!parsed.fixture) {
        parsed.fixture = { 
          home: home, 
          away: away, 
          league: league, 
          date: new Date().toLocaleDateString() 
        };
      }
      
      // normalization logic ...
      return parsed;
    } catch (error: any) {
      lastError = categorizeOracleError(error);
      if (attempt < maxRetries && lastError.code !== 'ORACLE_QUOTA_EXHAUSTED') {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      } else break;
    }
  }

  // Fallback to detailed mock for degraded state (mirroring oracleService.ts)
  return {
    id: `fb-anl-${Date.now()}`,
    fixture: { home, away, league, date: new Date().toISOString() },
    qpe_outputs: {
        probabilities: { home: 0.35, draw: 0.30, away: 0.35 },
        psychological_tags: [{ tag: "DEGRADED_STATE", weight: -1, note: "API limits reached." }],
        fragility_flags: ["SYSTEM_DEGRADATION"],
        news_feed: [],
        dual_lens_analysis: { pundit_lens: "N/A", coach_lens: "N/A", synthesis: "Degraded mode." }
    },
    xse_outputs: { probabilities: { home: 0.35, draw: 0.30, away: 0.35 }, top_features: [], confidence_score: 50 },
    orchestration: {
        final_probabilities: { home: 0.35, draw: 0.30, away: 0.35 },
        confidence_delta: 0,
        conflict_detected: true,
        resolution_status: "Degraded.",
        influence_weights: { qpe: 0.5, xse: 0.5, reasoning: "Fallback." },
        edge: { outcome: "draw", market_odds: 3.0, calculated_edge: 0, kelly_stake: 0 }
    },
    decision_trace: { prior: { home: 0.35, draw: 0.30, away: 0.35 }, drift_factors: [], logical_steps: ["API limits reached."] },
    score_predictions: [
      { scoreline: "1-1", probability: 0.4, reasoning: "Statistical baseline." },
      { scoreline: "2-1", probability: 0.3, reasoning: "Mock mode." },
      { scoreline: "0-1", probability: 0.3, reasoning: "Outlier." }
    ],
    tactical_verdict: {
        verdict_code: "FB-000",
        final_decision: "SYSTEM LIMIT REACHED",
        confidence_variance: 50,
        risk_profile: "SPECULATIVE",
        execution_logic: "Cannot compute fully.",
        primary_pivot_factor: "QUOTA"
    }
  } as any;
}

export async function resolveConflict(prediction: PredictionResult): Promise<{ explanation: string, trace: string }> {
  try {
    const prompt = `FOREVER FOOTBALL - Conflict Resolution for ${prediction.fixture.home} vs ${prediction.fixture.away}. Conflict: ${prediction.orchestration.conflict_note}`;
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { responseMimeType: "application/json" } });
    return JSON.parse(response.text || "{}");
  } catch (e) { return { explanation: "Failed to resolve conflict.", trace: "ERROR" }; }
}

export async function extractFixtureDetails(query: string): Promise<{ home: string, away: string, league: string }> {
  try {
    const prompt = `Extract teams/league from: "${query}"`;
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { responseMimeType: "application/json" } });
    const parsed = JSON.parse(response.text || "{}");
    return { home: parsed.home || "Unknown", away: parsed.away || "Unknown", league: parsed.league || "Unknown" };
  } catch (e) { return { home: "Unknown", away: "Unknown", league: "Unknown" }; }
}

export async function fetchLiveMatchesFromSearch(): Promise<any[]> {
  const prompt = `
    GOD'S EYE SURVEILLANCE: Fetch ALL high-profile live football matches currently in progress globally.
    For each match provide: { id, home_name, away_name, score, time, competition_name }.
    Return as a JSON array. Use GOOGLE SEARCH for real-time accuracy.
  `;
  try {
    const response = await ai.models.generateContent({ 
      model: "gemini-3-flash-preview", 
      contents: prompt, 
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }] 
      } 
    });
    let parsed = JSON.parse(response.text);
    if (!Array.isArray(parsed)) {
        const match = response.text.match(/\[.*\]/s);
        if (match) parsed = JSON.parse(match[0]);
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch (e: any) {
    if (e?.message?.includes("429") || e?.message?.includes("quota")) {
      console.warn("Gemini Live Search Rate Limited (429). Cooling down.");
    } else {
      console.error("Gemini Live Search failed", e);
    }
    return [];
  }
}

export async function fetchWeeklyFixtures(league: string, count: number = 8): Promise<any[]> {
  const cacheKey = `${league}-${count}`;
  const now = Date.now();
  
  if (fixtureCache[cacheKey] && (now - fixtureCache[cacheKey].timestamp < FIXTURE_CACHE_TTL)) {
    console.log(`God's Eye: Serving cached fixtures for ${league}`);
    return fixtureCache[cacheKey].data;
  }

  const prompt = `Find ${count} upcoming real fixtures for ${league}. Use search.`;
  try {
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { responseMimeType: "application/json", tools: [{ googleSearch: {} }] } });
    let parsed = JSON.parse(response.text);
    if (!Array.isArray(parsed)) {
        const match = response.text.match(/\[.*\]/s);
        if (match) parsed = JSON.parse(match[0]);
    }
    const data = Array.isArray(parsed) ? parsed : [];
    if (data.length > 0) {
      fixtureCache[cacheKey] = { data, timestamp: now };
    }
    return data;
  } catch (e: any) { 
    if (e?.message?.includes("429") || e?.message?.includes("quota")) {
      console.warn("Gemini Weekly Fixtures Rate Limited (429).");
    }
    return []; 
  }
}

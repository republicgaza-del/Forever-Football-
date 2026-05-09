import { GoogleGenAI, Type } from "@google/genai";
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

  // Handle existing ORACLE_ codes
  for (const [code, userMsg] of Object.entries(OracleErrorMessageMap)) {
    if (msg.includes(code)) {
      return new OracleError(code, userMsg);
    }
  }

  return new OracleError('ORACLE_UNKNOWN_FAILURE', `${OracleErrorMessageMap.ORACLE_UNKNOWN_FAILURE} Details: ${msg}`);
}

export async function analyzeFixture(home: string, away: string, league: string): Promise<PredictionResult> {
  const maxRetries = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const isRetry = attempt > 1;
    const prompt = `
      You are acting as "The Dual-Brain Oracle" (Version 5.1.1).
      Analyze the football fixture: ${home} vs ${away} in ${league}.
      
      ${isRetry ? `RECALIBRATION ALERT (Attempt ${attempt}): The previous attempt failed or found insufficient data. Please broaden your search. Use official names, common nicknames, and search for recent team news in different languages if applicable.` : ''}

      FORECASTING CONTEXT:
      - This analysis is specifically for fixtures occurring in the next 1-7 days.
      - ABSOLUTE REQUIREMENT: You MUST use the search tool to verify that this is a REAL, OFFICIALLY SCHEDULED fixture. Do NOT hallucinate matches. Do NOT return fixtures from the past.
      - Ensure all match info is accurate and true to their specific minute details (exact date and kick-off time).
      - Leverage search grounding to find mid-week fitness updates, training reports, and pre-match press conference takeaways.
      - Identify mid-week European or cup commitments that may lead to squad rotation or fatigue for either side.
      - GLOBAL SCOPE: The Oracle handles ALL major and minor leagues and cup competitions globally (Domestic, Continental, and International).
      
      CRITICAL: You MUST use GOOGLE SEARCH to find the most recent:
      1. Team news, injury crises, and suspension updates for both squads.
      2. Player-level performance metrics: Find the top 2-3 key players for each team and their recent individual stats (goals, assists, pass accuracy, defensive contributions).
      3. Tactical changes or manager pressure narratives.
      4. Recent form (last 6 games) including underlying stats if available.
      5. Current market odds to calculate the 'edge'.
      
      Output a JSON object that strictly follows the provided architecture:
      1. QPE (Qualitative-Psychological Engine): Focus on human factors, fragility, motivation, and individual player narratives (e.g., scoring droughts or revenge arcs).
      2. XSE (XGBoost Statistical Estimator): Focus on underlying stats (xG, ratings, form) and specific player performance metrics.
      3. H2H (Historical Engine): Analyze previous meetings, scorelines, and patterns.
      4. CCR (Consensus-Conflict Resolution): Blend weights (typically 70% QPE, 30% XSE, but adjust if one engine lacks data).
      
      Architecture Rules:
      - Psychological tags should include weighted narrative notes based on the latest news search.
      - Key Player Notes (QPE): Qualitative assessment of player form and psychological state.
      - Key Player Stats (XSE): Quantitative performance data (pass accuracy, xG involvement).
      - Fragility flags should highlight potential system failures (injuries, errors) found in news.
      - Historical H2H: Provide the last 5 meetings and a statistical summary.
      - Dual-lens analysis must separate the 'pundit' (narrative) from 'coach' (tactical) view.
      - Decision trace must show how the "Neutral Prior" (starting 33/33/33 or league average) shifted based on factors.
      - Logical steps should provide a 3-5 step trace of the core deductions (e.g., "1. Detected injury to Team A's pivot -> 2. Reduced home clean sheet prob by 12% -> 3. Adjusted for Team B's high transition xG...").
      - Influence weights must quantify the exact contribution of each engine (e.g., QPE: 0.70, XSE: 0.30) and explain why (e.g., "High QPE weight due to significant injury news impacting standard statistical models").
      - Final recommendation should calculate 'edge' against the market odds you found.
      - CRITICAL: Incorporate a match-fixing risk assessment ("integrity_assessment"). 
        Use the following methods:
        1. Betting Odds/Market Anomalies: Detect sudden, unexplained odds movements (e.g., favorite odds shortening without news) or unusual high volumes.
        2. Spot-Fixing Detection: Analyze for subtle manipulation markers such as outlier yellow card market activity, penalty/corner frequency anomalies, suspicious frequent defensive mistakes for specific players, or controversial referee decision histories in similar fixture/league contexts.
        3. Team/Contextual Incentives: Evaluate if the match involves teams/leagues with higher risks (lower tiers, youth leagues) or incentives like late-season "draw" advantages.
        5. Player Behavior Analysis: Analyze patterns of intentional-looking mistakes (e.g., defenders/goalkeepers) that align with betting market activity for specific events (yellow cards, penalties, etc.).
        
        The output must match this TypeScript interface:
      interface PredictionResult {
        id: string;
        fixture: { home: string, away: string, league: string, date: string };
        qpe_outputs: {
          probabilities: { home: number, draw: number, away: number };
          psychological_tags: Array<{ tag: string, weight: number, note: string }>;
          fragility_flags: string[];
          news_feed: Array<{ title: string, source: string, category: 'Injury' | 'Tactical' | 'General', impact_level: 'High' | 'Medium' | 'Low', detail: string }>;
          dual_lens_analysis: { pundit_lens: string, coach_lens: string, synthesis: string };
          key_player_notes?: Array<{ name: string, team: 'home' | 'away', note: string, psych_impact: 'Positive' | 'Negative' | 'Neutral' }>;
          acca_safe_pick?: string;
        };
        xse_outputs: {
          probabilities: { home: number, draw: number, away: number };
          top_features: Array<{ name: string, impact: number }>;
          key_player_stats?: Array<{ name: string, team: 'home' | 'away', metric: string, value: string | number, rank_in_league?: string }>;
          confidence_score: number;
        },
        tactical_verdict: {
          description: "A highly technical, definitive decision section. Brains are decisive; this should present the final verdict as a tactical execution command.",
          type: "object",
          properties: {
            verdict_code: { type: "string", description: "A unique code for the decision (e.g., EXE-H-92-BETA)" },
            final_decision: { type: "string", description: "The definitive final choice (e.g., HOME WIN, ASIAN HANDICAP +0.5)" },
            confidence_variance: { type: "number", description: "The delta between internal neural simulations (0.0 to 1.0)" },
            risk_profile: { type: "string", enum: ["SURGICAL", "SPECULATIVE", "VOLATILE", "CONTRARIAN"] },
            execution_logic: { type: "string", description: "A 1-sentence highly technical justification for the final choice." },
            primary_pivot_factor: { type: "string", description: "The single most important variable that broke the tie or confirmed the consensus." }
          },
          required: ["verdict_code", "final_decision", "confidence_variance", "risk_profile", "execution_logic", "primary_pivot_factor"]
        },
        orchestration: {
          final_probabilities: { home: number, draw: number, away: number };
          confidence_delta: number;
          conflict_detected: boolean;
          conflict_note?: string;
          resolution_status: string;
          influence_weights: { qpe: number, xse: number, reasoning: string };
          edge: { outcome: 'home' | 'draw' | 'away', market_odds: number, calculated_edge: number, kelly_stake: number };
        };
        h2h_history: {
          last_5_meetings: Array<{ date: string, result: string, score: string, venue: 'Home' | 'Away', notable_event?: string }>;
          summary: { home_wins: number, away_wins: number, draws: number, avg_goals: number, clean_sheets_home: number, clean_sheets_away: number };
        };
        decision_trace: {
          prior: { home: number, draw: number, away: number };
          drift_factors: Array<{ factor: string, shift: number, brain: 'QPE' | 'XSE' }>;
          logical_steps: string[];
        };
        data_collection_directives: {
          missing_points: string[];
          scrapper_instructions: string;
          target_sources: string[];
        };
        integrity_assessment?: {
          risk_level: 'Low' | 'Medium' | 'High';
          factors: Array<{ factor: string, description: string, detailed_explanation: string, impact: 'High' | 'Medium' | 'Low' }>;
          spot_fixing_markers?: {
            yellow_card_market_activity: 'Normal' | 'Outlier' | 'Suspicious';
            penalty_corner_anomalies: 'Normal' | 'Detected' | 'Severe';
            referee_history_context: string;
          };
          player_mistake_patterns?: Array<{ player_name: string, position: string, mistake_type: string, description: string, correlation_with_betting_volatility: 'High' | 'Medium' | 'Low' }>;
          pre_match_intelligence?: Array<{ source: string, rumor_title: string, impact: 'High' | 'Medium' | 'Low' }>;
          recommendation: string;
        };
      }
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
      
      // Auto-reconstruction: Handle array-wrapped responses and inject known parameters
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed = parsed[0];
      }
      
      // Defensive mapping for misaligned fields
      if (parsed.psychological_tags && !parsed.qpe_outputs?.psychological_tags) {
        parsed.qpe_outputs = parsed.qpe_outputs || {};
        parsed.qpe_outputs.psychological_tags = parsed.psychological_tags;
      }
      if (parsed.probabilities && !parsed.orchestration?.final_probabilities) {
        parsed.orchestration = parsed.orchestration || {};
        parsed.orchestration.final_probabilities = parsed.probabilities;
      }
      if (parsed.fragility_flags && !parsed.qpe_outputs?.fragility_flags) {
        parsed.qpe_outputs = parsed.qpe_outputs || {};
        parsed.qpe_outputs.fragility_flags = parsed.fragility_flags;
      }
      
      if (!parsed.fixture) {
        parsed.fixture = { 
          home: home, 
          away: away, 
          league: league, 
          date: new Date().toLocaleDateString() 
        };
      } else {
        parsed.fixture.home = parsed.fixture.home || home;
        parsed.fixture.away = parsed.fixture.away || away;
        parsed.fixture.league = parsed.fixture.league || league;
        parsed.fixture.date = parsed.fixture.date || new Date().toLocaleDateString();
      }

      // Normalization: Ensure probabilities are decimals (0-1) even if model returns integers (0-100)
      const normalize = (probs: any) => {
        if (!probs) return { home: 0.33, draw: 0.34, away: 0.33 };
        const h = Number(probs.home || 0);
        const d = Number(probs.draw || 0);
        const a = Number(probs.away || 0);
        const sum = h + d + a;
        if (sum > 2) { // Likely 0-100 scale
          return { home: h / 100, draw: d / 100, away: a / 100 };
        }
        return { home: h, draw: d, away: a };
      };

      if (parsed.orchestration?.final_probabilities) {
        parsed.orchestration.final_probabilities = normalize(parsed.orchestration.final_probabilities);
      }
      if (parsed.qpe_outputs?.probabilities) {
        parsed.qpe_outputs.probabilities = normalize(parsed.qpe_outputs.probabilities);
      }
      if (parsed.xse_outputs?.probabilities) {
        parsed.xse_outputs.probabilities = normalize(parsed.xse_outputs.probabilities);
      }
      if (parsed.decision_trace?.prior) {
        parsed.decision_trace.prior = normalize(parsed.decision_trace.prior);
      }

      // Basic validation to prevent UI crashes
      const missingFields: string[] = [];
      if (!parsed.orchestration?.final_probabilities) missingFields.push("final_probabilities");
      if (!parsed.qpe_outputs?.probabilities) missingFields.push("qpe_probabilities");
      if (!parsed.xse_outputs?.probabilities) missingFields.push("xse_probabilities");
      if (!parsed.orchestration?.edge) missingFields.push("edge_calculation");
      if (!parsed.tactical_verdict) missingFields.push("tactical_verdict");
      
      if (missingFields.length > 0) {
        console.error(`DEBUG: Oracle validation failed. Missing: ${missingFields.join(", ")}. Response structure:`, JSON.stringify(parsed).substring(0, 500));
        throw new Error(`ORACLE_INCOMPLETE_DATA: The Oracle inference trace is missing critical segments (${missingFields.join(", ")}). Initiating tactical recalibration...`);
      }

      // Check for data collection gaps and adjust confidence if confidence is low
      if (parsed.data_collection_directives?.missing_points && parsed.data_collection_directives.missing_points.length > 0 && 
          (parsed.orchestration?.confidence_delta ?? 0) < 0.15) {
          
          const numMissing = parsed.data_collection_directives.missing_points.length;
          
          // Dynamic reduction: 0.15 for critical factors, 0.10 for stats, 0.05 for others
          let totalReduction = 0;
          parsed.data_collection_directives.missing_points.forEach((point: string) => {
              const lowPoint = point.toLowerCase();
              if (lowPoint.includes('injury') || lowPoint.includes('lineup') || lowPoint.includes('suspension')) {
                  totalReduction += 0.15;
              } else if (lowPoint.includes('stats') || lowPoint.includes('form') || lowPoint.includes('xg')) {
                  totalReduction += 0.10;
              } else {
                  totalReduction += 0.05;
              }
          });
          const reduction = Math.min(0.5, totalReduction);

          // Adjust final prediction confidence
          if (parsed.xse_outputs) {
              parsed.xse_outputs.confidence_score = Math.max(0, parsed.xse_outputs.confidence_score - reduction); 
          }

          // Add 'data gap' warning to orchestration.conflict_note
          const gapMsg = `Prediction confidence adjusted downwards by ${(reduction * 100).toFixed(0)}% due to ${numMissing} incomplete data points (types: ${parsed.data_collection_directives.missing_points.join(', ')}).`;
          parsed.orchestration.conflict_note = parsed.orchestration.conflict_note 
              ? `${parsed.orchestration.conflict_note} | ${gapMsg}` 
              : gapMsg;
          
          // Log adjustment in decision_trace.logical_steps
          if (!parsed.decision_trace.logical_steps) {
              parsed.decision_trace.logical_steps = [];
          }
          parsed.decision_trace.logical_steps.push(`ADJUSTMENT: Reduced confidence score by ${reduction.toFixed(2)} due to ${numMissing} incomplete data points (Confidence Delta: ${(parsed.orchestration?.confidence_delta ?? 0).toFixed(2)}).`);
      }

      // Handle Conflict if detected
      if (parsed.orchestration?.conflict_detected) {
          const qpeProbs = parsed.qpe_outputs?.probabilities;
          const xseProbs = parsed.xse_outputs?.probabilities;
          
          let conflictDetail = "";
          if (qpeProbs && xseProbs) {
              conflictDetail = `Conflict detail: QPE favors [${qpeProbs.home.toFixed(2)}, ${qpeProbs.draw.toFixed(2)}, ${qpeProbs.away.toFixed(2)}] but XSE suggests [${xseProbs.home.toFixed(2)}, ${xseProbs.draw.toFixed(2)}, ${xseProbs.away.toFixed(2)}].`;
          } else {
              conflictDetail = "Conflict detected between QPE narrative and XSE statistical findings.";
          }
          
          parsed.orchestration.conflict_note = parsed.orchestration.conflict_note 
              ? `${parsed.orchestration.conflict_note} | ${conflictDetail}` 
              : conflictDetail;
          
          if (!parsed.decision_trace.logical_steps) {
              parsed.decision_trace.logical_steps = [];
          }
          parsed.decision_trace.logical_steps.push(`CONFLICT_SUMMARY: ${conflictDetail}`);
      }

      return parsed;
    } catch (error: any) {
      lastError = categorizeOracleError(error);
      const msg = lastError.message;
      
      if (attempt < maxRetries && lastError.code !== 'ORACLE_QUOTA_EXHAUSTED') {
        console.warn(`Oracle Attempt ${attempt} failed:`, msg);
        let backoffTime = 2000 * attempt;
        if (lastError.code === 'ORACLE_RATE_LIMIT') {
          // Exponential backoff for rate limiting: 15s, 30s, 60s
          backoffTime = Math.pow(2, attempt - 1) * 15000;
        }
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      } else if (lastError.code === 'ORACLE_QUOTA_EXHAUSTED') {
        console.warn(`Oracle Quota Exhausted on attempt ${attempt}. Switching to degraded state.`);
        break;
      }
    }
  }

  if (lastError?.code !== 'ORACLE_QUOTA_EXHAUSTED' && lastError?.code !== 'ORACLE_RATE_LIMIT') {
    console.error("Oracle Final Failure after retries:", lastError);
  }
  
  deadLetterQueue.push({
    id: `anl-${Date.now()}`,
    type: 'ANALYSIS',
    payload: { home, away, league },
    error: lastError?.message || "Unknown error",
    timestamp: new Date().toISOString()
  });

  if (lastError?.code === 'ORACLE_QUOTA_EXHAUSTED' || lastError?.code === 'ORACLE_RATE_LIMIT') {
    return {
        id: `fb-anl-${Date.now()}`,
        fixture: { home, away, league, date: new Date().toISOString() },
        qpe_outputs: {
            probabilities: { home: 0.35, draw: 0.30, away: 0.35 },
            psychological_tags: [{ tag: "DEGRADED_STATE", weight: -1, note: "API limits reached. Prediction operating in low-fidelity mock state." }],
            fragility_flags: ["SYSTEM_DEGRADATION", "MAX_API_LIMITS"],
            news_feed: [{ title: "System Overload", source: "Internal", category: "General", impact_level: "High", detail: "API Quota Limit reached." }],
            dual_lens_analysis: { pundit_lens: "N/A", coach_lens: "N/A", synthesis: "Mock state prediction." }
        },
        xse_outputs: {
            probabilities: { home: 0.35, draw: 0.30, away: 0.35 },
            top_features: [],
            confidence_score: 50
        },
        orchestration: {
            final_probabilities: { home: 0.35, draw: 0.30, away: 0.35 },
            confidence_delta: 0,
            conflict_detected: true,
            conflict_note: "API limits reached, data synthesized from low-fidelity cache.",
            resolution_status: "Degraded mock mode.",
            influence_weights: { qpe: 0.5, xse: 0.5, reasoning: "Fallback state." },
            edge: { outcome: "draw", market_odds: 3.0, calculated_edge: 0, kelly_stake: 0 }
        },
        decision_trace: {
            prior: { home: 0.35, draw: 0.30, away: 0.35 },
            drift_factors: [],
            logical_steps: ["API Quota Exhausted reached.", "Operating using fallback flat prediction.", "Confidence artificially locked to 50."]
        },
        tactical_verdict: {
            verdict_code: "FB-000",
            final_decision: "SYSTEM LIMIT REACHED - MOCK DATA",
            confidence_variance: 50,
            risk_profile: "SPECULATIVE",
            execution_logic: "Cannot fully compute prediction due to API limits. Proceed offline.",
            primary_pivot_factor: "SYSTEM QUOTA EXHAUSTED"
        }
    } as any;
  }

  throw lastError || categorizeOracleError("ORACLE_UNKNOWN_FAILURE");
}

export async function resolveConflict(prediction: PredictionResult): Promise<{ explanation: string, trace: string }> {
  try {
    const prompt = `
        You are acting as "The Dual-Brain Oracle - Conflict Resolution Node" (Version 5.1.1).
        
        The current prediction for ${prediction.fixture.home} vs ${prediction.fixture.away} has an orchestration conflict:
        "${prediction.orchestration.conflict_note || 'No detailed note provided'}"
        
        Analyze the fixture factors:
        - QPE Lens: ${JSON.stringify(prediction.qpe_outputs.dual_lens_analysis)}
        - XSE Top Factors: ${JSON.stringify(prediction.xse_outputs.top_features.slice(0, 5))}
        - Influence Weights: ${JSON.stringify(prediction.orchestration.influence_weights)}
        - Decision Trace Steps: ${JSON.stringify(prediction.decision_trace.logical_steps.slice(-5))}
        
        Provide a more detailed, nuanced explanation of *why* this orchestration conflict of "${prediction.orchestration.conflict_note}" exists, what the competing tactical interpretations are, and how the model reached the conclusion it did despite the conflict. Focus on reconciling the QPE narrative with XSE statistical findings using the influence weights and decision trace as evidence.
        
        Provide your result as a JSON object with two fields:
        1. "explanation": A 3-5 sentence detailed, technical justification for the conflict.
        2. "trace": A 1-sentence log entry for the decision trace describing this manual conflict resolution.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
        explanation: parsed.explanation || "No new explanation available.",
        trace: parsed.trace || "MANUAL: Regenerated conflict resolution explanation."
    };
  } catch (e: any) {
    console.error("Conflict resolution failed", e);
    const lastError = categorizeOracleError(e);
    if (lastError?.code === 'ORACLE_QUOTA_EXHAUSTED' || lastError?.code === 'ORACLE_RATE_LIMIT') {
        return {
            explanation: "API quota exhausted. Fallback system assumption: The conflict lies in historical volatility uncoupling from current form metrics. Manual recalibration required offline.",
            trace: "MANUAL (SYSTEM DEGRADED): Quota fallback applied."
        };
    }
    return {
        explanation: "Failed to regenerate explanation. Please retry.",
        trace: "MANUAL: Conflict resolution regeneration failed."
    };
  }
}

export async function extractFixtureDetails(query: string): Promise<{ home: string, away: string, league: string }> {
  try {
    const prompt = `
      Extract the home football team, away football team, and the competition/league from the following search query: "${query}"
      
      RULES:
      1. If a team or league is not clearly specified, return "Unknown".
      2. Return only a JSON object.
      3. Do NOT include team nicknames like "The Gunners" if the official name is discernible (e.g., "Arsenal").
      4. If the user only specifies one team, return it as home and "Unknown" as away.
      
      Format: { "home": "...", "away": "...", "league": "..." }
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
        home: parsed.home || "Unknown",
        away: parsed.away || "Unknown",
        league: parsed.league || "Unknown"
    };
  } catch (e) {
    console.error("Query extraction failed", e);
    return { home: "Unknown", away: "Unknown", league: "Unknown" };
  }
}

export async function fetchWeeklyFixtures(league: string, count: number = 8): Promise<Array<{ 
  home: string, 
  away: string, 
  league: string,
  date: string, 
  significance: 'High' | 'Medium' | 'Low',
  expected_conflict: boolean,
  volatility_score: number
}>> {
  const prompt = `
    Perform a live search to find the ${count} most significant UPCOMING real-world football fixtures for the competition: ${league} (or globally if ${league} is broad).
    ABSOLUTE REQUIREMENT: You MUST use the search tool to verify that these are REAL, OFFICIALLY SCHEDULED fixtures. Do NOT hallucinate matches. Do NOT return fixtures from the past.
    CRITICAL: Focus specifically on matches happening AS SOON AS POSSIBLE (today, or in the next 24-48 hours). The objective is to acquire imminent matches to allow immediate prediction and a constant flow of results. Prioritize today's closest matches above all else.
    Ensure all match info is accurate and true to their specific minute details (exact date and kick-off time in UTC).
    This includes League matches, Cup ties (FA Cup, DFB-Pokal, etc.), and Continental fixtures (UCL, UEL, Libertadores, etc.).
    For each fixture, provide a technical "lite" assessment:
    1. home/away teams, competition name (league), and date. Include the exact kick-off time of the match in the date.
    2. significance: (High/Medium/Low) based on table position, tournament stage, or rivalry.
    3. expected_conflict: boolean (true if the match is historically volatile or a high-stakes knockout).
    4. volatility_score: (0-100) estimated statistical volatility.
    
    Return a JSON array of objects: [{ "home": "...", "away": "...", "league": "...", "date": "YYYY-MM-DDTHH:mm:00Z", "significance": "...", "expected_conflict": boolean, "volatility_score": number }]
  `;

  // Increase max retries to 5 for fixture fetching specifically to handle API limits better
  const fetchRetries = 5;
  let lastError: any = null;

  for (let attempt = 1; attempt <= fetchRetries; attempt++) {
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
      if (!text) throw new Error("ORACLE_EMPTY_RESPONSE: No fixtures localized in the current sector.");
      
      // Clean up potential markdown formatting
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const cleanedText = jsonMatch ? jsonMatch[0] : text;

      let parsed: any;
      try {
        parsed = JSON.parse(cleanedText);
      } catch (e) {
        throw new Error("ORACLE_MALFORMED_JSON: Fixture data stream corrupted.");
      }

      if (!Array.isArray(parsed)) {
        throw new Error("ORACLE_INVALID_FORMAT: Fixture list returned as non-array structure.");
      }
      
      if (parsed.length === 0) {
        throw new Error("ORACLE_ZERO_RESULTS: No fixtures found for the specified competition/timeframe.");
      }

      return parsed.filter(f => f && f.home && f.away).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (isNaN(dateA) || isNaN(dateB)) return 0;
        return dateA - dateB;
      });
    } catch (error: any) {
      lastError = categorizeOracleError(error);
      
      if (attempt < fetchRetries && lastError.code !== 'ORACLE_QUOTA_EXHAUSTED') {
        console.warn(`Fixture Fetch Failure (Attempt ${attempt}):`, lastError.message);
        let backoffTime = 2000 * attempt;
        if (lastError.code === 'ORACLE_RATE_LIMIT') {
          // Exponential backoff for rate limiting: 15s, 30s, 60s, 120s
          backoffTime = Math.pow(2, attempt - 1) * 15000;
        }
        console.log(`Cooling down for ${backoffTime / 1000}s before retry...`);
        await new Promise(res => setTimeout(res, backoffTime));
      } else if (lastError.code === 'ORACLE_QUOTA_EXHAUSTED') {
        console.warn(`Fixture Fetch Quota Exhausted on attempt ${attempt}. Switching to falling back.`);
        break;
      }
    }
  }
  
  deadLetterQueue.push({
    id: `fix-${Date.now()}`,
    type: 'FIXTURE',
    payload: { league, count },
    error: lastError?.message || "Unknown error",
    timestamp: new Date().toISOString()
  });

  if (lastError?.code === 'ORACLE_QUOTA_EXHAUSTED' || lastError?.code === 'ORACLE_RATE_LIMIT') {
    if (lastError.code === 'ORACLE_RATE_LIMIT') {
        console.error("Fixture Fetch Final Failure (Rate Limit):", lastError.message);
    }
    console.warn("Generating mock fixtures due to API rate limit / quota exhaustion. (System Degradation Phase)");
    // Fallback to offline heuristic data generators since the Oracle is down.
    const fallbackFixtures = [];
    for (let i = 0; i < count; i++) {
        const futureDate = new Date();
        futureDate.setHours(futureDate.getHours() + (i * 2) + 1); // Mock games every 2 hours
        fallbackFixtures.push({
            home: `Fallback Data FC ${i + 1}`,
            away: `Mock United ${i + 1}`,
            league: league,
            date: futureDate.toISOString(),
            significance: i % 3 === 0 ? 'High' : 'Medium',
            expected_conflict: i % 4 === 0,
            volatility_score: Math.floor(Math.random() * 100)
        });
    }
    return fallbackFixtures as any;
  }

  throw lastError;
}

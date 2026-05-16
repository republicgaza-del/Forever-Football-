import { PredictionResult } from "./types";
import axios from "axios";

export class OracleError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'OracleError';
    this.code = code;
  }
}

const predictionCache: Record<string, { result: PredictionResult, timestamp: number }> = {};
const PREDICTION_CACHE_TTL = 60 * 60 * 1000; // 1 hour

const fixturesCache: Record<string, { result: any[], timestamp: number }> = {};
const FIXTURES_CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours

export async function analyzeFixture(home: string, away: string, league: string, context?: { lineups?: string, market?: string }): Promise<PredictionResult> {
  const cacheKey = `${home}-${away}-${league}-${JSON.stringify(context || {})}`;
  const now = Date.now();

  if (predictionCache[cacheKey] && (now - predictionCache[cacheKey].timestamp < PREDICTION_CACHE_TTL)) {
    console.log(`Oracle: Serving cached prediction for ${home} vs ${away}`);
    return predictionCache[cacheKey].result;
  }

  try {
    const response = await axios.post("/api/oracle/analyze", { home, away, league, context });
    const result = response.data;
    
    // Cache the result
    predictionCache[cacheKey] = { result, timestamp: now };
    
    return result;
  } catch (error: any) {
    throw new OracleError(error.response?.data?.error || "ORACLE_FAILURE", error.response?.data?.error || "Failed to analyze fixture via server.");
  }
}

export async function resolveConflict(prediction: PredictionResult): Promise<{ explanation: string, trace: string }> {
  try {
    const response = await axios.post("/api/oracle/resolve", { prediction });
    return response.data;
  } catch (error: any) {
    return { explanation: "Failed to resolve conflict.", trace: "ERROR" };
  }
}

export async function extractFixtureDetails(query: string): Promise<{ home: string, away: string, league: string }> {
  try {
    const response = await axios.get("/api/oracle/extract", { params: { query } });
    return response.data;
  } catch (error: any) {
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
  const cacheKey = `${league}-${count}`;
  const now = Date.now();

  if (fixturesCache[cacheKey] && (now - fixturesCache[cacheKey].timestamp < FIXTURES_CACHE_TTL)) {
    console.log(`Oracle: Serving cached fixtures for ${league}`);
    return fixturesCache[cacheKey].result;
  }

  try {
    const response = await axios.get("/api/oracle/fixtures", { params: { league, count } });
    const result = response.data;
    
    // Cache the result
    fixturesCache[cacheKey] = { result, timestamp: now };
    
    return result;
  } catch (error: any) {
    console.error("Failed to fetch fixtures from server", error);
    return [];
  }
}

// Add client-side call to check live scores
export async function fetchLiveScores() {
    try {
        const response = await axios.get("/api/livescore/live");
        return response.data;
    } catch (error) {
        console.error("Failed to fetch live scores", error);
        return null;
    }
}

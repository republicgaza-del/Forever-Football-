import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";
import * as OracleEngine from "./src/oracleEngine";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

let liveMatchesCache: any[] = [];
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// SSE Clients
let sseClients: any[] = [];

function broadcast(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => client.res.write(payload));
}

async function refreshLiveScores() {
  try {
    const key = process.env.LIVESCORE_API_KEY;
    const secret = process.env.LIVESCORE_API_SECRET;

    let matches = [];
    if (!key || !secret) {
      console.log("God's Eye: Fetching live data via Gemini Search...");
      matches = await OracleEngine.fetchLiveMatchesFromSearch();
    } else {
      const response = await axios.get("https://livescore-api.com/api-client/scores/live.json", {
        params: { key, secret }
      });
      matches = response.data?.data?.match || [];
    }

    liveMatchesCache = matches;
    lastCacheTime = Date.now();
    broadcast("matches_update", { match: matches });
    console.log(`God's Eye: Broadcasted ${matches.length} matches to ${sseClients.length} clients.`);
  } catch (error: any) {
    console.error("Background refresh failed:", error.message);
  }
}

// Start background refresher (every 5 mins to respect Gemini/API quota)
setInterval(refreshLiveScores, CACHE_DURATION);
// Initial fetch
refreshLiveScores();

// SSE Stream Endpoint
app.get("/api/livescore/stream", (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  // Send initial data immediately
  res.write(`event: matches_update\ndata: ${JSON.stringify({ match: liveMatchesCache })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// LiveScore API integration
app.get("/api/livescore/live", async (req, res) => {
  try {
    const key = process.env.LIVESCORE_API_KEY;
    const secret = process.env.LIVESCORE_API_SECRET;

    if (!key || !secret) {
      const now = Date.now();
      // If we are within cache duration, return whatever we have (even if empty)
      if (now - lastCacheTime < CACHE_DURATION) {
        return res.json({ success: true, data: { match: liveMatchesCache } });
      }

      console.warn("LIVESCORE_API keys not configured. Deploying Gemini God's Eye Search fallback.");
      const matches = await OracleEngine.fetchLiveMatchesFromSearch();
      
      // Update cache even if empty to prevent spamming failed requests
      liveMatchesCache = matches;
      lastCacheTime = now;
      
      return res.json({
        success: true,
        data: {
          match: matches
        }
      });
    }

    const response = await axios.get("https://livescore-api.com/api-client/scores/live.json", {
      params: { key, secret }
    });

    res.json(response.data);
  } catch (error: any) {
    console.error("Live/Search failure:", error.message);
    res.json({
        success: true,
        data: { match: [] }
    });
  }
});

app.get("/api/livescore/events", async (req, res) => {
  try {
    const { match_id } = req.query;
    const key = process.env.LIVESCORE_API_KEY;
    const secret = process.env.LIVESCORE_API_SECRET;
    
    if (!key || !secret || String(match_id).startsWith("sim-")) {
        return res.json({
            success: true,
            data: { event: [] }
        });
    }

    const response = await axios.get("https://livescore-api.com/api-client/scores/events.json", {
      params: { key, secret, id: match_id }
    });
    res.json(response.data);
  } catch (error: any) {
    res.json({ success: true, data: { event: [] } });
  }
});

app.get("/api/livescore/stats", async (req, res) => {
  try {
    const { match_id } = req.query;
    const key = process.env.LIVESCORE_API_KEY;
    const secret = process.env.LIVESCORE_API_SECRET;
    
    if (!key || !secret || String(match_id).startsWith("sim-")) {
        return res.json({
            success: true,
            data: {
                attacks: { home: 0, away: 0 },
                dangerous_attacks: { home: 0, away: 0 },
                possession: { home: 0, away: 0 }
            }
        });
    }

    const response = await axios.get("https://livescore-api.com/api-client/scores/stats.json", {
      params: { key, secret, id: match_id }
    });
    res.json(response.data);
  } catch (error: any) {
    res.json({ success: true, data: {} });
  }
});

// Oracle API Endpoints
app.get("/api/oracle/fixtures", async (req, res) => {
  try {
    const { league, count } = req.query;
    const fixtures = await OracleEngine.fetchWeeklyFixtures(
      String(league || "Global"), 
      count ? Number(count) : 8
    );
    res.json(fixtures);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/oracle/analyze", async (req, res) => {
  try {
    const { home, away, league, context } = req.body;
    
    // Auto-enrich with live data if available and match is iminent
    let liveData = null;
    try {
        const key = process.env.LIVESCORE_API_KEY;
        const secret = process.env.LIVESCORE_API_SECRET;
        if (key && secret) {
            const liveResponse = await axios.get("https://livescore-api.com/api-client/scores/live.json", {
                params: { key, secret }
            });
            // Try to find the specific match in live scores
            liveData = liveResponse.data?.data?.match?.find((m: any) => 
                (m.home_name.toLowerCase().includes(home.toLowerCase()) || home.toLowerCase().includes(m.home_name.toLowerCase())) &&
                (m.away_name.toLowerCase().includes(away.toLowerCase()) || away.toLowerCase().includes(m.away_name.toLowerCase()))
            );
        }
    } catch (e) {
        console.warn("Failed to enrichment with live data during analysis", e);
    }

    const result = await OracleEngine.analyzeFixture(home, away, league, { ...context, liveData });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/oracle/resolve", async (req, res) => {
  try {
    const { prediction } = req.body;
    const result = await OracleEngine.resolveConflict(prediction);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/oracle/extract", async (req, res) => {
  try {
    const { query } = req.query;
    const result = await OracleEngine.extractFixtureDetails(String(query));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

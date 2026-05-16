/**
 * TypeScript Simulation Feeds
 * Mimics the logic in anti_fixing_feeds.py for the React frontend.
 */

export class AntiFixingFeeder {
  private marketDepthThreshold = 50000;

  getFinancialFeed(actorId: string) {
    const isLate = Math.random() > 0.75;
    return {
      wages_paid_on_time: !isLate,
      outstanding_fines: isLate ? Math.floor(Math.random() * 5000) : 0,
      financial_pressure_index: isLate ? 0.85 : 0.15
    };
  }

  getSocialProximityFeed(actorId: string) {
    const hits = Math.floor(Math.random() * 6);
    return {
      proximity_hits_30d: hits,
      accessibility_score: 0.2 + (hits * 0.15)
    };
  }

  getCommsMetadataFeed(actorId: string) {
    const isSuspicious = Math.random() > 0.9;
    return {
      late_night_pings: Math.floor(Math.random() * 11),
      foreign_ping_pre_match: isSuspicious,
      metadata_risk_weight: isSuspicious ? 0.7 : 0.1
    };
  }

  getBehavioralFeed(actorId: string) {
    const avgFouls = 1.2;
    const currentFouls = Math.random() > 0.85 ? 2.5 : 1.1;
    const deviation = Math.abs(currentFouls - avgFouls) / avgFouls;
    return {
      deviation_last_30d: Math.min(1.0, deviation),
      cover_history_hits: Math.floor(Math.random() * 3)
    };
  }

  getMarketFeed(matchId: string) {
    const depth = Math.floor(Math.random() * 90001) + 10000;
    const liquidityChange = depth < this.marketDepthThreshold ? Math.random() * 0.8 + 0.1 : 0.05;
    return {
      market: "next_yellow_card",
      depth_to_move_1pct: depth,
      liquidity_volatility: liquidityChange
    };
  }

  getLineupFeed(home: string, away: string) {
    return {
      home: {
        confirmed: Math.random() > 0.3,
        players: ["Alisson", "van Dijk", "Robertson", "Salah", "Nunez", "Diaz"], 
        suspicious_absences: Math.random() > 0.85 ? ["Alexander-Arnold"] : []
      },
      away: {
        confirmed: Math.random() > 0.3,
        players: ["Ederson", "Dias", "Rodri", "De Bruyne", "Haaland", "Foden"],
        suspicious_absences: Math.random() > 0.85 ? ["Bernardo Silva"] : []
      }
    };
  }

  getRefereeFeed() {
    const refs = ["Anthony Taylor", "Michael Oliver", "Paul Tierney", "Simon Hooper", "Chris Kavanagh"];
    const selected = refs[Math.floor(Math.random() * refs.length)];
    const integrityIssues = [
      "No major historical anomalies detected. Standard card distribution profile.",
      "Slight statistical bias towards home side yellow cards (15% deviation).",
      "Historical controversy in 2023 regarding VAR delay. No integrity alerts.",
      "Suspiciously low foul-to-yellow ratio in previous 3 fixtures.",
      "Past disciplinary action (2021) for administrative error. Integrity status: Monitored."
    ];
    return {
      appointment: {
        name: selected,
        integrity_historical_check: integrityIssues[Math.floor(Math.random() * integrityIssues.length)],
        notable_bias_alerts: Math.random() > 0.8 ? ["High card density", "Low foul tolerance"] : [],
        statistical_profile: {
          avg_yellow_cards_per_game: 3.2 + Math.random() * 2,
          avg_red_cards_per_game: 0.12 + Math.random() * 0.1,
          foul_to_booking_ratio: 5.5 + Math.random() * 3,
          home_win_percentage_under_referee: 42 + Math.random() * 15,
          penalty_award_frequency: 0.15 + Math.random() * 0.2
        }
      }
    };
  }

  getBettingLiquidityFeed(matchId: string) {
    return {
      liquidity_shifts: [
        {
          market: "Full Time Result",
          shift_magnitude: Math.random(),
          direction: (Math.random() > 0.7 ? "Steam" : "Normal") as 'Steam' | 'Reverse' | 'Normal',
          anomaly_score: Math.random()
        },
        {
          market: "Asian Handicap",
          shift_magnitude: Math.random(),
          direction: (Math.random() > 0.8 ? "Reverse" : "Normal") as 'Steam' | 'Reverse' | 'Normal',
          anomaly_score: Math.random() < 0.1 ? 0.85 : 0.05
        }
      ],
      volatility_index: Math.random()
    };
  }

  getTacticalFeed(matchId: string) {
    const shapeCompactness = 0.4 + Math.random() * 0.4;
    const isolatesActor = Math.random() > 0.8;
    const oppCounterXG = 0.5 + Math.random() * 2.0;

    return {
      match_state: {
        shape_compactness: shapeCompactness,
        cb_isolated_1v1_count: Math.floor(Math.random() * 6),
        key_defender_on_pitch: Math.random() > 0.2,
        opponent_counter_xg: oppCounterXG
      },
      coach_action: {
        sub_off: Math.random() > 0.1 ? "best_CB_id" : "none",
        formation_change: Math.random() > 0.8 ? "4-2-4" : "4-3-3",
        minute: Math.floor(Math.random() * 90)
      },
      tactical_model: {
        expected_shape: 0.7,
        best_cb_id: "best_CB_id"
      },
      isolates_actor: isolatesActor
    };
  }
}

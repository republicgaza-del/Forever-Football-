export enum BrainType {
  QPE = 'QPE',
  XSE = 'XSE'
}

export interface PsychologicalTag {
  tag: string;
  weight: number;
  note: string;
}

export interface BettingMarketDynamics {
  liquidity_shifts: Array<{
    market: string;
    shift_magnitude: number; // 0-1
    direction: 'Steam' | 'Reverse' | 'Normal';
    anomaly_score: number; // 0-1
  }>;
  volatility_index: number; // 0-1
}

export interface ScorePrediction {
  scoreline: string;
  probability: number;
  reasoning: string;
}

export interface PlayerProfile {
  playerId: string;
  name: string;
  rating: number;
  position: string;
  photo_url?: string;
  jersey_number?: number;
  position_code?: string;
}

export interface LineupData {
  home: {
    confirmed: boolean;
    team_name: string;
    team_color?: string;
    players: PlayerProfile[];
    suspicious_absences: string[];
  };
  away: {
    confirmed: boolean;
    team_name: string;
    team_color?: string;
    players: PlayerProfile[];
    suspicious_absences: string[];
  };
}

export interface Probabilities {
  home: number;
  draw: number;
  away: number;
}

export interface IntegrityAssessment {
  risk_level: 'Low' | 'Medium' | 'High';
  risk_score?: number; // 0-1
  alert_level?: 'T-14d' | 'T-48h' | 'Live' | 'N/A';
  primary_actors?: Array<{
    playerId: string;
    name: string;
    full_name: string;
    role: string;
    team: string;
    photo_url?: string;
    competitions: string[];
    social_links?: string[];
    risk_factors: string[];
    reason_for_inclusion: string;
    vulnerability_score: number;
  }>;
  active_signals?: string[];
  predicted_actions?: string[];
  cascade_risk?: number; // Probability 0-1
  recommended_action: string;
  factors: Array<{
    factor: string;
    description: string;
    detailed_explanation: string;
    impact: 'High' | 'Medium' | 'Low';
  }>;
  advanced_metrics?: {
    confidence_attack?: {
      primary_actor: string;
      score: number; // 0-1
      sentiment_delta_7d: number;
    };
    defensive_breakdown?: {
      coach: string;
      tactical_plausibility: number; // 0-1
      deviation_from_model: number; // 0-1
    };
    og_risk?: {
      primary_actor: string;
      score: number; // 0-1
      xg_og: number;
    };
    gk_error_risk?: {
      primary_actor: string;
      score: number; // 0-1
      physical_plausibility: number; // 0-1
    };
    ft_cascade_probability?: number; // 0-1
  };
  spot_fixing_markers?: {
    yellow_card_market_activity: 'Normal' | 'Outlier' | 'Suspicious';
    penalty_corner_anomalies: 'Normal' | 'Detected' | 'Severe';
    referee_history_context: string;
    referee_appointment?: {
      name: string;
      photo_url?: string;
      integrity_historical_check: string;
      notable_bias_alerts?: string[];
      statistical_profile?: {
        avg_yellow_cards_per_game: number;
        avg_red_cards_per_game: number;
        foul_to_booking_ratio: number;
        home_win_percentage_under_referee: number;
        penalty_award_frequency: number; // 0-1
      };
    };
  };
  player_mistake_patterns?: Array<{
    player_name: string;
    position: string;
    mistake_type: string;
    description: string;
    correlation_with_betting_volatility: 'High' | 'Medium' | 'Low';
  }>;
  pre_match_intelligence?: Array<{
    source: string;
    rumor_title: string;
    impact: 'High' | 'Medium' | 'Low';
  }>;
  recommendation: string; // Summarized conclusion
}

export interface TeamHistoricalAnalysis {
  team_name: string;
  last_5_matches: Array<{
    date: string;
    opponent: string;
    competition: string;
    score: string;
    result: 'W' | 'D' | 'L';
    predicted_market_flavour: string; // e.g. "Over 2.5", "Home Win"
    flavour_realized: boolean;
    reason_for_divergence?: string;
  }>;
  prediction_reliability_score: number; // 0-1, how often they meet expectations
  divergence_alerts: string[];
}

export interface PredictionResult {
  id: string;
  fixture: {
    home: string;
    away: string;
    league: string;
    date: string;
  };
  qpe_outputs: {
    probabilities: Probabilities;
    psychological_tags: PsychologicalTag[];
    fragility_flags: string[];
    news_feed: Array<{
      title: string;
      source: string;
      category: 'Injury' | 'Tactical' | 'General';
      impact_level: 'High' | 'Medium' | 'Low';
      detail: string;
    }>;
    dual_lens_analysis: {
      pundit_lens: string;
      coach_lens: string;
      synthesis: string;
    };
    key_player_notes?: Array<{
      name: string;
      team: 'home' | 'away';
      note: string;
      psych_impact: 'Positive' | 'Negative' | 'Neutral';
    }>;
    acca_safe_pick?: string;
  };
  xse_outputs: {
    probabilities: Probabilities;
    top_features: {
      name: string;
      impact: number; // positive for home, negative for away
    }[];
    key_player_stats?: Array<{
      name: string;
      team: 'home' | 'away';
      metric: string;
      value: string | number;
      rank_in_league?: string;
    }>;
    confidence_score: number;
  };
  orchestration: {
    final_probabilities: Probabilities;
    confidence_delta: number;
    conflict_detected: boolean;
    conflict_note?: string;
    resolution_status: string;
    omniscient_note?: string;
    influence_weights: {
      qpe: number;
      xse: number;
      reasoning: string;
    };
    edge: {
      outcome: 'home' | 'draw' | 'away';
      market_odds: number;
      calculated_edge: number;
      kelly_stake: number;
    };
  };
  decision_trace: {
    prior: Probabilities;
    drift_factors: {
      factor: string;
      shift: number;
      brain: BrainType;
    }[];
    logical_steps: string[];
  };
  h2h_history?: {
    last_5_meetings: Array<{
      date: string;
      result: string;
      score: string;
      venue: 'Home' | 'Away';
      notable_event?: string;
    }>;
    summary: {
      home_wins: number;
      away_wins: number;
      draws: number;
      avg_goals: number;
      clean_sheets_home: number;
      clean_sheets_away: number;
    };
  };
  data_collection_directives?: {
    missing_points: string[];
    scrapper_instructions: string;
    target_sources: string[];
  };
  confirmed_lineups?: LineupData;
  market_dynamics?: BettingMarketDynamics;
  score_predictions?: [ScorePrediction, ScorePrediction, ScorePrediction];
  historical_execution_analysis?: {
    home: TeamHistoricalAnalysis;
    away: TeamHistoricalAnalysis;
    unreliability_audit: {
      flagged_teams: string[];
      systemic_risk_summary: string;
    };
  };
  tactical_verdict: {
    verdict_code: string;
    final_decision: string;
    confidence_variance: number;
    risk_profile: "SURGICAL" | "SPECULATIVE" | "VOLATILE" | "CONTRARIAN";
    execution_logic: string;
    primary_pivot_factor: string;
  };
  integrity_assessment?: IntegrityAssessment;
}

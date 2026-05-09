export enum BrainType {
  QPE = 'QPE',
  XSE = 'XSE'
}

export interface PsychologicalTag {
  tag: string;
  weight: number;
  note: string;
}

export interface Probabilities {
  home: number;
  draw: number;
  away: number;
}

export interface IntegrityAssessment {
  risk_level: 'Low' | 'Medium' | 'High';
  factors: Array<{
    factor: string;
    description: string;
    detailed_explanation: string;
    impact: 'High' | 'Medium' | 'Low';
  }>;
  spot_fixing_markers?: {
    yellow_card_market_activity: 'Normal' | 'Outlier' | 'Suspicious';
    penalty_corner_anomalies: 'Normal' | 'Detected' | 'Severe';
    referee_history_context: string;
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
  recommendation: string;
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

/**
 * Anti-Spot-Fixing Graph v1.0 - Logic Core
 * Ported to TypeScript for Application Integration
 */

export interface ActorNode {
    id: string;
    role: 'Player' | 'Ref' | 'Coach' | 'Linesman' | '4th_Official';
    vulnerability_score: number; // 0-1
    accessibility_score: number; // 0-1
    behavioral_deviation: number; // 0-1
}

export interface FixerNode {
    id: string;
    type: 'Financial' | 'Social' | 'Cyber';
    risk_tier: number; // 1-5
    known_signals: string[];
    market_access: string[];
    linked_crypto_wallets: string[];
}

export const FIXER_ALPHA: FixerNode = {
    id: 'FIXER_ALPHA',
    type: 'Financial',
    risk_tier: 3,
    known_signals: ['early_sub_alert'],
    market_access: [],
    linked_crypto_wallets: []
};

export interface EdgeMetadata {
    severity?: number;
    recency_decay?: number;
    frequency?: number;
    privacy_level?: number;
    historical_correlation?: number;
    betting_liquidity_change?: number;
    time_delta?: number;
}

/**
 * Calculates the vulnerability score of an actor.
 * @param data Actor behavioral and financial data
 */
export function calculateVulnerabilityScore(data: {
    financial_pressure: number;
    deviation_last_30d: number;
    accessibility_score: number;
}): number {
    const { financial_pressure, deviation_last_30d, accessibility_score } = data;
    
    // Formula: (Financial Pressure * 0.4) + (Behavioral Deviation * 0.3) + (Accessibility * 0.3)
    const score = (financial_pressure * 0.4) + (deviation_last_30d * 0.3) + (accessibility_score * 0.3);
    
    return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Calculates the weight of an edge in the anti-fixing graph.
 */
export function calculateEdgeWeight(
    type: 'Pressure' | 'Access' | 'Signal' | 'Cover' | 'Influence' | 'Cascade',
    from: any,
    to: any,
    metadata: EdgeMetadata
): number {
    switch (type) {
        case 'Pressure':
            // severity * recency_decay * actor.vulnerability_score
            return (metadata.severity || 0) * (metadata.recency_decay || 1.0) * (to.vulnerability_score || 0);
            
        case 'Access':
            // frequency * privacy_level * 1/actor.accessibility_score
            return (metadata.frequency || 0) * (metadata.privacy_level || 1) * (1 / (to.accessibility_score || 0.1));
            
        case 'Signal':
            // historical_correlation * event.privacy_level
            return (metadata.historical_correlation || 0) * (metadata.privacy_level || 1);
            
        case 'Cover':
            // 1 - deviation_from_baseline * public_visibility
            // metadata.severity here is used as degree of baseline adherence
            return 1 - (to.behavioral_deviation || 0) * (metadata.severity || 1);
            
        case 'Cascade':
            // betting_liquidity_change * 1/time_delta
            return (metadata.betting_liquidity_change || 0) * (1 / (metadata.time_delta || 1));
            
        default:
            return 0;
    }
}

/**
 * Core Risk Scoring Formula:
 * risk_score = sum(Pressure_Access) + Signal*0.5 + Cascade*0.7 - Cover*0.3
 */
export function calculateRiskScore(
    edges: { type: string, weight: number }[]
): number {
    let score = 0;
    
    edges.forEach(edge => {
        if (edge.type === 'Pressure' || edge.type === 'Access') {
            score += edge.weight;
        } else if (edge.type === 'Signal') {
            score += edge.weight * 0.5;
        } else if (edge.type === 'Cascade') {
            score += edge.weight * 0.7;
        } else if (edge.type === 'Cover') {
            score -= edge.weight * 0.3;
        }
    });

    return Math.min(1.0, Math.max(0.0, score));
}

/**
 * Creates a standardized Actor node from raw feeding data.
 * Ported from simulation logic.
 */
export function createActorNode(
    id: string,
    role: ActorNode['role'],
    team_or_league: string,
    feeds: {
        financial: { financial_pressure_index: number },
        behavioral: { deviation_last_30d: number, cover_history_hits: number },
        social: { accessibility_score: number, proximity_hits_30d: number }
    }
): any {
    const vulnerability_score = calculateVulnerabilityScore({
        financial_pressure: feeds.financial.financial_pressure_index,
        deviation_last_30d: feeds.behavioral.deviation_last_30d,
        accessibility_score: feeds.social.accessibility_score
    });

    return {
        actor_id: id,
        role,
        team_or_league,
        vulnerability_score,
        accessibility_score: feeds.social.accessibility_score,
        behavioral_baseline: {
            avg_fouls: 1.1,
            avg_cards: 0.15,
            avg_sub_minute: 65,
            avg_stoppage: 4.5,
            avg_lineup_change_prob: 0.1
        },
        deviation_last_30d: feeds.behavioral.deviation_last_30d,
        social_proximity: feeds.social.proximity_hits_30d > 3 ? ["FIXER_ALPHA"] : [],
        cover_history: feeds.behavioral.cover_history_hits,
        tactical_influence: role === 'Coach' ? 0.85 : 0.05
    };
}

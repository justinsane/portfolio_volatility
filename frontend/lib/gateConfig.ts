import React from 'react';
import { Lock, BarChart3, TrendingUp, Shield, Users } from 'lucide-react';

export interface GateConfig {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  icon: React.ComponentType<{ className?: string }>;
  triggerType: 'time' | 'click' | 'scroll';
  triggerDelay?: number;
}

export const GATE_CONFIGS: Record<string, GateConfig> = {
  'risk-analysis': {
    id: 'risk-analysis',
    title: "Unlock Your Portfolio's Hidden Risks",
    description:
      'Discover critical risk factors that could impact your investments. Get expert analysis of correlations, concentration, and volatility patterns.',
    benefits: [
      '🔍 Detailed risk score breakdown (84.6/100 explained)',
      '📊 Interactive correlation analysis heatmap',
      '⚠️ Concentration risk alerts and explanations',
      '🛡️ Personalized risk mitigation strategies',
      '💡 Expert recommendations from certified advisors',
    ],
    icon: Shield,
    triggerType: 'time',
    triggerDelay: 120000, // 2 minutes
  },
  'ai-model-details': {
    id: 'ai-model-details',
    title: 'See How Our AI Analyzes Your Portfolio',
    description:
      "Get behind-the-scenes insights into our advanced AI model's confidence levels, data quality assessment, and prediction accuracy.",
    benefits: [
      '🎯 Data Quality breakdown (100% score explained)',
      '📈 Coverage metrics detailed analysis',
      '🔬 Reliability scores methodology',
      '🤖 Model confidence indicators',
      '📊 AI prediction accuracy insights',
    ],
    icon: BarChart3,
    triggerType: 'scroll',
  },
  recommendations: {
    id: 'recommendations',
    title: 'Get Your Personalized Action Plan',
    description:
      'Receive 20+ actionable investment recommendations tailored specifically to your portfolio and financial goals.',
    benefits: [
      '🎯 20+ personalized investment recommendations',
      '📈 Portfolio optimization suggestions',
      '🛡️ Risk mitigation strategies',
      '✅ Step-by-step action items',
      '📊 Ongoing portfolio monitoring advice',
    ],
    icon: TrendingUp,
    triggerType: 'click',
  },
  'advanced-tools': {
    id: 'advanced-tools',
    title: 'Unlock Advanced Portfolio Tools',
    description:
      'Access sophisticated portfolio analysis tools, stress testing, and what-if scenarios used by professional advisors.',
    benefits: [
      '🔮 What-If Scenarios functionality',
      '⚡ Advanced portfolio optimization',
      '🌪️ Market stress testing',
      '⚖️ Rebalancing recommendations',
      '💰 Tax optimization strategies',
    ],
    icon: Users,
    triggerType: 'time',
    triggerDelay: 180000, // 3 minutes
  },
};

export const getGateConfig = (gateId: string): GateConfig | undefined => {
  return GATE_CONFIGS[gateId];
};

export const getAllGateConfigs = (): GateConfig[] => {
  return Object.values(GATE_CONFIGS);
};

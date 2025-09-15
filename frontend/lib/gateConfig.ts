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
    title: 'Unlock Detailed Risk Analysis',
    description:
      "Get comprehensive insights into your portfolio's risk factors, correlations, and concentration metrics.",
    benefits: [
      'Detailed risk score breakdown',
      'Correlation analysis heatmap',
      'Concentration risk explanation',
      'Risk factor explanations and mitigation strategies',
      'Personalized risk assessment recommendations',
    ],
    icon: Shield,
    triggerType: 'time',
    triggerDelay: 120000, // 2 minutes
  },
  'ai-model-details': {
    id: 'ai-model-details',
    title: 'Understand AI Model Confidence',
    description:
      "Learn how our advanced AI evaluates your portfolio's data quality, coverage, and reliability.",
    benefits: [
      'Data Quality breakdown (100% score explanation)',
      'Coverage metrics detailed analysis',
      'Reliability scores methodology',
      'Model confidence indicators',
      'AI prediction accuracy insights',
    ],
    icon: BarChart3,
    triggerType: 'scroll',
  },
  recommendations: {
    id: 'recommendations',
    title: 'Get Personalized Recommendations',
    description:
      'Receive actionable investment recommendations tailored to your portfolio and financial goals.',
    benefits: [
      'Personalized investment recommendations',
      'Portfolio optimization suggestions',
      'Risk mitigation strategies',
      'Next steps and action items',
      'Ongoing portfolio monitoring advice',
    ],
    icon: TrendingUp,
    triggerType: 'click',
  },
  'advanced-tools': {
    id: 'advanced-tools',
    title: 'Access Advanced Portfolio Tools',
    description:
      'Explore sophisticated portfolio analysis tools and what-if scenarios.',
    benefits: [
      'What-If Scenarios functionality',
      'Advanced portfolio optimization',
      'Market stress testing',
      'Rebalancing recommendations',
      'Tax optimization strategies',
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

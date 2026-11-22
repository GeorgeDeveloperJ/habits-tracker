import type React from 'react';
import {
  FinancePillarIcon,
  FocusPillarIcon,
  LearningPillarIcon,
  MindfulnessPillarIcon,
  NutritionPillarIcon,
  OrganizationPillarIcon,
  PhysicalPillarIcon,
  RestPillarIcon,
} from '../components/icons/PillarIcons';

export type PillarIconComponent = React.ComponentType<{ className?: string }>;

export interface PillarMeta {
  name: string;
  shortName: string;
  tagline: string;
  suggestions: string[];
  accentColor: string;
  icon: PillarIconComponent;
}

export const CORE_PILLARS: PillarMeta[] = [
  {
    name: 'Learning',
    shortName: 'Learning',
    tagline: 'Studying, reading, and personal growth',
    suggestions: ['Read 20 pages', 'Complete 1 study module', 'Practice flashcards 20m'],
    accentColor: '#8B5CF6',
    icon: LearningPillarIcon,
  },
  {
    name: 'Physical Health',
    shortName: 'Physical',
    tagline: 'Exercise, training, and movement',
    suggestions: ['30m strength training', '5km morning run', '45m mobility & walk'],
    accentColor: '#10B981',
    icon: PhysicalPillarIcon,
  },
  {
    name: 'Nutrition',
    shortName: 'Nutrition',
    tagline: 'Eating habits, hydration, and wellness',
    suggestions: ['2L water & whole foods', 'Zero added sugar today', 'Cook 2 balanced meals'],
    accentColor: '#06B6D4',
    icon: NutritionPillarIcon,
  },
  {
    name: 'Mindfulness',
    shortName: 'Mindfulness',
    tagline: 'Meditation, reflection, and clarity',
    suggestions: ['10m breathwork & meditation', 'Write evening journal entry', '15m quiet walk'],
    accentColor: '#A78BFA',
    icon: MindfulnessPillarIcon,
  },
  {
    name: 'Work / Focus',
    shortName: 'Focus',
    tagline: 'Focused work sessions and deep output',
    suggestions: ['90m distraction-free deep work', 'Ship top 1 priority task', '2x 50m Pomodoro blocks'],
    accentColor: '#F59E0B',
    icon: FocusPillarIcon,
  },
  {
    name: 'Finance',
    shortName: 'Finance',
    tagline: 'Expense tracking, budgeting, and literacy',
    suggestions: ['Log every expense today', 'Review weekly budget targets', 'Read 15m finance notes'],
    accentColor: '#34D399',
    icon: FinancePillarIcon,
  },
  {
    name: 'Organization',
    shortName: 'Order',
    tagline: 'Planning and maintaining a tidy environment',
    suggestions: ['Clear desk & inbox zero', '15m evening room reset', 'Plan tomorrow priorities'],
    accentColor: '#60A5FA',
    icon: OrganizationPillarIcon,
  },
  {
    name: 'Rest',
    shortName: 'Rest',
    tagline: 'Sleep quality, recovery, and disconnection',
    suggestions: ['Screens off by 10:00 PM', '8h sleep window protected', '20m afternoon recovery'],
    accentColor: '#C084FC',
    icon: RestPillarIcon,
  },
];

const PILLAR_META_BY_NAME = new Map<string, PillarMeta>(
  CORE_PILLARS.map((p) => [p.name.toLowerCase(), p])
);

export const getPillarMeta = (name: string): PillarMeta => {
  return (
    PILLAR_META_BY_NAME.get(name.toLowerCase()) ?? {
      name,
      shortName: name,
      tagline: 'Daily proactive discipline',
      suggestions: ['Complete focused action'],
      accentColor: '#8B5CF6',
      icon: FocusPillarIcon,
    }
  );
};

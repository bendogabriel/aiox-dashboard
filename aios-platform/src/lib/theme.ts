/**
 * AIOS Centralized Theme System
 *
 * All squad-based colors should come from here.
 * When new squads are added, they automatically get colors based on their SquadType.
 */

import type { SquadType } from '../types';

/**
 * Squad Theme Configuration
 * Each squad type has a complete color palette for consistent UI
 */
export interface SquadTheme {
  // Primary colors
  primary: string;      // Main brand color (e.g., 'orange-500')

  // Background variations
  bg: string;           // Solid background (e.g., 'bg-orange-500')
  bgSubtle: string;     // Subtle background (e.g., 'bg-orange-500/10')
  bgHover: string;      // Hover state (e.g., 'bg-orange-500/20')

  // Border variations
  border: string;       // Solid border (e.g., 'border-orange-500')
  borderSubtle: string; // Subtle border (e.g., 'border-orange-500/30')

  // Text variations
  text: string;         // Primary text (e.g., 'text-orange-500')
  textMuted: string;    // Muted text (e.g., 'text-orange-400')

  // Gradients
  gradient: string;     // Gradient classes (e.g., 'from-orange-400 to-amber-500')
  gradientBg: string;   // Background gradient (e.g., 'bg-gradient-to-br from-orange-500/10 to-amber-500/10')

  // Combined utility classes for common patterns
  badge: string;        // Badge styling
  card: string;         // Card styling with border and bg
  cardHover: string;    // Card with hover effect
  iconBg: string;       // Icon background container
  dot: string;          // Status dot
  ring: string;         // Focus ring
  borderLeft: string;   // Border-left for lists
  glow: string;         // Shadow glow effect
  gradientSubtle: string;  // Subtle gradient for backgrounds

  // CSS variable for dynamic use
  cssVar: string;
}

/**
 * Complete theme definitions for each squad type
 */
export const squadThemes: Record<SquadType, SquadTheme> = {
  copywriting: {
    primary: 'orange-500',
    bg: 'bg-orange-500',
    bgSubtle: 'bg-orange-500/10',
    bgHover: 'bg-orange-500/20',
    border: 'border-orange-500',
    borderSubtle: 'border-orange-500/30',
    text: 'text-orange-500',
    textMuted: 'text-orange-400',
    gradient: 'from-orange-400 to-amber-500',
    gradientBg: 'bg-gradient-to-br from-orange-500/10 to-amber-500/10',
    badge: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    card: 'bg-orange-500/5 border-orange-500/20',
    cardHover: 'hover:bg-orange-500/10 hover:border-orange-500/30',
    iconBg: 'bg-orange-500/20',
    dot: 'bg-orange-500',
    ring: 'ring-orange-500/20 focus:ring-orange-500/40',
    borderLeft: 'border-l-orange-500',
    glow: 'shadow-orange-500/30',
    gradientSubtle: 'from-orange-500/20 to-amber-500/20',
    cssVar: 'var(--squad-copywriting)',
  },

  design: {
    primary: 'purple-500',
    bg: 'bg-purple-500',
    bgSubtle: 'bg-purple-500/10',
    bgHover: 'bg-purple-500/20',
    border: 'border-purple-500',
    borderSubtle: 'border-purple-500/30',
    text: 'text-purple-500',
    textMuted: 'text-purple-400',
    gradient: 'from-purple-400 to-violet-500',
    gradientBg: 'bg-gradient-to-br from-purple-500/10 to-violet-500/10',
    badge: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    card: 'bg-purple-500/5 border-purple-500/20',
    cardHover: 'hover:bg-purple-500/10 hover:border-purple-500/30',
    iconBg: 'bg-purple-500/20',
    dot: 'bg-purple-500',
    ring: 'ring-purple-500/20 focus:ring-purple-500/40',
    borderLeft: 'border-l-purple-500',
    glow: 'shadow-purple-500/30',
    gradientSubtle: 'from-purple-500/20 to-pink-500/20',
    cssVar: 'var(--squad-design)',
  },

  creator: {
    primary: 'green-500',
    bg: 'bg-green-500',
    bgSubtle: 'bg-green-500/10',
    bgHover: 'bg-green-500/20',
    border: 'border-green-500',
    borderSubtle: 'border-green-500/30',
    text: 'text-green-500',
    textMuted: 'text-green-400',
    gradient: 'from-green-400 to-emerald-500',
    gradientBg: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10',
    badge: 'bg-green-500/10 border-green-500/20 text-green-400',
    card: 'bg-green-500/5 border-green-500/20',
    cardHover: 'hover:bg-green-500/10 hover:border-green-500/30',
    iconBg: 'bg-green-500/20',
    dot: 'bg-green-500',
    ring: 'ring-green-500/20 focus:ring-green-500/40',
    borderLeft: 'border-l-green-500',
    glow: 'shadow-green-500/30',
    gradientSubtle: 'from-green-500/20 to-emerald-500/20',
    cssVar: 'var(--squad-creator)',
  },

  orchestrator: {
    primary: 'cyan-500',
    bg: 'bg-cyan-500',
    bgSubtle: 'bg-cyan-500/10',
    bgHover: 'bg-cyan-500/20',
    border: 'border-cyan-500',
    borderSubtle: 'border-cyan-500/30',
    text: 'text-cyan-500',
    textMuted: 'text-cyan-400',
    gradient: 'from-cyan-400 to-blue-500',
    gradientBg: 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10',
    badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    card: 'bg-cyan-500/5 border-cyan-500/20',
    cardHover: 'hover:bg-cyan-500/10 hover:border-cyan-500/30',
    iconBg: 'bg-cyan-500/20',
    dot: 'bg-cyan-500',
    ring: 'ring-cyan-500/20 focus:ring-cyan-500/40',
    borderLeft: 'border-l-cyan-500',
    glow: 'shadow-cyan-500/30',
    gradientSubtle: 'from-cyan-500/20 to-blue-500/20',
    cssVar: 'var(--squad-orchestrator)',
  },

  default: {
    primary: 'gray-500',
    bg: 'bg-gray-500',
    bgSubtle: 'bg-gray-500/10',
    bgHover: 'bg-gray-500/20',
    border: 'border-gray-500',
    borderSubtle: 'border-gray-500/30',
    text: 'text-gray-500',
    textMuted: 'text-gray-400',
    gradient: 'from-gray-400 to-slate-500',
    gradientBg: 'bg-gradient-to-br from-gray-500/10 to-slate-500/10',
    badge: 'bg-gray-500/10 border-gray-500/20 text-gray-400',
    card: 'bg-gray-500/5 border-gray-500/20',
    cardHover: 'hover:bg-gray-500/10 hover:border-gray-500/30',
    iconBg: 'bg-gray-500/20',
    dot: 'bg-gray-500',
    ring: 'ring-gray-500/20 focus:ring-gray-500/40',
    borderLeft: 'border-l-gray-500',
    glow: 'shadow-gray-500/30',
    gradientSubtle: 'from-gray-500/20 to-slate-500/20',
    cssVar: 'var(--squad-default)',
  },
};

/**
 * Agent Tier Theme Configuration
 */
export interface TierTheme {
  label: string;
  labelShort: string;
  text: string;
  bg: string;
  badge: string;
  gradient: string;      // Gradient for avatar/icons
  icon: string;
}

export const tierThemes: Record<0 | 1 | 2, TierTheme> = {
  0: {
    label: 'Orchestrator',
    labelShort: 'Orch',
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    gradient: 'from-cyan-500 to-blue-500',
    icon: '🎯',
  },
  1: {
    label: 'Master',
    labelShort: 'Master',
    text: 'text-purple-400',
    bg: 'bg-purple-500/10',
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    gradient: 'from-purple-500 to-pink-500',
    icon: '⭐',
  },
  2: {
    label: 'Specialist',
    labelShort: 'Spec',
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    gradient: 'from-orange-500 to-amber-500',
    icon: '🔧',
  },
};

/**
 * Status Theme Configuration
 */
export interface StatusTheme {
  text: string;
  bg: string;
  dot: string;
  border: string;
}

export const statusThemes: Record<string, StatusTheme> = {
  online: {
    text: 'text-green-400',
    bg: 'bg-green-500/10',
    dot: 'bg-green-500',
    border: 'border-green-500/30',
  },
  busy: {
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    dot: 'bg-yellow-500',
    border: 'border-yellow-500/30',
  },
  offline: {
    text: 'text-gray-400',
    bg: 'bg-gray-500/10',
    dot: 'bg-gray-500',
    border: 'border-gray-500/30',
  },
  error: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    dot: 'bg-red-500',
    border: 'border-red-500/30',
  },
  success: {
    text: 'text-green-400',
    bg: 'bg-green-500/10',
    dot: 'bg-green-500',
    border: 'border-green-500/30',
  },
  pending: {
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    dot: 'bg-orange-500',
    border: 'border-orange-500/30',
  },
  running: {
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    dot: 'bg-blue-500',
    border: 'border-blue-500/30',
  },
};

/**
 * Get theme for a squad type
 * This is the main function to use when you need squad colors
 */
export function getSquadTheme(squadType: SquadType): SquadTheme {
  return squadThemes[squadType] || squadThemes.default;
}

/**
 * Get theme for a squad by its ID
 * Uses the automatic squad type detection
 */
export function getSquadThemeById(squadId: string): SquadTheme {
  // Import dynamically to avoid circular dependency
  const { getSquadType } = require('../types');
  const squadType = getSquadType(squadId);
  return getSquadTheme(squadType);
}

/**
 * Get tier theme
 */
export function getTierTheme(tier: 0 | 1 | 2): TierTheme {
  return tierThemes[tier] || tierThemes[2];
}

/**
 * Get status theme
 */
export function getStatusTheme(status: string): StatusTheme {
  return statusThemes[status] || statusThemes.offline;
}

/**
 * Utility: Generate avatar gradient based on squad type
 */
export function getAvatarGradient(squadType: SquadType): string {
  const theme = getSquadTheme(squadType);
  return `bg-gradient-to-br ${theme.gradient}`;
}

/**
 * Utility: Generate border-left color class for lists
 */
export function getBorderLeftColor(squadType: SquadType): string {
  const theme = getSquadTheme(squadType);
  return `border-l-2 ${theme.border}`;
}

/**
 * Command type themes for the commands modal
 */
export const commandTypeThemes: Record<string, { bg: string; border: string; text: string }> = {
  action: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
  command: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  prompt: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
  task: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  workflow: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
};

/**
 * Get command type theme
 */
export function getCommandTypeTheme(type: string): { bg: string; border: string; text: string } {
  return commandTypeThemes[type] || commandTypeThemes.command;
}

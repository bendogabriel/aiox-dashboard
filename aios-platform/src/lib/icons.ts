import {
  type LucideIcon,
  BarChart3,
  TrendingUp,
  Target,
  Bot,
  User,
  Settings,
  Palette,
  PenTool,
  Monitor,
  Clapperboard,
  Video,
  Tv,
  FileText,
  BookOpen,
  Library,
  Lightbulb,
  Mail,
  Megaphone,
  Search,
  Microscope,
  Wrench,
  Zap,
  Flame,
  Sparkles,
  Gem,
  Star,
  Trophy,
  Puzzle,
  Link,
  RefreshCw,
  GitMerge,
  Rocket,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ClipboardList,
  MessageSquare,
  Landmark,
  FlaskConical,
  Paintbrush,
  Rainbow,
  Image,
  UserCog,
  DollarSign,
  Smartphone,
  Handshake,
  Brain,
  Globe,
  PlugZap,
  Keyboard,
  Ruler,
  LifeBuoy,
  Tag,
  Anchor,
  Package,
  Swords,
  LogOut,
  Scissors,
  Newspaper,
  Eye,
  Calendar,
  SearchCheck,
  Hand,
  Users,
  Timer,
  Signal,
  Sun,
  Moon,
  Laptop,
  CircleDot,
  FolderOpen,
  ThumbsUp,
  Heart,
  PartyPopper,
  HelpCircle,
  Check,
  X,
  ArrowRight,
  Info,
  TriangleAlert,
  Cog,
} from 'lucide-react';

export type { LucideIcon };

/**
 * Icon size constants for consistent sizing across the app.
 */
export const ICON_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
} as const;

/**
 * Maps a string name to a Lucide icon component.
 * Used for data that persists icon names as strings (API responses, localStorage).
 */
const ICON_MAP: Record<string, LucideIcon> = {
  BarChart3,
  TrendingUp,
  Target,
  Bot,
  User,
  Users,
  Settings,
  Palette,
  PenTool,
  Monitor,
  Clapperboard,
  Video,
  Tv,
  FileText,
  BookOpen,
  Library,
  Lightbulb,
  Mail,
  Megaphone,
  Search,
  Microscope,
  Wrench,
  Zap,
  Flame,
  Sparkles,
  Gem,
  Star,
  Trophy,
  Puzzle,
  Link,
  RefreshCw,
  GitMerge,
  Rocket,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ClipboardList,
  MessageSquare,
  Landmark,
  FlaskConical,
  Paintbrush,
  Rainbow,
  Image,
  UserCog,
  DollarSign,
  Smartphone,
  Handshake,
  Brain,
  Globe,
  PlugZap,
  Keyboard,
  Ruler,
  LifeBuoy,
  Tag,
  Anchor,
  Package,
  Swords,
  LogOut,
  Scissors,
  Newspaper,
  Eye,
  Calendar,
  SearchCheck,
  Hand,
  Timer,
  Signal,
};

export function getIconComponent(name: string): LucideIcon {
  return ICON_MAP[name] || Bot;
}

// ── Semantic icon aliases (replace emojis across the app) ──

/** Theme selector icons */
export const ThemeIcons = {
  light: Sun,
  dark: Moon,
  system: Laptop,
  matrix: CircleDot,
  glass: Sparkles,
} as const;

/** Category default icon */
export const CategoryIcon = FolderOpen;

/** Emote icons for world/game interactions */
export const EmoteIcons = {
  wave: Hand,
  thumbsUp: ThumbsUp,
  love: Heart,
  celebrate: PartyPopper,
  thinking: HelpCircle,
  lightning: Zap,
  fire: Flame,
  idea: Lightbulb,
} as const;

export type EmoteKey = keyof typeof EmoteIcons;

export const EMOTE_LIST: Array<{ key: EmoteKey; label: string; Icon: LucideIcon }> = [
  { key: 'wave', label: 'Wave', Icon: Hand },
  { key: 'thumbsUp', label: 'Thumbs up', Icon: ThumbsUp },
  { key: 'love', label: 'Love', Icon: Heart },
  { key: 'celebrate', label: 'Celebrate', Icon: PartyPopper },
  { key: 'thinking', label: 'Thinking', Icon: HelpCircle },
  { key: 'lightning', label: 'Lightning', Icon: Zap },
  { key: 'fire', label: 'Fire', Icon: Flame },
  { key: 'idea', label: 'Idea', Icon: Lightbulb },
];

/** Export chat role icons */
export const ExportRoleIcons = {
  user: User,
  agent: Bot,
  system: Cog,
} as const;

/** Inline status marks */
export const StatusMark = {
  check: Check,
  cross: X,
} as const;

/** Workflow empty-state icons */
export const WorkflowPlaceholderIcons = {
  noWorkflows: RefreshCw,
  noExecutions: ClipboardList,
} as const;

/** Notification type icons */
export const NotificationTypeIcons = {
  info: Info,
  success: Check,
  warning: TriangleAlert,
  task: ArrowRight,
} as const;

/** Misc semantic icons */
export const SemanticIcons = {
  toolUse: Wrench,
  whenToUse: Lightbulb,
} as const;

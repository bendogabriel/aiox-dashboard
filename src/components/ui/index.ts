// Cockpit components (primary — brandbook-aligned)
export { CockpitButton, type CockpitButtonProps } from './cockpit/CockpitButton';
export { CockpitCard, type CockpitCardProps } from './cockpit/CockpitCard';
export { CockpitInput, CockpitTextarea, type CockpitInputProps, type CockpitTextareaProps } from './cockpit/CockpitInput';
export { CockpitSectionDivider, type CockpitSectionDividerProps } from './cockpit/CockpitSectionDivider';
export { CockpitTickerStrip, type CockpitTickerStripProps } from './cockpit/CockpitTickerStrip';
export { CockpitSelect, type CockpitSelectProps } from './cockpit/CockpitSelect';
export { CockpitCheckbox, type CockpitCheckboxProps } from './cockpit/CockpitCheckbox';
export { CockpitToggle, type CockpitToggleProps } from './cockpit/CockpitToggle';
export { CockpitSlider, type CockpitSliderProps } from './cockpit/CockpitSlider';
export { CockpitTabs, type CockpitTabsProps } from './cockpit/CockpitTabs';
export { CockpitAccordion, type CockpitAccordionProps } from './cockpit/CockpitAccordion';
export { CockpitStepper, type CockpitStepperProps } from './cockpit/CockpitStepper';
export { CockpitTable, type CockpitTableColumn, type CockpitTableProps } from './cockpit/CockpitTable';
export { CockpitModal, type CockpitModalProps } from './cockpit/CockpitModal';
export { CockpitProgress, type CockpitProgressProps } from './cockpit/CockpitProgress';
export { CockpitSkeleton, type CockpitSkeletonProps } from './cockpit/CockpitSkeleton';
export { CockpitToast, type CockpitToastProps } from './cockpit/CockpitToast';
export { CockpitBadge, type CockpitBadgeProps } from './cockpit/CockpitBadge';
export { CockpitSpinner, type CockpitSpinnerProps } from './cockpit/CockpitSpinner';
export { CockpitKpiCard, type CockpitKpiCardProps } from './cockpit/CockpitKpiCard';
export { CockpitAlert, type CockpitAlertProps } from './cockpit/CockpitAlert';
export { CockpitFooterBar, type CockpitFooterBarProps } from './cockpit/CockpitFooterBar';
export { CockpitStatusIndicator, type CockpitStatusIndicatorProps } from './cockpit/CockpitStatusIndicator';
export { Reveal, RevealGroup, RevealItem } from './Reveal';
export { StaggerContainer, type StaggerContainerProps } from './cockpit/StaggerContainer';

// Glass wrappers (deprecated — kept for backward compatibility)
export { GlassCard, type GlassCardProps } from './GlassCard';
export { GlassButton, type GlassButtonProps } from './GlassButton';
export { GlassInput, GlassTextarea, type GlassInputProps, type GlassTextareaProps } from './GlassInput';
export { Avatar, type AvatarProps } from './Avatar';
export { Badge, type BadgeProps } from './Badge';
export { ToastContainer, useToast, type Toast, type ToastType } from './Toast';
export { KeyboardShortcuts, useKeyboardShortcuts } from './KeyboardShortcuts';
export { ThemeToggle, ThemeToggleSwitch } from './ThemeToggle';
export { PageLoader, InlineLoader } from './PageLoader';
export { PWAUpdatePrompt, useIsPWA } from './PWAUpdatePrompt';
export { ErrorBoundary, CompactErrorFallback, AsyncBoundary, useErrorHandler } from './ErrorBoundary';
export { SkipLinks } from './SkipLinks';
export { NetworkStatusBanner, NetworkStatusIndicator } from './NetworkStatus';
export {
  EmptyState,
  NoSearchResults,
  NoMessages,
  NoActivity,
  NoAgents,
  OfflineState,
  ErrorState,
  type EmptyStateType,
} from './EmptyState';
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonAgentCard,
  SkeletonMessage,
  SkeletonMessageList,
  SkeletonMetricCard,
  SkeletonDashboard,
  SkeletonAgentList,
  SkeletonConversationItem,
  SkeletonConversationHistory,
} from './Skeleton';
export { useRipple, RippleWrapper } from './Ripple';
export { SuccessFeedback, useSuccessFeedback } from './SuccessFeedback';
export { StatusDot, type StatusType } from './StatusDot';
export { ProgressBar } from './ProgressBar';
export { Dialog } from './Dialog';
export { SectionLabel } from './SectionLabel';
export { ContextMenu } from './ContextMenu';
export { AioxLogo } from './AioxLogo';
export { Celebration, useCelebration } from './Celebration';
export { DiffViewer, FileTree } from './DiffViewer';
export { ShortcutHint } from './ShortcutHint';
export { FocusModeIndicator } from './FocusModeIndicator';
export { EngineOfflineBanner } from './EngineOfflineBanner';
export { DegradationBanner } from './DegradationBanner';

// shadcn/ui components
export { Button, buttonVariants, type ButtonProps } from './button';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';
export { Input } from './input';

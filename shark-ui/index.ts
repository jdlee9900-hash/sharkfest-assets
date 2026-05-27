// Shark UI — Public API
// SharkFest 2028 component library

// Primitives
export { SharkButton } from './components/primitives/SharkButton'
export type { SharkButtonProps, ButtonVariant, ButtonSize } from './components/primitives/SharkButton'

export { SharkBadge } from './components/primitives/SharkBadge'
export type { SharkBadgeProps, BadgeVariant, BadgeSize } from './components/primitives/SharkBadge'

export { SharkCard } from './components/primitives/SharkCard'
export type { SharkCardProps, CardVariant, CardPadding } from './components/primitives/SharkCard'

export { SharkInput } from './components/primitives/SharkInput'
export type { SharkInputProps, InputVariant } from './components/primitives/SharkInput'

export { SharkModal } from './components/primitives/SharkModal'
export type { SharkModalProps, ModalSize } from './components/primitives/SharkModal'

export { SharkAccordion } from './components/primitives/SharkAccordion'
export type { SharkAccordionProps, AccordionItem } from './components/primitives/SharkAccordion'

export { SharkTabs } from './components/primitives/SharkTabs'
export type { SharkTabsProps, TabItem, TabVariant } from './components/primitives/SharkTabs'

// Display
export { SharkHeroBanner } from './components/display/SharkHeroBanner'
export type { SharkHeroBannerProps, HeroStat } from './components/display/SharkHeroBanner'

export { SharkSectionHeader } from './components/display/SharkSectionHeader'
export type { SharkSectionHeaderProps } from './components/display/SharkSectionHeader'

export { SharkStatCard } from './components/display/SharkStatCard'
export type { SharkStatCardProps } from './components/display/SharkStatCard'

export { SharkNavCard } from './components/display/SharkNavCard'
export type { SharkNavCardProps } from './components/display/SharkNavCard'

// Live
export { SharkCountdown } from './components/live/SharkCountdown'
export type { SharkCountdownProps } from './components/live/SharkCountdown'

export { SharkLiveFeed } from './components/live/SharkLiveFeed'
export type { SharkLiveFeedProps } from './components/live/SharkLiveFeed'

export { SharkNowMarker } from './components/live/SharkNowMarker'
export type { SharkNowMarkerProps } from './components/live/SharkNowMarker'

// Gallery
export { SharkPhotoGrid } from './components/gallery/SharkPhotoGrid'
export type { SharkPhotoGridProps, GridView } from './components/gallery/SharkPhotoGrid'

export { SharkPhotoCard } from './components/gallery/SharkPhotoCard'
export type { SharkPhotoCardProps, Photo } from './components/gallery/SharkPhotoCard'

export { SharkLightbox } from './components/gallery/SharkLightbox'
export type { SharkLightboxProps } from './components/gallery/SharkLightbox'

// Schedule
export { SharkTimeline } from './components/schedule/SharkTimeline'
export type { SharkTimelineProps } from './components/schedule/SharkTimeline'

export { SharkEventCard } from './components/schedule/SharkEventCard'
export type { SharkEventCardProps } from './components/schedule/SharkEventCard'

// Pitches
export { SharkPitchGrid } from './components/pitches/SharkPitchGrid'
export type { SharkPitchGridProps } from './components/pitches/SharkPitchGrid'

export { SharkPitchCard } from './components/pitches/SharkPitchCard'
export type { SharkPitchCardProps, Pitch } from './components/pitches/SharkPitchCard'

export { SharkMapViewer } from './components/pitches/SharkMapViewer'
export type { SharkMapViewerProps } from './components/pitches/SharkMapViewer'

// Forms
export { SharkFormStep } from './components/forms/SharkFormStep'
export type { SharkFormStepProps, StepConfig } from './components/forms/SharkFormStep'

export { SharkRegistrationForm } from './components/forms/SharkRegistrationForm'
export type { SharkRegistrationFormProps } from './components/forms/SharkRegistrationForm'

// Navigation
export { SharkNavbar } from './components/navigation/SharkNavbar'
export type { SharkNavbarProps, NavLink } from './components/navigation/SharkNavbar'

export { SharkQuickLinks } from './components/navigation/SharkQuickLinks'
export type { SharkQuickLinksProps, QuickLink } from './components/navigation/SharkQuickLinks'

export { SharkFooter } from './components/navigation/SharkFooter'
export type { SharkFooterProps, FooterLink } from './components/navigation/SharkFooter'

// Hooks
export { useOceanCanvas } from './hooks/useOceanCanvas'
export { usePinchZoom } from './hooks/usePinchZoom'
export { useCountdown } from './hooks/useCountdown'
export { useLiveFeed } from './hooks/useLiveFeed'
export type { FestivalPhase } from './hooks/useLiveFeed'
export { useScrollAnimation } from './hooks/useScrollAnimation'

// Utils
export { cn } from './utils/cn'
export { formatTime, formatTimeFull, formatDateGB, padZero, msToDuration } from './utils/formatTime'
export { getEventStatus, getEventProgress } from './utils/eventStatus'
export type { EventStatus, ScheduleEvent } from './utils/eventStatus'

// Design tokens
export { colours } from './design-tokens/colours'
export { fonts, typeScale } from './design-tokens/typography'
export { spacing } from './design-tokens/spacing'
export { shadows } from './design-tokens/shadows'
export { radius } from './design-tokens/radius'
export { motion as motionTokens } from './design-tokens/motion'

// 색상만으로 구분하지 않기 위한 보조 아이콘 세트 (Noul/Choice/Score, 상태 아이콘)
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function NoulIcon(props: IconProps) {
  // Yes/No 토글 형태
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <rect x="2" y="8" width="20" height="8" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

export function ChoiceIcon(props: IconProps) {
  // 갈림길 / 여러 카드 형태
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <path d="M4 5h5v5H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M10 5h5v5h-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" opacity="0.5" />
      <path d="M16 5h5v5h-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" opacity="0.5" />
      <path d="M6.5 10v3M6.5 13h11M17.5 13v-3M12 13v3.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="19" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function ScoreIcon(props: IconProps) {
  // 단계 막대 형태
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <rect x="3" y="14" width="4" height="7" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="10" y="10" width="4" height="11" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="17" y="4" width="4" height="17" rx="1" fill="currentColor" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true" {...props}>
      <path d="M12 4l9.5 16H2.5L12 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 10v4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SpinnerIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" opacity="0.25" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function XCircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BrandMarkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6 12a6 6 0 1 0 6-6"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.3" fill="currentColor" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19.4 13.5a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V19.5a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H4.5a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34H10.5a1.7 1.7 0 001-1.55V4.5a2 2 0 114 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87v0a1.7 1.7 0 001.55 1h.09a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

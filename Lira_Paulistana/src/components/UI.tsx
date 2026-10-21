import { useId, type ReactNode } from "react"
import type { Go, Role } from "../data/mock"

type IconProps = {
  name: string
  size?: number
}
export function Icon({ name, size = 20 }: IconProps) {
  const paths: Record<string, ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
        <path d="M9 21v-7h6v7" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14m-6-6 6 6-6 6" />
      </>
    ),
    arrowleft: (
      <>
        <path d="M19 12H5m6-6-6 6 6 6" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    down: <path d="m6 9 6 6 6-6" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 10h18" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 2 2 6 6 2-6 2-2 6-2-6-6-2 6-2zM19 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
      </>
    ),
    message: (
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.2a9 9 0 1 1 16.1-4.3z" />
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m14-16a4 4 0 0 1 0 8m6 8v-2a4 4 0 0 0-3-3.87" />
        <circle cx="9" cy="7" r="4" />
      </>
    ),
    folder: (
      <path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    ),
    chart: (
      <>
        <path d="M3 3v18h18M7 17v-4m5 4V7m5 10V4" />
      </>
    ),
    inbox: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 13h5l2 3h4l2-3h5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: <path d="m4 12 5 5L20 6" />,
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    x: <path d="M5 5 19 19M19 5 5 19" />,
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeoff: (
      <>
        <path d="M3 3 21 21M10 5.2A12 12 0 0 1 12 5c6 0 10 7 10 7a16 16 0 0 1-4 4.5M6.2 6.3C3.7 8.1 2 12 2 12s4 7 10 7a10 10 0 0 0 3-.5" />
      </>
    ),
    music: (
      <>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </>
    ),
    guitar: (
      <>
        <path d="M14 3h7m-3-3v7M4 14c-2 2-2 6 0 8s6 2 8 0l5-6-3-3-6 5-4-4z" />
      </>
    ),
    piano: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M6 4v10m4-10v10m4-10v10m4-10v10M2 14h20" />
      </>
    ),
    mic: (
      <>
        <rect x="9" y="2" width="6" height="13" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0m-7 7v5m-4 0h8" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" />
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 5 5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
    monitor: (
      <>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8m-4-4v4" />
      </>
    ),
    contrast: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18a9 9 0 0 0 0-18Z" fill="currentColor" />
      </>
    ),
    reset: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </>
    ),
    wave: <path d="M2 12c2.5-4 5-4 7.5 0s5 4 7.5 0 3.5-3 5-1.5" />,
    headphones: (
      <>
        <path d="M3 14v-2a9 9 0 0 1 18 0v2M3 13h4v8H5a2 2 0 0 1-2-2zm14 0h4v6a2 2 0 0 1-2 2h-2z" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5m0-8h.01" />
      </>
    ),
    alert: (
      <>
        <path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        <path d="M12 9v4m0 4h.01" />
      </>
    ),
    upload: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </>
    ),
    printer: (
      <>
        <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="7" rx="1" />
      </>
    ),
    filter: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
    map: (
      <>
        <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </>
    ),
    trend: <path d="M3 17 9 11l4 4 8-8m-5 0h5v5" />,
    database: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
      </>
    ),
    star: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" />
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.music}
    </svg>
  )
}
export function LogoMark({ className = "brand-mark" }: { className?: string }) {
  const uid = useId().replace(/:/g, "")
  return (
    <svg
      className={className}
      viewBox="4 4 172 192"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient
          id={`lira-blue-${uid}`}
          x1="0.2"
          y1="0"
          x2="0.55"
          y2="1"
        >
          <stop offset="0" className="brand-mark__stop-a" stopColor="#0a2756" />
          <stop
            offset="0.55"
            className="brand-mark__stop-b"
            stopColor="#13479a"
          />
          <stop offset="1" className="brand-mark__stop-c" stopColor="#1f63ba" />
        </linearGradient>
        <mask
          id={`lira-hole-${uid}`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="200"
          height="200"
        >
          <rect x="0" y="0" width="200" height="200" fill="#fff" />
          <circle cx="96" cy="100" r="33" fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#lira-hole-${uid})`}>
        <path d="M100 4A96 96 0 0 0 100 196Z" fill={`url(#lira-blue-${uid})`} />
        <path
          className="brand-mark__dark"
          d="M100 24A76 76 0 0 1 100 176Z"
          fill="#0b0c10"
        />
      </g>
    </svg>
  )
}
type LogoProps = {
  go: Go
  inverted?: boolean
}
export function Logo({ go, inverted = false }: LogoProps) {
  return (
    <a
      href="/"
      onClick={(e) => {
        e.preventDefault()
        go("/")
      }}
      className={`brand-logo ${inverted ? "brand-logo--light" : ""}`}
      aria-label="Lira Paulistana, Espaço Cultural — página inicial"
    >
      <LogoMark />
      <span className="brand-type" aria-hidden="true">
        <strong>
          <b>Lira</b>Paulistana
        </strong>
        <small>ESPAÇO CULTURAL</small>
      </span>
    </a>
  )
}
export function NavAnchor({
  to,
  go,
  children,
  className = "",
  active = false,
}: {
  to: string
  go: Go
  children: ReactNode
  className?: string
  active?: boolean
}) {
  return (
    <a
      href={to}
      className={className}
      aria-current={active ? "page" : undefined}
      onClick={(e) => {
        if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          e.preventDefault()
          go(to)
        }
      }}
    >
      {children}
    </a>
  )
}
export function PrimaryButton({
  children,
  onClick,
  className = "",
  light = false,
  type = "button",
  disabled = false,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  light?: boolean
  type?: "button" | "submit"
  disabled?: boolean
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`action-primary ${
        light ? "action-primary--light" : ""
      } ${className}`}
    >
      {children}
    </button>
  )
}
export function PageIntro({
  eyebrow,
  title,
  desc,
  right,
}: {
  eyebrow: string
  title: ReactNode
  desc?: string
  right?: ReactNode
}) {
  return (
    <div className="page-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {desc && <p className="page-intro-desc">{desc}</p>}
      </div>
      {right && <div className="page-intro-right">{right}</div>}
    </div>
  )
}
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`panel ${className}`}>{children}</div>
}
export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: "neutral" | "positive" | "warning" | "negative"
}) {
  return <span className={`pill pill--${tone}`}>{children}</span>
}
export function Stat({
  label,
  value,
  icon,
  hint,
}: {
  label: string
  value: string
  icon: string
  hint?: string
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon name={icon} />
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  )
}
export function Empty({
  title,
  desc,
  action,
}: {
  title: string
  desc: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name="music" size={26} />
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
      {action}
    </div>
  )
}
type BreadcrumbProps = {
  role: Role
  section: string
}
export function Breadcrumb({ role, section }: BreadcrumbProps) {
  return (
    <p className="breadcrumb">
      {role === "admin"
        ? "Gestão"
        : role === "professor"
          ? "Professor"
          : "Meu espaço"}{" "}
      <Icon name="chevron" size={13} /> <strong>{section}</strong>
    </p>
  )
}

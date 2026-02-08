export function IconBolt(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export function IconCoin(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  );
}

export function IconBackpack(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5" />
      <path d="M8 10h8" />
    </svg>
  );
}

export function IconEdit(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function IconD20Mark(props: { size?: number; title?: string }) {
  const size = props.size ?? 26;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={props.title ? "img" : "presentation"}
      aria-label={props.title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M32 3 6 18v28l26 15 26-15V18L32 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M32 3 6 18l26 15 26-15L32 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <path
        d="M6 18v28l26 15V33L6 18Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d="M58 18v28L32 61V33l26-15Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
        opacity="0.55"
      />
      <path
        d="M32 33 20 51h24L32 33Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}

export function IconRefresh(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

export function IconMagic(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m2 22 1-1h3l9-9" />
      <path d="M3 21v-3l9-9" />
      <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.9.9" />
      <path d="m22 2-1.5 1.5" />
    </svg>
  );
}

export function IconGrid(props: {
  size?: number;
  style?: React.CSSProperties;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconUsers(props: { size?: number }) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-12 9c0-3.3 3.6-5 8-5s8 1.7 8 5v1H4v-1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconCalendar(props: { size?: number }) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm13 8H6v10h14V10ZM6 8h14V6H6v2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconNotes(props: { size?: number }) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 2h9l3 3v17H6V2Zm9 1.5V6h2.5L15 3.5ZM8 9h8v2H8V9Zm0 4h8v2H8v-2Zm0 4h6v2H8v-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconCog(props: { size?: number }) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.4 13a7.7 7.7 0 0 0 0-2l2-1.2-2-3.5-2.2.8a7.4 7.4 0 0 0-1.7-1L15.2 3h-6.4L8.5 6.1a7.4 7.4 0 0 0-1.7 1L4.6 6.3l-2 3.5L4.6 11a7.7 7.7 0 0 0 0 2l-2 1.2 2 3.5 2.2-.8c.5.4 1.1.8 1.7 1L8.8 21h6.4l.3-3.1c.6-.2 1.2-.6 1.7-1l2.2.8 2-3.5-2-1.2ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconStar(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function IconSparkles(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

export function IconSkull(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.5 3.37 1.41 4.84.95 1.54 1.59 3.16 1.59 5.16v2c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2v-2c0-2 .64-3.62 1.59-5.16C18.5 12.37 19 10.74 19 9c0-3.87-3.13-7-7-7zm0 18h-4v-1h4v1zm0-2h-4v-1h4v1zm2.22-8.24c-.87 1.41-1.22 2.74-1.22 4.24h-2c0-1.89.58-3.48 1.63-5.18.58-.93.37-2.15-.49-2.82C11.5 5.5 11 5.5 10.36 6c-.86.67-1.07 1.89-.49 2.82 1.05 1.7 1.63 3.29 1.63 5.18h-2c0-1.5-.35-2.83-1.22-4.24C7.57 8.54 7 7.21 7 5.5c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.71-.57 3.04-2.78 4.26z" />
      <path
        d="M12 2C7.58 2 4 5.58 4 10c0 2.42 1.09 4.6 2.8 6.09L7 20h2v-2.15c.61.1 1.25.15 1.91.15H11v2h2v-2h.09c.66 0 1.3-.05 1.91-.15V20h2l.2-3.91C18.91 14.6 20 12.42 20 10c0-4.42-3.58-8-8-8zm4 11h-2v-2h2v2zm-4 0h-2v-2h2v2zm-4 0H6v-2h2v2zm4-5h-2V6h2v2zm-4 0H6V6h2v2z"
        opacity="0"
      />
      <circle cx="9" cy="9" r="2" />
      <circle cx="15" cy="9" r="2" />
    </svg>
  );
}

export function IconPlus(props: {
  size?: number;
  style?: React.CSSProperties;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2Z" fill="currentColor" />
    </svg>
  );
}

export function IconTrash(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function IconUser(props: {
  size?: number;
  style?: React.CSSProperties;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4Zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconSword(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 3L3 20l1 1 17-17-1-1zm-9 9l-4 4-2-2 4-4 2 2z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconShield(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconHeart(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconChevronLeft(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconChevronRight(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconChevronUp(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconChevronDown(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconBubble(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconDice(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconScroll(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V19z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconBook(props: {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      className={props.className}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export function IconX(props: { size?: number; style?: React.CSSProperties }) {
  const size = props.size ?? 18;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={props.style}
      role="presentation"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

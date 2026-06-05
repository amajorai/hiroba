export function RumbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="18" fill="#85C742" />
      <path
        d="M28 22h22c8 0 14 2.5 14 10.5 0 4.5-2.5 8-6.5 9.5L68 56H54l-9-13h-5v13H28V22zm12 10v9h8c3 0 5-1.5 5-4.5S51 32 48 32h-8z"
        fill="#fff"
      />
      <path d="M28 62h12v16H28V62zm14 0h12l8 16H50l-8-16z" fill="#fff" />
    </svg>
  )
}

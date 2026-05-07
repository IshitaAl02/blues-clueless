export default function PawLogo({ className = "", size = 56 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Blue's Clueless paw"
    >
      <circle cx="32" cy="40" r="14" fill="#3DD9EB" stroke="#0B2A5B" strokeWidth="3" />
      <ellipse cx="14" cy="26" rx="6" ry="8" fill="#3DD9EB" stroke="#0B2A5B" strokeWidth="3" />
      <ellipse cx="50" cy="26" rx="6" ry="8" fill="#3DD9EB" stroke="#0B2A5B" strokeWidth="3" />
      <ellipse cx="22" cy="14" rx="5" ry="7" fill="#3DD9EB" stroke="#0B2A5B" strokeWidth="3" />
      <ellipse cx="42" cy="14" rx="5" ry="7" fill="#3DD9EB" stroke="#0B2A5B" strokeWidth="3" />
    </svg>
  );
}

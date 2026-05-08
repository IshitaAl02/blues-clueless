// Tiny decorative cartoon SVGs scattered around the UI for cuteness.

export function CloudPuff({ className = "", size = 64 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 60" fill="none">
      <ellipse cx="30" cy="40" rx="22" ry="16" fill="#fff" stroke="#093C5D" strokeWidth="3" />
      <ellipse cx="55" cy="32" rx="20" ry="18" fill="#fff" stroke="#093C5D" strokeWidth="3" />
      <ellipse cx="78" cy="42" rx="16" ry="13" fill="#fff" stroke="#093C5D" strokeWidth="3" />
      <circle cx="42" cy="38" r="2.2" fill="#093C5D" />
      <circle cx="62" cy="32" r="2.2" fill="#093C5D" />
      <path d="M50 42 q4 4 8 0" stroke="#093C5D" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function StarSpark({ className = "", size = 36, color = "#5DF8D8" }: { className?: string; size?: number; color?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2 L13.7 9 L21 10.3 L13.7 11.6 L12 22 L10.3 11.6 L3 10.3 L10.3 9 Z" fill={color} stroke="#093C5D" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function HeartBlob({ className = "", size = 40 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M16 28 C2 19 6 6 16 12 C26 6 30 19 16 28 Z" fill="#FF8FB1" stroke="#093C5D" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="11" cy="14" r="1.4" fill="#093C5D" />
      <circle cx="21" cy="14" r="1.4" fill="#093C5D" />
      <path d="M13 18 q3 2 6 0" stroke="#093C5D" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function PawLogo({ className = "", size = 56 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="40" r="14" fill="#5DF8D8" stroke="#093C5D" strokeWidth="3" />
      <ellipse cx="14" cy="26" rx="6" ry="8" fill="#6FD1D7" stroke="#093C5D" strokeWidth="3" />
      <ellipse cx="50" cy="26" rx="6" ry="8" fill="#6FD1D7" stroke="#093C5D" strokeWidth="3" />
      <ellipse cx="22" cy="14" rx="5" ry="7" fill="#5DF8D8" stroke="#093C5D" strokeWidth="3" />
      <ellipse cx="42" cy="14" rx="5" ry="7" fill="#5DF8D8" stroke="#093C5D" strokeWidth="3" />
      <circle cx="28" cy="38" r="1.6" fill="#093C5D" />
      <circle cx="36" cy="38" r="1.6" fill="#093C5D" />
      <path d="M28 44 q4 3 8 0" stroke="#093C5D" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function MagnifyClue({ className = "", size = 48 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="20" cy="20" r="13" fill="#6FD1D7" stroke="#093C5D" strokeWidth="3" />
      <circle cx="20" cy="20" r="7" fill="#fff" stroke="#093C5D" strokeWidth="2" />
      <line x1="30" y1="30" x2="42" y2="42" stroke="#093C5D" strokeWidth="5" strokeLinecap="round" />
      <circle cx="17" cy="18" r="1.4" fill="#093C5D" />
      <circle cx="22" cy="18" r="1.4" fill="#093C5D" />
      <path d="M17 22 q3 2 6 0" stroke="#093C5D" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function FloatingDecor() {
  // Absolute-positioned cuties for landing/auth pages
  return (
    <>
      <CloudPuff className="absolute top-8 left-6 opacity-90 animate-floaty" size={70} />
      <CloudPuff className="absolute top-16 right-10 opacity-80 animate-floaty" size={56} />
      <StarSpark className="absolute top-24 left-1/3 animate-wiggle" size={28} color="#FFD93D" />
      <StarSpark className="absolute bottom-24 right-1/4 animate-wiggle" size={24} color="#5DF8D8" />
      <HeartBlob className="absolute bottom-10 left-10 animate-floaty" size={44} />
      <MagnifyClue className="absolute bottom-16 right-8 animate-floaty" size={56} />
    </>
  );
}

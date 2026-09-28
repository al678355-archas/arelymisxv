// Decoración 100 % CSS/SVG: pétalos flotantes, partículas brillantes y ramas florales.

export function Petal({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 2C28 10 34 18 20 38 6 18 12 10 20 2z" fill="currentColor" />
      <path d="M20 6v28" stroke="rgba(255,255,255,.45)" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function Petals({ count = 12 }) {
  return (
    <div className="petals" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="petals__item">
          <Petal />
        </span>
      ))}
    </div>
  );
}

export function Sparkles({ count = 18 }) {
  return (
    <div className="sparkles" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="sparkles__dot" />
      ))}
    </div>
  );
}

// Rama floral en línea fina para esquinas de secciones.
export function FloralBranch({ className = '' }) {
  return (
    <svg className={`floral ${className}`} viewBox="0 0 220 220" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M10 210C60 170 90 120 110 60S170 10 210 12" />
        <path d="M60 170c-20-4-34-18-38-36 18 2 32 14 38 36z" />
        <path d="M86 128c-4-20 2-38 16-50 6 16 2 34-16 50z" />
        <path d="M104 86c10-18 26-28 46-28-6 18-22 28-46 28z" />
        <path d="M140 40c4-14 14-24 28-28 0 14-10 24-28 28z" />
        <path d="M76 150c18-8 38-6 52 6-18 8-36 6-52-6z" />
      </g>
      <g fill="currentColor" opacity=".55">
        <circle cx="178" cy="22" r="5" />
        <circle cx="192" cy="34" r="3.5" />
        <circle cx="36" cy="120" r="3" />
        <circle cx="130" cy="104" r="3.5" />
      </g>
    </svg>
  );
}

export function Divider() {
  return (
    <div className="divider" aria-hidden="true">
      <span className="divider__line" />
      <svg viewBox="0 0 24 24" className="divider__icon">
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="currentColor" />
      </svg>
      <span className="divider__line" />
    </div>
  );
}

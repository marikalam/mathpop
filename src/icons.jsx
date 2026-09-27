export function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19V11" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13 L10 18 L19 7" />
    </svg>
  );
}

export function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6 L18 18" />
      <path d="M18 6 L6 18" />
    </svg>
  );
}

export function ClockFace({ hour, minute, size = 160 }) {
  const minuteAngle = minute * 6;
  const hourAngle = (hour % 12) * 30 + minute * 0.5;
  const ticks = Array.from({ length: 12 }, (_, i) => i);

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="clock-face">
      <circle cx="50" cy="50" r="46" fill="#fff" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
      {ticks.map((i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const isMajor = i % 3 === 0;
        const r1 = isMajor ? 37 : 40;
        const x1 = 50 + r1 * Math.sin(angle);
        const y1 = 50 - r1 * Math.cos(angle);
        const x2 = 50 + 43 * Math.sin(angle);
        const y2 = 50 - 43 * Math.cos(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#2b2b33"
            strokeWidth={isMajor ? 2.5 : 1.2}
            strokeLinecap="round"
          />
        );
      })}
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="26"
        stroke="#2b2b33"
        strokeWidth="4.5"
        strokeLinecap="round"
        transform={`rotate(${hourAngle} 50 50)`}
      />
      <line
        x1="50"
        y1="50"
        x2="50"
        y2="14"
        stroke="#3B6FEF"
        strokeWidth="3"
        strokeLinecap="round"
        transform={`rotate(${minuteAngle} 50 50)`}
      />
      <circle cx="50" cy="50" r="3.5" fill="#2b2b33" />
    </svg>
  );
}

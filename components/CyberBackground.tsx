'use client';

export default function CyberBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="cyber-glow" />
      <div className="cyber-scanlines" />
    </div>
  );
}

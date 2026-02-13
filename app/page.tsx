import Link from 'next/link';
import RubiksCube from '../components/RubiksCube';
import CyberBackground from '../components/CyberBackground';

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-black text-cyan-50 overflow-hidden">
      <CyberBackground />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="text-center space-y-4">
          <div className="text-xs tracking-[0.4em] text-cyber-cyan">SYSTEM_READY</div>
          <div className="text-3xl md:text-4xl tracking-[0.4em] text-white">CYBERCUBE X1</div>
        </div>

        <div className="mt-10 h-[320px] w-[320px] md:h-[420px] md:w-[420px] neon-outline">
          <RubiksCube mode="landing" />
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/play" className="button-cyber text-xs text-cyber-cyan text-center">
            Play Now
          </Link>
          <Link href="/play?mode=learn" className="button-cyber text-xs text-cyber-cyan text-center">
            Learn Now
          </Link>
        </div>
      </div>
    </main>
  );
}

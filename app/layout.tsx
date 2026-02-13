import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CyberCube X1',
  description: 'A cyber Rubik\'s Cube experience',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Product Launch · Forma',
  description: 'A little clarity. A lot of momentum. Your focused project board.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

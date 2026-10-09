import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const prompt = Prompt({
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-prompt',
});

export const metadata: Metadata = {
  title: 'ERMA Supplier Portal',
  description: 'Equipment Reference Master App — Big C / BJC Group',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${prompt.variable} font-prompt antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

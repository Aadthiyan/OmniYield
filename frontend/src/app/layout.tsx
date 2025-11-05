import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DeFi Yield Aggregator',
  description: 'Advanced DeFi yield farming dashboard with cross-chain bridge integration',
  keywords: ['DeFi', 'yield farming', 'cross-chain', 'bridge', 'QIE SDK'],
  authors: [{ name: 'DeFi Yield Aggregator Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}

// src/app/layout.tsx
import { AuthProvider } from '@/contexts/AuthProvider';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// 👇 Correção: "metadata", não "meta Metadata"
export const metadata: Metadata = {
  title: 'Tibia Tracker',
  description: 'Acompanhe seu progresso no Tibia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
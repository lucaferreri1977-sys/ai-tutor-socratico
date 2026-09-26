import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import 'katex/dist/katex.min.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Tutor Socratico - Studia con Socrate',
  description:
    'AI Tutor Socratico: una guida didattica empatica per studenti delle scuole medie (Alessio e Mattia) per tutte le materie curricolari con il metodo socratico.',
  icons: {
    icon: [
      { url: '/favicon.ico?v=20260927', sizes: 'any' },
      { url: '/icon.png?v=20260927', sizes: '64x64', type: 'image/png' },
      { url: '/icon.svg?v=20260927', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico?v=20260927',
    apple: [
      { url: '/apple-icon.png?v=20260927', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-[100dvh] antialiased`}
    >
      <body className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overscroll-none">
        {children}
      </body>
    </html>
  );
}

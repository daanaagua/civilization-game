import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '文明演进 - 跨时代策略游戏',
  description: '从远古部落到现代科技，体验人类文明的完整发展历程',
  keywords: ['游戏', '文明', '策略', '挂机', '科技', '魔法', '演进'],
  authors: [{ name: '游戏开发者' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
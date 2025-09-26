import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import EventsBootstrapper from '@/components/system/EventsBootstrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '文明演进 - 跨时代策略游戏',
  description: '从远古部落到现代科技，体验人类文明的完整发展历程',
  keywords: ['游戏', '文明', '策略', '挂机', '科技', '魔法', '演进'],
  authors: [{ name: '游戏开发者' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {/* 事件系统初始化（客户端组件） */}
        <EventsBootstrapper />
        {children}
      </body>
    </html>
  );
}
'use client';

import dynamic from 'next/dynamic';

const Board = dynamic(() => import('@/components/board'), {
  ssr: false,
  loading: () => <div className="board-loading" role="status">Preparing your board…</div>,
});

export default function Home() { return <Board />; }

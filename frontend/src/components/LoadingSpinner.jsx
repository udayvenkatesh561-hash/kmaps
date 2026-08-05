import React from 'react';

export function LoadingSpinner({ text = "Solving K-Map..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-ping" />
        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-purple-500 border-b-cyan-500 border-l-transparent animate-spin" />
      </div>
      <span className="text-xs font-bold text-slate-300 font-mono tracking-wider animate-pulse">
        {text}
      </span>
    </div>
  );
}

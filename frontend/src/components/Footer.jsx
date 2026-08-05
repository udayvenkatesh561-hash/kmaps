import React from 'react';
import { Cpu, Heart } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function Footer() {
  const { dark } = useTheme();

  return (
    <footer className={`mt-20 border-t py-10 text-xs transition-colors duration-200 ${dark ? 'border-slate-800/80 bg-[#0F172A] text-slate-400' : 'border-slate-200 bg-white text-slate-500'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span className={`font-bold ${dark ? 'text-slate-200' : 'text-slate-700'}`}>K-Map Solver</span>
          <span>•</span>
          <span>Educational Boolean Architecture Studio</span>
        </div>

        {/* Tech Stack Badges */}
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          {['FastAPI', 'React', 'SymPy', 'Tailwind CSS'].map((t) => (
            <span key={t} className={`px-2 py-0.5 rounded-md ${dark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{t}</span>
          ))}
        </div>

        {/* Copyright */}
        <div className="flex items-center space-x-1">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400 inline" />
          <span>for Digital Logic Design</span>
        </div>

      </div>
    </footer>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

export function KMapCell({ cell, onToggle, highlightedGroupColor }) {
  const { dark } = useTheme();
  const { minterm_index, binary_label, value } = cell;

  // Determine styling based on cell value
  let valueStyle = dark
    ? "text-slate-500 bg-slate-900/40 border-slate-800/80"
    : "text-slate-400 bg-slate-50 border-slate-200";
  let badgeStyle = dark ? "text-slate-600 bg-slate-800/40" : "text-slate-400 bg-slate-100";

  if (value === "1") {
    valueStyle = dark
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
      : "text-emerald-600 bg-emerald-50 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
    badgeStyle = dark ? "text-emerald-400/90 bg-emerald-500/20" : "text-emerald-600 bg-emerald-100";
  } else if (value === "X") {
    valueStyle = dark
      ? "text-purple-400 bg-purple-500/10 border-purple-500/30 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
      : "text-purple-600 bg-purple-50 border-purple-300 shadow-[0_0_10px_rgba(139,92,246,0.15)]";
    badgeStyle = dark ? "text-purple-400/90 bg-purple-500/20" : "text-purple-600 bg-purple-100";
  }

  // Highlight style if hovered group covers this cell
  const isHovered = Boolean(highlightedGroupColor);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onToggle(minterm_index)}
      className={`relative flex flex-col items-center justify-center w-full h-full p-0.5 rounded border transition-all cursor-pointer select-none group ${valueStyle}`}
      style={{
        borderColor: isHovered ? highlightedGroupColor : undefined,
        boxShadow: isHovered ? `0 0 20px ${highlightedGroupColor}66` : undefined,
        backgroundColor: isHovered ? `${highlightedGroupColor}22` : undefined
      }}
    >
      {/* Minterm decimal badge */}
      <div className="w-full flex items-center justify-between text-[8px] font-mono leading-none mb-0.5">
        <span className={`px-0.5 rounded font-bold ${badgeStyle}`}>
          m{minterm_index}
        </span>
        <span className={`${dark ? 'text-slate-600 group-hover:text-slate-500' : 'text-slate-400 group-hover:text-slate-500'} text-[7px]`}>
          {binary_label}
        </span>
      </div>

      {/* Main Cell Value */}
      <div className="text-sm sm:text-base font-extrabold tracking-wider font-mono leading-none">
        {value === "1" ? (
          <span className={`${dark ? 'text-emerald-400' : 'text-emerald-600'} font-black`}>1</span>
        ) : value === "X" ? (
          <span className={`${dark ? 'text-purple-400' : 'text-purple-600'} font-black`}>X</span>
        ) : (
          <span className={`${dark ? 'text-slate-600 group-hover:text-slate-400' : 'text-slate-400 group-hover:text-slate-600'} font-semibold`}>0</span>
        )}
      </div>

    </motion.button>
  );
}

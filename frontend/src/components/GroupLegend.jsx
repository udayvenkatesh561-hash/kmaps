import React from 'react';
import { Layers, Sparkles, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function GroupLegend({ groups, essentialGroups, hoveredGroupId, setHoveredGroupId }) {
  const { dark } = useTheme();
  if (!groups || groups.length === 0) {
    return (
      <div className={`glass-panel p-6 rounded-2xl border text-center text-sm ${dark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
        No grouping required (expression evaluates to 0 or 1).
      </div>
    );
  }

  return (
    <div className={`glass-panel p-6 rounded-2xl border space-y-4 ${dark ? 'border-slate-800/80' : 'border-slate-200'}`}>
      
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-3 ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Identified Prime Implicants</h3>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Hover over any term to highlight matrix cells</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${dark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
          {groups.length} Group{groups.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Legend Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {groups.map((group) => {
          const isHovered = hoveredGroupId === group.id;

          return (
            <div
              key={group.id}
              onMouseEnter={() => setHoveredGroupId(group.id)}
              onMouseLeave={() => setHoveredGroupId(null)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                isHovered
                  ? dark
                    ? 'bg-slate-800/90 border-cyan-500 shadow-glow-accent scale-[1.02]'
                    : 'bg-cyan-50 border-cyan-300 shadow-md scale-[1.02]'
                  : dark
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Group Color Swatch */}
                <div
                  className="w-4 h-10 rounded-md shadow-md shrink-0"
                  style={{ backgroundColor: group.color }}
                />

                <div>
                  {/* Algebraic Term */}
                  <div className={`text-base font-extrabold font-mono tracking-wide flex items-center space-x-2 ${dark ? 'text-white' : 'text-slate-900'}`}>
                    <span>{group.term}</span>
                    <span className={`text-xs font-normal font-sans ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                      ({group.binary_pattern})
                    </span>
                  </div>

                  {/* Covered Minterms & Metadata */}
                  <div className={`text-[11px] font-mono mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                    m({group.cells.join(', ')}) • Size {group.group_size}
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-col items-end space-y-1">
                {group.is_essential && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Essential</span>
                  </span>
                )}

                {group.is_wrap_around && (
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30 flex items-center space-x-1">
                    <RefreshCw className="w-3 h-3 text-cyan-400" />
                    <span>Wrap-around</span>
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}

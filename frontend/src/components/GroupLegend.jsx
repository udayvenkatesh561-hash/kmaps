import React from 'react';
import { Layers, Sparkles, RefreshCw } from 'lucide-react';

export function GroupLegend({ groups, essentialGroups, hoveredGroupId, setHoveredGroupId }) {
  if (!groups || groups.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 text-center text-slate-400 text-sm">
        No grouping required (expression evaluates to 0 or 1).
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Identified Prime Implicants</h3>
            <p className="text-xs text-slate-400">Hover over any term to highlight matrix cells</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-semibold border border-slate-700">
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
                  ? 'bg-slate-800/90 border-cyan-500 shadow-glow-accent scale-[1.02]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
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
                  <div className="text-base font-extrabold text-white font-mono tracking-wide flex items-center space-x-2">
                    <span>{group.term}</span>
                    <span className="text-xs text-slate-400 font-normal font-sans">
                      ({group.binary_pattern})
                    </span>
                  </div>

                  {/* Covered Minterms & Metadata */}
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
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

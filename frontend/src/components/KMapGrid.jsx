import React from 'react';
import { KMapCell } from './KMapCell';
import { Grid, Sparkles } from 'lucide-react';

export function KMapGrid({ kmapData, groups, hoveredGroupId, onToggleCell }) {
  if (!kmapData) return null;

  const { variables, subgrids_count, row_vars, col_vars, corner_label, row_labels, col_labels, row_headers, col_headers, grid, subgrids } = kmapData;

  // Build mapping from minterm_index -> highlighted group color
  const cellHighlightMap = {};
  if (hoveredGroupId && groups) {
    const targetGroup = groups.find(g => g.id === hoveredGroupId);
    if (targetGroup) {
      targetGroup.cells.forEach(m => {
        cellHighlightMap[m] = targetGroup.color;
      });
    }
  }

  // Render a single grid matrix
  const renderSingleMatrix = (matrix, title, subgridIndex = 0) => (
    <div className="overflow-x-auto pb-2">
      {title && (
        <div className="mb-3 text-center">
          <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold shadow-md">
            {title}
          </span>
        </div>
      )}

      <table className="w-full border-collapse">
        <thead>
          <tr>
            {/* Top-Left Corner Header */}
            <th className="p-1 bg-slate-900/90 text-slate-300 font-mono text-[10px] font-bold border border-slate-800 rounded-tl text-center min-w-[50px]">
              {corner_label}
            </th>

            {/* Column Headers (Gray Code) */}
            {col_labels.map((cLabel, idx) => (
              <th key={idx} className="p-1 bg-slate-900/90 border border-slate-800 text-center min-w-[40px]">
                <div className="font-mono text-xs font-bold text-white">{cLabel}</div>
                {col_headers && col_headers[idx] && (
                  <div className="font-mono text-[8px] text-cyan-400 font-normal tracking-tight leading-none mt-0.5">
                    {col_headers[idx]}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((rowCells, rIdx) => (
            <tr key={rIdx}>
              {/* Row Header (Gray Code) */}
              <th className="p-1 bg-slate-900/90 border border-slate-800 text-center">
                <div className="font-mono text-xs font-bold text-white">{row_labels[rIdx]}</div>
                {row_headers && row_headers[rIdx] && (
                  <div className="font-mono text-[8px] text-purple-400 font-normal tracking-tight leading-none mt-0.5">
                    {row_headers[rIdx]}
                  </div>
                )}
              </th>

              {/* Grid Cells */}
              {rowCells.map((cell) => (
                <td key={cell.minterm_index} className="p-px border border-slate-800/80">
                  <KMapCell
                    cell={cell}
                    onToggle={onToggleCell}
                    highlightedGroupColor={cellHighlightMap[cell.minterm_index]}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-3 shadow-xl">
      
      {/* Matrix Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Interactive K-Map Grid</h3>
            <p className="text-[10px] text-slate-400">Click any cell to cycle (0 → 1 → X)</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[10px] font-mono">
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500" />
            <span className="text-slate-300">1</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-purple-500/30 border border-purple-500" />
            <span className="text-slate-300">X</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-800" />
            <span className="text-slate-400">0</span>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {variables <= 4 ? (
        renderSingleMatrix(grid)
      ) : (
        /* 5-Variable Dual Subgrids */
        <div className="space-y-6">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span><strong>5-Variable Mode:</strong> Dual 4x4 subgrids for A=0 (left) and A=1 (right) with 3D wrap-around adjacencies across maps.</span>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {subgrids && subgrids.map((sg) => (
              <div key={sg.subgrid_index} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                {renderSingleMatrix(sg.grid, sg.subgrid_title, sg.subgrid_index)}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import { Table, Filter } from 'lucide-react';

export function TruthTable({ truthTable, varNames }) {
  const [filter, setFilter] = useState("ALL"); // "ALL", "1", "0", "X"

  if (!truthTable || truthTable.length === 0) return null;

  const filteredRows = truthTable.filter((row) => {
    if (filter === "ALL") return true;
    return row.output === filter;
  });

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Full Truth Table</h3>
            <p className="text-xs text-slate-400">Complete {truthTable.length}-state truth table mapping</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          {["ALL", "1", "0", "X"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f === "ALL" ? "All States" : f === "1" ? "1s Only" : f === "0" ? "0s Only" : "Don't Care (X)"}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto rounded-xl border border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-900 text-slate-300 font-mono text-xs uppercase tracking-wider border-b border-slate-800 z-10">
            <tr>
              <th className="p-3">Index</th>
              <th className="p-3">Binary</th>
              {varNames.map((name) => (
                <th key={name} className="p-3 text-center">{name}</th>
              ))}
              <th className="p-3 text-center">Output (F)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs text-slate-200">
            {filteredRows.map((row) => {
              let outBadge = "text-slate-400 bg-slate-800/40";
              if (row.output === "1") outBadge = "text-emerald-400 bg-emerald-500/20 font-bold border border-emerald-500/30";
              if (row.output === "X") outBadge = "text-purple-400 bg-purple-500/20 font-bold border border-purple-500/30";

              return (
                <tr key={row.minterm_index} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 text-indigo-400 font-bold">m{row.minterm_index}</td>
                  <td className="p-3 text-slate-400">{row.binary}</td>
                  {varNames.map((name) => (
                    <td key={name} className="p-3 text-center text-white">
                      {row.inputs[name]}
                    </td>
                  ))}
                  <td className="p-3 text-center">
                    <span className={`inline-block w-7 py-0.5 rounded-md text-center ${outBadge}`}>
                      {row.output}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

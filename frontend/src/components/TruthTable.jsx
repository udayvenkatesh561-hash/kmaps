import React, { useState } from 'react';
import { Table, Filter } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function TruthTable({ truthTable, varNames }) {
  const { dark } = useTheme();
  const [filter, setFilter] = useState("ALL"); // "ALL", "1", "0", "X"

  if (!truthTable || truthTable.length === 0) return null;

  const filteredRows = truthTable.filter((row) => {
    if (filter === "ALL") return true;
    return row.output === filter;
  });

  return (
    <div className={`glass-panel p-6 rounded-2xl border space-y-4 shadow-xl ${dark ? 'border-slate-800/80' : 'border-slate-200'}`}>
      
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Full Truth Table</h3>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Complete {truthTable.length}-state truth table mapping</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className={`flex items-center space-x-1 p-1 rounded-xl border text-xs font-semibold ${dark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          {["ALL", "1", "0", "X"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : dark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {f === "ALL" ? "All States" : f === "1" ? "1s Only" : f === "0" ? "0s Only" : "Don't Care (X)"}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className={`overflow-x-auto max-h-[420px] overflow-y-auto rounded-xl border ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
        <table className="w-full text-left border-collapse">
          <thead className={`sticky top-0 font-mono text-xs uppercase tracking-wider border-b z-10 ${dark ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
            <tr>
              <th className="p-3">Index</th>
              <th className="p-3">Binary</th>
              {varNames.map((name) => (
                <th key={name} className="p-3 text-center">{name}</th>
              ))}
              <th className="p-3 text-center">Output (F)</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-mono text-xs ${dark ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-200 text-slate-700'}`}>
            {filteredRows.map((row) => {
              let outBadge = dark ? "text-slate-400 bg-slate-800/40" : "text-slate-500 bg-slate-100";
              if (row.output === "1") outBadge = dark ? "text-emerald-400 bg-emerald-500/20 font-bold border border-emerald-500/30" : "text-emerald-600 bg-emerald-50 font-bold border border-emerald-200";
              if (row.output === "X") outBadge = dark ? "text-purple-400 bg-purple-500/20 font-bold border border-purple-500/30" : "text-purple-600 bg-purple-50 font-bold border border-purple-200";

              return (
                <tr key={row.minterm_index} className={`transition-colors ${dark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                  <td className="p-3 text-indigo-400 font-bold">m{row.minterm_index}</td>
                  <td className={`p-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{row.binary}</td>
                  {varNames.map((name) => (
                    <td key={name} className={`p-3 text-center ${dark ? 'text-white' : 'text-slate-900'}`}>
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

import React from 'react';
import { History, Clock, Trash2, ArrowUpRight } from 'lucide-react';
import { useHistory } from '../hooks/useHistory';

export function HistoryPanel({ onLoadItem }) {
  const { history, clearHistory } = useHistory();

  if (!history || history.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 text-center text-slate-400 text-xs">
        <Clock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
        No recent calculations saved yet.
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4 shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Calculation History</h3>
            <p className="text-xs text-slate-400">Recent solved K-Maps</p>
          </div>
        </div>

        <button
          onClick={clearHistory}
          title="Clear History"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* History Items List */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onLoadItem(item)}
            className="w-full p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-left flex items-center justify-between group"
          >
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold font-mono">
                  {item.variables} Vars
                </span>
                <span className="text-xs font-bold text-white font-mono">{item.expression}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                m({(item.minterm_indices || item.minterms || []).join(', ')})
              </div>
            </div>

            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
          </button>
        ))}
      </div>

    </div>
  );
}

import React from 'react';
import { History, Clock, Trash2, ArrowUpRight } from 'lucide-react';
import { useHistory } from '../hooks/useHistory';
import { useTheme } from '../contexts/ThemeContext';

export function HistoryPanel({ onLoadItem }) {
  const { dark } = useTheme();
  const { history, clearHistory } = useHistory();

  if (!history || history.length === 0) {
    return (
      <div className={`glass-panel p-6 rounded-2xl border text-center text-xs ${dark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
        <Clock className={`w-6 h-6 mx-auto mb-2 ${dark ? 'text-slate-600' : 'text-slate-400'}`} />
        No recent calculations saved yet.
      </div>
    );
  }

  return (
    <div className={`glass-panel p-6 rounded-2xl border space-y-4 shadow-xl ${dark ? 'border-slate-800/80' : 'border-slate-200'}`}>
      
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-3 ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Calculation History</h3>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Recent solved K-Maps</p>
          </div>
        </div>

        <button
          onClick={clearHistory}
          title="Clear History"
          className={`p-1.5 rounded-lg transition-colors ${dark ? 'text-slate-400 hover:text-red-400 hover:bg-slate-800' : 'text-slate-500 hover:text-red-500 hover:bg-slate-100'}`}
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
            className={`w-full p-3 rounded-xl border transition-all text-left flex items-center justify-between group ${dark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60' : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'}`}
          >
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold font-mono">
                  {item.variables} Vars
                </span>
                <span className={`text-xs font-bold font-mono ${dark ? 'text-white' : 'text-slate-900'}`}>{item.expression}</span>
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

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Table2,
  Copy,
  Check,
  AlertCircle,
  Download,
  Hash,
  Braces,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

function getVars(expr) {
  const vars = new Set();
  for (const ch of expr) {
    if (/[a-zA-Z]/.test(ch) && ch !== 'x' && !['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'].some(op => expr.includes(op))) {
      vars.add(ch);
    }
  }
  const matches = expr.match(/[A-Z][A-Z0-9]*/g) || [];
  matches.forEach((m) => {
    if (!['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR', 'XNOR'].includes(m)) {
      vars.add(m);
    }
  });
  if (vars.size === 0) {
    for (const ch of expr) {
      if (/[a-zA-Z]/.test(ch)) vars.add(ch);
    }
  }
  return [...vars].sort();
}

function evaluateSmart(expr, varValues) {
  let e = expr;

  const sorted = Object.keys(varValues).sort((a, b) => b.length - a.length);
  for (const v of sorted) {
    const regex = new RegExp(`\\b${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    e = e.replace(regex, String(varValues[v]));
  }

  e = e.replace(/(\d+)\s*&\s*(\d+)/g, (_, a, b) => String(Number(a) & Number(b)));
  e = e.replace(/(\d+)\s*\|\s*(\d+)/g, (_, a, b) => String(Number(a) | Number(b)));
  e = e.replace(/(\d+)\s*\^\s*(\d+)/g, (_, a, b) => String(Number(a) ^ Number(b)));
  e = e.replace(/!\s*(\d+)/g, (_, a) => String(Number(a) ^ 1));
  e = e.replace(/(\d+)\s*&&\s*(\d+)/g, (_, a, b) => String(Number(a) & Number(b)));
  e = e.replace(/(\d+)\s*\|\|\s*(\d+)/g, (_, a, b) => String(Number(a) | Number(b)));

  const match = e.match(/^[01! ]+$/);
  if (match) {
    let result = e.replace(/\s/g, '');
    while (result.includes('!')) {
      result = result.replace(/!0/g, '1').replace(/!1/g, '0');
    }
    while (result.length > 1) {
      result = result.replace(/^([01])([01])(.*)$/, (_, a, b, rest) => {
        return rest;
      });
      break;
    }
    return parseInt(result) || 0;
  }
  return 0;
}

export function TruthTableGenerator() {
  const { dark } = useTheme();
  const [expression, setExpression] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const variables = useMemo(() => getVars(expression), [expression]);

  const truthTable = useMemo(() => {
    if (!expression.trim() || variables.length === 0) return null;
    if (variables.length > 8) {
      setError('Maximum 8 variables supported');
      return null;
    }
    setError('');

    const rows = [];
    const n = variables.length;
    const numRows = Math.pow(2, n);

    for (let i = 0; i < numRows; i++) {
      const varMap = {};
      const row = {};
      for (let j = 0; j < n; j++) {
        const val = (i >> (n - 1 - j)) & 1;
        varMap[variables[j]] = val;
        row[variables[j]] = val;
      }
      row.output = evaluateSmart(expression, varMap);
      rows.push(row);
    }
    return rows;
  }, [expression, variables]);

  const minterms = useMemo(() => {
    if (!truthTable) return [];
    return truthTable.filter((r) => r.output === 1).map((r) => {
      const vals = variables.map((v) => r[v]);
      return parseInt(vals.join(''), 2);
    });
  }, [truthTable, variables]);

  const maxterms = useMemo(() => {
    if (!truthTable) return [];
    return truthTable.filter((r) => r.output === 0).map((r) => {
      const vals = variables.map((v) => r[v]);
      return parseInt(vals.join(''), 2);
    });
  }, [truthTable, variables]);

  const canonicalSOP = useMemo(() => {
    if (minterms.length === 0) return '0';
    if (minterms.length === Math.pow(2, variables.length)) return '1';
    return minterms.map((m) => {
      return variables.map((v, i) => {
        const bit = (m >> (variables.length - 1 - i)) & 1;
        return bit ? v : v + "'";
      }).join('');
    }).join(' + ');
  }, [minterms, variables]);

  const canonicalPOS = useMemo(() => {
    if (maxterms.length === 0) return '1';
    if (maxterms.length === Math.pow(2, variables.length)) return '0';
    return maxterms.map((m) => {
      return '(' + variables.map((v, i) => {
        const bit = (m >> (variables.length - 1 - i)) & 1;
        return bit ? v + "'" : v;
      }).join(' + ') + ')';
    }).join('');
  }, [maxterms, variables]);

  const copyTable = useCallback(() => {
    if (!truthTable) return;
    let text = variables.join('\t') + '\tF\n';
    truthTable.forEach((row) => {
      text += variables.map((v) => row[v]).join('\t') + '\t' + row.output + '\n';
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [truthTable, variables]);

  const downloadCSV = useCallback(() => {
    if (!truthTable) return;
    let csv = variables.join(',') + ',F\n';
    truthTable.forEach((row) => {
      csv += variables.map((v) => row[v]).join(',') + ',' + row.output + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'truth_table.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [truthTable, variables]);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-cyan-500/10" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">
              Truth Table Generator
            </h1>
            <p className={`text-lg ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
              Enter a Boolean expression to generate its complete truth table, minterms, maxterms, and canonical forms.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">
        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}
        >
          <label className="block text-sm font-bold mb-2">Boolean Expression</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={expression}
              onChange={(e) => { setExpression(e.target.value); setError(''); }}
              placeholder="e.g. A&B | C^D  or  AB + BC"
              className={`flex-1 px-4 py-3 rounded-xl border text-sm font-mono transition-all ${
                error ? 'border-red-500 ring-2 ring-red-500/20' : dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'
              }`}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Operators:</span>
            {['&& or & (AND)', '|| or | (OR)', '^ (XOR)', '! or \' (NOT)'].map((op) => (
              <span key={op} className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{op}</span>
            ))}
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </motion.div>

        {/* Truth Table */}
        {truthTable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`rounded-2xl border overflow-hidden ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}
          >
            <div className={`flex items-center justify-between px-6 py-4 border-b ${dark ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Table2 className="w-5 h-5 text-indigo-400" />
                Truth Table ({truthTable.length} rows)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={copyTable}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={dark ? 'bg-slate-700/50' : 'bg-slate-100'}>
                    {variables.map((v) => (
                      <th key={v} className="px-4 py-3 text-left font-bold">{v}</th>
                    ))}
                    <th className="px-4 py-3 text-left font-bold text-indigo-500">F</th>
                  </tr>
                </thead>
                <tbody>
                  {truthTable.map((row, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className={`border-t ${dark ? 'border-slate-700/30' : 'border-slate-200/30'} ${
                        row.output ? (dark ? 'bg-emerald-500/5' : 'bg-emerald-50') : ''
                      }`}
                    >
                      {variables.map((v) => (
                        <td key={v} className="px-4 py-2 font-mono">{row[v]}</td>
                      ))}
                      <td className={`px-4 py-2 font-mono font-bold ${row.output ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {row.output}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Minterms, Maxterms, Canonical Forms */}
        {truthTable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className={`rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}>
              <h3 className="font-bold flex items-center gap-2 mb-3">
                <Hash className="w-4 h-4 text-indigo-400" />
                Minterms (Σm)
              </h3>
              <p className={`text-sm font-mono ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                Σm({minterms.join(', ') || '∅'})
              </p>
              <p className={`text-xs mt-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                {minterms.length} minterm{minterms.length !== 1 ? 's' : ''} where F = 1
              </p>
            </div>

            <div className={`rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}>
              <h3 className="font-bold flex items-center gap-2 mb-3">
                <Hash className="w-4 h-4 text-amber-400" />
                Maxterms (ΠM)
              </h3>
              <p className={`text-sm font-mono ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                ΠM({maxterms.join(', ') || '∅'})
              </p>
              <p className={`text-xs mt-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                {maxterms.length} maxterm{maxterms.length !== 1 ? 's' : ''} where F = 0
              </p>
            </div>

            <div className={`rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}>
              <h3 className="font-bold flex items-center gap-2 mb-3">
                <Braces className="w-4 h-4 text-emerald-400" />
                Canonical SOP
              </h3>
              <p className={`text-sm font-mono break-all ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                F = {canonicalSOP}
              </p>
            </div>

            <div className={`rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}>
              <h3 className="font-bold flex items-center gap-2 mb-3">
                <Braces className="w-4 h-4 text-cyan-400" />
                Canonical POS
              </h3>
              <p className={`text-sm font-mono break-all ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                F = {canonicalPOS}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

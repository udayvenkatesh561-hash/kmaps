import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Braces,
  Copy,
  Check,
  ArrowRight,
  Info,
  Zap,
  Table2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

function getVars(expr) {
  const matches = expr.match(/[A-Z][A-Z0-9]*/g) || [];
  const ops = new Set(['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR', 'XNOR', 'AB', 'BC', 'CD', 'AC', 'AD', 'BD']);
  const filtered = [...new Set(matches.filter((m) => !ops.has(m) && m.length <= 2))].sort();
  if (filtered.length === 0) {
    const chars = new Set();
    for (const ch of expr) {
      if (/[a-zA-Z]/.test(ch)) chars.add(ch.toUpperCase());
    }
    return [...chars].sort();
  }
  return filtered;
}

function evalExpr(expr, varValues) {
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

  let result = e.replace(/\s/g, '');
  let safety = 0;
  while (result.length > 1 && safety < 20) {
    result = result
      .replace(/!0/g, '1')
      .replace(/!1/g, '0')
      .replace(/(\d)&(\d)/g, (_, a, b) => String(Number(a) & Number(b)))
      .replace(/(\d)\|(\d)/g, (_, a, b) => String(Number(a) | Number(b)))
      .replace(/(\d)\^(\d)/g, (_, a, b) => String(Number(a) ^ Number(b)));
    safety++;
  }
  return parseInt(result) || 0;
}

function generateTruthTable(expr, variables) {
  const rows = [];
  const n = variables.length;
  for (let i = 0; i < Math.pow(2, n); i++) {
    const varMap = {};
    const row = {};
    for (let j = 0; j < n; j++) {
      const val = (i >> (n - 1 - j)) & 1;
      varMap[variables[j]] = val;
      row[variables[j]] = val;
    }
    row.output = evalExpr(expr, varMap);
    rows.push(row);
  }
  return rows;
}

function demorganConvert(expr) {
  let result = expr;
  result = result.replace(/!\(([^)]+)\)/g, (_, inner) => {
    const parts = inner.split(/[&|]/);
    const op = inner.includes('&') ? '&' : '|';
    const newOp = op === '&' ? '|' : '&';
    return parts.map((p) => p.trim().replace(/^!(.+)$/, '$1').replace(/^(.+)$/, '!$1')).join(` ${newOp} `);
  });
  return result;
}

function BooleanAlgebra() {
  const { dark } = useTheme();
  const [expression, setExpression] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('simplify');

  const variables = useMemo(() => getVars(expression), [expression]);

  const truthTable = useMemo(() => {
    if (!expression.trim() || variables.length === 0 || variables.length > 8) return null;
    try {
      setError('');
      return generateTruthTable(expression, variables);
    } catch {
      setError('Invalid expression');
      return null;
    }
  }, [expression, variables]);

  const minterms = useMemo(() => {
    if (!truthTable) return [];
    return truthTable
      .filter((r) => r.output === 1)
      .map((r) => {
        const vals = variables.map((v) => r[v]);
        return { decimal: parseInt(vals.join(''), 2), binary: vals.join(''), vars: vals };
      });
  }, [truthTable, variables]);

  const maxterms = useMemo(() => {
    if (!truthTable) return [];
    return truthTable
      .filter((r) => r.output === 0)
      .map((r) => {
        const vals = variables.map((v) => r[v]);
        return { decimal: parseInt(vals.join(''), 2), binary: vals.join(''), vars: vals };
      });
  }, [truthTable, variables]);

  const canonicalSOP = useMemo(() => {
    if (minterms.length === 0) return '0';
    if (minterms.length === Math.pow(2, variables.length)) return '1';
    return minterms
      .map((m) =>
        variables.map((v, i) => (m.vars[i] ? v : v + "'")).join('')
      )
      .join(' + ');
  }, [minterms, variables]);

  const canonicalPOS = useMemo(() => {
    if (maxterms.length === 0) return '1';
    if (maxterms.length === Math.pow(2, variables.length)) return '0';
    return maxterms
      .map((m) =>
        '(' + variables.map((v, i) => (m.vars[i] ? v + "'" : v)).join(' + ') + ')'
      )
      .join('');
  }, [maxterms, variables]);

  const demorganResult = useMemo(() => {
    if (!expression.trim()) return '';
    return demorganConvert(expression);
  }, [expression]);

  const copyText = useCallback((text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  const tabs = [
    { id: 'simplify', label: 'Expression Info', icon: Zap },
    { id: 'truthTable', label: 'Truth Table', icon: Table2 },
    { id: 'canonical', label: 'Canonical Forms', icon: Braces },
    { id: 'demorgan', label: "DeMorgan's", icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-cyan-500/10" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">
              Boolean Algebra
            </h1>
            <p className={`text-lg ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
              Simplify expressions, generate truth tables, find canonical forms, and apply DeMorgan's theorem.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">
        {/* Expression Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}
        >
          <label className="block text-sm font-bold mb-2">Enter Boolean Expression</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={expression}
              onChange={(e) => { setExpression(e.target.value); setError(''); }}
              placeholder="e.g. A&B | !C  or  AB + A'C"
              className={`flex-1 px-4 py-3 rounded-xl border text-sm font-mono transition-all ${
                error ? 'border-red-500 ring-2 ring-red-500/20' : dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'
              }`}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Operators:</span>
            {['& or && (AND)', '| or || (OR)', '^ (XOR)', "! or ' (NOT)"].map((op) => (
              <span key={op} className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{op}</span>
            ))}
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />{error}
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        {expression.trim() && (
          <div className="flex flex-wrap gap-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : dark
                      ? 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
                      : 'bg-white/50 text-slate-500 hover:text-slate-900 border border-slate-200/50'
                }`}
              >
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>
        )}

        {/* Expression Info */}
        {activeTab === 'simplify' && expression.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}
          >
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-indigo-400" />
              Expression Analysis
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-700/30 border-slate-600/30' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`text-xs mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Variables</div>
                <div className="text-lg font-mono font-bold">{variables.length > 0 ? variables.join(', ') : 'None'}</div>
              </div>
              <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-700/30 border-slate-600/30' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`text-xs mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Minterms (Σm)</div>
                <div className="text-lg font-mono font-bold">{minterms.map((m) => m.decimal).join(', ') || '∅'}</div>
              </div>
              <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-700/30 border-slate-600/30' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`text-xs mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Maxterms (ΠM)</div>
                <div className="text-lg font-mono font-bold">{maxterms.map((m) => m.decimal).join(', ') || '∅'}</div>
              </div>
              <div className={`p-4 rounded-xl border sm:col-span-2 ${dark ? 'bg-slate-700/30 border-slate-600/30' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Canonical SOP</span>
                  <button onClick={() => copyText(canonicalSOP)} className="text-indigo-400 hover:text-indigo-300">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-sm font-mono break-all">F = {canonicalSOP}</div>
              </div>
              <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-700/30 border-slate-600/30' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`text-xs mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Combinations</div>
                <div className="text-lg font-mono font-bold">{Math.pow(2, variables.length)}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Truth Table */}
        {activeTab === 'truthTable' && truthTable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border overflow-hidden ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}
          >
            <div className={`flex items-center justify-between px-6 py-4 border-b ${dark ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Table2 className="w-5 h-5 text-indigo-400" />
                Truth Table ({truthTable.length} rows)
              </h2>
              <button
                onClick={() => copyText(truthTable.map((r) => variables.map((v) => r[v]).join('\t') + '\t' + r.output).join('\n'))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copy
              </button>
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
                    <tr
                      key={idx}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Canonical Forms */}
        {activeTab === 'canonical' && expression.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className={`rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2">
                  <Braces className="w-4 h-4 text-emerald-400" />
                  Canonical Sum of Products (SOP)
                </h3>
                <button onClick={() => copyText(canonicalSOP)} className="text-indigo-400 hover:text-indigo-300">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className={`text-sm font-mono p-3 rounded-xl ${dark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                F = {canonicalSOP}
              </p>
              <p className={`text-xs mt-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                Sum of all minterms where output = 1. Each term contains all variables.
              </p>
            </div>

            <div className={`rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2">
                  <Braces className="w-4 h-4 text-cyan-400" />
                  Canonical Product of Sums (POS)
                </h3>
                <button onClick={() => copyText(canonicalPOS)} className="text-indigo-400 hover:text-indigo-300">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className={`text-sm font-mono p-3 rounded-xl ${dark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                F = {canonicalPOS}
              </p>
              <p className={`text-xs mt-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                Product of all maxterms where output = 0. Each sum term contains all variables.
              </p>
            </div>

            <div className={`rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}>
              <h3 className="font-bold flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-amber-400" />
                Minterm & Maxterm List
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={`text-xs font-bold mb-2 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Minterms (F=1)</div>
                  {minterms.length === 0 ? (
                    <p className={`text-sm ${dark ? 'text-slate-500' : 'text-slate-400'}`}>None</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {minterms.map((m) => (
                        <span key={m.decimal} className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono">
                          m{m.decimal} ({m.binary})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold mb-2 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Maxterms (F=0)</div>
                  {maxterms.length === 0 ? (
                    <p className={`text-sm ${dark ? 'text-slate-500' : 'text-slate-400'}`}>None</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {maxterms.map((m) => (
                        <span key={m.decimal} className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-mono">
                          M{m.decimal} ({m.binary})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* DeMorgan */}
        {activeTab === 'demorgan' && expression.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}
          >
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <RefreshCw className="w-5 h-5 text-cyan-400" />
              DeMorgan's Theorem
            </h2>
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-700/30 border-slate-600/30' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`text-xs mb-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Original Expression</div>
                <p className="text-sm font-mono">{expression}</p>
              </div>
              <ArrowRight className={`w-5 h-5 mx-auto ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
              <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-700/30 border-slate-600/30' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>After DeMorgan's Conversion</span>
                  <button onClick={() => copyText(demorganResult)} className="text-indigo-400 hover:text-indigo-300">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-sm font-mono">{demorganResult}</p>
              </div>
              <div className={`p-4 rounded-xl border text-xs ${dark ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                <strong>DeMorgan's Laws:</strong><br />
                !(A & B) = !A | !B &nbsp;&nbsp;|&nbsp;&nbsp; !(A | B) = !A & !B<br />
                Converts AND to OR and vice versa when pushing a NOT through parentheses.
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!expression.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-16 ${dark ? 'text-slate-500' : 'text-slate-400'}`}
          >
            <Braces className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">Enter a Boolean expression above</p>
            <p className="text-sm">Supports AND (&), OR (|), XOR (^), NOT (!) operators</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['A&B|C', "AB+A'C", 'A^B^C', '!(A&B)|C'].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setExpression(ex)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all hover:scale-105 ${
                    dark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export { BooleanAlgebra };

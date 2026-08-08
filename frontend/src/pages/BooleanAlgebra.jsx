import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  CircuitBoard,
  ChevronDown,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { parseExpression } from '../utils/circuitEngine';
import { LogicGateDiagram } from '../components/LogicGateDiagram';

/* ───────────────────── Boolean Evaluator ───────────────────── */

function evaluateAST(node, vars) {
  if (node.type === 'VAR') return vars[node.name] ? 1 : 0;
  if (node.type === 'CONST') return parseInt(node.value, 10);
  if (node.type === 'NOT') return evaluateAST(node.arg, vars) ^ 1;
  if (node.args) {
    const a = evaluateAST(node.args[0], vars);
    const b = evaluateAST(node.args[1], vars);
    switch (node.type) {
      case 'AND': return a & b;
      case 'OR':  return a | b;
      case 'XOR': return a ^ b;
      case 'NAND': return (a & b) ^ 1;
      case 'NOR':  return (a | b) ^ 1;
      case 'XNOR': return (a ^ b) ^ 1;
      default: return 0;
    }
  }
  return 0;
}

/* ───────────────────── Variable Detection ───────────────────── */

function getVars(expr) {
  try {
    const { vars } = parseExpression(expr);
    return vars.sort();
  } catch {
    const chars = new Set();
    for (const ch of expr) {
      if (/[a-zA-Z]/.test(ch)) chars.add(ch.toUpperCase());
    }
    return [...chars].sort();
  }
}

/* ───────────────────── Truth Table Generator ───────────────────── */

function generateTruthTable(ast, variables) {
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
    row.output = evaluateAST(ast, varMap);
    rows.push(row);
  }
  return rows;
}

/* ───────────────────── Canonical Forms ───────────────────── */

function getMinterms(truthTable, variables) {
  return truthTable
    .filter((r) => r.output === 1)
    .map((r) => {
      const vals = variables.map((v) => r[v]);
      return { decimal: parseInt(vals.join(''), 2), binary: vals.join(''), vars: vals };
    });
}

function getMaxterms(truthTable, variables) {
  return truthTable
    .filter((r) => r.output === 0)
    .map((r) => {
      const vals = variables.map((v) => r[v]);
      return { decimal: parseInt(vals.join(''), 2), binary: vals.join(''), vars: vals };
    });
}

function toCanonicalSOP(minterms, variables) {
  if (minterms.length === 0) return '0';
  if (minterms.length === Math.pow(2, variables.length)) return '1';
  return minterms
    .map((m) => variables.map((v, i) => (m.vars[i] ? v : v + "'")).join(''))
    .join(' + ');
}

function toCanonicalPOS(maxterms, variables) {
  if (maxterms.length === 0) return '1';
  if (maxterms.length === Math.pow(2, variables.length)) return '0';
  return maxterms
    .map((m) => '(' + variables.map((v, i) => (m.vars[i] ? v + "'" : v)).join(' + ') + ')')
    .join('');
}

/* ───────────────────── DeMorgan ───────────────────── */

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

/* ───────────────────── Validation ───────────────────── */

function validateExpression(expr) {
  if (!expr.trim()) return 'Please enter a Boolean expression.';
  try {
    const { ast, vars } = parseExpression(expr);
    if (vars.length === 0) return 'No variables detected. Use A-Z as variable names.';
    if (vars.length > 6) return `Too many variables (${vars.length}). Maximum supported is 6.`;
    return null;
  } catch (e) {
    return e.message || 'Invalid Boolean expression. Please check your operators and parentheses.';
  }
}

/* ───────────────────── Example Expressions ───────────────────── */

const EXAMPLES = [
  { expr: 'A+B', label: 'A OR B' },
  { expr: 'A*B', label: 'A AND B' },
  { expr: 'A+B*C', label: 'A + B*C' },
  { expr: '(A+B)*C', label: '(A+B)*C' },
  { expr: "A'B+AC", label: "A'B + AC" },
  { expr: "(A+B')*(C+D)", label: "(A+B')(C+D)" },
  { expr: 'A^B', label: 'A XOR B' },
  { expr: 'A NAND B', label: 'A NAND B' },
  { expr: 'A NOR B', label: 'A NOR B' },
  { expr: 'A XNOR B', label: 'A XNOR B' },
  { expr: "A'B+AB'", label: "A'B + AB'" },
  { expr: "A'B'C+ABC'", label: "A'B'C + ABC'" },
  { expr: '(A+B)*(C+D)', label: '(A+B)(C+D)' },
  { expr: "A'+B'+C'+D'", label: "A'+B'+C'+D'" },
];

/* ═══════════════════ Main Component ═══════════════════ */

function BooleanAlgebra() {
  const { dark } = useTheme();
  const [expression, setExpression] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('simplify');
  const [showExamples, setShowExamples] = useState(false);
  const [circuitGenerated, setCircuitGenerated] = useState(false);
  const [circuitExpr, setCircuitExpr] = useState('');

  /* ── Parse expression into AST ── */
  const parsed = useMemo(() => {
    if (!expression.trim()) return null;
    try {
      setError('');
      const result = parseExpression(expression);
      return result;
    } catch (e) {
      setError(e.message || 'Invalid expression');
      return null;
    }
  }, [expression]);

  const variables = useMemo(() => {
    if (parsed) return parsed.vars.sort();
    return getVars(expression);
  }, [parsed, expression]);

  /* ── Generate truth table from AST ── */
  const truthTable = useMemo(() => {
    if (!parsed || variables.length === 0 || variables.length > 6) return null;
    try {
      return generateTruthTable(parsed.ast, variables);
    } catch {
      return null;
    }
  }, [parsed, variables]);

  /* ── Compute minterms, maxterms, canonical forms ── */
  const minterms = useMemo(() => truthTable ? getMinterms(truthTable, variables) : [], [truthTable, variables]);
  const maxterms = useMemo(() => truthTable ? getMaxterms(truthTable, variables) : [], [truthTable, variables]);
  const canonicalSOP = useMemo(() => toCanonicalSOP(minterms, variables), [minterms, variables]);
  const canonicalPOS = useMemo(() => toCanonicalPOS(maxterms, variables), [maxterms, variables]);
  const demorganResult = useMemo(() => expression.trim() ? demorganConvert(expression) : '', [expression]);

  /* ── Circuit generation ── */
  const handleGenerateCircuit = useCallback(() => {
    const err = validateExpression(expression);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setCircuitExpr(expression);
    setCircuitGenerated(true);
    setActiveTab('circuit');
  }, [expression]);

  const handleResetCircuit = useCallback(() => {
    setCircuitGenerated(false);
    setCircuitExpr('');
    setActiveTab('simplify');
  }, []);

  /* ── Helpers ── */
  const copyText = useCallback((text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  const loadExample = useCallback((ex) => {
    setExpression(ex);
    setError('');
    setCircuitGenerated(false);
    setCircuitExpr('');
    setShowExamples(false);
  }, []);

  /* ── Tabs ── */
  const tabs = [
    { id: 'simplify', label: 'Expression Info', icon: Zap },
    { id: 'truthTable', label: 'Truth Table', icon: Table2 },
    { id: 'circuit', label: 'Logic Circuit', icon: CircuitBoard },
    { id: 'canonical', label: 'Canonical Forms', icon: Braces },
    { id: 'demorgan', label: "DeMorgan's", icon: RefreshCw },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-cyan-500/10" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">
              Boolean Algebra
            </h1>
            <p className={`text-lg ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
              Enter a Boolean expression to generate truth tables, logic circuits, canonical forms, and more.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">

        {/* ── Expression Input ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}
        >
          <label className="block text-sm font-bold mb-2">Enter Boolean Expression</label>
          <div className="flex gap-3 flex-col sm:flex-row">
            <input
              type="text"
              value={expression}
              onChange={(e) => { setExpression(e.target.value); setError(''); setCircuitGenerated(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && expression.trim()) handleGenerateCircuit(); }}
              placeholder="e.g. A+B*C  or  A'B+AC  or  (A+B')*(C+D)"
              className={`flex-1 px-4 py-3 rounded-xl border text-sm font-mono transition-all ${
                error ? 'border-red-500 ring-2 ring-red-500/20' : dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'
              }`}
            />
            <div className="flex gap-2">
              <button
                onClick={handleGenerateCircuit}
                disabled={!expression.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-glow-primary transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                Generate Circuit
              </button>
              {circuitGenerated && (
                <button
                  onClick={handleResetCircuit}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
                    dark ? 'bg-slate-700 border-slate-600 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Operator Reference */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Operators:</span>
            {['& · * (AND)', '| + (OR)', '^ (XOR)', "! ' ~ (NOT)", 'NAND', 'NOR', 'XNOR'].map((op) => (
              <span key={op} className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{op}</span>
            ))}
          </div>

          {/* Examples Dropdown */}
          <div className="mt-3">
            <button
              onClick={() => setShowExamples(!showExamples)}
              className={`flex items-center gap-2 text-xs font-semibold transition-all ${
                dark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'
              }`}
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExamples ? 'rotate-180' : ''}`} />
              Example Expressions
            </button>
            <AnimatePresence>
              {showExamples && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 mt-3">
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex.expr}
                        onClick={() => loadExample(ex.expr)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all hover:scale-105 ${
                          dark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-400'
                        }`}
                        title={ex.label}
                      >
                        {ex.expr}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </motion.div>

        {/* ── Tabs ── */}
        {expression.trim() && (
          <div className="flex flex-wrap gap-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  if (id === 'circuit') {
                    handleGenerateCircuit();
                  } else {
                    setActiveTab(id);
                  }
                }}
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

        {/* ── Tab: Expression Info ── */}
        {activeTab === 'simplify' && expression.trim() && parsed && (
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

        {/* ── Tab: Truth Table ── */}
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

        {/* ── Tab: Logic Circuit ── */}
        {activeTab === 'circuit' && circuitGenerated && circuitExpr && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <LogicGateDiagram expression={circuitExpr} varNames={variables} />
          </motion.div>
        )}

        {/* ── Tab: Canonical Forms ── */}
        {activeTab === 'canonical' && expression.trim() && parsed && (
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

        {/* ── Tab: DeMorgan ── */}
        {activeTab === 'demorgan' && expression.trim() && parsed && (
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

        {/* ── Empty State ── */}
        {!expression.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-16 ${dark ? 'text-slate-500' : 'text-slate-400'}`}
          >
            <Braces className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">Enter a Boolean expression above</p>
            <p className="text-sm">Supports AND, OR, XOR, NOT, NAND, NOR, XNOR operators</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['A+B', 'A*B', "A'B+AC", '(A+B)*C', 'A^B', 'A NAND B'].map((ex) => (
                <button
                  key={ex}
                  onClick={() => loadExample(ex)}
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

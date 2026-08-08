import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ToggleLeft,
  ToggleRight,
  Lightbulb,
  Trash2,
  Plus,
  Zap,
  Copy,
  Check,
  RotateCcw,
  Info,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const GATE_TYPES = [
  { id: 'AND', label: 'AND', inputs: 2, fn: (a, b) => a & b, symbol: '&' },
  { id: 'OR', label: 'OR', inputs: 2, fn: (a, b) => a | b, symbol: '≥1' },
  { id: 'NOT', label: 'NOT', inputs: 1, fn: (a) => a ^ 1, symbol: '1' },
  { id: 'NAND', label: 'NAND', inputs: 2, fn: (a, b) => (a & b) ^ 1, symbol: '&' },
  { id: 'NOR', label: 'NOR', inputs: 2, fn: (a, b) => (a | b) ^ 1, symbol: '≥1' },
  { id: 'XOR', label: 'XOR', inputs: 2, fn: (a, b) => a ^ b, symbol: '=1' },
  { id: 'XNOR', label: 'XNOR', inputs: 2, fn: (a, b) => (a ^ b) ^ 1, symbol: '=1' },
  { id: 'BUFFER', label: 'BUFFER', inputs: 1, fn: (a) => a, symbol: '1' },
];

const GATE_COLORS = {
  AND: '#6366f1',
  OR: '#8b5cf6',
  NOT: '#ef4444',
  NAND: '#f59e0b',
  NOR: '#10b981',
  XOR: '#ec4899',
  XNOR: '#06b6d4',
  BUFFER: '#64748b',
};

let gateIdCounter = 0;

function createGate(type) {
  const def = GATE_TYPES.find((g) => g.id === type);
  return {
    id: `gate_${++gateIdCounter}`,
    type: def.id,
    inputs: def.inputs,
    fn: def.fn,
    inputValues: def.inputs === 1 ? [0] : [0, 0],
    output: 0,
    x: 0,
    y: 0,
  };
}

function GateNode({ gate, onToggleInput, onRemove, dark }) {
  const color = GATE_COLORS[gate.type];
  const def = GATE_TYPES.find((g) => g.id === gate.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${dark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/80 border-slate-200/50'}`}
      style={{ borderColor: `${color}40` }}
    >
      {/* Gate Label */}
      <div
        className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 text-white"
        style={{ backgroundColor: color }}
      >
        {gate.type}
      </div>

      {/* Gate Symbol Box */}
      <div
        className="w-20 h-14 rounded-xl flex items-center justify-center text-white font-mono text-lg font-bold border-2 mb-2"
        style={{ backgroundColor: `${color}20`, borderColor: color }}
      >
        {def.symbol}
      </div>

      {/* Input Toggles */}
      <div className="flex space-x-3 mb-2">
        {gate.inputValues.map((val, idx) => (
          <button
            key={idx}
            onClick={() => onToggleInput(gate.id, idx)}
            className={`flex flex-col items-center space-y-1 px-2 py-1 rounded-lg transition-all ${
              val
                ? 'bg-emerald-500/20 text-emerald-400'
                : dark
                  ? 'bg-slate-700/50 text-slate-400'
                  : 'bg-slate-200/50 text-slate-500'
            }`}
          >
            <span className="text-[10px] font-mono">{String.fromCharCode(65 + idx)}</span>
            {val ? (
              <ToggleRight className="w-5 h-5" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
          </button>
        ))}
      </div>

      {/* Output LED */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-mono mb-1">OUT</span>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            gate.output
              ? 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
              : dark
                ? 'border-slate-600 bg-slate-800'
                : 'border-slate-300 bg-slate-100'
          }`}
          style={gate.output ? { backgroundColor: '#fbbf24' } : {}}
        >
          <Lightbulb
            className={`w-3 h-3 ${gate.output ? 'text-amber-900' : dark ? 'text-slate-600' : 'text-slate-400'}`}
          />
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(gate.id)}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
      >
        ×
      </button>
    </motion.div>
  );
}

function TruthTablePanel({ gates, inputs, dark }) {
  const table = useMemo(() => {
    if (inputs.length === 0) return [];
    const rows = [];
    const n = inputs.length;
    const numRows = Math.pow(2, n);

    for (let i = 0; i < numRows; i++) {
      const row = {};
      for (let j = 0; j < n; j++) {
        row[inputs[j].name] = (i >> (n - 1 - j)) & 1;
      }
      rows.push(row);
    }
    return rows;
  }, [inputs]);

  if (inputs.length === 0 || gates.length === 0) return null;

  return (
    <div className={`rounded-2xl border overflow-hidden ${dark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/80 border-slate-200/50'}`}>
      <div className={`px-4 py-3 border-b ${dark ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
        <h3 className="text-sm font-bold">Live Truth Table</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className={dark ? 'bg-slate-700/50' : 'bg-slate-100'}>
              {inputs.map((inp) => (
                <th key={inp.name} className="px-3 py-2 text-left font-bold">{inp.name}</th>
              ))}
              {gates.map((g) => (
                <th key={g.id} className="px-3 py-2 text-left font-bold" style={{ color: GATE_COLORS[g.type] }}>
                  {g.type}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.map((row, idx) => (
              <tr key={idx} className={`border-t ${dark ? 'border-slate-700/30' : 'border-slate-200/30'}`}>
                {inputs.map((inp) => (
                  <td key={inp.name} className="px-3 py-1.5 font-mono">{row[inp.name]}</td>
                ))}
                {gates.map((g) => {
                  const inputVals = g.inputValues;
                  const output = g.fn(...inputVals);
                  return (
                    <td key={g.id} className="px-3 py-1.5 font-mono" style={{ color: GATE_COLORS[g.type] }}>
                      {output}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LogicGateSimulator() {
  const { dark } = useTheme();
  const [gates, setGates] = useState([]);
  const [inputCount, setInputCount] = useState(2);
  const [copied, setCopied] = useState(false);

  const inputs = useMemo(
    () => Array.from({ length: inputCount }, (_, i) => ({ name: String.fromCharCode(65 + i), value: 0 })),
    [inputCount]
  );

  const addGate = useCallback((type) => {
    setGates((prev) => [...prev, createGate(type)]);
  }, []);

  const removeGate = useCallback((id) => {
    setGates((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const toggleInput = useCallback((gateId, inputIdx) => {
    setGates((prev) =>
      prev.map((g) => {
        if (g.id !== gateId) return g;
        const newInputs = [...g.inputValues];
        newInputs[inputIdx] = newInputs[inputIdx] ^ 1;
        return { ...g, inputValues: newInputs, output: g.fn(...newInputs) };
      })
    );
  }, []);

  const clearAll = useCallback(() => {
    setGates([]);
  }, []);

  const copyTable = useCallback(() => {
    if (gates.length === 0) return;
    let text = inputs.map((i) => i.name).join('\t') + '\t' + gates.map((g) => g.type).join('\t') + '\n';
    const n = inputs.length;
    const numRows = Math.pow(2, n);
    for (let i = 0; i < numRows; i++) {
      const row = [];
      for (let j = 0; j < n; j++) row.push((i >> (n - 1 - j)) & 1);
      text += row.join('\t') + '\t';
      text += gates.map((g) => {
        const inputVals = g.inputValues;
        return g.fn(...inputVals);
      }).join('\t');
      text += '\n';
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [gates, inputs]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-cyan-500/10" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">
              Logic Gate Simulator
            </h1>
            <p className={`text-lg ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
              Build circuits with AND, OR, NOT, XOR, NAND, NOR, XNOR gates. Toggle inputs and see outputs update live.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">
        {/* Gate Palette */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              Add Gates
            </h2>
            <div className="flex items-center gap-2">
              <label className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Inputs:</label>
              <select
                value={inputCount}
                onChange={(e) => setInputCount(Number(e.target.value))}
                className={`px-3 py-1.5 rounded-lg text-sm border ${dark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'}`}
              >
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n} Inputs</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {GATE_TYPES.map((gate) => (
              <button
                key={gate.id}
                onClick={() => addGate(gate.id)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all hover:scale-105 active:scale-95"
                style={{
                  borderColor: `${GATE_COLORS[gate.id]}40`,
                  backgroundColor: `${GATE_COLORS[gate.id]}10`,
                }}
              >
                <div
                  className="w-10 h-8 rounded-lg flex items-center justify-center text-white font-mono text-xs font-bold"
                  style={{ backgroundColor: GATE_COLORS[gate.id] }}
                >
                  {gate.symbol}
                </div>
                <span className="text-xs font-medium">{gate.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Circuit Canvas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Circuit ({gates.length} gate{gates.length !== 1 ? 's' : ''})
            </h2>
            <div className="flex gap-2">
              {gates.length > 0 && (
                <>
                  <button
                    onClick={copyTable}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Table'}
                  </button>
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {gates.length === 0 ? (
            <div className={`text-center py-16 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
              <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Click a gate above to add it to the circuit</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <AnimatePresence>
                {gates.map((gate) => (
                  <GateNode
                    key={gate.id}
                    gate={gate}
                    onToggleInput={toggleInput}
                    onRemove={removeGate}
                    dark={dark}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Truth Table */}
        <TruthTablePanel gates={gates} inputs={inputs} dark={dark} />

        {/* Educational Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}
        >
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-cyan-400" />
            Gate Reference
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GATE_TYPES.map((gate) => (
              <div
                key={gate.id}
                className={`p-3 rounded-xl border ${dark ? 'bg-slate-700/30 border-slate-600/30' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-mono font-bold"
                    style={{ backgroundColor: GATE_COLORS[gate.id] }}
                  >
                    {gate.symbol}
                  </div>
                  <span className="font-bold text-sm">{gate.label}</span>
                </div>
                <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {gate.id === 'AND' && 'Output is 1 only when ALL inputs are 1.'}
                  {gate.id === 'OR' && 'Output is 1 when ANY input is 1.'}
                  {gate.id === 'NOT' && 'Inverts the input signal.'}
                  {gate.id === 'NAND' && 'AND followed by NOT. Universal gate.'}
                  {gate.id === 'NOR' && 'OR followed by NOT. Universal gate.'}
                  {gate.id === 'XOR' && 'Output is 1 when inputs are different.'}
                  {gate.id === 'XNOR' && 'Output is 1 when inputs are equal.'}
                  {gate.id === 'BUFFER' && 'Passes input to output unchanged.'}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

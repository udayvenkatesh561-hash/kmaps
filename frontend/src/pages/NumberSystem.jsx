import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight,
  Binary,
  Hash,
  Text,
  Calculator,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  FlipHorizontal,
  Code,
  Grid,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const TABS = [
  { id: 'base', label: 'Base Converter', icon: ArrowLeftRight },
  { id: 'arithmetic', label: 'Binary Arithmetic', icon: Calculator },
  { id: 'ones', label: "1's Complement", icon: FlipHorizontal },
  { id: 'twos', label: "2's Complement", icon: FlipHorizontal },
  { id: 'gray', label: 'Gray Code', icon: Grid },
  { id: 'binGray', label: 'Binary ↔ Gray', icon: ArrowLeftRight },
  { id: 'bcd', label: 'BCD Converter', icon: Hash },
  { id: 'excess3', label: 'Excess-3', icon: Hash },
  { id: 'ascii', label: 'ASCII', icon: Text },
  { id: 'ieee', label: 'IEEE-754', icon: Binary },
];

function CopyButton({ text, dark }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-lg transition-all ${dark ? 'hover:bg-slate-700 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function Field({ label, value, onChange, readOnly, placeholder, error, dark, onCopy, suffix }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
        {onCopy && <CopyButton text={value} dark={dark} />}
      </div>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono transition-all focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${dark ? 'bg-slate-900/90 border-slate-800 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
        />
        {suffix && (
          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{suffix}</span>
        )}
      </div>
      {error && (
        <p className="text-[11px] text-red-400 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

// ── Tab 1: Base Converter ──
function BaseConverter({ dark }) {
  const [dec, setDec] = useState('');
  const [bin, setBin] = useState('');
  const [oct, setOct] = useState('');
  const [hex, setHex] = useState('');
  const [activeField, setActiveField] = useState(null);
  const [error, setError] = useState('');

  const convert = useCallback((val, from) => {
    setError('');
    if (!val.trim()) {
      setDec(''); setBin(''); setOct(''); setHex('');
      return;
    }
    let num;
    try {
      switch (from) {
        case 'dec': num = parseInt(val, 10); break;
        case 'bin': num = parseInt(val, 2); break;
        case 'oct': num = parseInt(val, 8); break;
        case 'hex': num = parseInt(val, 16); break;
        default: return;
      }
      if (isNaN(num) || num < 0) { setError('Invalid number for this base'); return; }
      if (num > 0xFFFFFFFF) { setError('Number too large (max 2^32 - 1)'); return; }
      if (from !== 'dec') setDec(num.toString(10));
      if (from !== 'bin') setBin(num.toString(2));
      if (from !== 'oct') setOct(num.toString(8));
      if (from !== 'hex') setHex(num.toString(16).toUpperCase());
    } catch { setError('Invalid input'); }
  }, []);

  const handleChange = (val, field) => {
    setActiveField(field);
    switch (field) {
      case 'dec': setDec(val); convert(val, 'dec'); break;
      case 'bin': setBin(val); convert(val, 'bin'); break;
      case 'oct': setOct(val); convert(val, 'oct'); break;
      case 'hex': setHex(val); convert(val, 'hex'); break;
    }
  };

  const clear = () => { setDec(''); setBin(''); setOct(''); setHex(''); setError(''); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Decimal (Base 10)" value={dec} onChange={(v) => handleChange(v, 'dec')} placeholder="e.g. 25" error={error && activeField === 'dec' ? error : ''} dark={dark} onCopy={dec} suffix="DEC" />
        <Field label="Binary (Base 2)" value={bin} onChange={(v) => handleChange(v, 'bin')} placeholder="e.g. 11001" error={error && activeField === 'bin' ? error : ''} dark={dark} onCopy={bin} suffix="BIN" />
        <Field label="Octal (Base 8)" value={oct} onChange={(v) => handleChange(v, 'oct')} placeholder="e.g. 31" error={error && activeField === 'oct' ? error : ''} dark={dark} onCopy={oct} suffix="OCT" />
        <Field label="Hexadecimal (Base 16)" value={hex} onChange={(v) => handleChange(v, 'hex')} placeholder="e.g. 19" error={error && activeField === 'hex' ? error : ''} dark={dark} onCopy={hex} suffix="HEX" />
      </div>
      <button onClick={clear} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${dark ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/80' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}>
        <Trash2 className="w-3.5 h-3.5" />
        <span>Clear All</span>
      </button>
    </div>
  );
}

// ── Tab 2: Binary Arithmetic ──
function BinaryArithmetic({ dark }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [op, setOp] = useState('+');
  const [signed, setSigned] = useState(false);
  const [bits, setBits] = useState(8);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);

  const compute = () => {
    setError('');
    setDetails(null);
    if (!a.trim() || !b.trim()) { setResult(''); return; }
    if (!/^[01]+$/.test(a) || !/^[01]+$/.test(b)) { setError('Invalid binary input'); setResult(''); return; }
    
    let na, nb;
    if (signed) {
      const toSigned = (bin, w) => {
        const padded = bin.padStart(w, '0').slice(-w);
        return padded[0] === '1' ? -(Math.pow(2, w - 1) - parseInt(padded.slice(1), 2)) : parseInt(padded, 2);
      };
      na = toSigned(a, bits);
      nb = toSigned(b, bits);
    } else {
      na = parseInt(a, 2);
      nb = parseInt(b, 2);
    }

    if (isNaN(na) || isNaN(nb)) { setError('Invalid binary input'); setResult(''); return; }
    
    let r, carry = 0, borrow = 0, overflow = false;
    switch (op) {
      case '+': r = na + nb; break;
      case '-': r = na - nb; break;
      case '*': r = na * nb; break;
      case '/': if (nb === 0) { setError('Division by zero'); setResult(''); return; } r = Math.floor(na / nb); break;
      default: return;
    }

    if (signed) {
      const min = -Math.pow(2, bits - 1);
      const max = Math.pow(2, bits - 1) - 1;
      overflow = r < min || r > max;
      if (op === '+') carry = (na + nb) >= Math.pow(2, bits) ? 1 : 0;
      if (op === '-') borrow = na < nb ? 1 : 0;
    } else {
      carry = (na + nb) >= Math.pow(2, bits) ? 1 : 0;
      borrow = na < nb ? 1 : 0;
    }

    let binResult;
    if (signed && r < 0) {
      const absR = Math.abs(r);
      binResult = (Math.pow(2, bits) - absR).toString(2).padStart(bits, '0');
    } else {
      binResult = r.toString(2);
    }

    setResult(binResult);
    setDetails({
      decA: na, decB: nb, decResult: r,
      carry, borrow, overflow,
      aBin: a.padStart(bits, '0').slice(-bits),
      bBin: b.padStart(bits, '0').slice(-bits),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1.5">
          <label className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Mode</label>
          <div className="flex gap-1">
            <button onClick={() => setSigned(false)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!signed ? 'bg-indigo-600 text-white' : dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>Unsigned</button>
            <button onClick={() => setSigned(true)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${signed ? 'bg-indigo-600 text-white' : dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>Signed</button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Bit Width</label>
          <div className="flex gap-1">
            {[4, 8, 16, 32].map((n) => (
              <button key={n} onClick={() => setBits(n)} className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${bits === n ? 'bg-indigo-600 text-white' : dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{n}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <Field label="Operand A (Binary)" value={a} onChange={setA} placeholder="e.g. 1101" dark={dark} />
        <div className="space-y-1.5">
          <label className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Operation</label>
          <div className="flex gap-1">
            {['+', '-', '*', '/'].map((o) => (
              <button key={o} onClick={() => setOp(o)} className={`flex-1 py-2.5 rounded-lg font-mono font-bold text-sm transition-all ${op === o ? 'bg-indigo-600 text-white shadow-md' : dark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'}`}>{o}</button>
            ))}
          </div>
        </div>
        <Field label="Operand B (Binary)" value={b} onChange={setB} placeholder="e.g. 1010" dark={dark} />
      </div>
      <button onClick={compute} className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-glow-primary transition-all hover:scale-[1.02]">
        <Calculator className="w-4 h-4" />
        <span>Calculate</span>
      </button>
      {error && <p className="text-xs text-red-400 flex items-center space-x-1"><AlertCircle className="w-3 h-3" /><span>{error}</span></p>}
      {result && details && (
        <div className={`p-4 rounded-xl border space-y-3 ${dark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold uppercase ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Result (Binary)</span>
            <CopyButton text={result} dark={dark} />
          </div>
          <p className="text-lg font-mono font-bold text-indigo-400">{result}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className={`p-2 rounded-lg ${dark ? 'bg-slate-700/30' : 'bg-white'}`}>
              <span className={`block ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Decimal</span>
              <span className="font-bold">{details.decResult}</span>
            </div>
            <div className={`p-2 rounded-lg ${dark ? 'bg-slate-700/30' : 'bg-white'}`}>
              <span className={`block ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Carry</span>
              <span className={`font-bold ${details.carry ? 'text-amber-400' : ''}`}>{details.carry}</span>
            </div>
            <div className={`p-2 rounded-lg ${dark ? 'bg-slate-700/30' : 'bg-white'}`}>
              <span className={`block ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Borrow</span>
              <span className={`font-bold ${details.borrow ? 'text-red-400' : ''}`}>{details.borrow}</span>
            </div>
            {signed && (
              <div className={`p-2 rounded-lg ${dark ? 'bg-slate-700/30' : 'bg-white'}`}>
                <span className={`block ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Overflow</span>
                <span className={`font-bold ${details.overflow ? 'text-red-400' : 'text-emerald-400'}`}>{details.overflow ? 'Yes' : 'No'}</span>
              </div>
            )}
          </div>
          <div className={`px-3 py-2 rounded-lg text-xs ${dark ? 'bg-slate-800/50 text-slate-400' : 'bg-white text-slate-500'}`}>
            <span className="font-mono">{details.aBin} {op} {details.bBin} = {result}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 3: 1's Complement ──
function OnesComplement({ dark }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');

  const convert = (val) => {
    setInput(val);
    if (!val.trim() || !/^[01]+$/.test(val)) { setResult(''); return; }
    setResult(val.split('').map(b => b === '0' ? '1' : '0').join(''));
  };

  return (
    <div className="space-y-4">
      <Field label="Binary Input" value={input} onChange={convert} placeholder="e.g. 1101" dark={dark} onCopy={input} />
      {result && (
        <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold uppercase ${dark ? 'text-slate-400' : 'text-slate-500'}`}>1's Complement</span>
            <CopyButton text={result} dark={dark} />
          </div>
          <p className="text-lg font-mono font-bold text-indigo-400">{result}</p>
        </div>
      )}
    </div>
  );
}

// ── Tab 4: 2's Complement ──
function TwosComplement({ dark }) {
  const [input, setInput] = useState('');
  const [bits, setBits] = useState(8);
  const [result, setResult] = useState('');

  const convert = (val) => {
    setInput(val);
    if (!val.trim() || !/^[01]+$/.test(val)) { setResult(''); return; }
    const ones = val.split('').map(b => b === '0' ? '1' : '0').join('');
    const num = parseInt(ones, 2) + 1;
    const bin = num.toString(2);
    setResult(bin.padStart(Math.max(bits, bin.length), '0').slice(-bits));
  };

  return (
    <div className="space-y-4">
      <Field label="Binary Input" value={input} onChange={convert} placeholder="e.g. 1101" dark={dark} onCopy={input} />
      <div className="space-y-1.5">
        <label className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Bit Width</label>
        <div className="flex gap-1">
          {[4, 8, 16, 32].map((n) => (
            <button key={n} onClick={() => { setBits(n); convert(input); }} className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${bits === n ? 'bg-indigo-600 text-white' : dark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'}`}>{n}-bit</button>
          ))}
        </div>
      </div>
      {result && (
        <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold uppercase ${dark ? 'text-slate-400' : 'text-slate-500'}`}>2's Complement ({bits}-bit)</span>
            <CopyButton text={result} dark={dark} />
          </div>
          <p className="text-lg font-mono font-bold text-indigo-400">{result}</p>
          <p className={`text-xs mt-1 font-mono ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Decimal: -{parseInt(input, 2)}</p>
        </div>
      )}
    </div>
  );
}

// ── Tab 5: Gray Code ──
function GrayCode({ dark }) {
  const [dec, setDec] = useState('');
  const [gray, setGray] = useState('');
  const [bits, setBits] = useState(4);

  const toGray = (val) => {
    setDec(val);
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 0) { setGray(''); return; }
    const bin = n.toString(2).padStart(bits, '0');
    const g = bin[0] + bin.slice(1).map((b, i) => bin[i] === '1' ? (bin[i + 1] === '1' ? '0' : '1') : bin[i + 1]).join('');
    setGray(g);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Decimal" value={dec} onChange={toGray} placeholder="e.g. 5" dark={dark} onCopy={dec} />
        <div className="space-y-1.5">
          <label className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Bit Width</label>
          <div className="flex gap-1">
            {[3, 4, 5, 6, 8].map((n) => (
              <button key={n} onClick={() => { setBits(n); toGray(dec); }} className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${bits === n ? 'bg-indigo-600 text-white' : dark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900'}`}>{n}</button>
            ))}
          </div>
        </div>
      </div>
      {gray && (
        <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold uppercase ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Gray Code ({bits}-bit)</span>
            <CopyButton text={gray} dark={dark} />
          </div>
          <p className="text-lg font-mono font-bold text-indigo-400">{gray}</p>
        </div>
      )}
    </div>
  );
}

// ── Tab 6: Binary ↔ Gray ──
function BinGray({ dark }) {
  const [mode, setMode] = useState('bin2gray');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [steps, setSteps] = useState([]);

  const convert = (val) => {
    setInput(val);
    if (!val.trim() || !/^[01]+$/.test(val)) { setResult(''); setSteps([]); return; }
    if (mode === 'bin2gray') {
      const g = [val[0]];
      const stepList = [`G[0] = B[0] = ${val[0]}`];
      for (let i = 1; i < val.length; i++) {
        const bit = val[i - 1] === val[i] ? '0' : '1';
        g.push(bit);
        stepList.push(`G[${i}] = B[${i - 1}] XOR B[${i}] = ${val[i - 1]} XOR ${val[i]} = ${bit}`);
      }
      setResult(g.join(''));
      setSteps(stepList);
    } else {
      let bin = val[0];
      const stepList = [`B[0] = G[0] = ${val[0]}`];
      for (let i = 1; i < val.length; i++) {
        const bit = bin[i - 1] === val[i] ? '0' : '1';
        bin += bit;
        stepList.push(`B[${i}] = B[${i - 1}] XOR G[${i}] = ${bin[i - 1]} XOR ${val[i]} = ${bit}`);
      }
      setResult(bin);
      setSteps(stepList);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
        <button onClick={() => { setMode('bin2gray'); convert(input); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'bin2gray' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Binary → Gray</button>
        <button onClick={() => { setMode('gray2bin'); convert(input); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'gray2bin' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Gray → Binary</button>
      </div>
      <Field label={mode === 'bin2gray' ? 'Binary Input' : 'Gray Code Input'} value={input} onChange={convert} placeholder="e.g. 1011" dark={dark} onCopy={input} />
      {result && (
        <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold uppercase ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{mode === 'bin2gray' ? 'Gray Code' : 'Binary'}</span>
            <CopyButton text={result} dark={dark} />
          </div>
          <p className="text-lg font-mono font-bold text-indigo-400">{result}</p>
        </div>
      )}
      {steps.length > 0 && (
        <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-50 border-slate-200'}`}>
          <h4 className={`text-xs font-bold mb-3 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>Step-by-Step Calculation</h4>
          <div className="space-y-1">
            {steps.map((step, i) => (
              <div key={i} className={`text-xs font-mono px-3 py-1.5 rounded-lg ${dark ? 'bg-slate-700/30' : 'bg-white'}`}>
                <span className={`text-slate-500 mr-2`}>{i + 1}.</span>{step}
              </div>
            ))}
          </div>
          <div className={`mt-3 px-3 py-2 rounded-lg text-xs ${dark ? 'bg-indigo-500/5 border border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border border-indigo-200 text-indigo-700'}`}>
            <strong>Formula:</strong> {mode === 'bin2gray' ? 'G[i] = B[i] XOR B[i+1]' : 'B[i] = B[i-1] XOR G[i]'}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 7: BCD ──
function BCDConverter({ dark }) {
  const [mode, setMode] = useState('dec2bcd');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');

  const convert = (val) => {
    setInput(val);
    if (!val.trim()) { setResult(''); return; }
    if (mode === 'dec2bcd') {
      const n = parseInt(val, 10);
      if (isNaN(n) || n < 0) { setResult(''); return; }
      setResult(n.toString().split('').map(d => parseInt(d).toString(2).padStart(4, '0')).join(' '));
    } else {
      const digits = val.trim().split(/\s+/);
      const dec = digits.map(d => parseInt(d, 2)).join('');
      setResult(dec);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
        <button onClick={() => { setMode('dec2bcd'); convert(input); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'dec2bcd' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Decimal → BCD</button>
        <button onClick={() => { setMode('bcd2dec'); convert(input); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'bcd2dec' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>BCD → Decimal</button>
      </div>
      <Field label={mode === 'dec2bcd' ? 'Decimal Input' : 'BCD Input (space-separated 4-bit groups)'} value={input} onChange={convert} placeholder={mode === 'dec2bcd' ? 'e.g. 25' : 'e.g. 0010 0101'} dark={dark} onCopy={input} />
      {result && (
        <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold uppercase ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{mode === 'dec2bcd' ? 'BCD' : 'Decimal'}</span>
            <CopyButton text={result} dark={dark} />
          </div>
          <p className="text-lg font-mono font-bold text-indigo-400">{result}</p>
        </div>
      )}
    </div>
  );
}

// ── Tab 8: Excess-3 ──
function Excess3Converter({ dark }) {
  const [mode, setMode] = useState('dec2ex3');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');

  const convert = (val) => {
    setInput(val);
    if (!val.trim()) { setResult(''); return; }
    if (mode === 'dec2ex3') {
      const n = parseInt(val, 10);
      if (isNaN(n) || n < 0) { setResult(''); return; }
      setResult(n.toString().split('').map(d => (parseInt(d) + 3).toString(2).padStart(4, '0')).join(' '));
    } else {
      const digits = val.trim().split(/\s+/);
      const dec = digits.map(d => (parseInt(d, 2) - 3).toString()).join('');
      setResult(dec);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
        <button onClick={() => { setMode('dec2ex3'); convert(input); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'dec2ex3' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Decimal → Excess-3</button>
        <button onClick={() => { setMode('ex32dec'); convert(input); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'ex32dec' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Excess-3 → Decimal</button>
      </div>
      <Field label={mode === 'dec2ex3' ? 'Decimal Input' : 'Excess-3 Input (space-separated 4-bit groups)'} value={input} onChange={convert} placeholder={mode === 'dec2ex3' ? 'e.g. 25' : 'e.g. 0101 1000'} dark={dark} onCopy={input} />
      {result && (
        <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold uppercase ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{mode === 'dec2ex3' ? 'Excess-3' : 'Decimal'}</span>
            <CopyButton text={result} dark={dark} />
          </div>
          <p className="text-lg font-mono font-bold text-indigo-400">{result}</p>
        </div>
      )}
    </div>
  );
}

// ── Tab 9: ASCII ──
function ASCIIConverter({ dark }) {
  const [mode, setMode] = useState('char2ascii');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const convert = (val) => {
    setInput(val);
    setError('');
    if (!val.trim()) { setResult(''); return; }
    if (mode === 'char2ascii') {
      if (val.length > 1) { setError('Enter a single character'); setResult(''); return; }
      setResult(val.charCodeAt(0).toString());
    } else {
      const n = parseInt(val, 10);
      if (isNaN(n) || n < 0 || n > 127) { setError('Enter a valid ASCII code (0-127)'); setResult(''); return; }
      setResult(String.fromCharCode(n));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
        <button onClick={() => { setMode('char2ascii'); convert(input); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'char2ascii' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Character → ASCII</button>
        <button onClick={() => { setMode('ascii2char'); convert(input); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'ascii2char' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>ASCII → Character</button>
      </div>
      <Field label={mode === 'char2ascii' ? 'Character Input' : 'ASCII Code Input'} value={input} onChange={convert} placeholder={mode === 'char2ascii' ? 'e.g. A' : 'e.g. 65'} error={error} dark={dark} onCopy={input} />
      {result && (
        <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold uppercase ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{mode === 'char2ascii' ? 'ASCII Code' : 'Character'}</span>
            <CopyButton text={result} dark={dark} />
          </div>
          <p className="text-lg font-mono font-bold text-indigo-400">{result}</p>
          {mode === 'char2ascii' && <p className={`text-xs mt-1 font-mono ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Binary: {parseInt(result).toString(2).padStart(8, '0')}</p>}
        </div>
      )}
    </div>
  );
}

// ── Tab 10: IEEE-754 ──
function IEEEConverter({ dark }) {
  const [mode, setMode] = useState('dec2ieee');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const convert = (val) => {
    setInput(val);
    setError('');
    if (!val.trim()) { setResult(''); return; }
    if (mode === 'dec2ieee') {
      const n = parseFloat(val);
      if (isNaN(n)) { setError('Invalid number'); setResult(''); return; }
      const buf = new ArrayBuffer(4);
      new Float32Array(buf)[0] = n;
      const bits = new Uint32Array(buf)[0];
      const sign = (bits >> 31) & 1;
      const exp = ((bits >> 23) & 0xFF).toString(2).padStart(8, '0');
      const mantissa = (bits & 0x7FFFFF).toString(2).padStart(23, '0');
      const hex = bits.toString(16).toUpperCase().padStart(8, '0');
      setResult({ sign: sign.toString(), exp, mantissa, hex, full: `${sign} ${exp} ${mantissa}` });
    } else {
      const hex = val.replace(/\s/g, '');
      if (!/^[0-9A-Fa-f]{8}$/.test(hex)) { setError('Enter 8 hex digits'); setResult(''); return; }
      const bits = parseInt(hex, 16);
      const buf = new ArrayBuffer(4);
      new Uint32Array(buf)[0] = bits;
      const val = new Float32Array(buf)[0];
      setResult({ value: val.toString(), hex: hex.toUpperCase() });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
        <button onClick={() => { setMode('dec2ieee'); convert(input); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'dec2ieee' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Decimal → IEEE-754</button>
        <button onClick={() => { setMode('ieee2dec'); convert(input); }} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'ieee2dec' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>IEEE-754 → Decimal</button>
      </div>
      <Field label={mode === 'dec2ieee' ? 'Decimal Input' : 'IEEE-754 Hex Input'} value={input} onChange={convert} placeholder={mode === 'dec2ieee' ? 'e.g. -3.14' : 'e.g. C048F5C3'} error={error} dark={dark} onCopy={input} />
      {result && mode === 'dec2ieee' && (
        <div className={`p-4 rounded-xl border space-y-3 ${dark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase ${dark ? 'text-slate-400' : 'text-slate-500'}`}>IEEE-754 (32-bit)</span>
            <CopyButton text={result.full} dark={dark} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
            <div className={`p-2 rounded-lg ${dark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
              <span className="text-red-400 font-bold block">Sign</span>
              <span className={`text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{result.sign}</span>
            </div>
            <div className={`p-2 rounded-lg ${dark ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50 border border-amber-200'}`}>
              <span className="text-amber-400 font-bold block">Exponent</span>
              <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{result.exp}</span>
            </div>
            <div className={`p-2 rounded-lg ${dark ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-cyan-50 border border-cyan-200'}`}>
              <span className="text-cyan-400 font-bold block">Mantissa</span>
              <span className={`text-[10px] font-bold break-all ${dark ? 'text-white' : 'text-slate-900'}`}>{result.mantissa}</span>
            </div>
          </div>
          <p className={`text-xs font-mono ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Hex: 0x{result.hex}</p>
        </div>
      )}
      {result && mode === 'ieee2dec' && (
        <div className={`p-4 rounded-xl border ${dark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold uppercase ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Decimal Value</span>
            <CopyButton text={result.value} dark={dark} />
          </div>
          <p className="text-lg font-mono font-bold text-indigo-400">{result.value}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──
export function NumberSystem() {
  const { dark } = useTheme();
  const [activeTab, setActiveTab] = useState('base');

  const renderTab = () => {
    switch (activeTab) {
      case 'base': return <BaseConverter dark={dark} />;
      case 'arithmetic': return <BinaryArithmetic dark={dark} />;
      case 'ones': return <OnesComplement dark={dark} />;
      case 'twos': return <TwosComplement dark={dark} />;
      case 'gray': return <GrayCode dark={dark} />;
      case 'binGray': return <BinGray dark={dark} />;
      case 'bcd': return <BCDConverter dark={dark} />;
      case 'excess3': return <Excess3Converter dark={dark} />;
      case 'ascii': return <ASCIIConverter dark={dark} />;
      case 'ieee': return <IEEEConverter dark={dark} />;
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center space-x-3 ${dark ? 'text-white' : 'text-slate-900'}`}>
            <span>Number System Converter</span>
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">10 Tools</span>
          </h1>
          <p className={`text-sm mt-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Convert between number systems, perform binary arithmetic, and more.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3">
          <div className={`glass-panel p-2 rounded-2xl border space-y-1 ${dark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : dark
                        ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && <ChevronRight className="w-3 h-3 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`glass-panel p-6 rounded-2xl border ${dark ? 'border-slate-800/80' : 'border-slate-200'}`}
            >
              <div className="flex items-center space-x-2 mb-5 pb-4 border-b border-slate-800/50">
                {React.createElement(TABS.find(t => t.id === activeTab).icon, { className: 'w-5 h-5 text-indigo-400' })}
                <h2 className={`text-base font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                  {TABS.find(t => t.id === activeTab).label}
                </h2>
              </div>
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Copy, Check, Download, Share2, ShieldCheck, Sparkles, Code2, Zap, CircuitBoard, Info } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

function countGates(expression) {
  if (!expression) return { and: 0, or: 0, not: 0, total: 0 };
  const andCount = (expression.match(/&/g) || []).length;
  const orCount = (expression.match(/\|/g) || []).length;
  const notCount = (expression.match(/!/g) || []).length;
  return {
    and: andCount + (expression.match(/\*/g) || []).length,
    or: orCount + (expression.match(/\+/g) || []).length,
    not: notCount + (expression.match(/'/g) || []).length,
    total: andCount + orCount + notCount,
  };
}

function toNAND(expression) {
  if (!expression) return '';
  let result = expression;
  result = result.replace(/([^&|]+)&([^&|]+)/g, 'NAND($1, $2)');
  result = result.replace(/([^&|]+)\|([^&|]+)/g, 'NAND(NAND($1, $1), NAND($2, $2))');
  return result;
}

function toNOR(expression) {
  if (!expression) return '';
  let result = expression;
  result = result.replace(/([^&|]+)\|([^&|]+)/g, 'NOR($1, $2)');
  result = result.replace(/([^&|]+)&([^&|]+)/g, 'NOR(NOR($1, $1), NOR($2, $2))');
  return result;
}

export function ExpressionCard({ solution }) {
  const { dark } = useTheme();
  const toast = useToast();
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLatex, setCopiedLatex] = useState(false);
  const [showCircuit, setShowCircuit] = useState(false);

  if (!solution) return null;

  const { expression_sop, expression_pos, expression_latex, mode, sympy_verified, variables } = solution;
  const currentExpression = mode === "SOP" ? expression_sop : expression_pos;

  const gateStats = useMemo(() => countGates(currentExpression), [currentExpression]);
  const nandExpr = useMemo(() => toNAND(currentExpression), [currentExpression]);
  const norExpr = useMemo(() => toNOR(currentExpression), [currentExpression]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(currentExpression);
    setCopiedText(true);
    toast('Expression copied to clipboard', 'success');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(expression_latex);
    setCopiedLatex(true);
    toast('LaTeX copied to clipboard', 'success');
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast('Shareable URL copied to clipboard', 'success');
  };

  return (
    <div className={`glass-panel p-6 rounded-2xl border shadow-glow-primary space-y-5 relative overflow-hidden ${dark ? 'border-indigo-500/30' : 'border-indigo-300/50'}`}>
      
      {/* Top Accent Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Simplified Boolean Solution</h3>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Minimal equation in {mode} representation</p>
          </div>
        </div>

        {/* SymPy Verification Badge */}
        {sympy_verified && (
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">SymPy Verified</span>
          </div>
        )}
      </div>

      {/* Main Equation Box */}
      <div className={`p-6 rounded-xl border text-center relative group ${dark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className={`text-xs font-mono uppercase tracking-wider mb-2 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          F({solution.var_names ? solution.var_names.join(', ') : 'vars'}) =
        </div>

        <div className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-cyan-300 font-mono tracking-wider break-all py-2">
          {currentExpression}
        </div>

        {/* Both SOP & POS Formats */}
        <div className={`mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-3 text-left font-mono text-xs ${dark ? 'border-slate-800/80' : 'border-slate-200'}`}>
          <div className={`p-2.5 rounded-lg border ${dark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-[10px] uppercase font-bold block mb-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Sum of Products (SOP)</span>
            <span className={`${dark ? 'text-white' : 'text-slate-900'} font-semibold`}>{expression_sop}</span>
          </div>

          <div className={`p-2.5 rounded-lg border ${dark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-[10px] uppercase font-bold block mb-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Product of Sums (POS)</span>
            <span className={`${dark ? 'text-white' : 'text-slate-900'} font-semibold`}>{expression_pos}</span>
          </div>
        </div>
      </div>

      {/* Circuit Cost & Gate Count */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3 rounded-xl border text-center ${dark ? 'bg-slate-700/30 border-slate-600/30' : 'bg-slate-50 border-slate-200'}`}>
          <Zap className="w-4 h-4 mx-auto mb-1 text-amber-400" />
          <div className={`text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{gateStats.total}</div>
          <div className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Gates</div>
        </div>
        <div className={`p-3 rounded-xl border text-center ${dark ? 'bg-slate-700/30 border-slate-600/30' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-sm font-mono mb-1 text-indigo-400">&amp;</div>
          <div className={`text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{gateStats.and}</div>
          <div className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>AND Gates</div>
        </div>
        <div className={`p-3 rounded-xl border text-center ${dark ? 'bg-slate-700/30 border-slate-600/30' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-sm font-mono mb-1 text-purple-400">|</div>
          <div className={`text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{gateStats.or}</div>
          <div className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>OR Gates</div>
        </div>
        <div className={`p-3 rounded-xl border text-center ${dark ? 'bg-slate-700/30 border-slate-600/30' : 'bg-slate-50 border-slate-200'}`}>
          <div className="text-sm font-mono mb-1 text-red-400">!</div>
          <div className={`text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{gateStats.not}</div>
          <div className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>NOT Gates</div>
        </div>
      </div>

      {/* NAND/NOR Equivalents Toggle */}
      <div>
        <button
          onClick={() => setShowCircuit(!showCircuit)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            showCircuit
              ? 'bg-cyan-600 text-white'
              : dark
                ? 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50'
                : 'bg-white/50 text-slate-500 hover:text-slate-900 border border-slate-200/50'
          }`}
        >
          <CircuitBoard className="w-4 h-4" />
          {showCircuit ? 'Hide' : 'Show'} NAND/NOR Equivalents
        </button>
        
        {showCircuit && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`p-3 rounded-xl border ${dark ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold">NAND-Only</span>
              </div>
              <p className="text-xs font-mono break-all">{nandExpr}</p>
            </div>
            <div className={`p-3 rounded-xl border ${dark ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">NOR-Only</span>
              </div>
              <p className="text-xs font-mono break-all">{norExpr}</p>
            </div>
          </div>
        )}
      </div>{/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyText}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
          >
            {copiedText ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedText ? 'Copied!' : 'Copy Expression'}</span>
          </button>

          <button
            onClick={handleCopyLatex}
            className={`px-3.5 py-2 rounded-xl font-semibold text-xs border transition-all flex items-center space-x-1.5 ${dark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'}`}
          >
            {copiedLatex ? <Check className="w-4 h-4 text-emerald-300" /> : <Code2 className="w-4 h-4 text-cyan-400" />}
            <span>{copiedLatex ? 'LaTeX Copied!' : 'LaTeX'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleShare}
            className={`px-3.5 py-2 rounded-xl font-semibold text-xs border transition-all flex items-center space-x-1.5 ${dark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

    </div>
  );
}

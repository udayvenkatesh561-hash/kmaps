import React, { useState } from 'react';
import { Copy, Check, Download, Share2, ShieldCheck, Sparkles, Code2 } from 'lucide-react';

export function ExpressionCard({ solution }) {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLatex, setCopiedLatex] = useState(false);

  if (!solution) return null;

  const { expression_sop, expression_pos, expression_latex, mode, sympy_verified, variables } = solution;
  const currentExpression = mode === "SOP" ? expression_sop : expression_pos;

  const handleCopyText = () => {
    navigator.clipboard.writeText(currentExpression);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(expression_latex);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    alert("Shareable URL copied to clipboard!");
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 shadow-glow-primary space-y-5 relative overflow-hidden">
      
      {/* Top Accent Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Simplified Boolean Solution</h3>
            <p className="text-xs text-slate-400">Minimal equation in {mode} representation</p>
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
      <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 text-center relative group">
        <div className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">
          F({solution.var_names ? solution.var_names.join(', ') : 'vars'}) =
        </div>

        <div className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-cyan-300 font-mono tracking-wider break-all py-2">
          {currentExpression}
        </div>

        {/* Both SOP & POS Formats */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Sum of Products (SOP)</span>
            <span className="text-white font-semibold">{expression_sop}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Product of Sums (POS)</span>
            <span className="text-white font-semibold">{expression_pos}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
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
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all flex items-center space-x-1.5"
          >
            {copiedLatex ? <Check className="w-4 h-4 text-emerald-300" /> : <Code2 className="w-4 h-4 text-cyan-400" />}
            <span>{copiedLatex ? 'LaTeX Copied!' : 'LaTeX'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleShare}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all flex items-center space-x-1.5"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

    </div>
  );
}

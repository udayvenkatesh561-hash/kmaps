import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Zap, 
  HelpCircle, 
  AlertCircle, 
  BookOpen, 
  Undo, 
  Redo, 
  ListFilter 
} from 'lucide-react';
import { fetchExamples } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export function SolverForm({
  variables,
  setVariables,
  varNames,
  setVarNames,
  mintermsInput,
  setMintermsInput,
  dontCaresInput,
  setDontCaresInput,
  mode,
  setMode,
  handleSolve,
  error,
  resetForm,
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
  loadExample
}) {
  const { dark } = useTheme();
  const [examples, setExamples] = useState([]);
  const [showExamplesDropdown, setShowExamplesDropdown] = useState(false);

  const maxMintermVal = Math.pow(2, variables) - 1;

  const handleOpenExamples = async () => {
    if (examples.length === 0) {
      const data = await fetchExamples();
      setExamples(data);
    }
    setShowExamplesDropdown(!showExamplesDropdown);
  };

  return (
    <div className={`glass-panel p-6 rounded-2xl border shadow-xl space-y-6 ${dark ? 'border-slate-800/80' : 'border-slate-200'}`}>
      
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-4 ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Input Parameters</h2>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Configure minterms & variables</p>
          </div>
        </div>

        {/* Undo / Redo */}
        <div className={`flex items-center space-x-1 p-1 rounded-xl border ${dark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo last change"
            className={`p-1.5 rounded-lg transition-colors ${dark ? 'text-slate-400 hover:text-white disabled:opacity-30' : 'text-slate-500 hover:text-slate-900 disabled:opacity-30'}`}
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo change"
            className={`p-1.5 rounded-lg transition-colors ${dark ? 'text-slate-400 hover:text-white disabled:opacity-30' : 'text-slate-500 hover:text-slate-900 disabled:opacity-30'}`}
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-300 text-sm animate-pulse-glow">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Input Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Variable Selector */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
          Number of Variables
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => setVariables(num)}
              className={`py-2.5 rounded-xl font-bold text-sm transition-all border ${
                variables === num
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-glow-primary'
                  : dark
                    ? 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {num} Vars
            </button>
          ))}
        </div>
        <p className={`mt-1.5 text-[11px] flex items-center justify-between ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          <span>{variables} Variables = {Math.pow(2, variables)} total states (0..{maxMintermVal})</span>
          {variables === 5 && <span className="text-cyan-400 font-semibold">Dual 4x4 Subgrid View</span>}
        </p>
      </div>

      {/* Variable Names */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
          Variable Names
        </label>
        <div className="flex gap-1.5">
          {varNames.map((name, idx) => (
            <input
              key={idx}
              type="text"
              value={name}
              onChange={(e) => {
                const next = [...varNames];
                next[idx] = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 6);
                setVarNames(next);
              }}
              className={`flex-1 min-w-0 px-2 py-2 rounded-lg border text-sm text-center font-mono transition-all focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${dark ? 'bg-slate-900/90 border-slate-800 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
              placeholder={String.fromCharCode(65 + idx)}
            />
          ))}
        </div>
        <p className={`mt-1 text-[11px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Default: A, B, C, ... — click to rename</p>
      </div>

      {/* Minterms Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
            Minterms <span className="text-indigo-400 font-mono">(m)</span>
          </label>
          <span className={`text-[11px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Comma-separated</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={mintermsInput}
            onChange={(e) => setMintermsInput(e.target.value)}
            placeholder={`e.g. 0, 1, 2, 5, 7`}
            className={`w-full px-4 py-3 rounded-xl border text-sm font-mono transition-all focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${dark ? 'bg-slate-900/90 border-slate-800 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
          />
        </div>
        <p className={`mt-1 text-[11px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Valid range: 0 to {maxMintermVal}</p>
      </div>

      {/* Don't Cares Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={`text-xs font-semibold uppercase tracking-wider ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
            Don't-Care Terms <span className="text-purple-400 font-mono">(d)</span> <span className={`font-normal lowercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>(optional)</span>
          </label>
          <span className={`text-[11px] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Comma-separated</span>
        </div>
        <input
          type="text"
          value={dontCaresInput}
          onChange={(e) => setDontCaresInput(e.target.value)}
          placeholder={`e.g. 3, 6`}
          className={`w-full px-4 py-3 rounded-xl border text-sm font-mono transition-all focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 ${dark ? 'bg-slate-900/90 border-slate-800 text-white placeholder:text-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'}`}
        />
      </div>

      {/* Expression Mode Toggle */}
      <div>
        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
          Expression Mode
        </label>
        <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl border ${dark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
          <button
            onClick={() => setMode("SOP")}
            className={`py-2 rounded-lg font-bold text-xs transition-all ${
              mode === "SOP"
                ? 'bg-indigo-600 text-white shadow-md'
                : dark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            SOP (Sum of Products)
          </button>
          <button
            onClick={() => setMode("POS")}
            className={`py-2 rounded-lg font-bold text-xs transition-all ${
              mode === "POS"
                ? 'bg-indigo-600 text-white shadow-md'
                : dark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            POS (Product of Sums)
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={() => handleSolve()}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-glow-primary transition-all hover:scale-[1.01] active:scale-98 flex items-center justify-center space-x-2"
        >
          <Zap className="w-4 h-4" />
          <span>Solve K-Map</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          {/* Preset Problems */}
          <div className="relative">
            <button
              onClick={handleOpenExamples}
              className={`w-full py-2.5 px-3 rounded-xl font-semibold text-xs border transition-all flex items-center justify-center space-x-1.5 ${dark ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/80' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'}`}
            >
              <ListFilter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Presets</span>
            </button>

            {showExamplesDropdown && (
              <div className={`absolute bottom-full mb-2 left-0 w-64 rounded-xl shadow-2xl p-2 z-50 space-y-1 ${dark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`}>
                <div className={`text-[10px] font-bold uppercase px-2 py-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Preset Examples
                </div>
                {examples.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      loadExample(ex);
                      setShowExamplesDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg transition-colors block ${dark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                  >
                    <div className={`text-xs font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{ex.title}</div>
                    <div className={`text-[10px] line-clamp-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{ex.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={resetForm}
            className={`py-2.5 px-3 rounded-xl font-semibold text-xs border transition-all flex items-center justify-center space-x-1.5 ${dark ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/80' : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 border-slate-200'}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

    </div>
  );
}

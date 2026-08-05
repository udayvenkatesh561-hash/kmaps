import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, CheckCircle2, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function StepsCard({ steps }) {
  const { dark } = useTheme();
  const [expandedStep, setExpandedStep] = useState(1);

  if (!steps || steps.length === 0) return null;

  return (
    <div className={`glass-panel p-6 rounded-2xl border space-y-4 shadow-xl ${dark ? 'border-slate-800/80' : 'border-slate-200'}`}>

      {/* Header */}
      <div className={`flex items-center space-x-2 border-b pb-3 ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className={`text-base font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Step-by-Step Explanation</h3>
          <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Mathematical breakdown of K-Map reduction algorithm</p>
        </div>
      </div>

      {/* Steps Accordion List */}
      <div className="space-y-3">
        {steps.map((step) => {
          const isOpen = expandedStep === step.step_number;

          return (
            <div
              key={step.step_number}
              className={`rounded-xl border transition-all overflow-hidden ${isOpen
                  ? dark
                    ? 'bg-slate-800/80 border-indigo-500/50 shadow-lg'
                    : 'bg-indigo-50 border-indigo-200 shadow-md'
                  : dark
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
            >
              <button
                onClick={() => setExpandedStep(isOpen ? null : step.step_number)}
                className="w-full p-4 text-left flex items-center justify-between space-x-3 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${isOpen
                      ? 'bg-indigo-600 text-white shadow-glow-primary'
                      : dark
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-200 text-slate-500'
                    }`}>
                    {step.step_number}
                  </div>

                  <div>
                    <h4 className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{step.title}</h4>
                    <p className={`text-xs line-clamp-1 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{step.description}</p>
                  </div>
                </div>

                <div className="text-slate-400">
                  {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className={`px-4 pb-4 pt-1 border-t text-xs space-y-3 font-sans ${dark ? 'border-slate-800/80 text-slate-300' : 'border-slate-200 text-slate-600'}`}
                >
                  <p className="leading-relaxed">{step.description}</p>

                  {step.details && (
                    <div className={`p-3 rounded-lg border font-mono text-[11px] space-y-1 ${dark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      {typeof step.details === 'object' ? (
                        <pre className="text-cyan-300 whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(step.details, null, 2)}
                        </pre>
                      ) : (
                        <div className="text-cyan-300">{String(step.details)}</div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, CheckCircle2, ArrowRight } from 'lucide-react';

export function StepsCard({ steps }) {
  const [expandedStep, setExpandedStep] = useState(1);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4 shadow-xl">

      {/* Header */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Step-by-Step Explanation</h3>
          <p className="text-xs text-slate-400">Mathematical breakdown of K-Map reduction algorithm</p>
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
                  ? 'bg-slate-800/80 border-indigo-500/50 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
            >
              <button
                onClick={() => setExpandedStep(isOpen ? null : step.step_number)}
                className="w-full p-4 text-left flex items-center justify-between space-x-3 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-sm ${isOpen
                      ? 'bg-indigo-600 text-white shadow-glow-primary'
                      : 'bg-slate-800 text-slate-400'
                    }`}>
                    {step.step_number}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{step.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1">{step.description}</p>
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
                  className="px-4 pb-4 pt-1 border-t border-slate-800/80 text-xs text-slate-300 space-y-3 font-sans"
                >
                  <p className="leading-relaxed text-slate-300">{step.description}</p>

                  {step.details && (
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 font-mono text-[11px] space-y-1">
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

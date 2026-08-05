import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, Grid, BookOpen, ShieldCheck } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function Hero() {
  const { dark } = useTheme();
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background Animated Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-cyan-500/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-6 backdrop-blur-md ${dark ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 border border-indigo-200 text-indigo-700'}`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span>Advanced 2, 3, 4 & 5-Variable Karnaugh Map Engine</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]"
        >
          Instantly Simplify <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
            Boolean Expressions
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`mt-6 text-lg sm:text-xl max-w-2xl mx-auto font-normal leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}
        >
          Visualize Gray Code matrices, wrap-around grouping adjacencies, essential prime implicants, and step-by-step logic reductions with live mathematical verification.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/solver"
            className="w-full sm:w-auto flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base shadow-glow-primary transition-all hover:scale-[1.02] active:scale-95"
          >
            <span>Start Solving Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            to="/about"
            className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-4 rounded-2xl font-semibold text-base border transition-all hover:scale-[1.02] ${dark ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/80' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'}`}
          >
            <span>Read Theory Guide</span>
          </Link>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left"
        >
          <div className={`glass-panel p-6 rounded-2xl border hover:border-indigo-500/30 transition-colors group ${dark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform mb-4">
              <Grid className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>Interactive Matrix</h3>
            <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Click any cell directly to toggle between 0, 1, and X don't-care states with real-time solver updates.</p>
          </div>

          <div className={`glass-panel p-6 rounded-2xl border hover:border-purple-500/30 transition-colors group ${dark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>Wrap-Around Grouping</h3>
            <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Detects torus edge adjacencies, 4-corner groups, and multi-subgrid 5-variable grouping seamlessly.</p>
          </div>

          <div className={`glass-panel p-6 rounded-2xl border hover:border-cyan-500/30 transition-colors group ${dark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>Step-by-Step Logic</h3>
            <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Walk through 5 structured educational steps detailing Gray code mapping, implicants, and EPIs.</p>
          </div>

          <div className={`glass-panel p-6 rounded-2xl border hover:border-emerald-500/30 transition-colors group ${dark ? 'border-slate-800/80' : 'border-slate-200'}`}>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>SymPy Verified</h3>
            <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Every calculated Boolean term is mathematically cross-verified for absolute accuracy.</p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

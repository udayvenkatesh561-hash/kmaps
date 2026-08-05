import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cpu, Github, BookOpen, Layers, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function Navbar() {
  const location = useLocation();
  const { dark, toggleTheme } = useTheme();

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-200 ${dark ? 'bg-[#0F172A]/80 border-slate-800/80' : 'bg-white/80 border-slate-200/80'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 p-[2px] shadow-glow-primary transition-transform group-hover:scale-105">
            <div className={`w-full h-full rounded-[10px] flex items-center justify-center ${dark ? 'bg-[#0F172A]' : 'bg-white'}`}>
              <Cpu className="w-5 h-5 text-indigo-400 group-hover:text-cyan-400 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className={`text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r tracking-tight ${dark ? 'from-white via-slate-200 to-slate-400' : 'from-slate-900 via-slate-700 to-slate-500'}`}>
              K-Map Solver
            </span>
            <span className="text-[10px] text-cyan-400 font-mono tracking-wider uppercase font-semibold">
              Boolean Architecture
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className={`hidden md:flex items-center space-x-1 p-1.5 rounded-full border transition-colors duration-200 ${dark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-100 border-slate-200'}`}>
          <Link
            to="/"
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              isActive('/') 
                ? 'bg-indigo-600 text-white shadow-md' 
                : dark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Home</span>
          </Link>

          <Link
            to="/solver"
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              isActive('/solver') 
                ? 'bg-indigo-600 text-white shadow-md' 
                : dark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Interactive Solver</span>
          </Link>

          <Link
            to="/about"
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              isActive('/about') 
                ? 'bg-indigo-600 text-white shadow-md' 
                : dark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Theory & Docs</span>
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-all ${dark ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'}`}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105 ${dark ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}`}
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          <Link
            to="/solver"
            className="md:hidden flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-glow-primary"
          >
            <span>Solver</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

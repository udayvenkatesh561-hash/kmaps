import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Solver } from './pages/Solver';
import { About } from './pages/About';
import { NumberSystem } from './pages/NumberSystem';
import { LogicGateSimulator } from './pages/LogicGateSimulator';
import { TruthTableGenerator } from './pages/TruthTableGenerator';
import { BooleanAlgebra } from './pages/BooleanAlgebra';
import { LearningCenter } from './pages/LearningCenter';

export function App() {
  const { dark } = useTheme();

  return (
    <div className={`flex flex-col min-h-screen font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200 ${dark ? 'bg-[#0F172A] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Navbar />
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/solver" element={<Solver />} />
          <Route path="/numbersystem" element={<NumberSystem />} />
          <Route path="/logic-gates" element={<LogicGateSimulator />} />
          <Route path="/truth-table" element={<TruthTableGenerator />} />
          <Route path="/boolean-algebra" element={<BooleanAlgebra />} />
          <Route path="/learning" element={<LearningCenter />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Solver } from './pages/Solver';
import { About } from './pages/About';

export function App() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0F172A] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/solver" element={<Solver />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;

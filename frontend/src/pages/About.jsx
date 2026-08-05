import React from 'react';
import { BookOpen, Cpu, Grid, Layers, Sparkles, ShieldCheck, Zap } from 'lucide-react';

export function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Title */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Educational Documentation & Theory</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Understanding Karnaugh Maps
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          A comprehensive guide to Boolean algebra minimization, Gray code matrix representation, and wrap-around grouping logic.
        </p>
      </div>

      {/* Article Cards */}
      <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
        
        {/* Card 1: What is a K-Map */}
        <section className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-3 text-indigo-400">
            <Grid className="w-6 h-6" />
            <h2 className="text-xl font-bold text-white">What is a Karnaugh Map?</h2>
          </div>
          <p>
            Invented by Maurice Karnaugh in 1953, a <strong>Karnaugh Map (K-Map)</strong> is a graphical technique used in digital design to simplify Boolean algebraic expressions into minimal Sum-of-Products (SOP) or Product-of-Sums (POS) forms.
          </p>
          <p>
            Unlike algebraic simplification using Boolean theorems, K-Maps take advantage of human visual pattern recognition by arranging truth table outputs in a 2D matrix where adjacent cells differ by exactly <strong>one binary bit</strong>.
          </p>
        </section>

        {/* Card 2: Gray Code Adjacency */}
        <section className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-3 text-purple-400">
            <Zap className="w-6 h-6" />
            <h2 className="text-xl font-bold text-white">Gray Code Ordering & Adjacency</h2>
          </div>
          <p>
            Standard binary ordering (00, 01, 10, 11) is <em>not</em> used in K-Maps because changing from 01 to 10 changes two bits simultaneously. Instead, K-Maps use <strong>Gray Code ordering</strong>:
          </p>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs text-cyan-300">
            00 → 01 → 11 → 10
          </div>
          <p>
            Because adjacent cells differ by only one variable, combining adjacent 1s allows us to apply the Boolean identity:
            <span className="font-mono text-emerald-400 block my-1 font-bold">X · Y + X · Y' = X (Y + Y') = X</span>
            The variable Y is eliminated because it changes value across the group!
          </p>
        </section>

        {/* Card 3: Grouping Rules */}
        <section className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-3 text-cyan-400">
            <Layers className="w-6 h-6" />
            <h2 className="text-xl font-bold text-white">Rules of K-Map Grouping</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li><strong>Power of 2 Group Sizes:</strong> Groups must contain $2^k$ cells (1, 2, 4, 8, 16 cells).</li>
            <li><strong>Rectangular Shape:</strong> Groups must be rectangular sub-matrices (1x1, 1x2, 2x1, 2x2, 1x4, 4x1, 2x4, 4x2, 4x4).</li>
            <li><strong>Wrap-Around Adjacency:</strong> The top edge connects to the bottom edge, and the left edge connects to the right edge (forming a torus). In a 4x4 map, the 4 corner cells (0, 2, 8, 10) form a single valid 2x2 group!</li>
            <li><strong>Don't-Care Optimization:</strong> Don't-care states (X) can be included in groups to make them larger, but we do not need to cover groups that contain only don't-cares.</li>
            <li><strong>Essential Prime Implicants:</strong> Any group covering a '1' that is covered by no other group is <em>essential</em> and must be included in the final answer.</li>
          </ul>
        </section>

        {/* Card 4: 5-Variable K-Maps */}
        <section className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-3 text-emerald-400">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold text-white">5-Variable K-Maps (Dual Subgrids)</h2>
          </div>
          <p>
            A 5-variable function $F(A, B, C, D, E)$ has $2^5 = 32$ minterms. We visualize this using <strong>two 4x4 sub-maps</strong> placed side-by-side:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-indigo-400 font-bold block mb-1">Subgrid 1: A = 0 (A')</span>
              <span>4x4 matrix for BC \ DE (minterms 0..15)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-purple-400 font-bold block mb-1">Subgrid 2: A = 1 (A)</span>
              <span>4x4 matrix for BC \ DE (minterms 16..31)</span>
            </div>
          </div>
          <p className="pt-2">
            Adjacency extends in 3D: a cell at position (r, c) in Subgrid 0 is adjacent to the cell at the identical (r, c) position in Subgrid 1!
          </p>
        </section>

      </div>

    </div>
  );
}

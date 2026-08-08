import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  ChevronRight,
  BookOpen,
  Layers,
  Binary,
  CircuitBoard,
  Table2,
  Braces,
  Lightbulb,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const TOPICS = [
  {
    id: 'kmap',
    title: 'K-Map Simplification',
    icon: Layers,
    color: '#6366f1',
    description: 'Karnaugh Maps for Boolean function minimization',
    sections: [
      {
        title: 'What is a K-Map?',
        content: `A Karnaugh Map (K-Map) is a visual method for simplifying Boolean algebra expressions. It replaces complex algebraic manipulation with an intuitive grid-based pattern recognition approach.`,
        formula: 'Group adjacent 1-cells in powers of 2 (1, 2, 4, 8, 16...)',
      },
      {
        title: 'Algorithm',
        content: `1. Fill the K-Map from the truth table or expression
2. Identify groups of 1s (or 0s for POS)
3. Groups must be rectangular and contain 2^n cells
4. Groups can wrap around edges
5. Each group eliminates the variable that changes within it
6. Write the simplified term for each group
7. OR all group terms together`,
      },
      {
        title: 'Example',
        content: `F(A,B,C) = Σm(0,1,2,4,5,6)\n\nK-Map:\n     BC\nA    00  01  11  10\n0  [  1   1   0   1 ]\n1  [  1   1   0   1 ]\n\nGroups: AB' (row 0,1 col 01) + A'C' (row 0 col 00,10)\nSimplified: F = B' + A'C'`,
      },
      {
        title: 'Common Mistakes',
        content: `• Forgetting that groups can wrap around edges
• Making non-rectangular groups
• Not using the largest possible groups
• Missing overlapping groups
• Forgetting to include don't-care conditions`,
      },
      {
        title: 'Practice',
        content: `Try: F(A,B,C,D) = Σm(0,1,2,5,6,7,8,9,10,14)\nAnswer: F = B'D' + A'C' + CD' + A'BD`,
      },
    ],
  },
  {
    id: 'number',
    title: 'Number Systems',
    icon: Binary,
    color: '#8b5cf6',
    description: 'Binary, Octal, Hexadecimal conversions and codes',
    sections: [
      {
        title: 'Number Base Conversion',
        content: `Decimal to Binary: repeatedly divide by 2, read remainders bottom-up
Binary to Decimal: multiply each bit by its position weight (2^n)
Binary to Octal: group bits in 3s from right
Binary to Hex: group bits in 4s from right`,
        formula: 'Decimal = Σ(bit × 2^position)',
      },
      {
        title: 'Gray Code',
        content: `Gray Code is a binary numeral system where consecutive values differ by exactly one bit. This prevents spurious output during transitions.

Binary → Gray: G[i] = B[i] XOR B[i+1]
Gray → Binary: B[i] = G[i] XOR B[i+1]`,
        formula: 'G = B ⊕ (B >> 1)',
      },
      {
        title: "2's Complement",
        content: `Used for representing signed integers in binary.

To find 2's complement of N:
1. Invert all bits (1's complement)
2. Add 1

Range for n bits: -2^(n-1) to 2^(n-1)-1`,
      },
      {
        title: 'BCD Codes',
        content: `BCD (8421): Standard binary-coded decimal
Excess-3: Each decimal digit + 3 (bias code)
2421: Weighted code with weights 2,4,2,1
5211: Weighted code with weights 5,2,1,1

BCD is useful for decimal displays and financial calculations.`,
      },
      {
        title: 'IEEE 754 Floating Point',
        content: `Single Precision (32-bit): 1 sign + 8 exponent + 23 mantissa
Double Precision (64-bit): 1 sign + 11 exponent + 52 mantissa

Exponent bias: 127 (single) or 1023 (double)
Hidden leading 1 in mantissa`,
        formula: 'Value = (-1)^s × 1.mantissa × 2^(exponent - bias)',
      },
    ],
  },
  {
    id: 'gates',
    title: 'Logic Gates',
    icon: CircuitBoard,
    color: '#ec4899',
    description: 'Fundamental building blocks of digital circuits',
    sections: [
      {
        title: 'Basic Gates',
        content: `AND: Output 1 only if ALL inputs are 1. Symbol: &
OR: Output 1 if ANY input is 1. Symbol: ≥1
NOT: Inverts the input. Symbol: 1
XOR: Output 1 if inputs are different. Symbol: =1`,
        formula: 'AND: Y = A·B | OR: Y = A+B | NOT: Y = A\'',
      },
      {
        title: 'Universal Gates',
        content: `NAND and NOR are universal gates - any Boolean function can be implemented using only NAND or only NOR gates.

NAND = AND + NOT
NOR = OR + NOT

This is important for manufacturing since a single gate type reduces cost.`,
      },
      {
        title: 'Gate Equivalences',
        content: `AND = NOR(NOT A, NOT B) ... by DeMorgan's
OR = NAND(NOT A, NOT B) ... by DeMorgan's
NOT = NAND(A, A) = NOR(A, A)
XOR = A·(A·B)' + B·(A·B)'`,
      },
      {
        title: 'Propagation Delay',
        content: `Every gate has a propagation delay - the time for input changes to affect the output. In a circuit, the critical path (longest delay path) determines the maximum operating frequency.

Total delay = Σ gate delays along critical path`,
      },
    ],
  },
  {
    id: 'boolean',
    title: 'Boolean Algebra',
    icon: Braces,
    color: '#06b6d4',
    description: 'Mathematical logic for circuit simplification',
    sections: [
      {
        title: 'Basic Laws',
        content: `Identity: A + 0 = A, A · 1 = A
Null: A + 1 = 1, A · 0 = 0
Idempotent: A + A = A, A · A = A
Complement: A + A' = 1, A · A' = 0
Commutative: A + B = B + A, A · B = B · A
Associative: (A+B)+C = A+(B+C)
Distributive: A(B+C) = AB + AC`,
      },
      {
        title: "DeMorgan's Theorems",
        content: `(A · B)' = A' + B'
(A + B)' = A' · B'

Generalized:
(A₁·A₂·...·Aₙ)' = A₁'+A₂'+...+Aₙ'
(A₁+A₂+...+Aₙ)' = A₁'·A₂'·...·Aₙ'

Used extensively in circuit optimization and gate-level transformations.`,
      },
      {
        title: 'Simplification Techniques',
        content: `1. Algebraic: Apply laws to reduce terms
2. K-Map: Visual grouping of minterms
3. Quine-McCluskey: Tabular method for many variables
4. Consensus theorem: AB + A'C + BC = AB + A'C`,
      },
    ],
  },
  {
    id: 'truth',
    title: 'Truth Tables',
    icon: Table2,
    color: '#10b981',
    description: 'Tabular representation of Boolean functions',
    sections: [
      {
        title: 'Reading a Truth Table',
        content: `A truth table lists all possible input combinations and the corresponding output for each. For n variables, there are 2^n rows.

Example for 3 variables (A, B, C):
Row 0: 000 → F=0
Row 1: 001 → F=1
...and so on`,
      },
      {
        title: 'From Truth Table to Expression',
        content: `Sum of Products (SOP): OR of AND terms for each row where output = 1
Product of Sums (POS): AND of OR terms for each row where output = 0

SOP example: F = A'BC + AB'C + ABC
POS example: F = (A+B+C')(A'+B+C)(A'+B'+C')`,
      },
      {
        title: 'Minterms and Maxterms',
        content: `Minterm: AND term containing all variables (either complemented or uncomplemented). Corresponds to a row where output = 1.

Maxterm: OR term containing all variables. Corresponds to a row where output = 0.

F = Σm(1,3,5,7) means minterms 1,3,5,7 have output 1.`,
      },
    ],
  },
];

function TopicCard({ topic, dark, isExpanded, onToggle }) {
  const Icon = topic.icon;

  return (
    <motion.div
      layout
      className={`rounded-2xl border overflow-hidden transition-all ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}
    >
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-5 text-left transition-all ${
          isExpanded ? (dark ? 'bg-slate-700/30' : 'bg-slate-50') : ''
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: `${topic.color}20`, color: topic.color }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">{topic.title}</h3>
            <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{topic.description}</p>
          </div>
        </div>
        <ChevronRight
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''} ${dark ? 'text-slate-500' : 'text-slate-400'}`}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`px-5 pb-5 space-y-4 border-t ${dark ? 'border-slate-700/50' : 'border-slate-200/50'}`}>
              {topic.sections.map((section, idx) => (
                <div key={idx} className={`mt-4 p-4 rounded-xl border ${dark ? 'bg-slate-700/20 border-slate-600/20' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" style={{ color: topic.color }} />
                    {section.title}
                  </h4>
                  <pre className={`text-xs whitespace-pre-wrap font-sans leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {section.content}
                  </pre>
                  {section.formula && (
                    <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-mono ${dark ? 'bg-slate-600/30 text-cyan-300' : 'bg-cyan-50 text-cyan-700'}`}>
                      {section.formula}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function LearningCenter() {
  const { dark } = useTheme();
  const [expandedTopic, setExpandedTopic] = useState(null);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-cyan-500/10" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400">
              Learning Center
            </h1>
            <p className={`text-lg ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
              Master digital logic design with tutorials, examples, formulas, and practice questions.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="space-y-4">
          {TOPICS.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              dark={dark}
              isExpanded={expandedTopic === topic.id}
              onToggle={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
            />
          ))}
        </div>

        {/* Quick Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`mt-12 rounded-2xl border p-6 ${dark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-200/50'}`}
        >
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Quick Reference Card
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Boolean Laws', items: ['A + A = A', 'A · A = A', "A + A' = 1", "A · A' = 0", 'A + 0 = A', 'A · 1 = A'] },
              { title: 'DeMorgan\'s', items: ["(AB)' = A' + B'", "(A+B)' = A'·B'"] },
              { title: 'Gate Equivalents', items: ['NAND = AND + NOT', 'NOR = OR + NOT', 'XOR = A⊕B'] },
              { title: 'Number Systems', items: ['Bin: base 2', 'Oct: base 8', 'Dec: base 10', 'Hex: base 16'] },
              { title: 'Gray Code Rule', items: ['Only 1 bit changes', 'G = B ⊕ (B>>1)'] },
              { title: 'K-Map Groups', items: ['2^n cells only', 'Wrap around OK', 'Larger = simpler'] },
            ].map((card) => (
              <div
                key={card.title}
                className={`p-3 rounded-xl border ${dark ? 'bg-slate-700/20 border-slate-600/20' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className={`text-xs font-bold mb-2 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{card.title}</div>
                <div className="space-y-1">
                  {card.items.map((item) => (
                    <div key={item} className="text-xs font-mono">{item}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

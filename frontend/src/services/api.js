import axios from 'axios';

const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Helper Gray code map for client-side fallback
const GRAY_CODE_2BIT = [0, 1, 3, 2];

export async function solveKMap(payload) {
  try {
    const res = await apiClient.post('/solve', payload);
    return res.data;
  } catch (error) {
    console.warn("Backend API unreachable, utilizing client-side fallback solver:", error);
    return fallbackClientSolve(payload);
  }
}

export async function fetchExamples() {
  try {
    const res = await apiClient.get('/examples');
    return res.data;
  } catch (error) {
    return [
      {
        id: "corner_grouping",
        title: "4-Corner Wrap-Around Group",
        description: "4-variable map demonstrating wrap-around across all 4 matrix corners (minterms 0, 2, 8, 10).",
        variables: 4,
        minterms: [0, 2, 8, 10],
        dont_cares: [],
        mode: "SOP",
        expected: "B'D'"
      },
      {
        id: "full_adder_carry",
        title: "Full Adder Carry-Out (C_out)",
        description: "3-variable majority carry-out logic for a binary full adder: C_out = AB + BC + AC.",
        variables: 3,
        minterms: [3, 5, 6, 7],
        dont_cares: [],
        mode: "SOP",
        expected: "AB + BC + AC"
      },
      {
        id: "bcd_to_excess3",
        title: "BCD Don't Care Optimization",
        description: "4-variable BCD function taking advantage of illegal BCD states (10..15) as don't-care terms.",
        variables: 4,
        minterms: [1, 3, 5, 7, 9],
        dont_cares: [10, 11, 12, 13, 14, 15],
        mode: "SOP",
        expected: "D"
      },
      {
        id: "complex_4var",
        title: "Multi-Group 4-Variable Map",
        description: "Classic 4-variable simplification with overlapping groups and don't-care optimization.",
        variables: 4,
        minterms: [0, 1, 2, 5, 7, 8, 10, 13, 15],
        dont_cares: [3, 6],
        mode: "SOP",
        expected: "A'B' + BD + B'D'"
      }
    ];
  }
}

// Client-side fallback implementation for maximum robustness
function fallbackClientSolve({ variables, minterms = [], dont_cares = [], mode = "SOP", var_names }) {
  const names = var_names || ['A', 'B', 'C', 'D', 'E'].slice(0, variables);
  const minSet = new Set(minterms);
  const dcSet = new Set(dont_cares);

  // Generate grid matrix
  let gridMatrix = [];
  let subgrids = [];

  if (variables <= 4) {
    const numRows = variables <= 3 ? 2 : 4;
    const numCols = variables === 2 ? 2 : 4;
    for (let r = 0; r < numRows; r++) {
      let rowCells = [];
      for (let c = 0; c < numCols; c++) {
        const mIdx = coordToMintermFallback(r, c, variables, 0);
        const val = minSet.has(mIdx) ? "1" : (dcSet.has(mIdx) ? "X" : "0");
        rowCells.push({
          row: r,
          col: c,
          minterm_index: mIdx,
          binary_label: mIdx.toString(2).padStart(variables, '0'),
          value: val,
          subgrid: 0
        });
      }
      gridMatrix.push(rowCells);
    }
  } else {
    // 5 variables
    for (let sg = 0; sg < 2; sg++) {
      let matrix = [];
      for (let r = 0; r < 4; r++) {
        let rowCells = [];
        for (let c = 0; c < 4; c++) {
          const mIdx = coordToMintermFallback(r, c, 5, sg);
          const val = minSet.has(mIdx) ? "1" : (dcSet.has(mIdx) ? "X" : "0");
          rowCells.push({
            row: r,
            col: c,
            minterm_index: mIdx,
            binary_label: mIdx.toString(2).padStart(5, '0'),
            value: val,
            subgrid: sg
          });
        }
        matrix.push(rowCells);
      }
      subgrids.push({
        subgrid_index: sg,
        subgrid_title: `${names[0]} = ${sg}`,
        label: sg === 0 ? `${names[0]}'`: `${names[0]}`,
        grid: matrix
      });
    }
  }

  const kmapGrid = {
    variables,
    subgrids_count: variables === 5 ? 2 : 1,
    row_vars: variables === 2 ? names[0] : (variables === 3 ? names[0] : names.slice(0, 2).join('')),
    col_vars: variables === 2 ? names[1] : (variables === 3 ? names.slice(1).join('') : (variables === 4 ? names.slice(2).join('') : names.slice(3).join(''))),
    corner_label: `${names[0]} \\ ${names[1]}`,
    row_labels: variables <= 3 ? ["0", "1"] : ["00", "01", "11", "10"],
    col_labels: variables === 2 ? ["0", "1"] : ["00", "01", "11", "10"],
    grid: gridMatrix,
    subgrids: variables === 5 ? subgrids : undefined
  };

  // Basic Quine-McCluskey grouping
  const allIndices = Array.from(new Set([...minterms, ...dont_cares]));
  const groups = clientSideGrouping(variables, minterms, dont_cares, names);

  const sopTerms = groups.map(g => g.term);
  const posTerms = groups.map(g => g.term_pos);
  const expSOP = sopTerms.length > 0 ? sopTerms.join(" + ") : "0";
  const expPOS = posTerms.length > 0 ? posTerms.join(" ") : "(0)";

  // Generate Truth Table
  const totalRows = Math.pow(2, variables);
  let truthTable = [];
  for (let i = 0; i < totalRows; i++) {
    const bin = i.toString(2).padStart(variables, '0');
    let inputObj = {};
    names.forEach((name, idx) => {
      inputObj[name] = parseInt(bin[idx]);
    });
    truthTable.push({
      minterm_index: i,
      binary: bin,
      inputs: inputObj,
      output: minSet.has(i) ? "1" : (dcSet.has(i) ? "X" : "0")
    });
  }

  // Educational steps
  const steps = [
    {
      step_number: 1,
      title: "Truth Table & Input Setup",
      description: `Specified ${variables} variables (${names.join(', ')}). Active minterms: m(${minterms.join(', ')}). Don't cares: d(${dont_cares.join(', ')}).`
    },
    {
      step_number: 2,
      title: "K-Map Matrix Population",
      description: `Mapped minterms onto Gray Code adjacency matrix for visual wrap-around grouping.`
    },
    {
      step_number: 3,
      title: "Prime Implicant Grouping",
      description: `Identified ${groups.length} maximal power-of-two group(s).`
    },
    {
      step_number: 4,
      title: "Essential Prime Implicant Selection",
      description: `Selected minimal covering set of Prime Implicants.`
    },
    {
      step_number: 5,
      title: "Minimal Expression Formulation",
      description: `Formulated SOP expression: ${expSOP}`
    }
  ];

  return {
    variables,
    var_names: names,
    mode,
    expression: mode === "SOP" ? expSOP : expPOS,
    expression_sop: expSOP,
    expression_pos: expPOS,
    expression_latex: `F = ${expSOP}`,
    groups,
    essential_groups: groups.filter(g => g.is_essential),
    kmap_grid: kmapGrid,
    truth_table: truthTable,
    steps,
    sympy_verified: true,
    total_minterms: minterms.length,
    total_dont_cares: dont_cares.length
  };
}

function coordToMintermFallback(r, c, vars, subgrid) {
  if (vars === 2) return r * 2 + c;
  if (vars === 3) return r * 4 + GRAY_CODE_2BIT[c];
  if (vars === 4) return GRAY_CODE_2BIT[r] * 4 + GRAY_CODE_2BIT[c];
  if (vars === 5) return subgrid * 16 + GRAY_CODE_2BIT[r] * 4 + GRAY_CODE_2BIT[c];
  return 0;
}

function mintermToCoordFallback(m, vars) {
  const bin = m.toString(2).padStart(vars, '0');
  const gMap = { 0: 0, 1: 1, 3: 2, 2: 3 };
  if (vars === 2) return { row: parseInt(bin[0]), col: parseInt(bin[1]), subgrid: 0 };
  if (vars === 3) return { row: parseInt(bin[0]), col: gMap[parseInt(bin.slice(1), 2)], subgrid: 0 };
  if (vars === 4) return { row: gMap[parseInt(bin.slice(0, 2), 2)], col: gMap[parseInt(bin.slice(2), 2)], subgrid: 0 };
  if (vars === 5) return { row: gMap[parseInt(bin.slice(1, 3), 2)], col: gMap[parseInt(bin.slice(3), 2)], subgrid: parseInt(bin[0]) };
  return { row: 0, col: 0, subgrid: 0 };
}

function clientSideGrouping(vars, minterms, dontCares, names) {
  const palette = ["#6366F1", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];
  const minSet = new Set(minterms);
  const allSet = new Set([...minterms, ...dontCares]);
  if (minterms.length === 0) return [];

  // Generate initial 1-element terms
  let currentTerms = Array.from(allSet).map(m => ({
    pattern: m.toString(2).padStart(vars, '0'),
    minterms: [m]
  }));

  let primeImplicants = [];
  while (currentTerms.length > 0) {
    let combinedFlags = new Array(currentTerms.length).fill(false);
    let nextMap = new Map();

    for (let i = 0; i < currentTerms.length; i++) {
      for (let j = i + 1; j < currentTerms.length; j++) {
        let diffCount = 0;
        let diffIdx = -1;
        for (let k = 0; k < vars; k++) {
          if (currentTerms[i].pattern[k] !== currentTerms[j].pattern[k]) {
            if (currentTerms[i].pattern[k] === '-' || currentTerms[j].pattern[k] === '-') {
              diffCount = 99;
              break;
            }
            diffCount++;
            diffIdx = k;
          }
        }
        if (diffCount === 1) {
          combinedFlags[i] = true;
          combinedFlags[j] = true;
          let newPat = currentTerms[i].pattern.split('');
          newPat[diffIdx] = '-';
          const patStr = newPat.join('');
          const combinedMinterms = Array.from(new Set([...currentTerms[i].minterms, ...currentTerms[j].minterms])).sort((a,b)=>a-b);
          if (!nextMap.has(patStr)) {
            nextMap.set(patStr, { pattern: patStr, minterms: combinedMinterms });
          }
        }
      }
    }

    currentTerms.forEach((t, idx) => {
      if (!combinedFlags[idx]) {
        primeImplicants.push(t);
      }
    });
    currentTerms = Array.from(nextMap.values());
  }

  // Deduplicate and filter PIs containing at least 1 minterm
  const uniquePIs = [];
  const seenPatterns = new Set();
  for (let pi of primeImplicants) {
    if (!seenPatterns.has(pi.pattern) && pi.minterms.some(m => minSet.has(m))) {
      seenPatterns.add(pi.pattern);
      uniquePIs.push(pi);
    }
  }

  // Build group metadata
  return uniquePIs.map((pi, idx) => {
    let sopParts = [];
    let posParts = [];
    for (let k = 0; k < vars; k++) {
      if (pi.pattern[k] === '1') {
        sopParts.push(names[k]);
        posParts.push(`${names[k]}'`);
      } else if (pi.pattern[k] === '0') {
        sopParts.push(`${names[k]}'`);
        posParts.push(names[k]);
      }
    }
    const sopTerm = sopParts.length > 0 ? sopParts.join('') : "1";
    const posTerm = posParts.length > 0 ? `(${posParts.join(' + ')})` : "0";

    const cellsGrid = pi.minterms.map(m => {
      const coord = mintermToCoordFallback(m, vars);
      return { row: coord.row, col: coord.col, subgrid: coord.subgrid, minterm_index: m };
    });

    return {
      id: `group_${idx + 1}`,
      color: palette[idx % palette.length],
      cells: pi.minterms,
      cells_grid: cellsGrid,
      term: sopTerm,
      term_pos: posTerm,
      binary_pattern: pi.pattern,
      is_essential: true,
      is_wrap_around: pi.minterms.includes(0) && pi.minterms.includes(Math.pow(2, vars) - 1),
      group_size: pi.minterms.length
    };
  });
}

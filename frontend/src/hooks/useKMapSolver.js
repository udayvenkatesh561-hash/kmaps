import { useState, useEffect, useCallback } from 'react';
import { solveKMap } from '../services/api';
import { useHistory } from './useHistory';

export function useKMapSolver() {
  const [variables, setVariables] = useState(4);
  const [mintermsInput, setMintermsInput] = useState("0, 1, 2, 5, 7");
  const [dontCaresInput, setDontCaresInput] = useState("3");
  const [mode, setMode] = useState("SOP");
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredGroupId, setHoveredGroupId] = useState(null);
  const [activeTab, setActiveTab] = useState("kmap"); // "kmap", "truth_table", "steps"

  // Undo/Redo stacks
  const [historyStack, setHistoryStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const { addHistoryItem } = useHistory();

  // Helper to parse comma-separated text input into sorted integer array
  const parseInput = (str, maxLimit) => {
    if (!str || !str.trim()) return [];
    const tokens = str.split(/[\s,]+/).filter(Boolean);
    const nums = [];
    const invalid = [];

    for (let t of tokens) {
      if (!/^\d+$/.test(t)) {
        invalid.push(t);
        continue;
      }
      const val = parseInt(t, 10);
      if (val < 0 || val > maxLimit) {
        invalid.push(t);
      } else {
        nums.push(val);
      }
    }

    if (invalid.length > 0) {
      throw new Error(`Invalid or out-of-range value(s): ${invalid.join(', ')} (valid range for ${maxLimit + 1} states is 0..${maxLimit})`);
    }

    return Array.from(new Set(nums)).sort((a, b) => a - b);
  };

  const handleSolve = useCallback(async (overrides = {}) => {
    setLoading(true);
    setError(null);

    const numVars = overrides.variables !== undefined ? overrides.variables : variables;
    const mStr = overrides.mintermsInput !== undefined ? overrides.mintermsInput : mintermsInput;
    const dcStr = overrides.dontCaresInput !== undefined ? overrides.dontCaresInput : dontCaresInput;
    const curMode = overrides.mode !== undefined ? overrides.mode : mode;

    const maxLimit = Math.pow(2, numVars) - 1;

    try {
      const minterms = parseInput(mStr, maxLimit);
      const dontCares = parseInput(dcStr, maxLimit);

      // Check overlap
      const overlap = minterms.filter(m => dontCares.includes(m));
      if (overlap.length > 0) {
        throw new Error(`Minterms and Don't Cares cannot overlap: ${overlap.join(', ')}`);
      }

      const result = await solveKMap({
        variables: numVars,
        minterms,
        dont_cares: dontCares,
        mode: curMode
      });

      setSolution(result);
      addHistoryItem({
        variables: numVars,
        minterms,
        dont_cares: dontCares,
        expression: result.expression
      });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to solve K-Map");
    } finally {
      setLoading(false);
    }
  }, [variables, mintermsInput, dontCaresInput, mode, addHistoryItem]);

  // Initial solve on mount or when variables change
  useEffect(() => {
    handleSolve();
  }, [variables, mode]);

  // Push current state to undo stack before mutation
  const pushStateToHistory = () => {
    setHistoryStack(prev => [...prev, { variables, mintermsInput, dontCaresInput, mode }]);
    setRedoStack([]);
  };

  // Cell Click Toggle logic (0 -> 1 -> X -> 0)
  const toggleCell = (mintermIndex) => {
    pushStateToHistory();
    const maxLimit = Math.pow(2, variables) - 1;
    let minterms = [];
    let dontCares = [];

    try {
      minterms = parseInput(mintermsInput, maxLimit);
      dontCares = parseInput(dontCaresInput, maxLimit);
    } catch (e) {}

    const isM = minterms.includes(mintermIndex);
    const isDC = dontCares.includes(mintermIndex);

    let nextMinterms = [...minterms];
    let nextDontCares = [...dontCares];

    if (!isM && !isDC) {
      // 0 -> 1
      nextMinterms.push(mintermIndex);
    } else if (isM) {
      // 1 -> X
      nextMinterms = nextMinterms.filter(m => m !== mintermIndex);
      nextDontCares.push(mintermIndex);
    } else if (isDC) {
      // X -> 0
      nextDontCares = nextDontCares.filter(dc => dc !== mintermIndex);
    }

    nextMinterms.sort((a, b) => a - b);
    nextDontCares.sort((a, b) => a - b);

    const mStr = nextMinterms.join(', ');
    const dcStr = nextDontCares.join(', ');

    setMintermsInput(mStr);
    setDontCaresInput(dcStr);

    handleSolve({
      variables,
      mintermsInput: mStr,
      dontCaresInput: dcStr,
      mode
    });
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const last = historyStack[historyStack.length - 1];
    setRedoStack(prev => [...prev, { variables, mintermsInput, dontCaresInput, mode }]);
    setHistoryStack(prev => prev.slice(0, -1));

    setVariables(last.variables);
    setMintermsInput(last.mintermsInput);
    setDontCaresInput(last.dontCaresInput);
    setMode(last.mode);

    handleSolve(last);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistoryStack(prev => [...prev, { variables, mintermsInput, dontCaresInput, mode }]);
    setRedoStack(prev => prev.slice(0, -1));

    setVariables(next.variables);
    setMintermsInput(next.mintermsInput);
    setDontCaresInput(next.dontCaresInput);
    setMode(next.mode);

    handleSolve(next);
  };

  const loadExample = (example) => {
    pushStateToHistory();
    setVariables(example.variables);
    const mStr = (example.minterms || []).join(', ');
    const dcStr = (example.dont_cares || []).join(', ');
    setMintermsInput(mStr);
    setDontCaresInput(dcStr);
    setMode(example.mode || "SOP");

    handleSolve({
      variables: example.variables,
      mintermsInput: mStr,
      dontCaresInput: dcStr,
      mode: example.mode || "SOP"
    });
  };

  const resetForm = () => {
    pushStateToHistory();
    setMintermsInput("");
    setDontCaresInput("");
    handleSolve({ mintermsInput: "", dontCaresInput: "" });
  };

  return {
    variables,
    setVariables: (num) => {
      pushStateToHistory();
      setVariables(num);
      // Clamp inputs if needed
      setMintermsInput("");
      setDontCaresInput("");
    },
    mintermsInput,
    setMintermsInput,
    dontCaresInput,
    setDontCaresInput,
    mode,
    setMode: (m) => {
      pushStateToHistory();
      setMode(m);
    },
    solution,
    loading,
    error,
    hoveredGroupId,
    setHoveredGroupId,
    activeTab,
    setActiveTab,
    handleSolve,
    toggleCell,
    handleUndo,
    handleRedo,
    canUndo: historyStack.length > 0,
    canRedo: redoStack.length > 0,
    loadExample,
    resetForm
  };
}

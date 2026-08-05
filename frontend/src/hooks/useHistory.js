import { useState, useEffect } from 'react';

const HISTORY_KEY = 'kmap_solver_history_v1';
const MAX_HISTORY = 10;

export function useHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load calculation history:", e);
    }
  }, []);

  const addHistoryItem = (item) => {
    setHistory((prev) => {
      // Avoid duplicate consecutive entries
      const filtered = prev.filter(
        (h) =>
          !(
            h.variables === item.variables &&
            JSON.stringify(h.minterms) === JSON.stringify(item.minterms) &&
            JSON.stringify(h.dont_cares) === JSON.stringify(item.dont_cares)
          )
      );
      const newItem = {
        ...item,
        timestamp: new Date().toISOString(),
        id: `hist_${Date.now()}`
      };
      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save history:", e);
      }
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {}
  };

  return { history, addHistoryItem, clearHistory };
}

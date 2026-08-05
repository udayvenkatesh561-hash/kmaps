import React from 'react';
import { useKMapSolver } from '../hooks/useKMapSolver';
import { SolverForm } from '../components/SolverForm';
import { KMapGrid } from '../components/KMapGrid';
import { GroupLegend } from '../components/GroupLegend';
import { ExpressionCard } from '../components/ExpressionCard';
import { TruthTable } from '../components/TruthTable';
import { StepsCard } from '../components/StepsCard';
import { HistoryPanel } from '../components/HistoryPanel';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { LogicGateDiagram } from '../components/LogicGateDiagram';
import { Grid, Table, BookOpen, Sparkles } from 'lucide-react';

export function Solver() {
  const {
    variables,
    setVariables,
    varNames,
    setVarNames,
    mintermsInput,
    setMintermsInput,
    dontCaresInput,
    setDontCaresInput,
    mode,
    setMode,
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
    canUndo,
    canRedo,
    loadExample,
    resetForm
  } = useKMapSolver();

  const handleLoadHistory = (item) => {
    setVariables(item.variables);
    setMintermsInput((item.minterms || []).join(', '));
    setDontCaresInput((item.dont_cares || []).join(', '));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">

      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <span>K-Map Interactive Solver</span>
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
              {variables} Variables
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Click any cell on the matrix to toggle state live or enter minterms in the form.
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center space-x-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("kmap")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "kmap"
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <Grid className="w-4 h-4" />
            <span>K-Map Grid & Groups</span>
          </button>

          <button
            onClick={() => setActiveTab("truth_table")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "truth_table"
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <Table className="w-4 h-4" />
            <span>Truth Table</span>
          </button>

          <button
            onClick={() => setActiveTab("steps")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "steps"
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Steps</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* Left Column: Form & History (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <SolverForm
            variables={variables}
            setVariables={setVariables}
            varNames={varNames}
            setVarNames={setVarNames}
            mintermsInput={mintermsInput}
            setMintermsInput={setMintermsInput}
            dontCaresInput={dontCaresInput}
            setDontCaresInput={setDontCaresInput}
            mode={mode}
            setMode={setMode}
            handleSolve={handleSolve}
            error={error}
            resetForm={resetForm}
            handleUndo={handleUndo}
            handleRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            loadExample={loadExample}
          />

          <HistoryPanel onLoadItem={handleLoadHistory} />
        </div>

        {/* Right Column: Output Solutions & Visualizations (8 cols) */}
        <div className="lg:col-span-8 space-y-4">

          {/* Solution Card */}
          {solution && <ExpressionCard solution={solution} />}

          {/* Logic Gate Diagram - auto-generated below the simplified expression */}
          {solution && !loading && (
            <LogicGateDiagram
              expression={solution.mode === "SOP" ? solution.expression_sop : solution.expression_pos}
              varNames={solution.var_names || []}
            />
          )}

          {/* Loading Indicator */}
          {loading && <LoadingSpinner text="Computing optimal K-Map reduction..." />}

          {/* Active Tab View */}
          {solution && !loading && (
            <>
              {activeTab === "kmap" && (
                <div className="space-y-4">
                  <KMapGrid
                    kmapData={solution.kmap_grid}
                    groups={solution.groups}
                    hoveredGroupId={hoveredGroupId}
                    onToggleCell={toggleCell}
                  />

                  <GroupLegend
                    groups={solution.groups}
                    essentialGroups={solution.essential_groups}
                    hoveredGroupId={hoveredGroupId}
                    setHoveredGroupId={setHoveredGroupId}
                  />
                </div>
              )}

              {activeTab === "truth_table" && (
                <TruthTable
                  truthTable={solution.truth_table}
                  varNames={solution.var_names}
                />
              )}

              {activeTab === "steps" && (
                <StepsCard steps={solution.steps} />
              )}
            </>
          )}

        </div>

      </div>

    </div>
  );
}

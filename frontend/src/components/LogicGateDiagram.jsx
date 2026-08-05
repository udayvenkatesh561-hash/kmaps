import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  CircuitBoard,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Image as ImageIcon,
  PenLine,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BUBBLE_R,
  parseExpression,
  buildCircuit,
  layoutCircuit,
  computeGeometry,
  computeBounds,
  buildWires,
  wirePath,
} from '../utils/circuitEngine';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const BODY_PROPS = {
  stroke: '#E2E8F0',
  strokeWidth: 1.6,
  fill: 'rgba(15, 23, 42, 0.55)',
  strokeLinejoin: 'round',
  className: 'cgate',
};

export function LogicGateDiagram({ expression, varNames }) {
  const [input, setInput] = useState(expression || '');
  const [expr, setExpr] = useState(expression || '');
  const [showEditor, setShowEditor] = useState(false);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const svgRef = useRef(null);
  const contentRef = useRef(null);
  const dragRef = useRef(null);
  const patternId = useId().replace(/:/g, '');

  useEffect(() => {
    setInput(expression || '');
    setExpr(expression || '');
    setScale(1);
    setTx(0);
    setTy(0);
  }, [expression]);

  const result = useMemo(() => {
    if (!expr || !expr.trim()) return { ok: false, error: 'No Boolean expression provided.' };
    try {
      const { ast, vars } = parseExpression(expr);
      const circuit = buildCircuit(ast);
      const layout = layoutCircuit(circuit);
      const geoms = computeGeometry(circuit, layout.pos);
      const wires = buildWires(circuit, geoms);
      const bounds = computeBounds(circuit, geoms);
      return { ok: true, model: { circuit, geoms, wires, bounds, vars } };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, [expr]);

  const viewBox = result.ok ? result.model.bounds : null;
  const viewBoxString = viewBox
    ? `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
    : '0 0 100 100';

  // Wheel zoom (attached natively so preventDefault works)
  useEffect(() => {
    const el = svgRef.current;
    if (!el || !viewBox) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const pt = new DOMPoint(e.clientX - rect.left, e.clientY - rect.top);
      const ctm = el.getScreenCTM();
      if (!ctm) return;
      const user = pt.matrixTransform(ctm.inverse());
      const factor = e.deltaY < 0 ? 1.12 : 0.9;
      const ns = clamp(scale * factor, 0.25, 6);
      const ntx = user.x * scale + tx - user.x * ns;
      const nty = user.y * scale + ty - user.y * ns;
      setScale(ns);
      setTx(ntx);
      setTy(nty);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [viewBox, scale, tx, ty]);

  const onPointerDown = (e) => {
    const el = svgRef.current;
    if (!el) return;
    const ctm = el.getScreenCTM();
    dragRef.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, tx, ty, ctm };
    try { el.setPointerCapture(e.pointerId); } catch (_) { /* noop */ }
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d || !d.ctm) return;
    setTx(d.tx + (e.clientX - d.sx) / d.ctm.a);
    setTy(d.ty + (e.clientY - d.sy) / d.ctm.d);
  };

  const onPointerUp = () => { dragRef.current = null; };

  const zoomAtCenter = (factor) => {
    if (!viewBox) return;
    const cx = viewBox.x + viewBox.width / 2;
    const cy = viewBox.y + viewBox.height / 2;
    const ns = clamp(scale * factor, 0.25, 6);
    setScale(ns);
    setTx(cx * scale + tx - cx * ns);
    setTy(cy * scale + ty - cy * ns);
  };

  const resetView = () => { setScale(1); setTx(0); setTy(0); };

  // -------------------------------------------------------------------------
  // Diagram rendering helpers
  // -------------------------------------------------------------------------
  const renderWire = (w, i) => (
    <path
      key={i}
      d={wirePath(w)}
      fill="none"
      stroke="#94A3B8"
      strokeWidth="1.6"
      strokeLinejoin="round"
      className="cwire"
    />
  );

  const renderTerminal = (node, g) => {
    if (node.type === 'INPUT') {
      return (
        <g key={node.id}>
          <circle cx={g.x} cy={g.y} r="4" fill="#22D3EE" className="cterm-in" />
          <text
            x={g.x - 10}
            y={g.y + 4}
            textAnchor="end"
            fontSize="13"
            fontWeight="bold"
            fill="#E2E8F0"
            className="ctext"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          >
            {node.label}
          </text>
        </g>
      );
    }
    return (
      <g key={node.id}>
        <circle cx={g.x} cy={g.y} r="4" fill="#F59E0B" className="cterm-out" />
        <text
          x={g.x + 10}
          y={g.y + 4}
          textAnchor="start"
          fontSize="13"
          fontWeight="bold"
          fill="#E2E8F0"
          className="ctext"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          F
        </text>
      </g>
    );
  };

  const renderGate = (node, g) => {
    const { x, y, halfW, halfH } = g;
    const bubble = <circle cx={x + halfW + 3} cy={y} r={BUBBLE_R} fill="#E2E8F0" className="cbubble" />;
    const arcX = x - halfW * 0.25;
    let body = null;

    switch (node.type) {
      case 'AND':
      case 'NAND':
        body = (
          <g>
            <path
              d={`M ${x - halfW} ${y - halfH} L ${arcX} ${y - halfH} A ${halfW * 1.2} ${halfH} 0 0 1 ${arcX} ${y + halfH} L ${x - halfW} ${y + halfH} Z`}
              {...BODY_PROPS}
            />
            {node.type === 'NAND' && bubble}
          </g>
        );
        break;
      case 'OR':
      case 'NOR':
        body = (
          <g>
            <path
              d={`M ${x - halfW} ${y - halfH} Q ${x - halfW - 8} ${y} ${x - halfW} ${y + halfH} Q ${x + halfW * 0.4} ${y + halfH * 1.15} ${x + halfW} ${y} Q ${x + halfW * 0.4} ${y - halfH * 1.15} ${x - halfW} ${y - halfH} Z`}
              {...BODY_PROPS}
            />
            {node.type === 'NOR' && bubble}
          </g>
        );
        break;
      case 'XOR':
      case 'XNOR':
        body = (
          <g>
            <path
              d={`M ${x - halfW} ${y - halfH} Q ${x - halfW - 8} ${y} ${x - halfW} ${y + halfH} Q ${x + halfW * 0.4} ${y + halfH * 1.15} ${x + halfW} ${y} Q ${x + halfW * 0.4} ${y - halfH * 1.15} ${x - halfW} ${y - halfH} Z`}
              {...BODY_PROPS}
            />
            <path
              d={`M ${x - halfW - 13} ${y - halfH} Q ${x - halfW - 18} ${y} ${x - halfW - 13} ${y + halfH}`}
              {...BODY_PROPS}
            />
            {node.type === 'XNOR' && bubble}
          </g>
        );
        break;
      case 'NOT':
        body = (
          <g>
            <path d={`M ${x - halfW} ${y - halfH} L ${x + halfW} ${y} L ${x - halfW} ${y + halfH} Z`} {...BODY_PROPS} />
            {bubble}
          </g>
        );
        break;
      default:
        body = null;
    }

    const label = node.type === 'NOT' ? null : (
      <text
        x={x}
        y={y + halfH + 14}
        textAnchor="middle"
        fontSize="10"
        fill="#94A3B8"
        className="ctext-dim"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      >
        {node.label}
      </text>
    );

    return (
      <g key={node.id}>
        {body}
        {label}
      </g>
    );
  };

  const diagram = result.ok ? (
    <g className="km-content">
      {result.model.wires.map(renderWire)}
      {result.model.circuit.nodes.map((n) => {
        const g = result.model.geoms.get(n.id);
        if (n.type === 'INPUT' || n.type === 'OUT') return renderTerminal(n, g);
        return renderGate(n, g);
      })}
    </g>
  ) : null;

  // -------------------------------------------------------------------------
  // Export helpers
  // -------------------------------------------------------------------------
  const buildExportSvg = () => {
    if (!result.ok || !contentRef.current) return null;
    const b = result.model.bounds;
    const content = contentRef.current.innerHTML;
    const style = [
      '.km-export .cgate { stroke: #1E293B !important; fill: #FFFFFF !important; }',
      '.km-export .cwire { stroke: #475569 !important; }',
      '.km-export .cbubble { fill: #1E293B !important; stroke: none !important; }',
      '.km-export .ctext { fill: #1E293B !important; }',
      '.km-export .ctext-dim { fill: #64748B !important; }',
      '.km-export .cterm-in { fill: #0284C7 !important; }',
      '.km-export .cterm-out { fill: #F59E0B !important; }',
    ].join('\n');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${b.width}" height="${b.height}" viewBox="${b.x} ${b.y} ${b.width} ${b.height}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">`
      + `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="#FFFFFF"/>`
      + `<g class="km-svg km-export">${content}</g>`
      + `<style>${style}</style></svg>`;
  };

  const downloadSvg = () => {
    const svgStr = buildExportSvg();
    if (!svgStr) return;
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logic-circuit.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const downloadPng = () => {
    const svgStr = buildExportSvg();
    if (!svgStr) return;
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = result.model.bounds.width * 2;
      canvas.height = result.model.bounds.height * 2;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'logic-circuit.png';
      a.click();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); };
    img.src = url;
  };

  const handleGenerate = () => setExpr(input.trim());

  const controls = (
    <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
      <button
        onClick={() => zoomAtCenter(1.25)}
        title="Zoom in"
        className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        onClick={() => zoomAtCenter(0.8)}
        title="Zoom out"
        className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        onClick={resetView}
        title="Reset view"
        className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
      <span className="w-px h-4 bg-slate-700 mx-1" />
      <button
        onClick={downloadSvg}
        title="Download as SVG"
        className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
      >
        <Download className="w-4 h-4" />
      </button>
      <button
        onClick={downloadPng}
        title="Download as PNG"
        className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
    </div>
  );

  if (!expression) return null;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4 shadow-xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <CircuitBoard className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white">Logic Gate Circuit</h3>
            <p className="text-xs text-slate-400 font-mono truncate">
              F = {expr || '—'}
            </p>
          </div>
          {result.ok && (
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold shrink-0">
              {result.model.vars.length} {result.model.vars.length === 1 ? 'variable' : 'variables'}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEditor(!showEditor)}
            title="Edit expression"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all"
          >
            <PenLine className="w-3.5 h-3.5 text-cyan-400" />
            <span>Custom Expression</span>
            {showEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {controls}
        </div>
      </div>

      {/* Expression editor */}
      {showEditor && (
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Boolean Expression <span className="text-slate-500 font-normal lowercase">(optional override)</span>
          </label>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
              placeholder="F = A'B + AC + BC'"
              spellCheck={false}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={handleGenerate}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Generate Circuit
              </button>
              <button
                onClick={() => { setInput(expression || ''); setExpr(expression || ''); }}
                title="Restore simplified expression"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-mono leading-relaxed">
            Supports: A–Z variables (up to 6), &apos; (NOT), · or * (AND), + (OR), ^ (XOR),
            NAND, NOR, XNOR, parentheses, and constants 0/1.
          </p>
        </div>
      )}

      {/* Error state */}
      {!result.ok && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-3 text-red-300 text-sm">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Invalid Boolean Expression</span>
            <span>{result.error}</span>
          </div>
        </div>
      )}

      {/* Interactive diagram */}
      {result.ok && viewBox && (
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/70">
          <svg
            ref={svgRef}
            className="w-full block km-svg"
            style={{
              aspectRatio: `${viewBox.width} / ${viewBox.height}`,
              touchAction: 'none',
              cursor: 'grab',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
            viewBox={viewBoxString}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <defs>
              <pattern id={`grid-${patternId}`} width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="1.3" cy="1.3" r="1.1" fill="#475569" fillOpacity="0.4" />
              </pattern>
            </defs>
            <g className="km-viewport" transform={`translate(${tx} ${ty}) scale(${scale})`}>
              <rect
                x={viewBox.x}
                y={viewBox.y}
                width={viewBox.width}
                height={viewBox.height}
                fill={`url(#grid-${patternId})`}
                pointerEvents="none"
              />
              {diagram}
            </g>
          </svg>

          {/* Zoom readout */}
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-400 pointer-events-none">
            {Math.round(scale * 100)}%
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>Scroll to zoom · Drag to pan · Inputs on the left, output (F) on the right.</span>
        <span className="font-mono">IEEE / ANSI gate symbols</span>
      </div>

    </div>
  );
}

/**
 * Digital Logic Circuit Layout Engine
 *
 * Converts a gate netlist into positioned SVG-ready geometry:
 *  - Layered columns (inputs on the left, output on the right).
 *  - Barycenter ordering + row assignment to keep wires short and tidy.
 *  - Orthogonal wire routing on gate-free tracks and column streets so wires
 *    never overlap gate bodies.
 */

const COLUMN_WIDTH = 150;
const ROW_HEIGHT = 84;
const MARGIN = 48;
const GATE_WIDTH = 92;
const GATE_HEIGHT = 54;
const TERMINAL_WIDTH = 26;

export const GATE_COLORS = {
  not: '#0891b2',
  and: '#4f46e5',
  or: '#7c3aed',
  xor: '#0d9488',
  nand: '#4f46e5',
  nor: '#7c3aed',
  xnor: '#0d9488',
};

export const IEEE_LABELS = {
  not: '1',
  and: '&',
  or: '≥1',
  xor: '=1',
  nand: '&',
  nor: '≥1',
  xnor: '=1',
};

export const GATE_NAMES = {
  not: 'NOT',
  and: 'AND',
  or: 'OR',
  xor: 'XOR',
  nand: 'NAND',
  nor: 'NOR',
  xnor: 'XNOR',
};

/**
 * Returns the SVG geometry for a gate symbol drawn in a box
 * (x, cy - h/2) -> (x + w, cy + h/2).
 */
export function gateGeometry(type, x, cy, w, h) {
  const y0 = cy - h / 2;
  const bubbleR = 3.6;

  switch (type) {
    case 'not': {
      const tw = 30;
      const tx = x + (w - tw) / 2;
      const bubbleX = tx + tw + bubbleR;
      return {
        shape: `M ${tx} ${y0} L ${tx + tw} ${cy} L ${tx} ${y0 + h} Z`,
        bubble: true,
        bubbleX,
        bubbleY: cy,
        bubbleR,
        inX: tx,
        outX: bubbleX + bubbleR,
        labelX: x + w / 2,
        labelY: cy,
      };
    }

    case 'and':
    case 'nand': {
      const halfW = w * 0.5;
      return {
        shape: `M ${x} ${y0} L ${x + halfW} ${y0} A ${halfW} ${h / 2} 0 0 1 ${x + halfW} ${y0 + h} L ${x} ${y0 + h} Z`,
        bubble: type === 'nand',
        bubbleX: x + halfW,
        bubbleY: cy,
        bubbleR,
        inX: x + 2,
        outX: x + halfW + (type === 'nand' ? bubbleR * 2 : 0),
        labelX: x + w * 0.34,
        labelY: cy,
      };
    }

    case 'or':
    case 'nor': {
      const shape = [
        `M ${x + 6} ${y0}`,
        `C ${x + w * 0.4} ${y0} ${x + w} ${y0} ${x + w} ${cy}`,
        `C ${x + w} ${y0 + h} ${x + w * 0.4} ${y0 + h} ${x + 6} ${y0 + h}`,
        `C ${x + 6 + w * 0.12} ${y0 + h * 0.74} ${x + 6 + w * 0.12} ${y0 + h * 0.26} ${x + 6} ${y0}`,
        'Z',
      ].join(' ');
      return {
        shape,
        bubble: type === 'nor',
        bubbleX: x + w,
        bubbleY: cy,
        bubbleR,
        inX: x + 6,
        outX: x + w + (type === 'nor' ? bubbleR * 2 : 0),
        labelX: x + w * 0.45,
        labelY: cy,
      };
    }

    case 'xor':
    case 'xnor': {
      const off = 10;
      const x0 = x + off;
      const shape = [
        `M ${x} ${y0} Q ${x + 8} ${cy} ${x} ${y0 + h}`,
        `M ${x0 + 6} ${y0}`,
        `C ${x0 + w * 0.4} ${y0} ${x0 + w} ${y0} ${x0 + w} ${cy}`,
        `C ${x0 + w} ${y0 + h} ${x0 + w * 0.4} ${y0 + h} ${x0 + 6} ${y0 + h}`,
        `C ${x0 + 6 + w * 0.12} ${y0 + h * 0.74} ${x0 + 6 + w * 0.12} ${y0 + h * 0.26} ${x0 + 6} ${y0}`,
        'Z',
      ].join(' ');
      return {
        shape,
        bubble: type === 'xnor',
        bubbleX: x0 + w,
        bubbleY: cy,
        bubbleR,
        inX: x0 + 6,
        outX: x0 + w + (type === 'xnor' ? bubbleR * 2 : 0),
        labelX: x0 + w * 0.38,
        labelY: cy,
      };
    }

    default:
      return { shape: '', bubble: false, inX: x, outX: x + w, labelX: x + w / 2, labelY: cy };
  }
}

function gateInputPinY(cy, h, index, total) {
  return cy + h * ((index + 1) / (total + 1) - 0.5);
}

/**
 * Computes a complete renderable layout for a netlist.
 *
 * @param {{ nets: Map, gates: Array, inputs: string[], consts: string[], output: string }} netlist
 * @returns {object} layout
 */
export function computeCircuitLayout(netlist) {
  const { nets, gates, inputs, consts, output } = netlist;
  const gatesById = new Map(gates.map((g) => [g.id, g]));

  // --- Reachable pruning (keep only nets that actually affect the output) ---
  const used = new Set([output]);
  const queue = [output];
  while (queue.length) {
    const id = queue.pop();
    const node = nets.get(id);
    if (node && node.kind === 'gate') {
      const g = gatesById.get(node.gateId);
      if (g) {
        for (const inp of g.inputs) {
          if (!used.has(inp)) {
            used.add(inp);
            queue.push(inp);
          }
        }
      }
    }
  }

  const activeGates = gates.filter((g) => used.has(g.output));
  const activeInputs = inputs.filter((id) => used.has(id));
  const activeConsts = consts.filter((id) => used.has(id));

  // --- Layer assignment (topological depth) ---
  const netLayer = new Map();
  for (const id of [...activeInputs, ...activeConsts]) netLayer.set(id, 0);

  let changed = true;
  while (changed) {
    changed = false;
    for (const g of activeGates) {
      let L = 0;
      for (const inp of g.inputs) L = Math.max(L, netLayer.get(inp) || 0);
      const newL = L + 1;
      if ((netLayer.get(g.output) || 0) !== newL) {
        netLayer.set(g.output, newL);
        changed = true;
      }
    }
  }

  let maxLayer = 0;
  for (const g of activeGates) maxLayer = Math.max(maxLayer, netLayer.get(g.output) || 0);

  // layers store gate OUTPUT net ids so every coordinate map stays net-keyed
  const layers = Array.from({ length: maxLayer + 1 }, () => []);
  for (const g of activeGates) layers[netLayer.get(g.output)].push(g.output);

  const layerIndex = new Map();
  const inputList = [...activeInputs, ...activeConsts];
  inputList.forEach((id, idx) => layerIndex.set(id, idx));
  const refreshGateIndexes = () => {
    layers.forEach((ids) => ids.forEach((id, idx) => layerIndex.set(id, idx)));
  };
  refreshGateIndexes();

  // Consumers map (net -> output net ids of gates reading it) for backward sweeps
  const consumers = new Map();
  for (const g of activeGates) {
    for (const inp of g.inputs) {
      if (!consumers.has(inp)) consumers.set(inp, []);
      consumers.get(inp).push(g.output);
    }
  }

  const finalGateNet = nets.get(output) && nets.get(output).kind === 'gate' ? output : null;

  function baryCenter(netId, dir) {
    const g = gatesById.get(nets.get(netId).gateId);
    const L = netLayer.get(g.output);
    let sum = 0;
    let count = 0;

    if (dir === 'left') {
      for (const inp of g.inputs) {
        if (netLayer.get(inp) === L - 1) {
          sum += layerIndex.get(inp) || 0;
          count += 1;
        }
      }
    } else {
      const cons = consumers.get(g.output) || [];
      for (const c of cons) {
        if (netLayer.get(c) === L + 1) {
          sum += layerIndex.get(c) || 0;
          count += 1;
        }
      }
      if (g.output === output) {
        sum += finalGateNet ? layerIndex.get(finalGateNet) || 0 : 0;
        count += 1;
      }
    }

    return count ? sum / count : 0;
  }

  // --- Crossing-minimisation sweeps ---
  for (let iter = 0; iter < 10; iter += 1) {
    if (iter % 2 === 0) {
      for (let L = 1; L <= maxLayer; L += 1) {
        const ids = layers[L];
        ids.sort((a, b) => {
          const ba = baryCenter(a, 'left');
          const bb = baryCenter(b, 'left');
          if (ba !== bb) return ba - bb;
          return a.localeCompare(b);
        });
      }
    } else {
      for (let L = maxLayer - 1; L >= 1; L -= 1) {
        const ids = layers[L];
        ids.sort((a, b) => {
          const ba = baryCenter(a, 'right');
          const bb = baryCenter(b, 'right');
          if (ba !== bb) return ba - bb;
          return a.localeCompare(b);
        });
      }
    }
    refreshGateIndexes();
  }

  // --- Row assignment (keeps gates near their driving inputs) ---
  const centerY = new Map();
  let maxBottom = 0;

  for (let L = 0; L <= maxLayer; L += 1) {
    const ids = L === 0 ? inputList : layers[L];
    let nextSlot = 0;

    for (const id of ids) {
      let target = 0;
      let count = 0;

      if (L > 0) {
        const g = gatesById.get(nets.get(id).gateId);
        for (const inp of g.inputs) {
          if (netLayer.get(inp) === L - 1) {
            target += centerY.get(inp) || 0;
            count += 1;
          }
        }
        if (count) target /= count;
      }

      const slot = Math.max(nextSlot, Math.round(target / ROW_HEIGHT));
      const cy = slot * ROW_HEIGHT + ROW_HEIGHT / 2;
      centerY.set(id, cy);
      nextSlot = slot + 1;
      maxBottom = Math.max(maxBottom, (slot + 1) * ROW_HEIGHT);
    }
  }

  // --- X coordinates ---
  const colX = (layer) => MARGIN + layer * COLUMN_WIDTH;

  const inputGeom = inputList.map((id) => {
    const node = nets.get(id);
    return {
      netId: id,
      label: node.label,
      kind: node.kind,
      x: colX(0),
      y: centerY.get(id) - 10,
      w: TERMINAL_WIDTH,
      h: 20,
      cy: centerY.get(id),
    };
  });

  const gateGeom = activeGates.map((g) => {
    const cy = centerY.get(g.output);
    const x = colX(netLayer.get(g.output));
    const geom = gateGeometry(g.type, x, cy, GATE_WIDTH, GATE_HEIGHT);
    return {
      id: g.id,
      type: g.type,
      x,
      cy,
      w: GATE_WIDTH,
      h: GATE_HEIGHT,
      y: cy - GATE_HEIGHT / 2,
      inputs: g.inputs,
      output: g.output,
      geom,
      color: GATE_COLORS[g.type],
      label: IEEE_LABELS[g.type],
      name: GATE_NAMES[g.type],
    };
  });

  const gateByIdGeom = new Map(gateGeom.map((g) => [g.id, g]));

  // --- Wire routing ---
  // Horizontal segments travel only on gate-free tracks (y = rowCy +/- TRACK_OFFSET,
  // which always falls inside the gap between gate bodies), and vertical segments
  // only inside column "streets" (the x-gaps between columns), so no wire ever
  // crosses a gate body.
  const wires = [];
  let wireId = 0;

  const streetX = (layer) => (layer === 0 ? MARGIN + TERMINAL_WIDTH : colX(layer) + GATE_WIDTH);

  const nodeOutputX = (netId) => {
    if (nets.get(netId).kind === 'gate') {
      return gateByIdGeom.get(nets.get(netId).gateId).geom.outX;
    }
    const inp = inputGeom.find((n) => n.netId === netId);
    return inp ? inp.x + inp.w : MARGIN;
  };

  const nodeCenterY = (netId) => {
    if (nets.get(netId).kind === 'gate') {
      return gateByIdGeom.get(nets.get(netId).gateId).cy;
    }
    const inp = inputGeom.find((n) => n.netId === netId);
    return inp ? inp.cy : 0;
  };

  // per-net fan-out counter so parallel wires fan out across a street instead of
  // overlaying each other exactly
  const fanIndex = new Map();
  const nextFanIndex = (netId) => {
    const i = fanIndex.get(netId) || 0;
    fanIndex.set(netId, i + 1);
    return i;
  };

  // gate-free horizontal track near a row centre; each row hands out lanes so
  // parallel wires in the same band spread across the free strip instead of
  // overlaying (offsets 35/43/51 all stay inside the gate-free band [cy+27, cy+57])
  const slotLane = new Map();
  const nearestTrack = (y) => {
    const slot = Math.round((y - ROW_HEIGHT / 2) / ROW_HEIGHT);
    const cy = slot * ROW_HEIGHT + ROW_HEIGHT / 2;
    const key = `s${slot}`;
    const lane = slotLane.get(key) || 0;
    slotLane.set(key, lane + 1);
    const offset = ROW_HEIGHT / 2 - 7 + (lane % 3) * 8;
    const above = cy - offset;
    const below = cy + offset;
    return Math.abs(y - above) <= Math.abs(y - below) ? above : below;
  };

  for (const g of gateGeom) {
    const n = g.inputs.length;
    const tLayer = netLayer.get(g.output);
    g.inputs.forEach((inp, index) => {
      const srcX = nodeOutputX(inp);
      const srcY = nodeCenterY(inp);
      const pinY = gateInputPinY(g.cy, GATE_HEIGHT, index, n);
      const srcLayer = nets.get(inp).kind === 'gate' ? netLayer.get(inp) : 0;
      const fan = nextFanIndex(inp);

      // vertical run just inside the street right of the source's column
      const xV = Math.max(streetX(srcLayer) + 2, srcX + 2) + (fan % 4) * 4;
      // vertical run just inside the street left of the target's column
      const xT = colX(tLayer) - 4 - (fan % 4) * 4;
      // gate-free horizontal track roughly halfway between source and target
      const yT = nearestTrack((srcY + pinY) / 2);

      const d = `M ${srcX} ${srcY} L ${xV} ${srcY} L ${xV} ${yT} L ${xT} ${yT} L ${xT} ${pinY} L ${g.geom.inX} ${pinY}`;
      wires.push({
        id: `wire_${wireId++}`,
        d,
        source: inp,
        target: g.id,
        fromX: srcX,
        fromY: srcY,
        toX: g.geom.inX,
        toY: pinY,
      });
    });
  }

  // --- Output terminal ---
  const termX = colX(maxLayer + 1);
  const termCy = finalGateNet ? centerY.get(finalGateNet) : centerY.get(output);
  const srcX = nodeOutputX(output);
  const srcY = nodeCenterY(output);

  const outputTerminal = {
    netId: output,
    x: termX,
    cy: termCy,
    y: termCy - 10,
    w: TERMINAL_WIDTH,
    h: 20,
    wire: {
      id: `wire_out`,
      d: `M ${srcX} ${srcY} L ${termX} ${termCy}`,
      source: output,
      target: 'output',
      fromX: srcX,
      fromY: srcY,
      toX: termX,
      toY: termCy,
    },
  };

  const width = termX + TERMINAL_WIDTH + MARGIN;
  const height = Math.max(maxBottom, (termCy || 0) + MARGIN) + MARGIN;

  return {
    gates: gateGeom,
    inputs: inputGeom.filter((n) => n.kind === 'input'),
    consts: inputGeom.filter((n) => n.kind === 'const'),
    wires,
    output: outputTerminal,
    width,
    height,
    varNames: netlist.varNames || [],
  };
}

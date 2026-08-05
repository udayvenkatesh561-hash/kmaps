// CircuitEngine: Boolean-expression parser, logic-gate circuit builder,
// and layered layout engine used to render K-Map solutions as gate diagrams.

export const MAX_VARIABLES = 6;

const GW = 64;          // AND/OR/XOR body width
const NOT_W = 46;       // NOT / buffer body width
const GH_BASE = 46;     // minimum gate body height
const PIN_SPACING = 24; // vertical distance between input pins
const COL_W = 170;      // horizontal distance between layout columns
const ROW_GAP = 40;     // minimum vertical distance between node rows
const PAD_X = 90;       // left/right padding
const PAD_Y = 50;       // top padding
export const BUBBLE_R = 3.4; // radius of inversion bubbles

const KEYWORDS = {
  AND: 'AND',
  OR: 'OR',
  XOR: 'XOR',
  NAND: 'NAND',
  NOR: 'NOR',
  XNOR: 'XNOR',
  NOT: 'NOT',
};

const startsFactor = (t) => t === 'VAR' || t === 'CONST' || t === 'LPAREN' || t === 'NOT';

const binPrec = (t) => {
  switch (t) {
    case 'OR': return 1;
    case 'XOR': return 2;
    case 'NOR': return 3;
    case 'XNOR': return 3;
    case 'NAND': return 4;
    case 'AND': return 5;
    default: return null;
  }
};

function stripHeader(s) {
  // Strip optional "F" / "F(A,B,C)" followed by "=" or ":"
  return s.replace(/^(?:[A-Za-z][A-Za-z0-9]*\s*(?:\([^)]*\))?\s*[=:]\s*)/, '').trim();
}

function tokenize(input) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    const c = input[i];
    if (/\s/.test(c)) { i += 1; continue; }
    if (c === '(') { tokens.push({ type: 'LPAREN' }); i += 1; continue; }
    if (c === ')') { tokens.push({ type: 'RPAREN' }); i += 1; continue; }
    if (c === "'") { tokens.push({ type: 'PRIME' }); i += 1; continue; }
    if (c === '~' || c === '!') { tokens.push({ type: 'NOT' }); i += 1; continue; }
    if (c === '+') { tokens.push({ type: 'OR' }); i += 1; continue; }
    if (c === '*' || c === '·' || c === '&' || c === '.') { tokens.push({ type: 'AND' }); i += 1; continue; }
    if (c === '^' || c === '⊕' || c === '⊻') { tokens.push({ type: 'XOR' }); i += 1; continue; }
    if (/[A-Za-z]/.test(c)) {
      let run = '';
      while (i < input.length && /[A-Za-z]/.test(input[i])) { run += input[i]; i += 1; }
      const up = run.toUpperCase();
      if (KEYWORDS[up]) {
        tokens.push({ type: KEYWORDS[up] });
      } else if (run.length === 1) {
        tokens.push({ type: 'VAR', name: up });
      } else {
        // e.g. "AC" => A AND C (implicit product)
        for (let k = 0; k < run.length; k += 1) {
          if (k > 0) tokens.push({ type: 'AND' });
          tokens.push({ type: 'VAR', name: run[k].toUpperCase() });
        }
      }
      continue;
    }
    if (c === '0' || c === '1') { tokens.push({ type: 'CONST', value: c }); i += 1; continue; }
    throw new Error(`Invalid character "${c}" near position ${i + 1}.`);
  }
  tokens.push({ type: 'EOF' });
  return tokens;
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() { return this.tokens[this.pos]; }
  next() { return this.tokens[this.pos++]; }
  match(type) { if (this.peek().type === type) return this.next(); return null; }

  parse() {
    const node = this.parseBinary(0);
    const t = this.peek();
    if (t.type !== 'EOF') throw new Error(`Unexpected token after position ${this.pos + 1}.`);
    return node;
  }

  parseBinary(minPrec) {
    let left = this.parseUnary();
    while (true) {
      const t = this.peek();
      const prec = binPrec(t.type);
      if (prec !== null && prec >= minPrec) {
        this.next();
        const right = this.parseBinary(prec + 1);
        left = { type: t.type, args: [left, right] };
        continue;
      }
      // Implicit AND (juxtaposition) binds with AND precedence
      if (startsFactor(t.type) && 5 >= minPrec) {
        const right = this.parseBinary(6);
        left = { type: 'AND', args: [left, right] };
        continue;
      }
      break;
    }
    return left;
  }

  parseUnary() {
    const t = this.next();
    let node;
    if (t.type === 'NOT') {
      node = { type: 'NOT', arg: this.parseUnary() };
    } else if (t.type === 'LPAREN') {
      node = this.parseBinary(0);
      if (!this.match('RPAREN')) throw new Error('Missing closing parenthesis ")".');
    } else if (t.type === 'VAR') {
      node = { type: 'VAR', name: t.name };
    } else if (t.type === 'CONST') {
      node = { type: 'CONST', value: t.value };
    } else {
      throw new Error('Expected a variable, constant, parenthesis, or NOT operator.');
    }
    while (this.peek().type === 'PRIME') {
      this.next();
      node = { type: 'NOT', arg: node };
    }
    return node;
  }
}

function collectVariables(node, set = new Set()) {
  if (node.type === 'VAR') set.add(node.name);
  else if (node.type === 'NOT') collectVariables(node.arg, set);
  else if (node.args) node.args.forEach((a) => collectVariables(a, set));
  return Array.from(set);
}

export function parseExpression(raw) {
  const cleaned = stripHeader(String(raw || '').trim());
  if (!cleaned) throw new Error('The Boolean expression is empty.');
  const tokens = tokenize(cleaned);
  const ast = new Parser(tokens).parse();
  const vars = collectVariables(ast);
  if (vars.length > MAX_VARIABLES) {
    throw new Error(
      `This feature supports up to ${MAX_VARIABLES} variables, but the expression uses ${vars.length} (${vars.join(', ')}).`
    );
  }
  return { ast, vars };
}

// ---------------------------------------------------------------------------
// Circuit builder: converts an AST into a DAG of input nodes and logic gates.
// Shared sub-expressions are reused so complemented variables get a single NOT.
// Chains of associative gates (AND/OR/XOR) are flattened into multi-input gates.
// ---------------------------------------------------------------------------
const ASSOCIATIVE = new Set(['AND', 'OR', 'XOR']);

function flattenAssociative(node) {
  if (node.type === 'NOT') {
    node.arg = flattenAssociative(node.arg);
    return node;
  }
  if (node.args) {
    const args = [];
    for (const a of node.args) {
      const fa = flattenAssociative(a);
      if (fa.type === node.type && ASSOCIATIVE.has(node.type)) args.push(...fa.args);
      else args.push(fa);
    }
    node.args = args;
  }
  return node;
}

export function buildCircuit(ast) {
  const root = flattenAssociative(ast);
  const nodes = [];
  const inputByName = new Map();
  const cache = new Map();

  const keyOf = (node) => {
    if (node.type === 'VAR') return `v:${node.name}`;
    if (node.type === 'CONST') return `c:${node.value}`;
    if (node.type === 'NOT') return `not(${keyOf(node.arg)})`;
    return `${node.type.toLowerCase()}(${node.args.map(keyOf).join(',')})`;
  };

  const makeInput = (name, label) => {
    if (inputByName.has(name)) return inputByName.get(name);
    const n = { id: `in_${name}`, type: 'INPUT', label, inputs: [], fans: [] };
    inputByName.set(name, n.id);
    nodes.push(n);
    return n.id;
  };

  const makeGate = (type, inputIds) => {
    const n = { id: `g_${nodes.length}`, type, label: type, inputs: inputIds, fans: [] };
    nodes.push(n);
    return n.id;
  };

  const visit = (node) => {
    const key = keyOf(node);
    if (cache.has(key)) return cache.get(key);
    let id;
    if (node.type === 'VAR') id = makeInput(node.name, node.name);
    else if (node.type === 'CONST') id = makeInput(node.value === '1' ? 'CONST1' : 'CONST0', node.value);
    else if (node.type === 'NOT') {
      const a = visit(node.arg);
      id = makeGate('NOT', [a]);
    } else {
      const a = node.args.map(visit);
      id = makeGate(node.type, a);
    }
    cache.set(key, id);
    return id;
  };

  const outputId = visit(root);
  nodes.push({ id: 'out', type: 'OUT', label: 'F', inputs: [outputId], fans: [] });

  const idIndex = new Map(nodes.map((n) => [n.id, n]));
  for (const n of nodes) {
    for (const i of n.inputs) {
      const s = idIndex.get(i);
      if (s) s.fans.push(n.id);
    }
  }

  return { nodes, idIndex };
}

// ---------------------------------------------------------------------------
// Layout engine: assigns columns by logic depth and rows by a barycenter
// heuristic (a simplified Sugiyama pass) to keep wiring compact and clean.
// ---------------------------------------------------------------------------
function bodyHeight(n) {
  if (n.type === 'INPUT' || n.type === 'OUT') return 0;
  if (n.type === 'NOT') return 40;
  return Math.max(GH_BASE, (n.inputs.length - 1) * PIN_SPACING + 26);
}

const avg = (vals) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);

export function layoutCircuit(circuit) {
  const { nodes } = circuit;
  const levelMap = new Map();
  const levels = [[]];

  for (const n of nodes) {
    if (n.type === 'INPUT') n.level = 0;
    else {
      let mx = 0;
      for (const s of n.inputs) mx = Math.max(mx, levelMap.get(s) ?? 0);
      n.level = mx + 1;
    }
    levelMap.set(n.id, n.level);
    if (!levels[n.level]) levels[n.level] = [];
    levels[n.level].push(n);
  }
  const maxLevel = levels.length - 1;

  let maxBody = 0;
  for (const n of nodes) maxBody = Math.max(maxBody, bodyHeight(n));
  const rowGap = Math.max(ROW_GAP, maxBody + 34);

  const pos = new Map();
  levels[0].forEach((n, i) => pos.set(n.id, { y: PAD_Y + i * rowGap }));

  const assignRow = (list) => {
    const desired = list.map((n) => avg(n.inputs.map((s) => pos.get(s)?.y ?? PAD_Y)));
    const order = list.map((_, i) => i).sort((a, b) => desired[a] - desired[b] || a - b);
    const sorted = order.map((i) => list[i]);
    const mean = avg(order.map((i) => desired[i]));
    const startY = mean - ((sorted.length - 1) * rowGap) / 2;
    sorted.forEach((n, idx) => pos.set(n.id, { y: startY + idx * rowGap }));
  };

  const assignRowByChildren = (list) => {
    const desired = list.map((n) => {
      const ys = (n.fans || []).map((f) => pos.get(f)?.y).filter((v) => v !== undefined);
      return ys.length ? avg(ys) : (pos.get(n.id)?.y ?? PAD_Y);
    });
    const order = list.map((_, i) => i).sort((a, b) => desired[a] - desired[b] || a - b);
    const sorted = order.map((i) => list[i]);
    const mean = avg(order.map((i) => desired[i]));
    const startY = mean - ((sorted.length - 1) * rowGap) / 2;
    sorted.forEach((n, idx) => pos.set(n.id, { y: startY + idx * rowGap }));
  };

  for (const direction of [1, -1, 1]) {
    if (direction === 1) {
      for (let L = 1; L <= maxLevel; L += 1) assignRow(levels[L]);
    } else {
      for (let L = maxLevel - 1; L >= 1; L -= 1) assignRowByChildren(levels[L]);
    }
  }

  for (const n of nodes) {
    const y = pos.get(n.id).y;
    const x = PAD_X + n.level * COL_W;
    pos.set(n.id, { x, y });
  }

  return { pos, maxLevel };
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------
function nodeGeom(node, x, y) {
  if (node.type === 'INPUT') {
    return { x, y, halfW: 0, halfH: 0, inputs: [], output: { x, y } };
  }
  if (node.type === 'OUT') {
    return { x, y, halfW: 0, halfH: 0, inputs: [{ x, y }], output: { x, y } };
  }
  const isNot = node.type === 'NOT';
  const w = isNot ? NOT_W : GW;
  const n = node.inputs.length;
  const h = bodyHeight(node);
  const halfW = w / 2;
  const halfH = h / 2;
  const hasBubble = ['NAND', 'NOR', 'XNOR', 'NOT'].includes(node.type);
  const inputPts = node.inputs.map((_, i) => ({
    x: x - halfW,
    y: y + (n === 1 ? 0 : (i - (n - 1) / 2) * PIN_SPACING),
  }));
  const outX = x + halfW + (hasBubble ? BUBBLE_R * 2 + 1 : 0);
  return { x, y, halfW, halfH, hasBubble, inputs: inputPts, output: { x: outX, y } };
}

export function computeGeometry(circuit, pos) {
  const geoms = new Map();
  for (const n of circuit.nodes) {
    const p = pos.get(n.id);
    geoms.set(n.id, nodeGeom(n, p.x, p.y));
  }
  return geoms;
}

export function computeBounds(circuit, geoms) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of circuit.nodes) {
    const g = geoms.get(n.id);
    if (n.type === 'INPUT') {
      minX = Math.min(minX, g.x - 46);
      maxX = Math.max(maxX, g.x + 8);
    } else if (n.type === 'OUT') {
      minX = Math.min(minX, g.x - 8);
      maxX = Math.max(maxX, g.x + 44);
    } else {
      minX = Math.min(minX, g.x - g.halfW - 16);
      maxX = Math.max(maxX, g.x + g.halfW + 16);
    }
    minY = Math.min(minY, g.y - g.halfH - 16);
    maxY = Math.max(maxY, g.y + g.halfH + 16);
  }
  const pad = 26;
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}

// ---------------------------------------------------------------------------
// Wiring: orthogonal (Manhattan) routing with per-pin stagger so no two wires
// share a coincident segment. Fan-out trunks are intentionally shared (junction).
// ---------------------------------------------------------------------------
export function buildWires(circuit, geoms) {
  const wires = [];
  for (const n of circuit.nodes) {
    n.inputs.forEach((srcId, i) => {
      const s = geoms.get(srcId);
      const d = geoms.get(n.id);
      wires.push({
        sx: s.output.x,
        sy: s.output.y,
        dx: d.inputs[i].x,
        dy: d.inputs[i].y,
        pinIndex: i,
      });
    });
  }
  return wires;
}

export function wirePath(w) {
  const { sx, sy, dx, dy, pinIndex } = w;
  if (dx - 6 <= sx) return `M ${sx} ${sy} L ${dx} ${dy}`;
  let bendX = dx - 16 - (pinIndex % 8) * 11;
  if (bendX <= sx + 4) bendX = sx + 10 + (pinIndex % 5) * 6;
  return `M ${sx} ${sy} H ${bendX} V ${dy} H ${dx}`;
}

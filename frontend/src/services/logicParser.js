/**
 * Boolean Expression Parser + Circuit Netlist Builder
 *
 * Supports: NOT (' / ! / ~ / NOT), AND (juxtaposition / · / * / . / & / AND),
 * OR (+ / ∨ / OR), XOR (⊕ / ^ / XOR), NAND (↑ / NAND), NOR (↓ / NOR),
 * XNOR (⊙ / ↔ / XNOR), parentheses and constants 0 / 1.
 *
 * Inputs may include a leading "F = " prefix which is stripped automatically.
 * A maximum of MAX_VARS distinct variables is allowed.
 */

export const MAX_VARS = 6;

const WORD_OPERATORS = {
  AND: 'AND',
  NAND: 'NAND',
  OR: 'OR',
  NOR: 'NOR',
  XOR: 'XOR',
  XNOR: 'XNOR',
  NOT: 'NOT',
};

const SYMBOL_TOKENS = {
  '·': 'AND',
  '*': 'AND',
  '∧': 'AND',
  '&': 'AND',
  '.': 'AND',
  '+': 'OR',
  '∨': 'OR',
  '⊕': 'XOR',
  '^': 'XOR',
  '↑': 'NAND',
  '↓': 'NOR',
  '⊙': 'XNOR',
  '↔': 'XNOR',
  '~': 'NOT_PRE',
  '!': 'NOT_PRE',
  '¬': 'NOT_PRE',
  "'": 'NOT_POST',
  '’': 'NOT_POST',
  '`': 'NOT_POST',
  '(': 'LPAREN',
  ')': 'RPAREN',
};

function tokenize(input) {
  const cleaned = String(input || '')
    .trim()
    .replace(/^[A-Za-z]\s*=\s*/, '');

  if (!cleaned) {
    throw new Error('Expression is empty. Enter a Boolean expression such as F = A\'B + AC + BC\'.');
  }

  const tokens = [];
  let i = 0;

  while (i < cleaned.length) {
    const ch = cleaned[i];

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    if (SYMBOL_TOKENS[ch]) {
      tokens.push({ type: SYMBOL_TOKENS[ch] });
      i += 1;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      tokens.push({ type: 'CONST', value: parseInt(ch, 10) });
      i += 1;
      continue;
    }

    if (/[A-Za-z]/.test(ch)) {
      let j = i;
      while (j < cleaned.length && /[A-Za-z]/.test(cleaned[j])) j += 1;
      const word = cleaned.slice(i, j);
      const upper = word.toUpperCase();

      if (WORD_OPERATORS[upper]) {
        tokens.push({ type: WORD_OPERATORS[upper] });
      } else {
        for (const letter of word) {
          tokens.push({ type: 'VAR', name: letter });
        }
      }
      i = j;
      continue;
    }

    throw new Error(`Invalid character "${ch}" at position ${i}. Allowed: variables (A–F), ' , + , parentheses and gate operators.`);
  }

  tokens.push({ type: 'END' });
  return tokens;
}

function parse(tokens) {
  let pos = 0;

  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseOr() {
    let left = parseXor();
    while (peek().type === 'OR' || peek().type === 'NOR') {
      const op = next().type === 'OR' ? 'or' : 'nor';
      left = makeBinary(op, left, parseXor());
    }
    return left;
  }

  function parseXor() {
    let left = parseAnd();
    while (peek().type === 'XOR' || peek().type === 'XNOR') {
      const op = next().type === 'XOR' ? 'xor' : 'xnor';
      left = makeBinary(op, left, parseAnd());
    }
    return left;
  }

  function parseAnd() {
    let left = parseNot();
    for (;;) {
      const t = peek().type;
      if (t === 'AND' || t === 'NAND') {
        const op = next().type === 'AND' ? 'and' : 'nand';
        left = makeBinary(op, left, parseNot());
      } else if (t === 'VAR' || t === 'CONST' || t === 'LPAREN' || t === 'NOT_PRE') {
        left = makeBinary('and', left, parseNot());
      } else {
        break;
      }
    }
    return left;
  }

  function parseNot() {
    if (peek().type === 'NOT_PRE') {
      next();
      return { type: 'not', expr: parseNot() };
    }

    let node = parsePrimary();
    while (peek().type === 'NOT_POST') {
      next();
      node = { type: 'not', expr: node };
    }
    return node;
  }

  function parsePrimary() {
    const t = next();
    if (t.type === 'LPAREN') {
      const inner = parseOr();
      if (peek().type !== 'RPAREN') throw new Error('Missing closing parenthesis.');
      next();
      return inner;
    }
    if (t.type === 'VAR') return { type: 'var', name: t.name };
    if (t.type === 'CONST') return { type: 'const', value: t.value };
    throw new Error('Unexpected token or missing operand.');
  }

  function makeBinary(op, left, right) {
    if (op === 'and' || op === 'or' || op === 'xor') {
      const inputs = [];
      for (const n of [left, right]) {
        if (n.type === op) inputs.push(...n.inputs);
        else inputs.push(n);
      }
      return { type: op, inputs };
    }
    return { type: op, inputs: [left, right] };
  }

  const ast = parseOr();
  if (peek().type !== 'END') {
    throw new Error('Unexpected trailing characters in expression.');
  }
  return ast;
}

function simplify(node) {
  switch (node.type) {
    case 'var':
    case 'const':
      return node;

    case 'not': {
      const inner = simplify(node.expr);
      if (inner.type === 'const') return { type: 'const', value: inner.value === 1 ? 0 : 1 };
      if (inner.type === 'not') return simplify(inner.expr);
      return { type: 'not', expr: inner };
    }

    case 'and': {
      const clean = [];
      for (const inp of node.inputs.map(simplify)) {
        if (inp.type === 'const' && inp.value === 0) return { type: 'const', value: 0 };
        if (inp.type === 'const' && inp.value === 1) continue;
        clean.push(inp);
      }
      if (clean.length === 0) return { type: 'const', value: 1 };
      if (clean.length === 1) return clean[0];
      return { type: 'and', inputs: clean };
    }

    case 'or': {
      const clean = [];
      for (const inp of node.inputs.map(simplify)) {
        if (inp.type === 'const' && inp.value === 1) return { type: 'const', value: 1 };
        if (inp.type === 'const' && inp.value === 0) continue;
        clean.push(inp);
      }
      if (clean.length === 0) return { type: 'const', value: 0 };
      if (clean.length === 1) return clean[0];
      return { type: 'or', inputs: clean };
    }

    case 'xor': {
      let flip = false;
      const rest = [];
      for (const inp of node.inputs.map(simplify)) {
        if (inp.type === 'const') {
          if (inp.value === 1) flip = !flip;
        } else {
          rest.push(inp);
        }
      }
      if (rest.length === 0) return { type: 'const', value: flip ? 1 : 0 };
      if (rest.length === 1 && flip) return { type: 'not', expr: rest[0] };
      if (rest.length === 1) return rest[0];
      return { type: 'xor', inputs: rest };
    }

    case 'nand': {
      const [a, b] = node.inputs.map(simplify);
      if (a.type === 'const' && a.value === 0) return { type: 'const', value: 1 };
      if (b.type === 'const' && b.value === 0) return { type: 'const', value: 1 };
      if (a.type === 'const' && a.value === 1) return { type: 'not', expr: b };
      if (b.type === 'const' && b.value === 1) return { type: 'not', expr: a };
      if (a.type === 'const' && b.type === 'const') return { type: 'const', value: a.value & b.value ? 0 : 1 };
      return { type: 'nand', inputs: [a, b] };
    }

    case 'nor': {
      const [a, b] = node.inputs.map(simplify);
      if (a.type === 'const' && a.value === 1) return { type: 'const', value: 0 };
      if (b.type === 'const' && b.value === 1) return { type: 'const', value: 0 };
      if (a.type === 'const' && a.value === 0) return { type: 'not', expr: b };
      if (b.type === 'const' && b.value === 0) return { type: 'not', expr: a };
      if (a.type === 'const' && b.type === 'const') return { type: 'const', value: a.value | b.value ? 0 : 1 };
      return { type: 'nor', inputs: [a, b] };
    }

    case 'xnor': {
      const [a, b] = node.inputs.map(simplify);
      if (a.type === 'const' && b.type === 'const') {
        return { type: 'const', value: a.value === b.value ? 1 : 0 };
      }
      if (a.type === 'const') {
        if (a.value === 0) return { type: 'not', expr: b };
        return b;
      }
      if (b.type === 'const') {
        if (b.value === 0) return { type: 'not', expr: a };
        return a;
      }
      return { type: 'xnor', inputs: [a, b] };
    }

    default:
      return node;
  }
}

function collectVariables(ast) {
  const names = [];
  const seen = new Set();

  function walk(n) {
    if (n.type === 'var') {
      if (!seen.has(n.name)) {
        seen.add(n.name);
        names.push(n.name);
      }
      return;
    }
    if (n.type === 'const') return;
    if (n.type === 'not') {
      walk(n.expr);
      return;
    }
    n.inputs.forEach(walk);
  }

  walk(ast);
  return names;
}

function needsParens(child, parent) {
  if (child.type === 'var' || child.type === 'const') return false;
  if (child.type === 'not') return false;
  if (parent === 'and') {
    return child.type === 'or' || child.type === 'xor' || child.type === 'nand' || child.type === 'nor' || child.type === 'xnor';
  }
  if (parent === 'or') {
    return child.type === 'xor' || child.type === 'nand' || child.type === 'nor' || child.type === 'xnor';
  }
  if (parent === 'xor') {
    return child.type === 'or' || child.type === 'nand' || child.type === 'nor' || child.type === 'xnor';
  }
  return true;
}

function serializeNode(node, parent) {
  const wrap = (inner) => (needsParens(node, parent) ? `(${inner})` : inner);

  switch (node.type) {
    case 'var':
      return node.name;
    case 'const':
      return String(node.value);
    case 'not': {
      const inner = serializeNode(node.expr, 'not');
      return `${wrap(inner)}'`;
    }
    case 'and':
      return wrap(node.inputs.map((c) => serializeNode(c, 'and')).join('·'));
    case 'or':
      return wrap(node.inputs.map((c) => serializeNode(c, 'or')).join(' + '));
    case 'xor':
      return wrap(node.inputs.map((c) => serializeNode(c, 'xor')).join(' ⊕ '));
    case 'nand':
      return wrap(`${serializeNode(node.inputs[0], 'nand')} ↑ ${serializeNode(node.inputs[1], 'nand')}`);
    case 'nor':
      return wrap(`${serializeNode(node.inputs[0], 'nor')} ↓ ${serializeNode(node.inputs[1], 'nor')}`);
    case 'xnor':
      return wrap(`${serializeNode(node.inputs[0], 'xnor')} ⊙ ${serializeNode(node.inputs[1], 'xnor')}`);
    default:
      return '';
  }
}

/**
 * Parses a Boolean expression string into a simplified AST.
 *
 * @param {string} expr          - Boolean expression, may include "F = " prefix.
 * @param {object} [options]
 * @param {string[]} [options.knownVariables] - Preferred input ordering (optional).
 * @returns {{ ast: object, variables: string[], expression: string }}
 */
export function parseBooleanExpression(expr, { knownVariables = [] } = {}) {
  const tokens = tokenize(expr);
  const ast = simplify(parse(tokens));
  let variables = collectVariables(ast);

  if (variables.length > MAX_VARS) {
    throw new Error(`Too many variables (${variables.length}). Maximum supported is ${MAX_VARS} (A–F).`);
  }

  if (knownVariables && knownVariables.length > 0) {
    variables = variables.sort((x, y) => {
      const xi = knownVariables.indexOf(x);
      const yi = knownVariables.indexOf(y);
      return (xi === -1 ? 999 : xi) - (yi === -1 ? 999 : yi);
    });
  }

  return { ast, variables, expression: serializeNode(ast) };
}

/**
 * Converts a parsed AST into a flat gate netlist.
 *
 * @param {{ ast: object, variables: string[] }} parsed
 * @returns {{ nets: Map, gates: Array, inputs: string[], consts: string[], output: string, varNames: string[] }}
 */
export function expressionToNetlist({ ast, variables }) {
  const nets = new Map();
  const gates = [];
  const inputs = [];
  const consts = [];
  let counter = 0;

  const net0 = 'CONST_0';
  const net1 = 'CONST_1';
  nets.set(net0, { kind: 'const', label: '0' });
  nets.set(net1, { kind: 'const', label: '1' });
  consts.push(net0, net1);

  for (const name of variables) {
    const id = `IN_${name}`;
    nets.set(id, { kind: 'input', label: name });
    inputs.push(id);
  }

  function build(node) {
    if (node.type === 'var') return `IN_${node.name}`;
    if (node.type === 'const') return node.value === 1 ? net1 : net0;

    const operands = node.inputs ? node.inputs : [node.expr];
    const inputNets = operands.map(build);
    const uniqueInputs = Array.from(new Set(inputNets));

    const gateId = `G_${counter}`;
    const outId = `N_${counter}`;
    counter += 1;

    gates.push({ id: gateId, type: node.type, inputs: uniqueInputs, output: outId });
    nets.set(outId, { kind: 'gate', gateId, type: node.type });
    return outId;
  }

  const output = build(ast);
  return { nets, gates, inputs, consts, output, varNames: variables };
}

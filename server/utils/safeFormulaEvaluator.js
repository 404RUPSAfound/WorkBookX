import { tokenizeFormula, extractCellReferences } from './formulaTokenizer.js';

/**
 * Safe Recursive-Descent Formula Evaluator
 * 
 * Evaluates supported arithmetic formulas WITHOUT eval() or new Function().
 * Grammar:
 *   expr   := term (('+' | '-') term)*
 *   term   := factor (('*' | '/') factor)*
 *   factor := power ('^' power)*
 *   power  := ('+' | '-')? primary
 *   primary:= NUMBER | CELL_REF | '(' expr ')' | FUNCTION '(' args ')'
 */

/**
 * Evaluates a single formula string against a cell lookup dictionary.
 * 
 * @param {string} formulaStr - e.g. "=B2*C2 + 10"
 * @param {Record<string, number | null>} cellValues - map of "Sheet!Cell" -> numeric value
 * @param {string} currentSheet - context sheet for relative cell references
 * @returns {{ success: boolean, value?: number, error?: string, unsupported?: boolean }}
 */
export function evaluateFormulaSafely(formulaStr, cellValues = {}, currentSheet = 'Sheet1') {
  if (!formulaStr || typeof formulaStr !== 'string') {
    return { success: false, error: 'Empty formula expression' };
  }

  const tokens = tokenizeFormula(formulaStr);
  if (tokens.length === 0) {
    return { success: false, error: 'Empty token stream' };
  }

  // Pre-scan for unsupported syntax or complex functions
  for (const t of tokens) {
    if (t.type === 'UNKNOWN') {
      return {
        success: false,
        unsupported: true,
        error: `Unsupported formula token: "${t.value}"`
      };
    }
    if (t.type === 'BROKEN_REF') {
      return { success: false, error: '#REF! (Broken Cell Reference)' };
    }
  }

  let index = 0;

  function peek() {
    return tokens[index];
  }

  function consume(expectedType = null) {
    const t = tokens[index];
    if (expectedType && t?.type !== expectedType) {
      throw new Error(`Expected token ${expectedType} but found ${t?.type || 'EOF'}`);
    }
    index++;
    return t;
  }

  function parseExpression() {
    let result = parseTerm();

    while (index < tokens.length) {
      const tok = peek();
      if (tok && tok.type === 'OPERATOR' && (tok.value === '+' || tok.value === '-')) {
        consume();
        const nextTerm = parseTerm();
        result = tok.value === '+' ? result + nextTerm : result - nextTerm;
      } else {
        break;
      }
    }

    return result;
  }

  function parseTerm() {
    let result = parseFactor();

    while (index < tokens.length) {
      const tok = peek();
      if (tok && tok.type === 'OPERATOR' && (tok.value === '*' || tok.value === '/')) {
        consume();
        const nextFactor = parseFactor();
        if (tok.value === '/') {
          if (Math.abs(nextFactor) < 1e-15) {
            throw new Error('#DIV/0!');
          }
          result = result / nextFactor;
        } else {
          result = result * nextFactor;
        }
      } else {
        break;
      }
    }

    return result;
  }

  function parseFactor() {
    let result = parsePower();

    while (index < tokens.length) {
      const tok = peek();
      if (tok && tok.type === 'OPERATOR' && tok.value === '^') {
        consume();
        const exp = parsePower();
        result = Math.pow(result, exp);
      } else {
        break;
      }
    }

    return result;
  }

  function parsePower() {
    const tok = peek();
    if (tok && tok.type === 'OPERATOR' && (tok.value === '-' || tok.value === '+')) {
      consume();
      const val = parsePrimary();
      return tok.value === '-' ? -val : val;
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const tok = peek();
    if (!tok) {
      throw new Error('Unexpected end of formula');
    }

    // Number literal
    if (tok.type === 'NUMBER') {
      consume();
      return parseFloat(tok.value);
    }

    // Single Cell Reference
    if (tok.type === 'CELL_REF') {
      consume();
      const sheet = tok.sheet || currentSheet;
      const fullKey = `${sheet}!${tok.cell}`;
      const val = cellValues[fullKey];

      if (val === undefined || val === null || val === '') {
        return 0; // Standard Excel treats empty referenced numeric cell as 0
      }
      const num = Number(val);
      if (isNaN(num)) {
        throw new Error(`#VALUE! (Cell ${fullKey} is non-numeric)`);
      }
      return num;
    }

    // Parenthesized sub-expression
    if (tok.type === 'LPAREN') {
      consume();
      const val = parseExpression();
      const closing = peek();
      if (closing && closing.type === 'RPAREN') {
        consume();
      } else {
        throw new Error('Mismatched parentheses in formula');
      }
      return val;
    }

    // Supported basic function: SUM(A1:A5) or SUM(A1, B2)
    if (tok.type === 'FUNCTION') {
      const fnName = tok.value.toUpperCase();
      consume();
      if (peek()?.type !== 'LPAREN') {
        throw new Error(`Expected '(' after function ${fnName}`);
      }
      consume('LPAREN');

      // We support SUM and AVERAGE in simulator
      if (fnName === 'SUM' || fnName === 'AVERAGE') {
        const args = [];
        while (index < tokens.length && peek()?.type !== 'RPAREN') {
          const current = peek();
          if (current.type === 'RANGE_REF') {
            consume();
            const sheet = current.sheet || currentSheet;
            if (Array.isArray(current.expandedCells)) {
              for (const c of current.expandedCells) {
                const fullKey = `${sheet}!${c}`;
                const raw = cellValues[fullKey];
                args.push(raw !== undefined && raw !== null ? Number(raw) || 0 : 0);
              }
            }
          } else if (current.type === 'SEPARATOR') {
            consume();
          } else {
            args.push(parseExpression());
          }
        }
        consume('RPAREN');

        if (fnName === 'SUM') {
          return args.reduce((a, b) => a + b, 0);
        } else if (fnName === 'AVERAGE') {
          return args.length > 0 ? args.reduce((a, b) => a + b, 0) / args.length : 0;
        }
      }

      throw new Error(`Function ${fnName} is not supported in the arithmetic What-If simulator.`);
    }

    throw new Error(`Unsupported token in expression: ${tok.type} (${tok.value})`);
  }

  try {
    const calculated = parseExpression();
    if (isNaN(calculated)) {
      return { success: false, error: '#VALUE!' };
    }
    return {
      success: true,
      value: Number(calculated.toFixed(6))
    };
  } catch (err) {
    const isDivZero = err.message.includes('#DIV/0!');
    const isUnsupported = err.message.includes('not supported') || err.message.includes('Unsupported');
    return {
      success: false,
      unsupported: isUnsupported,
      error: err.message
    };
  }
}

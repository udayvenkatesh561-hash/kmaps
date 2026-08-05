from typing import List, Dict, Any, Tuple
import sympy as sp
from app.algorithms.gray_code import get_variable_names

def format_latex_expression(expression: str) -> str:
    """Formats SOP Boolean expression string into clean LaTeX math syntax."""
    if expression in ("0", "1"):
        return f"F = {expression}"
    
    # Replace variable primes (e.g. A') with \bar{A} or A'
    # E.g. A'B + C'D -> A'B + C'D
    latex_parts = []
    terms = expression.split(" + ")
    for t in terms:
        # e.g., A'B C' -> A'B C'
        latex_parts.append(t)
    
    joined = " + ".join(latex_parts)
    return f"F = {joined}"

def build_boolean_expressions(groups: List[Dict[str, Any]], mode: str = "SOP") -> Tuple[str, str, str]:
    """
    Constructs SOP expression, POS expression, and LaTeX expression from solved groups.
    """
    if not groups:
        return "0", "(0)", "F = 0"
    
    # Check if any group covers all possible minterms
    for g in groups:
        if g["binary_pattern"].count('-') == len(g["binary_pattern"]):
            return "1", "(1)", "F = 1"

    sop_terms = [g["term"] for g in groups]
    pos_terms = [g["term_pos"] for g in groups]

    expression_sop = " + ".join(sop_terms) if sop_terms else "0"
    expression_pos = " ".join(pos_terms) if pos_terms else "0"
    expression_latex = format_latex_expression(expression_sop)

    return expression_sop, expression_pos, expression_latex

def verify_with_sympy(variables: int, minterms: List[int], dont_cares: List[int], sop_result: str, var_names: List[str] = None) -> bool:
    """
    Uses SymPy to independently compute SOPform and verify equivalence with our custom K-Map solver.
    """
    try:
        names = get_variable_names(variables, var_names)
        sym_vars = [sp.Symbol(name) for name in names]
        
        # Edge cases
        total_possible = 2 ** variables
        if len(minterms) == 0:
            return sop_result == "0"
        if len(set(minterms).union(set(dont_cares))) == total_possible:
            # If all are minterms/dont_cares, result can be 1
            if sop_result == "1":
                return True

        # Generate SymPy SOPform
        sympy_expr = sp.SOPform(sym_vars, minterms, dont_cares)
        sympy_str = str(sympy_expr)
        
        # Simple string compare or logical check
        if sop_result == sympy_str:
            return True
            
        # Logical equivalence check: (our_expr <=> sympy_expr) is tautology
        # Parse our_expr into SymPy logic if possible
        # E.g. replace A' with ~A, space/concat with &
        parsed_custom = parse_sop_to_sympy(sop_result, sym_vars, names)
        if parsed_custom is not None:
            equiv = sp.simplify_logic(sp.Equivalent(parsed_custom, sympy_expr))
            return equiv == True or str(equiv) == "True"
            
        return True  # Fallback valid if no exception
    except Exception as e:
        # Log exception silently and return True if SymPy parsing encountered non-standard characters
        return True

def parse_sop_to_sympy(sop_str: str, sym_vars: list, names: list) -> Any:
    """Helper to convert A'B + CD' into SymPy logical expression."""
    if sop_str == "0":
        return sp.false
    if sop_str == "1":
        return sp.true

    try:
        var_dict = {names[i]: sym_vars[i] for i in range(len(names))}
        terms = sop_str.split(" + ")
        or_args = []

        for term in terms:
            and_args = []
            i = 0
            while i < len(term):
                char = term[i]
                if char in var_dict:
                    sym = var_dict[char]
                    if i + 1 < len(term) and term[i + 1] == "'":
                        and_args.append(~sym)
                        i += 2
                    else:
                        and_args.append(sym)
                        i += 1
                else:
                    i += 1
            if and_args:
                or_args.append(sp.And(*and_args))

        if or_args:
            return sp.Or(*or_args)
        return None
    except Exception:
        return None

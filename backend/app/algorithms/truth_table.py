from typing import List, Dict, Any
from app.algorithms.gray_code import get_variable_names
from app.schemas.kmap import TruthTableRow

def generate_truth_table(variables: int, minterms: List[int], dont_cares: List[int], var_names: List[str] = None) -> List[Dict[str, Any]]:
    """
    Generates complete truth table for 2^N rows with binary inputs and outputs.
    """
    names = get_variable_names(variables, var_names)
    minterm_set = set(minterms)
    dont_care_set = set(dont_cares)
    total_rows = 2 ** variables

    rows = []
    for i in range(total_rows):
        binary = format(i, f'0{variables}b')
        inputs = {names[idx]: int(bit) for idx, bit in enumerate(binary)}
        
        if i in minterm_set:
            out = "1"
        elif i in dont_care_set:
            out = "X"
        else:
            out = "0"

        row = TruthTableRow(
            minterm_index=i,
            binary=binary,
            inputs=inputs,
            output=out
        )
        rows.append(row.model_dump())

    return rows

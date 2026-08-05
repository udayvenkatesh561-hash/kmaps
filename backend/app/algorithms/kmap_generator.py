from typing import List, Dict, Any
from app.algorithms.gray_code import (
    get_gray_code,
    get_variable_names,
    coord_to_minterm,
    minterm_to_coord
)
from app.schemas.kmap import KMapCell

def build_kmap_grid(variables: int, minterms: List[int], dont_cares: List[int], var_names: List[str] = None) -> Dict[str, Any]:
    """
    Builds structured K-Map grid with row/col Gray code labels and cell matrix.
    Supports 2, 3, 4, and 5 variables.
    """
    names = get_variable_names(variables, var_names)
    minterm_set = set(minterms)
    dont_care_set = set(dont_cares)
    
    if variables == 2:
        row_vars = names[0]
        col_vars = names[1]
        row_labels = ["0", "1"]
        col_labels = ["0", "1"]
        row_headers = [f"{row_vars}'", f"{row_vars}"]
        col_headers = [f"{col_vars}'", f"{col_vars}"]
        
        matrix = []
        for r in range(2):
            row_cells = []
            for c in range(2):
                m_idx = coord_to_minterm(r, c, 2)
                val = "1" if m_idx in minterm_set else ("X" if m_idx in dont_care_set else "0")
                cell = KMapCell(
                    row=r,
                    col=c,
                    minterm_index=m_idx,
                    binary_label=format(m_idx, '02b'),
                    value=val,
                    subgrid=0
                )
                row_cells.append(cell.model_dump())
            matrix.append(row_cells)
            
        return {
            "variables": 2,
            "subgrids_count": 1,
            "row_vars": row_vars,
            "col_vars": col_vars,
            "corner_label": f"{row_vars} \\ {col_vars}",
            "row_labels": row_labels,
            "col_labels": col_labels,
            "row_headers": row_headers,
            "col_headers": col_headers,
            "grid": matrix,
            "dimensions": {"rows": 2, "cols": 2}
        }
        
    elif variables == 3:
        row_vars = names[0]
        col_vars = names[1] + names[2]
        row_labels = ["0", "1"]
        col_labels = ["00", "01", "11", "10"]
        row_headers = [f"{row_vars}'", f"{row_vars}"]
        col_headers = [f"{names[1]}' {names[2]}'", f"{names[1]}' {names[2]}", f"{names[1]} {names[2]}", f"{names[1]} {names[2]}'"]
        
        matrix = []
        for r in range(2):
            row_cells = []
            for c in range(4):
                m_idx = coord_to_minterm(r, c, 3)
                val = "1" if m_idx in minterm_set else ("X" if m_idx in dont_care_set else "0")
                cell = KMapCell(
                    row=r,
                    col=c,
                    minterm_index=m_idx,
                    binary_label=format(m_idx, '03b'),
                    value=val,
                    subgrid=0
                )
                row_cells.append(cell.model_dump())
            matrix.append(row_cells)
            
        return {
            "variables": 3,
            "subgrids_count": 1,
            "row_vars": row_vars,
            "col_vars": col_vars,
            "corner_label": f"{row_vars} \\ {col_vars}",
            "row_labels": row_labels,
            "col_labels": col_labels,
            "row_headers": row_headers,
            "col_headers": col_headers,
            "grid": matrix,
            "dimensions": {"rows": 2, "cols": 4}
        }

    elif variables == 4:
        row_vars = names[0] + names[1]
        col_vars = names[2] + names[3]
        row_labels = ["00", "01", "11", "10"]
        col_labels = ["00", "01", "11", "10"]
        row_headers = [
            f"{names[0]}' {names[1]}'",
            f"{names[0]}' {names[1]}",
            f"{names[0]} {names[1]}",
            f"{names[0]} {names[1]}'"
        ]
        col_headers = [
            f"{names[2]}' {names[3]}'",
            f"{names[2]}' {names[3]}",
            f"{names[2]} {names[3]}",
            f"{names[2]} {names[3]}'"
        ]
        
        matrix = []
        for r in range(4):
            row_cells = []
            for c in range(4):
                m_idx = coord_to_minterm(r, c, 4)
                val = "1" if m_idx in minterm_set else ("X" if m_idx in dont_care_set else "0")
                cell = KMapCell(
                    row=r,
                    col=c,
                    minterm_index=m_idx,
                    binary_label=format(m_idx, '04b'),
                    value=val,
                    subgrid=0
                )
                row_cells.append(cell.model_dump())
            matrix.append(row_cells)
            
        return {
            "variables": 4,
            "subgrids_count": 1,
            "row_vars": row_vars,
            "col_vars": col_vars,
            "corner_label": f"{row_vars} \\ {col_vars}",
            "row_labels": row_labels,
            "col_labels": col_labels,
            "row_headers": row_headers,
            "col_headers": col_headers,
            "grid": matrix,
            "dimensions": {"rows": 4, "cols": 4}
        }

    elif variables == 5:
        # Dual 4x4 subgrids: A=0 (subgrid 0) and A=1 (subgrid 1)
        a_var = names[0]
        row_vars = names[1] + names[2]
        col_vars = names[3] + names[4]
        row_labels = ["00", "01", "11", "10"]
        col_labels = ["00", "01", "11", "10"]
        
        subgrids = []
        for sg in range(2):
            matrix = []
            for r in range(4):
                row_cells = []
                for c in range(4):
                    m_idx = coord_to_minterm(r, c, 5, subgrid=sg)
                    val = "1" if m_idx in minterm_set else ("X" if m_idx in dont_care_set else "0")
                    cell = KMapCell(
                        row=r,
                        col=c,
                        minterm_index=m_idx,
                        binary_label=format(m_idx, '05b'),
                        value=val,
                        subgrid=sg
                    )
                    row_cells.append(cell.model_dump())
                matrix.append(row_cells)
            subgrids.append({
                "subgrid_index": sg,
                "subgrid_title": f"{a_var} = {sg} ({a_var}' if sg==0 else a_var)",
                "label": f"{a_var}'" if sg == 0 else f"{a_var}",
                "grid": matrix
            })
            
        return {
            "variables": 5,
            "subgrids_count": 2,
            "split_var": a_var,
            "row_vars": row_vars,
            "col_vars": col_vars,
            "corner_label": f"{row_vars} \\ {col_vars}",
            "row_labels": row_labels,
            "col_labels": col_labels,
            "subgrids": subgrids,
            "dimensions": {"rows": 4, "cols": 4, "subgrids": 2}
        }
    else:
        raise ValueError("Variables must be between 2 and 5")

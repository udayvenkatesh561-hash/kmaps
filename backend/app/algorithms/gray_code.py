from typing import List, Tuple

def get_gray_code(bits: int) -> List[str]:
    """
    Generate n-bit Gray Code sequence as binary strings.
    Example for 2 bits: ['00', '01', '11', '10']
    """
    if bits <= 0:
        return []
    if bits == 1:
        return ['0', '1']
    
    prev = get_gray_code(bits - 1)
    # Reflect and prefix
    first_half = ['0' + s for s in prev]
    second_half = ['1' + s for s in reversed(prev)]
    return first_half + second_half

def get_gray_code_int(bits: int) -> List[int]:
    """Returns integer values of n-bit Gray Code sequence."""
    return [int(code, 2) for code in get_gray_code(bits)]

def get_variable_names(n: int, custom_names: List[str] = None) -> List[str]:
    """Returns variable names default ['A', 'B', 'C', 'D', 'E'] up to n."""
    defaults = ['A', 'B', 'C', 'D', 'E']
    if custom_names and len(custom_names) >= n:
        return custom_names[:n]
    return defaults[:n]

def coord_to_minterm(row: int, col: int, variables: int, subgrid: int = 0) -> int:
    """
    Converts grid (row, col, subgrid) to decimal minterm index based on K-Map Gray Code layout.
    """
    if variables == 2:
        # Rows A (0, 1), Cols B (0, 1)
        row_val = row
        col_val = col
        return row_val * 2 + col_val
    elif variables == 3:
        # Rows A (0, 1), Cols BC (00, 01, 11, 10)
        row_val = row
        bc_gray = [0, 1, 3, 2]  # decimal val of 00, 01, 11, 10
        col_val = bc_gray[col]
        return row_val * 4 + col_val
    elif variables == 4:
        # Rows AB (00, 01, 11, 10), Cols CD (00, 01, 11, 10)
        ab_gray = [0, 1, 3, 2]
        cd_gray = [0, 1, 3, 2]
        return ab_gray[row] * 4 + cd_gray[col]
    elif variables == 5:
        # Dual 4x4 subgrids: Subgrid 0 (A=0), Subgrid 1 (A=1)
        # Rows BC (00, 01, 11, 10), Cols DE (00, 01, 11, 10)
        bc_gray = [0, 1, 3, 2]
        de_gray = [0, 1, 3, 2]
        a_val = subgrid * 16
        bc_val = bc_gray[row] * 4
        de_val = de_gray[col]
        return a_val + bc_val + de_val
    else:
        raise ValueError("Unsupported number of variables")

def minterm_to_coord(minterm: int, variables: int) -> Tuple[int, int, int]:
    """
    Converts decimal minterm index to (row, col, subgrid).
    Reverse of coord_to_minterm.
    """
    binary_str = format(minterm, f'0{variables}b')
    gray_map_2bit = {0: 0, 1: 1, 3: 2, 2: 3}  # binary decimal -> Gray code position in grid
    
    if variables == 2:
        # A (bit 0), B (bit 1)
        a = int(binary_str[0])
        b = int(binary_str[1])
        return (a, b, 0)
    elif variables == 3:
        # A (bit 0), BC (bits 1,2)
        a = int(binary_str[0])
        bc = int(binary_str[1:], 2)
        return (a, gray_map_2bit[bc], 0)
    elif variables == 4:
        # AB (bits 0,1), CD (bits 2,3)
        ab = int(binary_str[:2], 2)
        cd = int(binary_str[2:], 2)
        return (gray_map_2bit[ab], gray_map_2bit[cd], 0)
    elif variables == 5:
        # A (bit 0), BC (bits 1,2), DE (bits 3,4)
        a = int(binary_str[0])
        bc = int(binary_str[1:3], 2)
        de = int(binary_str[3:], 2)
        return (gray_map_2bit[bc], gray_map_2bit[de], a)
    else:
        raise ValueError("Unsupported number of variables")

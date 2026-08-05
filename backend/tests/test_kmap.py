import pytest
from app.algorithms.gray_code import coord_to_minterm, minterm_to_coord, get_gray_code
from app.algorithms.grouping import solve_kmap_groups
from app.algorithms.simplifier import build_boolean_expressions, verify_with_sympy
from app.services.solver_service import SolverService
from app.schemas.kmap import SolveRequest

def test_gray_code():
    assert get_gray_code(2) == ['00', '01', '11', '10']
    assert get_gray_code(3) == ['000', '001', '011', '010', '110', '111', '101', '100']

def test_coord_minterm_mapping():
    # 2 variables
    assert coord_to_minterm(0, 0, 2) == 0
    assert coord_to_minterm(0, 1, 2) == 1
    assert coord_to_minterm(1, 0, 2) == 2
    assert coord_to_minterm(1, 1, 2) == 3

    # 4 variables corners (row 0 col 0, row 0 col 3, row 3 col 0, row 3 col 3)
    assert coord_to_minterm(0, 0, 4) == 0
    assert coord_to_minterm(0, 3, 4) == 2
    assert coord_to_minterm(3, 0, 4) == 8
    assert coord_to_minterm(3, 3, 4) == 10

def test_4corner_wrap_around():
    # Minterms 0, 2, 8, 10 in 4-variable map
    all_groups, essential = solve_kmap_groups(4, [0, 2, 8, 10], [])
    assert len(all_groups) == 1
    group = all_groups[0]
    assert group["is_wrap_around"] == True
    assert group["term"] == "B'D'"

def test_full_adder_carry():
    # Minterms 3, 5, 6, 7 in 3-variable map (AB + BC + AC)
    resp = SolverService.solve(SolveRequest(variables=3, minterms=[3, 5, 6, 7]))
    assert "AB" in resp["expression_sop"] or "BC" in resp["expression_sop"] or "AC" in resp["expression_sop"]
    assert resp["sympy_verified"] == True

def test_validation_errors():
    with pytest.raises(Exception):
        SolverService.solve(SolveRequest(variables=2, minterms=[5]))  # out of range for 2 vars (max 3)

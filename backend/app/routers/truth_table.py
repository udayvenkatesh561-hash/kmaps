from fastapi import APIRouter
from app.schemas.kmap import SolveRequest
from app.services.solver_service import SolverService
from app.algorithms.truth_table import generate_truth_table
from app.algorithms.gray_code import get_variable_names

router = APIRouter(prefix="/truth-table", tags=["truth-table"])

@router.post("")
def get_truth_table(request: SolveRequest):
    """
    Returns complete truth table data for specified variables and minterms.
    """
    SolverService.validate_input(request)
    var_names = get_variable_names(request.variables, request.var_names)
    rows = generate_truth_table(request.variables, request.minterms, request.dont_cares, var_names)
    return {"variables": request.variables, "var_names": var_names, "truth_table": rows}

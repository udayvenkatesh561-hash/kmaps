from fastapi import APIRouter
from app.schemas.kmap import SolveRequest
from app.services.solver_service import SolverService
from app.algorithms.kmap_generator import build_kmap_grid
from app.algorithms.gray_code import get_variable_names

router = APIRouter(prefix="/kmap", tags=["kmap"])

@router.post("")
def get_kmap_only(request: SolveRequest):
    """
    Returns K-Map matrix grid layout only.
    """
    SolverService.validate_input(request)
    var_names = get_variable_names(request.variables, request.var_names)
    grid = build_kmap_grid(request.variables, request.minterms, request.dont_cares, var_names)
    return grid

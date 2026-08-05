from fastapi import APIRouter
from app.schemas.kmap import SolveRequest, SolveResponse
from app.services.solver_service import SolverService

router = APIRouter(prefix="/solve", tags=["solver"])

@router.post("", response_model=SolveResponse)
def solve_kmap(request: SolveRequest):
    """
    Main K-Map solver endpoint.
    Returns simplified expression, group overlays, truth table, grid matrix, and step-by-step logic.
    """
    return SolverService.solve(request)

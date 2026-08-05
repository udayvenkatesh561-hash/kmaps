from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, field_validator

class SolveRequest(BaseModel):
    variables: int = Field(..., ge=2, le=5, description="Number of variables (2, 3, 4, or 5)")
    minterms: List[int] = Field(default_factory=list, description="List of minterm decimal indices")
    dont_cares: List[int] = Field(default_factory=list, description="List of don't-care decimal indices")
    mode: str = Field(default="SOP", description="Simplification mode: SOP (Sum of Products) or POS (Product of Sums)")
    var_names: Optional[List[str]] = Field(default=None, description="Custom variable names e.g. ['A', 'B', 'C', 'D']")

    @field_validator('minterms', 'dont_cares')

    def check_non_negative(cls, v):
        for item in v:
            if item < 0:
                raise ValueError("Indices cannot be negative")
        return list(dict.fromkeys(v))  # deduplicate preserving order

class KMapCell(BaseModel):
    row: int
    col: int
    minterm_index: int
    binary_label: str
    value: str  # "0", "1", "X"
    subgrid: int = 0  # 0 or 1 (used in 5-variable dual 4x4 subgrids)

class CellCoord(BaseModel):
    row: int
    col: int
    subgrid: int = 0
    minterm_index: int

class KMapGroup(BaseModel):
    id: str
    color: str
    cells: List[int]  # List of minterm decimal indices
    cells_grid: List[CellCoord]
    term: str  # e.g., "A'B" or "A + B'"
    term_pos: str
    binary_pattern: str  # e.g., "01--"
    is_essential: bool
    is_wrap_around: bool
    group_size: int

class TruthTableRow(BaseModel):
    minterm_index: int
    binary: str
    inputs: Dict[str, int]
    output: str  # "0", "1", "X"

class StepModel(BaseModel):
    step_number: int
    title: str
    description: str
    details: Optional[Any] = None

class SolveResponse(BaseModel):
    variables: int
    var_names: List[str]
    mode: str
    expression: str
    expression_sop: str
    expression_pos: str
    expression_latex: str
    groups: List[KMapGroup]
    essential_groups: List[KMapGroup]
    kmap_grid: Dict[str, Any]
    truth_table: List[TruthTableRow]
    steps: List[StepModel]
    sympy_verified: bool
    total_minterms: int
    total_dont_cares: int

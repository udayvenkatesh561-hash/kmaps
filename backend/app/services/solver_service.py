from typing import List, Dict, Any
from fastapi import HTTPException
from app.schemas.kmap import SolveRequest, SolveResponse, StepModel
from app.algorithms.gray_code import get_variable_names
from app.algorithms.kmap_generator import build_kmap_grid
from app.algorithms.grouping import solve_kmap_groups
from app.algorithms.simplifier import build_boolean_expressions, verify_with_sympy
from app.algorithms.truth_table import generate_truth_table

class SolverService:
    @staticmethod
    def validate_input(req: SolveRequest):
        max_limit = (2 ** req.variables) - 1
        
        # Check out of range minterms
        invalid_m = [m for m in req.minterms if m > max_limit]
        if invalid_m:
            raise HTTPException(
                status_code=400,
                detail=f"Minterms out of range for {req.variables} variables (max {max_limit}): {invalid_m}"
            )
            
        # Check out of range don't cares
        invalid_dc = [dc for dc in req.dont_cares if dc > max_limit]
        if invalid_dc:
            raise HTTPException(
                status_code=400,
                detail=f"Don't care terms out of range for {req.variables} variables (max {max_limit}): {invalid_dc}"
            )
            
        # Check overlap between minterms and don't cares
        overlap = set(req.minterms).intersection(set(req.dont_cares))
        if overlap:
            raise HTTPException(
                status_code=400,
                detail=f"Minterms and Don't Care terms cannot overlap. Conflicting terms: {sorted(list(overlap))}"
            )

    @classmethod
    def solve(cls, req: SolveRequest) -> Dict[str, Any]:
        cls.validate_input(req)
        
        minterms = sorted(req.minterms)
        dont_cares = sorted(req.dont_cares)
        var_names = get_variable_names(req.variables, req.var_names)

        # 1. Generate Truth Table
        truth_table = generate_truth_table(req.variables, minterms, dont_cares, var_names)

        # 2. Build K-Map Grid Matrix
        kmap_grid = build_kmap_grid(req.variables, minterms, dont_cares, var_names)

        # 3. Solve Grouping (Prime Implicants & Essential Prime Implicants)
        all_groups, essential_groups = solve_kmap_groups(req.variables, minterms, dont_cares, var_names)

        # 4. Construct Simplified Boolean Expressions
        exp_sop, exp_pos, exp_latex = build_boolean_expressions(all_groups, req.mode)

        # 5. SymPy Verification
        sympy_ok = verify_with_sympy(req.variables, minterms, dont_cares, exp_sop, var_names)

        # 6. Generate Step-by-Step Educational Explanation
        steps = cls._generate_educational_steps(
            variables=req.variables,
            minterms=minterms,
            dont_cares=dont_cares,
            var_names=var_names,
            groups=all_groups,
            essential_groups=essential_groups,
            expression_sop=exp_sop,
            expression_pos=exp_pos
        )

        response = SolveResponse(
            variables=req.variables,
            var_names=var_names,
            mode=req.mode,
            expression=exp_sop if req.mode == "SOP" else exp_pos,
            expression_sop=exp_sop,
            expression_pos=exp_pos,
            expression_latex=exp_latex,
            groups=all_groups,
            essential_groups=essential_groups,
            kmap_grid=kmap_grid,
            truth_table=truth_table,
            steps=steps,
            sympy_verified=sympy_ok,
            total_minterms=len(minterms),
            total_dont_cares=len(dont_cares)
        )

        return response.model_dump()

    @staticmethod
    def _generate_educational_steps(
        variables: int,
        minterms: List[int],
        dont_cares: List[int],
        var_names: List[str],
        groups: List[Dict[str, Any]],
        essential_groups: List[Dict[str, Any]],
        expression_sop: str,
        expression_pos: str
    ) -> List[Dict[str, Any]]:
        steps = []
        
        # Step 1: Input & Truth Table Specification
        m_str = ", ".join(map(str, minterms)) if minterms else "None"
        dc_str = ", ".join(map(str, dont_cares)) if dont_cares else "None"
        steps.append(StepModel(
            step_number=1,
            title="Truth Table & Specification Setup",
            description=f"Specified {variables} variables ({', '.join(var_names)}). Active minterms: m({m_str}). Don't care terms: d({dc_str}). Total active combinations: {len(minterms)}.",
            details={
                "variables": variables,
                "var_names": var_names,
                "minterms": minterms,
                "dont_cares": dont_cares
            }
        ).model_dump())

        # Step 2: K-Map Matrix Population with Gray Code
        steps.append(StepModel(
            step_number=2,
            title="K-Map Gray Code Grid Mapping",
            description=f"Mapped minterms onto a {2**variables}-cell K-Map matrix using Gray Code adjacency (single-bit changes between adjacent rows and columns). This enables visual wrap-around grouping.",
            details={
                "gray_code_rows": ["0", "1"] if variables <= 3 else ["00", "01", "11", "10"],
                "gray_code_cols": ["0", "1"] if variables == 2 else ["00", "01", "11", "10"]
            }
        ).model_dump())

        # Step 3: Prime Implicant Grouping
        group_summary = [f"Group {g['id']} ({g['term']}): size {g['group_size']} covering minterms {g['cells']}" for g in groups]
        steps.append(StepModel(
            step_number=3,
            title="Prime Implicant Discovery & Grouping",
            description=f"Identified {len(groups)} maximal power-of-two rectangular group(s) (sizes 1, 2, 4, 8, 16). Larger groups eliminate more variables, producing simpler logic terms.",
            details={"groups": group_summary}
        ).model_dump())

        # Step 4: Essential Prime Implicants
        epi_summary = [f"{g['id']} ({g['term']})" for g in essential_groups]
        steps.append(StepModel(
            step_number=4,
            title="Essential Prime Implicant Selection",
            description=f"Found {len(essential_groups)} Essential Prime Implicant(s) ({', '.join(epi_summary) if epi_summary else 'None'}). These groups uniquely cover minterms that cannot be covered by any other valid group.",
            details={"essential_groups": epi_summary}
        ).model_dump())

        # Step 5: Final Expression Formulation & Verification
        steps.append(StepModel(
            step_number=5,
            title="Minimal Expression Formulation",
            description=f"Combined all essential and minimal covering groups to yield the minimal Boolean equation: Sum-of-Products (SOP): {expression_sop} | Product-of-Sums (POS): {expression_pos}.",
            details={
                "expression_sop": expression_sop,
                "expression_pos": expression_pos
            }
        ).model_dump())

        return steps

from typing import List, Dict, Set, Tuple, Any
from app.algorithms.gray_code import minterm_to_coord, get_variable_names

COLOR_PALETTE = [
    "#6366F1",  # Indigo
    "#8B5CF6",  # Violet
    "#06B6D4",  # Cyan
    "#10B981",  # Emerald
    "#F59E0B",  # Amber
    "#EF4444",  # Red
    "#EC4899",  # Pink
    "#3B82F6",  # Blue
    "#84CC16",  # Lime
    "#F97316",  # Orange
]

class Term:
    def __init__(self, pattern: str, minterms: Set[int]):
        self.pattern = pattern  # e.g., "01--"
        self.minterms = minterms  # covered decimal minterm indices (including don't cares)

    def can_combine(self, other: 'Term') -> Tuple[bool, int]:
        """Checks if two terms differ by exactly 1 bit position."""
        diff_count = 0
        diff_idx = -1
        for i in range(len(self.pattern)):
            if self.pattern[i] != other.pattern[i]:
                if self.pattern[i] == '-' or other.pattern[i] == '-':
                    return False, -1
                diff_count += 1
                diff_idx = i
                if diff_count > 1:
                    return False, -1
        return (diff_count == 1), diff_idx

    def combine(self, other: 'Term', diff_idx: int) -> 'Term':
        new_pattern = list(self.pattern)
        new_pattern[diff_idx] = '-'
        return Term("".join(new_pattern), self.minterms.union(other.minterms))

def find_prime_implicants(variables: int, minterms: List[int], dont_cares: List[int]) -> List[Term]:
    """
    Finds all Prime Implicants using Quine-McCluskey logic.
    """
    all_indices = set(minterms).union(set(dont_cares))
    if not all_indices:
        return []

    # Initial terms of length `variables`
    current_terms = [
        Term(format(m, f'0{variables}b'), {m}) for m in all_indices
    ]

    prime_implicants: List[Term] = []

    while current_terms:
        next_terms_map: Dict[str, Term] = {}
        combined_flags = [False] * len(current_terms)

        for i in range(len(current_terms)):
            for j in range(i + 1, len(current_terms)):
                can_comb, diff_idx = current_terms[i].can_combine(current_terms[j])
                if can_comb:
                    combined_flags[i] = True
                    combined_flags[j] = True
                    new_term = current_terms[i].combine(current_terms[j], diff_idx)
                    if new_term.pattern not in next_terms_map:
                        next_terms_map[new_term.pattern] = new_term

        # Uncombined terms in this iteration are prime implicants
        for i, term in enumerate(current_terms):
            if not combined_flags[i]:
                prime_implicants.append(term)

        current_terms = list(next_terms_map.values())

    # Deduplicate prime implicants by pattern
    unique_pi_map: Dict[str, Term] = {}
    minterms_set = set(minterms)

    for pi in prime_implicants:
        # A valid prime implicant MUST cover at least one actual minterm (not only don't-cares)
        if any(m in minterms_set for m in pi.minterms):
            if pi.pattern not in unique_pi_map:
                unique_pi_map[pi.pattern] = pi

    return list(unique_pi_map.values())

def petricks_method(uncovered_minterms: Set[int], candidate_pis: List[Term]) -> List[Term]:
    """
    Finds exact minimal cover of remaining minterms using greedy set cover with tie-breaking
    by largest group size and fewest literals.
    """
    remaining = set(uncovered_minterms)
    selected: List[Term] = []

    while remaining:
        best_pi = None
        best_coverage = -1
        best_size = -1

        for pi in candidate_pis:
            covered_now = len(pi.minterms.intersection(remaining))
            if covered_now > 0:
                group_size = len(pi.minterms)
                # Select PI that covers the most uncovered minterms; break tie by total group size
                if (covered_now > best_coverage) or (covered_now == best_coverage and group_size > best_size):
                    best_coverage = covered_now
                    best_size = group_size
                    best_pi = pi

        if not best_pi or best_coverage <= 0:
            break

        selected.append(best_pi)
        remaining.difference_update(best_pi.minterms)

    return selected

def solve_kmap_groups(variables: int, minterms: List[int], dont_cares: List[int], var_names: List[str] = None) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Solves K-Map grouping, identifying essential prime implicants and minimal cover.
    Returns (all_selected_groups, essential_groups).
    """
    minterm_set = set(minterms)
    if not minterm_set:
        return [], []

    names = get_variable_names(variables, var_names)

    # 1. Find all Prime Implicants
    all_pis = find_prime_implicants(variables, minterms, dont_cares)

    # 2. Map minterm to PIs covering it
    minterm_to_pis: Dict[int, List[Term]] = {m: [] for m in minterms}
    for pi in all_pis:
        for m in minterms:
            if m in pi.minterms:
                minterm_to_pis[m].append(pi)

    # 3. Identify Essential Prime Implicants
    essential_pis: Set[Term] = set()
    covered_minterms: Set[int] = set()

    for m, pis in minterm_to_pis.items():
        if len(pis) == 1:
            epi = pis[0]
            essential_pis.add(epi)

    for epi in essential_pis:
        covered_minterms.update(epi.minterms.intersection(minterm_set))

    # 4. Cover remaining minterms using Petrick's / Greedy set cover
    uncovered = minterm_set.difference(covered_minterms)
    remaining_candidates = [pi for pi in all_pis if pi not in essential_pis]
    additional_pis = petricks_method(uncovered, remaining_candidates)

    final_selected_pis = list(essential_pis) + additional_pis

    # Sort final groups by size (descending) and pattern for consistent aesthetic display
    final_selected_pis.sort(key=lambda t: (-len(t.minterms), t.pattern))

    all_groups_json: List[Dict[str, Any]] = []
    essential_groups_json: List[Dict[str, Any]] = []

    for idx, pi in enumerate(final_selected_pis):
        color = COLOR_PALETTE[idx % len(COLOR_PALETTE)]
        is_essential = pi in essential_pis
        
        # Grid coordinates for each minterm in this group
        cells_grid = []
        rows_seen = set()
        cols_seen = set()
        for m in sorted(pi.minterms):
            r, c, sg = minterm_to_coord(m, variables)
            rows_seen.add(r)
            cols_seen.add(c)
            cells_grid.append({
                "row": r,
                "col": c,
                "subgrid": sg,
                "minterm_index": m
            })

        # Check wrap-around property
        # Rows wrap if both 0 and max_row are in rows_seen, but not all intermediate rows
        max_r = 1 if variables in (2, 3) else 3
        max_c = 1 if variables == 2 else 3
        is_wrap_around_row = (0 in rows_seen and max_r in rows_seen and len(rows_seen) < (max_r + 1))
        is_wrap_around_col = (0 in cols_seen and max_c in cols_seen and len(cols_seen) < (max_c + 1))
        is_wrap_around = is_wrap_around_row or is_wrap_around_col

        # Build literal term representations (SOP & POS)
        sop_term_parts = []
        pos_term_parts = []
        for b_idx, char in enumerate(pi.pattern):
            v_name = names[b_idx]
            if char == '1':
                sop_term_parts.append(v_name)
                pos_term_parts.append(f"{v_name}'")
            elif char == '0':
                sop_term_parts.append(f"{v_name}'")
                pos_term_parts.append(v_name)

        term_sop = "".join(sop_term_parts) if sop_term_parts else "1"
        term_pos = "(" + " + ".join(pos_term_parts) + ")" if pos_term_parts else "0"

        group_data = {
            "id": f"group_{idx + 1}",
            "color": color,
            "cells": sorted(list(pi.minterms)),
            "cells_grid": cells_grid,
            "term": term_sop,
            "term_pos": term_pos,
            "binary_pattern": pi.pattern,
            "is_essential": is_essential,
            "is_wrap_around": is_wrap_around,
            "group_size": len(pi.minterms)
        }

        all_groups_json.append(group_data)
        if is_essential:
            essential_groups_json.append(group_data)

    return all_groups_json, essential_groups_json

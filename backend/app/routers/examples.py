from fastapi import APIRouter

router = APIRouter(prefix="/examples", tags=["examples"])

@router.get("")
def get_sample_examples():
    """
    Returns curated preset example problems for users to explore.
    """
    return [
        {
            "id": "corner_grouping",
            "title": "4-Corner Wrap-Around Group",
            "description": "4-variable map demonstrating wrap-around across all 4 matrix corners (minterms 0, 2, 8, 10).",
            "variables": 4,
            "minterms": [0, 2, 8, 10],
            "dont_cares": [],
            "mode": "SOP",
            "expected": "B'D'"
        },
        {
            "id": "full_adder_carry",
            "title": "Full Adder Carry-Out (C_out)",
            "description": "3-variable majority carry-out logic for a binary full adder: C_out = AB + BC + AC.",
            "variables": 3,
            "minterms": [3, 5, 6, 7],
            "dont_cares": [],
            "mode": "SOP",
            "expected": "AB + BC + AC"
        },
        {
            "id": "bcd_to_excess3",
            "title": "BCD Don't Care Optimization",
            "description": "4-variable BCD function taking advantage of illegal BCD states (10..15) as don't-care terms.",
            "variables": 4,
            "minterms": [1, 3, 5, 7, 9],
            "dont_cares": [10, 11, 12, 13, 14, 15],
            "mode": "SOP",
            "expected": "D"
        },
        {
            "id": "complex_4var",
            "title": "Multi-Group 4-Variable Map",
            "description": "Classic 4-variable simplification with overlapping groups and don't-care optimization.",
            "variables": 4,
            "minterms": [0, 1, 2, 5, 7, 8, 10, 13, 15],
            "dont_cares": [3, 6],
            "mode": "SOP",
            "expected": "A'B' + BD + B'D'"
        },
        {
            "id": "advanced_5var",
            "title": "5-Variable Dual-Grid Map",
            "description": "Advanced 5-variable expression requiring 3D wrap-around across dual subgrids A=0 and A=1.",
            "variables": 5,
            "minterms": [0, 1, 4, 5, 16, 17, 20, 21, 28, 29],
            "dont_cares": [2, 6],
            "mode": "SOP",
            "expected": "B'D' + AC'D"
        }
    ]

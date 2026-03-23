"""
UNIFIX – AI Classification Engine (Phase 1: Rule-based NLP)
Phase 3: Plug in spaCy / transformers here without changing the interface.
"""

import re
from typing import Tuple, List, Dict


# ─────────────────────────────────────────────────────────────────────────────
# KEYWORD RULES
# ─────────────────────────────────────────────────────────────────────────────

PRIORITY_RULES: Dict[str, List[str]] = {
    "High": [
        "leaking", "leak", "flood", "flooding", "electric", "electrical",
        "switchboard", "short circuit", "fire", "smoke", "gas", "gas leak",
        "unsafe", "hazard", "dangerous", "danger", "injury", "sparking",
        "shock", "burning", "burst", "sewage", "contaminated", "emergency",
        "urgent", "critical", "immediately", "serious", "severe",
    ],
    "Medium": [
        "wifi", "wi-fi", "internet", "network", "projector", "printer",
        "computer", "server", "lab", "classroom", "exam", "seminar",
        "ac", "air conditioner", "broken", "not working", "failure",
        "faculty", "professor", "lecture", "assignment", "deadline",
        "software", "hardware", "display", "monitor", "keyboard",
    ],
    "Low": [
        "bench", "paint", "painting", "noisy", "noise", "slow", "comfort",
        "minor", "small", "suggestion", "request", "improve",
        "cosmetic", "furniture", "decoration", "beautify",
    ],
}

DEPARTMENT_RULES: Dict[str, List[str]] = {
    "CLM": [
        "hostel", "room", "dormitory", "dorm", "accommodation",
        "water", "pipe", "plumbing", "roof", "ceiling", "wall",
        "door", "window", "floor", "maintenance", "building",
        "campus", "ac", "air conditioner", "lift", "elevator",
    ],
    "ITKM": [
        "wifi", "wi-fi", "internet", "network", "computer", "laptop",
        "server", "printer", "projector", "software", "hardware",
        "system", "it", "tech", "technology", "website", "portal",
        "email", "password", "account", "login", "access",
    ],
    "Electrical": [
        "electric", "electrical", "switchboard", "power", "light",
        "bulb", "socket", "wire", "wiring", "short circuit", "fan",
        "sparking", "current", "voltage", "generator", "ups",
    ],
    "Maintenance": [
        "repair", "broken", "damage", "crack", "leak", "pipe",
        "flush", "toilet", "bathroom", "restroom", "gym",
        "furniture", "desk", "chair", "bench", "table",
    ],
    "Transport": [
        "bus", "transport", "vehicle", "shuttle", "cab", "driver",
        "route", "schedule", "parking", "parking lot",
    ],
    "Sports": [
        "sports", "ground", "court", "field", "gym", "gymnasium",
        "cricket", "football", "basketball", "equipment", "stadium",
    ],
}


# ─────────────────────────────────────────────────────────────────────────────
# CORE FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def _tokenize(text: str) -> str:
    """Lowercase and normalize text."""
    return text.lower().strip()


def extract_keywords(text: str) -> List[str]:
    """Extract matched keywords from text."""
    normalized = _tokenize(text)
    found = []
    for priority_list in PRIORITY_RULES.values():
        for kw in priority_list:
            if kw in normalized and kw not in found:
                found.append(kw)
    for dept_list in DEPARTMENT_RULES.values():
        for kw in dept_list:
            if kw in normalized and kw not in found:
                found.append(kw)
    return found[:10]  # cap to 10


def classify_priority(text: str) -> Tuple[str, str]:
    """
    Returns (priority, reason).
    High > Medium > Low. Applies safety overrides.
    """
    normalized = _tokenize(text)

    # Safety override – any high-risk keyword → force High
    for kw in PRIORITY_RULES["High"]:
        if kw in normalized:
            reason = (
                f"Safety/hazard keyword '{kw}' detected. "
                "Priority elevated to HIGH automatically."
            )
            return "High", reason

    # Medium check
    for kw in PRIORITY_RULES["Medium"]:
        if kw in normalized:
            reason = (
                f"Academic/equipment keyword '{kw}' detected. "
                "Assigned MEDIUM priority."
            )
            return "Medium", reason

    # Low default
    reason = "No critical keywords detected. Assigned LOW priority."
    return "Low", reason


def classify_department(text: str) -> Tuple[str, float]:
    """
    Returns (department_name, confidence_score).
    Scores based on keyword match count.
    """
    normalized = _tokenize(text)
    scores: Dict[str, int] = {}

    for dept, keywords in DEPARTMENT_RULES.items():
        count = sum(1 for kw in keywords if kw in normalized)
        if count > 0:
            scores[dept] = count

    if not scores:
        return "CLM", 0.5  # fallback

    best_dept = max(scores, key=scores.get)
    total_matches = sum(scores.values())
    confidence = round(scores[best_dept] / total_matches, 2)

    return best_dept, confidence


def analyze_issue(description: str) -> Dict:
    """
    Full AI pipeline: keywords → priority → department.
    Returns structured result dict.

    Phase 3: Replace internals with spaCy/ML model.
    Interface stays the same:
        dept = get_department(description)
        priority = get_priority(description)
    """
    keywords        = extract_keywords(description)
    priority, reason = classify_priority(description)
    dept_name, conf  = classify_department(description)

    return {
        "priority":        priority,
        "department_name": dept_name,
        "keywords":        ", ".join(keywords),
        "reason":          reason,
        "confidence":      conf,
    }

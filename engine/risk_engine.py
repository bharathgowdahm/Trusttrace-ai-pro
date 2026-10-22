"""Risk engine: heuristic 0-100 scam-risk scoring."""
from typing import Dict, List
from detectors.message_scanner import RULES as MESSAGE_RULES
from detectors.url_inspector import URL_RULE_WEIGHTS

DISCLAIMER = ("Heuristic estimate only -- not a calibrated probability of fraud. "
              "Always verify through official channels before acting.")

_WEIGHTS: Dict[str, int] = {r["rule_id"]: int(r["weight"]) for r in MESSAGE_RULES}
_WEIGHTS.update(URL_RULE_WEIGHTS)

def _level(score: int) -> str:
    if score >= 75: return "Critical"
    if score >= 50: return "High"
    if score >= 25: return "Medium"
    return "Low"

def score_findings(findings: List[Dict]) -> Dict:
    contributions, total, seen = [], 0, set()
    for f in findings or []:
        rid = f.get("rule_id", "")
        if rid in seen: continue
        seen.add(rid)
        pts = _WEIGHTS.get(rid, 8)
        total += pts
        contributions.append({"rule_id": rid, "points": pts, "evidence": f.get("evidence","")})
    contributions.sort(key=lambda c: c["points"], reverse=True)
    score = max(0, min(100, int(total)))
    return {"score": score, "level": _level(score), "contributions": contributions}

def assess(text: str = "", urls: List[str] = None) -> Dict:
    from detectors.message_scanner import scan_message, extract_urls as _extract
    from detectors.url_inspector import inspect_url
    findings: List[Dict] = list(scan_message(text))
    for u in list(urls or []) + _extract(text or ""):
        findings.extend(inspect_url(u))
    scored = score_findings(findings)
    return {**scored, "findings": findings, "disclaimer": DISCLAIMER}

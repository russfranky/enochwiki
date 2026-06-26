#!/usr/bin/env python3
"""Assemble the canonical QA spreadsheet from the discovery agents' JSON output.

Reads the four tool-result files (one per feature cluster), extracts the embedded
```json block, merges features, and writes the canonical catalog + detail sheets:

  docs/qa/feature-catalog.csv   <- the single canonical source of truth (feature level)
  docs/qa/test-cases.csv        <- every generated test case (Phase 2)
  docs/qa/defects.csv           <- every defect found via static execution (Phase 3)
"""
import json, re, csv, sys, os

ROOT = "/Users/russ/Documents/GITHUB/enochWIKI"
TR = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("TR", "")
FILES = {
    "AI": "toolu_01JtVWXfWmkSQiCh2QTfZd6f.json",
    "ST": "toolu_016gZnvVweqEVy3iaLx9cxcj.json",
    "ED": "toolu_01CHBtoYmxskevGygv4gdhkH.json",
    "UI": "toolu_01W55XxXTugbYudegnAYnCBR.json",
}
SEV_RANK = {"critical": 4, "high": 3, "medium": 2, "low": 1, "": 0}
TODAY = "2026-06-26"

def extract_text(path):
    with open(path) as f:
        blob = json.load(f)
    # tool-result file is a list of content parts; concatenate text parts
    if isinstance(blob, list):
        return "".join(p.get("text", "") for p in blob if isinstance(p, dict))
    if isinstance(blob, dict):
        return blob.get("text", "") or json.dumps(blob)
    return str(blob)

def extract_json(text):
    # find the ```json ... ``` fence; tolerate ``` without language
    m = re.search(r"```json\s*(.+?)```", text, re.S)
    if not m:
        m = re.search(r"```\s*(\{.+?\})\s*```", text, re.S)
    if not m:
        # last resort: first {...} that parses
        start = text.find("{")
        return json.loads(text[start:])
    return json.loads(m.group(1))

def main():
    features = []
    errors = []
    for cluster, fn in FILES.items():
        path = os.path.join(TR, fn)
        try:
            data = extract_json(extract_text(path))
            feats = data["features"] if isinstance(data, dict) else data
            for ft in feats:
                ft["_cluster"] = cluster
            features.extend(feats)
            print(f"  {cluster}: {len(feats)} features")
        except Exception as e:
            errors.append(f"{cluster} ({fn}): {e}")
            print(f"  {cluster}: PARSE FAILED -> {e}")
    if errors:
        print("PARSE ERRORS:\n" + "\n".join(errors))
        # don't hard-fail; emit what we have

    # ---- defects.csv (Phase 3 static findings) ----
    defects = []
    dn = 0
    for ft in features:
        for d in ft.get("observed_defects", []) or []:
            dn += 1
            defects.append({
                "Defect ID": f"D-{dn:03d}",
                "Feature ID": ft["id"],
                "Description": d.get("desc", ""),
                "Severity": d.get("severity", ""),
                "Reproduction Steps": d.get("repro", "static code review — see Description (file:line)"),
                "Expected Result": d.get("expected", "per documented Expected Behaviour"),
                "Actual Result": d.get("actual", "see Description"),
                "Root Cause Hypothesis": d.get("root_cause_hypothesis", ""),
                "Status": "Open",
                "Found": TODAY,
            })

    # ---- test-cases.csv (Phase 2) ----
    tests = []
    for ft in features:
        for tc in ft.get("test_cases", []) or []:
            tests.append({
                "Test Case ID": tc.get("id", ""),
                "Feature ID": ft["id"],
                "Type": tc.get("type", ""),
                "Description": tc.get("desc", ""),
                "Steps": tc.get("steps", ""),
                "Expected": tc.get("expected", ""),
                "Status": "Not run",
                "Last Run": "",
            })

    # ---- feature-catalog.csv (canonical) ----
    by_feat_defects = {}
    by_feat_maxsev = {}
    for d in defects:
        by_feat_defects.setdefault(d["Feature ID"], 0)
        by_feat_defects[d["Feature ID"]] += 1
        cur = by_feat_maxsev.get(d["Feature ID"], "")
        if SEV_RANK[d["Severity"]] > SEV_RANK.get(cur, 0):
            by_feat_maxsev[d["Feature ID"]] = d["Severity"]

    catalog = []
    for ft in features:
        fid = ft["id"]
        tc_ids = [tc.get("id", "") for tc in ft.get("test_cases", []) or []]
        dcount = by_feat_defects.get(fid, 0)
        maxsev = by_feat_maxsev.get(fid, "")
        status = "Defects found (static)" if dcount else "Reviewed — no static defects"
        surface = ft.get("endpoint") or ft.get("screen") or ""
        catalog.append({
            "Feature ID": fid,
            "Feature Name": ft.get("name", ""),
            "Surface": surface,
            "User Story": ft.get("user_story", ""),
            "Expected Behaviour": ft.get("expected_behaviour", ""),
            "Edge Cases": " | ".join(ft.get("edge_cases", []) or []),
            "Validation Rules": " | ".join(ft.get("validation_rules", []) or []),
            "Dependencies": " | ".join(ft.get("dependencies", []) or []),
            "Assumptions": " | ".join(ft.get("assumptions", []) or []),
            "Test Cases": f"{len(tc_ids)} ({', '.join(tc_ids)})",
            "Current Status": status,
            "Defect Count": dcount,
            "Severity": maxsev,
            "Notes": " | ".join(ft.get("code_refs", []) or [])[:300],
            "Last Tested Date": TODAY,
        })

    os.makedirs(os.path.join(ROOT, "docs/qa"), exist_ok=True)

    def write_csv(name, rows, fields):
        with open(os.path.join(ROOT, "docs/qa", name), "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=fields)
            w.writeheader()
            for r in rows:
                w.writerow(r)

    write_csv("feature-catalog.csv", catalog,
              ["Feature ID","Feature Name","Surface","User Story","Expected Behaviour",
               "Edge Cases","Validation Rules","Dependencies","Assumptions","Test Cases",
               "Current Status","Defect Count","Severity","Notes","Last Tested Date"])
    write_csv("test-cases.csv", tests,
              ["Test Case ID","Feature ID","Type","Description","Steps","Expected","Status","Last Run"])
    write_csv("defects.csv", defects,
              ["Defect ID","Feature ID","Description","Severity","Reproduction Steps",
               "Expected Result","Actual Result","Root Cause Hypothesis","Status","Found"])

    # summary to stdout
    from collections import Counter
    sev = Counter(d["Severity"] for d in defects)
    typ = Counter(t["Type"] for t in tests)
    print(f"\nFEATURES: {len(features)} | TEST CASES: {len(tests)} | DEFECTS: {len(defects)}")
    print(f"Defects by severity: {dict(sev)}")
    print(f"Test cases by type: {dict(typ)}")
    print(f"Features by cluster: {dict(Counter(ft['_cluster'] for ft in features))}")

if __name__ == "__main__":
    main()

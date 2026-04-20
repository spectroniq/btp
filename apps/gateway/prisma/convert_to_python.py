import json
import re
import sys

def convert_simple_function(name, params):
    """Convert a JS function to a Python def."""
    if params.strip():
        py_params = params.strip()
    else:
        py_params = ""
    return f"def {name}({py_params}):\n    pass"

def convert_class(js_code):
    """Convert a JS class with methods to a Python class."""
    # Extract class name
    class_match = re.match(r'class\s+(\w+)', js_code)
    if not class_match:
        return js_code
    class_name = class_match.group(1)

    # Extract all method signatures: methodName(params) {}
    method_pattern = re.compile(r'(\w+)\s*\(([^)]*)\)\s*\{\}')
    methods = method_pattern.findall(js_code)

    lines = [f"class {class_name}:"]
    for method_name, params in methods:
        py_method = "__init__" if method_name == "constructor" else method_name
        if params.strip():
            py_params = f"self, {params.strip()}"
        else:
            py_params = "self"
        lines.append(f"    def {py_method}({py_params}):")
        lines.append(f"        pass")
        lines.append("")

    return "\n".join(lines).rstrip()

def js_to_python(js_code):
    """Convert a JS starter code string to Python."""
    code = js_code.strip()

    # Class-based solution
    if code.startswith("class "):
        return convert_class(code)

    # One or more function definitions
    # Matches: function name(params) { ... }  (body may be multiline/whitespace)
    func_pattern = re.compile(
        r'function\s+(\w+)\s*\(([^)]*)\)\s*\{[^}]*\}',
        re.DOTALL
    )

    parts = []
    last_end = 0
    for m in func_pattern.finditer(code):
        # Capture any text between functions (e.g. blank lines)
        between = code[last_end:m.start()].strip()
        if between:
            parts.append(between)
        parts.append(convert_simple_function(m.group(1), m.group(2)))
        last_end = m.end()

    # Anything after last match
    tail = code[last_end:].strip()
    if tail:
        parts.append(tail)

    if parts:
        return "\n\n".join(parts)

    # Fallback: return as-is
    return js_code

# ── Main ──────────────────────────────────────────────────────────────────────
path = "./problems.json"

with open(path, "r", encoding="utf-8") as f:
    problems = json.load(f)

converted = 0
for problem in problems:
    if "starterCode" in problem:
        original = problem["starterCode"]
        problem["starterCode"] = js_to_python(original)
        if problem["starterCode"] != original:
            converted += 1

with open(path, "w", encoding="utf-8") as f:
    json.dump(problems, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"Done. Converted {converted}/{len(problems)} starter codes to Python.")

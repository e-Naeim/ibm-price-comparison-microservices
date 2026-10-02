"""Set actual verified backend URLs in frontend/html/index.html."""
import argparse
import json
from pathlib import Path
import re
from urllib.parse import urlsplit


def endpoint(value):
    parsed = urlsplit(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise argparse.ArgumentTypeError("Provide an absolute HTTP(S) service URL")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise argparse.ArgumentTypeError("Use a service URL without credentials, query, or fragment")
    if any(ord(char) < 32 for char in value) or "<" in value or ">" in value:
        raise argparse.ArgumentTypeError("Invalid URL characters")
    return value.rstrip("/") + "/"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--products", required=True, type=endpoint)
    parser.add_argument("--dealers", required=True, type=endpoint)
    args = parser.parse_args()
    path = Path(__file__).parent / "frontend/html/index.html"
    content = path.read_text(encoding="utf-8")
    for name, value in (("produrl", args.products), ("dealerurl", args.dealers)):
        pattern = rf'let {name} = "[^"\\]*(?:\\.[^"\\]*)*"'
        content, count = re.subn(pattern, lambda _m: f"let {name} = {json.dumps(value)}", content)
        if count != 1:
            parser.error(f"Expected exactly one {name} declaration; file not changed")
    path.write_text(content, encoding="utf-8")
    print("Updated frontend/html/index.html with the supplied service endpoints.")


if __name__ == "__main__":
    main()

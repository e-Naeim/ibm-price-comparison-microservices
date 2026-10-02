"""Serve the static price-comparison client on its own microservice."""
import os
from pathlib import Path
from flask import Flask, send_from_directory

app = Flask(__name__)
HTML_DIR = Path(__file__).with_name("html")


@app.get("/")
def get_home_page():
    return send_from_directory(HTML_DIR, "index.html")


@app.get("/health")
def health():
    return {"status": "ok", "service": "price-comparison-frontend"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5001)))

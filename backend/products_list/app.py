"""Read-only product catalogue API for the price comparison application."""
import json
import os
from pathlib import Path
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
DATA_FILE = Path(__file__).with_name("products.json")


def catalogue():
    with DATA_FILE.open(encoding="utf-8") as source:
        return json.load(source)["products"]


@app.get("/health")
def health():
    return {"status": "ok", "service": "product-details"}


@app.get("/products")
def get_products_list():
    return {"products": [item["product"] for item in catalogue()]}


@app.get("/getdealers/<product>")
def get_dealers(product):
    for item in catalogue():
        if item["product"] == product:
            return {"dealers": item["Dealers"]}
    return {"message": "Could not find dealers for this product"}, 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))

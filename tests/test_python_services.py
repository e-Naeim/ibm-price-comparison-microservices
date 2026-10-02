import importlib.util
import json
import os
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

products = load("products_app", ROOT / "backend/products_list/app.py")
frontend = load("frontend_app", ROOT / "frontend/app.py")

class ProductTests(unittest.TestCase):
    def setUp(self):
        self.client = products.app.test_client()

    def test_products_from_any_working_directory(self):
        previous = os.getcwd()
        try:
            os.chdir("/tmp")
            response = self.client.get("/products")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json["products"], ["Headphones", "Laptop", "Mouse", "Printer"])
        finally:
            os.chdir(previous)

    def test_laptop_dealers_have_consistent_case(self):
        self.assertEqual(self.client.get("/getdealers/Laptop").json["dealers"],
                         ["GH Computers", "Tech City", "Ez PC"])

    def test_unknown_product(self):
        self.assertEqual(self.client.get("/getdealers/Unknown").status_code, 404)

    def test_cors(self):
        response = self.client.get("/products", headers={"Origin": "https://example.com"})
        self.assertEqual(response.headers["Access-Control-Allow-Origin"], "https://example.com")

    def test_health(self):
        self.assertEqual(self.client.get("/health").json["status"], "ok")

    def test_catalogue_matches_every_dealer_price(self):
        prices = json.loads((ROOT / "backend/dealer_details/utils/dealers.json").read_text())["dealers"]
        for item in products.catalogue():
            expected = {d["Dealer"] for d in prices if item["product"] in d["products"]}
            self.assertEqual(set(item["Dealers"]), expected, item["product"])

class FrontendTests(unittest.TestCase):
    def test_index_served_from_any_working_directory(self):
        previous = os.getcwd()
        try:
            os.chdir("/tmp")
            response = frontend.app.test_client().get("/")
            self.assertEqual(response.status_code, 200)
            self.assertIn(b"Products price comparison", response.data)
            self.assertIn(b'id="selProd"', response.data)
            self.assertIn(b'id="selDealer"', response.data)
            response.close()
        finally:
            os.chdir(previous)

    def test_health(self):
        self.assertEqual(frontend.app.test_client().get("/health").json["status"], "ok")

if __name__ == "__main__":
    unittest.main()

class EndpointConfigurationTests(unittest.TestCase):
    def test_endpoint_validation(self):
        import argparse
        helper = load("configure", ROOT / "configure_endpoints.py")
        self.assertEqual(helper.endpoint("https://example.com"), "https://example.com/")
        for invalid in ["file:///tmp/test", "https://user:secret@example.com", "https://example.com/?key=secret", "https://example.com/#fragment", "https://example.com/<script>"]:
            with self.assertRaises(argparse.ArgumentTypeError):
                helper.endpoint(invalid)

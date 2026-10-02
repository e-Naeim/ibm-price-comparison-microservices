"""Start all 3 real services, verify data contracts and exercise the real API UI flow."""
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def read(url):
    with urlopen(url, timeout=5) as response:
        return response.read()


def json_get(url):
    return json.loads(read(url))


processes = []
try:
    ports = [free_port() for _ in range(3)]
    product_url, dealer_url, frontend_url = [f"http://127.0.0.1:{port}" for port in ports]
    specs = [
        ([str(ROOT / ".venv/bin/gunicorn"), "--bind", f"127.0.0.1:{ports[0]}", "app:app"], ROOT / "backend/products_list"),
        (["node", "server.js"], ROOT / "backend/dealer_details"),
        ([str(ROOT / ".venv/bin/gunicorn"), "--bind", f"127.0.0.1:{ports[2]}", "app:app"], ROOT / "frontend"),
    ]
    with tempfile.TemporaryFile() as output:
        for index, (command, directory) in enumerate(specs):
            environment = {**os.environ, "PORT": str(ports[index])}
            processes.append(subprocess.Popen(command, cwd=directory, env=environment, stdout=output, stderr=output))
        for url in [product_url, dealer_url, frontend_url]:
            deadline = time.monotonic() + 15
            while True:
                try:
                    assert json_get(url + "/health")["status"] == "ok"
                    break
                except Exception:
                    if time.monotonic() >= deadline:
                        output.seek(0)
                        raise RuntimeError(output.read().decode())
                    time.sleep(0.1)
        assert b"Products price comparison" in read(frontend_url)
        products = json_get(product_url + "/products")["products"]
        assert products == ["Headphones", "Laptop", "Mouse", "Printer"]
        comparisons = 0
        from urllib.parse import quote
        for product in products:
            dealer_names = json_get(product_url + "/getdealers/" + quote(product))["dealers"]
            prices = json_get(dealer_url + "/allprice/" + quote(product))["prices"]
            assert set(dealer_names) == {price["key"] for price in prices}
            for price in prices:
                message = json_get(dealer_url + "/price/" + quote(price["key"]) + "/" + quote(product))["message"]
                assert message == f"{product} costs {price['value']} at {price['key']}"
                comparisons += 1
        print(f"PASS live APIs: 3 healthy services, {len(products)} products, {comparisons} matching dealer prices", flush=True)
        environment = {**os.environ, "PRODUCTS_URL": product_url, "DEALERS_URL": dealer_url, "FRONTEND_URL": frontend_url}
        subprocess.run(["node", "tests/live_frontend.js"], cwd=ROOT, env=environment, check=True)
finally:
    for process in processes:
        process.terminate()
    for process in processes:
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()

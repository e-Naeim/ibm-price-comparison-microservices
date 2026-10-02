"use strict";
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const app = require("../server");
let server;
let base;
before(async () => {
  server = await new Promise(resolve => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
test("health endpoint", async () => {
  const response = await fetch(base + "/health");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "ok");
});
test("selected product and encoded dealer name", async () => {
  const response = await fetch(base + "/price/Tech%20City/Laptop");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).message, "Laptop costs $850 at Tech City");
});
test("all dealer prices", async () => {
  const response = await fetch(base + "/allprice/Laptop");
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).prices, [
    { key: "Tech City", value: "$850" },
    { key: "Ez PC", value: "$1000" },
    { key: "GH Computers", value: "$1500" }
  ]);
});
test("unknown dealer and unavailable product return 404", async () => {
  for (const route of ["/price/Unknown/Laptop", "/price/Binglee/Laptop", "/allprice/Unknown"])
    assert.equal((await fetch(base + route)).status, 404);
});
test("inherited object properties are not products", async () => {
  assert.equal((await fetch(base + "/price/Binglee/toString")).status, 404);
  assert.equal((await fetch(base + "/allprice/constructor")).status, 404);
});
test("CORS supports independent frontend origin", async () => {
  const response = await fetch(base + "/allprice/Printer", { headers: { Origin: "https://example.com" } });
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
});

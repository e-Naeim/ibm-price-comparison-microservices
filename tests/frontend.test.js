"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const html = fs.readFileSync(path.join(__dirname, "../frontend/html/index.html"), "utf8");
const tick = () => new Promise(resolve => setImmediate(resolve));
function page() {
  const pending = [];
  const dom = new JSDOM(html, { runScripts: "dangerously", beforeParse(window) {
    window.fetch = (url, options) => new Promise((resolve, reject) => pending.push({ url, options, resolve, reject }));
  }});
  const doc = dom.window.document;
  const choose = (id, value) => {
    const select = doc.getElementById(id);
    select.value = value;
    select.dispatchEvent(new dom.window.Event("change"));
  };
  async function answer(index, data, status = 200) {
    pending[index].resolve({ ok: status < 400, status, json: async () => data });
    await tick();
  }
  return { dom, doc, pending, choose, answer };
}
async function ready() {
  const p = page();
  await p.answer(0, { products: ["Headphones", "Laptop", "Mouse", "Printer"] });
  return p;
}
async function laptop() {
  const p = await ready();
  p.choose("selProd", "Laptop");
  await p.answer(1, { dealers: ["GH Computers", "Tech City", "Ez PC"] });
  return p;
}
test("products populate and dependent dropdown starts disabled", async t => {
  const p = await ready(); t.after(() => p.dom.window.close());
  assert.equal(p.doc.getElementById("selProd").options.length, 5);
  assert.equal(p.doc.getElementById("selProd").disabled, false);
  assert.equal(p.doc.getElementById("selDealer").disabled, true);
});
test("select product lists dealers and All Dealers", async t => {
  const p = await laptop(); t.after(() => p.dom.window.close());
  assert.match(p.pending[1].url, /getdealers\/Laptop$/);
  assert.deepEqual([...p.doc.getElementById("selDealer").options].map(o => o.value),
    ["", "GH Computers", "Tech City", "Ez PC", "All Dealers"]);
});
test("selected dealer URL is encoded and displays price", async t => {
  const p = await laptop(); t.after(() => p.dom.window.close());
  p.choose("selDealer", "Tech City");
  assert.match(p.pending[2].url, /price\/Tech%20City\/Laptop$/);
  await p.answer(2, { message: "Laptop costs $850 at Tech City" });
  assert.equal(p.doc.getElementById("pricing").textContent, "Laptop costs $850 at Tech City");
});
test("all-dealers prices render a labelled table safely", async t => {
  const p = await laptop(); t.after(() => p.dom.window.close());
  p.choose("selDealer", "All Dealers");
  await p.answer(2, { prices: [{ key: "Tech City", value: "$850" }, { key: "<img src=x>", value: "$1000" }] });
  assert.equal(p.doc.querySelectorAll("tbody tr").length, 2);
  assert.equal(p.doc.querySelectorAll("#pricing img").length, 0);
  assert.equal(p.doc.querySelector("caption").textContent, "Laptop prices from all dealers");
});
test("product reset clears dealers and prices without a request", async t => {
  const p = await laptop(); t.after(() => p.dom.window.close());
  p.choose("selDealer", "Tech City");
  await p.answer(2, { message: "$850" });
  p.choose("selProd", "");
  assert.equal(p.pending.length, 3);
  assert.equal(p.doc.getElementById("pricing").textContent, "");
  assert.equal(p.doc.getElementById("selDealer").options.length, 1);
  assert.equal(p.doc.getElementById("selDealer").disabled, true);
});
test("dealer placeholder clears price without fetching", async t => {
  const p = await laptop(); t.after(() => p.dom.window.close());
  p.choose("selDealer", "");
  assert.equal(p.pending.length, 2);
});
test("newer product selection wins over slow earlier response", async t => {
  const p = await ready(); t.after(() => p.dom.window.close());
  p.choose("selProd", "Laptop");
  p.choose("selProd", "Mouse");
  await p.answer(2, { dealers: ["DXC Electronics", "Tech City"] });
  await p.answer(1, { dealers: ["GH Computers", "Tech City", "Ez PC"] });
  assert.deepEqual([...p.doc.getElementById("selDealer").options].map(o => o.value),
    ["", "DXC Electronics", "Tech City", "All Dealers"]);
});
test("product changes invalidate a pending price response", async t => {
  const p = await laptop(); t.after(() => p.dom.window.close());
  p.choose("selDealer", "Tech City");
  p.choose("selProd", "Mouse");
  await p.answer(2, { message: "Laptop costs $850 at Tech City" });
  assert.equal(p.doc.getElementById("pricing").textContent, "");
  await p.answer(3, { dealers: ["Tech City"] });
});
test("new dealer selection wins over slow old price", async t => {
  const p = await laptop(); t.after(() => p.dom.window.close());
  p.choose("selDealer", "GH Computers");
  p.choose("selDealer", "Tech City");
  await p.answer(3, { message: "Laptop costs $850 at Tech City" });
  await p.answer(2, { message: "Laptop costs $1500 at GH Computers" });
  assert.equal(p.doc.getElementById("pricing").textContent, "Laptop costs $850 at Tech City");
});
test("product API failure exposes retry that recovers", async t => {
  const p = page(); t.after(() => p.dom.window.close());
  await p.answer(0, {}, 500);
  assert.equal(p.doc.getElementById("retry").hidden, false);
  assert.match(p.doc.getElementById("status").textContent, /Could not load products/);
  p.doc.getElementById("retry").click();
  await p.answer(1, { products: ["Laptop"] });
  assert.equal(p.doc.getElementById("retry").hidden, true);
  assert.equal(p.doc.getElementById("selProd").disabled, false);
});
test("network errors and invalid price response fail visibly", async t => {
  const p = await laptop(); t.after(() => p.dom.window.close());
  p.choose("selDealer", "Tech City");
  p.pending[2].reject(new Error("Network unavailable"));
  await tick();
  assert.match(p.doc.getElementById("status").textContent, /Could not load this price/);
  p.choose("selDealer", "All Dealers");
  await p.answer(3, { prices: [] });
  assert.equal(p.doc.getElementById("pricing").textContent, "");
  assert.match(p.doc.getElementById("status").textContent, /Could not load this price/);
});

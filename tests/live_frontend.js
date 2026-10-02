"use strict";
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
async function waitFor(check, description) {
  const until = Date.now() + 10000;
  while (Date.now() < until) {
    if (check()) return;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error(`Timed out: ${description}`);
}
(async () => {
  const response = await fetch(process.env.FRONTEND_URL);
  assert.equal(response.status, 200);
  let html = await response.text();
  // Test configuration only. The deployed source is changed by configure_endpoints.py.
  html = html.replace(/let produrl = "[^"]+"/, `let produrl = "${process.env.PRODUCTS_URL}/"`)
    .replace(/let dealerurl = "[^"]+"/, `let dealerurl = "${process.env.DEALERS_URL}/"`);
  const dom = new JSDOM(html, { runScripts: "dangerously", beforeParse(window) { window.fetch = fetch; window.AbortController = AbortController; }});
  try {
    const document = dom.window.document;
    const choose = (id, value) => {
      const select = document.getElementById(id);
      select.value = value;
      select.dispatchEvent(new dom.window.Event("change"));
    };
    await waitFor(() => !document.getElementById("selProd").disabled, "products");
    assert.equal(document.getElementById("selProd").options.length, 5);
    choose("selProd", "Laptop");
    await waitFor(() => !document.getElementById("selDealer").disabled, "dealers");
    choose("selDealer", "Tech City");
    await waitFor(() => document.getElementById("pricing").textContent.includes("$850"), "selected dealer price");
    assert.equal(document.getElementById("pricing").textContent, "Laptop costs $850 at Tech City");
    choose("selDealer", "All Dealers");
    await waitFor(() => document.querySelectorAll("tbody tr").length === 3, "all dealer prices");
    assert.deepEqual([...document.querySelectorAll("tbody tr")].map(row => [...row.cells].map(cell => cell.textContent)),
      [["Tech City", "$850"], ["Ez PC", "$1000"], ["GH Computers", "$1500"]]);
    choose("selProd", "");
    assert.equal(document.getElementById("pricing").textContent, "");
    assert.equal(document.getElementById("selDealer").disabled, true);
    console.log("PASS live frontend integration: real product API, dealer API, selected price, all 3 prices, reset");
  } finally { dom.window.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

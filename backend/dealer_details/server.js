"use strict";
const express = require("express");
const cors = require("cors");
const { dealers } = require("./utils/dealers.json");
const app = express();
app.use(cors());
app.disable("x-powered-by");

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "dealer-pricing" });
});

app.get("/price/:dealer/:product", (request, response) => {
  const { dealer: name, product } = request.params;
  const dealer = dealers.find(item => item.Dealer === name);
  if (!dealer || !Object.hasOwn(dealer.products, product)) {
    return response.status(404).json({ message: `${product} is not available with ${name}` });
  }
  return response.json({ message: `${product} costs ${dealer.products[product]} at ${name}` });
});

app.get("/allprice/:product", (request, response) => {
  const { product } = request.params;
  const prices = dealers.filter(dealer => Object.hasOwn(dealer.products, product))
    .map(dealer => ({ key: dealer.Dealer, value: dealer.products[product] }));
  if (!prices.length) {
    return response.status(404).json({ message: "This product is not available from any dealer" });
  }
  return response.json({ prices });
});

if (require.main === module) {
  const port = Number(process.env.PORT || 8080);
  app.listen(port, "0.0.0.0", () => console.log(`Dealer pricing service listening on port ${port}`));
}
module.exports = app;

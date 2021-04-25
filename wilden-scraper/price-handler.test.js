const priceHandler = require("./price-handler.js");

test("should get price from string", () => {
  const { getPriceFromString } = priceHandler;

  // getPriceFromString("Monstera Thai Constellation € 224.95");

  expect(getPriceFromString("Monstera Thai Constellation € 224.95")).toEqual(
    "224.95"
  );
  expect(getPriceFromString("KR1,499.00 Inkl. moms")).toEqual("1,499.00");
  expect(getPriceFromString("€ 69.95")).toEqual("69.95");
});

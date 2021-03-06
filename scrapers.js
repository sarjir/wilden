const puppeteer = require("puppeteer"); // Can I use es6 modules?

// https://www.youtube.com/watch?v=4q9CNtwdawA&ab_channel=FabianGrohs
const fetchProductsFromGronvaxtriket = async (url) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  fixConsoleLog(page);

  await page.goto(url);

  const allProducts = await findAndTransformAllProducts(page);
  console.log("allProducts", allProducts);

  await browser.close();
};

function fixConsoleLog(page) {
  page.on("console", (msg) => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`);
  });
}

async function findAndTransformAllProducts(page) {
  let allProducts = [];

  while (await findNextPageButton(page)) {
    const products = await getProducts(page);
    allProducts = [...allProducts, ...products];
    await pressNextPage(page);
  }

  return allProducts;
}

async function findNextPageButton(page) {
  return await page.$(".page-numbers .next");
}

const getProducts = async (page) => {
  return await page.$$eval(".product", transformProducts);
};

const transformProducts = (products) =>
  products.map((product) => ({
    name: product.querySelector("h2").innerText,
    price: product.querySelector(".price").innerText,
  }));

async function pressNextPage(page) {
  const button = await findNextPageButton(page);

  button.click();
  await page.waitForNavigation();
}

fetchProductsFromGronvaxtriket(
  "https://gronvaxtriket.se/product-category/alla-vaxter/"
);

const puppeteer = require("puppeteer"); // Can I use es6 modules?

/* Det verkar som att det kommer två priser när en växt är på rea.
 * Hur matchar jag att något kostar typ en miljon?? Känns som att vi borde ta höjd för det i alla fall.
 * Jag kommer också behöva plocka ut vilken currency något är i.
 */

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

// function getPriceFromString(string) {
//   console.log("string", string);
//   const numberRegex = /\d+[.|,]\d{2}/g;
//   return string.match(numberRegex)[0];
// }

const transformProducts = (products) => {
  // Why on earth can I not have this in global scope?
  function getPriceFromString(string) {
    const numberRegex = /(\d+[.|,])?\d+[.|,]\d+/g;
    return string.match(numberRegex)[0];
  }

  return products.map((product) => {
    const test = product.querySelector(".price").innerText;
    const price = getPriceFromString(test);

    return {
      name: product.querySelector("h2").innerText,
      price,
    };
  });
};

async function pressNextPage(page) {
  const button = await findNextPageButton(page);

  button.click();
  await page.waitForNavigation();
}

fetchProductsFromGronvaxtriket(
  "https://gronvaxtriket.se/product-category/alla-vaxter/"
);

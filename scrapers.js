const puppeteer = require("puppeteer"); // Can I use es6 modules?

async function scrape(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const [el] = await page.$x(
    "/html/body/div[1]/section/div/ul/li[2]/a/div/img[1]"
  );
  const src = await el.getProperty("src");
  const srcText = await src.jsonValue();

  console.log("srcText", srcText);

  await page.close();
  await browser.close();
}

// Denna fungerar!! :D
// https://www.youtube.com/watch?v=4q9CNtwdawA&ab_channel=FabianGrohs
const fabianWay = async (url) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on("console", (msg) => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`);
  });
  await page.goto(url);

  // const products = [];
  const getProducts = async () =>
    await page.$$eval(".product", (products) =>
      products.map((product) => ({
        name: product.querySelector("h2").innerText,
        price: product.querySelector(".price").innerText,
      }))
    );

  const nextPageButton = () => page.$(".page-numbers .next");

  let allProducts = [];
  while (await nextPageButton()) {
    const products = await getProducts();
    allProducts = [...allProducts, ...products];
    const button = await nextPageButton();

    button.click();
    await page.waitForNavigation();
  }

  //------
  // const products = await page.evaluate(() =>
  //   Array.from(document.querySelectorAll(".product"), (e) => ({
  //     name: e.querySelector("h2").innerText,
  //   }))
  // );
  // -----

  console.log("allProducts", allProducts);

  //----------
  // for (let i = 0; i < data.length; i++) {
  //   const item = await (await tweets[i].getProperty("innerText")).jsonValue();
  //   console.log("item", item);
  // }
  // --------
  // data.forEach(async (item) => {
  //   const test = await item.$(".price");
  //   const lol = await (await test.getProperty("innerText")).jsonValue();
  //   console.log("lol", lol);
  // });

  // console.log("data", data);

  await browser.close();
};

// Loop through all pages until there are no more items
const goToNextPage = async (document) => {
  // document.querySelector('.page-numbers .next')
  const nextPageButton = document.querySelector(".page-numbers .next");
  if (!nextPageButton) return;

  await nextPageButton.evaluate((nextPageButton) => {
    nextPageButton.click();
  });
};

function extractProducts(products) {
  const transformedProducts = [];
  for (var item of products.values()) {
    transformedProducts.push({
      name: item.querySelector("h2").innerText,
      price: item.querySelector(".price").innerText,
    });
  }
  return transformedProducts;
}

// scrape("https://gronvaxtriket.se/product-category/alla-vaxter/");
// getList("https://gronvaxtriket.se/product-category/alla-vaxter/");
// funfunfunctionWay("https://gronvaxtriket.se/product-category/alla-vaxter/");
fabianWay("https://gronvaxtriket.se/product-category/alla-vaxter/");
// fabianWay("https://gronvaxtriket.se/product-category/alla-vaxter/page/2/");

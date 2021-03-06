const puppeteer = require("puppeteer"); // Can I use es6 modules?

// https://www.youtube.com/watch?v=4q9CNtwdawA&ab_channel=FabianGrohs
const fabianWay = async (url) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on("console", (msg) => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`);
  });
  await page.goto(url);

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

  console.log("allProducts", allProducts);

  await browser.close();
};

fabianWay("https://gronvaxtriket.se/product-category/alla-vaxter/");

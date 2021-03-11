const puppeteer = require("puppeteer"); // Can I use es6 modules?
const admin = require("firebase-admin");
// const serviceAccount = require("path/to/serviceAccountKey.json");

// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
//   databaseURL: "https://wilden.firebaseio.com",
// });

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

/* Det verkar som att det kommer två priser när en växt är på rea.
 * Hur matchar jag att något kostar typ en miljon?? Känns som att vi borde ta höjd för det i alla fall.
 * Jag kommer också behöva plocka ut vilken currency något är i.
 */

const namesToSave = [
  "MONSTERA SILTEPECEANA",
  "MONSTERA STANDAYLANA",
  "MONSTERA DUBIA",
];

// https://www.youtube.com/watch?v=4q9CNtwdawA&ab_channel=FabianGrohs
const fetchProductsFromGronvaxtriket = async (url) => {
  admin.initializeApp();
  const db = admin.firestore();

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  fixConsoleLog(page);

  await page.goto(url);

  const allProducts = await findAndTransformAllProducts(page);
  // console.log("allProducts", allProducts);

  // Save to database
  // allProducts.forEach(async (item) => {
  //   await db.collection("Plants").add(item);
  // });

  const filteredProds = allProducts
    .filter((item) => {
      for (const name of namesToSave) {
        const match = item.name.match(name);
        if (match) {
          console.log("item", item);
          return true;
        }
      }
    })
    .map((item) => {
      // for (const name of namesToSave) {
      //   const match = item.name.match(name);
      //   if (match) {
      //     console.log("match  ", match);
      //     return {
      //       ...item,
      //       name: match[0],
      //     };
      //   }
      // }

      return forEachApprovedName(item);
    });

  console.log("filteredProds", filteredProds);

  await browser.close();
};

const forEachApprovedName = (item) => {
  for (const name of namesToSave) {
    const match = item.name.match(name);
    if (match) {
      return {
        ...item,
        name: match[0],
      };
    }
  }
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

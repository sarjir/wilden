const puppeteer = require("puppeteer"); // Can I use es6 modules?
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const priceHandler = require("./price-handler.js");
const fs = require("fs");
// import puppeteer from "puppeteer"; // Can I use es6 modules?
// import admin from "firebase-admin";
// import fetch from "node-fetch";
// import fs from "fs";

// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
//   databaseURL: "https://wilden.firebaseio.com",
// });

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

const app = admin.initializeApp(
  {
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://wilden.firebaseio.com",
    storageBucket: "wilden-cc3da.appspot.com",
  },
  "Wilden"
);

/* Det verkar som att det kommer två priser när en växt är på rea.
 * Hur matchar jag att något kostar typ en miljon?? Känns som att vi borde ta höjd för det i alla fall.
 * Jag kommer också behöva plocka ut vilken currency något är i.
 */

const namesToSave = [
  "MONSTERA SILTEPECEANA",
  "MONSTERA STANDAYLANA",
  "MONSTERA DUBIA",
  "SYNGONIUM PINK SPLASH", // Denna hittas inte för att det finns "podophyllum" emellan. Behöver ses över!
];

// https://www.youtube.com/watch?v=4q9CNtwdawA&ab_channel=FabianGrohs
const fetchProductsFromGronvaxtriket = async (url) => {
  admin.initializeApp();
  const db = admin.firestore();

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const bucket = admin.storage().bucket("gs://wilden-cc3da.appspot.com/");

  fixConsoleLog(page);

  await page.goto(url);

  const allProducts = await findAndTransformAllProducts(page);

  const filterOnlyChosen = allProducts.filter((item) => {
    let match;

    const addMatch = (theMatch) => {
      match = theMatch;
    };

    checkIfMatch(item, addMatch);

    return !!match;
  });

  console.log("filterOnlyChosen", filterOnlyChosen);

  const productsWithVariants = filterOnlyChosen.map((item) => {
    let itemWithVariant;

    const makeItemWithVariant = (match) => {
      itemWithVariant = {
        ...item,
        variant: match[0],
        website: url,
      };
    };

    checkIfMatch(item, makeItemWithVariant);

    return itemWithVariant;
  });

  console.log("productsWithVariants", productsWithVariants);

  const withImage = await Promise.all(
    productsWithVariants.map(async (item) => {
      const image = await fetch(item.url)
        .then((result) => {
          return result.buffer();
        })
        .catch((data) => {
          console.log("something went wrong!", data);
          return null;
        });

      const fileName = await item.name.replaceAll(" ", "-");

      await fs.writeFile(`/tmp/${fileName}.jpg`, image, (err) => {
        if (err) {
          console.log("something went wrong with saving the file to disc", err);
        }
        console.log("The file has been saved", fileName);
      });

      // Varje gång jag kör sparar vi nya bilder. Kommenterar ut för nu!
      // await bucket.upload(`/tmp/${fileName}.jpg`);

      return {
        ...item,
        imageUrl: `/tmp/${fileName}.jpg`, // Borde spara utan tmp. Då kan jag använda den urlen för att hämta från storage senare
      };
      // return item;
    })
  );

  console.log("withImage", withImage);

  // Save to database
  withImage.forEach(async (item) => {
    // const now = new Date();
    // const options = { year: "numeric", month: "numeric", day: "numeric" };
    // const currentDate = now.toLocaleDateString("sv-SE", options);
    //******* */ use this one, but just not yet.*******
    // await db.collection(item.variant).add(item);
    // await variantRef.collection(currentDate).add(item);
  });

  await browser.close();
};

const checkIfMatch = (item, actOnMatch) => {
  for (let name of namesToSave) {
    if (item.name.match(name)) {
      match = item.name.match(name);

      actOnMatch(match);
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
  const { getPriceFromString } = await priceHandler;
  await page.exposeFunction("getPriceFromString", getPriceFromString);

  while (await findNextPageButton(page)) {
    const products = await getProducts(page);
    console.log("products", products);

    allProducts = [...allProducts, ...products];
    await pressNextPage(page);
  }

  console.log("allProducts", allProducts);

  return allProducts;
}

async function findNextPageButton(page) {
  return await page.$(".page-numbers .next");
}

const getProducts = async (page) => {
  return await page.$$eval(".product", transformProducts);
};

const transformProducts = (products) => {
  return products.map((product) => {
    const sourcePrice = product.querySelector(".price").innerText;
    const price = getPriceFromString(sourcePrice);

    return {
      name: product.querySelector("h2").innerText,
      price,
      url: product.querySelector("img").getAttribute("src"), // Maybe I should change this to source url, in order to acctually store my own url on "url"?
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

// export default fetchProductsFromGronvaxtriket;
module.exports = fetchProductsFromGronvaxtriket;

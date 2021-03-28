const puppeteer = require("puppeteer"); // Can I use es6 modules?
const admin = require("firebase-admin");
const fetch = require("node-fetch");
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
  "SYNGONIUM PINK SPLASH", // Denna hittas inte för att det finns "podophyllum" emellan. Behöver ses över!
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

  const productsWithVariants = allProducts.map((item) => {
    for (const name of namesToSave) {
      const match = item.name.match(name); // Denna verkar bara matcha när namnet exakt samma.
      if (match) {
        return {
          ...item,
          variant: match[0],
        };
      }

      return item;
    }
  });

  const withImage = await Promise.all(
    productsWithVariants.map(async (item) => {
      const image = await fetch(item.url)
        .then((result) => {
          // console.log("result", result.blob());
          // test = result.blob();
          return result.blob();
        })
        .catch((data) => {
          console.log("something went wrong!", data);
          return null;
        });

      return {
        ...item,
        image,
      };
      // return item;
    })
  );

  console.log("withImage", withImage);

  await browser.close();
};

// const forEachApprovedNameSetNewItemName = (item) => {
//   for (const name of namesToSave) {
//     const match = item.name.match(name);
//     if (match) {
//       return {
//         ...item,
//         name: match[0],
//       };
//     }
//   }
// };

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

const transformProducts = (products) => {
  // Why on earth can I not have this in global scope?
  function getPriceFromString(string) {
    const numberRegex = /(\d+[.|,])?\d+[.|,]\d+/g;
    return string.match(numberRegex)[0];
  }

  return products.map((product) => {
    const sourcePrice = product.querySelector(".price").innerText;
    const price = getPriceFromString(sourcePrice);

    // const imageUrl = product.querySelector("img").getAttribute("src");
    // let test;
    // fetch(imageUrl)
    //   .then((result) => {
    //     // console.log("result", result.blob());
    //     test = result.blob();

    //     return result.blob();
    //   })
    //   .then((blob) => {
    //     return blob;
    //   })
    //   .catch((data) => {
    //     // console.log("something went wrong!", data);
    //     return null;
    //   });

    // console.log("image", image);
    // console.log("test", test);

    //---------
    // .then((data) => {
    //   console.log("data", data);
    // });
    // console.log("image", await image);

    return {
      name: product.querySelector("h2").innerText,
      price,
      // image,
      url: product.querySelector("img").getAttribute("src"),
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

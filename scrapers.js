const puppeteer = require("puppeteer"); // Can I use es6 modules?
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const fs = require("fs");

// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
//   databaseURL: "https://wilden.firebaseio.com",
// });

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

admin.initializeApp(
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
    for (let i = 0; i < namesToSave.length; i++) {
      // console.log("i", i);
      console.log(`*** item ${i} ***`);

      const name = namesToSave[i];
      // console.log("name", name);
      // console.log("item.name", item.name);
      // match = item.name.match(name); // Denna verkar bara matcha när namnet exakt samma.

      if (item.name.match(name)) {
        match = item.name.match(name);
      }
      // console.log("in loop match", match);
      // console.log("in loop !!match", !!match);
      // console.log("*** next loop ****");
    }
    // console.log("match", match);
    // console.log("!!match", !!match);
    // console.log("-- return match, next item --");

    return !!match;
  });

  console.log("filterOnlyChosen", filterOnlyChosen);

  const productsWithVariants = filterOnlyChosen
    // .filter((item) => {
    //   let match;
    //   for (let i = 0; i < namesToSave.length; i++) {
    //     console.log("i", i);
    //     const name = namesToSave[i];
    //     console.log("name", name);
    //     console.log("item.name", item.name);
    //     match = item.name.match(name); // Denna verkar bara matcha när namnet exakt samma.
    //     console.log("match", match);
    //     console.log("*******");
    //     console.log("!!match", !!match);
    //   }
    //   return !!match;
    // })
    .map((item) => {
      // Det verkar som att denna loop bara kollar på Monstera siltepecana just nu?
      // console.log("item.name", item.name);
      // console.log("item", namesToSave.includes(item.name));
      // for (let name of namesToSave) {
      for (let i = 0; i < namesToSave.length; i++) {
        const name = namesToSave[i];
        const match = item.name.match(name); // Denna verkar bara matcha när namnet exakt samma.
        // console.log("item.name", item.name);
        // console.log("name", name);
        // console.log("match", match);
        // console.log("********");
        if (match) {
          return {
            ...item,
            variant: match[0],
            website: url,
          };
        }

        // return item;
      }
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

  console.log(
    "withImage.filter",
    withImage.filter((item) => {
      return !!item.variant;
    })
  );

  // Save to database
  // withImage.forEach(async (item) => {
  //   console.log("item.variant", item.variant);
  //   await db.collection(item.variant).add(item);
  // });

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

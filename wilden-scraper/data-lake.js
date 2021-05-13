const puppeteer = require('puppeteer'); // Can I use es6 modules?
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const priceHandler = require('./price-handler.js');
const fs = require('fs');

const app = admin.initializeApp(
  {
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://wilden.firebaseio.com',
    storageBucket: 'wilden-cc3da.appspot.com',
  },
  'Wilden'
);

const fetchProductsFromGronvaxtriket = async (url) => {
  admin.initializeApp();
  const db = admin.firestore();

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const bucket = admin.storage().bucket('gs://wilden-cc3da.appspot.com/');

  fixConsoleLog(page);

  await page.goto(url);

  const allProducts = await findAllProducts(page);

  const withImage = await Promise.all(
    allProducts.map(async (item) => {
      const image = await fetch(item.originalImageUrl)
        .then((result) => {
          return result.buffer();
        })
        .catch((data) => {
          console.log('something went wrong!', data);
          return null; // Do I really want to return null here? Or do I want to end the script?
        });

      const fileName = await item.name
        .replaceAll(' ', '_')
        .replaceAll("'", '')
        .replaceAll('(', '')
        .replaceAll(')', '')
        .replaceAll('/', '');

      await fs.writeFile(`/tmp/${fileName}.jpg`, image, async (err) => {
        if (err) {
          console.log('something went wrong with saving the file to disc', err);
        }

        console.log('The file has been saved', fileName);
        if (fs.existsSync(`/tmp/${fileName}.jpg`)) {
          await bucket.upload(`/tmp/${fileName}.jpg`);
        }
      });

      return {
        ...item,
        imageUrl: `${fileName}.jpg`,
      };
    })
  );

  withImage.forEach(async (item) => {
    await db.collection('data-lake').add(item);
  });

  await browser.close();
};

function fixConsoleLog(page) {
  page.on('console', (msg) => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`);
  });
}

async function findAllProducts(page) {
  let allProducts = [];
  const { getPriceFromString } = await priceHandler;
  await page.exposeFunction('getPriceFromString', getPriceFromString);

  while (await findNextPageButton(page)) {
    const products = await getProducts(page);

    allProducts = [...allProducts, ...products];
    await pressNextPage(page);
  }

  return allProducts;
}

async function findNextPageButton(page) {
  return await page.$('.page-numbers .next');
}

const getProducts = async (page) => {
  return await page.$$eval('.product', transformProducts);
};

const transformProducts = (products) => {
  return products.map((product) => {
    const sourcePrice = product.querySelector('.price').innerText;
    const price = getPriceFromString(sourcePrice);

    return {
      name: product.querySelector('h2').innerText,
      price,
      originalImageUrl: product.querySelector('img').getAttribute('src'), // Maybe I should change this to source url, in order to acctually store my own url on "url"?
    };
  });
};

async function pressNextPage(page) {
  const button = await findNextPageButton(page);

  button.click();
  await page.waitForNavigation();
}

fetchProductsFromGronvaxtriket(
  'https://gronvaxtriket.se/product-category/alla-vaxter/'
);

module.exports = fetchProductsFromGronvaxtriket;

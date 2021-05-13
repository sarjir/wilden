const functions = require('firebase-functions');
const fetchProductsFromGronvaxtriket = require('../data-lake');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.collectPlantsFromGronvaxtriket = functions.https.onRequest(
  async (request, response) => {
    functions.logger.info('Hello logs!', { structuredData: true });
    response.send('Hello from Firebase!');

    await fetchProductsFromGronvaxtriket(
      'https://gronvaxtriket.se/product-category/alla-vaxter/'
    );
  }
);

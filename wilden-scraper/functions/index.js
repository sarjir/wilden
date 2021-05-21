const functions = require('firebase-functions');
// const fetchProductsFromGronvaxtriket = require('../data-lake');
const fetchProductsFromGronvaxtriket = require('plant-price');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions

exports.collectPlantsFromGronvaxtriket = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async () => {
      await fetchProductsFromGronvaxtriket(
          'https://gronvaxtriket.se/product-category/alla-vaxter/'
      );

      return null;
    });

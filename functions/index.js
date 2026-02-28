const functions = require('firebase-functions');
const { handleMockLogin } = require('./kmAuth');

exports.oauthCallback = functions.https.onRequest(handleMockLogin);

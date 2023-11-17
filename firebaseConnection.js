const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');
const { getStorage } = require('firebase/storage');

const firebaseConfig = {
    apiKey: "AIzaSyATcnhEqf5cxdysKU_WutFQ3axe8g_D42c",
    authDomain: "trabalho2-b97eb.firebaseapp.com",
    projectId: "trabalho2-b97eb",
    storageBucket: "trabalho2-b97eb.appspot.com",
    messagingSenderId: "983267283029",
    appId: "1:983267283029:web:9965524d6576e63edc84dc"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

module.exports = { auth, db, storage };

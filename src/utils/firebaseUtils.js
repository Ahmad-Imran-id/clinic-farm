import { db } from '../firebase/firebase-config';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { getCurrentUserUid } from '../firebase/firebase-config';

export const fetchProductByBarcode = async (barcode) => {
  const userId = getCurrentUserUid();
  const q = query(collection(db, 'inventory'), where('barcode', '==', barcode), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : snapshot.docs[0].data();
};

export const fetchProductSuggestions = async (searchTerm, userId) => {
  const q = query(collection(db, 'inventory'), where('name', '>=', searchTerm), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
};

export const saveBillingData = async (cartItems) => {
  const userId = getCurrentUserUid();
  const salesRef = collection(db, 'sales');
  const saleData = {
    userId,
    items: cartItems,
    date: Timestamp.now()
  };
  await addDoc(salesRef, saleData);
};

import { db } from '../firebase-config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  Timestamp,
  updateDoc,
  doc,
  arrayUnion,
  orderBy  // Added this import
} from 'firebase/firestore';
import { getCurrentUserUid } from './authUtils';

export const fetchProductByBarcode = async (barcode) => {
  const userId = getCurrentUserUid();
  if (!userId) throw new Error('User not authenticated');
  
  const q = query(
    collection(db, 'inventory'), 
    where('barcode', '==', barcode), 
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

export const fetchProductSuggestions = async (searchTerm, userId) => {
  if (!searchTerm.trim()) return [];
  
  const q = query(
    collection(db, 'inventory'),
    where('name', '>=', searchTerm),
    where('name', '<=', searchTerm + '\uf8ff'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const saveBillingData = async (cartItems, userId) => {
  if (!cartItems.length) throw new Error('Cart is empty');
  if (!userId) throw new Error('User not authenticated');

  const batch = [];
  
  // 1. Create sale record
  const saleData = {
    userId,
    items: cartItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    })),
    total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    date: Timestamp.now()
  };
  batch.push(addDoc(collection(db, 'sales'), saleData));

  // 2. Update inventory stock
  cartItems.forEach(item => {
    if (item.id) {
      const itemRef = doc(db, 'inventory', item.id);
      batch.push(updateDoc(itemRef, {
        stock: arrayUnion({
          date: Timestamp.now(),
          change: -item.quantity,
          type: 'sale'
        })
      }));
    }
  });

  await Promise.all(batch);
};

export const getSalesHistory = async (userId) => {
  const q = query(
    collection(db, 'sales'),
    where('userId', '==', userId),
    orderBy('date', 'desc')  // Now properly imported
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

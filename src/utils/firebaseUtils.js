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
  increment,
  writeBatch
} from 'firebase/firestore';
import { getCurrentUserUid } from './authUtils';

export const saveBillingData = async (cartItems, userId) => {
  if (!cartItems.length) throw new Error('Cart is empty');
  if (!userId) throw new Error('User not authenticated');

  const batch = writeBatch(db);
  
  // 1. Create sale record
  const saleRef = doc(collection(db, 'sales'));
  batch.set(saleRef, {
    userId,
    items: cartItems.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      isPartial: item.isPartial,
      originalPackSize: item.packSize,
      unit: item.unit
    })),
    total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    date: Timestamp.now()
  });

  // 2. Update inventory
  cartItems.forEach(item => {
    const itemRef = doc(db, 'inventory', item.id);
    if (item.isPartial) {
      batch.update(itemRef, {
        partialSales: arrayUnion({
          date: Timestamp.now(),
          soldQty: item.quantity,
          saleId: saleRef.id
        }),
        lastUpdated: Timestamp.now()
      });
    } else {
      batch.update(itemRef, {
        stock: increment(-item.quantity),
        lastUpdated: Timestamp.now()
      });
    }
  });

  await batch.commit();
};

// Add this if not existing
export const getSalesHistory = async (userId) => {
  const q = query(
    collection(db, 'sales'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

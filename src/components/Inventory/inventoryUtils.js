import { getFirestore, collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const db = getFirestore();

export const fetchInventoryData = async (uid) => {
  const q = query(collection(db, 'inventory'), where('uid', '==', uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addOrUpdateItem = async (uid, product, editingItem) => {
  const data = { ...product, uid };
  if (editingItem) {
    await updateDoc(doc(db, 'inventory', editingItem.id), data);
  } else {
    await addDoc(collection(db, 'inventory'), data);
  }
};

export const deleteInventoryItem = async (uid, id) => {
  await deleteDoc(doc(db, 'inventory', id));
};

export const bulkAddItems = async (uid, items) => {
  const promises = items.map(item => addDoc(collection(db, 'inventory'), { ...item, uid }));
  await Promise.all(promises);
};

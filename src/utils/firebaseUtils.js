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
  writeBatch,
  orderBy,
  limit,
  getDoc
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

// Function to fetch product by barcode
export const fetchProductByBarcode = async (barcode) => {
  if (!barcode || typeof barcode !== 'string') {
    throw new Error('Invalid barcode format');
  }

  try {
    const q = query(
      collection(db, 'inventory'),
      where('barcode', '==', barcode),
      limit(1)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null; // No product found with this barcode
    }
    
    const productDoc = snapshot.docs[0];
    return {
      id: productDoc.id,
      ...productDoc.data()
    };
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    throw error;
  }
};

// Function to fetch product suggestions based on search term
export const fetchProductSuggestions = async (searchTerm, userId) => {
  if (!searchTerm || typeof searchTerm !== 'string') {
    return [];
  }

  try {
    // Convert searchTerm to lowercase for case-insensitive comparison
    const searchTermLower = searchTerm.toLowerCase();
    
    // Get all inventory items - ideally this would use a Firestore query
    // with where('name', '>=', searchTerm) and where('name', '<=', searchTerm + '\uf8ff')
    const inventoryRef = collection(db, 'inventory');
    const snapshot = await getDocs(inventoryRef);
    
    // Filter and sort results client-side
    const results = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(product => 
        product.name.toLowerCase().includes(searchTermLower) ||
        (product.genericName && product.genericName.toLowerCase().includes(searchTermLower)) ||
        (product.category && product.category.toLowerCase().includes(searchTermLower))
      )
      .sort((a, b) => {
        // Sort exact matches first
        const aNameMatch = a.name.toLowerCase() === searchTermLower;
        const bNameMatch = b.name.toLowerCase() === searchTermLower;
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // Then sort by startsWith
        const aNameStartsWith = a.name.toLowerCase().startsWith(searchTermLower);
        const bNameStartsWith = b.name.toLowerCase().startsWith(searchTermLower);
        
        if (aNameStartsWith && !bNameStartsWith) return -1;
        if (!aNameStartsWith && bNameStartsWith) return 1;
        
        // Default to alphabetical
        return a.name.localeCompare(b.name);
      })
      .slice(0, 10); // Limit results
    
    return results;
  } catch (error) {
    console.error('Error fetching product suggestions:', error);
    throw error;
  }
};

// Function to get sales history
export const getSalesHistory = async (userId) => {
  const q = query(
    collection(db, 'sales'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

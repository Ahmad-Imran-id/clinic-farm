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

// Function to save billing data (cart items) to Firestore
export const saveBillingData = async (cartItems, userId) => {
  if (!cartItems.length) throw new Error('Cart is empty');
  if (!userId) throw new Error('User not authenticated');

  const batch = writeBatch(db);
  
  // 1. Create sale record
  const saleRef = doc(collection(db, 'sales'));
  const saleTotal = cartItems.reduce((sum, item) => {
    if (item.isPartial) {
      // For partial items, calculate price per unit
      const pricePerUnit = item.price / item.packSize;
      return sum + (pricePerUnit * item.quantity);
    }
    return sum + (item.price * item.quantity);
  }, 0);

  batch.set(saleRef, {
    userId,
    items: cartItems.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      isPartial: item.isPartial,
      packSize: item.packSize,
      unit: item.unit
    })),
    total: saleTotal,
    date: Timestamp.now()
  });

  // 2. Update inventory quantities
  for (const item of cartItems) {
    const itemRef = doc(db, 'inventory', item.id);
    
    // Check if the product exists
    const productDoc = await getDoc(itemRef);
    if (!productDoc.exists()) {
      throw new Error(`Product ${item.name} not found in inventory`);
    }
    
    if (item.isPartial) {
      // For partial sales, track in the partialSales array
      batch.update(itemRef, {
        partialSales: arrayUnion({
          date: Timestamp.now(),
          soldQty: item.quantity,
          saleId: saleRef.id
        }),
        lastUpdated: Timestamp.now()
      });
    } else {
      // For full packs, decrement the stock count
      const currentStock = productDoc.data().stock || 0;
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }
      
      batch.update(itemRef, {
        stock: increment(-item.quantity),
        lastUpdated: Timestamp.now()
      });
    }
  }

  // Commit the batch
  await batch.commit();
  return saleRef.id;
};

// Function to fetch product by barcode
export const fetchProductByBarcode = async (barcode, userId) => {
  if (!barcode || typeof barcode !== 'string') {
    throw new Error('Invalid barcode format');
  }
  
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const q = query(
      collection(db, 'inventory'),
      where('barcode', '==', barcode),
      where('userId', '==', userId),
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

  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    // Convert searchTerm to lowercase for case-insensitive comparison
    const searchTermLower = searchTerm.toLowerCase();
    
    // Query for inventory items that belong to the user
    const inventoryRef = collection(db, 'inventory');
    const userInventoryQuery = query(
      inventoryRef,
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(userInventoryQuery);
    
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
export const getSalesHistory = async (userId, limit = 50) => {
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    const q = query(
      collection(db, 'sales'),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(limit)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      // Convert Timestamp to JavaScript Date for easier handling
      date: doc.data().date.toDate() 
    }));
  } catch (error) {
    console.error('Error fetching sales history:', error);
    throw error;
  }
};

// Function to get sales statistics
export const getSalesStatistics = async (userId, period = 'week') => {
  if (!userId) {
    throw new Error('User not authenticated');
  }

  try {
    // Determine the start date based on the period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7); // Default to a week
    }

    const q = query(
      collection(db, 'sales'),
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const sales = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      date: doc.data().date.toDate()
    }));
    
    // Calculate statistics
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const topProducts = getTopProducts(sales);
    
    return {
      totalSales,
      totalRevenue,
      topProducts,
      period,
      startDate,
      endDate: new Date()
    };
  } catch (error) {
    console.error('Error fetching sales statistics:', error);
    throw error;
  }
};

// Helper function to calculate top products
function getTopProducts(sales) {
  const productMap = {};
  
  // Count quantities for each product
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const productId = item.productId;
      if (!productMap[productId]) {
        productMap[productId] = {
          id: productId,
          name: item.name,
          quantity: 0,
          revenue: 0
        };
      }
      
      // Add to quantity and revenue
      productMap[productId].quantity += item.quantity;
      
      // Calculate revenue based on partial or full pack
      const itemRevenue = item.isPartial 
        ? (item.price / item.packSize) * item.quantity
        : item.price * item.quantity;
        
      productMap[productId].revenue += itemRevenue;
    });
  });
  
  // Convert to array and sort by quantity
  return Object.values(productMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5); // Top 5 products
}

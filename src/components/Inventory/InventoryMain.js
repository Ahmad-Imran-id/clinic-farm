import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import InventoryForm from './InventoryForm';
import BulkAddForm from './BulkAddForm';
import InventoryTable from './InventoryTable';
import SearchBar from './SearchBar';
import * as XLSX from 'xlsx';

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]); // Ensure it's an array
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingItem, setEditingItem] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    quantity: '',
    unitsPerPack: '',
    unitType: '',
    category: 'Tablet',
  });

  const fetchProducts = async () => {
    if (!user) return;
    const snapshot = await getDocs(collection(db, `users/${user.uid}/inventory`));
    const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(productList); // Always set as an array
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(products);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, 'Inventory.xlsx');
  };

  const handleAddOrUpdateProduct = async () => {
  // Check if user is authenticated
  if (!user) {
    console.error('User is not authenticated.');
    return;
  }
  console.log('🛠 Adding/Updating product with data:', newProduct);

  // Check if the product name is empty
  if (!newProduct.name) return;

  // Proceed with the product addition or update
  const productRef = doc(db, `users/${user.uid}/inventory`, newProduct.name);
  const productData = {
    ...newProduct,
    price: parseFloat(newProduct.price),
    quantity: parseInt(newProduct.quantity),
    unitsPerPack: parseInt(newProduct.unitsPerPack),
  };

  try {
    if (editingItem) {
      // Update existing product
      await updateDoc(productRef, productData);
    } else {
      // Add new product
      await setDoc(productRef, productData);
    }

    await fetchProducts();
    setNewProduct({
      name: '',
      price: '',
      quantity: '',
      unitsPerPack: '',
      unitType: '',
      category: 'Tablet',
    });
    setEditingItem(null);
} catch (error) {
  console.error("❌ Error saving product:", error);
  alert("Error saving product: " + error.message);
}

};


  // Ensure filteredProducts is derived correctly
  const filteredProducts = Array.isArray(products)
    ? products.filter(product => {
        const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
        const matchesSearch = searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
    : []; // Fallback if products is not an array

  return (
    <div style={{ padding: '20px' }}>
      <h2>Inventory Management</h2>

      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        suggestions={suggestions}
        setSuggestions={setSuggestions}
        products={products}
      />

      <InventoryForm 
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        handleAddOrUpdateProduct={handleAddOrUpdateProduct}
        editingItem={editingItem}
      />

      <BulkAddForm user={user} fetchProducts={fetchProducts} />

      <button onClick={exportToExcel}>Download Inventory Excel</button>

      <InventoryTable 
        filteredProducts={filteredProducts}  // Ensure filteredProducts is passed
        handleEdit={(product) => { setEditingItem(product); setNewProduct(product); }}
        handleDelete={(id) => {
          // Handle delete logic
        }}
        selectedCategory={selectedCategory} 
        setSelectedCategory={setSelectedCategory} 
      />
    </div>
  );
};

export default Inventory;

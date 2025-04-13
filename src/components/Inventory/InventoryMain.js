import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  addDoc,
} from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import InventoryForm from './InventoryForm';
import BulkAddForm from './BulkAddForm';
import InventoryTable from './InventoryTable';
import SearchBar from './SearchBar';
import * as XLSX from 'xlsx';

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
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
  const [bulkProducts, setBulkProducts] = useState([]);

  const fetchProducts = async () => {
    if (!user) return;
    const snapshot = await getDocs(collection(db, `users/${user.uid}/inventory`));
    const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(productList);
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
    if (!newProduct.name) return;

    const productRef = doc(db, `users/${user.uid}/inventory`, newProduct.name);
    const productData = {
      ...newProduct,
      price: parseFloat(newProduct.price),
      quantity: parseInt(newProduct.quantity),
      unitsPerPack: parseInt(newProduct.unitsPerPack),
    };

    try {
      if (editingItem) {
        await updateDoc(productRef, productData);
      } else {
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
      console.error("Error saving product:", error);
    }
  };

  const handleBulkSubmit = async () => {
    if (!user || bulkProducts.length === 0) return;

    const inventoryRef = collection(db, `users/${user.uid}/inventory`);
    const batch = bulkProducts.map(product => ({
      ...product,
      price: parseFloat(product.price),
      quantity: parseInt(product.quantity),
      unitsPerPack: parseInt(product.unitsPerPack),
    }));

    try {
      for (const product of batch) {
        await addDoc(inventoryRef, product);
      }
      setBulkProducts([]);
      await fetchProducts();
    } catch (error) {
      console.error("Error during bulk submit:", error);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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

      <BulkAddForm 
        bulkProducts={bulkProducts}
        setBulkProducts={setBulkProducts}
        handleBulkSubmit={handleBulkSubmit}
      />

      <button onClick={exportToExcel}>Download Inventory Excel</button>

      <InventoryTable 
        products={filteredProducts} 
        fetchProducts={fetchProducts} 
        setEditingItem={(item) => {
          setEditingItem(item);
          setNewProduct(item);
        }}
        selectedCategory={selectedCategory} 
        setSelectedCategory={setSelectedCategory} 
      />
    </div>
  );
};

export default Inventory;

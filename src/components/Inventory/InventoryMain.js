import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth'; // Adjust path based on actual location
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
        user={user} 
        fetchProducts={fetchProducts} 
        editingItem={editingItem} 
        setEditingItem={setEditingItem} 
      />
      <BulkAddForm user={user} fetchProducts={fetchProducts} />
      <button onClick={exportToExcel}>Download Inventory Excel</button>
      <InventoryTable 
        products={filteredProducts} 
        fetchProducts={fetchProducts} 
        setEditingItem={setEditingItem} 
        selectedCategory={selectedCategory} 
        setSelectedCategory={setSelectedCategory} 
      />
    </div>
  );
};

export default Inventory;

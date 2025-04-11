import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', quantity: '' });
  const [bulkProducts, setBulkProducts] = useState([{ name: '', price: '', quantity: '' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  // Fetch inventory products
  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, 'inventory'));
      const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    };
    fetchProducts();
  }, []);

  // Single item handlers
  const handleInputChange = e => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.quantity) return alert('Please fill all fields');
    await addDoc(collection(db, 'inventory'), {
      ...newProduct,
      price: parseFloat(newProduct.price),
      quantity: parseInt(newProduct.quantity),
    });
    alert('Product added');
    setNewProduct({ name: '', price: '', quantity: '' });
  };

  // Bulk input handlers
  const handleBulkChange = (index, e) => {
    const updated = [...bulkProducts];
    updated[index][e.target.name] = e.target.value;
    setBulkProducts(updated);
  };

  const addBulkRow = () => {
    setBulkProducts([...bulkProducts, { name: '', price: '', quantity: '' }]);
  };

  const handleBulkSubmit = async () => {
    for (const p of bulkProducts) {
      if (p.name && p.price && p.quantity) {
        await addDoc(collection(db, 'inventory'), {
          name: p.name,
          price: parseFloat(p.price),
          quantity: parseInt(p.quantity),
        });
      }
    }
    alert('Bulk items added!');
    setBulkProducts([{ name: '', price: '', quantity: '' }]);
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(products);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, 'Inventory.xlsx');
  };

  // Auto-suggestions
  const handleSearchChange = e => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value) {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = name => {
    setSearchQuery(name);
    setSuggestions([]);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Inventory Management</h2>

      {/* Search with auto-suggestions */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search product..."
        />
        <ul style={{ listStyle: 'none' }}>
          {suggestions.map(s => (
            <li key={s.id} onClick={() => handleSuggestionClick(s.name)} style={{ cursor: 'pointer' }}>
              {s.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Single Add Form */}
      <div>
        <h3>Add Product</h3>
        <input name="name" placeholder="Name" value={newProduct.name} onChange={handleInputChange} />
        <input name="price" placeholder="Price" value={newProduct.price} onChange={handleInputChange} />
        <input name="quantity" placeholder="Quantity" value={newProduct.quantity} onChange={handleInputChange} />
        <button onClick={handleAddProduct}>Add</button>
      </div>

      {/* Bulk Add Form */}
      <div>
        <h3>Bulk Add</h3>
        {bulkProducts.map((item, index) => (
          <div key={index}>
            <input name="name" placeholder="Name" value={item.name} onChange={(e) => handleBulkChange(index, e)} />
            <input name="price" placeholder="Price" value={item.price} onChange={(e) => handleBulkChange(index, e)} />
            <input name="quantity" placeholder="Quantity" value={item.quantity} onChange={(e) => handleBulkChange(index, e)} />
          </div>
        ))}
        <button onClick={addBulkRow}>Add More</button>
        <button onClick={handleBulkSubmit}>Submit Bulk</button>
      </div>

      <button onClick={exportToExcel}>Download Inventory Excel</button>
    </div>
  );
};

export default Inventory;

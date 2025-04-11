import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';


const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', quantity: '' });
  const [bulkProducts, setBulkProducts] = useState([{ name: '', price: '', quantity: '' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const snapshot = await getDocs(collection(db, 'inventory'));
    const productList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(productList);
  };

  const handleInputChange = e => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const handleAddOrUpdateProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.quantity) return alert('Please fill all fields');
    const productData = {
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      quantity: parseInt(newProduct.quantity),
    };
    if (editingItem) {
      await updateDoc(doc(db, 'inventory', editingItem.id), productData);
      alert('Product updated');
    } else {
      await addDoc(collection(db, 'inventory'), productData);
      alert('Product added');
    }
    setNewProduct({ name: '', price: '', quantity: '' });
    setEditingItem(null);
    fetchProducts();
  };

  const handleEdit = item => {
    setEditingItem(item);
    setNewProduct({ name: item.name, price: item.price, quantity: item.quantity });
  };

  const handleDelete = async id => {
    await deleteDoc(doc(db, 'inventory', id));
    fetchProducts();
    alert('Item deleted successfully!');
  };

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
    fetchProducts();
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(products);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, 'Inventory.xlsx');
  };

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

      {/* Single Add/Edit Form */}
      <div>
        <h3>{editingItem ? 'Edit Product' : 'Add Product'}</h3>
        <input name="name" placeholder="Name" value={newProduct.name} onChange={handleInputChange} />
        <input name="price" placeholder="Price" value={newProduct.price} onChange={handleInputChange} />
        <input name="quantity" placeholder="Quantity" value={newProduct.quantity} onChange={handleInputChange} />
        <button onClick={handleAddOrUpdateProduct}>{editingItem ? 'Update' : 'Add'}</button>
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

      {/* Inventory Display Table */}
      <div style={{ marginTop: '30px' }}>
        <h3>Current Inventory</h3>
        <button onClick={fetchProducts}>Refresh Inventory</button>
        <table border="1" cellPadding="10" style={{ marginTop: '10px', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>QR Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>${item.price}</td>
                <td>{item.quantity}</td>
                <td>
                  <QRCodeCanvas value={`Name: ${item.name}\nPrice: ${item.price}\nQty: ${item.quantity}`} size={64} />
                </td>
                <td>
                  <button onClick={() => handleEdit(item)}>Edit</button>
                  <button onClick={() => handleDelete(item.id)} style={{ marginLeft: '10px' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;

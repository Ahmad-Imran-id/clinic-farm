import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', quantity: '', unitsPerPack: '', unitType: '', category: 'Tablet' });
  const [bulkProducts, setBulkProducts] = useState([{ name: '', price: '', quantity: '', unitsPerPack: '', unitType: '', category: 'Tablet' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['Tablet', 'Injection', 'Syrup', 'Ointment', 'Other'];

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
    const { name, price, quantity, category, unitsPerPack, unitType } = newProduct;
    if (!name || !price || !quantity || !category || !unitsPerPack || !unitType) return alert('Please fill all fields');

    const productData = {
      name,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      category,
      unitsPerPack: parseInt(unitsPerPack),
      unitType,
      totalUnits: parseInt(quantity) * parseInt(unitsPerPack),
    };

    if (editingItem) {
      await updateDoc(doc(db, 'inventory', editingItem.id), productData);
      alert('Product updated');
    } else {
      await addDoc(collection(db, 'inventory'), productData);
      alert('Product added');
    }

    setNewProduct({ name: '', price: '', quantity: '', unitsPerPack: '', unitType: '', category: 'Tablet' });
    setEditingItem(null);
    fetchProducts();
  };

  const handleEdit = item => {
    setEditingItem(item);
    setNewProduct({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      unitsPerPack: item.unitsPerPack,
      unitType: item.unitType,
      category: item.category || 'Tablet'
    });
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
    setBulkProducts([...bulkProducts, { name: '', price: '', quantity: '', unitsPerPack: '', unitType: '', category: 'Tablet' }]);
  };

  const handleBulkSubmit = async () => {
    for (const p of bulkProducts) {
      if (p.name && p.price && p.quantity && p.category && p.unitsPerPack && p.unitType) {
        await addDoc(collection(db, 'inventory'), {
          name: p.name,
          price: parseFloat(p.price),
          quantity: parseInt(p.quantity),
          category: p.category,
          unitsPerPack: parseInt(p.unitsPerPack),
          unitType: p.unitType,
          totalUnits: parseInt(p.quantity) * parseInt(p.unitsPerPack),
        });
      }
    }
    alert('Bulk items added!');
    setBulkProducts([{ name: '', price: '', quantity: '', unitsPerPack: '', unitType: '', category: 'Tablet' }]);
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

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSuggestionClick = name => {
    setSearchQuery(name);
    setSuggestions([]);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Inventory Management</h2>

      {/* Search */}
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

      {/* Single Add/Edit */}
      <div>
        <h3>{editingItem ? 'Edit Product' : 'Add Product'}</h3>
        <input name="name" placeholder="Name" value={newProduct.name} onChange={handleInputChange} />
        <input name="price" placeholder="Price" value={newProduct.price} onChange={handleInputChange} />
        <input name="quantity" placeholder="No. of Packs" value={newProduct.quantity} onChange={handleInputChange} />
        <input name="unitsPerPack" placeholder="Units per Pack (e.g. 10 tabs, 1 vial)" value={newProduct.unitsPerPack} onChange={handleInputChange} />
        <input name="unitType" placeholder="Unit Type (e.g. tab, vial)" value={newProduct.unitType} onChange={handleInputChange} />
        <select name="category" value={newProduct.category} onChange={handleInputChange}>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button onClick={handleAddOrUpdateProduct}>{editingItem ? 'Update' : 'Add'}</button>
      </div>

      {/* Bulk Add */}
      <div>
        <h3>Bulk Add</h3>
        {bulkProducts.map((item, index) => (
          <div key={index}>
            <input name="name" placeholder="Name" value={item.name} onChange={(e) => handleBulkChange(index, e)} />
            <input name="price" placeholder="Price" value={item.price} onChange={(e) => handleBulkChange(index, e)} />
            <input name="quantity" placeholder="No. of Packs" value={item.quantity} onChange={(e) => handleBulkChange(index, e)} />
            <input name="unitsPerPack" placeholder="Units per Pack" value={item.unitsPerPack} onChange={(e) => handleBulkChange(index, e)} />
            <input name="unitType" placeholder="Unit Type" value={item.unitType} onChange={(e) => handleBulkChange(index, e)} />
            <select name="category" value={item.category} onChange={(e) => handleBulkChange(index, e)}>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        ))}
        <button onClick={addBulkRow}>Add More</button>
        <button onClick={handleBulkSubmit}>Submit Bulk</button>
      </div>

      <button onClick={exportToExcel}>Download Inventory Excel</button>

      {/* Inventory Table */}
      <div style={{ marginTop: '30px' }}>
        <h3>Current Inventory</h3>
        <button onClick={fetchProducts}>Refresh Inventory</button>

        {/* Category Filter */}
        <div style={{ margin: '10px 0' }}>
          <label>Filter by Category: </label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="All">All</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <table border="1" cellPadding="10" style={{ marginTop: '10px', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Packs</th>
              <th>Units/Pack</th>
              <th>Unit Type</th>
              <th>Total Units</th>
              <th>QR Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category || 'Uncategorized'}</td>
                <td>${item.price}</td>
                <td>{item.quantity}</td>
                <td>{item.unitsPerPack}</td>
                <td>{item.unitType}</td>
                <td>{item.totalUnits}</td>
                <td>
                  <QRCodeCanvas
                    value={`Name: ${item.name}\nCategory: ${item.category}\nPrice: ${item.price}\nPacks: ${item.quantity}\nUnits/Pack: ${item.unitsPerPack}\nTotal Units: ${item.totalUnits}`}
                    size={64}
                  />
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

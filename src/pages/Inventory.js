import React, { useState } from 'react';
import { db } from '../firebase-config';
import { collection, addDoc } from 'firebase/firestore';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', quantity: '' });

  const handleChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.quantity) {
      alert('Please fill all fields');
      return;
    }

    try {
      await addDoc(collection(db, 'inventory'), {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        quantity: parseInt(newProduct.quantity),
      });
      setNewProduct({ name: '', price: '', quantity: '' });
      alert('Product added successfully!');
    } catch (error) {
      alert('Error adding product: ' + error.message);
    }
  };

  const handleBulkAdd = async (products) => {
    const batch = db.batch();
    products.forEach(product => {
      const productRef = collection(db, 'inventory').doc();
      batch.set(productRef, product);
    });

    try {
      await batch.commit();
      alert('Bulk products added successfully!');
    } catch (error) {
      alert('Error adding products: ' + error.message);
    }
  };

  return (
    <div>
      <h2>Inventory Management</h2>
      <div>
        <h3>Add New Product</h3>
        <input 
          type="text" 
          name="name" 
          value={newProduct.name} 
          onChange={handleChange} 
          placeholder="Product Name" 
        />
        <input 
          type="number" 
          name="price" 
          value={newProduct.price} 
          onChange={handleChange} 
          placeholder="Price" 
        />
        <input 
          type="number" 
          name="quantity" 
          value={newProduct.quantity} 
          onChange={handleChange} 
          placeholder="Quantity" 
        />
        <button onClick={handleAddProduct}>Add Product</button>
      </div>

      {/* Bulk add form */}
      <div>
        <h3>Bulk Add Products</h3>
        {/* UI for adding multiple products in bulk */}
        <button onClick={() => handleBulkAdd(products)}>Add Bulk Products</button>
      </div>
    </div>
  );
};

export default Inventory;

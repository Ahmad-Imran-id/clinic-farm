import React from 'react';

const InventoryForm = ({ newProduct, setNewProduct, handleAddOrUpdateProduct, editingItem }) => {
  return (
    <div>
      <h3>{editingItem ? 'Edit Product' : 'Add Product'}</h3>
      <input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Name" />
      <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="Price" />
      <input type="number" value={newProduct.quantity} onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })} placeholder="Pack Quantity" />
      <input type="number" value={newProduct.unitsPerPack} onChange={(e) => setNewProduct({ ...newProduct, unitsPerPack: e.target.value })} placeholder="Units Per Pack" />
      <input value={newProduct.unitType} onChange={(e) => setNewProduct({ ...newProduct, unitType: e.target.value })} placeholder="Unit Type (e.g., tabs, vials)" />
      <select value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
        <option value="Tablet">Tablet</option>
        <option value="Syrup">Syrup</option>
        <option value="Injection">Injection</option>
      </select>
      <button onClick={handleAddOrUpdateProduct}>{editingItem ? 'Update' : 'Add'} Product</button>
    </div>
  );
};

export default InventoryForm;

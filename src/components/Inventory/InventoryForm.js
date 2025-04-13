import React from 'react';

const InventoryForm = ({
  newProduct = {
    name: '',
    price: '',
    quantity: '',
    unitsPerPack: '',
    unitType: '',
    category: 'Tablet',
  },
  setNewProduct = () => {},
  handleAddOrUpdateProduct = () => {},
  editingItem = null
}) => {
  const handleChange = (field, value) => {
    setNewProduct(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="inventory-form">
      <h3>{editingItem ? 'Edit Product' : 'Add Product'}</h3>
      <input
        value={newProduct.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Name"
      />
      <input
        type="number"
        value={newProduct.price}
        onChange={(e) => handleChange('price', e.target.value)}
        placeholder="Price"
      />
      <input
        type="number"
        value={newProduct.quantity}
        onChange={(e) => handleChange('quantity', e.target.value)}
        placeholder="Pack Quantity"
      />
      <input
        type="number"
        value={newProduct.unitsPerPack}
        onChange={(e) => handleChange('unitsPerPack', e.target.value)}
        placeholder="Units Per Pack"
      />
      <input
        value={newProduct.unitType}
        onChange={(e) => handleChange('unitType', e.target.value)}
        placeholder="Unit Type (e.g., tabs, vials)"
      />
      <select
        value={newProduct.category}
        onChange={(e) => handleChange('category', e.target.value)}
      >
        <option value="Tablet">Tablet</option>
        <option value="Syrup">Syrup</option>
        <option value="Injection">Injection</option>
      </select>

      <button onClick={handleAddOrUpdateProduct}>
        {editingItem ? 'Update' : 'Add'} Product
      </button>
    </div>
  );
};

export default InventoryForm;

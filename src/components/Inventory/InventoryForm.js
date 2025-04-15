import React from 'react';

const InventoryForm = ({
  newProduct,
  setNewProduct,
  handleAddOrUpdateProduct,
  editingItem,
}) => {
  const handleChange = (field, value) => {
    setNewProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('➡️ Form submitted with values:', newProduct);
    // Prevent default form submission behavior
    if (!newProduct.name || !newProduct.price || !newProduct.quantity) {
      alert('Please fill in all required fields.');
      return;
    }
    // Call the provided handler for adding/updating the product
    handleAddOrUpdateProduct();
  };

  return (
    <div className="inventory-form">
      <h3>{editingItem ? 'Edit Product' : 'Add Product'}</h3>
      <form onSubmit={handleSubmit}>
        <input
          value={newProduct.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Name"
          required
        />
        <input
          type="number"
          value={newProduct.price}
          onChange={(e) => handleChange('price', e.target.value)}
          placeholder="Price"
          required
        />
        <input
          type="number"
          value={newProduct.quantity}
          onChange={(e) => handleChange('quantity', e.target.value)}
          placeholder="Pack Quantity"
          required
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

        <button type="submit">
          {editingItem ? 'Update' : 'Add'} Product
        </button>
      </form>
    </div>
  );
};

export default InventoryForm;

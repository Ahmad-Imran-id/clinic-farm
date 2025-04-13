import React from 'react';

const InventoryTable = ({ filteredProducts, handleEdit, handleDelete, selectedCategory, setSelectedCategory }) => {
  // Check if filteredProducts is an array to avoid runtime errors
  const productsToDisplay = Array.isArray(filteredProducts) ? filteredProducts : [];

  return (
    <div>
      <h3>Current Inventory</h3>
      <label>Filter by Category:</label>
      <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
        <option value="All">All</option>
        <option value="Tablet">Tablet</option>
        <option value="Syrup">Syrup</option>
        <option value="Injection">Injection</option>
      </select>
      <table border="1">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Pack Quantity</th>
            <th>Units Per Pack</th>
            <th>Unit Type</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Check if productsToDisplay is not empty before mapping */}
          {productsToDisplay.length > 0 ? (
            productsToDisplay.map((product, index) => (
              <tr key={index}>
                <td>{product.name}</td>
                <td>{product.price}</td>
                <td>{product.quantity}</td>
                <td>{product.unitsPerPack}</td>
                <td>{product.unitType}</td>
                <td>{product.category}</td>
                <td>
                  <button onClick={() => handleEdit(product)}>Edit</button>
                  <button onClick={() => handleDelete(product.id)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>
                No products available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;

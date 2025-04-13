import React from 'react';

const BulkAddForm = ({
  bulkProducts = [],
  setBulkProducts = () => {},
  handleBulkSubmit = () => {},
}) => {
  
  // Handle changes in the individual product fields
  const handleChange = (index, field, value) => {
    const updated = [...bulkProducts];
    updated[index][field] = value;
    setBulkProducts(updated); // Update the bulkProducts state
  };

  // Add a new row for another product
  const handleAddRow = () => {
    setBulkProducts([
      ...bulkProducts,
      {
        name: '',
        price: '',
        quantity: '',
        unitsPerPack: '',
        unitType: '',
        category: 'Tablet',
      },
    ]);
  };

  // Handle form submission for bulk products
  const handleSubmit = () => {
    console.log('Submitting bulk products:', bulkProducts);

    // Call the passed-in submit handler
    if (bulkProducts.length > 0) {
      handleBulkSubmit(bulkProducts);
    } else {
      console.error('No products to submit!');
    }
  };

  return (
    <div>
      <h3>Bulk Add Products</h3>

      {Array.isArray(bulkProducts) &&
        bulkProducts.map((item, index) => (
          <div key={index} style={{ marginBottom: '10px' }}>
            <input
              value={item.name}
              onChange={(e) => handleChange(index, 'name', e.target.value)}
              placeholder="Name"
            />
            <input
              type="number"
              value={item.price}
              onChange={(e) => handleChange(index, 'price', e.target.value)}
              placeholder="Price"
            />
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => handleChange(index, 'quantity', e.target.value)}
              placeholder="Pack Quantity"
            />
            <input
              type="number"
              value={item.unitsPerPack}
              onChange={(e) => handleChange(index, 'unitsPerPack', e.target.value)}
              placeholder="Units Per Pack"
            />
            <input
              value={item.unitType}
              onChange={(e) => handleChange(index, 'unitType', e.target.value)}
              placeholder="Unit Type"
            />
            <select
              value={item.category}
              onChange={(e) => handleChange(index, 'category', e.target.value)}
            >
              <option value="Tablet">Tablet</option>
              <option value="Syrup">Syrup</option>
              <option value="Injection">Injection</option>
            </select>
          </div>
        ))}

      <button onClick={handleAddRow}>Add More</button>
      <button onClick={handleSubmit}>Submit Bulk Products</button>
    </div>
  );
};

export default BulkAddForm;

import React from 'react';

const BillingCart = ({ cartItems, onUpdateQuantity, onRemoveItem }) => {
  return (
    <div className="billing-cart">
      <h2>Cart</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item, idx) => (
            <tr key={idx}>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={e => onUpdateQuantity(idx, e.target.value)}
                  className="input"
                />
              </td>
              <td>{item.price}</td>
              <td>
                <button onClick={() => onRemoveItem(idx)} className="btn-red">Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BillingCart;

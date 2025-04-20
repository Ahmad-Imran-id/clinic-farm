import React from 'react';
import PropTypes from 'prop-types';

const BillingCart = ({ cartItems, onUpdateQuantity, onRemoveItem }) => {
  return (
    <div className="billing-cart">
      <h2>Cart</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item, idx) => (
              <tr key={`${item.id}-${idx}`}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => onUpdateQuantity(idx, e.target.value)}
                    className="input"
                  />
                </td>
                <td>₹{item.price.toFixed(2)}</td>
                <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                <td>
                  <button 
                    onClick={() => onRemoveItem(idx)} 
                    className="btn-red"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

BillingCart.propTypes = {
  cartItems: PropTypes.array.isRequired,
  onUpdateQuantity: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func.isRequired
};

export default BillingCart;

import React from 'react';
import { Table, Badge } from 'react-bootstrap';
import PropTypes from 'prop-types';

const BillingCart = ({ cartItems, onUpdateQuantity, onRemoveItem }) => {
  return (
    <div className="billing-cart">
      {cartItems.length === 0 ? (
        <div className="text-center py-3">
          <p className="text-muted">Your cart is empty</p>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Product</th>
              <th>Pack Details</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Subtotal</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.map((item, index) => (
              <tr key={`${item.id}-${index}`}>
                <td>
                  {item.name}
                  {item.isPartial && <Badge bg="info" className="ms-2">Partial</Badge>}
                </td>
                <td>
                  {item.isPartial 
                    ? `${item.quantity} out of ${item.packSize} ${item.unit}`
                    : `${item.packSize} ${item.unit}`
                  }
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    max={item.isPartial ? item.packSize : undefined}
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(index, e.target.value)}
                    className="form-control form-control-sm"
                    style={{ width: '70px' }}
                  />
                </td>
                <td>₹{item.price.toFixed(2)}</td>
                <td>
                  {item.isPartial 
                    ? `₹${((item.price / item.packSize) * item.quantity).toFixed(2)}`
                    : `₹${(item.price * item.quantity).toFixed(2)}`
                  }
                </td>
                <td>
                  <button 
                    onClick={() => onRemoveItem(index)}
                    className="btn btn-sm btn-outline-danger"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
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

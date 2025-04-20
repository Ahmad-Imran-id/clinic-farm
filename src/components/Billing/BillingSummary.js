import React from 'react';
import PropTypes from 'prop-types';

const BillingSummary = ({ cartItems, onCheckout, isLoading }) => {
  const total = cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

  return (
    <div className="billing-summary">
      <h2>Total: ₹{total.toFixed(2)}</h2>
      <button 
        onClick={onCheckout} 
        className="btn-green"
        disabled={isLoading || cartItems.length === 0}
      >
        {isLoading ? 'Processing...' : 'Checkout'}
      </button>
    </div>
  );
};

BillingSummary.propTypes = {
  cartItems: PropTypes.array.isRequired,
  onCheckout: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

export default BillingSummary;

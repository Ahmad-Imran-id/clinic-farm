import React from 'react';
import { saveBillingData } from '../../utils/firebaseUtils';

const BillingSummary = ({ cartItems }) => {
  const handleCheckout = async () => {
    await saveBillingData(cartItems);
    alert('Billing complete!');
  };

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="billing-summary">
      <h2>Total: ₹{total}</h2>
      <button onClick={handleCheckout} className="btn-green">Checkout</button>
    </div>
  );
};

export default BillingSummary;

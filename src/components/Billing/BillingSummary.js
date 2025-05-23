import React from 'react';
import { Card, Button } from 'react-bootstrap';
import PropTypes from 'prop-types';

const BillingSummary = ({ cartItems, onCheckout, isLoading }) => {
  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      if (item.isPartial) {
        // For partial items, calculate price per unit
        const pricePerUnit = item.price / item.packSize;
        return sum + (pricePerUnit * item.quantity);
      }
      return sum + (item.price * item.quantity);
    }, 0);
  };

  const total = calculateTotal();

  return (
    <div className="billing-summary">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Total Amount:</h5>
        <h4 className="mb-0">₹{total.toFixed(2)}</h4>
      </div>
      <Button
        variant="success"
        size="lg"
        onClick={onCheckout}
        disabled={isLoading || cartItems.length === 0}
        className="w-100"
      >
        {isLoading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Processing...
          </>
        ) : (
          'Complete Sale'
        )}
      </Button>
    </div>
  );
};

BillingSummary.propTypes = {
  cartItems: PropTypes.array.isRequired,
  onCheckout: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

export default BillingSummary;

import React, { useState } from 'react';
import BillingForm from './BillingForm';
import BillingCart from './BillingCart';
import BillingExport from './BillingExport';
import BillingSummary from './BillingSummary';
import { saveBillingData } from '../../utils/firebaseUtils';
import { getCurrentUserUid } from '../../utils/authUtils';

const BillingMain = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id 
            ? {...item, quantity: item.quantity + 1} 
            : item
        );
      }
      return [...prevItems, {...product, quantity: 1}];
    });
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    setCartItems(prevItems => 
      prevItems.map((item, i) => 
        i === index ? {...item, quantity: Math.max(1, parseInt(newQuantity) || 1)} : item
      )
    );
  };

  const handleRemoveItem = (index) => {
    setCartItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const userId = getCurrentUserUid();
      if (!userId) throw new Error('User not authenticated');
      
      await saveBillingData(cartItems, userId);
      setCartItems([]); // Clear cart after successful checkout
      alert('Billing complete!');
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="billing-main-container">
      <h2>Billing System</h2>
      <div className="billing-form">
        <BillingForm onAddToCart={handleAddToCart} />
      </div>
      <div className="billing-cart">
        <BillingCart 
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />
      </div>
      <div className="billing-summary">
        <BillingSummary 
          cartItems={cartItems} 
          onCheckout={handleCheckout}
          isLoading={isLoading}
        />
      </div>
      <div className="billing-export">
        <BillingExport cartItems={cartItems} />
      </div>
    </div>
  );
};

export default BillingMain;

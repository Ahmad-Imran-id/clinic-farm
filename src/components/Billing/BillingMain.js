import React, { useState } from 'react';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import BillingForm from './BillingForm';
import BillingCart from './BillingCart';
import BillingSummary from './BillingSummary';
import BillingExport from './BillingExport';
import { saveBillingData } from '../../utils/firebaseUtils';
import { getCurrentUserUid } from '../../utils/authUtils';

const BillingMain = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleAddToCart = (product) => {
    setCartItems(prevItems => {
      // Check if the product already exists in cart
      const existingItemIndex = prevItems.findIndex(item => 
        item.id === product.id && item.isPartial === product.isPartial
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity for existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + product.quantity
        };
        return updatedItems;
      } else {
        // Add new item to cart
        return [...prevItems, {
          ...product,
          packSize: product.unitsPerPack || 1,
          unit: product.unitType || 'unit'
        }];
      }
    });
  };

  const handleUpdateQuantity = (index, newQuantity) => {
    setCartItems(prevItems => 
      prevItems.map((item, i) => {
        if (i === index) {
          const qty = Math.max(1, parseInt(newQuantity) || 1);
          // For partial items, ensure we don't exceed pack size
          if (item.isPartial) {
            return {...item, quantity: Math.min(qty, item.packSize)};
          }
          return {...item, quantity: qty};
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (index) => {
    setCartItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setAlert({ variant: 'warning', message: 'Your cart is empty!' });
      return;
    }
    
    setIsLoading(true);
    try {
      const userId = getCurrentUserUid();
      if (!userId) throw new Error('User not authenticated');
      
      await saveBillingData(cartItems, userId);
      setCartItems([]);
      setAlert({ variant: 'success', message: 'Sale completed successfully!' });
    } catch (error) {
      console.error('Checkout failed:', error);
      setAlert({ variant: 'danger', message: `Checkout failed: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="py-3">
      {alert && (
        <Alert variant={alert.variant} onClose={() => setAlert(null)} dismissible>
          {alert.message}
        </Alert>
      )}
      
      <Row className="mb-4">
        <Col>
          <h2 className="text-center">Billing System</h2>
        </Col>
      </Row>

      <Row>
        <Col md={5}>
          <Card className="mb-3">
            <Card.Header>Product Search</Card.Header>
            <Card.Body>
              <BillingForm onAddToCart={handleAddToCart} />
            </Card.Body>
          </Card>
        </Col>

        <Col md={7}>
          <Card className="mb-3">
            <Card.Header>Current Sale</Card.Header>
            <Card.Body>
              <BillingCart 
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
              />
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Header>Summary</Card.Header>
            <Card.Body>
              <BillingSummary 
                cartItems={cartItems} 
                onCheckout={handleCheckout}
                isLoading={isLoading}
              />
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>Export Options</Card.Header>
            <Card.Body>
              <BillingExport cartItems={cartItems} />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BillingMain;

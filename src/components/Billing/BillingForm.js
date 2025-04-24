import React, { useState, useEffect } from 'react';
import { Form, Button, ListGroup, Spinner, Alert, Card } from 'react-bootstrap';
import { fetchProductByBarcode, fetchProductSuggestions } from '../../utils/firebaseUtils';
import { getCurrentUserUid } from '../../utils/authUtils';

const BillingForm = ({ onAddToCart }) => {
  const [barcode, setBarcode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [partialQty, setPartialQty] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.trim().length > 0) {
        setLoading(true);
        try {
          const userId = getCurrentUserUid();
          if (!userId) throw new Error('User not authenticated');
          
          // Access the user's inventory collection
          const results = await fetchProductSuggestions(searchTerm, userId);
          setSuggestions(results);
          setError(null);
        } catch (err) {
          setError('Failed to fetch suggestions');
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleScan = async () => {
    if (!barcode.trim()) return;
    setLoading(true);
    try {
      const userId = getCurrentUserUid();
      if (!userId) throw new Error('User not authenticated');
      
      const product = await fetchProductByBarcode(barcode, userId);
      if (product) {
        setSelectedProduct(product);
        setError(null);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError('Scan failed');
      console.error(err);
    } finally {
      setLoading(false);
      setBarcode('');
    }
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      // For non-partial sales or single unit products
      if (selectedProduct.unitsPerPack <= 1 || partialQty === selectedProduct.unitsPerPack) {
        onAddToCart({
          ...selectedProduct,
          quantity: 1,
          isPartial: false,
          packSize: selectedProduct.unitsPerPack || 1,
          unit: selectedProduct.unitType || 'unit'
        });
      } else {
        // For partial sales (individual units from a pack)
        onAddToCart({
          ...selectedProduct,
          quantity: partialQty,
          isPartial: true,
          packSize: selectedProduct.unitsPerPack || 1,
          unit: selectedProduct.unitType || 'unit'
        });
      }
      setSelectedProduct(null);
      setPartialQty(1);
      setSearchTerm('');
      setSuggestions([]);
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSearchTerm('');
    setSuggestions([]);
  };

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Barcode Scanner</Form.Label>
        <div className="d-flex">
          <Form.Control
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleScan()}
            placeholder="Scan barcode"
          />
          <Button 
            variant="primary" 
            onClick={handleScan} 
            disabled={loading}
            className="ms-2"
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Scan'}
          </Button>
        </div>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Product Search</Form.Label>
        <Form.Control
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
        />
        {loading && <div className="mt-2"><Spinner animation="border" size="sm" /></div>}
        
        {suggestions.length > 0 && (
          <ListGroup className="mt-2">
            {suggestions.map((product) => (
              <ListGroup.Item 
                key={product.id}
                action
                onClick={() => handleSelectProduct(product)}
              >
                {product.name} ({product.unitsPerPack || 1} {product.unitType || 'units'})
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Form.Group>

      {selectedProduct && (
        <Card className="mb-3">
          <Card.Body>
            <h5>{selectedProduct.name}</h5>
            <p>Price: ₹{selectedProduct.price}</p>
            
            {selectedProduct.unitsPerPack > 1 ? (
              <>
                <p>Pack Size: {selectedProduct.unitsPerPack} {selectedProduct.unitType || 'units'}</p>
                <Form.Group>
                  <Form.Label>Quantity to sell:</Form.Label>
                  <div className="d-flex align-items-center">
                    <Form.Control
                      type="number"
                      min="1"
                      max={selectedProduct.unitsPerPack}
                      value={partialQty}
                      onChange={(e) => setPartialQty(Math.min(selectedProduct.unitsPerPack, Math.max(1, parseInt(e.target.value) || 1)))}
                      style={{ width: '80px' }}
                    />
                    <span className="ms-2">/ {selectedProduct.unitsPerPack} {selectedProduct.unitType || 'units'}</span>
                  </div>
                </Form.Group>
              </>
            ) : (
              <p>Single unit product</p>
            )}
            
            <Button 
              variant="success" 
              onClick={handleAddToCart}
              className="mt-3"
            >
              Add to Cart
            </Button>
          </Card.Body>
        </Card>
      )}

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </>
  );
};

export default BillingForm;

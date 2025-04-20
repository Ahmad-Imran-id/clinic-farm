import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { fetchProductByBarcode, fetchProductSuggestions } from '../../utils/firebaseUtils';
import { getCurrentUserUid } from '../../utils/authUtils';

const BillingForm = ({ onAddToCart }) => {
  const [barcode, setBarcode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const userId = getCurrentUserUid();
        if (!userId) return;
        
        const results = await fetchProductSuggestions(searchTerm, userId);
        setSuggestions(results);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleScan = async () => {
    if (!barcode.trim()) return;
    
    try {
      setIsLoading(true);
      const product = await fetchProductByBarcode(barcode);
      if (product) {
        onAddToCart(product);
        setBarcode('');
      } else {
        alert('Product not found!');
      }
    } catch (error) {
      console.error('Scan failed:', error);
      alert('Failed to scan product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="billing-form space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleScan()}
          placeholder="Scan barcode"
          className="input flex-1"
          disabled={isLoading}
        />
        <button 
          onClick={handleScan} 
          className="btn"
          disabled={isLoading}
        >
          {isLoading ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search product"
          className="input w-full"
          disabled={isLoading}
        />
        {isLoading && (
          <div className="absolute right-2 top-2">
            <span className="loading-spinner"></span>
          </div>
        )}
        {suggestions.length > 0 && (
          <ul className="suggestions-list absolute z-10 w-full bg-white border rounded shadow-lg">
            {suggestions.map(item => (
              <li 
                key={item.id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onAddToCart(item);
                  setSearchTerm('');
                  setSuggestions([]);
                }}
              >
                {item.name} - ₹{item.price.toFixed(2)} ({item.stock} in stock)
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

BillingForm.propTypes = {
  onAddToCart: PropTypes.func.isRequired
};

export default BillingForm;

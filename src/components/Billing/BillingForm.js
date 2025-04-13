import React, { useState } from 'react';
import { fetchProductByBarcode, fetchProductSuggestions } from '../../utils/firebaseUtils';
import { getCurrentUserUid } from '../../firebase-config';

const BillingForm = ({ onAddToCart }) => {
  const [barcode, setBarcode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleScan = async () => {
    const product = await fetchProductByBarcode(barcode);
    if (product) onAddToCart(product);
    setBarcode('');
  };

  const handleSuggestionFetch = async () => {
    const userId = getCurrentUserUid();
    if (!userId) return;
    const results = await fetchProductSuggestions(searchTerm, userId);
    setSuggestions(results);
  };

  return (
    <div className="billing-form space-y-2">
      <input
        type="text"
        value={barcode}
        onChange={e => setBarcode(e.target.value)}
        placeholder="Scan barcode"
        className="input"
      />
      <button onClick={handleScan} className="btn">Scan</button>

      <input
        type="text"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        onBlur={handleSuggestionFetch}
        placeholder="Search product"
        className="input"
      />
      <ul className="suggestions-list">
        {suggestions.map(item => (
          <li key={item.id} onClick={() => onAddToCart(item)}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default BillingForm;

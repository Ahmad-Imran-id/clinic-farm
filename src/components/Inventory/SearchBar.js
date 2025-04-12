import React from 'react';

const SearchBar = ({ products, searchQuery, setSearchQuery, suggestions, setSuggestions }) => {
  const handleSearchChange = e => {
    const value = e.target.value;
    setSearchQuery(value);
    setSuggestions(products.filter(p => p.name.toLowerCase().includes(value.toLowerCase())));
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search product name"
        value={searchQuery}
        onChange={handleSearchChange}
      />
      {suggestions.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {suggestions.map((s, idx) => (
            <li key={idx}>{s.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;

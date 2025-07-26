import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function SearchOrder() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return;
      navigate(`/order/${trimmedQuery}`);
    },
    [query, navigate]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
      role="search"
      aria-label="Search for an order"
    >
      {/* Hidden label for accessibility */}
      <label htmlFor="order-search" className="sr-only">
        Search Order by ID
      </label>

      <input
        id="order-search"
        placeholder="Search order #"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-28 rounded-full bg-yellow-100 px-4 py-2 text-sm transition-all duration-300 placeholder:text-stone-400 focus:outline-none focus:ring focus:ring-yellow-500 focus:ring-opacity-50 sm:w-64 sm:focus:w-72"
        aria-label="Enter order number"
      />

      <button
        type="submit"
        disabled={!query.trim()}
        className="rounded-full bg-yellow-500 px-4 py-2 text-white transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:bg-yellow-300"
      >
        Search
      </button>
    </form>
  );
}

export default SearchOrder;

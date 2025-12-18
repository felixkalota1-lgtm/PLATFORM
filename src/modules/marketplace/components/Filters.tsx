import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface FiltersProps {
  onFilterChange: (filters: {
    category?: string;
    priceMin?: number;
    priceMax?: number;
    rating?: number;
    search?: string;
    inStock?: boolean;
  }) => void;
  categories?: string[];
}

export default function Filters({ onFilterChange, categories = [] }: FiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    rating: false,
    availability: false,
  });

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    priceMin: 0,
    priceMax: 1000,
    rating: 0,
    inStock: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFilterChange = (
    key: string,
    value: string | number | boolean
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      search: '',
      category: '',
      priceMin: 0,
      priceMax: 1000,
      rating: 0,
      inStock: false,
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.priceMin > 0 ||
    filters.priceMax < 1000 ||
    filters.rating > 0 ||
    filters.inStock;

  const mockCategories = categories.length > 0 ? categories : [
    'Electronics',
    'Machinery',
    'Raw Materials',
    'Consumables',
    'Services',
  ];

  const displayCategories = categories.length > 0 ? categories : mockCategories;

  return (
    <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg p-4 space-y-4">
      {/* Search */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Search
        </label>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          placeholder="Search products..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
        />
      </div>

      {/* Category */}
      <div className="border-t dark:border-gray-700 pt-4">
        <button
          onClick={() => toggleSection('category')}
          className="w-full flex items-center justify-between mb-3"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Category
          </h3>
          {expandedSections.category ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </button>

        {expandedSections.category && (
          <div className="space-y-2">
            {displayCategories.map((category) => (
              <label
                key={category}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="category"
                  value={category}
                  checked={filters.category === category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {category}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="border-t dark:border-gray-700 pt-4">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between mb-3"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Price Range
          </h3>
          {expandedSections.price ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </button>

        {expandedSections.price && (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                Min Price: ${filters.priceMin}
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange('priceMin', Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                Max Price: ${filters.priceMax}
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange('priceMax', Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-center">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                ${filters.priceMin} - ${filters.priceMax}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="border-t dark:border-gray-700 pt-4">
        <button
          onClick={() => toggleSection('rating')}
          className="w-full flex items-center justify-between mb-3"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Minimum Rating
          </h3>
          {expandedSections.rating ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </button>

        {expandedSections.rating && (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4, 5].map((rating) => (
              <label
                key={rating}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  checked={filters.rating === rating}
                  onChange={(e) => handleFilterChange('rating', Number(e.target.value))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {rating === 0
                    ? 'All Ratings'
                    : `${rating}★ and above`}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="border-t dark:border-gray-700 pt-4">
        <button
          onClick={() => toggleSection('availability')}
          className="w-full flex items-center justify-between mb-3"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Availability
          </h3>
          {expandedSections.availability ? (
            <ChevronUp size={18} />
          ) : (
            <ChevronDown size={18} />
          )}
        </button>

        {expandedSections.availability && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => handleFilterChange('inStock', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              In Stock Only
            </span>
          </label>
        )}
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <div className="border-t dark:border-gray-700 pt-4">
          <button
            onClick={resetFilters}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

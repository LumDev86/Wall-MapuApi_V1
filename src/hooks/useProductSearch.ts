import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/api';
import { Product } from '../types/product.types';
import { useAuth } from '../context/AuthContext';

interface SearchResult {
  data: Product[];
  total: number;
  query: string;
  cached: boolean;
}

export const useProductSearch = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
        setSearchTotal(0);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, user]);

  const performSearch = async (query: string) => {
    try {
      setIsSearching(true);
      const params: {
        query: string;
        limit?: number;
        latitude?: number;
        longitude?: number;
      } = {
        query,
        limit: 20,
      };

      // Add user location if available
      if (user?.latitude && user?.longitude) {
        params.latitude = typeof user.latitude === 'string' ? parseFloat(user.latitude) : user.latitude;
        params.longitude = typeof user.longitude === 'string' ? parseFloat(user.longitude) : user.longitude;
      }

      const response: SearchResult = await productService.search(params);
      setSearchResults(response.data || []);
      setSearchTotal(response.total || 0);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
      setSearchTotal(0);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchTotal(0);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchTotal,
    clearSearch,
    hasResults: searchResults.length > 0,
    isQueryValid: searchQuery.trim().length >= 2,
  };
};

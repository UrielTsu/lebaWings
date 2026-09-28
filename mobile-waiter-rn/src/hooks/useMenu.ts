import { useState, useEffect, useCallback } from 'react';
import { MenuItem } from '../types';
import { WaiterApi } from '../services/api';

export function useMenu() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const fetchMenu = useCallback(async () => {
    try {
      setError(null);
      const data = await WaiterApi.getMenu();
      setMenu(data);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la API de cocina');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMenu();
  }, [fetchMenu]);

  const categories = ['Todos', ...Array.from(new Set(menu.map((item) => item.category_name)))];

  const filteredMenu = menu.filter((item) => {
    if (selectedCategory === 'Todos') return true;
    return item.category_name === selectedCategory;
  });

  return {
    menu: filteredMenu,
    allMenuItems: menu,
    categories,
    selectedCategory,
    setSelectedCategory,
    loading,
    refreshing,
    error,
    onRefresh,
    refetch: fetchMenu,
  };
}

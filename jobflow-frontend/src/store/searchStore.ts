import { create } from 'zustand';
import type { VacancySearchParams } from '@/services/vacancyService';

interface SearchState {
  filters: VacancySearchParams;
  searchText: string;
  setFilters: (filters: VacancySearchParams) => void;
  setSearchText: (text: string) => void;
  resetFilters: () => void;
}

const defaultFilters: VacancySearchParams = {
  query: '',
  page: 1,
  limit: 20,
};

export const useSearchStore = create<SearchState>((set) => ({
  filters: defaultFilters,
  searchText: '',
  setFilters: (filters) => set({ filters }),
  setSearchText: (text) => set({ searchText: text }),
  resetFilters: () => set({ filters: defaultFilters, searchText: '' }),
}));

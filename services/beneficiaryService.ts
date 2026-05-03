import { supabase } from '../CharityStore'; // We'll export supabase from CharityStore or create a dedicated client file

// We need to handle both proxy and direct modes if we want to maintain the multi-environment setup.
// For simplicity and security, we will assume the direct Supabase client is used for data fetching 
// now that RLS is enabled, OR we route through the proxy.

const API_MODE = import.meta.env.VITE_API_MODE || 'proxy';

export const BeneficiaryService = {
  /**
   * Fetches a paginated list of beneficiaries with ONLY required columns.
   */
  getPaginated: async (page: number, limit: number = 20, filters: any = {}) => {
    const from = page * limit;
    const to = from + limit - 1;

    // Convert array to comma-separated string for query params
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      filters.categoryIds = filters.categoryIds.join(',');
    } else {
      delete filters.categoryIds; // Don't send empty array
    }

    if (API_MODE === 'proxy') {
      // If using proxy, we would need a new endpoint like /api/beneficiaries/paginated
      // For now, we'll build the query string
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      }).toString();
      
      const res = await fetch(`/api/beneficiaries/paginated?${query}`);
      if (!res.ok) throw new Error('Failed to fetch paginated beneficiaries');
      return res.json();
    } else {
      // Direct Supabase Mode with RLS
      if (!supabase) throw new Error('Supabase client not initialized for direct mode');
      
      // Select all columns to ensure no data is missing
      let query = supabase
        .from('beneficiaries')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('createdAt', { ascending: false });

      // Apply filters if any
      if (filters.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,nationalId.ilike.%${filters.searchTerm}%`);
      }
      if (filters.regionId) query = query.eq('regionId', filters.regionId);
      if (filters.sponsorshipStatus) query = query.eq('sponsorshipStatus', filters.sponsorshipStatus);
      if (filters.gender) query = query.eq('gender', filters.gender);
      if (filters.educationLevel) query = query.eq('educationLevel', filters.educationLevel);
      if (filters.categoryIds) {
        const cats = filters.categoryIds.split(',');
        query = query.contains('categoryIds', cats);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Data Fetch Error:', error.message);
        throw new Error('Failed to fetch beneficiaries');
      }

      return { data, count };
    }
  },
  
  create: async (data: any) => {
    if (API_MODE === 'proxy') {
      const res = await fetch('/api/beneficiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    } else {
      const { data: result, error } = await supabase!.from('beneficiaries').insert(data).select().single();
      if (error) throw error;
      return result;
    }
  },
  
  update: async (id: string, data: any) => {
    if (API_MODE === 'proxy') {
      const res = await fetch(`/api/beneficiaries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    } else {
      const { data: result, error } = await supabase!.from('beneficiaries').update(data).eq('id', id).select().single();
      if (error) throw error;
      return result;
    }
  },

  delete: async (id: string) => {
    if (API_MODE === 'proxy') {
      const res = await fetch(`/api/beneficiaries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return true;
    } else {
      const { error } = await supabase!.from('beneficiaries').delete().eq('id', id);
      if (error) throw error;
      return true;
    }
  }
};

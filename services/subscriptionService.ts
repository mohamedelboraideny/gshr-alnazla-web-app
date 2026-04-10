import { supabase } from '../CharityStore';

const API_MODE = import.meta.env.VITE_API_MODE || 'proxy';

export const SubscriptionService = {
  getPaginated: async (page: number, limit: number = 20, filters: any = {}) => {
    const from = page * limit;
    const to = from + limit - 1;

    if (API_MODE === 'proxy') {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      }).toString();
      
      const res = await fetch(`/api/subscriptions/paginated?${query}`);
      if (!res.ok) throw new Error('Failed to fetch subscriptions');
      return res.json();
    } else {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      let query = supabase
        .from('sponsor_subscriptions')
        .select('*, sponsors!inner(name, branchId)', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (filters.branchId) {
        query = query.eq('sponsors.branchId', filters.branchId);
      }
      if (filters.sponsorId) {
        query = query.eq('sponsor_id', filters.sponsorId);
      }
      if (filters.searchTerm) {
        query = query.ilike('sponsors.name', `%${filters.searchTerm}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    }
  }
};

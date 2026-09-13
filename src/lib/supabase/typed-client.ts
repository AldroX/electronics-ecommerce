import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// Create a properly typed service client
export function createTypedServiceClient(): SupabaseClient<Database> {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return createClient<Database>('http://localhost:54321', 'mock-key');
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Type-safe table operations
export type Tables = Database['public']['Tables'];
export type TableName = keyof Tables;

export function getTable<T extends TableName>(client: SupabaseClient<Database>, table: T) {
  return client.from(table);
}

// Insert result type
export type InsertResult<T extends TableName> = Tables[T]['Insert'];

// Update result type
export type UpdateResult<T extends TableName> = Tables[T]['Update'];

// Row type
export type RowType<T extends TableName> = Tables[T]['Row'];

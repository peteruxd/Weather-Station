
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-url')) {
    throw new Error('Supabase Environment Variables not set. Please update .env.local and restart the server.');
}

// Real client
export const supabase = createClient(supabaseUrl, supabaseKey);

/* 
// Mock Client for Prototype (Commented out)
export const supabase = {
    from: (table: string) => {
        return {
            select: async (columns: string) => {
                console.log(`Fetching ${columns} from ${table}`);
                // Simulate network delay
                await new Promise((resolve) => setTimeout(resolve, 500));
                  // ... mock logic ...
                return { data: [], error: null };
            },
            insert: async (data: any) => {
                console.log(`Inserting into ${table}`, data);
                return { data, error: null };
            }
        };
    },
}; 
*/

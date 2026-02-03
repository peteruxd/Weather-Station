
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isMock = !supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-url');

if (isMock) {
    console.warn('Supabase Environment Variables missing. Using Mock Client.');
}

// Mock Client Implementation
const mockClient = {
    from: (table: string) => {
        return {
            select: () => {
                return {
                    order: () => {
                        return {
                            limit: async (count: number) => {
                                console.log(`[MOCK] Fetching last ${count} records from ${table}`);
                                // Simulate network delay
                                await new Promise((resolve) => setTimeout(resolve, 800));

                                const now = new Date();
                                const mockData = Array.from({ length: count || 10 }).map((_, i) => {
                                    const time = new Date(now.getTime() - i * 15 * 60000); // 15 min intervals
                                    return {
                                        id: `mock-${i}`,
                                        created_at: time.toISOString(),
                                        temperature: 22 + Math.sin(i * 0.5) * 5 + (Math.random() * 2 - 1),
                                        humidity: 55 + Math.cos(i * 0.5) * 10 + (Math.random() * 4 - 2),
                                    };
                                });

                                return { data: mockData, error: null };
                            }
                        };
                    }
                };
            },
            insert: async (data: any) => {
                console.log(`[MOCK] Inserting into ${table}`, data);
                return { data, error: null };
            }
        };
    },
};

export const supabase = isMock
    ? (mockClient as any)
    : createClient(supabaseUrl!, supabaseKey!);

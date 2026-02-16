// Test Supabase connection endpoint
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🧪 Testing Supabase connection...');

        // Check if env vars exist
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return res.status(500).json({
                success: false,
                error: 'Environment variables not set',
                details: {
                    SUPABASE_URL: supabaseUrl ? '✅ Set' : '❌ Missing',
                    SUPABASE_ANON_KEY: supabaseKey ? '✅ Set' : '❌ Missing'
                }
            });
        }

        // Initialize Supabase client
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Test simple query
        const { data, error, count } = await supabase
            .from('tokens')
            .select('*', { count: 'exact', head: true });

        if (error) {
            return res.status(500).json({
                success: false,
                error: 'Supabase query failed',
                details: {
                    message: error.message,
                    code: error.code,
                    hint: error.hint
                }
            });
        }

        // Success!
        return res.status(200).json({
            success: true,
            message: 'Supabase connection successful',
            details: {
                url: supabaseUrl,
                tokenCount: count || 0,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Connection test error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: {
                message: error.message,
                stack: error.stack
            }
        });
    }
}

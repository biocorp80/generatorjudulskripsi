// Get current AI configuration
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        // Get active AI configuration
        const { data, error } = await supabase
            .from('ai_config')
            .select('provider, model_name, gemini_api_key, openrouter_api_key, updated_at')
            .eq('is_active', true)
            .single();

        if (error) {
            console.error('Error fetching AI config:', error);
            // Return default config if none found
            return res.status(200).json({
                provider: 'gemini',
                model_name: 'gemini-2.0-flash-exp',
                has_gemini_key: false,
                has_openrouter_key: false,
                updated_at: new Date().toISOString()
            });
        }

        // Never expose actual API keys to frontend
        // Only send boolean flags indicating if they exist
        return res.status(200).json({
            provider: data.provider,
            model_name: data.model_name,
            has_gemini_key: !!data.gemini_api_key,
            has_openrouter_key: !!data.openrouter_api_key,
            updated_at: data.updated_at
        });

    } catch (error) {
        console.error('Get AI config error:', error);
        return res.status(500).json({
            error: 'Failed to fetch AI configuration',
            message: error.message
        });
    }
}

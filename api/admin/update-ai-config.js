// Update AI configuration (admin only)
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { adminToken, provider, model_name, gemini_api_key, openrouter_api_key } = req.body;

        // Validate required fields
        if (!adminToken || !provider || !model_name) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'adminToken, provider, and model_name are required'
            });
        }

        // Validate provider
        if (!['gemini', 'openrouter'].includes(provider)) {
            return res.status(400).json({
                error: 'Invalid provider',
                message: 'Provider must be "gemini" or "openrouter"'
            });
        }

        // Use SERVICE_ROLE key for admin operations (bypasses RLS)
        // In Supabase UI, this is labeled as "secret" key (not anon key)
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        );

        // Verify admin token
        const { data: tokenData, error: tokenError } = await supabase
            .from('tokens')
            .select('type')
            .eq('token', adminToken)
            .eq('type', 'admin')
            .single();

        if (tokenError || !tokenData) {
            return res.status(403).json({
                error: 'Unauthorized',
                message: 'Invalid admin token'
            });
        }

        // Prepare update data
        const updateData = {
            provider,
            model_name,
            updated_at: new Date().toISOString(),
            updated_by: 'admin'
        };

        // Only include API keys if they are provided (not empty strings)
        if (gemini_api_key && gemini_api_key.trim()) {
            updateData.gemini_api_key = gemini_api_key.trim();
        }
        if (openrouter_api_key && openrouter_api_key.trim()) {
            updateData.openrouter_api_key = openrouter_api_key.trim();
        }

        // Update or insert config (upsert)
        // First, deactivate all existing configs
        await supabase
            .from('ai_config')
            .update({ is_active: false })
            .eq('is_active', true);

        // Then insert new active config
        const { data, error } = await supabase
            .from('ai_config')
            .insert({
                ...updateData,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error('Error updating AI config:', error);
            return res.status(500).json({
                error: 'Failed to update configuration',
                message: error.message
            });
        }

        // Return success (without API keys)
        return res.status(200).json({
            success: true,
            message: 'AI configuration updated successfully',
            config: {
                provider: data.provider,
                model_name: data.model_name,
                updated_at: data.updated_at
            }
        });

    } catch (error) {
        console.error('Update AI config error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

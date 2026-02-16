// Quick script to check current AI configuration
// Run with: node check-ai-config.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://myyeyxnyanjodaiwgpul.supabase.co',
    'sb_publishable_r6fr29CFD3lPpeEjjJg1RQ_LYe8_CP8'
);

async function checkConfig() {
    console.log('🔍 Checking AI Configuration...\n');

    try {
        const { data, error } = await supabase
            .from('ai_config')
            .select('*')
            .eq('is_active', true)
            .single();

        if (error) {
            console.log('❌ No active config in Supabase database');
            console.log('Error:', error.message);
            console.log('\n📌 KESIMPULAN: Aplikasi menggunakan VERCEL ENVIRONMENT VARIABLES');
            console.log('   - Provider: gemini (default)');
            console.log('   - Model: gemini-2.0-flash-exp (default)');
            console.log('   - API Key: Dari GEMINI_API_KEY di Vercel');
            return;
        }

        console.log('✅ Active config found in Supabase database:\n');
        console.log('Provider:', data.provider);
        console.log('Model:', data.model_name);
        console.log('Has Gemini Key:', !!data.gemini_api_key);
        console.log('Has OpenRouter Key:', !!data.openrouter_api_key);
        console.log('Updated At:', data.updated_at);
        console.log('\n📌 KESIMPULAN: Aplikasi menggunakan SUPABASE DATABASE CONFIG');

    } catch (err) {
        console.error('❌ Error:', err.message);
        console.log('\n📌 KESIMPULAN: Aplikasi menggunakan VERCEL ENVIRONMENT VARIABLES (fallback)');
    }
}

checkConfig();

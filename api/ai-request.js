// Secure AI Request Proxy for Vercel Serverless Functions
// Supports: Google Gemini & OpenRouter (Configurable via Database)

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { prompt, systemInstruction } = req.body;
        if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Missing or invalid prompt' });
        if (prompt.length > 10000) return res.status(400).json({ error: 'Prompt too long (max 10000 chars)' });

        // 1. Fetch Configuration from Database
        let config = {
            provider: (process.env.AI_PROVIDER || 'gemini').toLowerCase(),
            model: null, // Will use provider default if null
            geminiKey: process.env.GEMINI_API_KEY,
            openrouterKey: process.env.OPENROUTER_API_KEY
        };

        try {
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_ANON_KEY
            );

            const { data, error } = await supabase
                .from('ai_config')
                .select('*')
                .eq('is_active', true)
                .single();

            if (data && !error) {
                config.provider = data.provider;
                config.model = data.model_name;
                // Prefer DB key, fallback to Env key
                if (data.gemini_api_key) config.geminiKey = data.gemini_api_key;
                if (data.openrouter_api_key) config.openrouterKey = data.openrouter_api_key;
            }
        } catch (dbError) {
            console.error('Failed to fetch AI config from DB, using defaults:', dbError);
        }

        // 2. Route Request based on Config
        let responseText;

        if (config.provider === 'openrouter') {
            responseText = await callOpenRouter(prompt, systemInstruction, config);
        } else {
            responseText = await callGemini(prompt, systemInstruction, config);
        }

        // 3. Response Handling
        try {
            let clean = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const jsonData = JSON.parse(clean);
            return res.status(200).json(jsonData);
        } catch {
            return res.status(200).json({ text: responseText });
        }
    } catch (error) {
        console.error('AI Request Error:', error);
        return res.status(500).json({ error: 'AI request failed', message: error.message });
    }
}

async function callGemini(prompt, systemInstruction, config) {
    const apiKey = config.geminiKey;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    // Use DB model or Env model or Default
    const model = config.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

    const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 4096,
            }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('Gemini Error:', err);
        throw new Error(`Gemini API Error: ${response.status} - ${model}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

async function callOpenRouter(prompt, systemInstruction, config) {
    const apiKey = config.openrouterKey;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

    // Use DB model or Env model or Default
    const model = config.model || process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp';

    const messages = [];
    if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': process.env.SITE_URL || 'https://dosbing.ai',
            'X-Title': 'Dosbing.ai'
        },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 })
    });

    if (!response.ok) {
        const err = await response.text();
        console.error('OpenRouter Error:', err);
        throw new Error(`OpenRouter API Error: ${response.status} - ${model}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

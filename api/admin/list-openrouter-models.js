// List available OpenRouter models (admin only)
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // Get OpenRouter API key from environment or database
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return res.status(400).json({
                error: 'OpenRouter API key not configured',
                message: 'Please add OPENROUTER_API_KEY to environment variables or update via admin panel'
            });
        }

        // Fetch available models from OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API error:', errorText);
            return res.status(response.status).json({
                error: 'Failed to fetch models from OpenRouter',
                message: `API returned ${response.status}`
            });
        }

        const data = await response.json();

        // Transform and filter models for better display
        const models = data.data.map(model => ({
            id: model.id,
            name: model.name || model.id,
            description: model.description || '',
            context_length: model.context_length || 0,
            pricing: {
                prompt: model.pricing?.prompt || '0',
                completion: model.pricing?.completion || '0'
            },
            // Add convenience flags
            is_gemini: model.id.includes('gemini'),
            is_gpt: model.id.includes('gpt'),
            is_claude: model.id.includes('claude')
        }))
            // Sort: Gemini first, then GPT, then Claude, then others
            .sort((a, b) => {
                if (a.is_gemini && !b.is_gemini) return -1;
                if (!a.is_gemini && b.is_gemini) return 1;
                if (a.is_gpt && !b.is_gpt) return -1;
                if (!a.is_gpt && b.is_gpt) return 1;
                if (a.is_claude && !b.is_claude) return -1;
                if (!a.is_claude && b.is_claude) return 1;
                return a.name.localeCompare(b.name);
            });

        return res.status(200).json({
            success: true,
            count: models.length,
            models: models
        });

    } catch (error) {
        console.error('List OpenRouter models error:', error);
        return res.status(500).json({
            error: 'Failed to fetch models',
            message: error.message
        });
    }
}

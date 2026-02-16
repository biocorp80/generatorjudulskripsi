// List available Gemini models (admin only)
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // Get Gemini API key from environment
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(400).json({
                error: 'Gemini API key not configured',
                message: 'Please add GEMINI_API_KEY to environment variables'
            });
        }

        // Fetch available models from Google Generative AI API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            return res.status(response.status).json({
                error: 'Failed to fetch models from Gemini',
                message: `API returned ${response.status}`
            });
        }

        const data = await response.json();

        // Filter and transform models for better display
        // Only include models that support generateContent
        const models = data.models
            .filter(model => {
                // Only include models that support generateContent method
                return model.supportedGenerationMethods?.includes('generateContent');
            })
            .map(model => ({
                id: model.name.replace('models/', ''), // Remove 'models/' prefix
                name: model.displayName || model.name,
                description: model.description || '',
                input_token_limit: model.inputTokenLimit || 0,
                output_token_limit: model.outputTokenLimit || 0,
                // Add version tag for sorting
                is_experimental: model.name.includes('exp'),
                is_flash: model.name.includes('flash'),
                is_pro: model.name.includes('pro')
            }))
            // Sort: Experimental first, then Flash, then Pro
            .sort((a, b) => {
                // Prefer experimental models
                if (a.is_experimental && !b.is_experimental) return -1;
                if (!a.is_experimental && b.is_experimental) return 1;
                // Then Flash models
                if (a.is_flash && !b.is_flash) return -1;
                if (!a.is_flash && b.is_flash) return 1;
                // Then Pro models
                if (a.is_pro && !b.is_pro) return -1;
                if (!a.is_pro && b.is_pro) return 1;
                // Finally alphabetical
                return a.name.localeCompare(b.name);
            });

        return res.status(200).json({
            success: true,
            count: models.length,
            models: models
        });

    } catch (error) {
        console.error('List Gemini models error:', error);
        return res.status(500).json({
            error: 'Failed to fetch models',
            message: error.message
        });
    }
}

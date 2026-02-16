// Admin endpoint to delete a token
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Only allow DELETE requests
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    // Validate input
    if (!id) {
        return res.status(400).json({ error: 'Token ID is required' });
    }

    try {
        // Initialize Supabase client
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        // Delete token
        const { error } = await supabase
            .from('tokens')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting token:', error);
            return res.status(500).json({ error: 'Gagal menghapus token' });
        }

        return res.status(200).json({
            success: true,
            message: 'Token berhasil dihapus'
        });

    } catch (error) {
        console.error('Delete token error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

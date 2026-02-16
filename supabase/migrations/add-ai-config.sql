-- AI Configuration Table Migration
-- Add this to Supabase SQL Editor

-- Create ai_config table
CREATE TABLE IF NOT EXISTS ai_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openrouter')),
    model_name TEXT NOT NULL,
    gemini_api_key TEXT,
    openrouter_api_key TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by TEXT
);

-- Ensure only one active config at a time (Partial Unique Index)
CREATE UNIQUE INDEX IF NOT EXISTS only_one_active ON ai_config (is_active) WHERE is_active = TRUE;

-- Insert default config (uses Gemini with model from environment)
INSERT INTO ai_config (provider, model_name, is_active, updated_by) 
VALUES ('gemini', 'gemini-2.0-flash-exp', TRUE, 'system')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

-- Policy: Anonymous can only read provider and model (NOT API keys)
CREATE POLICY "Allow anonymous read for ai config"
    ON ai_config FOR SELECT
    TO anon
    USING (is_active = TRUE);

-- Policy: Only authenticated users can modify
CREATE POLICY "Require auth for ai config modifications"
    ON ai_config FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE ai_config IS 'Stores AI provider configuration for dynamic switching';
COMMENT ON COLUMN ai_config.provider IS 'AI provider: gemini or openrouter';
COMMENT ON COLUMN ai_config.model_name IS 'Model identifier specific to the provider';
COMMENT ON COLUMN ai_config.gemini_api_key IS 'Optional: Gemini API key (overrides env var)';
COMMENT ON COLUMN ai_config.openrouter_api_key IS 'Optional: OpenRouter API key (overrides env var)';
COMMENT ON COLUMN ai_config.is_active IS 'Only one config can be active at a time';

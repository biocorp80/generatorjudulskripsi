-- Dosbing.ai Token Management Schema
-- Run this in your Supabase SQL Editor

-- Create enum type for token types
CREATE TYPE token_type AS ENUM ('admin', 'vip', 'user');

-- Create tokens table
CREATE TABLE IF NOT EXISTS tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    type token_type NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_tokens_token ON tokens(token);
CREATE INDEX idx_tokens_type ON tokens(type);
CREATE INDEX idx_tokens_is_used ON tokens(is_used);

-- Insert test tokens (Admin and VVIP)
INSERT INTO tokens (token, type, is_used) VALUES
    ('7Kz#9P@2Xm4R&8Wn', 'admin', FALSE),
    ('P5tL^9kS2j7H*w6G', 'vip', FALSE)
ON CONFLICT (token) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anonymous read access for token validation
CREATE POLICY "Allow anonymous token read for validation"
    ON tokens FOR SELECT
    TO anon
    USING (true);

-- Allow anonymous update for marking tokens as used
CREATE POLICY "Allow anonymous token update for usage"
    ON tokens FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- Only authenticated users can insert/delete (admin operations)
CREATE POLICY "Admin operations require authentication"
    ON tokens FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

COMMENT ON TABLE tokens IS 'Stores one-time use authentication tokens for Dosbing.ai';
COMMENT ON COLUMN tokens.token IS '16-character unique token string';
COMMENT ON COLUMN tokens.type IS 'Token type: admin (full access), vip (unlimited research), user (single use)';
COMMENT ON COLUMN tokens.is_used IS 'Whether this token has been used for authentication';
COMMENT ON COLUMN tokens.used_at IS 'Timestamp when token was first used';

-- Create pricing_rules table for managing seasonal and dynamic pricing
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    rule_name VARCHAR NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price_jpy INTEGER NOT NULL CHECK (price_jpy > 0),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1 CHECK (priority > 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pricing_rules_experience_id ON pricing_rules(experience_id);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_dates ON pricing_rules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_priority ON pricing_rules(priority);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_pricing_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_pricing_rules_updated_at
    BEFORE UPDATE ON pricing_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_pricing_rules_updated_at();

-- Add comments to explain the table structure
COMMENT ON TABLE pricing_rules IS 'Stores seasonal and dynamic pricing rules for experiences';
COMMENT ON COLUMN pricing_rules.rule_name IS 'Human-readable name for the pricing rule (e.g., "Summer Season", "Holiday Premium")';
COMMENT ON COLUMN pricing_rules.start_date IS 'Start date when this pricing rule becomes active';
COMMENT ON COLUMN pricing_rules.end_date IS 'End date when this pricing rule expires';
COMMENT ON COLUMN pricing_rules.price_jpy IS 'Price in Japanese Yen for this rule period';
COMMENT ON COLUMN pricing_rules.is_active IS 'Whether this pricing rule is currently active';
COMMENT ON COLUMN pricing_rules.priority IS 'Priority of the rule (lower numbers = higher priority). Used when multiple rules overlap.';

-- Create a function to get the current price for an experience on a specific date
CREATE OR REPLACE FUNCTION get_experience_price(experience_uuid UUID, check_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    base_price INTEGER;
    rule_price INTEGER;
BEGIN
    -- Get the base price from experiences table
    SELECT price_jpy INTO base_price
    FROM experiences
    WHERE id = experience_uuid;
    
    -- If no experience found, return 0
    IF base_price IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Check for active pricing rules that apply to the given date
    SELECT price_jpy INTO rule_price
    FROM pricing_rules
    WHERE experience_id = experience_uuid
        AND is_active = true
        AND start_date <= check_date
        AND end_date >= check_date
    ORDER BY priority ASC, created_at ASC
    LIMIT 1;
    
    -- Return rule price if found, otherwise return base price
    RETURN COALESCE(rule_price, base_price);
END;
$$ LANGUAGE plpgsql;

-- Add comment for the function
COMMENT ON FUNCTION get_experience_price(UUID, DATE) IS 'Returns the effective price for an experience on a specific date, considering active pricing rules';

-- Create a view for easy price lookups with rule information
CREATE OR REPLACE VIEW experience_pricing_view AS
SELECT 
    e.id as experience_id,
    e.title_en,
    e.price_jpy as base_price_jpy,
    pr.id as rule_id,
    pr.rule_name,
    pr.start_date,
    pr.end_date,
    pr.price_jpy as rule_price_jpy,
    pr.priority,
    pr.is_active as rule_is_active,
    CASE 
        WHEN pr.id IS NOT NULL AND pr.is_active = true 
             AND pr.start_date <= CURRENT_DATE 
             AND pr.end_date >= CURRENT_DATE 
        THEN pr.price_jpy
        ELSE e.price_jpy
    END as current_effective_price_jpy
FROM experiences e
LEFT JOIN pricing_rules pr ON e.id = pr.experience_id
ORDER BY e.title_en, pr.priority ASC, pr.created_at ASC;

-- Add comment for the view
COMMENT ON VIEW experience_pricing_view IS 'Provides a comprehensive view of experiences with their pricing rules and current effective prices';

-- Insert some example pricing rules (optional - remove if not needed)
-- These are just examples and can be removed in production
INSERT INTO pricing_rules (experience_id, rule_name, start_date, end_date, price_jpy, priority, is_active)
SELECT 
    id as experience_id,
    'Summer Premium' as rule_name,
    '2025-06-01'::date as start_date,
    '2025-08-31'::date as end_date,
    ROUND(price_jpy * 1.2) as price_jpy, -- 20% increase
    1 as priority,
    false as is_active -- Set to false so it doesn't affect current pricing
FROM experiences 
WHERE price_jpy > 0
LIMIT 3; -- Only add to first 3 experiences as examples
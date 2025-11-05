-- Add excluded_tour_types column to discount_codes table
-- If NULL or empty, discount code works for all tours
-- If populated, discount code is excluded from those specific tour types

ALTER TABLE public.discount_codes
ADD COLUMN excluded_tour_types TEXT[] DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.discount_codes.excluded_tour_types IS 
'Array of tour types that this discount code CANNOT be used for. If NULL or empty, code works for all tours. Example: {''UJI_TOUR'', ''MORNING_TOUR''} would exclude those two tour types.';

-- Create index for efficient queries when checking excluded tours
CREATE INDEX IF NOT EXISTS idx_discount_codes_excluded_tour_types 
ON public.discount_codes USING GIN (excluded_tour_types);

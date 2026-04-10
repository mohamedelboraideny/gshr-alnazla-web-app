-- 1. Add new columns to the subscriptions table
ALTER TABLE sponsor_subscriptions 
ADD COLUMN IF NOT EXISTS payment_receipt_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS check_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS deposit_number VARCHAR(255);

-- 2. Drop the old function to recreate it with new signature
DROP FUNCTION IF EXISTS add_sponsor_subscription(text, numeric, date, character varying, text, uuid, integer);

-- 3. Create the updated RPC function
CREATE OR REPLACE FUNCTION add_sponsor_subscription(
    p_sponsor_id TEXT,
    p_amount NUMERIC,
    p_payment_date DATE,
    p_paid_month VARCHAR,
    p_notes TEXT,
    p_user_id UUID,
    p_book_number INTEGER,
    p_payment_receipt_number VARCHAR DEFAULT NULL,
    p_check_number VARCHAR DEFAULT NULL,
    p_deposit_number VARCHAR DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_last_receipt_number INTEGER;
    v_new_receipt_number INTEGER;
    v_subscription_id UUID;
BEGIN
    -- Auto-increment internal receipt number based on the mandatory book number
    SELECT COALESCE(MAX(receipt_number), 0)
    INTO v_last_receipt_number
    FROM sponsor_subscriptions
    WHERE book_number = p_book_number;
    
    v_new_receipt_number := v_last_receipt_number + 1;

    -- Insert the subscription
    INSERT INTO sponsor_subscriptions (
        sponsor_id, amount, payment_date, paid_month, book_number, receipt_number, 
        payment_receipt_number, check_number, deposit_number, notes, created_by
    ) VALUES (
        p_sponsor_id, p_amount, p_payment_date, p_paid_month, p_book_number, v_new_receipt_number, 
        p_payment_receipt_number, p_check_number, p_deposit_number, p_notes, p_user_id
    ) RETURNING id INTO v_subscription_id;

    -- Update the sponsor's last_paid_month
    UPDATE sponsors
    SET last_paid_month = p_paid_month
    WHERE id = p_sponsor_id;

    RETURN json_build_object(
        'success', true,
        'subscription_id', v_subscription_id,
        'book_number', p_book_number,
        'receipt_number', v_new_receipt_number
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Insert some dummy data for testing (Optional)
-- This assumes you have at least one sponsor. It will safely ignore if no sponsors exist.
DO $$
DECLARE
    v_sponsor_id TEXT;
    v_user_id UUID;
BEGIN
    -- Get a random sponsor and user
    SELECT id INTO v_sponsor_id FROM sponsors LIMIT 1;
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;

    IF v_sponsor_id IS NOT NULL AND v_user_id IS NOT NULL THEN
        PERFORM add_sponsor_subscription(
            v_sponsor_id, 
            500::NUMERIC, 
            CURRENT_DATE, 
            '2026-04'::VARCHAR, 
            'اشتراك تجريبي 1'::TEXT, 
            v_user_id, 
            101::INTEGER, 
            'REC-001'::VARCHAR, 
            NULL::VARCHAR, 
            NULL::VARCHAR
        );
        PERFORM add_sponsor_subscription(
            v_sponsor_id, 
            500::NUMERIC, 
            (CURRENT_DATE - INTERVAL '1 month')::DATE, 
            '2026-03'::VARCHAR, 
            'اشتراك تجريبي 2'::TEXT, 
            v_user_id, 
            101::INTEGER, 
            NULL::VARCHAR, 
            NULL::VARCHAR, 
            'DEP-881'::VARCHAR
        );
    END IF;
END $$;

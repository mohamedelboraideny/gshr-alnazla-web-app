-- 1. Add last_paid_month to sponsors table
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS last_paid_month VARCHAR(255);

-- 2. Create sponsor_subscriptions table
CREATE TABLE IF NOT EXISTS sponsor_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id TEXT REFERENCES sponsors(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date DATE NOT NULL,
    paid_month VARCHAR(255) NOT NULL,
    book_number INTEGER NOT NULL,
    receipt_number INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. Enable RLS
ALTER TABLE sponsor_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON sponsor_subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert access for authenticated users" ON sponsor_subscriptions FOR INSERT TO authenticated WITH CHECK (true);

-- 5. RPC Function for atomic transaction
CREATE OR REPLACE FUNCTION add_sponsor_subscription(
    p_sponsor_id TEXT,
    p_amount NUMERIC,
    p_payment_date DATE,
    p_paid_month VARCHAR,
    p_notes TEXT,
    p_user_id UUID,
    p_manual_book_number INTEGER DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_last_book_number INTEGER;
    v_last_receipt_number INTEGER;
    v_new_book_number INTEGER;
    v_new_receipt_number INTEGER;
    v_subscription_id UUID;
BEGIN
    IF p_manual_book_number IS NOT NULL THEN
        -- User provided a specific book number
        v_new_book_number := p_manual_book_number;
        
        -- Get the highest receipt number for this specific book
        SELECT COALESCE(MAX(receipt_number), 0)
        INTO v_last_receipt_number
        FROM sponsor_subscriptions
        WHERE book_number = v_new_book_number;
        
        v_new_receipt_number := v_last_receipt_number + 1;
    ELSE
        -- Auto-fetch from the absolute last entry
        SELECT book_number, receipt_number 
        INTO v_last_book_number, v_last_receipt_number
        FROM sponsor_subscriptions
        ORDER BY created_at DESC
        LIMIT 1;

        IF v_last_book_number IS NULL THEN
            -- First entry ever
            v_new_book_number := 1;
            v_new_receipt_number := 1;
        ELSE
            -- Default behavior: same book, increment receipt
            -- Note: If a book has a maximum number of receipts (e.g., 50), 
            -- the user can manually input the new book number in the UI, 
            -- which triggers the IF block above.
            v_new_book_number := v_last_book_number;
            v_new_receipt_number := v_last_receipt_number + 1;
        END IF;
    END IF;

    -- Insert the subscription
    INSERT INTO sponsor_subscriptions (
        sponsor_id, amount, payment_date, paid_month, book_number, receipt_number, notes, created_by
    ) VALUES (
        p_sponsor_id, p_amount, p_payment_date, p_paid_month, v_new_book_number, v_new_receipt_number, p_notes, p_user_id
    ) RETURNING id INTO v_subscription_id;

    -- Update the sponsor's last_paid_month
    UPDATE sponsors
    SET last_paid_month = p_paid_month
    WHERE id = p_sponsor_id;

    RETURN json_build_object(
        'success', true,
        'subscription_id', v_subscription_id,
        'book_number', v_new_book_number,
        'receipt_number', v_new_receipt_number
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

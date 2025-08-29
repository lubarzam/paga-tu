-- Manual fix: Set correct totals for this specific account
-- The item costs 8000, tip is 800, so each person should pay (8000/2) + (800/2) = 4400
UPDATE account_participants 
SET total_amount = 4400.00
WHERE account_id = '09deb102-c334-49d8-9e77-db82274b95c7';
-- Confirmar emails dos usuários demo existentes
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    updated_at = NOW()
WHERE email IN ('admin@oee.com', 'supervisor@oee.com', 'operador@oee.com')
  AND email_confirmed_at IS NULL;
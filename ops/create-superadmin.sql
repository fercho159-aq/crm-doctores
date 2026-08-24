-- Limpia si existe
DELETE FROM usuario WHERE email = 'info@novamedics.com.mx';
DELETE FROM workspace WHERE nombre = 'NovaMedics Admin';

-- Crea workspace y usuario
DO $$
DECLARE ws_id uuid;
BEGIN
  INSERT INTO workspace (id, tipo, nombre) VALUES (gen_random_uuid(), 'BASIC', 'NovaMedics Admin') RETURNING id INTO ws_id;
  INSERT INTO usuario (id, workspace_id, rol, email, password_hash, nombre_completo, debe_cambiar_password)
  VALUES (gen_random_uuid(), ws_id, 'DOCTOR', 'info@novamedics.com.mx',
  '$argon2id$v=19$m=19456,t=2,p=1$cLTgM1SsiQCRojMUGyZsbg$ez7tZezSOljqYvOA4K2KY7z7Wc9nefs6Is/CwvPTP/g',
  'NovaMedics Admin', false);
END $$;

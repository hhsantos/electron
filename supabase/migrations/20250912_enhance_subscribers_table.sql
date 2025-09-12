-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS subscribers (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Mejorar la tabla con campos adicionales
ALTER TABLE subscribers 
    ADD COLUMN IF NOT EXISTS ip_address TEXT,
    ADD COLUMN IF NOT EXISTS user_agent TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Allow inserts with rate limiting" ON subscribers;
DROP POLICY IF EXISTS "Allow email existence check" ON subscribers;
DROP POLICY IF EXISTS "Allow inserts" ON subscribers;

-- Habilitar RLS
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Crear política para inserción (simplificada)
CREATE POLICY "Allow inserts" ON subscribers
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- Crear política para lectura (para verificar duplicados)
CREATE POLICY "Allow read for duplicates" ON subscribers
    FOR SELECT 
    TO anon
    USING (true);

-- Función para actualizar el timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Eliminar trigger si existe y crearlo de nuevo
DROP TRIGGER IF EXISTS update_subscribers_updated_at ON subscribers;
CREATE TRIGGER update_subscribers_updated_at
    BEFORE UPDATE ON subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS empresas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  cif VARCHAR(20) UNIQUE,
  email_contacto VARCHAR(200),
  telefono VARCHAR(20),
  direccion TEXT,
  plan VARCHAR(20) DEFAULT 'starter',
  precio_mensual NUMERIC(10,2),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  rol VARCHAR(20) DEFAULT 'user',
  activo BOOLEAN DEFAULT true,
  ultimo_acceso TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preferencias (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE UNIQUE,
  tipos_obra TEXT[],
  provincias TEXT[],
  importe_min NUMERIC,
  importe_max NUMERIC,
  frecuencia_alerta VARCHAR(20) DEFAULT 'inmediata',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS licitaciones_guardadas (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  licitacion_id VARCHAR(200) NOT NULL,
  titulo TEXT,
  organismo VARCHAR(300),
  importe NUMERIC,
  fecha_limite DATE,
  provincia VARCHAR(100),
  municipio VARCHAR(100),
  cpv VARCHAR(200),
  enlace TEXT,
  estado VARCHAR(30) DEFAULT 'nueva',
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(empresa_id, licitacion_id)
);

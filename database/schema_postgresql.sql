-- ==============================================================================
-- SCRIPT DDL COMPLETO DE BASE DE DATOS RELACIONAL POSTGRESQL / SUPABASE
-- Proyecto: Punto de Equilibrio & CRM Comercial Multi-Empresa / Multi-Sucursal
-- ==============================================================================

-- Habilitar extensión para generación de UUID v4
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ESTRUCTURA BASE DE USUARIOS Y EMPRESAS (MULTI-TENANT / MULTI-SOCIO)
-- ==============================================================================

-- Perfil de usuario (Vinculado con auth.users de Supabase Auth)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  telefono VARCHAR(50),
  estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- Empresas / Proyectos de Negocio
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(150) NOT NULL,
  cuit_rut VARCHAR(30),
  razon_social VARCHAR(150),
  rubro VARCHAR(100),
  logo_url TEXT,
  created_by UUID REFERENCES usuarios(id),
  updated_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- Tabla Pivot: Membresías y Roles de Usuarios en Empresas (Multi-Socio)
CREATE TABLE IF NOT EXISTS empresa_usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol VARCHAR(30) NOT NULL CHECK (rol IN ('ADMIN', 'SOCIO', 'GERENTE', 'CAJERO')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, usuario_id)
);

-- Locales Comerciales / Sucursales por Empresa
CREATE TABLE IF NOT EXISTS locales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre VARCHAR(150) NOT NULL,
  direccion TEXT,
  es_central BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES usuarios(id),
  updated_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- Horarios de Apertura por Día y Múltiples Turnos por Local
CREATE TABLE IF NOT EXISTS horarios_locales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id UUID NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
  dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1: Lunes, 7: Domingo
  hora_apertura TIME NOT NULL,
  hora_cierre TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. CATÁLOGO DE PRODUCTOS Y MARGENES
-- ==============================================================================

-- Categorías de Productos por Empresa (con % de Marcación sobre el costo)
CREATE TABLE IF NOT EXISTS categorias_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  porcentaje_marcacion NUMERIC(8, 2) NOT NULL DEFAULT 0.00, -- Ej: 30.00 para 30%
  descripcion TEXT,
  created_by UUID REFERENCES usuarios(id),
  updated_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- Productos Comerciales
CREATE TABLE IF NOT EXISTS productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias_productos(id) ON DELETE SET NULL,
  nombre VARCHAR(150) NOT NULL,
  costo_unitario NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  precio_venta NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  contribucion_marginal NUMERIC(15, 2) GENERATED ALWAYS AS (precio_venta - costo_unitario) STORED,
  porcentaje_margen NUMERIC(8, 2) GENERATED ALWAYS AS (
    CASE WHEN precio_venta > 0 THEN ((precio_venta - costo_unitario) / precio_venta) * 100 ELSE 0 END
  ) STORED,
  created_by UUID REFERENCES usuarios(id),
  updated_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- ==============================================================================
-- 3. TESORERÍA, BANCOS Y BILLETERAS DIGITALES
-- ==============================================================================

-- Tabla Global Paramétrica de Tipos de Cuentas (Compartida para todas las empresas)
CREATE TABLE IF NOT EXISTS tipos_cuentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL, -- Ej: CAJA_AHORRO, BILLETERA_VIRTUAL, CAJA_CHICA, CUENTA_CORRIENTE
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Valores Iniciales / Semilla para Tipos de Cuentas Globales
INSERT INTO tipos_cuentas (codigo, nombre, descripcion) VALUES
  ('MERCADO_PAGO', 'Mercado Pago', 'Billetera Mercado Pago'),
  ('NARANJA_X', 'Naranja X', 'Billetera Naranja X'),
  ('RAPPI', 'Rappi', 'Billetera Rappi'),
  ('PEDIDOS_YA', 'Pedidos Ya', 'Billetera Pedidos Ya'),
  ('CAJA_EFECTIVO', 'Caja en Efectivo', 'Efectivo disponible'),
  ('CAJA_AHORRO', 'Caja de Ahorro', 'Ahorro Pesos')
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE IF NOT EXISTS cuentas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo_cuenta_id UUID NOT NULL REFERENCES tipos_cuentas(id),
  nombre VARCHAR(100) NOT NULL, -- Ej: Mercado Pago, Naranja X, Banco Nación
  cbu_cvu_alias VARCHAR(100),
  saldo_actual NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  created_by UUID REFERENCES usuarios(id),
  updated_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS movimientos_cuentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id UUID NOT NULL REFERENCES cuentas_bancarias(id) ON DELETE CASCADE,
  cuenta_destino_id UUID REFERENCES cuentas_bancarias(id) ON DELETE SET NULL, -- Para transferencias internas entre cuentas
  fecha TIMESTAMPTZ DEFAULT NOW(),
  origen_destino VARCHAR(150) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('INGRESO', 'EGRESO', 'TRANSFERENCIA')),
  monto NUMERIC(15, 2) NOT NULL,
  saldo_resultante NUMERIC(15, 2) NOT NULL,
  nota TEXT,
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. RECURSOS HUMANOS, TURNOS Y NÓMINA
-- ==============================================================================

-- Roles / Puestos de Trabajo por Empresa (compartidos entre todos los locales de la empresa)
CREATE TABLE IF NOT EXISTS roles_empleados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  tarifa_hora NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  created_by UUID REFERENCES usuarios(id),
  updated_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- Empleados pertenecientes a un Local
CREATE TABLE IF NOT EXISTS empleados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id UUID NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
  rol_id UUID REFERENCES roles_empleados(id) ON DELETE SET NULL,
  nombre_completo VARCHAR(150) NOT NULL,
  rol_puesto VARCHAR(100),
  tarifa_hora NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  tipo_contrato VARCHAR(50) DEFAULT 'Jornada Completa',
  estado VARCHAR(20) DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'LICENCIA', 'INACTIVO')),
  created_by UUID REFERENCES usuarios(id),
  updated_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- Horarios Programados Habituales por Empleado (Día de la semana y Múltiples Turnos desde/hasta)
CREATE TABLE IF NOT EXISTS horarios_empleados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1: Lunes, 7: Domingo
  hora_desde TIME NOT NULL,
  hora_hasta TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turnos y Registro de Asistencia Real Ejecutada por Empleado
CREATE TABLE IF NOT EXISTS turnos_empleados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_entrada TIME NOT NULL,
  hora_salida TIME NOT NULL,
  horas_trabajadas NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  observaciones TEXT,
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Liquidaciones de Sueldo (Historico Diario/Semanal/Mensual)
CREATE TABLE IF NOT EXISTS liquidaciones_sueldos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  cuenta_bancaria_id UUID REFERENCES cuentas_bancarias(id) ON DELETE SET NULL, -- Cuenta/Billetera desde donde se realiza el egreso del sueldo
  periodo_tipo VARCHAR(20) CHECK (periodo_tipo IN ('DIARIO', 'SEMANAL', 'MENSUAL')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  total_horas NUMERIC(8, 2) NOT NULL,
  subtotal_horas NUMERIC(15, 2) NOT NULL,
  adicionales NUMERIC(15, 2) DEFAULT 0.00,
  descuentos NUMERIC(15, 2) DEFAULT 0.00,
  total_liquidado NUMERIC(15, 2) NOT NULL,
  estado_pago VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado_pago IN ('PENDIENTE', 'PAGADO')),
  fecha_pago TIMESTAMPTZ NULL,
  created_by UUID REFERENCES usuarios(id),
  updated_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. CLIENTES MAYORISTAS Y CUENTAS CORRIENTES (CC)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clientes_mayoristas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre VARCHAR(150) NOT NULL,
  cuit_dni VARCHAR(30),
  telefono VARCHAR(50),
  direccion TEXT,
  limite_credito NUMERIC(15, 2) DEFAULT 0.00,
  saldo_deuda NUMERIC(15, 2) DEFAULT 0.00,
  created_by UUID REFERENCES usuarios(id),
  updated_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- Histórico de Entregas (+Deuda) y Pagos (-Deuda) Mayoristas
CREATE TABLE IF NOT EXISTS movimientos_mayoristas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes_mayoristas(id) ON DELETE CASCADE,
  cuenta_bancaria_id UUID REFERENCES cuentas_bancarias(id) ON DELETE SET NULL, -- Requerido cuando tipo = 'PAGO' para acreditar dinero
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ENTREGA', 'PAGO')),
  monto NUMERIC(15, 2) NOT NULL,
  saldo_resultante NUMERIC(15, 2) NOT NULL,
  comprobante_nro VARCHAR(50),
  nota TEXT,
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. PROVEEDORES Y COMPRAS A PAGAR
-- ==============================================================================

CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre VARCHAR(150) NOT NULL,
  categoria_principal_id UUID REFERENCES categorias_productos(id) ON DELETE SET NULL,
  cuit_rut VARCHAR(30),
  telefono VARCHAR(50),
  created_by UUID REFERENCES usuarios(id),
  updated_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS compras_proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  local_id UUID NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
  proveedor_id UUID NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
  tipo_compra VARCHAR(50) DEFAULT 'MERCADERIA' CHECK (tipo_compra IN ('MERCADERIA', 'PACKING', 'GASTO_OPERATIVO')),
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  monto_total NUMERIC(15, 2) NOT NULL,
  saldo_pendiente NUMERIC(15, 2) NOT NULL,
  estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PARCIAL', 'PAGADO', 'CANCELADO')),
  created_by UUID REFERENCES usuarios(id),
  updated_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pagos Parciales/Totales a Compras de Proveedores
CREATE TABLE IF NOT EXISTS pagos_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id UUID NOT NULL REFERENCES compras_proveedores(id) ON DELETE CASCADE,
  cuenta_bancaria_id UUID REFERENCES cuentas_bancarias(id) ON DELETE SET NULL,
  fecha_pago TIMESTAMPTZ DEFAULT NOW(),
  monto_pagado NUMERIC(15, 2) NOT NULL,
  comprobante_ref VARCHAR(100),
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. GASTOS FIJOS Y CUENTAS POR PAGAR (ALQUILER, LUZ, SERVICIOS)
-- ==============================================================================

-- Categorías de Gastos
CREATE TABLE IF NOT EXISTS categorias_gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) UNIQUE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar categorías por defecto (solo si no existen)
INSERT INTO categorias_gastos (nombre) VALUES
  ('Alquiler'),
  ('Servicios Públicos'),
  ('Impuestos & Tasas'),
  ('Servicios Comerciales (Internet, Alarma)'),
  ('Gastos Contrato / Comisiones'),
  ('Mantenimiento'),
  ('Otros')
ON CONFLICT (nombre) DO NOTHING;

-- Presupuesto / Definición de Gastos Fijos
CREATE TABLE IF NOT EXISTS gastos_fijos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias_gastos(id) ON DELETE SET NULL,
  concepto VARCHAR(150) NOT NULL,
  monto_estimado NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  frecuencia VARCHAR(50) DEFAULT 'Mensual',
  monto_mensual NUMERIC(15, 2) DEFAULT 0.00,
  es_ajuste_contrato BOOLEAN DEFAULT false,
  dia_vencimiento_habitual INT DEFAULT 10,
  created_by UUID REFERENCES usuarios(id),
  updated_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- Facturas de Gastos Reales por Mes (Cuentas por Pagar)
CREATE TABLE IF NOT EXISTS facturas_gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gasto_fijo_id UUID NOT NULL REFERENCES gastos_fijos(id) ON DELETE CASCADE,
  periodo_mes VARCHAR(7) NOT NULL, -- Ej: '2026-09'
  monto_facturado NUMERIC(15, 2) NOT NULL,
  saldo_pendiente NUMERIC(15, 2) NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PARCIAL', 'PAGADO')),
  created_by UUID REFERENCES usuarios(id),
  updated_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pagos de Facturas de Gastos Fijos
CREATE TABLE IF NOT EXISTS pagos_gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_gasto_id UUID NOT NULL REFERENCES facturas_gastos(id) ON DELETE CASCADE,
  cuenta_bancaria_id UUID REFERENCES cuentas_bancarias(id) ON DELETE SET NULL,
  fecha_pago TIMESTAMPTZ DEFAULT NOW(),
  monto_pagado NUMERIC(15, 2) NOT NULL,
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. CAJA DIARIA Y RECAUDACIÓN DE LOCALES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS caja_diaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_id UUID NOT NULL REFERENCES locales(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  total_recaudado NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  observaciones TEXT,
  created_by UUID REFERENCES usuarios(id),
  updated_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(local_id, fecha)
);

-- Desglose de Pagos de Recaudación en Cuentas/Billeteras
CREATE TABLE IF NOT EXISTS caja_diaria_desglose_cuentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_diaria_id UUID NOT NULL REFERENCES caja_diaria(id) ON DELETE CASCADE,
  cuenta_bancaria_id UUID NOT NULL REFERENCES cuentas_bancarias(id) ON DELETE CASCADE,
  monto NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. SNAPSHOTS DE SIMULADOR DE PUNTO DE EQUILIBRIO (VERSIONADO HISTÓRICO)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS simulaciones_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  periodo_mes VARCHAR(7) NOT NULL, -- Ej: '2026-09'
  version INT DEFAULT 1,
  titulo_escenario VARCHAR(150) NOT NULL,
  gastos_fijos_totales NUMERIC(15, 2) NOT NULL,
  margen_promedio_porcentaje NUMERIC(8, 2) NOT NULL,
  ventas_punto_equilibrio NUMERIC(15, 2) NOT NULL,
  unidades_punto_equilibrio NUMERIC(15, 2) NOT NULL,
  detalles_json JSONB NOT NULL,
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 10. ÍNDICES DE RENDIMIENTO Y OPTIMIZACIÓN DE CONSULTAS
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_locales_empresa ON locales(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_empresa ON productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empleados_local ON empleados(local_id);
CREATE INDEX IF NOT EXISTS idx_turnos_empleado ON turnos_empleados(empleado_id, fecha);
CREATE INDEX IF NOT EXISTS idx_mayoristas_empresa ON clientes_mayoristas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mov_mayoristas_cliente ON movimientos_mayoristas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_empresa ON cuentas_bancarias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mov_cuentas_cuenta ON movimientos_cuentas(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_caja_local_fecha ON caja_diaria(local_id, fecha);
CREATE INDEX IF NOT EXISTS idx_compras_local ON compras_proveedores(local_id);

-- ==============================================================================
-- 11. TRIGGERS AUTOMÁTICOS PARA ACTUALIZACIÓN DE TIMESTAMPS
-- ==============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_usuarios BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_empresas BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_locales BEFORE UPDATE ON locales FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_productos BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_empleados BEFORE UPDATE ON empleados FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_cuentas BEFORE UPDATE ON cuentas_bancarias FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ==============================================================================
-- 12. DATOS SEMILLA / INSERTS DE DEMOSTRACIÓN (EMPRESA DEMO Y CATEGORÍAS)
-- ==============================================================================

DO $$
DECLARE
  v_empresa_id UUID := 'e0000000-0000-4000-8000-000000000001';
  v_local_id UUID := '10000000-0000-4000-8000-000000000001';
  v_tipo_mp_id UUID;
  v_tipo_nx_id UUID;
  v_tipo_efectivo_id UUID;
BEGIN

  -- 1. Empresa Demo
  INSERT INTO empresas (id, nombre, cuit_rut, razon_social, rubro)
  VALUES (v_empresa_id, 'Panadería & Comercio Demo', '30-71234567-8', 'Panadería & Comercio S.A.', 'Gastronomía y Comercio')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Local Comercial Principal
  INSERT INTO locales (id, empresa_id, nombre, direccion, es_central)
  VALUES (v_local_id, v_empresa_id, 'Local Av. Principal #1040', 'Av. Principal 1040', TRUE)
  ON CONFLICT (id) DO NOTHING;

  -- 3. Categorías de Productos con % de Marcación sobre el costo
  INSERT INTO categorias_productos (empresa_id, nombre, porcentaje_marcacion) VALUES
    (v_empresa_id, 'Almacén', 30.00),
    (v_empresa_id, 'Lácteos', 20.00),
    (v_empresa_id, 'Golosinas', 40.00),
    (v_empresa_id, 'Bebidas', 20.00),
    (v_empresa_id, 'Congelados', 30.00),
    (v_empresa_id, 'Panificación Extra', 20.00),
    (v_empresa_id, 'Panificación Colombres', 30.00),
    (v_empresa_id, 'Cigarrillos', 20.00),
    (v_empresa_id, 'Fiambres', 25.00),
    (v_empresa_id, 'Sin Asignar', 0.00),
    (v_empresa_id, 'Farmacia', 25.00);

  -- 4. Obtención de IDs de Tipos de Cuentas
  SELECT id INTO v_tipo_mp_id FROM tipos_cuentas WHERE codigo = 'MERCADO_PAGO';
  SELECT id INTO v_tipo_nx_id FROM tipos_cuentas WHERE codigo = 'NARANJA_X';
  SELECT id INTO v_tipo_efectivo_id FROM tipos_cuentas WHERE codigo = 'CAJA_EFECTIVO';

  -- 5. Cuentas Bancarias / Billeteras Iniciales de la Empresa
  IF v_tipo_mp_id IS NOT NULL THEN
    INSERT INTO cuentas_bancarias (empresa_id, tipo_cuenta_id, nombre, cbu_cvu_alias, saldo_actual)
    VALUES (v_empresa_id, v_tipo_mp_id, 'MERCADO_PAGO', 'mp.panaderia.alias', 130000.00);
  END IF;

  IF v_tipo_nx_id IS NOT NULL THEN
    INSERT INTO cuentas_bancarias (empresa_id, tipo_cuenta_id, nombre, cbu_cvu_alias, saldo_actual)
    VALUES (v_empresa_id, v_tipo_nx_id, 'NARANJA_X', 'nx.panaderia.alias', 150000.00);
  END IF;

  IF v_tipo_efectivo_id IS NOT NULL THEN
    INSERT INTO cuentas_bancarias (empresa_id, tipo_cuenta_id, nombre, cbu_cvu_alias, saldo_actual)
    VALUES (v_empresa_id, v_tipo_efectivo_id, 'CAJA_EFECTIVO', 'Efectivo en Local', 50000.00);
  END IF;

END $$;

-- ==============================================================================
-- 13. POLÍTICAS RLS (ROW LEVEL SECURITY) Y PERMISOS PÚBLICOS
-- ==============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Habilitar politicas publicas en tablas clave
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Publico Empresas" ON empresas;
CREATE POLICY "Publico Empresas" ON empresas FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE locales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Publico Locales" ON locales;
CREATE POLICY "Publico Locales" ON locales FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE roles_empleados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Publico Roles Empleados" ON roles_empleados;
CREATE POLICY "Publico Roles Empleados" ON roles_empleados FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Publico Empleados" ON empleados;
CREATE POLICY "Publico Empleados" ON empleados FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE horarios_empleados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Publico Horarios Empleados" ON horarios_empleados;
CREATE POLICY "Publico Horarios Empleados" ON horarios_empleados FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE horarios_locales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Publico Horarios Locales" ON horarios_locales;
CREATE POLICY "Publico Horarios Locales" ON horarios_locales FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE gastos_fijos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Publico Gastos Fijos" ON gastos_fijos;
CREATE POLICY "Publico Gastos Fijos" ON gastos_fijos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Publico Productos" ON productos;
CREATE POLICY "Publico Productos" ON productos FOR ALL USING (true) WITH CHECK (true);


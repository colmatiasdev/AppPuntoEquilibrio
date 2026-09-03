# Especificación de Contratos de API REST & Endpoints ABM

Esta documentación define la arquitectura de endpoints de la API RESTful para conectar el frontend del sistema **Punto de Equilibrio** con el backend PostgreSQL / Supabase.

---

## 🔐 Autenticación & Cabeceras Estándar

Todas las peticiones protegidas deben incluir la cabecera con el token JWT de usuario:
```http
Authorization: Bearer <SUPABASE_JWT_TOKEN>
Content-Type: application/json
```

---

## 🏢 1. Módulo Empresas & Sucursales / Locales

### **GET /api/v1/empresas**
Obtiene el listado de empresas a las que pertenece el usuario autenticado.
- **Respuesta 200 OK:**
```json
[
  {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "nombre": "Panadería & Confitería",
    "cuit_rut": "30-71234567-8",
    "rol_usuario": "ADMIN",
    "created_at": "2026-09-01T10:00:00Z"
  }
]
```

### **POST /api/v1/empresas**
Crea una nueva Empresa.

### **GET /api/v1/empresas/:empresa_id/locales**
Lista los locales/sucursales pertenecientes a la empresa.

### **POST /api/v1/empresas/:empresa_id/locales**
Crea un nuevo local comercial.

---

## 📦 2. Módulo Productos & Categorías

### **GET /api/v1/empresas/:empresa_id/categorias**
Lista las categorías de productos con sus % de marcación por defecto.
- **Respuesta 200 OK:**
```json
[
  { "id": "cat_1", "nombre": "Almacén", "porcentaje_marcacion": 30.00 },
  { "id": "cat_2", "nombre": "Lácteos", "porcentaje_marcacion": 20.00 },
  { "id": "cat_3", "nombre": "Golosinas", "porcentaje_marcacion": 40.00 },
  { "id": "cat_4", "nombre": "Bebidas", "porcentaje_marcacion": 20.00 },
  { "id": "cat_5", "nombre": "Congelados", "porcentaje_marcacion": 30.00 },
  { "id": "cat_6", "nombre": "Panificación Extra", "porcentaje_marcacion": 20.00 },
  { "id": "cat_7", "nombre": "Panificación Colombres", "porcentaje_marcacion": 30.00 },
  { "id": "cat_8", "nombre": "Cigarrillos", "porcentaje_marcacion": 20.00 },
  { "id": "cat_9", "nombre": "Fiambres", "porcentaje_marcacion": 25.00 },
  { "id": "cat_10", "nombre": "Sin Asignar", "porcentaje_marcacion": 0.00 },
  { "id": "cat_11", "nombre": "Farmacia", "porcentaje_marcacion": 25.00 }
]
```

### **POST /api/v1/empresas/:empresa_id/categorias**
Crea o actualiza una categoría de producto y su porcentaje de marcación.

### **GET /api/v1/empresas/:empresa_id/productos**
Lista los productos activos de la empresa.
- **Query Params:** `?categoria_id=UUID&search=pan`
- **Respuesta 200 OK:**
```json
[
  {
    "id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
    "nombre": "Pan Francés (Kg)",
    "categoria_id": "c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
    "costo_unitario": 1200.00,
    "precio_venta": 2500.00,
    "contribucion_marginal": 1300.00,
    "porcentaje_margen": 52.00
  }
]
```

### **POST /api/v1/empresas/:empresa_id/productos**
Crea un nuevo producto.

### **PUT /api/v1/productos/:id**
Edita datos o precios de un producto.

### **DELETE /api/v1/productos/:id**
Eliminación lógica (`deleted_at`).

### **POST /api/v1/locales/:local_id/horarios**
Registra o reemplaza los turnos de apertura/cierre de un Local por día de la semana (soporta múltiples turnos por día).
- **Body JSON:**
```json
{
  "horarios": [
    { "dia_semana": 1, "hora_apertura": "08:00", "hora_cierre": "13:00" },
    { "dia_semana": 1, "hora_apertura": "17:00", "hora_cierre": "21:00" },
    { "dia_semana": 2, "hora_apertura": "08:00", "hora_cierre": "13:00" }
  ]
}
```

---

## 👥 3. Módulo Recursos Humanos & Liquidaciones

### **POST /api/v1/locales/:local_id/empleados**
Crea un empleado asignado al local.

### **POST /api/v1/empleados/:empleado_id/horarios-semanales**
Configura los turnos asignados/habituales por día de la semana para el empleado.
- **Body JSON:**
```json
{
  "horarios": [
    { "dia_semana": 1, "hora_desde": "08:00", "hora_hasta": "13:00" },
    { "dia_semana": 1, "hora_desde": "17:00", "hora_hasta": "21:00" }
  ]
}
```

### **POST /api/v1/empleados/:empleado_id/turnos**
Registra la entrada y salida de asistencia real ejecutada en un día determinado.

### **POST /api/v1/empleados/:empleado_id/liquidaciones**
Liquida y efectúa el pago de sueldos (diario/semanal/mensual) debitando el importe de una cuenta/billetera para trazabilidad.
- **Body JSON:**
```json
{
  "cuenta_bancaria_id": "cta_efectivo_uuid",
  "periodo_tipo": "SEMANAL",
  "fecha_inicio": "2026-09-01",
  "fecha_fin": "2026-09-07",
  "total_horas": 40.0,
  "subtotal_horas": 80000.00,
  "adicionales": 5000.00,
  "descuentos": 0.00,
  "total_liquidado": 85000.00,
  "estado_pago": "PAGADO"
}
```

---

## 🤝 4. Módulo Clientes Mayoristas & Cuenta Corriente

### **GET /api/v1/empresas/:empresa_id/mayoristas**
Padrón de clientes mayoristas con su `saldo_deuda`.

### **POST /api/v1/mayoristas/:cliente_id/movimientos**
Registra una `ENTREGA` (+Deuda sin afectar cuentas) o un `PAGO` (-Deuda acreditando dinero a una cuenta/billetera).
- **Body JSON (Registrar Pago):**
```json
{
  "tipo": "PAGO",
  "cuenta_bancaria_id": "cta_mp_uuid",
  "monto": 45000.00,
  "comprobante_nro": "REC-000458",
  "nota": "Pago transferencia acreditada en Mercado Pago"
}
```

---

## 🏦 5. Módulo Tesorería & Billeteras Digitales

### **GET /api/v1/tipos-cuentas**
Obtiene el catálogo paramétrico global de tipos de cuentas disponibles.
- **Respuesta 200 OK:**
```json
[
  { "id": "t1_uuid", "codigo": "CAJA_AHORRO", "nombre": "Caja de Ahorro Bancaria" },
  { "id": "t2_uuid", "codigo": "CUENTA_CORRIENTE", "nombre": "Cuenta Corriente Bancaria" },
  { "id": "t3_uuid", "codigo": "BILLETERA_VIRTUAL", "nombre": "Billetera Digital / Fintech" },
  { "id": "t4_uuid", "codigo": "CAJA_CHICA", "nombre": "Caja Chica en Efectivo" }
]
```

### **GET /api/v1/empresas/:empresa_id/cuentas**
Obtiene los saldos de todas las cuentas y billeteras (MP, Naranja X, Banco).

### **POST /api/v1/cuentas/:cuenta_id/movimientos**
Registra un ingreso o egreso manual en la cuenta.

### **POST /api/v1/cuentas/transferencias**
Registra una transferencia interna entre dos cuentas propias.
- **Body JSON:**
```json
{
  "cuenta_origen_id": "cta_efectivo_uuid",
  "cuenta_destino_id": "cta_mp_uuid",
  "monto": 150000.00,
  "nota": "Depósito de caja chica a Mercado Pago"
}
```

---

## 🚚 6. Módulo Compras Proveedores & Cuentas por Pagar (Gastos Fijos)

### **GET /api/v1/locales/:local_id/compras-proveedores**
Obtiene el historial de compras realizadas por un Local específico.

### **POST /api/v1/locales/:local_id/compras-proveedores**
Registra una nueva compra a proveedor asignada al Local (indicando si es Mercadería, Packing o Gasto Operativo/Librería).
- **Body JSON:**
```json
{
  "empresa_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "local_id": "l0eebc99-9c0b-4ef8-bb6d-6bb9bd380l11",
  "proveedor_id": "p0eebc99-9c0b-4ef8-bb6d-6bb9bd380p11",
  "tipo_compra": "PACKING",
  "fecha_emision": "2026-09-02",
  "fecha_vencimiento": "2026-09-15",
  "monto_total": 35000.00,
  "saldo_pendiente": 35000.00
}
```

### **POST /api/v1/empresas/:empresa_id/gastos-fijos/facturas**
Registra la factura enviada al inicio del mes (Alquiler, Luz) con estado `PENDIENTE`.

### **POST /api/v1/facturas-gastos/:factura_id/pagos**
Registra el pago parcial o total de la factura debitando de una cuenta.
- **Body JSON:**
```json
{
  "cuenta_bancaria_id": "d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a44",
  "monto_pagado": 150000.00
}
```

---

## 📥 7. Módulo Recaudación Diaria & Control de Caja

### **POST /api/v1/locales/:local_id/caja-diaria**
Registra la recaudación diaria ingresada directamente por el desglose asignado a las cuentas/billeteras.
- **Body JSON:**
```json
{
  "fecha": "2026-09-02",
  "total_recaudado": 210000.00,
  "desglose_cuentas": [
    { "cuenta_bancaria_id": "cta_efectivo_uuid", "monto": 125000.00 },
    { "cuenta_bancaria_id": "cta_mp_uuid", "monto": 50000.00 },
    { "cuenta_bancaria_id": "cta_naranjax_uuid", "monto": 35000.00 }
  ],
  "observaciones": "Cierre de recaudación del día"
}
```

---

## 📈 8. Módulo Simulador & Snapshots Versionados

### **POST /api/v1/empresas/:empresa_id/simulaciones/snapshots**
Guarda un escenario mensual proyectado para seguimiento histórico.

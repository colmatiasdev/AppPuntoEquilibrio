# Especificación Técnica y Plan de Implementación por Etapas y Subetapas: Simulador y Analizador de Punto de Equilibrio Comercial

## 1. Visión General del Proyecto
Aplicación web interactiva desarrollada en **HTML5, CSS3 y JavaScript ES6+ (vanilla)** para evaluar la sustentabilidad y rentabilidad de abrir o alquilar un local comercial. Permite simular y estructurar gastos fijos, dotación de personal con análisis de brecha horaria, catálogo de productos con margen de marcación (% Marcación/Markup) heredable por categoría, proyección de ventas por frecuencia (diaria, semanal, quincenal, mensual) y análisis de punto de equilibrio con visualización de semáforo de riesgo y múltiples escenarios.

Toda la información se almacena localmente en el navegador mediante **LocalStorage**, con claves y variables **100% en español**, estructurada como una base de datos portable (vía exportación/importación JSON).

---

## 2. Arquitectura de Datos 100% en Español (Esquema LocalStorage)
Clave principal en `LocalStorage`: `app_punto_equilibrio_bd_v1`.

```json
{
  "idProyectoActivo": "proy_01",
  "idLocalActivo": "loc_01",
  "configuracion": {
    "porcentajeMarcacionDefecto": 40,
    "simboloMoneda": "$",
    "diasLaborablesMes": 26
  },
  "proyectos": [
    {
      "id": "proy_01",
      "nombre": "Panadería y Confitería",
      "descripcion": "Elaboración y venta de productos de panadería",
      "fechaCreacion": "2026-09-01T10:00:00Z"
    }
  ],
  "locales": [
    {
      "id": "loc_01",
      "idProyecto": "proy_01",
      "nombre": "Local Av. Principal #1040",
      "direccion": "Av. Principal 1040",
      "horariosComercio": {
        "diasPorSemana": 6,
        "horarioApertura": "07:00",
        "horarioCierre": "21:00",
        "horasOperativasDiarias": 14
      },
      "estimadoVentasMinimasZona": 15000000
    }
  ],
  "gastosFijos": [
    {
      "id": "gas_01",
      "idLocal": "loc_01",
      "nombre": "Alquiler Mensual Base",
      "categoria": "Alquiler",
      "monto": 450000,
      "frecuencia": "Mensual",
      "montoMensualProrrateado": 450000,
      "esAjusteContrato": false,
      "estaActivo": true
    },
    {
      "id": "gas_02",
      "idLocal": "loc_01",
      "nombre": "Luz / Electricidad",
      "categoria": "Servicios Públicos",
      "monto": 80000,
      "frecuencia": "Mensual",
      "montoMensualProrrateado": 80000,
      "esAjusteContrato": false,
      "estaActivo": true
    },
    {
      "id": "gas_03",
      "idLocal": "loc_01",
      "nombre": "Comisión Renovación Contrato (Proyectado)",
      "categoria": "Gastos Contrato",
      "monto": 600000,
      "frecuencia": "Anual",
      "montoMensualProrrateado": 50000,
      "esAjusteContrato": true,
      "estaActivo": true
    }
  ],
  "roles": [
    {
      "id": "rol_01",
      "idLocal": "loc_01",
      "nombre": "Atención al Público / Reposidor",
      "sueldoNeto": 350000
    }
  ],
  "empleados": [
    {
      "id": "emp_01",
      "idLocal": "loc_01",
      "idRol": "rol_01",
      "nombre": "Empleado Turno Mañana",
      "tipoContrato": "Jornada Completa",
      "sueldoNeto": 350000,
      "turnos": [
        { "nombre": "Mañana", "horaInicio": "07:00", "horaFin": "15:00", "totalHoras": 8 }
      ]
    }
  ],
  "categoriasProductos": [
    {
      "id": "cat_01",
      "idProyecto": "proy_01",
      "nombre": "Panificados y Bizcochos",
      "porcentajeMarcacionDefecto": 50,
      "frecuenciaVenta": "Diaria"
    },
    {
      "id": "cat_02",
      "idProyecto": "proy_01",
      "nombre": "Facturas y Especiales",
      "porcentajeMarcacionDefecto": 40,
      "frecuenciaVenta": "Diaria"
    },
    {
      "id": "cat_03",
      "idProyecto": "proy_01",
      "nombre": "Tortas Personalizadas",
      "porcentajeMarcacionDefecto": 60,
      "frecuenciaVenta": "Mensual"
    }
  ],
  "productos": [
    {
      "id": "prod_01",
      "idCategoria": "cat_02",
      "nombre": "1 Lata Facturas (36 unidades)",
      "unidadesPorBulto": 36,
      "precioCostoBulto": 45000,
      "porcentajeMarcacion": 40,
      "precioVentaBulto": 63000,
      "costoUnitario": 1250,
      "precioVentaUnitario": 1750,
      "frecuenciaVenta": "Diaria",
      "cantidadSimulada": 15
    },
    {
      "id": "prod_02",
      "idCategoria": "cat_01",
      "nombre": "Bolsa 5 Kg Pan",
      "unidadesPorBulto": 1,
      "precioCostoBulto": 15000,
      "porcentajeMarcacion": 50,
      "precioVentaBulto": 22500,
      "costoUnitario": 15000,
      "precioVentaUnitario": 22500,
      "frecuenciaVenta": "Diaria",
      "cantidadSimulada": 30
    }
  ]
}
```

---

## 3. Hoja de Ruta de Implementación por Etapas y Subetapas

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ETAPA 1: Estructura Base, UI Shell & Motor de Base de Datos LocalStorage│
└────────────────────┬─────────────────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────────────────┐
│  ETAPA 2: Módulo 1 - Gastos Fijos, Servicios e Impuestos                │
└────────────────────┬─────────────────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────────────────┐
│  ETAPA 3: Módulo 2 - Personal, Roles y Análisis de Brecha Horaria       │
└────────────────────┬─────────────────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────────────────┐
│  ETAPA 4: Módulo 3 - Catálogo de Productos y Marcación (Markup)          │
└────────────────────┬─────────────────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────────────────┐
│  ETAPA 5: Módulo 4 - Simulador de Ventas & Semáforo de Equilibrio       │
└────────────────────┬─────────────────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────────────────┐
│  ETAPA 6: Módulo 5 - Portabilidad de Datos (Importar/Exportar JSON)      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 📍 ETAPA 1: Estructura Base, UI Shell & Motor de Base de Datos LocalStorage
> **Objetivo:** Construir la plantilla base HTML/CSS/JS, navegación responsive con menú lateral (sidebar), barra superior (topbar) y la capa de almacenamiento `LocalStorage` con funciones CRUD base y datos de demostración (Seed Data).

- [x] **Subetapa 1.1: Maquetación HTML & Estilos CSS Base (Light Mode)**
  - Crear `index.html`, `css/estilos.css` y `js/baseDatos.js`.
  - Configurar variables CSS para sistema de colores en tema claro (`#f8fafc`, `#ffffff`, `#0f172a`, `#2563eb`).
  - Diseñar el menú lateral responsive (Sidebar) collapsible para navegación entre módulos.
  - Diseñar la barra superior (Topbar) con selector de proyecto/local activo.

- [x] **Subetapa 1.2: Engine de Base de Datos `LocalStorage` (en Español)**
  - Desarrollar la clase/módulo `BaseDatos` en JS para interactuar con la clave `app_punto_equilibrio_bd_v1`.
  - Crear funciones helper: `obtenerEstado()`, `guardarEstado()`, `reiniciarConDatosPrueba()`.
  - Implementar lógica de fallback para inicializar la base de datos con Seed Data la primera vez que se ejecute la app.

- [x] **Subetapa 1.3: Gestión de Proyectos y Locales Comerciales**
  - Modal/Formulario para crear y seleccionar Proyectos (ej: Panadería, Delivery).
  - Modal/Formulario para registrar Locales por proyecto (ej: Local Calle San Martín, Local Av. Principal) configurando horarios de apertura/cierre y estimado de ventas zona.

---

### 📍 ETAPA 2: Módulo 1 - Gastos Fijos, Servicios e Impuestos
> **Objetivo:** Permitir el registro dinámico de todos los egresos recurrentes del local con prorrateo mensual automático.

- [x] **Subetapa 2.1: Registro de Gastos Fijos y Categorías Dinámicas**
  - Interfaz de tabla/tarjetas para listar gastos fijos del local activo.
  - Formulario de alta/edición de gasto fijo: Nombre, Categoría (Alquiler, Servicios, Impuestos, etc.), Monto, Frecuencia (Diaria, Semanal, Mensual, Bimestral, Anual).

- [x] **Subetapa 2.2: Motor de Prorrateo Mensual y Opciones Especiales**
  - Lógica matemática de conversión de frecuencias a monto mensual equivalente.
  - Checkbox para activar/desactivar gastos de expensas, indexaciones o costos prorrateados de renovación de contrato.
  - Fila/Tarjeta resumen con el **Total de Gastos Fijos Mensuales**.

---

### 📍 ETAPA 3: Módulo 2 - Personal, Roles y Brecha Horaria
> **Objetivo:** Administrar la plantilla de empleados y calcular el desfasaje entre el horario comercial del local y las horas cubiertas por el personal.

- [x] **Subetapa 3.1: ABM de Roles y Empleados**
  - Formulario de Roles de Trabajo con sueldo neto sugerido.
  - Formulario de Empleados asignando rol, tipo de contrato (Completa/Parcial) y turnos con horario de entrada y salida.
  - Cálculo automático del **Costo Total Mensual de Empleados**.

- [x] **Subetapa 3.2: Panel de Análisis de Brecha Horaria**
  - Comparador visual: Horas requeridas por el local vs. Horas/hombre reales cubiertas.
  - Indicador de alerta si existen tramos u horarios pico del comercio sin suficiente cobertura de personal.

---

### 📍 ETAPA 4: Módulo 3 - Catálogo de Productos y Márgenes (Marcación)
> **Objetivo:** Gestionar las categorías con su porcentaje de marcación (% Markup) predeterminado y los productos por bulto/unidad.

- [x] **Subetapa 4.1: Categorías de Productos con Marcación Heredable**
  - ABM de Categorías de productos con marcación por defecto (%) y frecuencia típica de rotación (Diaria, Semanal, Mensual).

- [x] **Subetapa 4.2: ABM de Productos por Bulto y Unidad**
  - Formulario de Productos: Nombre, Categoría, Costo por Bulto/Lata/Bolsa, Unidades por Bulto.
  - Lógica de cálculo automático: Costo Unitario = Costo Bulto / Unidades.
  - Cálculo de Precio Venta Bulto y Unitario aplicando el % de Marcación heredado (con opción a sobrescribirlo por producto).

---

### 📍 ETAPA 5: Módulo 4 - Simulador de Ventas & Semáforo de Equilibrio
> **Objetivo:** Proyectar las ventas estimadas y calcular el punto de equilibrio con semáforo interactivo de 5 franjas y comparativo de escenarios.

- [x] **Subetapa 5.1: Formulario del Simulador de Cantidades y Frecuencias**
  - Lista de productos con inputs numéricos para ajustar la cantidad simulada a vender.
  - Mensualización automática según la frecuencia del producto (ej: 15 latas diarias vs 10 tortas mensuales).

- [x] **Subetapa 5.2: Motor de Cálculo de Punto de Equilibrio y Semáforo**
  - Cálculo de Facturación Total Proyectada vs. Costo Variable Total vs. Gastos Fijos Totales.
  - Cálculo de Ganancia Neta Mensual, Margen %, Días trabajados para pagar costos fijos y Facturación Mínima Diaria.
  - Lógica del **Semáforo de Sustentabilidad de 5 franjas** (Rojo, Naranja, Amarillo, Verde Claro, Verde Oscuro).
  - Cálculo del monto faltante de facturación global si no se alcanza el punto de equilibrio en base a marcación por defecto.

- [x] **Subetapa 5.3: Comparador de Escenarios (Pesimista / Moderado / Optimista)**
  - Selectores/Pestañas para alternar entre el Escenario Base (Moderado), Pesimista (-20% ventas) y Optimista (+25% ventas).

---

### 📍 ETAPA 6: Módulo 5 - Portabilidad de Datos & Pulido Responsive
> **Objetivo:** Asegurar la exportación/importación completa de la base de datos en JSON y optimizar la interfaz para cualquier dispositivo.

- [x] **Subetapa 6.1: Módulo de Importar / Exportar Base de Datos JSON**
  - Función de descarga de archivo `punto_equilibrio_backup.json` con la estructura en español.
  - Función de carga y validación de archivo `.json` para reemplazar o restaurar la base de datos en `LocalStorage`.
  - Botón de pánico/reinicio para recargar los datos demo originales.

- [x] **Subetapa 6.2: Adaptabilidad Mobile/Tablet & Pruebas E2E**
  - Ajustes responsivos CSS para presentación óptima en smartphones/tablets.
  - Verificación final de flujos de trabajo completos de principio a fin.

---

## 4. Plan de Verificación por Etapa
Cada etapa se considerará completada únicamente cuando cumpla con los siguientes criterios de prueba:
1. **Etapa 1:** Se verifica que la app carga el layout en tema claro y que al abrir por primera vez crea la estructura en `LocalStorage` con datos demo en español.
2. **Etapa 2:** Se comprueba que agregar un gasto bimestral o anual prorratee correctamente en el resumen de costos fijos mensuales.
3. **Etapa 3:** Se valida que los sueldos netos se sumen a los gastos generales y que el indicador de brecha horaria refleje las horas descubiertas del comercio.
4. **Etapa 4:** Se comprueba que crear un producto en una categoría adopte automáticamente el % de marcación y calcule los costos/precios unitarios.
5. **Etapa 5:** Se verifica que al modificar las cantidades en el simulador, el semáforo de 5 colores y los KPIs cambien en tiempo real.
6. **Etapa 6:** Se exporta el archivo JSON, se limpian los datos del navegador y se importa el archivo comprobando la restauración del 100% de la información.

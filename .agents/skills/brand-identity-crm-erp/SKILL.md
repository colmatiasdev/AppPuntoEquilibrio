---
name: brand-identity-crm-erp
description: CONSTITUCIÓN TÉCNICA SUPREMA (CRM-ERP). Mandato innegociable de consistencia, robustez y SEGURIDAD TOTAL. Rige componentes, flujos de datos y protección de endpoints. Obliga al cumplimiento de protocolos estrictos de Debugging, Resolución de Errores y Preservación de Funcionalidades Validadas. El incumplimiento de estas normas anula cualquier desarrollo. Evolución permitida solo mediante protocolos de mejora y maduración documentados.
---

# 📜 Constitución Técnica Suprema: AppERPSistems (CRM - ERP)

Este documento es la ley máxima del proyecto. Define no solo el "cómo" se construye, sino el "por qué" se protege lo construido. Cualquier agente que trabajate en este repositorio DEBE conocer y respetar estos mandatos para asegurar la maduración del sistema hasta su estado final.

## 🔗 Fuentes de Verdad Histórica (Repositorios)
Para resolver dudas sobre el funcionamiento original o revertir cambios críticos aprobados por error, consulta siempre el historial oficial:
https://github.com/colmatiasdev/AppPuntoEquilibrio/settings/pages

## 📚 Documentación de Referencia

> [!IMPORTANT]
> **Lectura Obligatoria para Agentes**: Antes de trabajar en cualquier módulo, leer primero la **SPEC MASTER** para tener contexto completo del sistema, su visión, misión y estado actual.

### 📋 SPEC MASTER — Visión, Misión y Especificación Completa
### 📦 Registro de Módulos — Catálogo Exhaustivo
### 🗄️ SPEC Base de Datos — Esquema Completo
### 🎨 Diseño y Estilos (UI/UX)
### 💻 Stack Tecnológico y Reglas de Código
### 🏗️ Arquitectura y Escalabilidad
### 📊 Patrones de Datos (Entities, DTOs, Interfaces)
### ⚙️ Lógica y Reglas de Negocio (Business Rules)

# ⚙️ Lógica y Reglas de Negocio (Business Logic)

Este documento centraliza el modelo de negocio actual y el comportamiento de sus módulos principales para garantizar coherencia en el flujo de operaciones.

### 🛡️ Seguridad y Robustez (Blindaje)
Para garantizar la integridad, auditoría y protección de los datos, consulta las directrices de blindaje.

---

## ⚡ Estándares Globales Obligatorios de UI y Persistencia (NUEVO MANDATO)

### 1. Spinner Overlay Global Obligatorio (`#overlay-spinner-global`)
- En **CADA** cambio de navegación entre módulos (`app.js` -> `navegarAModulo`), se **DEBE** mostrar el spinner global mediante `window.mostrarSpinner(mensaje)`.
- Durante toda carga asíncrona hacia Supabase (inicialización, lectura, guardado), se debe invocar `mostrarSpinner()` al inicio y `window.ocultarSpinner()` dentro del bloque `finally`.
- Está estrictamente prohibido que la pantalla parezca congelada sin feedback de carga.

### 2. Capa de Persistencia Relacional Pura (Cero Mocks)
- Todo módulo consume datos reales directamente desde PostgreSQL a través de `window.RepositorioRelacional` y `window.ClienteSupabase`.
- No se permiten arreglos de datos semillas ni datos mokeados.
- La compatibilidad de llamadas en memoria se gestiona a través de `window.BaseDatos` como una capa facade liviana en `repositorioRelacional.js`. Debe garantizar la existencia de todos los helpers de consulta (`obtenerEstado`, `obtenerLocalActivo`, `obtenerProyectoActivo`, `obtenerGastosFijosLocalActivo`, `obtenerEmpleadosLocalActivo`, `obtenerProductosLocalActivo`, `obtenerCajaDiariaLocalActivo`, `obtenerProveedoresProyectoActivo`, `obtenerCuentasProyectoActivo`, `obtenerComprasLocalActivo`, etc.) para prevenir errores de JavaScript.

---

## 🚀 Gobernanza y Evolución de la Skill

Esta habilidad no es estática; debe crecer con el proyecto, pero de forma controlada.

### 1. Mandato de Consistencia
Cualquier nuevo componente, flujo o servicio **debe** alinearse con las definiciones de esta carpeta. Si una instrucción externa entra en conflicto con estas reglas, la regla definida aquí tiene prioridad absoluta.

### 2. Protocolo de Mejora
Si durante el desarrollo se identifica un patrón superior o una necesidad de optimización:
1. **Propuesta**: El agente o desarrollador debe presentar una "Propuesta de Mejora de Estándar".
2. **Justificación**: Debe explicar por qué el cambio mejora la escalabilidad, el rendimiento o la UX.
3. **Impacto**: Evaluar si el cambio requiere refactorizar módulos existentes.
4. **Actualización**: Una vez aceptada, la skill se actualiza y se aplica el nuevo estándar de forma retroactiva si es posible.

### 3. Protocolo de Estabilidad y Resolución de Conflictos Históricos
Ante cualquier duda sobre un cambio que pueda ser "destructivo" o que altere un funcionamiento histórico, se debe seguir este flujo:
1. **Auditoría Histórica**: Consultar los repositorios oficiales.
2. **Prueba de Integridad**: Probar al menos **tres módulos diferentes** que utilicen los componentes antes de aplicar refactorizaciones.
3. **Rollback Prioritario**: Si un cambio causa una falla en la integridad de datos o un error de "pantalla blanca" en producción, la prioridad absoluta es **revertir** al estado estable anterior.
4. **Validación Cruzada**: Todo cambio en la lógica de cálculo requiere validación cruzada.

### 4. Mandato de Preservación Funcional e Histórica (CRITICAL)
Está **estrictamente prohibido** eliminar, desactivar o modificar sustancialmente funcionalidades, columnas, botones, validaciones o flujos existentes que ya estén operativos y validados por el usuario sin una consulta explícita y aprobación previa documentada. 

* **Evolución Aditiva**: El sistema crece agregando capas, no destruyendo cimientos.
* **Respeto al Legado**: Si un módulo funciona correctamente, cualquier mejora debe ser compatible hacia atrás. 

### 5. Definición de "Estado Validado"
Un módulo se considera "Validado" cuando cumple con:
1. **Frontend**: UI responsiva, spinner de carga activo, tooltips informativos, manejo de errores visuales.
2. **Backend**: CRUD completo, Soft Delete operativo y validación de esquemas en Supabase.
3. **Integración**: Flujo de datos fluido entre capas sin errores de consolas ni funciones faltantes.

---

## 🔍 Protocolo Supremo de Resolución de Errores (Debugging & Fixes)

Ante cualquier fallo de código o compilación, el proceso de resolución **debe** seguir estos pasos obligatorios:

### 1. Observación y Análisis de Causa Raíz (No parches)
* **Captura de Evidencia**: Leer logs de consola y stack traces completos.
* **Contraste con Skill**: Re-leer las secciones de esta Constitución relacionadas con el módulo.

### 2. Implementación y Verificación de Regresión
* Aplicar el cambio manteniendo los comentarios y convenciones de nombres.
* Verificar que el error desapareció y que no existan llamadas a métodos inexistentes en `window.BaseDatos`.

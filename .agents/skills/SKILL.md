---
name: brand-identity-crm-erp
description: CONSTITUCIÓN TÉCNICA SUPREMA (CRM-ERP). Mandato innegociable de consistencia, robustez y SEGURIDAD TOTAL. Rige componentes, flujos de datos y protección de endpoints. Obliga al cumplimiento de protocolos estrictos de Debugging, Resolución de Errores y Preservación de Funcionalidades Validadas. El incumplimiento de estas normas anula cualquier desarrollo. Evolución permitida solo mediante protocolos de mejora y maduración documentados.
---

# 📜 Constitución Técnica Suprema: AppERPSistems (CRM - ERP)

Este documento es la ley máxima del proyecto. Define no solo el "cómo" se construye, sino el "por qué" se protege lo construido. Cualquier agente que trabaje en este repositorio DEBE conocer y respetar estos mandatos para asegurar la maduración del sistema hasta su estado final.

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
Para entender el flujo concreto de los módulos, máquinas de estados (ej: Recetas) y operaciones permitidas, consulta la lógica y reglas de negocio.

# ⚙️ Lógica y Reglas de Negocio (Business Logic)

Este documento centraliza el modelo de negocio actual y el comportamiento de sus módulos principales para garantizar coherencia en el flujo de operaciones.

### 🛡️ Seguridad y Robustez (Blindaje)
Para garantizar la integridad, auditoría y protección de los datos, consulta las directrices de blindaje.

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
1. **Auditoría Histórica**: Consultar los repositorios ([Frontend](https://github.com/colmatiasdev/Frontend) / [Backend](https://github.com/colmatiasdev/store-api)) para entender el propósito original del código.
2. **Prueba de Integridad**: Antes de proponer un cambio en un componente compartido (ej: `DataTable`), se deben probar al menos **tres módulos diferentes** que lo utilicen para asegurar que no hay regresiones.
3. **Rollback Prioritario**: Si un cambio causa una falla en la integridad de datos o un error de "pantalla blanca" en producción, la prioridad absoluta es el **revertir** al estado estable anterior antes de diagnosticar la mejora.
4. **Validación Cruzada**: Todo cambio en la lógica de cálculo (precios, stock, equivalencias) requiere una validación cruzada entre el resultado del Backend y la visualización del Frontend.

### 4. Mandato de Preservación Funcional e Histórica (CRITICAL)
Está **estrictamente prohibido** eliminar, desactivar o modificar sustancialmente funcionalidades, columnas, botones, validaciones o flujos existentes que ya estén operativos y validados por el usuario sin una consulta explícita y aprobación previa documentada. 

* **Evolución Aditiva**: El sistema crece agregando capas, no destruyendo cimientos.
* **Respeto al Legado**: Si un módulo funciona correctamente, cualquier mejora debe ser compatible hacia atrás. 
* **Detección de Errores Críticos**: Si se identifica que un cambio aprobado "rompió" la integridad integral (ej: un cálculo de precio que falló en un caso borde), se debe priorizar la restauración al estado histórico funcional antes de intentar una nueva mejora.

### 5. Definición de "Estado Validado"
Un módulo se considera "Validado" cuando cumple con:
1. **Frontend**: UI responsiva, tooltips informativos, manejo de errores visuales y tipos de datos (Signals/Interfaces) correctos.
2. **Backend**: CRUD completo, Soft Delete operativo, Auditoría (`usuario_auditoria`) y validación de DTOs.
3. **Integración**: Flujo de datos fluido entre capas sin errores 400/500 inesperados.

### 6. Hitos de Maduración (Maturity Gates)
El proyecto evoluciona a través de hitos de aprobación:
* **Hito 1 (Funcional)**: El código cumple la tarea mínima.
* **Hito 2 (Estandarizado)**: El código sigue todos los recursos de esta Skill.
* **Hito 3 (Protegido)**: El código tiene protecciones contra errores de usuario y nulos.
* **Hito 4 (Completo/Maduro)**: El módulo es inmutable ante cambios menores y sirve de plantilla para futuros desarrollos.

> [!IMPORTANT]
> **Consistencia ante todo:** No rompas el patrón por "rapidez". La deuda técnica en la UI o arquitectura es costosa. Propón la mejora antes de desviarte. Preserva siempre lo que ya funciona y respeta el historial del proyecto.

---

## 🔍 Protocolo Supremo de Resolución de Errores (Debugging & Fixes)

Ante cualquier fallo de código o compilación, el proceso de resolución **debe** seguir estos pasos obligatorios para garantizar la robustez del sistema:

### 1. Observación y Análisis de Causa Raíz (No parches)
* **Captura de Evidencia**: Leer logs de consola (Browser/Node), inspeccionar red (Network tab) y verificar estados (Signals/Zustand).
* **Contraste con Skill**: Antes de proponer un fix, **re-leer** las secciones de esta Skill relacionadas con el error (ej: si es de UI, leer `ui-components.md`; si es de datos, `data-patterns.md`).
* **Identificación**: ¿Es un error de sintaxis, de lógica de negocio o una inconsistencia de datos que viola la seguridad?

### 2. Implementación y Verificación de Regresión
* Aplicar el cambio manteniendo los comentarios y convenciones de nombres (Español/CamelCase).
* Verificar que el error desapareció y que los componentes relacionados siguen funcionando bajo los mismos estándares.

### 3. Documentación de Lecciones Aprendidas
* Si el error revela un "agujero" en los estándares actuales, actualizar la Skill correspondiente para evitar que el error se repita.

> [!IMPORTANT]
> **Consistencia ante todo:** Si un nuevo requerimiento entra en conflicto con estas guías, prioriza siempre el estándar establecido en el proyecto actual.

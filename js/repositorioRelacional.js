// ─── ESTADO GLOBAL Y CAPA DE COMPATIBILIDAD SIN MOCKS ─────
window.EstadoGlobal = {
  idProyectoActivo: localStorage.getItem('idProyectoActivo') || null,
  idLocalActivo: localStorage.getItem('idLocalActivo') || null,
  proyectos: [],
  locales: [],
  roles: [],
  empleados: [],
  gastos: [],
  productos: [],
  categoriasProductos: [],
  cuentas: [],
  movimientos: [],
  configuracion: {
    porcentajeMarcacionDefecto: 40,
    simboloMoneda: "$",
    diasLaborablesMes: 26
  }
};

window.BaseDatos = {
  obtenerEstado() {
    return window.EstadoGlobal;
  },
  guardar() {
    if (window.EstadoGlobal.idProyectoActivo) {
      localStorage.setItem('idProyectoActivo', window.EstadoGlobal.idProyectoActivo);
    }
    if (window.EstadoGlobal.idLocalActivo) {
      localStorage.setItem('idLocalActivo', window.EstadoGlobal.idLocalActivo);
    }
  },
  seleccionarProyecto(id) {
    window.EstadoGlobal.idProyectoActivo = id;
    localStorage.setItem('idProyectoActivo', id);
  },
  seleccionarLocal(id) {
    window.EstadoGlobal.idLocalActivo = id;
    localStorage.setItem('idLocalActivo', id);
  },
  obtenerProyectoActivo() {
    const estado = this.obtenerEstado();
    if (!estado.idProyectoActivo) return null;
    const proys = (window.ModuloProyectos && window.ModuloProyectos.proyectos && window.ModuloProyectos.proyectos.length > 0)
      ? window.ModuloProyectos.proyectos
      : (estado.proyectos || []);
    return proys.find(p => p.id === estado.idProyectoActivo) || proys[0] || null;
  },
  obtenerLocalActivo() {
    const estado = this.obtenerEstado();
    if (!estado.idLocalActivo) return null;
    const locs = (window.ModuloProyectos && window.ModuloProyectos.locales && window.ModuloProyectos.locales.length > 0)
      ? window.ModuloProyectos.locales
      : (estado.locales || []);
    return locs.find(l => l.id === estado.idLocalActivo) || locs[0] || null;
  },
  obtenerGastosFijosLocalActivo() {
    if (window.ModuloGastos && window.ModuloGastos.gastos) return window.ModuloGastos.gastos;
    return window.EstadoGlobal.gastos || [];
  },
  obtenerEmpleadosLocalActivo() {
    if (window.ModuloPersonal && window.ModuloPersonal.empleados) return window.ModuloPersonal.empleados;
    return window.EstadoGlobal.empleados || [];
  },
  obtenerProductosLocalActivo() {
    if (window.ModuloProductos && window.ModuloProductos.productos) return window.ModuloProductos.productos;
    return window.EstadoGlobal.productos || [];
  },
  obtenerProductosProyectoActivo() {
    return this.obtenerProductosLocalActivo();
  },
  obtenerProveedoresProyectoActivo() {
    if (window.ModuloProveedores && window.ModuloProveedores.proveedores) return window.ModuloProveedores.proveedores;
    return window.EstadoGlobal.proveedores || [];
  },
  obtenerMayoristasProyectoActivo() {
    if (window.ModuloMayoristas && window.ModuloMayoristas.mayoristas) return window.ModuloMayoristas.mayoristas;
    return window.EstadoGlobal.mayoristas || [];
  },
  obtenerCuentasProyectoActivo() {
    if (window.ModuloCuentas && window.ModuloCuentas.cuentas) return window.ModuloCuentas.cuentas;
    return window.EstadoGlobal.cuentas || [];
  },
  obtenerComprasLocalActivo() {
    if (window.ModuloProveedores && window.ModuloProveedores.compras) return window.ModuloProveedores.compras;
    return [];
  },
  obtenerCajaDiariaLocalActivo() {
    if (window.ModuloCaja && window.ModuloCaja.registrosCaja) return window.ModuloCaja.registrosCaja;
    return window.EstadoGlobal.cajaDiaria || [];
  },
  obtenerRegistrosRealesLocalActivo() {
    if (window.ModuloAnalisisReal && window.ModuloAnalisisReal.registrosReales) return window.ModuloAnalisisReal.registrosReales;
    return [];
  },
  obtenerMovimientosCuenta(idCuenta) {
    if (window.ModuloCuentas && window.ModuloCuentas.movimientos) {
      return window.ModuloCuentas.movimientos.filter(m => m.idCuenta === idCuenta);
    }
    return [];
  },
  obtenerMovimientosMayorista(idMayorista) {
    if (window.ModuloMayoristas && window.ModuloMayoristas.movimientos) {
      return window.ModuloMayoristas.movimientos.filter(m => m.idMayorista === idMayorista);
    }
    return [];
  },
  registrarMovimientoCuenta(mov) {
    if (window.ModuloCuentas && window.ModuloCuentas.registrarMovimiento) {
      window.ModuloCuentas.registrarMovimiento(mov);
    }
  },
  guardarCompraProveedor(compra) {
    if (window.ModuloProveedores && window.ModuloProveedores.guardarCompra) {
      window.ModuloProveedores.guardarCompra(compra);
    }
  },
  eliminarCompraProveedor(id) {
    if (window.ModuloProveedores && window.ModuloProveedores.eliminarCompra) {
      window.ModuloProveedores.eliminarCompra(id);
    }
  },
  guardarCajaDiaria(reg) {
    if (window.ModuloCaja && window.ModuloCaja.guardarCajaDiaria) {
      window.ModuloCaja.guardarCajaDiaria(reg);
    }
  },
  eliminarCajaDiaria(id) {
    if (window.ModuloCaja && window.ModuloCaja.eliminarCajaDiaria) {
      window.ModuloCaja.eliminarCajaDiaria(id);
    }
  },
  guardarProveedor(proveedor) {
    if (window.ModuloProveedores && window.ModuloProveedores.guardarProveedor) {
      window.ModuloProveedores.guardarProveedor(proveedor);
    }
  },
  eliminarProveedor(id) {
    if (window.ModuloProveedores && window.ModuloProveedores.eliminarProveedor) {
      window.ModuloProveedores.eliminarProveedor(id);
    }
  },
  guardarCuentaBancaria(cuenta) {
    if (window.ModuloCuentas && window.ModuloCuentas.guardarCuentaBancaria) {
      window.ModuloCuentas.guardarCuentaBancaria(cuenta);
    }
  },
  eliminarCuentaBancaria(id) {
    if (window.ModuloCuentas && window.ModuloCuentas.eliminarCuentaBancaria) {
      window.ModuloCuentas.eliminarCuentaBancaria(id);
    }
  },
  async guardarMayorista(mayorista) {
    const empresaId = window.EstadoGlobal.idProyectoActivo || 'e0000000-0000-4000-8000-000000000001';
    const payload = {
      empresa_id: empresaId,
      nombre: mayorista.nombre || '',
      direccion: mayorista.direccion || '',
      telefono: mayorista.whatsapp || '',
      porcentaje_descuento: parseFloat(mayorista.porcentajeMarcacion) || 15,
      saldo_deuda: parseFloat(mayorista.saldoDeuda) || 0
    };
    if (mayorista.id && window.RepositorioRelacional.esUUIDValido(mayorista.id)) {
      payload.id = mayorista.id;
    }
    try {
      const result = await window.RepositorioRelacional.guardarClienteMayorista(payload);
      console.log('[BaseDatos] Mayorista guardado en Supabase:', result);
      return result;
    } catch (e) {
      console.error('[BaseDatos] Error al guardar mayorista:', e);
      return null;
    }
  },
  async eliminarMayorista(id) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return false;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/clientes_mayoristas?id=eq.${id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify({ deleted_at: new Date().toISOString() })
      });
      console.log('[BaseDatos] Mayorista eliminado:', res.ok);
      return res.ok;
    } catch (e) {
      console.error('[BaseDatos] Error al eliminar mayorista:', e);
      return false;
    }
  },
  async guardarMovimientoMayorista(mov) {
    const payload = {
      cliente_id: mov.idMayorista,
      fecha: mov.fecha || new Date().toISOString().split('T')[0],
      tipo: mov.tipo || 'ENTREGA',
      monto: parseFloat(mov.monto) || 0,
      saldo_resultante: parseFloat(mov.saldoResultante) || 0,
      nota: mov.nota || ''
    };
    try {
      const result = await window.RepositorioRelacional.registrarMovimientoMayorista(payload);
      console.log('[BaseDatos] Movimiento mayorista guardado:', result);
      return result;
    } catch (e) {
      console.error('[BaseDatos] Error al guardar movimiento mayorista:', e);
      return null;
    }
  },
  async eliminarMovimientoMayorista(id) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return false;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/movimientos_mayoristas?id=eq.${id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: window.ClienteSupabase._headers()
      });
      console.log('[BaseDatos] Movimiento mayorista eliminado:', res.ok);
      return res.ok;
    } catch (e) {
      console.error('[BaseDatos] Error al eliminar movimiento mayorista:', e);
      return false;
    }
  },
  guardarRegistroReal(reg) {
    if (window.ModuloAnalisisReal && window.ModuloAnalisisReal.guardarRegistroReal) {
      window.ModuloAnalisisReal.guardarRegistroReal(reg);
    }
  },
  eliminarRegistroReal(id) {
    if (window.ModuloAnalisisReal && window.ModuloAnalisisReal.eliminarRegistroReal) {
      window.ModuloAnalisisReal.eliminarRegistroReal(id);
    }
  },
  restablecerDemo() {
    console.log('[BaseDatos] Restablecer demo deshabilitado (Persistencia en Supabase)');
  }
};

window.RepositorioRelacional = {
  
  esUUIDValido(str) {
    if (!str || typeof str !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  },

  // ─── EMPRESAS (PROYECTOS) ──────────────────────────────────
  async obtenerEmpresas() {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/empresas?select=*`;
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data.filter(d => !d.deleted_at) : [];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener empresas:', e);
      return [];
    }
  },

  async guardarEmpresa(empresa) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return null;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/empresas`;
      const res = await fetch(url, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify(empresa)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data[0];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al guardar empresa:', e);
      throw e;
    }
  },

  // ─── LOCALES / SUCURSALES ──────────────────────────────────
  async obtenerTodosLosLocales() {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/locales?select=*,horarios_locales(*)`;
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data.filter(d => !d.deleted_at) : [];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener todos los locales:', e);
      return [];
    }
  },

  async obtenerLocalesPorEmpresa(empresaId) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/locales?empresa_id=eq.${empresaId}&deleted_at=is.null&select=*,horarios_locales(*)`;
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener locales:', e);
      return [];
    }
  },

  async guardarLocal(local) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return null;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/locales`;
      const res = await fetch(url, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify(local)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data[0];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al guardar local:', e);
      throw e;
    }
  },

  async eliminarEmpresa(id) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return false;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/empresas?id=eq.${id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify({ deleted_at: new Date().toISOString() })
      });
      return res.ok;
    } catch (e) {
      console.error('[RepositorioRelacional] Error al eliminar empresa:', e);
      return false;
    }
  },

  async eliminarLocal(id) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return false;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/locales?id=eq.${id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify({ deleted_at: new Date().toISOString() })
      });
      return res.ok;
    } catch (e) {
      console.error('[RepositorioRelacional] Error al eliminar local:', e);
      return false;
    }
  },

  // ─── HORARIOS POR DÍA DE LOCALES ───────────────────────────
  async guardarHorariosLocal(localId, horarios) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return;
    try {
      // 1. Borrar horarios anteriores del local
      const deleteUrl = `${window.ClienteSupabase.url}/rest/v1/horarios_locales?local_id=eq.${localId}`;
      await fetch(deleteUrl, { method: 'DELETE', headers: window.ClienteSupabase._headers() });

      if (!horarios || horarios.length === 0) return;

      // 2. Insertar nuevos horarios
      const payload = horarios.map(h => ({
        local_id: localId,
        dia_semana: h.dia_semana,
        hora_apertura: h.hora_apertura,
        hora_cierre: h.hora_cierre
      }));

      const insertUrl = `${window.ClienteSupabase.url}/rest/v1/horarios_locales`;
      await fetch(insertUrl, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error('[RepositorioRelacional] Error al guardar horarios de local:', e);
    }
  },

  // ─── TESORERÍA & BILLETERAS DIGITALES ────────────────────────
  async obtenerTiposCuentas() {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/tipos_cuentas?select=*`;
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener tipos de cuentas:', e);
      return [];
    }
  },

  async obtenerCuentasEmpresa(empresaId) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/cuentas_bancarias?empresa_id=eq.${empresaId}&deleted_at=is.null&select=*,tipos_cuentas(*)`;
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener cuentas:', e);
      return [];
    }
  },

  async guardarCuentaBancaria(cuenta) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return null;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/cuentas_bancarias`;
      const res = await fetch(url, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify(cuenta)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data[0];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al guardar cuenta bancaria:', e);
      throw e;
    }
  },

  async registrarMovimientoCuenta(movimiento) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return null;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/movimientos_cuentas`;
      const res = await fetch(url, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'return=representation' }),
        body: JSON.stringify(movimiento)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data[0];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al registrar movimiento de cuenta:', e);
      throw e;
    }
  },

  // ─── CATEGORÍAS & PRODUCTOS ──────────────────────────────
  async obtenerCategoriasEmpresa(empresaId) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/categorias_productos?empresa_id=eq.${empresaId}&deleted_at=is.null&select=*`;
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener categorias:', e);
      return [];
    }
  },

  async guardarCategoriaProducto(categoria) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return null;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/categorias_productos`;
      const res = await fetch(url, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify(categoria)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data[0];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al guardar categoria:', e);
      throw e;
    }
  },

  async obtenerProductosEmpresa(empresaId) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/productos?empresa_id=eq.${empresaId}&deleted_at=is.null&select=*,categorias_productos(*)`;
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener productos:', e);
      return [];
    }
  },

  async guardarProducto(producto) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return null;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/productos`;
      const res = await fetch(url, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify(producto)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data[0];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al guardar producto:', e);
      throw e;
    }
  },

  async eliminarProducto(id) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return false;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/productos?id=eq.${id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify({ deleted_at: new Date().toISOString() })
      });
      return res.ok;
    } catch (e) {
      console.error('[RepositorioRelacional] Error al eliminar producto:', e);
      return false;
    }
  },

  // ─── MOVIMIENTOS DE CUENTAS ──────────────────────────────
  async obtenerMovimientosCuenta(cuentaId) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/movimientos_cuentas?cuenta_id=eq.${cuentaId}&select=*&order=fecha.desc`;
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener movimientos cuenta:', e);
      return [];
    }
  },

  async eliminarCuenta(id) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return false;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/cuentas_bancarias?id=eq.${id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify({ deleted_at: new Date().toISOString() })
      });
      return res.ok;
    } catch (e) {
      console.error('[RepositorioRelacional] Error al eliminar cuenta:', e);
      return false;
    }
  },

  // ─── ROLES DE TRABAJO (NIVEL EMPRESA) ────────────────────
  async obtenerRolesEmpresa(empresaId) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    if (!this.esUUIDValido(empresaId)) return [];
    try {
      let url = `${window.ClienteSupabase.url}/rest/v1/roles_empleados?empresa_id=eq.${empresaId}&deleted_at=is.null&select=*`;
      let res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) {
        // Fallback a tabla legacy 'roles' si 'roles_empleados' aún no existe
        url = `${window.ClienteSupabase.url}/rest/v1/roles?deleted_at=is.null&select=*`;
        res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      }
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn('[RepositorioRelacional] Error al obtener roles de empresa:', e);
      return [];
    }
  },

  async guardarRol(rol) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return null;
    try {
      const payload = {
        empresa_id: rol.empresa_id,
        nombre: rol.nombre,
        tarifa_hora: parseFloat(rol.tarifa_hora || rol.valor_hora || 0)
      };
      if (rol.id && !rol.id.toString().startsWith('rol_')) {
        payload.id = rol.id;
      }

      let url = `${window.ClienteSupabase.url}/rest/v1/roles_empleados`;
      const preferHeader = payload.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation';
      let res = await fetch(url, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': preferHeader }),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        console.error('[RepositorioRelacional] Error status al guardar en roles_empleados:', res.status, await res.text());
        return null;
      }
      const data = await res.json();
      return data[0];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al guardar rol:', e);
      return null;
    }
  },

  async eliminarRol(id) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return false;
    try {
      let url = `${window.ClienteSupabase.url}/rest/v1/roles_empleados?id=eq.${id}`;
      let res = await fetch(url, {
        method: 'PATCH',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify({ deleted_at: new Date().toISOString() })
      });
      if (!res.ok) {
        url = `${window.ClienteSupabase.url}/rest/v1/roles?id=eq.${id}`;
        res = await fetch(url, {
          method: 'PATCH',
          headers: window.ClienteSupabase._headers({ 'Prefer': 'return=minimal' }),
          body: JSON.stringify({ deleted_at: new Date().toISOString() })
        });
      }
      return res.ok;
    } catch (e) {
      console.warn('[RepositorioRelacional] Error al eliminar rol:', e);
      return false;
    }
  },

  // ─── EMPLEADOS ───────────────────────────────────────────
  async obtenerEmpleadosEmpresa(localId) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    if (!this.esUUIDValido(localId)) return [];
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/empleados?local_id=eq.${localId}&deleted_at=is.null&select=*,horarios_empleados(*)`;
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      const data = await res.json();
      return (data || []).map(emp => {
        if (emp.horarios_empleados && Array.isArray(emp.horarios_empleados)) {
          emp.turnos = emp.horarios_empleados.map(h => ({
            dia_semana: h.dia_semana,
            hora_entrada: h.hora_desde || h.hora_entrada || '08:00',
            hora_salida: h.hora_hasta || h.hora_salida || '16:00'
          }));
        }
        return emp;
      });
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener empleados:', e);
      return [];
    }
  },

  async guardarEmpleado(empleado) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return null;
    try {
      const payload = {
        local_id: empleado.local_id,
        nombre_completo: empleado.nombre_completo || empleado.nombre || 'Empleado',
        rol_puesto: empleado.rol_puesto || '',
        tarifa_hora: parseFloat(empleado.tarifa_hora) || 0
      };
      if (empleado.rol_id && this.esUUIDValido(empleado.rol_id)) {
        payload.rol_id = empleado.rol_id;
      }
      if (empleado.id && this.esUUIDValido(empleado.id)) {
        payload.id = empleado.id;
      }
      const url = `${window.ClienteSupabase.url}/rest/v1/empleados`;
      let res = await fetch(url, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errText = await res.text();
        // Fallback 1: Si no existe la columna rol_id en la tabla empleados de Supabase
        if (errText.includes('rol_id')) {
          delete payload.rol_id;
          res = await fetch(url, {
            method: 'POST',
            headers: window.ClienteSupabase._headers({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
            body: JSON.stringify(payload)
          });
          if (!res.ok) errText = await res.text();
        }
        // Fallback 2: Si no existe tipo_contrato
        if (!res.ok && errText.includes('tipo_contrato')) {
          delete payload.tipo_contrato;
          res = await fetch(url, {
            method: 'POST',
            headers: window.ClienteSupabase._headers({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
            body: JSON.stringify(payload)
          });
          if (!res.ok) errText = await res.text();
        }
        if (!res.ok) throw new Error(errText);
      }
      const data = await res.json();
      return data[0];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al guardar empleado:', e);
      throw e;
    }
  },

  async guardarHorariosEmpleado(empleadoId, horarios) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return;
    if (!this.esUUIDValido(empleadoId)) return;
    try {
      const deleteUrl = `${window.ClienteSupabase.url}/rest/v1/horarios_empleados?empleado_id=eq.${empleadoId}`;
      await fetch(deleteUrl, { method: 'DELETE', headers: window.ClienteSupabase._headers() });

      if (!horarios || horarios.length === 0) return;

      const payload = horarios.map(h => ({
        empleado_id: empleadoId,
        dia_semana: parseInt(h.dia_semana || h.diaSemana || 1),
        hora_desde: h.hora_desde || h.hora_entrada || h.desde || '08:00',
        hora_hasta: h.hora_hasta || h.hora_salida || h.hasta || '16:00'
      }));

      const insertUrl = `${window.ClienteSupabase.url}/rest/v1/horarios_empleados`;
      const res = await fetch(insertUrl, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        console.warn('[RepositorioRelacional] Error status al guardar horarios_empleados:', res.status, await res.text());
      }
    } catch (e) {
      console.error('[RepositorioRelacional] Error al guardar horarios empleado:', e);
    }
  },

  // ─── PROVEEDORES ─────────────────────────────────────────
  async obtenerProveedoresEmpresa(empresaId) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/proveedores?empresa_id=eq.${empresaId}&deleted_at=is.null&select=*`;
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener proveedores:', e);
      return [];
    }
  },

  async guardarProveedor(proveedor) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return null;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/proveedores`;
      const res = await fetch(url, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify(proveedor)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data[0];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al guardar proveedor:', e);
      throw e;
    }
  },

  async obtenerComprasProveedor(empresaId) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/compras_proveedores?select=*,proveedores(nombre),pagos_compras(*)&proveedores.empresa_id=eq.${empresaId}&order=fecha.desc`;
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener compras:', e);
      return [];
    }
  },

  async registrarCompra(compra) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return null;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/compras_proveedores`;
      const res = await fetch(url, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'return=representation' }),
        body: JSON.stringify(compra)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data[0];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al registrar compra:', e);
      throw e;
    }
  },

  async registrarPagoCompra(pago) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return null;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/pagos_compras`;
      const res = await fetch(url, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'return=representation' }),
        body: JSON.stringify(pago)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data[0];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al registrar pago compra:', e);
      throw e;
    }
  },

  // ─── GASTOS FIJOS ────────────────────────────────────────
  async obtenerCategoriasGastos() {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/categorias_gastos?select=*`;
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener categorias_gastos:', e);
      return [];
    }
  },

  async obtenerGastosFijos(empresaId) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/gastos_fijos?empresa_id=eq.${empresaId}&deleted_at=is.null&select=*`;
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener gastos fijos:', e);
      return [];
    }
  },

  async guardarGastoFijo(gasto) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return null;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/gastos_fijos`;
      const preferHeader = gasto.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation';
      const res = await fetch(url, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': preferHeader }),
        body: JSON.stringify(gasto)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data[0];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al guardar gasto fijo:', e);
      throw e;
    }
  },

  async eliminarGastoFijo(id) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return false;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/gastos_fijos?id=eq.${id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify({ deleted_at: new Date().toISOString() })
      });
      return res.ok;
    } catch (e) {
      console.error('[RepositorioRelacional] Error al eliminar gasto fijo:', e);
      return false;
    }
  },

  // ─── CLIENTES MAYORISTAS ─────────────────────────────────
  async obtenerClientesMayoristas(empresaId) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/clientes_mayoristas?empresa_id=eq.${empresaId}&deleted_at=is.null&select=*`;
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener mayoristas:', e);
      return [];
    }
  },

  async guardarClienteMayorista(mayorista) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return null;
    const url = `${window.ClienteSupabase.url}/rest/v1/clientes_mayoristas`;
    
    let payload = { ...mayorista };
    // Hacer que TODAS las columnas (excepto nombre e id) sean opcionales para el fallback
    const opcionales = Object.keys(payload).filter(k => k !== 'nombre' && k !== 'id');
    const preferHeader = payload.id ? 'resolution=merge-duplicates,return=representation' : 'return=representation';
    
    for (let i = 0; i <= opcionales.length; i++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': preferHeader }),
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        return data[0];
      }
      
      const errText = await res.text();
      let colRemovida = false;
      
      for (const col of opcionales) {
        // Si el error menciona la columna y la tenemos en el payload
        if (errText.includes(col) && col in payload) {
          console.warn(`[Supabase] Fallback: la columna '${col}' dio error en clientes_mayoristas. Reintentando sin ella.`);
          delete payload[col];
          colRemovida = true;
          break;
        }
      }
      
      if (!colRemovida) {
        console.error('[RepositorioRelacional] Error al guardar mayorista:', errText);
        alert(`Error al guardar mayorista en la base de datos:\n\n${errText}`);
        throw new Error(errText);
      }
    }
    return null;
  },

  async obtenerMovimientosMayorista(mayoristaId) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/movimientos_mayoristas?cliente_id=eq.${mayoristaId}&select=*&order=fecha.desc`;
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener movimientos mayorista:', e);
      return [];
    }
  },

  async registrarMovimientoMayorista(movimiento) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return null;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/movimientos_mayoristas`;
      const res = await fetch(url, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'return=representation' }),
        body: JSON.stringify(movimiento)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data[0];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al registrar movimiento mayorista:', e);
      throw e;
    }
  },

  // ─── CAJA DIARIA ─────────────────────────────────────────
  async obtenerCajaDiaria(localId, mesAno) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return [];
    try {
      let url = `${window.ClienteSupabase.url}/rest/v1/caja_diaria?local_id=eq.${localId}&select=*,caja_diaria_desglose_cuentas(*)&order=fecha.desc`;
      if (mesAno) {
        const inicio = `${mesAno}-01`;
        const [y, m] = mesAno.split('-').map(Number);
        const ultimoDia = new Date(y, m, 0).getDate();
        const fin = `${mesAno}-${String(ultimoDia).padStart(2, '0')}`;
        url += `&fecha=gte.${inicio}&fecha=lte.${fin}`;
      }
      const res = await fetch(url, { headers: window.ClienteSupabase._headers() });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (e) {
      console.error('[RepositorioRelacional] Error al obtener caja diaria:', e);
      return [];
    }
  },

  async registrarCajaDiaria(registro) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return null;
    try {
      const url = `${window.ClienteSupabase.url}/rest/v1/caja_diaria`;
      const res = await fetch(url, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'resolution=merge-duplicates,return=representation' }),
        body: JSON.stringify(registro)
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return data[0];
    } catch (e) {
      console.error('[RepositorioRelacional] Error al registrar caja diaria:', e);
      throw e;
    }
  },

  async guardarDesgloseCajaDiaria(cajaId, desgloses) {
    if (!window.ClienteSupabase || !window.ClienteSupabase.sincronizacionActiva) return;
    try {
      // Borrar desgloses previos
      const deleteUrl = `${window.ClienteSupabase.url}/rest/v1/caja_diaria_desglose_cuentas?caja_diaria_id=eq.${cajaId}`;
      await fetch(deleteUrl, { method: 'DELETE', headers: window.ClienteSupabase._headers() });

      if (!desgloses || desgloses.length === 0) return;

      const payload = desgloses.map(d => ({
        caja_diaria_id: cajaId,
        cuenta_bancaria_id: d.cuenta_bancaria_id,
        monto: d.monto,
        descripcion: d.descripcion || null
      }));

      const insertUrl = `${window.ClienteSupabase.url}/rest/v1/caja_diaria_desglose_cuentas`;
      await fetch(insertUrl, {
        method: 'POST',
        headers: window.ClienteSupabase._headers({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error('[RepositorioRelacional] Error al guardar desglose caja:', e);
    }
  }
};

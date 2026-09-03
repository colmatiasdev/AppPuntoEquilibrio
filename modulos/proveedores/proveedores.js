/**
 * proveedores.js - Controlador del módulo de Registro de Compras & Historial de Proveedores
 */

window.ModuloProveedores = {
  inicializar() {
    this.configurarFechaPorDefecto();
    this.configurarEventosMetodo();
    this.configurarFormulario();
    this.cargarDatos();
  },

  configurarFechaPorDefecto() {
    const inputFecha = document.getElementById('compra-fecha');
    if (inputFecha && !inputFecha.value) {
      inputFecha.value = new Date().toISOString().split('T')[0];
    }
  },

  configurarEventosMetodo() {
    const selectMetodo = document.getElementById('compra-metodo');
    const contenedorMixto = document.getElementById('contenedor-compra-mixto');
    const contenedorCuenta = document.getElementById('contenedor-compra-cuenta-select');

    if (selectMetodo) {
      selectMetodo.onchange = (e) => {
        const val = e.target.value;
        if (contenedorMixto) {
          contenedorMixto.style.display = val === 'MIXTO' ? 'grid' : 'none';
        }
        if (contenedorCuenta) {
          contenedorCuenta.style.display = (val === 'CUENTA' || val === 'MIXTO') ? 'block' : 'none';
        }
      };
    }
  },

  cargarDatos() {
    this.cargarSelectProveedores();
    this.cargarSelectCuentas();
    this.renderizarCompras();
  },

  async cargarSelectProveedores() {
    const select = document.getElementById('compra-proveedor');
    if (!select) return;
    select.innerHTML = '';

    let proveedores = [];
    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        const empresaId = 'e0000000-0000-4000-8000-000000000001';
        const provsRel = await window.RepositorioRelacional.obtenerProveedoresEmpresa(empresaId);
        if (provsRel && provsRel.length > 0) {
          proveedores = provsRel.map(p => ({
            id: p.id,
            nombre: p.nombre,
            cuit: p.cuit_cuil,
            idCategoria: null
          }));
        } else {
          proveedores = window.BaseDatos.obtenerProveedoresProyectoActivo();
        }
      } catch (err) {
        proveedores = window.BaseDatos.obtenerProveedoresProyectoActivo();
      }
    } else {
      proveedores = window.BaseDatos.obtenerProveedoresProyectoActivo();
    }

    const estado = window.BaseDatos.obtenerEstado();

    if (proveedores.length === 0) {
      select.innerHTML = '<option value="">No hay proveedores creados</option>';
      return;
    }

    proveedores.forEach(prov => {
      const cat = estado.categoriasProductos.find(c => c.id === prov.idCategoria);
      const catNombre = cat ? cat.nombre : 'General';
      const opt = document.createElement('option');
      opt.value = prov.id;
      opt.textContent = `${prov.nombre} (${catNombre})`;
      select.appendChild(opt);
    });
  },

  cargarSelectCuentas() {
    const select = document.getElementById('compra-cuenta-origen');
    if (!select) return;
    select.innerHTML = '';

    const cuentas = window.BaseDatos.obtenerCuentasProyectoActivo();
    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;

    if (cuentas.length === 0) {
      select.innerHTML = '<option value="">No hay cuentas creadas</option>';
      return;
    }

    cuentas.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.icono || '💳'} ${c.nombre} (Saldo: ${fMon(c.saldo || 0)})`;
      select.appendChild(opt);
    });
  },

  configurarFormulario() {
    const form = document.getElementById('form-compra-proveedor');
    if (!form) return;

    form.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('compra-id').value;
      const fecha = document.getElementById('compra-fecha').value;
      const idProveedor = document.getElementById('compra-proveedor').value;
      const montoTotal = parseFloat(document.getElementById('compra-monto').value) || 0;
      const metodoPago = document.getElementById('compra-metodo').value;
      const estadoPago = document.getElementById('compra-estado').value;
      const idCuentaOrigen = document.getElementById('compra-cuenta-origen').value;

      if (!idProveedor) {
        alert('Por favor selecciona un proveedor.');
        return;
      }

      const estadoBD = window.BaseDatos.obtenerEstado();
      const prov = estadoBD.proveedores.find(p => p.id === idProveedor);
      const idCategoria = prov ? prov.idCategoria : undefined;

      let pagadoCaja = 0;
      let pagadoCuenta = 0;

      if (metodoPago === 'CAJA') {
        pagadoCaja = montoTotal;
      } else if (metodoPago === 'CUENTA') {
        pagadoCuenta = montoTotal;
      } else if (metodoPago === 'MIXTO') {
        pagadoCaja = parseFloat(document.getElementById('compra-monto-caja').value) || 0;
        pagadoCuenta = parseFloat(document.getElementById('compra-monto-cuenta').value) || 0;
      }

      // Si se pagó por CUENTA o MIXTO y el estado es PAGADO, descontar del saldo de la cuenta de origen
      if ((metodoPago === 'CUENTA' || metodoPago === 'MIXTO') && estadoPago === 'PAGADO' && pagadoCuenta > 0 && idCuentaOrigen) {
        window.BaseDatos.registrarMovimientoCuenta({
          idCuenta: idCuentaOrigen,
          fecha,
          origenDestino: `Proveedor: ${prov ? prov.nombre : 'Compra'}`,
          tipo: 'EGRESO',
          monto: pagadoCuenta,
          nota: `Pago compra mercadería (${metodoPago})`
        });
      }

      window.BaseDatos.guardarCompraProveedor({
        id: id || undefined,
        fecha,
        idProveedor,
        idCategoria,
        montoTotal,
        pagadoCaja,
        pagadoCuenta,
        metodoPago,
        estadoPago,
        idCuentaOrigen: (metodoPago === 'CUENTA' || metodoPago === 'MIXTO') ? idCuentaOrigen : undefined
      });

      form.reset();
      document.getElementById('compra-id').value = '';
      document.getElementById('contenedor-compra-mixto').style.display = 'none';
      document.getElementById('contenedor-compra-cuenta-select').style.display = 'none';
      this.configurarFechaPorDefecto();
      this.cargarDatos();
      if (window.ModuloCaja) window.ModuloCaja.cargarDatos();
      if (window.ModuloCuentas) window.ModuloCuentas.cargarDatos();
      if (window.renderizarResumenKPIs) window.renderizarResumenKPIs();
    };
  },

  renderizarCompras() {
    const tbody = document.getElementById('tabla-compras-body');
    const contador = document.getElementById('contador-compras');
    if (!tbody) return;

    tbody.innerHTML = '';
    const compras = window.BaseDatos.obtenerComprasLocalActivo();
    const estadoBD = window.BaseDatos.obtenerEstado();
    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;

    if (contador) contador.textContent = `${compras.length} compra${compras.length === 1 ? '' : 's'}`;

    if (compras.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 1.5rem; color: var(--color-texto-secundario);">
            No hay compras a proveedores registradas en el local activo.
          </td>
        </tr>
      `;
      return;
    }

    const ordenadas = [...compras].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    const cuentas = window.BaseDatos.obtenerCuentasProyectoActivo();

    ordenadas.forEach(c => {
      const prov = estadoBD.proveedores.find(p => p.id === c.idProveedor);
      const nombreProv = prov ? prov.nombre : 'Proveedor Eliminado';
      const cat = estadoBD.categoriasProductos.find(cat => cat.id === (c.idCategoria || (prov ? prov.idCategoria : null)));
      const nombreCat = cat ? cat.nombre : 'General';

      let insigniaEstado = `<span style="background: var(--color-semaforo-verde-oscuro-suave); color: var(--color-semaforo-verde-oscuro); font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.75rem;">PAGADO</span>`;
      if (c.estadoPago === 'PEDIDO_PENDIENTE') {
        insigniaEstado = `<span style="background: var(--color-semaforo-amarillo-suave); color: #b45309; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.75rem;">PEDIDO PEND.</span>`;
      } else if (c.estadoPago === 'PAGO_PENDIENTE') {
        insigniaEstado = `<span style="background: var(--color-semaforo-rojo-suave); color: var(--color-semaforo-rojo); font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.75rem;">DEUDA PEND.</span>`;
      }

      let ctaNombre = '';
      if (c.idCuentaOrigen) {
        const ctaObj = cuentas.find(x => x.id === c.idCuentaOrigen);
        if (ctaObj) ctaNombre = ` (${ctaObj.nombre})`;
      }

      let insigniaOrigen = `<span style="color: var(--color-semaforo-verde-oscuro); font-weight: 600;">CAJA</span>`;
      if (c.metodoPago === 'CUENTA') insigniaOrigen = `<span style="color: var(--color-primario); font-weight: 600;">CUENTA${ctaNombre}</span>`;
      if (c.metodoPago === 'MIXTO') insigniaOrigen = `<span style="color: #8b5cf6; font-weight: 600;">MIXTO${ctaNombre}</span>`;

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--color-borde)';
      tr.innerHTML = `
        <td style="padding: 0.6rem; font-weight: 600;">${c.fecha}</td>
        <td style="padding: 0.6rem; font-weight: 700;">${nombreProv}</td>
        <td style="padding: 0.6rem; color: var(--color-texto-secundario);">${nombreCat}</td>
        <td style="padding: 0.6rem; font-weight: 800; color: var(--color-texto-principal);">${fMon(c.montoTotal)}</td>
        <td style="padding: 0.6rem;">${insigniaOrigen}</td>
        <td style="padding: 0.6rem;">${insigniaEstado}</td>
        <td style="padding: 0.6rem; text-align: center;">
          <button class="btn btn-secundario btn-eliminar-compra" data-id="${c.id}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; color: var(--color-semaforo-rojo);">🗑️</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-eliminar-compra').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('¿Eliminar esta compra de proveedor?')) {
          window.BaseDatos.eliminarCompraProveedor(id);
          this.cargarDatos();
          if (window.ModuloCaja) window.ModuloCaja.cargarDatos();
          if (window.ModuloCuentas) window.ModuloCuentas.cargarDatos();
          if (window.renderizarResumenKPIs) window.renderizarResumenKPIs();
        }
      };
    });
  }
};

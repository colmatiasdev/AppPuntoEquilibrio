/**
 * cuentas.js - Controlador del módulo de Cuentas Bancarias & Billeteras Digitales
 */

window.ModuloCuentas = {
  cuentaSeleccionadaId: null,

  inicializar() {
    this.configurarEventos();
    this.cargarDatos();
  },

  cargarDatos() {
    this.renderizarKPIsSaldos();
    this.renderizarTablaCuentas();
    if (this.cuentaSeleccionadaId) {
      this.renderizarHistorialCuenta(this.cuentaSeleccionadaId);
    }
  },

  configurarEventos() {
    const modal = document.getElementById('modal-cuenta');
    const btnNuevo = document.getElementById('btn-nueva-cuenta-modal');
    const btnCerrar = document.getElementById('btn-cerrar-modal-cuenta');
    const btnCancelar = document.getElementById('btn-cancelar-modal-cuenta');
    const form = document.getElementById('form-cuenta');

    if (btnNuevo && modal) {
      btnNuevo.onclick = () => {
        document.getElementById('cuenta-id').value = '';
        form.reset();
        document.getElementById('cuenta-icono').value = '📲';
        document.getElementById('cuenta-saldo-inicial').value = '0';
        document.getElementById('modal-cuenta-titulo').textContent = 'Nueva Cuenta / Billetera';
        modal.classList.add('activo');
      };
    }

    const cerrar = () => { if (modal) modal.classList.remove('activo'); };
    if (btnCerrar) btnCerrar.onclick = cerrar;
    if (btnCancelar) btnCancelar.onclick = cerrar;

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('cuenta-id').value;
        const nombre = document.getElementById('cuenta-nombre').value.trim();
        const tipo = document.getElementById('cuenta-tipo').value;
        const icono = document.getElementById('cuenta-icono').value.trim() || '📲';
        const saldoInicial = parseFloat(document.getElementById('cuenta-saldo-inicial').value) || 0;

        let saldoActual = saldoInicial;
        if (id) {
          const cta = window.BaseDatos.obtenerCuentasProyectoActivo().find(c => c.id === id);
          if (cta) saldoActual = cta.saldo || 0;
        }

        const nuevaCuenta = window.BaseDatos.guardarCuentaBancaria({
          id: id || undefined,
          nombre,
          tipo,
          icono,
          saldo: id ? saldoActual : saldoInicial
        });

        // Si es una cuenta nueva con saldo inicial > 0, registrar el movimiento inicial
        if (!id && saldoInicial > 0 && nuevaCuenta) {
          window.BaseDatos.registrarMovimientoCuenta({
            idCuenta: nuevaCuenta.id,
            fecha: new Date().toISOString().split('T')[0],
            origenDestino: 'Saldo Inicial de Cuenta',
            tipo: 'INGRESO',
            monto: saldoInicial,
            nota: 'Apertura de saldo inicial'
          });
        }

        cerrar();
        this.cargarDatos();
        if (window.ModuloProveedores) window.ModuloProveedores.cargarSelectCuentas();
      };
    }
  },

  renderizarKPIsSaldos() {
    const contenedor = document.getElementById('contenedor-kpis-cuentas');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    const cuentas = window.BaseDatos.obtenerCuentasProyectoActivo();
    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;

    let saldoTotalAcumulado = 0;

    cuentas.forEach(c => {
      saldoTotalAcumulado += (c.saldo || 0);
      const card = document.createElement('div');
      card.className = 'tarjeta-kpi';
      card.innerHTML = `
        <span class="kpi-titulo">${c.icono || '💳'} ${c.nombre}</span>
        <span class="kpi-valor" style="color: ${c.saldo >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)'};">
          ${fMon(c.saldo || 0)}
        </span>
        <span class="kpi-subtexto">${c.tipo}</span>
      `;
      contenedor.appendChild(card);
    });

    // KPI Total Consolidado
    const cardTotal = document.createElement('div');
    cardTotal.className = 'tarjeta-kpi';
    cardTotal.style.borderLeft = '4px solid var(--color-primario)';
    cardTotal.innerHTML = `
      <span class="kpi-titulo">💼 Total en Cuentas/Billeteras</span>
      <span class="kpi-valor" style="color: var(--color-primario);">${fMon(saldoTotalAcumulado)}</span>
      <span class="kpi-subtexto">Suma de saldos digitales</span>
    `;
    contenedor.insertBefore(cardTotal, contenedor.firstChild);
  },

  renderizarTablaCuentas() {
    const tbody = document.getElementById('tabla-cuentas-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const cuentas = window.BaseDatos.obtenerCuentasProyectoActivo();
    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;

    if (cuentas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; padding: 1rem; color: var(--color-texto-secundario);">
            No hay cuentas ni billeteras registradas.
          </td>
        </tr>
      `;
      return;
    }

    if (!this.cuentaSeleccionadaId && cuentas.length > 0) {
      this.cuentaSeleccionadaId = cuentas[0].id;
    }

    cuentas.forEach(c => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--color-borde)';
      if (c.id === this.cuentaSeleccionadaId) {
        tr.style.backgroundColor = 'rgba(59,130,246,0.08)';
      }

      tr.innerHTML = `
        <td style="padding: 0.6rem; font-weight: 700; cursor: pointer;" class="td-select-cta">
          ${c.icono || '💳'} ${c.nombre}
          <div style="font-size: 0.75rem; color: var(--color-texto-secundario); font-weight: 400;">${c.tipo}</div>
        </td>
        <td style="padding: 0.6rem; font-weight: 800; color: ${c.saldo >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)'};">
          ${fMon(c.saldo || 0)}
        </td>
        <td style="padding: 0.6rem; text-align: center;">
          <button type="button" class="btn btn-secundario btn-ver-cta" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;">👁️</button>
          <button type="button" class="btn btn-secundario btn-editar-cta" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;">✏️</button>
          <button type="button" class="btn btn-secundario btn-eliminar-cta" style="padding: 0.2rem 0.4rem; font-size: 0.75rem; color: var(--color-semaforo-rojo);">🗑️</button>
        </td>
      `;

      // Asignación directa de eventos por cada elemento creado
      const tdSelect = tr.querySelector('.td-select-cta');
      const btnVer = tr.querySelector('.btn-ver-cta');
      const btnEdit = tr.querySelector('.btn-editar-cta');
      const btnElim = tr.querySelector('.btn-eliminar-cta');

      const seleccionar = (e) => {
        if (e) e.stopPropagation();
        this.cuentaSeleccionadaId = c.id;
        this.renderizarTablaCuentas();
        this.renderizarHistorialCuenta(c.id);
      };

      if (tdSelect) tdSelect.onclick = seleccionar;
      if (btnVer) btnVer.onclick = seleccionar;

      if (btnEdit) {
        btnEdit.onclick = (e) => {
          e.stopPropagation();
          document.getElementById('cuenta-id').value = c.id;
          document.getElementById('cuenta-nombre').value = c.nombre;
          document.getElementById('cuenta-tipo').value = c.tipo;
          document.getElementById('cuenta-icono').value = c.icono || '📲';
          document.getElementById('cuenta-saldo-inicial').value = c.saldo || 0;
          document.getElementById('modal-cuenta-titulo').textContent = 'Editar Cuenta / Billetera';
          document.getElementById('modal-cuenta').classList.add('activo');
        };
      }

      if (btnElim) {
        btnElim.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (confirm(`¿Estás seguro de eliminar la cuenta "${c.nombre}" y todo su historial de movimientos?`)) {
            window.BaseDatos.eliminarCuentaBancaria(c.id);
            this.cuentaSeleccionadaId = null;
            this.cargarDatos();
            if (window.ModuloProveedores) window.ModuloProveedores.cargarSelectCuentas();
          }
        };
      }

      tbody.appendChild(tr);
    });
  },

  renderizarHistorialCuenta(idCuenta) {
    const tbody = document.getElementById('tabla-movimientos-cuenta-body');
    const titulo = document.getElementById('titulo-historial-cuenta');
    const badge = document.getElementById('badge-tipo-cuenta');
    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;

    if (!tbody) return;
    tbody.innerHTML = '';

    const cuentas = window.BaseDatos.obtenerCuentasProyectoActivo();
    const cta = cuentas.find(c => c.id === idCuenta);

    if (!cta) {
      if (titulo) titulo.textContent = 'Movimientos de Cuenta';
      if (badge) badge.textContent = '';
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1rem;">Seleccioná una cuenta.</td></tr>';
      return;
    }

    if (titulo) titulo.textContent = `${cta.icono || '💳'} Movimientos de ${cta.nombre}`;
    if (badge) badge.textContent = `Saldo: ${fMon(cta.saldo || 0)}`;

    const movsRegistrados = window.BaseDatos.obtenerMovimientosCuenta(idCuenta);

    // Obtener también compras a proveedores pagadas desde esta cuenta
    const compras = window.BaseDatos.obtenerComprasLocalActivo();
    const comprasCuenta = compras.filter(c => c.idCuentaOrigen === idCuenta && c.estadoPago === 'PAGADO');

    // Obtener recaudaciones diarias que afectaron a esta cuenta
    const cajaDiaria = window.BaseDatos.obtenerCajaDiariaLocalActivo();
    const ingresosCaja = [];

    cajaDiaria.forEach(reg => {
      // 1. Ingresos dinamicos por la nueva coleccion ingresosCuentas
      if (reg.ingresosCuentas && Array.isArray(reg.ingresosCuentas)) {
        reg.ingresosCuentas.forEach(ic => {
          if (ic.idCuenta === idCuenta) {
            ingresosCaja.push({
              id: `ing_cta_${reg.id}_${ic.idCuenta}`,
              fecha: reg.fecha,
              origenDestino: 'Recaudación Caja Diaria',
              tipo: 'INGRESO',
              monto: ic.monto,
              nota: 'Venta ingresada por transferencia'
            });
          }
        });
      } else {
        // Fallback para datos de caja antiguos
        const ing = reg.ingresosCanales || {};
        let montoIngresado = 0;
        if (idCuenta === 'cta_mp') montoIngresado = ing.can_mp || 0;
        else if (idCuenta === 'cta_nx') montoIngresado = ing.can_nx || 0;
        else if (idCuenta === 'cta_banco') montoIngresado = ing.can_transf || 0;
        else if (idCuenta === 'cta_peya') montoIngresado = ing.can_peya || 0;
        else if (idCuenta === 'cta_rappi') montoIngresado = ing.can_rappi || 0;

        if (montoIngresado > 0) {
          ingresosCaja.push({
            id: `ing_caja_${reg.id}_${idCuenta}`,
            fecha: reg.fecha,
            origenDestino: 'Recaudación Caja Diaria',
            tipo: 'INGRESO',
            monto: montoIngresado,
            nota: 'Ventas recaudadas en caja'
          });
        }
      }
    });

    const egresosCompras = comprasCuenta.map(c => {
      const prov = window.BaseDatos.obtenerEstado().proveedores.find(p => p.id === c.idProveedor);
      return {
        id: `egr_comp_${c.id}`,
        fecha: c.fecha,
        origenDestino: prov ? `Proveedor: ${prov.nombre}` : 'Pago a Proveedor',
        tipo: 'EGRESO',
        monto: c.metodoPago === 'MIXTO' ? (c.pagadoCuenta || 0) : c.montoTotal,
        nota: `Compra mercadería (${c.metodoPago})`
      };
    });

    // Consolidar todos los movimientos
    const todosMovs = [...movsRegistrados, ...ingresosCaja, ...egresosCompras]
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    if (todosMovs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 1.5rem; color: var(--color-texto-secundario);">
            No hay movimientos registrados para esta cuenta.
          </td>
        </tr>
      `;
      return;
    }

    todosMovs.forEach(m => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--color-borde)';

      const esIngreso = m.tipo === 'INGRESO';
      const badgeTipo = esIngreso
        ? `<span style="background: var(--color-semaforo-verde-oscuro-suave); color: var(--color-semaforo-verde-oscuro); padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">📥 INGRESO</span>`
        : `<span style="background: var(--color-semaforo-rojo-suave); color: var(--color-semaforo-rojo); padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">📤 EGRESO</span>`;

      tr.innerHTML = `
        <td style="padding: 0.5rem; font-weight: 600;">${m.fecha}</td>
        <td style="padding: 0.5rem; font-weight: 600;">${m.origenDestino || '-'}</td>
        <td style="padding: 0.5rem;">${badgeTipo}</td>
        <td style="padding: 0.5rem; font-weight: 800; color: ${esIngreso ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)'};">
          ${esIngreso ? '+' : '-'}${fMon(m.monto)}
        </td>
        <td style="padding: 0.5rem; color: var(--color-texto-secundario);">${m.nota || '-'}</td>
      `;

      tbody.appendChild(tr);
    });
  }
};

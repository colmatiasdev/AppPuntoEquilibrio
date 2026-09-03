/**
 * caja.js - Controlador del módulo de Recaudación Diaria & Control de Caja Chica
 */

window.ModuloCaja = {
  // Lista temporal de pagos de mayoristas y transferencias bancarias
  pagosMayoristasTmp: [],
  ingresosTransfTmp: [],

  inicializar() {
    this.configurarFechaPorDefecto();
    this.configurarFormulario();
    this.configurarMayoristas();
    this.configurarTransfCuentas();
    this.cargarDatos();
  },

  configurarFechaPorDefecto() {
    const inputFecha = document.getElementById('caja-fecha');
    const inputMesAno = document.getElementById('caja-filtro-mes-ano');
    const hoy = new Date().toISOString().split('T')[0];

    if (inputFecha && !inputFecha.value) inputFecha.value = hoy;
    if (inputMesAno && !inputMesAno.value) inputMesAno.value = hoy.substring(0, 7);

    if (inputMesAno) {
      inputMesAno.onchange = () => this.cargarDatos();
    }
  },

  // ── Transferencias por Cuentas/Billeteras ──
  configurarTransfCuentas() {
    this.cargarSelectCuentasCaja();

    const btnAgregar = document.getElementById('btn-agregar-transf-cuenta');
    if (btnAgregar) {
      btnAgregar.onclick = () => this.agregarIngresoTransf();
    }
  },

  cargarSelectCuentasCaja() {
    const select = document.getElementById('caja-transf-cuenta-select');
    if (!select) return;

    const valorActual = select.value;
    select.innerHTML = '<option value="">Seleccionar Billetera...</option>';

    const cuentas = window.BaseDatos.obtenerCuentasProyectoActivo();
    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;

    cuentas.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.icono || '💳'} ${c.nombre} (Saldo: ${fMon(c.saldo || 0)})`;
      select.appendChild(opt);
    });

    if (valorActual) select.value = valorActual;
  },

  agregarIngresoTransf() {
    const select = document.getElementById('caja-transf-cuenta-select');
    const inputMonto = document.getElementById('caja-transf-monto');
    if (!select || !inputMonto) return;

    const idCuenta = select.value;
    const monto = parseFloat(inputMonto.value) || 0;

    if (!idCuenta) {
      alert('Seleccioná una billetera/cuenta de destino.');
      return;
    }
    if (monto <= 0) {
      alert('Ingresá un monto mayor a cero.');
      return;
    }

    const cuentas = window.BaseDatos.obtenerCuentasProyectoActivo();
    const c = cuentas.find(x => x.id === idCuenta);
    if (!c) return;

    this.ingresosTransfTmp.push({
      idCuenta: c.id,
      nombreCuenta: c.nombre,
      iconoCuenta: c.icono || '💳',
      monto
    });

    inputMonto.value = '0';
    select.value = '';
    this.renderizarListaTransfTmp();
  },

  renderizarListaTransfTmp() {
    const ul = document.getElementById('caja-transf-lista-ingresos');
    if (!ul) return;
    ul.innerHTML = '';

    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;
    let totalTransf = 0;

    this.ingresosTransfTmp.forEach((t, idx) => {
      totalTransf += t.monto;
      const li = document.createElement('li');
      li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.3rem 0.5rem; margin-bottom: 0.25rem; background: rgba(59,130,246,0.08); border-radius: 4px;';
      li.innerHTML = `
        <span><strong>${t.iconoCuenta} ${t.nombreCuenta}</strong> — ${fMon(t.monto)}</span>
        <button type="button" class="btn-quitar-transf-cuenta" data-idx="${idx}" style="background: none; border: none; cursor: pointer; color: var(--color-semaforo-rojo); font-size: 1rem; padding: 0 0.3rem;">✕</button>
      `;
      ul.appendChild(li);
    });

    // Mapear compatibilidad de inputs ocultos
    const inTransf = document.getElementById('caja-in-transf');
    if (inTransf) inTransf.value = totalTransf;

    ul.querySelectorAll('.btn-quitar-transf-cuenta').forEach(btn => {
      btn.onclick = (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
        this.ingresosTransfTmp.splice(idx, 1);
        this.renderizarListaTransfTmp();
      };
    });
  },

  // ── Mayoristas: selector, agregar pago, renderizar lista ──
  configurarMayoristas() {
    this.cargarSelectMayoristas();

    const selectMay = document.getElementById('caja-may-select');
    const btnAgregar = document.getElementById('btn-agregar-pago-may');

    if (selectMay) {
      selectMay.onchange = () => this.mostrarInfoDeuda();
    }

    if (btnAgregar) {
      btnAgregar.onclick = () => this.agregarPagoMayorista();
    }
  },

  cargarSelectMayoristas() {
    const select = document.getElementById('caja-may-select');
    if (!select) return;

    const valorActual = select.value;
    select.innerHTML = '<option value="">Seleccionar...</option>';

    const mayoristas = window.BaseDatos.obtenerMayoristasProyectoActivo();
    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;

    mayoristas.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      const deudaLabel = m.saldoDeuda > 0 ? ` — Deuda: ${fMon(m.saldoDeuda)}` : '';
      opt.textContent = `${m.nombre}${deudaLabel}`;
      select.appendChild(opt);
    });

    if (valorActual) select.value = valorActual;
  },

  mostrarInfoDeuda() {
    const select = document.getElementById('caja-may-select');
    const info = document.getElementById('caja-may-deuda-info');
    if (!select || !info) return;

    const idMay = select.value;
    if (!idMay) {
      info.textContent = '';
      return;
    }

    const mayoristas = window.BaseDatos.obtenerMayoristasProyectoActivo();
    const m = mayoristas.find(x => x.id === idMay);
    if (!m) { info.textContent = ''; return; }

    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;
    if (m.saldoDeuda > 0) {
      info.innerHTML = `<span style="color: var(--color-semaforo-rojo); font-weight: 600;">Deuda actual: ${fMon(m.saldoDeuda)}</span>`;
    } else {
      info.innerHTML = `<span style="color: var(--color-semaforo-verde-oscuro); font-weight: 600;">Sin deuda pendiente ✔</span>`;
    }
  },

  agregarPagoMayorista() {
    const select = document.getElementById('caja-may-select');
    const inputMonto = document.getElementById('caja-may-monto');
    if (!select || !inputMonto) return;

    const idMayorista = select.value;
    const monto = parseFloat(inputMonto.value) || 0;

    if (!idMayorista) {
      alert('Seleccioná un mayorista del listado.');
      return;
    }
    if (monto <= 0) {
      alert('Ingresá un monto mayor a cero.');
      return;
    }

    const mayoristas = window.BaseDatos.obtenerMayoristasProyectoActivo();
    const m = mayoristas.find(x => x.id === idMayorista);
    if (!m) return;

    this.pagosMayoristasTmp.push({
      idMayorista: m.id,
      nombreMayorista: m.nombre,
      monto
    });

    inputMonto.value = '0';
    select.value = '';
    document.getElementById('caja-may-deuda-info').textContent = '';

    this.renderizarListaPagosTmp();
  },

  renderizarListaPagosTmp() {
    const ul = document.getElementById('caja-may-lista-pagos');
    const hiddenInput = document.getElementById('caja-in-may');
    if (!ul) return;
    ul.innerHTML = '';

    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;
    let totalMay = 0;

    this.pagosMayoristasTmp.forEach((p, idx) => {
      totalMay += p.monto;
      const li = document.createElement('li');
      li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.3rem 0.5rem; margin-bottom: 0.25rem; background: rgba(139,92,246,0.08); border-radius: 4px;';
      li.innerHTML = `
        <span><strong>${p.nombreMayorista}</strong> — ${fMon(p.monto)}</span>
        <button type="button" class="btn-quitar-pago-may" data-idx="${idx}" style="background: none; border: none; cursor: pointer; color: var(--color-semaforo-rojo); font-size: 1rem; padding: 0 0.3rem;">✕</button>
      `;
      ul.appendChild(li);
    });

    if (hiddenInput) hiddenInput.value = totalMay;

    ul.querySelectorAll('.btn-quitar-pago-may').forEach(btn => {
      btn.onclick = (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
        this.pagosMayoristasTmp.splice(idx, 1);
        this.renderizarListaPagosTmp();
      };
    });
  },

  // ── Formulario principal de caja diaria ──
  configurarFormulario() {
    const form = document.getElementById('form-caja-diaria');
    if (!form) return;

    form.onsubmit = (e) => {
      e.preventDefault();
      const fecha = document.getElementById('caja-fecha').value;
      const ef = parseFloat(document.getElementById('caja-in-efectivo').value) || 0;
      const may = parseFloat(document.getElementById('caja-in-may').value) || 0;
      const retiros = parseFloat(document.getElementById('caja-in-retiros').value) || 0;

      // Calcular suma total de transferencias
      const totalTransfIngresos = this.ingresosTransfTmp.reduce((sum, item) => sum + item.monto, 0);

      const registro = {
        fecha,
        ingresosCanales: {
          can_efectivo: ef,
          can_transf: totalTransfIngresos,
          can_nx: 0,
          can_mp: 0,
          can_peya: 0,
          can_rappi: 0,
          can_may: may
        },
        retirosSocios: retiros,
        pagosMayoristas: [...this.pagosMayoristasTmp],
        ingresosCuentas: [...this.ingresosTransfTmp]
      };

      // Impactar deudas de mayoristas
      if (this.pagosMayoristasTmp.length > 0) {
        const estado = window.BaseDatos.obtenerEstado();
        this.pagosMayoristasTmp.forEach(pago => {
          const m = estado.mayoristas.find(x => x.id === pago.idMayorista);
          if (m) {
            m.saldoDeuda = Math.max(0, (m.saldoDeuda || 0) - pago.monto);
          }
        });
      }

      // Impactar saldos de las cuentas/billeteras correspondientes
      if (this.ingresosTransfTmp.length > 0) {
        this.ingresosTransfTmp.forEach(item => {
          window.BaseDatos.registrarMovimientoCuenta({
            idCuenta: item.idCuenta,
            fecha,
            origenDestino: 'Recaudación Caja Diaria',
            tipo: 'INGRESO',
            monto: item.monto,
            nota: 'Venta ingresada por transferencia'
          });
        });
      }

      window.BaseDatos.guardarCajaDiaria(registro);

      // Limpiar estados temporales y formulario
      this.pagosMayoristasTmp = [];
      this.ingresosTransfTmp = [];
      form.reset();
      this.renderizarListaPagosTmp();
      this.renderizarListaTransfTmp();
      this.configurarFechaPorDefecto();
      this.cargarSelectMayoristas();
      this.cargarSelectCuentasCaja();
      this.cargarDatos();
      if (window.ModuloMayoristas) window.ModuloMayoristas.cargarDatos();
      if (window.ModuloCuentas) window.ModuloCuentas.cargarDatos();
      if (window.ModuloAnalisisReal) window.ModuloAnalisisReal.cargarDatos();
      if (window.renderizarResumenKPIs) window.renderizarResumenKPIs();
    };
  },

  async cargarDatos() {
    let registrosCaja = [];
    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        const localId = '10000000-0000-4000-8000-000000000001';
        const inputMesAno = document.getElementById('caja-filtro-mes-ano');
        const mesAno = inputMesAno ? inputMesAno.value : null;
        const cajaRel = await window.RepositorioRelacional.obtenerCajaDiaria(localId, mesAno);

        if (cajaRel && cajaRel.length > 0) {
          registrosCaja = cajaRel.map(c => ({
            id: c.id,
            fecha: c.fecha,
            ingresosCanales: {
              can_efectivo: parseFloat(c.total_recaudado) || 0,
              can_transf: 0,
              can_nx: 0,
              can_mp: 0,
              can_peya: 0,
              can_rappi: 0,
              can_may: 0
            },
            retirosSocios: parseFloat(c.gastos_caja_chica) || 0,
            pagosMayoristas: [],
            ingresosCuentas: (c.caja_diaria_desglose_cuentas || []).map(d => ({
              idCuenta: d.cuenta_bancaria_id,
              monto: parseFloat(d.monto) || 0
            }))
          }));
        } else {
          registrosCaja = window.BaseDatos.obtenerCajaDiariaLocalActivo();
        }
      } catch (err) {
        registrosCaja = window.BaseDatos.obtenerCajaDiariaLocalActivo();
      }
    } else {
      registrosCaja = window.BaseDatos.obtenerCajaDiariaLocalActivo();
    }

    const compras = window.BaseDatos.obtenerComprasLocalActivo();
    this.cargarSelectMayoristas();
    this.cargarSelectCuentasCaja();
    this.renderizarTablaYSaldos(registrosCaja, compras);
  },

  renderizarTablaYSaldos(registrosCaja, compras) {
    const tbody = document.getElementById('tabla-caja-diaria-body');
    const inputMesAno = document.getElementById('caja-filtro-mes-ano');
    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;

    if (!tbody) return;
    tbody.innerHTML = '';

    const mesAnoFiltro = inputMesAno ? inputMesAno.value : new Date().toISOString().substring(0, 7);
    const filtrados = registrosCaja.filter(c => c.fecha.startsWith(mesAnoFiltro));
    const ordenados = [...filtrados].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    let sumTotalRecaudadoDia = 0;
    let sumEfectivoFisico = 0;
    let sumComprasCaja = 0;

    ordenados.forEach(reg => {
      const ing = reg.ingresosCanales || {};
      const ef = ing.can_efectivo || 0;
      const transfApps = (ing.can_transf || 0) + (ing.can_nx || 0) + (ing.can_mp || 0) + (ing.can_peya || 0) + (ing.can_rappi || 0);
      const mayoristas = ing.can_may || 0;
      const retiros = reg.retirosSocios || 0;

      // Tooltip mayoristas
      const pagosDia = reg.pagosMayoristas || [];
      let tooltipMay = '';
      if (pagosDia.length > 0) {
        tooltipMay = pagosDia.map(p => `${p.nombreMayorista}: ${fMon(p.monto)}`).join(' · ');
      }

      // Tooltip transferencias cuentas
      const transfCuentasDia = reg.ingresosCuentas || [];
      let tooltipTransf = '';
      if (transfCuentasDia.length > 0) {
        tooltipTransf = transfCuentasDia.map(t => `${t.nombreCuenta}: ${fMon(t.monto)}`).join(' · ');
      }

      // Compras pagadas por caja
      const comprasCajaDia = compras
        .filter(c => c.fecha === reg.fecha && (c.metodoPago === 'CAJA' || c.metodoPago === 'MIXTO') && c.estadoPago === 'PAGADO')
        .reduce((sum, c) => sum + (c.metodoPago === 'MIXTO' ? (c.pagadoCaja || 0) : c.montoTotal), 0);

      const totalDia = ef + transfApps + mayoristas;
      const cajaFinalEfectivo = ef - comprasCajaDia - retiros;

      sumTotalRecaudadoDia += totalDia;
      sumEfectivoFisico += cajaFinalEfectivo;
      sumComprasCaja += comprasCajaDia;

      const trEl = document.createElement('tr');
      trEl.style.borderBottom = '1px solid var(--color-borde)';

      const mayCell = mayoristas > 0
        ? `<span title="${tooltipMay}" style="cursor: help; border-bottom: 1px dotted #8b5cf6;">${fMon(mayoristas)}</span>`
        : fMon(0);

      const transfCell = transfApps > 0
        ? `<span title="${tooltipTransf}" style="cursor: help; border-bottom: 1px dotted var(--color-primario);">${fMon(transfApps)}</span>`
        : fMon(0);

      trEl.innerHTML = `
        <td style="padding: 0.6rem; font-weight: 700;">${reg.fecha}</td>
        <td style="padding: 0.6rem; font-weight: 700; color: var(--color-semaforo-verde-oscuro);">${fMon(ef)}</td>
        <td style="padding: 0.6rem; color: var(--color-primario);">${transfCell}</td>
        <td style="padding: 0.6rem; color: #8b5cf6;">${mayCell}</td>
        <td style="padding: 0.6rem; color: var(--color-semaforo-rojo);">${fMon(comprasCajaDia)}</td>
        <td style="padding: 0.6rem; color: var(--color-semaforo-rojo);">${fMon(retiros)}</td>
        <td style="padding: 0.6rem; font-weight: 800; color: var(--color-texto-principal);">${fMon(totalDia)}</td>
        <td style="padding: 0.6rem; font-weight: 800; color: ${cajaFinalEfectivo >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)'};">
          ${fMon(cajaFinalEfectivo)}
        </td>
        <td style="padding: 0.6rem; text-align: center;">
          <button class="btn btn-secundario btn-editar-caja" data-fecha="${reg.fecha}" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;">✏️</button>
          <button class="btn btn-secundario btn-eliminar-caja" data-id="${reg.id}" style="padding: 0.2rem 0.4rem; font-size: 0.75rem; color: var(--color-semaforo-rojo);">🗑️</button>
        </td>
      `;

      tbody.appendChild(trEl);
    });

    // KPIs de Caja
    document.getElementById('caja-total-recaudado-dia').textContent = fMon(sumTotalRecaudadoDia);
    document.getElementById('caja-efectivo-fisico').textContent = fMon(sumEfectivoFisico);
    document.getElementById('caja-efectivo-fisico').style.color = sumEfectivoFisico >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)';
    document.getElementById('caja-compras-pagadas-caja').textContent = fMon(sumComprasCaja);
    document.getElementById('caja-saldo-acumulado-global').textContent = fMon(sumTotalRecaudadoDia - sumComprasCaja);

    // Eventos Editar / Eliminar
    tbody.querySelectorAll('.btn-editar-caja').forEach(btn => {
      btn.onclick = (e) => {
        const fecha = e.currentTarget.getAttribute('data-fecha');
        const reg = registrosCaja.find(r => r.fecha === fecha);
        if (reg) {
          const ing = reg.ingresosCanales || {};
          document.getElementById('caja-fecha').value = reg.fecha;
          document.getElementById('caja-in-efectivo').value = ing.can_efectivo || 0;
          document.getElementById('caja-in-retiros').value = reg.retirosSocios || 0;

          // Restaurar temporales
          this.pagosMayoristasTmp = (reg.pagosMayoristas || []).map(p => ({ ...p }));
          this.renderizarListaPagosTmp();

          this.ingresosTransfTmp = (reg.ingresosCuentas || []).map(t => ({ ...t }));
          this.renderizarListaTransfTmp();
        }
      };
    });

    tbody.querySelectorAll('.btn-eliminar-caja').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('¿Eliminar este registro diario de caja?')) {
          window.BaseDatos.eliminarCajaDiaria(id);
          this.cargarDatos();
          if (window.renderizarResumenKPIs) window.renderizarResumenKPIs();
        }
      };
    });
  }
};

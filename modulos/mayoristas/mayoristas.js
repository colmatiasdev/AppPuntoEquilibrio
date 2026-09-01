/**
 * mayoristas.js - Controlador del módulo de Clientes Mayoristas & Cuenta Corriente
 */

window.ModuloMayoristas = {
  inicializar() {
    this.configurarModales();
    this.configurarFormularioABM();
    this.configurarFormularioEntrega();
    this.cargarDatos();
  },

  cargarDatos() {
    this.renderizarMayoristas();
  },

  configurarModales() {
    const modalABM = document.getElementById('modal-mayorista');
    const btnNuevo = document.getElementById('btn-nuevo-mayorista');
    const btnCerrarABM = document.getElementById('btn-cerrar-modal-may');
    const btnCancelarABM = document.getElementById('btn-cancelar-modal-may');

    const modalDetalle = document.getElementById('modal-detalle-may');
    const btnCerrarDetalle = document.getElementById('btn-cerrar-detalle-may');

    if (btnNuevo && modalABM) {
      btnNuevo.onclick = () => {
        document.getElementById('mayorista-id').value = '';
        document.getElementById('form-mayorista').reset();
        document.getElementById('mayorista-marcacion').value = '15';
        document.getElementById('modal-mayorista-titulo').textContent = 'Nuevo Mayorista';
        modalABM.classList.add('activo');
      };
    }

    const cerrarABM = () => { if (modalABM) modalABM.classList.remove('activo'); };
    if (btnCerrarABM) btnCerrarABM.onclick = cerrarABM;
    if (btnCancelarABM) btnCancelarABM.onclick = cerrarABM;

    const cerrarDetalle = () => { if (modalDetalle) modalDetalle.classList.remove('activo'); };
    if (btnCerrarDetalle) btnCerrarDetalle.onclick = cerrarDetalle;
  },

  configurarFormularioABM() {
    const form = document.getElementById('form-mayorista');
    if (!form) return;

    form.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('mayorista-id').value;
      const nombre = document.getElementById('mayorista-nombre').value.trim();
      const direccion = document.getElementById('mayorista-direccion').value.trim();
      let whatsapp = document.getElementById('mayorista-whatsapp').value.trim();
      const marcacion = parseFloat(document.getElementById('mayorista-marcacion').value) || 15;

      whatsapp = whatsapp.replace(/[^0-9]/g, '');

      // Conservar saldo de deuda existente si es edición
      let saldoExistente = 0;
      if (id) {
        const m = window.BaseDatos.obtenerMayoristasProyectoActivo().find(x => x.id === id);
        if (m) saldoExistente = m.saldoDeuda || 0;
      }

      window.BaseDatos.guardarMayorista({
        id: id || undefined,
        nombre,
        direccion,
        whatsapp,
        porcentajeMarcacion: marcacion,
        saldoDeuda: saldoExistente
      });

      form.reset();
      document.getElementById('modal-mayorista').classList.remove('activo');
      this.cargarDatos();
      if (window.ModuloCaja) window.ModuloCaja.cargarSelectMayoristas();
    };
  },

  configurarFormularioEntrega() {
    const inputFecha = document.getElementById('entrega-may-fecha');
    if (inputFecha) {
      inputFecha.value = new Date().toISOString().split('T')[0];
    }

    const btnRegistrar = document.getElementById('btn-registrar-entrega-may');
    if (!btnRegistrar) return;

    btnRegistrar.onclick = () => {
      const idMayorista = document.getElementById('detalle-may-id').value;
      const fecha = document.getElementById('entrega-may-fecha').value;
      const monto = parseFloat(document.getElementById('entrega-may-monto').value) || 0;
      const nota = document.getElementById('entrega-may-nota').value.trim();

      if (!idMayorista) return;
      if (monto <= 0) {
        alert('Por favor ingresá un monto mayor a 0 para el ticket de entrega.');
        return;
      }

      const estadoBD = window.BaseDatos.obtenerEstado();
      const mayorista = estadoBD.mayoristas.find(m => m.id === idMayorista);
      if (!mayorista) return;

      // Incrementar la deuda del mayorista
      mayorista.saldoDeuda = (mayorista.saldoDeuda || 0) + monto;

      // Registrar movimiento de tipo ENTREGA
      window.BaseDatos.guardarMovimientoMayorista({
        idMayorista,
        fecha,
        tipo: 'ENTREGA',
        monto,
        nota: nota || 'Entrega de mercadería'
      });

      // Resetear campos de entrega
      document.getElementById('entrega-may-monto').value = '0';
      document.getElementById('entrega-may-nota').value = '';

      // Actualizar vista e historial
      this.abrirDetalle(idMayorista);
      this.cargarDatos();
      if (window.ModuloCaja) window.ModuloCaja.cargarSelectMayoristas();
    };
  },

  renderizarMayoristas() {
    const tbody = document.getElementById('tabla-mayoristas-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const mayoristas = window.BaseDatos.obtenerMayoristasProyectoActivo();
    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;

    if (mayoristas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 1.5rem; color: var(--color-texto-secundario);">
            No hay clientes mayoristas registrados. Hace clic en "+ Nuevo Mayorista" para agregar uno.
          </td>
        </tr>
      `;
      return;
    }

    mayoristas.forEach(may => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--color-borde)';

      const linkWa = may.whatsapp
        ? `<a href="https://wa.me/${may.whatsapp}" target="_blank" style="color: #25d366; font-weight: 700; text-decoration: none;">💬 ${may.whatsapp}</a>`
        : '<span style="color: var(--color-texto-secundario);">Sin WhatsApp</span>';

      tr.innerHTML = `
        <td style="padding: 0.6rem;">
          <div style="font-weight: 700;">${may.nombre}</div>
          <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">${may.direccion || 'Sin dirección'}</span>
        </td>
        <td style="padding: 0.6rem;">${linkWa}</td>
        <td style="padding: 0.6rem;"><span style="color: var(--color-semaforo-verde-oscuro); font-weight: 700;">+${may.porcentajeMarcacion}%</span></td>
        <td style="padding: 0.6rem; font-weight: 800; color: ${may.saldoDeuda > 0 ? 'var(--color-semaforo-rojo)' : 'var(--color-semaforo-verde-oscuro)'};">
          ${fMon(may.saldoDeuda)}
        </td>
        <td style="padding: 0.6rem; text-align: center;">
          <button class="btn btn-primario btn-ver-detalle-may" data-id="${may.id}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; margin-right: 0.2rem;">👁️ Ver Historial</button>
          <button class="btn btn-secundario btn-editar-may" data-id="${may.id}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">✏️ Edit</button>
          <button class="btn btn-secundario btn-eliminar-may" data-id="${may.id}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; color: var(--color-semaforo-rojo);">🗑️</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Eventos de botones de la tabla
    tbody.querySelectorAll('.btn-ver-detalle-may').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.abrirDetalle(id);
      };
    });

    tbody.querySelectorAll('.btn-editar-may').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const m = mayoristas.find(may => may.id === id);
        if (m) {
          document.getElementById('mayorista-id').value = m.id;
          document.getElementById('mayorista-nombre').value = m.nombre;
          document.getElementById('mayorista-direccion').value = m.direccion || '';
          document.getElementById('mayorista-whatsapp').value = m.whatsapp || '';
          document.getElementById('mayorista-marcacion').value = m.porcentajeMarcacion;
          document.getElementById('modal-mayorista-titulo').textContent = 'Editar Mayorista';
          document.getElementById('modal-mayorista').classList.add('activo');
        }
      };
    });

    tbody.querySelectorAll('.btn-eliminar-may').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('¿Eliminar cliente mayorista y todo su historial?')) {
          window.BaseDatos.eliminarMayorista(id);
          this.cargarDatos();
          if (window.ModuloCaja) window.ModuloCaja.cargarSelectMayoristas();
        }
      };
    });
  },

  abrirDetalle(idMayorista) {
    const mayoristas = window.BaseDatos.obtenerMayoristasProyectoActivo();
    const m = mayoristas.find(x => x.id === idMayorista);
    if (!m) return;

    document.getElementById('detalle-may-id').value = m.id;
    document.getElementById('detalle-may-titulo').textContent = `Historial & Entregas — ${m.nombre}`;

    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;

    // Renderizar KPIs del cliente en el modal
    const containerKpis = document.getElementById('detalle-may-kpis');
    if (containerKpis) {
      containerKpis.innerHTML = `
        <div style="background: var(--color-fondo-pagina); border: 1px solid var(--color-borde); border-radius: 6px; padding: 0.5rem 0.75rem;">
          <span style="display: block; font-size: 0.7rem; color: var(--color-texto-secundario);">Saldo Deuda Actual</span>
          <span style="font-size: 1.1rem; font-weight: 800; color: ${m.saldoDeuda > 0 ? 'var(--color-semaforo-rojo)' : 'var(--color-semaforo-verde-oscuro)'};">${fMon(m.saldoDeuda)}</span>
        </div>
        <div style="background: var(--color-fondo-pagina); border: 1px solid var(--color-borde); border-radius: 6px; padding: 0.5rem 0.75rem;">
          <span style="display: block; font-size: 0.7rem; color: var(--color-texto-secundario);">% Marcación</span>
          <span style="font-size: 1.1rem; font-weight: 800; color: var(--color-semaforo-verde-oscuro);">+${m.porcentajeMarcacion}%</span>
        </div>
        <div style="background: var(--color-fondo-pagina); border: 1px solid var(--color-borde); border-radius: 6px; padding: 0.5rem 0.75rem;">
          <span style="display: block; font-size: 0.7rem; color: var(--color-texto-secundario);">WhatsApp</span>
          <span style="font-size: 0.85rem; font-weight: 700;">${m.whatsapp ? `<a href="https://wa.me/${m.whatsapp}" target="_blank" style="color:#25d366; text-decoration:none;">💬 ${m.whatsapp}</a>` : 'Sin datos'}</span>
        </div>
      `;
    }

    // Cargar historial de movimientos
    this.renderizarHistorialMovimientos(idMayorista);

    // Abrir modal
    document.getElementById('modal-detalle-may').classList.add('activo');
  },

  renderizarHistorialMovimientos(idMayorista) {
    const tbody = document.getElementById('tabla-historial-may-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;

    // Obtener movimientos de entregas registradas en este módulo
    const movsEntregas = window.BaseDatos.obtenerMovimientosMayorista(idMayorista);

    // Obtener pagos registrados desde la Caja Diaria para este mayorista
    const registrosCaja = window.BaseDatos.obtenerCajaDiariaLocalActivo();
    const movsPagos = [];

    registrosCaja.forEach(reg => {
      if (reg.pagosMayoristas && Array.isArray(reg.pagosMayoristas)) {
        reg.pagosMayoristas.forEach(p => {
          if (p.idMayorista === idMayorista) {
            movsPagos.push({
              id: `pago_caja_${reg.id}_${p.idMayorista}`,
              idMayorista: p.idMayorista,
              fecha: reg.fecha,
              tipo: 'PAGO',
              monto: p.monto,
              nota: `Cobro en Caja Diaria (${reg.fecha})`,
              esPagoCaja: true
            });
          }
        });
      }
    });

    // Combinar y ordenar por fecha descendente
    const todosMovs = [...movsEntregas, ...movsPagos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    if (todosMovs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 1rem; color: var(--color-texto-secundario);">
            No hay movimientos registrados para este cliente mayorista.
          </td>
        </tr>
      `;
      return;
    }

    todosMovs.forEach(mov => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--color-borde)';

      const esEntrega = mov.tipo === 'ENTREGA';
      const badgeTipo = esEntrega
        ? `<span style="background: var(--color-semaforo-rojo-suave); color: var(--color-semaforo-rojo); padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">📦 ENTREGA (+Deuda)</span>`
        : `<span style="background: var(--color-semaforo-verde-oscuro-suave); color: var(--color-semaforo-verde-oscuro); padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">💵 PAGO (-Deuda)</span>`;

      const btnEliminar = mov.esPagoCaja
        ? `<span style="font-size: 0.7rem; color: var(--color-texto-secundario);" title="Eliminar desde Caja Diaria">Caja</span>`
        : `<button class="btn btn-secundario btn-eliminar-mov-may" data-id="${mov.id}" data-monto="${mov.monto}" data-tipo="${mov.tipo}" style="padding: 0.15rem 0.35rem; font-size: 0.7rem; color: var(--color-semaforo-rojo);">🗑️</button>`;

      tr.innerHTML = `
        <td style="padding: 0.5rem; font-weight: 600;">${mov.fecha}</td>
        <td style="padding: 0.5rem;">${badgeTipo}</td>
        <td style="padding: 0.5rem; font-weight: 700; color: ${esEntrega ? 'var(--color-semaforo-rojo)' : 'var(--color-semaforo-verde-oscuro)'};">
          ${esEntrega ? '+' : '-'}${fMon(mov.monto)}
        </td>
        <td style="padding: 0.5rem; color: var(--color-texto-secundario);">${mov.nota || '-'}</td>
        <td style="padding: 0.5rem; text-align: center;">${btnEliminar}</td>
      `;

      tbody.appendChild(tr);
    });

    // Eventos eliminar movimientos de entrega
    tbody.querySelectorAll('.btn-eliminar-mov-may').forEach(btn => {
      btn.onclick = (e) => {
        const idMov = e.currentTarget.getAttribute('data-id');
        const monto = parseFloat(e.currentTarget.getAttribute('data-monto')) || 0;
        const tipo = e.currentTarget.getAttribute('data-tipo');

        if (confirm('¿Eliminar este registro de entrega?')) {
          // Revertir efecto en la deuda
          const estadoBD = window.BaseDatos.obtenerEstado();
          const mayorista = estadoBD.mayoristas.find(m => m.id === idMayorista);
          if (mayorista) {
            if (tipo === 'ENTREGA') {
              mayorista.saldoDeuda = Math.max(0, (mayorista.saldoDeuda || 0) - monto);
            }
          }
          window.BaseDatos.eliminarMovimientoMayorista(idMov);
          this.abrirDetalle(idMayorista);
          this.cargarDatos();
          if (window.ModuloCaja) window.ModuloCaja.cargarSelectMayoristas();
        }
      };
    });
  }
};

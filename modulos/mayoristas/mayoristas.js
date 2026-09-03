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

  async cargarDatos() {
    if (window.mostrarSpinner) window.mostrarSpinner('Cargando mayoristas...');
    
    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        const empresaId = window.EstadoGlobal.idProyectoActivo || 'e0000000-0000-4000-8000-000000000001';
        const maysRel = await window.RepositorioRelacional.obtenerClientesMayoristas(empresaId);
        if (maysRel && maysRel.length > 0) {
          this._mayoristasRelacionales = maysRel.map(m => ({
            id: m.id,
            nombre: m.nombre,
            direccion: m.direccion || '',
            whatsapp: m.telefono || '',
            porcentajeMarcacion: parseFloat(m.porcentaje_descuento) || 15,
            saldoDeuda: parseFloat(m.saldo_deuda) || 0
          }));
        } else {
          this._mayoristasRelacionales = null;
        }
      } catch (err) {
        this._mayoristasRelacionales = null;
      }
    } else {
      this._mayoristasRelacionales = null;
    }

    this.renderizarMayoristas();
    
    if (window.ocultarSpinner) window.ocultarSpinner();
  },

  _obtenerMayoristas() {
    return this._mayoristasRelacionales || window.BaseDatos.obtenerMayoristasProyectoActivo();
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

    form.onsubmit = async (e) => {
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
        const mays = this._obtenerMayoristas();
        const m = mays.find(x => x.id === id);
        if (m) saldoExistente = m.saldoDeuda || 0;
      }

      await window.BaseDatos.guardarMayorista({
        id: id || undefined,
        nombre,
        direccion,
        whatsapp,
        porcentajeMarcacion: marcacion,
        saldoDeuda: saldoExistente
      });

      form.reset();
      document.getElementById('modal-mayorista').classList.remove('activo');
      await this.cargarDatos();
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

    btnRegistrar.onclick = async () => {
      const idMayorista = document.getElementById('detalle-may-id').value;
      const fecha = document.getElementById('entrega-may-fecha').value;
      const monto = parseFloat(document.getElementById('entrega-may-monto').value) || 0;
      const nota = document.getElementById('entrega-may-nota').value.trim();

      if (!idMayorista) return;
      if (monto <= 0) {
        alert('Por favor ingresá un monto mayor a 0 para el ticket de entrega.');
        return;
      }

      // Calcular saldo resultante
      const mays = this._obtenerMayoristas();
      const mayorista = mays.find(m => m.id === idMayorista);
      const saldoActual = mayorista ? (mayorista.saldoDeuda || 0) : 0;
      const nuevoSaldo = saldoActual + monto;

      // Registrar movimiento de tipo ENTREGA en Supabase
      await window.BaseDatos.guardarMovimientoMayorista({
        idMayorista,
        fecha,
        tipo: 'ENTREGA',
        monto,
        saldoResultante: nuevoSaldo,
        nota: nota || 'Entrega de mercadería'
      });

      // Actualizar saldo_deuda del mayorista en Supabase
      if (mayorista) {
        await window.BaseDatos.guardarMayorista({
          id: idMayorista,
          nombre: mayorista.nombre,
          direccion: mayorista.direccion,
          whatsapp: mayorista.whatsapp,
          porcentajeMarcacion: mayorista.porcentajeMarcacion,
          saldoDeuda: nuevoSaldo
        });
      }

      // Resetear campos de entrega
      document.getElementById('entrega-may-monto').value = '0';
      document.getElementById('entrega-may-nota').value = '';

      // Actualizar vista e historial
      await this.cargarDatos();
      this.abrirDetalle(idMayorista);
      if (window.ModuloCaja) window.ModuloCaja.cargarSelectMayoristas();
    };
  },

  renderizarMayoristas() {
    const tbody = document.getElementById('tabla-mayoristas-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const mayoristas = this._obtenerMayoristas();
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
      btn.onclick = async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('¿Eliminar cliente mayorista y todo su historial?')) {
          await window.BaseDatos.eliminarMayorista(id);
          await this.cargarDatos();
          if (window.ModuloCaja) window.ModuloCaja.cargarSelectMayoristas();
        }
      };
    });
  },

  async abrirDetalle(idMayorista) {
    const mayoristas = this._obtenerMayoristas();
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
    await this.renderizarHistorialMovimientos(idMayorista);

    // Abrir modal
    document.getElementById('modal-detalle-may').classList.add('activo');
  },

  async renderizarHistorialMovimientos(idMayorista) {
    const tbody = document.getElementById('tabla-historial-may-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1rem;color:var(--color-texto-secundario);">Cargando movimientos...</td></tr>';

    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;

    // Obtener movimientos de entregas desde Supabase (o local como fallback)
    let movsEntregas = [];
    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        const movsRel = await window.RepositorioRelacional.obtenerMovimientosMayorista(idMayorista);
        movsEntregas = movsRel.map(m => ({
          id: m.id,
          idMayorista: m.cliente_id,
          fecha: m.fecha,
          tipo: m.tipo || 'ENTREGA',
          monto: parseFloat(m.monto) || 0,
          nota: m.nota || ''
        }));
      } catch (e) {
        movsEntregas = window.BaseDatos.obtenerMovimientosMayorista(idMayorista);
      }
    } else {
      movsEntregas = window.BaseDatos.obtenerMovimientosMayorista(idMayorista);
    }
    tbody.innerHTML = '';

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

      const botonesAccion = mov.esPagoCaja
        ? `<span style="font-size: 0.7rem; color: var(--color-texto-secundario);" title="Editar/Eliminar desde Caja Diaria">Caja</span>`
        : `<button class="btn btn-secundario btn-editar-mov-may" data-id="${mov.id}" data-fecha="${mov.fecha}" data-monto="${mov.monto}" data-tipo="${mov.tipo}" data-nota="${mov.nota || ''}" style="padding: 0.15rem 0.35rem; font-size: 0.7rem; margin-right: 0.15rem;">✏️</button>
           <button class="btn btn-secundario btn-eliminar-mov-may" data-id="${mov.id}" data-monto="${mov.monto}" data-tipo="${mov.tipo}" style="padding: 0.15rem 0.35rem; font-size: 0.7rem; color: var(--color-semaforo-rojo);">🗑️</button>`;

      tr.innerHTML = `
        <td style="padding: 0.5rem; font-weight: 600;">${mov.fecha}</td>
        <td style="padding: 0.5rem;">${badgeTipo}</td>
        <td style="padding: 0.5rem; font-weight: 700; color: ${esEntrega ? 'var(--color-semaforo-rojo)' : 'var(--color-semaforo-verde-oscuro)'};">
          ${esEntrega ? '+' : '-'}${fMon(mov.monto)}
        </td>
        <td style="padding: 0.5rem; color: var(--color-texto-secundario);">${mov.nota || '-'}</td>
        <td style="padding: 0.5rem; text-align: center;">${botonesAccion}</td>
      `;

      tbody.appendChild(tr);
    });

    // ── Eventos EDITAR movimientos ──
    tbody.querySelectorAll('.btn-editar-mov-may').forEach(btn => {
      btn.onclick = async (e) => {
        const idMov = e.currentTarget.getAttribute('data-id');
        const fechaActual = e.currentTarget.getAttribute('data-fecha');
        const montoActual = e.currentTarget.getAttribute('data-monto');
        const tipoActual = e.currentTarget.getAttribute('data-tipo');
        const notaActual = e.currentTarget.getAttribute('data-nota');

        const nuevoMonto = prompt(`✏️ Editar monto del movimiento (${tipoActual}):\n\nMonto actual: $${montoActual}\n\nIngresá el nuevo monto:`, montoActual);
        if (nuevoMonto === null) return; // Canceló

        const montoNum = parseFloat(nuevoMonto);
        if (isNaN(montoNum) || montoNum < 0) {
          alert('⚠️ El monto ingresado no es válido.');
          return;
        }

        const nuevaNota = prompt(`📝 Editar nota del movimiento:\n\nNota actual: ${notaActual || '(sin nota)'}\n\nIngresá la nueva nota (o dejá vacío):`, notaActual);
        if (nuevaNota === null) return; // Canceló

        if (!confirm(`¿Confirmar la edición de este movimiento?\n\n• Tipo: ${tipoActual}\n• Monto anterior: $${montoActual}\n• Monto nuevo: $${montoNum}\n• Nota: ${nuevaNota || '(sin nota)'}`)) return;

        try {
          // Actualizar movimiento en Supabase
          const url = `${window.ClienteSupabase.url}/rest/v1/movimientos_mayoristas?id=eq.${idMov}`;
          const res = await fetch(url, {
            method: 'PATCH',
            headers: window.ClienteSupabase._headers({ 'Prefer': 'return=representation' }),
            body: JSON.stringify({
              monto: montoNum,
              nota: nuevaNota || ''
            })
          });
          if (!res.ok) throw new Error(await res.text());

          // Recalcular saldo del mayorista
          const diferencia = montoNum - parseFloat(montoActual);
          if (diferencia !== 0) {
            const mays = this._obtenerMayoristas();
            const mayorista = mays.find(m => m.id === idMayorista);
            if (mayorista) {
              const ajuste = tipoActual === 'ENTREGA' ? diferencia : -diferencia;
              const nuevoSaldo = Math.max(0, (mayorista.saldoDeuda || 0) + ajuste);
              await window.BaseDatos.guardarMayorista({
                id: idMayorista,
                nombre: mayorista.nombre,
                direccion: mayorista.direccion,
                whatsapp: mayorista.whatsapp,
                porcentajeMarcacion: mayorista.porcentajeMarcacion,
                saldoDeuda: nuevoSaldo
              });
            }
          }

          await this.cargarDatos();
          await this.abrirDetalle(idMayorista);
          if (window.ModuloCaja) window.ModuloCaja.cargarSelectMayoristas();
        } catch (err) {
          console.error('[Mayoristas] Error al editar movimiento:', err);
          alert('❌ Error al editar el movimiento. Revisá la consola.');
        }
      };
    });

    // ── Eventos ELIMINAR movimientos ──
    tbody.querySelectorAll('.btn-eliminar-mov-may').forEach(btn => {
      btn.onclick = async (e) => {
        const idMov = e.currentTarget.getAttribute('data-id');
        const monto = parseFloat(e.currentTarget.getAttribute('data-monto')) || 0;
        const tipo = e.currentTarget.getAttribute('data-tipo');

        if (!confirm(`⚠️ ¿Estás seguro de eliminar este movimiento?\n\n• Tipo: ${tipo}\n• Monto: $${monto.toLocaleString('es-AR')}\n\nEsta acción no se puede deshacer y se ajustará el saldo del cliente.`)) return;

        // Revertir efecto en la deuda
        const mays = this._obtenerMayoristas();
        const mayorista = mays.find(m => m.id === idMayorista);
        if (mayorista && tipo === 'ENTREGA') {
          const nuevoSaldo = Math.max(0, (mayorista.saldoDeuda || 0) - monto);
          await window.BaseDatos.guardarMayorista({
            id: idMayorista,
            nombre: mayorista.nombre,
            direccion: mayorista.direccion,
            whatsapp: mayorista.whatsapp,
            porcentajeMarcacion: mayorista.porcentajeMarcacion,
            saldoDeuda: nuevoSaldo
          });
        } else if (mayorista && tipo === 'PAGO') {
          const nuevoSaldo = (mayorista.saldoDeuda || 0) + monto;
          await window.BaseDatos.guardarMayorista({
            id: idMayorista,
            nombre: mayorista.nombre,
            direccion: mayorista.direccion,
            whatsapp: mayorista.whatsapp,
            porcentajeMarcacion: mayorista.porcentajeMarcacion,
            saldoDeuda: nuevoSaldo
          });
        }
        await window.BaseDatos.eliminarMovimientoMayorista(idMov);
        await this.cargarDatos();
        await this.abrirDetalle(idMayorista);
        if (window.ModuloCaja) window.ModuloCaja.cargarSelectMayoristas();
      };
    });
  }
};

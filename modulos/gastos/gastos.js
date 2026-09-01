/**
 * gastos.js - Lógica del Módulo de Gastos Fijos (Prorrateo, CRUD y Filtros)
 */

window.ModuloGastos = {
  gastos: [],

  inicializar() {
    this.cargarGastos();
    this.configurarEventos();
  },

  cargarGastos() {
    this.gastos = window.BaseDatos.obtenerGastosFijosLocalActivo();
    this.renderizarTabla();
    this.actualizarResumen();
  },

  // Prorrateo automático según la frecuencia cargada
  calcularMontoMensual(monto, frecuencia) {
    const diasLaborables = window.BaseDatos.obtenerEstado().configuracion.diasLaborablesMes || 26;
    switch (frecuencia) {
      case 'Diaria': return monto * diasLaborables;
      case 'Semanal': return monto * 4;
      case 'Mensual': return monto;
      case 'Bimestral': return monto / 2;
      case 'Anual': return monto / 12;
      default: return monto;
    }
  },

  renderizarTabla() {
    const tbody = document.getElementById('tabla-gastos-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (this.gastos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: var(--color-texto-secundario);">
            No hay gastos fijos registrados en este local.
          </td>
        </tr>
      `;
      return;
    }

    this.gastos.forEach(gasto => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--color-borde)';

      const montoMensual = this.calcularMontoMensual(gasto.monto, gasto.frecuencia);

      tr.innerHTML = `
        <td style="padding: 0.75rem 1rem;">
          <input type="checkbox" class="toggle-estado-gasto" data-id="${gasto.id}" ${gasto.estaActivo ? 'checked' : ''}>
        </td>
        <td style="padding: 0.75rem 1rem; font-weight: 600;">${gasto.nombre}</td>
        <td style="padding: 0.75rem 1rem;"><span style="background-color: var(--color-fondo-pagina); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">${gasto.categoria}</span></td>
        <td style="padding: 0.75rem 1rem;">$ ${gasto.monto.toLocaleString('es-AR')}</td>
        <td style="padding: 0.75rem 1rem;">${gasto.frecuencia}</td>
        <td style="padding: 0.75rem 1rem; font-weight: 700; color: var(--color-primario);">$ ${montoMensual.toLocaleString('es-AR')}</td>
        <td style="padding: 0.75rem 1rem; text-align: center;">
          <button class="btn btn-secundario btn-editar-gasto" data-id="${gasto.id}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">✏️ Editar</button>
          <button class="btn btn-secundario btn-eliminar-gasto" data-id="${gasto.id}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; color: var(--color-semaforo-rojo);">🗑️</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    this.asignarEventosFilas();
  },

  actualizarResumen() {
    const totalMensual = this.gastos
      .filter(g => g.estaActivo)
      .reduce((sum, g) => sum + this.calcularMontoMensual(g.monto, g.frecuencia), 0);

    const subtotalAlquiler = this.gastos
      .filter(g => g.estaActivo && (g.categoria === 'Alquiler' || g.categoria === 'Gastos Contrato'))
      .reduce((sum, g) => sum + this.calcularMontoMensual(g.monto, g.frecuencia), 0);

    document.getElementById('gastos-total-mensual').textContent = `$ ${totalMensual.toLocaleString('es-AR')}`;
    document.getElementById('gastos-subtotal-alquiler').textContent = `$ ${subtotalAlquiler.toLocaleString('es-AR')}`;
  },

  configurarEventos() {
    const btnNuevo = document.getElementById('btn-nuevo-gasto');
    const modal = document.getElementById('modal-gasto');
    const btnCerrar = document.getElementById('btn-cerrar-modal-gasto');
    const btnCancelar = document.getElementById('btn-cancelar-modal-gasto');
    const form = document.getElementById('form-gasto');

    if (btnNuevo) {
      btnNuevo.addEventListener('click', () => {
        document.getElementById('modal-gasto-titulo').textContent = 'Nuevo Gasto Fijo';
        form.reset();
        document.getElementById('gasto-id').value = '';
        modal.classList.add('activo');
      });
    }

    const cerrarModal = () => modal.classList.remove('activo');
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModal);
    if (btnCancelar) btnCancelar.addEventListener('click', cerrarModal);

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.guardarGasto();
        cerrarModal();
      });
    }
  },

  asignarEventosFilas() {
    // Toggle Activo/Inactivo
    document.querySelectorAll('.toggle-estado-gasto').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const gasto = this.gastos.find(g => g.id === id);
        if (gasto) {
          gasto.estaActivo = e.target.checked;
          window.BaseDatos.guardar();
          this.actualizarResumen();
          window.renderizarResumenKPIs();
        }
      });
    });

    // Editar
    document.querySelectorAll('.btn-editar-gasto').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const gasto = this.gastos.find(g => g.id === id);
        if (gasto) {
          document.getElementById('modal-gasto-titulo').textContent = 'Editar Gasto Fijo';
          document.getElementById('gasto-id').value = gasto.id;
          document.getElementById('gasto-nombre').value = gasto.nombre;
          document.getElementById('gasto-categoria').value = gasto.categoria;
          document.getElementById('gasto-frecuencia').value = gasto.frecuencia;
          document.getElementById('gasto-monto').value = gasto.monto;
          document.getElementById('gasto-es-contrato').checked = gasto.esAjusteContrato;
          document.getElementById('modal-gasto').classList.add('activo');
        }
      });
    });

    // Eliminar
    document.querySelectorAll('.btn-eliminar-gasto').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target.closest('[data-id]');
        const id = target ? target.getAttribute('data-id') : null;
        if (id) {
          const estado = window.BaseDatos.obtenerEstado();
          estado.gastosFijos = estado.gastosFijos.filter(g => g.id !== id);
          window.BaseDatos.guardar();
          this.cargarGastos();
          window.renderizarResumenKPIs();
        }
      });
    });
  },

  guardarGasto() {
    const estado = window.BaseDatos.obtenerEstado();
    const id = document.getElementById('gasto-id').value;
    const nombre = document.getElementById('gasto-nombre').value;
    const categoria = document.getElementById('gasto-categoria').value;
    const frecuencia = document.getElementById('gasto-frecuencia').value;
    const monto = parseFloat(document.getElementById('gasto-monto').value) || 0;
    const esAjusteContrato = document.getElementById('gasto-es-contrato').checked;
    const montoMensualProrrateado = this.calcularMontoMensual(monto, frecuencia);

    if (id) {
      // Editar
      const gasto = estado.gastosFijos.find(g => g.id === id);
      if (gasto) {
        gasto.nombre = nombre;
        gasto.categoria = categoria;
        gasto.frecuencia = frecuencia;
        gasto.monto = monto;
        gasto.montoMensualProrrateado = montoMensualProrrateado;
        gasto.esAjusteContrato = esAjusteContrato;
      }
    } else {
      // Crear
      const nuevoGasto = {
        id: `gas_${Date.now()}`,
        idLocal: estado.idLocalActivo,
        nombre,
        categoria,
        monto,
        frecuencia,
        montoMensualProrrateado,
        esAjusteContrato,
        estaActivo: true
      };
      estado.gastosFijos.push(nuevoGasto);
    }

    window.BaseDatos.guardar();
    this.cargarGastos();
    window.renderizarResumenKPIs();
  }
};

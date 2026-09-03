/**
 * gastos.js - Lógica del Módulo de Gastos Fijos (Prorrateo, CRUD y Filtros)
 */

window.ModuloGastos = {
  gastos: [],

  inicializar() {
    this.cargarCategoriasSelect();
    this.cargarGastos();
    this.configurarEventos();
  },

  async cargarCategoriasSelect() {
    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        const categoriasDB = await window.RepositorioRelacional.obtenerCategoriasGastos();
        const selects = document.querySelectorAll('#gasto-categoria');
        
        selects.forEach(select => {
          if (select) {
            select.innerHTML = '<option value="" disabled selected>Seleccione una categoría</option>';
            categoriasDB.forEach(cat => {
              const option = document.createElement('option');
              // Guardamos el ID como value para que sea más fácil enviarlo después
              option.value = cat.id; 
              option.textContent = cat.nombre;
              select.appendChild(option);
            });
          }
        });
      } catch (err) {
        console.error('[Gastos] Error cargando categorías:', err);
      }
    }
  },

  async cargarGastos() {
    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        const empresaId = window.EstadoGlobal.idProyectoActivo || 'e0000000-0000-4000-8000-000000000001';
        const gastosRel = await window.RepositorioRelacional.obtenerGastosFijos(empresaId);
        const categoriasDB = await window.RepositorioRelacional.obtenerCategoriasGastos();
        
        if (gastosRel) { // Incluso si es vacío, queremos mostrar 0 gastos para este proyecto
          this.gastos = gastosRel.map(g => {
            const categoriaObj = categoriasDB.find(c => c.id === g.categoria_id);
            return {
              id: g.id,
              nombre: g.concepto,
              monto: parseFloat(g.monto_estimado) || 0,
              frecuencia: g.frecuencia || 'Mensual',
              categoriaId: g.categoria_id,
              categoria: categoriaObj ? categoriaObj.nombre : 'Otra',
              esAjusteContrato: g.es_ajuste_contrato || false,
              estaActivo: true // Por defecto activo, ya que no se guarda este estado en BD
            };
          });
        }
      } catch (err) {
        console.error('[Gastos] Error cargando desde Supabase:', err);
        this.gastos = window.BaseDatos.obtenerGastosFijosLocalActivo();
      }
    } else {
      this.gastos = window.BaseDatos.obtenerGastosFijosLocalActivo();
    }

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

    const gastosContrato = this.gastos
      .filter(g => g.estaActivo && g.esAjusteContrato)
      .reduce((sum, g) => sum + this.calcularMontoMensual(g.monto, g.frecuencia), 0);

    const elTotal = document.getElementById('gastos-total-mensual');
    const elContrato = document.getElementById('gastos-subtotal-alquiler');

    if (elTotal) elTotal.textContent = `$ ${totalMensual.toLocaleString('es-AR')}`;
    if (elContrato) elContrato.textContent = `$ ${gastosContrato.toLocaleString('es-AR')}`;
  },

  configurarEventos() {
    const btnNuevo = document.getElementById('btn-nuevo-gasto');
    const btnCerrar = document.getElementById('btn-cerrar-modal-gasto');
    const btnCancelar = document.getElementById('btn-cancelar-modal-gasto');
    const form = document.getElementById('form-gasto');
    const modal = document.getElementById('modal-gasto');

    const cerrarModal = () => {
      if (modal) modal.classList.remove('activo');
      if (form) form.reset();
      document.getElementById('gasto-id').value = '';
    };

    if (btnNuevo) {
      btnNuevo.addEventListener('click', () => {
        document.getElementById('modal-gasto-titulo').textContent = 'Nuevo Gasto Fijo';
        if (form) form.reset();
        document.getElementById('gasto-id').value = '';
        if (modal) modal.classList.add('activo');
      });
    }

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
          // Actualizamos todos los elementos por si hay modales duplicados en index.html y gastos.html
          document.querySelectorAll('#modal-gasto-titulo').forEach(el => el.textContent = 'Editar Gasto Fijo');
          document.querySelectorAll('#gasto-id').forEach(el => el.value = gasto.id);
          document.querySelectorAll('#gasto-nombre').forEach(el => el.value = gasto.nombre);
          
          document.querySelectorAll('#gasto-categoria').forEach(select => {
            let encontrado = false;
            if(gasto.categoriaId) {
              select.value = gasto.categoriaId;
              encontrado = (select.value === gasto.categoriaId);
            } 
            
            // Fallback si no tiene categoriaId o no se seteó correctamente
            if (!encontrado) {
              for(let i = 0; i < select.options.length; i++) {
                if(select.options[i].text === gasto.categoria || select.options[i].text.includes(gasto.categoria)) {
                  select.value = select.options[i].value;
                  break;
                }
              }
            }
          });
          
          document.querySelectorAll('#gasto-frecuencia').forEach(el => el.value = gasto.frecuencia);
          document.querySelectorAll('#gasto-monto').forEach(el => el.value = gasto.monto);
          document.querySelectorAll('#gasto-es-contrato').forEach(el => el.checked = gasto.esAjusteContrato || false);
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

  async guardarGasto() {
    const estado = window.BaseDatos.obtenerEstado();
    if (!estado.gastosFijos) estado.gastosFijos = [];
    
    // Buscar el modal activo para leer los valores correctos
    const modalActivo = document.querySelector('#modal-gasto.activo') || document.querySelector('#modal-gasto');
    
    const id = modalActivo.querySelector('#gasto-id').value;
    const nombre = modalActivo.querySelector('#gasto-nombre').value;
    const categoria = modalActivo.querySelector('#gasto-categoria').value;
    const frecuencia = modalActivo.querySelector('#gasto-frecuencia').value;
    const monto = parseFloat(modalActivo.querySelector('#gasto-monto').value) || 0;
    const esAjusteContrato = modalActivo.querySelector('#gasto-es-contrato').checked;
    
    const montoMensualProrrateado = this.calcularMontoMensual(monto, frecuencia);

    // Guardar en Supabase
    let categoriaNombreParaLocal = 'Fijo';

    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        const empresaId = window.EstadoGlobal.idProyectoActivo;
        
        // El 'value' del select ahora es directamente el ID de la categoría
        const categoriaId = categoria; 

        // Buscar el nombre para mostrarlo luego en la tabla
        const categoriasDB = await window.RepositorioRelacional.obtenerCategoriasGastos();
        const categoriaObj = categoriasDB.find(c => c.id === categoriaId);
        if (categoriaObj) categoriaNombreParaLocal = categoriaObj.nombre;

        const payload = {
          empresa_id: empresaId,
          concepto: nombre,
          categoria_id: categoriaId,
          frecuencia,
          monto_estimado: monto,
          monto_mensual: montoMensualProrrateado,
          es_ajuste_contrato: esAjusteContrato
        };
        if (id && !id.startsWith('gas_')) payload.id = id;

        await window.RepositorioRelacional.guardarGastoFijo(payload);
        console.log('[Gastos] Gasto guardado en Supabase:', nombre);
      } catch (err) {
        console.error('[Gastos] Error al guardar en Supabase:', err);
      }
    }

    // Guardar también en estado local (fallback)
    if (id) {
      const gasto = estado.gastosFijos.find(g => g.id === id);
      if (gasto) {
        gasto.nombre = nombre;
        gasto.categoria = categoriaNombreParaLocal;
        gasto.frecuencia = frecuencia;
        gasto.monto = monto;
        gasto.montoMensualProrrateado = montoMensualProrrateado;
        gasto.esAjusteContrato = esAjusteContrato;
      }
    } else {
      const nuevoGasto = {
        id: `gas_${Date.now()}`,
        idLocal: estado.idLocalActivo,
        nombre,
        categoria: categoriaNombreParaLocal,
        monto,
        frecuencia,
        montoMensualProrrateado,
        esAjusteContrato,
        estaActivo: true
      };
      estado.gastosFijos.push(nuevoGasto);
    }

    window.BaseDatos.guardar();
    await this.cargarGastos();
    window.renderizarResumenKPIs();
  }
};

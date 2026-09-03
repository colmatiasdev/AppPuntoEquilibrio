/**
 * proyectos.js - Módulo de Gestión de Proyectos, Locales y Horarios de Comercio Semanales por Día
 */

window.ModuloProyectos = {
  proyectos: [],
  locales: [],
  eventosConfigurados: false,

  DIAS_SEMANA: [
    { clave: 'lunes', nombre: 'Lunes' },
    { clave: 'martes', nombre: 'Martes' },
    { clave: 'miercoles', nombre: 'Miércoles' },
    { clave: 'jueves', nombre: 'Jueves' },
    { clave: 'viernes', nombre: 'Viernes' },
    { clave: 'sabado', nombre: 'Sábado' },
    { clave: 'domingo', nombre: 'Domingo' }
  ],

  async inicializar() {
    await this.cargarDatos();
    if (!this.eventosConfigurados) {
      this.configurarEventos();
      this.eventosConfigurados = true;
    }
  },

  async cargarDatos() {
    if (window.mostrarSpinner) window.mostrarSpinner('Cargando proyectos y locales desde la Base de Datos...');
    try {
      const estado = window.BaseDatos.obtenerEstado();

      if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
        let empsRel = await window.RepositorioRelacional.obtenerEmpresas();

        // Si la base de datos de Supabase no tiene empresas creadas, inicializar una Empresa real
        if (!empsRel || empsRel.length === 0) {
          const empCreada = await window.RepositorioRelacional.guardarEmpresa({
            nombre: 'Mi Empresa'
          });
          if (empCreada && empCreada.id) {
            empsRel = [empCreada];
            await window.RepositorioRelacional.guardarLocal({
              empresa_id: empCreada.id,
              nombre: 'Local Principal'
            });
          }
        }

        if (empsRel && empsRel.length > 0) {
          this.proyectos = empsRel.map(e => ({
            id: e.id,
            nombre: e.nombre,
            descripcion: e.razon_social || e.rubro || '',
            logo: e.logo_url || null
          }));
          estado.proyectos = this.proyectos;

          if (!estado.idProyectoActivo || !this.proyectos.some(p => p.id === estado.idProyectoActivo)) {
            estado.idProyectoActivo = this.proyectos[0].id;
          }
        } else {
          this.proyectos = estado.proyectos;
        }

        // Cargar TODOS los locales de la DB para mapear correctamente a cada empresa
        let todosLocsRel = await window.RepositorioRelacional.obtenerTodosLosLocales();
        if (todosLocsRel && todosLocsRel.length > 0) {
          this.locales = todosLocsRel.map(l => ({
            id: l.id,
            idProyecto: l.empresa_id,
            nombre: l.nombre,
            direccion: l.direccion || '',
            horarioSemanal: (l.horarios_locales && l.horarios_locales.length > 0)
              ? this.convertirHorariosDBaLocal(l.horarios_locales)
              : this.crearHorarioSemanalVacio(),
            estimadoVentasMinimasZona: l.estimado_ventas_minimas_zona || 0
          }));
          estado.locales = this.locales;

          const localesActivos = this.locales.filter(l => l.idProyecto === estado.idProyectoActivo);
          if (localesActivos.length > 0) {
            if (!estado.idLocalActivo || !localesActivos.some(l => l.id === estado.idLocalActivo)) {
              estado.idLocalActivo = localesActivos[0].id;
            }
          }
        } else {
          this.locales = estado.locales;
        }
        window.BaseDatos.guardar();
      } else {
        this.proyectos = estado.proyectos;
        this.locales = estado.locales;
      }

      this.renderizarListaProyectos();
      this.renderizarListaLocales();
      if (window.cargarSelectoresContexto) {
        window.cargarSelectoresContexto();
      }
    } catch (err) {
      console.error('[ModuloProyectos] Error al cargar desde Supabase:', err);
    } finally {
      if (window.ocultarSpinner) window.ocultarSpinner();
    }
  },

  renderizarListaProyectos() {
    const contenedor = document.getElementById('lista-proyectos-cards');
    if (!contenedor) return;

    const estado = window.BaseDatos.obtenerEstado();
    contenedor.innerHTML = '';

    if (this.proyectos.length === 0) {
      contenedor.innerHTML = '<p style="color: var(--color-texto-secundario);">No hay proyectos creados.</p>';
      return;
    }

    this.proyectos.forEach(proy => {
      const esActivo = proy.id === estado.idProyectoActivo;
      const localesProyecto = this.locales.filter(l => l.idProyecto === proy.id);
      const logoHtml = proy.logo
        ? `<img src="${proy.logo}" alt="${proy.nombre}" style="width: 48px; height: 48px; border-radius: 10px; object-fit: cover; border: 1px solid var(--color-borde); flex-shrink: 0;">`
        : `<div style="width: 48px; height: 48px; border-radius: 10px; background-color: var(--color-primario-suave); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">🏬</div>`;

      const card = document.createElement('div');
      card.style.cssText = `
        background-color: var(--color-tarjeta);
        border: 2px solid ${esActivo ? 'var(--color-primario)' : 'var(--color-borde)'};
        border-radius: var(--radio-tarjeta);
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 1rem;
        box-shadow: var(--sombra-tarjeta);
      `;

      card.innerHTML = `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; gap: 0.75rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; overflow: hidden;">
              ${logoHtml}
              <div style="overflow: hidden;">
                <h3 style="font-size: 1.1rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${proy.nombre}</h3>
                <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">ID: ${proy.id}</span>
              </div>
            </div>
            ${esActivo ? '<span style="background-color: var(--color-primario-suave); color: var(--color-primario); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; flex-shrink: 0;">ACTIVO</span>' : ''}
          </div>
          <p style="font-size: 0.85rem; color: var(--color-texto-secundario); margin: 0; line-height: 1.4;">${proy.descripcion || 'Sin descripción'}</p>
          <div style="margin-top: 0.75rem; font-size: 0.8rem; color: var(--color-texto-mutado);">
            🏬 <strong>${localesProyecto.length}</strong> local(es) en este proyecto
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px solid var(--color-borde); padding-top: 0.75rem;">
          ${!esActivo ? `<button class="btn btn-secundario btn-activar-proyecto" data-id="${proy.id}" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">Seleccionar</button>` : ''}
          <button class="btn btn-secundario btn-editar-proyecto" data-id="${proy.id}" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">✏️ Editar</button>
          <button class="btn btn-secundario btn-eliminar-proyecto" data-id="${proy.id}" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; color: var(--color-semaforo-rojo);">🗑️</button>
        </div>
      `;

      contenedor.appendChild(card);
    });

    this.asignarEventosProyectos();
  },

  renderizarListaLocales() {
    const tbody = document.getElementById('tabla-locales-body');
    if (!tbody) return;

    const estado = window.BaseDatos.obtenerEstado();
    tbody.innerHTML = '';

    const localesFiltrados = this.locales.filter(l => l.idProyecto === estado.idProyectoActivo);

    if (localesFiltrados.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--color-texto-secundario);">
            No hay locales registrados en este proyecto. Agregá tu primer local comercial.
          </td>
        </tr>
      `;
      return;
    }

    localesFiltrados.forEach(local => {
      const esActivo = local.id === estado.idLocalActivo;
      const resumenHorario = this.generarResumenHorarioLocal(local);
      
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--color-borde)';
      if (esActivo) tr.style.backgroundColor = 'rgba(37, 99, 235, 0.03)';

      tr.innerHTML = `
        <td style="padding: 0.75rem 1rem; font-weight: 600;">
          ${local.nombre} ${esActivo ? '<span style="color: var(--color-primario); font-size: 0.75rem;">(Activo)</span>' : ''}
        </td>
        <td style="padding: 0.75rem 1rem; font-size: 0.85rem;">${local.direccion || 'No especificada'}</td>
        <td style="padding: 0.75rem 1rem; font-size: 0.85rem; line-height: 1.3;">
          ${resumenHorario.textoHorario}
        </td>
        <td style="padding: 0.75rem 1rem; font-weight: 600;">${resumenHorario.diasAbiertos} días/sem</td>
        <td style="padding: 0.75rem 1rem;">$ ${(local.estimadoVentasMinimasZona || 0).toLocaleString('es-AR')}</td>
        <td style="padding: 0.75rem 1rem; text-align: center;">
          ${!esActivo ? `<button class="btn btn-secundario btn-activar-local" data-id="${local.id}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">Seleccionar</button>` : ''}
          <button class="btn btn-secundario btn-editar-local" data-id="${local.id}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">✏️ Editar</button>
          <button class="btn btn-secundario btn-eliminar-local" data-id="${local.id}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; color: var(--color-semaforo-rojo);">🗑️</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    this.asignarEventosLocales();
  },

  generarResumenHorarioLocal(local) {
    if (local.horarioSemanal) {
      let diasAbiertos = 0;
      const partesTexto = [];

      this.DIAS_SEMANA.forEach(d => {
        const confDia = local.horarioSemanal[d.clave];
        if (confDia && confDia.abierto && confDia.turnos && confDia.turnos.length > 0) {
          diasAbiertos++;
          const turnosStr = confDia.turnos.map(t => `${t.inicio} a ${t.fin} hs`).join(' y ');
          partesTexto.push(`<strong>${d.nombre.substr(0, 3)}:</strong> ${turnosStr}`);
        }
      });

      return {
        diasAbiertos,
        textoHorario: partesTexto.length > 0 ? partesTexto.slice(0, 3).join(' | ') + (partesTexto.length > 3 ? '...' : '') : 'Sin horario configurado'
      };
    }

    // Fallback estructura vieja
    const hc = local.horariosComercio || {};
    return {
      diasAbiertos: hc.diasPorSemana || 0,
      textoHorario: hc.horarioApertura ? `${hc.horarioApertura} a ${hc.horarioCierre} hs` : 'Sin horario configurado'
    };
  },

  configurarFormularioModalLocal(local = null) {
    const contenedor = document.getElementById('contenedor-horarios-dias');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    const horarioSemanal = (local && local.horarioSemanal) ? local.horarioSemanal : this.crearHorarioSemanalVacio();

    this.DIAS_SEMANA.forEach(d => {
      const confDia = horarioSemanal[d.clave] || { abierto: false, turnos: [] };

      const fila = document.createElement('div');
      fila.className = 'dia-horario-row';
      fila.style.cssText = 'background-color: var(--color-tarjeta); border: 1px solid var(--color-borde); padding: 0.5rem 0.75rem; border-radius: 6px; display: flex; flex-direction: column; gap: 0.4rem;';

      const headerDia = document.createElement('div');
      headerDia.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';

      headerDia.innerHTML = `
        <label style="font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
          <input type="checkbox" class="chk-dia-abierto" data-dia="${d.clave}" ${confDia.abierto ? 'checked' : ''}>
          ${d.nombre}
        </label>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="lbl-estado-dia" style="font-size: 0.75rem; font-weight: 600; color: ${confDia.abierto ? 'var(--color-primario)' : 'var(--color-texto-mutado)'};">
            ${confDia.abierto ? 'Abierto' : 'Cerrado'}
          </span>
          <button type="button" class="btn btn-secundario btn-agregar-turno-dia" data-dia="${d.clave}" style="padding: 0.15rem 0.4rem; font-size: 0.75rem; ${confDia.abierto ? '' : 'display: none;'}">
            ➕ Turno Cortado
          </button>
        </div>
      `;

      const divTurnos = document.createElement('div');
      divTurnos.id = `turnos-dia-${d.clave}`;
      divTurnos.style.cssText = `display: ${confDia.abierto ? 'flex' : 'none'}; flex-direction: column; gap: 0.4rem; padding-top: 0.25rem;`;

      confDia.turnos.forEach((t, idx) => {
        const turnoRow = this.crearFilaTurnoDOM(d.clave, t.inicio, t.fin, idx > 0);
        divTurnos.appendChild(turnoRow);
      });

      // Evento checkbox abierto/cerrado
      const chk = headerDia.querySelector('.chk-dia-abierto');
      const lbl = headerDia.querySelector('.lbl-estado-dia');
      const btnAdd = headerDia.querySelector('.btn-agregar-turno-dia');

      chk.addEventListener('change', (e) => {
        const estaAbierto = e.target.checked;
        lbl.textContent = estaAbierto ? 'Abierto' : 'Cerrado';
        lbl.style.color = estaAbierto ? 'var(--color-primario)' : 'var(--color-texto-mutado)';
        divTurnos.style.display = estaAbierto ? 'flex' : 'none';
        btnAdd.style.display = estaAbierto ? 'inline-block' : 'none';
        if (estaAbierto && divTurnos.children.length === 0) {
          divTurnos.appendChild(this.crearFilaTurnoDOM(d.clave, '', '', false));
        }
      });

      btnAdd.addEventListener('click', () => {
        divTurnos.appendChild(this.crearFilaTurnoDOM(d.clave, '', '', true));
      });

      fila.appendChild(headerDia);
      fila.appendChild(divTurnos);
      contenedor.appendChild(fila);
    });
  },

  crearFilaTurnoDOM(claveDia, horaInicio, horaFin, esSecundario) {
    const row = document.createElement('div');
    row.className = 'turno-input-row';
    row.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem;';

    const selectInicio = this.generarSelect24Horas('input-hora-inicio', horaInicio);
    const selectFin = this.generarSelect24Horas('input-hora-fin', horaFin);

    row.innerHTML = `
      <span>Desde:</span>
    `;
    row.appendChild(selectInicio);

    const spanHasta = document.createElement('span');
    spanHasta.textContent = 'Hasta:';
    row.appendChild(spanHasta);

    row.appendChild(selectFin);

    if (esSecundario) {
      const btnQuitar = document.createElement('button');
      btnQuitar.type = 'button';
      btnQuitar.className = 'btn-quitar-turno-row';
      btnQuitar.style.cssText = 'background: none; border: none; cursor: pointer; color: var(--color-semaforo-rojo); font-weight: bold; margin-left: 0.25rem;';
      btnQuitar.textContent = '✖';
      btnQuitar.addEventListener('click', () => row.remove());
      row.appendChild(btnQuitar);
    }

    return row;
  },

  generarSelect24Horas(clase, valorSeleccionado) {
    const select = document.createElement('select');
    select.className = clase;
    select.style.cssText = 'padding: 0.25rem 0.4rem; border: 1px solid var(--color-borde); border-radius: 4px; font-size: 0.85rem; font-weight: 600; background-color: var(--color-tarjeta); color: var(--color-texto-principal); cursor: pointer;';

    for (let h = 0; h < 24; h++) {
      for (let m of [0, 30]) {
        const horaStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const option = document.createElement('option');
        option.value = horaStr;
        option.textContent = `${horaStr} hs`;
        if (horaStr === valorSeleccionado) option.selected = true;
        select.appendChild(option);
      }
    }

    return select;
  },

  crearHorarioSemanalVacio() {
    const def = {};
    this.DIAS_SEMANA.forEach(d => {
      def[d.clave] = {
        abierto: false,
        turnos: []
      };
    });
    return def;
  },

  /**
   * Convierte el array de horarios_locales de la DB (PostgREST) al formato objeto
   * que usa internamente la app: { lunes: { abierto, turnos: [{inicio, fin}] }, ... }
   */
  convertirHorariosDBaLocal(horariosDB) {
    const MAPA_INT_A_CLAVE = { 1: 'lunes', 2: 'martes', 3: 'miercoles', 4: 'jueves', 5: 'viernes', 6: 'sabado', 7: 'domingo' };
    const resultado = this.crearHorarioSemanalVacio();

    horariosDB.forEach(h => {
      const claveDia = MAPA_INT_A_CLAVE[h.dia_semana];
      if (!claveDia) return;

      // Formatear hora: DB trae "07:00:00" (TIME), convertir a "07:00"
      const horaApertura = (h.hora_apertura || '').substring(0, 5);
      const horaCierre = (h.hora_cierre || '').substring(0, 5);

      if (horaApertura && horaCierre) {
        resultado[claveDia].abierto = true;
        resultado[claveDia].turnos.push({ inicio: horaApertura, fin: horaCierre });
      }
    });

    return resultado;
  },

  configurarEventos() {
    // Modal Proyecto & Previsualizador de Logo
    const btnNuevoProy = document.getElementById('btn-nuevo-proyecto');
    const modalProy = document.getElementById('modal-proyecto');
    const btnCerrarProy = document.getElementById('btn-cerrar-modal-proyecto');
    const btnCancelarProy = document.getElementById('btn-cancelar-modal-proyecto');
    const formProy = document.getElementById('form-proyecto');
    const inputFileLogo = document.getElementById('proyecto-modal-logo-file');
    const inputHiddenLogo = document.getElementById('proyecto-modal-logo-base64');
    const imgPreview = document.getElementById('preview-logo-img');
    const placeholderPreview = document.getElementById('preview-logo-placeholder');

    if (inputFileLogo) {
      inputFileLogo.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const base64 = evt.target.result;
            inputHiddenLogo.value = base64;
            imgPreview.src = base64;
            imgPreview.style.display = 'block';
            placeholderPreview.style.display = 'none';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (btnNuevoProy) {
      btnNuevoProy.addEventListener('click', () => {
        document.getElementById('modal-proyecto-titulo').textContent = 'Nuevo Proyecto';
        formProy.reset();
        document.getElementById('proyecto-modal-id').value = '';
        if (inputHiddenLogo) inputHiddenLogo.value = '';
        if (imgPreview) { imgPreview.src = ''; imgPreview.style.display = 'none'; }
        if (placeholderPreview) placeholderPreview.style.display = 'block';
        modalProy.classList.add('activo');
      });
    }

    if (btnCerrarProy) btnCerrarProy.addEventListener('click', () => modalProy.classList.remove('activo'));
    if (btnCancelarProy) btnCancelarProy.addEventListener('click', () => modalProy.classList.remove('activo'));

    if (formProy) {
      formProy.addEventListener('submit', (e) => {
        e.preventDefault();
        this.guardarProyecto();
        modalProy.classList.remove('activo');
      });
    }

    // Modal Local
    const btnNuevoLocal = document.getElementById('btn-nuevo-local');
    const modalLocal = document.getElementById('modal-local');
    const btnCerrarLocal = document.getElementById('btn-cerrar-modal-local');
    const btnCancelarLocal = document.getElementById('btn-cancelar-modal-local');
    const formLocal = document.getElementById('form-local');

    if (btnNuevoLocal) {
      btnNuevoLocal.addEventListener('click', () => {
        document.getElementById('modal-local-titulo').textContent = 'Nuevo Local Comercial';
        formLocal.reset();
        document.getElementById('local-modal-id').value = '';
        this.configurarFormularioModalLocal(null);
        modalLocal.classList.add('activo');
      });
    }

    if (btnCerrarLocal) btnCerrarLocal.addEventListener('click', () => modalLocal.classList.remove('activo'));
    if (btnCancelarLocal) btnCancelarLocal.addEventListener('click', () => modalLocal.classList.remove('activo'));

    if (formLocal) {
      formLocal.addEventListener('submit', (e) => {
        e.preventDefault();
        this.guardarLocal();
        modalLocal.classList.remove('activo');
      });
    }
  },

  asignarEventosProyectos() {
    document.querySelectorAll('.btn-activar-proyecto').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        window.BaseDatos.seleccionarProyecto(id);
        if (window.actualizarModulosActivos) window.actualizarModulosActivos();
      };
    });

    document.querySelectorAll('.btn-editar-proyecto').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const proy = this.proyectos.find(p => p.id === id);
        if (proy) {
          document.getElementById('modal-proyecto-titulo').textContent = 'Editar Proyecto';
          document.getElementById('proyecto-modal-id').value = proy.id;
          document.getElementById('proyecto-modal-nombre').value = proy.nombre;
          document.getElementById('proyecto-modal-descripcion').value = proy.descripcion || '';
          
          const inputHiddenLogo = document.getElementById('proyecto-modal-logo-base64');
          const imgPreview = document.getElementById('preview-logo-img');
          const placeholderPreview = document.getElementById('preview-logo-placeholder');
          
          if (proy.logo) {
            if (inputHiddenLogo) inputHiddenLogo.value = proy.logo;
            if (imgPreview) { imgPreview.src = proy.logo; imgPreview.style.display = 'block'; }
            if (placeholderPreview) placeholderPreview.style.display = 'none';
          } else {
            if (inputHiddenLogo) inputHiddenLogo.value = '';
            if (imgPreview) { imgPreview.src = ''; imgPreview.style.display = 'none'; }
            if (placeholderPreview) placeholderPreview.style.display = 'block';
          }

          document.getElementById('modal-proyecto').classList.add('activo');
        }
      };
    });

    document.querySelectorAll('.btn-eliminar-proyecto').forEach(btn => {
      btn.onclick = async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const estado = window.BaseDatos.obtenerEstado();
        if (this.proyectos.length <= 1) {
          alert('No podés eliminar el único proyecto del sistema.');
          return;
        }
        if (!confirm('¿Estás seguro de eliminar este proyecto y sus locales?')) return;

        if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
          await window.RepositorioRelacional.eliminarEmpresa(id);
        }

        estado.proyectos = estado.proyectos.filter(p => p.id !== id);
        estado.locales = estado.locales.filter(l => l.idProyecto !== id);
        if (estado.idProyectoActivo === id) {
          const proysRestantes = estado.proyectos.filter(p => p.id !== id);
          if (proysRestantes.length > 0) estado.idProyectoActivo = proysRestantes[0].id;
        }
        window.BaseDatos.guardar();
        await this.cargarDatos();
        if (window.actualizarModulosActivos) window.actualizarModulosActivos();
      };
    });
  },

  asignarEventosLocales() {
    document.querySelectorAll('.btn-activar-local').forEach(btn => {
      btn.onclick = async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        window.BaseDatos.seleccionarLocal(id);
        await this.cargarDatos();
        if (window.actualizarModulosActivos) window.actualizarModulosActivos();
      };
    });

    document.querySelectorAll('.btn-editar-local').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const local = this.locales.find(l => l.id === id);
        if (local) {
          document.getElementById('modal-local-titulo').textContent = 'Editar Local Comercial';
          document.getElementById('local-modal-id').value = local.id;
          document.getElementById('local-modal-nombre').value = local.nombre;
          document.getElementById('local-modal-direccion').value = local.direccion || '';
          document.getElementById('local-modal-ventas-min').value = local.estimadoVentasMinimasZona || 0;
          this.configurarFormularioModalLocal(local);
          document.getElementById('modal-local').classList.add('activo');
        }
      };
    });

    document.querySelectorAll('.btn-eliminar-local').forEach(btn => {
      btn.onclick = async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const estado = window.BaseDatos.obtenerEstado();
        const localesActuales = this.locales.filter(l => l.idProyecto === estado.idProyectoActivo);
        if (localesActuales.length <= 1) {
          alert('Debe haber al menos un local comercial por proyecto.');
          return;
        }
        if (!confirm('¿Estás seguro de eliminar este local comercial?')) return;

        if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
          await window.RepositorioRelacional.eliminarLocal(id);
        }

        estado.locales = estado.locales.filter(l => l.id !== id);
        if (estado.idLocalActivo === id) {
          const locs = estado.locales.filter(l => l.idProyecto === estado.idProyectoActivo);
          if (locs.length > 0) estado.idLocalActivo = locs[0].id;
        }
        window.BaseDatos.guardar();
        await this.cargarDatos();
        if (window.actualizarModulosActivos) window.actualizarModulosActivos();
      };
    });
  },

  async guardarProyecto() {
    const estado = window.BaseDatos.obtenerEstado();
    const id = document.getElementById('proyecto-modal-id').value;
    const nombre = document.getElementById('proyecto-modal-nombre').value;
    const descripcion = document.getElementById('proyecto-modal-descripcion').value;
    const logoInput = document.getElementById('proyecto-modal-logo-base64');
    const logo = logoInput ? logoInput.value : '';

    if (id) {
      const proy = estado.proyectos.find(p => p.id === id);
      if (proy) {
        proy.nombre = nombre;
        proy.descripcion = descripcion;
        proy.logo = logo;
      }
    } else {
      const nuevoId = `proy_${Date.now()}`;
      estado.proyectos.push({ id: nuevoId, nombre, descripcion, logo });
      estado.locales.push({
        id: `loc_${Date.now()}`,
        idProyecto: nuevoId,
        nombre: 'Local Principal',
        direccion: '',
        horarioSemanal: this.crearHorarioSemanalVacio(),
        estimadoVentasMinimasZona: 0
      });
      estado.idProyectoActivo = nuevoId;
    }

    // Persistir estado global si la nube JSON esta activa
    window.BaseDatos.guardar();

    // Sincronizar en la tabla relacional de Supabase si la conexion esta activa
    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        const payloadEmpresa = {
          nombre: nombre,
          razon_social: nombre,
          logo_url: logo
        };
        if (id) payloadEmpresa.id = id;

        await window.RepositorioRelacional.guardarEmpresa(payloadEmpresa);
      } catch (err) {
        console.warn('[ModuloProyectos] Error al sincronizar empresa en tabla relacional:', err);
      }
    }

    await this.cargarDatos();
    window.cargarSelectoresContexto();
  },

  async guardarLocal() {
    const estado = window.BaseDatos.obtenerEstado();
    const id = document.getElementById('local-modal-id').value;
    const nombre = document.getElementById('local-modal-nombre').value;
    const direccion = document.getElementById('local-modal-direccion').value;
    const estimadoVentasMinimasZona = parseFloat(document.getElementById('local-modal-ventas-min').value) || 0;

    // Extraer horario semanal por día desde la grilla del formulario
    const horarioSemanal = {};
    const arregloHorariosRelacionales = [];
    const MAPA_DIAS_INT = { 'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4, 'viernes': 5, 'sabado': 6, 'domingo': 7 };

    this.DIAS_SEMANA.forEach(d => {
      const divDia = document.getElementById(`turnos-dia-${d.clave}`);
      const chk = document.querySelector(`.chk-dia-abierto[data-dia="${d.clave}"]`);
      const estaAbierto = chk ? chk.checked : false;

      const turnos = [];
      if (estaAbierto && divDia) {
        const filasTurno = divDia.querySelectorAll('.turno-input-row');
        filasTurno.forEach(row => {
          const inicio = row.querySelector('.input-hora-inicio').value;
          const fin = row.querySelector('.input-hora-fin').value;
          if (inicio && fin) {
            turnos.push({ inicio, fin });
            arregloHorariosRelacionales.push({
              dia_semana: MAPA_DIAS_INT[d.clave],
              hora_apertura: inicio,
              hora_cierre: fin
            });
          }
        });
      }

      horarioSemanal[d.clave] = {
        abierto: estaAbierto,
        turnos: turnos
      };
    });

    const datosLocal = {
      nombre,
      direccion,
      horarioSemanal,
      estimadoVentasMinimasZona
    };

    let targetLocalId = id;

    if (id) {
      const local = estado.locales.find(l => l.id === id);
      if (local) Object.assign(local, datosLocal);
    } else {
      targetLocalId = `loc_${Date.now()}`;
      datosLocal.id = targetLocalId;
      datosLocal.idProyecto = estado.idProyectoActivo;
      estado.locales.push(datosLocal);
      estado.idLocalActivo = datosLocal.id;
    }

    // Persistir localmente
    window.BaseDatos.guardar();

    // Sincronizar en la tabla relacional 'locales' y 'horarios_locales' de Supabase
    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        const payloadLocal = {
          empresa_id: estado.idProyectoActivo || 'e0000000-0000-4000-8000-000000000001',
          nombre: nombre,
          direccion: direccion
        };
        if (id) payloadLocal.id = id;

        const localRelacional = await window.RepositorioRelacional.guardarLocal(payloadLocal);

        if (localRelacional && localRelacional.id) {
          await window.RepositorioRelacional.guardarHorariosLocal(localRelacional.id, arregloHorariosRelacionales);
        }
      } catch (err) {
        console.warn('[ModuloProyectos] Error al guardar local en tabla relacional:', err);
      }
    }

    await this.cargarDatos();
    window.cargarSelectoresContexto();
    if (window.ModuloPersonal) window.ModuloPersonal.cargarDatos();
  }
};

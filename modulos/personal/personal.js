/**
 * personal.js - Controlador del Módulo de Personal, Roles y Análisis de Brecha Horaria
 * El sueldo del Rol se carga como VALOR POR HORA.
 * El sueldo mensual de cada empleado se calcula: valorHora × totalHorasDiarias × díasLaboralesMes.
 */

window.ModuloPersonal = {
  roles: [],
  empleados: [],

  DIAS_LABORALES_MES: 26,

  DIAS_SEMANA: [
    { num: 1, clave: 'lunes', nombre: 'Lunes' },
    { num: 2, clave: 'martes', nombre: 'Martes' },
    { num: 3, clave: 'miercoles', nombre: 'Miércoles' },
    { num: 4, clave: 'jueves', nombre: 'Jueves' },
    { num: 5, clave: 'viernes', nombre: 'Viernes' },
    { num: 6, clave: 'sabado', nombre: 'Sábado' },
    { num: 7, clave: 'domingo', nombre: 'Domingo' }
  ],

  inicializar() {
    this.cargarDatos();
    this.configurarEventos();
  },

  async cargarDatos() {
    const estado = window.BaseDatos.obtenerEstado();
    const localId = estado.idLocalActivo;
    const empresaId = estado.idProyectoActivo;

    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        // 1. Cargar Roles a nivel Empresa desde la base de datos real
        if (empresaId) {
          const rolesRel = await window.RepositorioRelacional.obtenerRolesEmpresa(empresaId);
          this.roles = (rolesRel || []).map(r => ({
            id: r.id,
            idProyecto: r.empresa_id || empresaId,
            nombre: r.nombre,
            valorHora: parseFloat(r.tarifa_hora || r.valor_hora || 0),
            sueldoNeto: parseFloat(r.tarifa_hora || r.valor_hora || 0)
          }));
          estado.roles = this.roles;
        }

        // 2. Cargar Empleados desde la base de datos real
        if (localId) {
          const empsRel = await window.RepositorioRelacional.obtenerEmpleadosEmpresa(localId);
          this.empleados = (empsRel || []).map(e => ({
            id: e.id,
            nombre: e.nombre_completo || e.nombre,
            legajo: e.legajo_codigo || 'LEG-001',
            idRol: e.rol_id || (this.roles.length > 0 ? this.roles[0].id : null),
            tipoContrato: e.tipo_contrato || 'Jornada Completa',
            sueldoHora: parseFloat(e.tarifa_hora || e.sueldo_hora || 0),
            turnos: (e.horarios_empleados || []).map(h => {
              const hIni = (h.hora_entrada || h.hora_desde || '').substring(0, 5);
              const hFin = (h.hora_salida || h.hora_hasta || '').substring(0, 5);
              const [hI, mI] = (hIni || '07:00').split(':').map(Number);
              const [hF, mF] = (hFin || '15:00').split(':').map(Number);
              let totalHoras = (hF + mF / 60) - (hI + mI / 60);
              if (totalHoras <= 0) totalHoras += 24;
              return {
                dia_semana: h.dia_semana,
                dia: h.dia_semana,
                horaInicio: hIni,
                horaFin: hFin,
                totalHoras
              };
            })
          }));
          estado.empleados = this.empleados;
        }
      } catch (err) {
        console.warn('[ModuloPersonal] Error al cargar desde Supabase:', err);
      }
    } else {
      this.roles = estado.roles.filter(r => r.idProyecto === empresaId || r.idLocal === localId || !r.idProyecto);
      this.empleados = window.BaseDatos.obtenerEmpleadosLocalActivo();
    }

    this.renderizarRoles();
    this.renderizarTablaEmpleados();
    this.calcularBrechaHoraria();
  },

  obtenerValorHora(rol) {
    if (!rol) return 0;
    return rol.valorHora !== undefined ? rol.valorHora : (rol.sueldoNeto || 0);
  },

  calcularSueldoMensual(emp) {
    const rol = this.roles.find(r => r.id === emp.idRol);
    const valorHora = this.obtenerValorHora(rol);

    let totalHorasSemana = 0;
    if (emp.turnos && emp.turnos.length > 0) {
      emp.turnos.forEach(t => {
        totalHorasSemana += (t.totalHoras || 0);
      });
    }

    const horasDiariasPromedio = totalHorasSemana / 6;
    return Math.round(valorHora * horasDiariasPromedio * this.DIAS_LABORALES_MES);
  },

  renderizarRoles() {
    const contenedor = document.getElementById('contenedor-roles');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (this.roles.length === 0) {
      contenedor.innerHTML = '<span style="font-size: 0.85rem; color: var(--color-texto-secundario);">No hay roles definidos aún.</span>';
      return;
    }

    this.roles.forEach(rol => {
      const valorHora = this.obtenerValorHora(rol);
      const tag = document.createElement('div');
      tag.style.cssText = 'background-color: var(--color-fondo-pagina); border: 1px solid var(--color-borde); padding: 0.4rem 0.75rem; border-radius: 6px; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;';
      
      const elNombre = document.createElement('span');
      elNombre.style.fontWeight = '600';
      elNombre.textContent = rol.nombre;

      const elSueldo = document.createElement('span');
      elSueldo.style.cssText = 'color: var(--color-primario); font-weight: 700;';
      elSueldo.textContent = `$ ${valorHora.toLocaleString('es-AR')}/hs`;

      // Botón Editar Rol
      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.style.cssText = 'background: none; border: none; cursor: pointer; color: var(--color-texto-secundario); font-size: 0.85rem; padding: 2px 4px; border-radius: 4px;';
      btnEdit.title = 'Editar Rol';
      btnEdit.textContent = '✏️';
      btnEdit.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const modalTitulo = document.getElementById('modal-rol-titulo');
        if (modalTitulo) modalTitulo.textContent = 'Editar Rol de Trabajo';
        document.getElementById('rol-id').value = rol.id;
        document.getElementById('rol-nombre').value = rol.nombre;
        document.getElementById('rol-sueldo').value = valorHora;
        document.getElementById('modal-rol').classList.add('activo');
      };

      // Botón Eliminar Rol
      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.style.cssText = 'background: none; border: none; cursor: pointer; color: var(--color-semaforo-rojo); font-size: 0.85rem; font-weight: bold; padding: 2px 4px; border-radius: 4px;';
      btnDel.title = 'Eliminar Rol';
      btnDel.textContent = '🗑️';
      btnDel.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await this.eliminarRol(rol.id);
      };

      tag.appendChild(elNombre);
      tag.appendChild(elSueldo);
      tag.appendChild(btnEdit);
      tag.appendChild(btnDel);

      contenedor.appendChild(tag);
    });
  },

  async eliminarRol(id) {
    const rolExistente = this.roles.find(r => r.id === id);
    const nombreRol = rolExistente ? rolExistente.nombre : 'este rol';
    if (!confirm(`¿Estás seguro de eliminar el rol "${nombreRol}"?`)) return;

    const estado = window.BaseDatos.obtenerEstado();
    estado.roles = estado.roles.filter(r => r.id !== id);
    window.BaseDatos.guardar();

    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        await window.RepositorioRelacional.eliminarRol(id);
      } catch (err) {
        console.warn('[ModuloPersonal] Error al eliminar rol relacional:', err);
      }
    }

    await this.cargarDatos();
  },

  renderizarTablaEmpleados() {
    const tbody = document.getElementById('tabla-empleados-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (this.empleados.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--color-texto-secundario);">
            No hay empleados cargados en este local.
          </td>
        </tr>
      `;
      return;
    }

    this.empleados.forEach(emp => {
      const rol = this.roles.find(r => r.id === emp.idRol);
      const nombreRol = rol ? rol.nombre : 'Sin Rol';
      const valorHora = this.obtenerValorHora(rol);
      const sueldoMensual = this.calcularSueldoMensual(emp);
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--color-borde)';

      let turnosTexto = 'Sin días asignados';
      let totalHorasSemana = 0;

      if (emp.turnos && emp.turnos.length > 0) {
        const MAPA_DIAS_CORTOS = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom' };
        const gruposHorarios = {};

        emp.turnos.forEach(t => {
          const diaNum = t.dia_semana || t.dia;
          const horarioKey = `${t.horaInicio} a ${t.horaFin}`;
          if (!gruposHorarios[horarioKey]) gruposHorarios[horarioKey] = [];
          if (MAPA_DIAS_CORTOS[diaNum]) gruposHorarios[horarioKey].push(MAPA_DIAS_CORTOS[diaNum]);
          totalHorasSemana += (t.totalHoras || 0);
        });

        const partes = [];
        Object.keys(gruposHorarios).forEach(keyHorario => {
          const diasStr = gruposHorarios[keyHorario].join(', ');
          partes.push(`<strong>${diasStr}:</strong> ${keyHorario}`);
        });

        turnosTexto = `${partes.join(' | ')} <span style="font-weight: 700; color: var(--color-primario);">(${totalHorasSemana} hs/sem)</span>`;
      }

      tr.innerHTML = `
        <td style="padding: 0.75rem 1rem; font-weight: 600;">${emp.nombre}</td>
        <td style="padding: 0.75rem 1rem;"><span style="background-color: var(--color-primario-suave); color: var(--color-primario); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${nombreRol}</span></td>
        <td style="padding: 0.75rem 1rem;">${emp.tipoContrato}</td>
        <td style="padding: 0.75rem 1rem;">
          <div style="font-weight: 700;">$ ${sueldoMensual.toLocaleString('es-AR')}</div>
          <div style="font-size: 0.75rem; color: var(--color-texto-secundario);">${totalHorasSemana} hs/sem × $${valorHora.toLocaleString('es-AR')}/hs</div>
        </td>
        <td style="padding: 0.75rem 1rem; font-size: 0.85rem; color: var(--color-texto-secundario);">${turnosTexto}</td>
        <td style="padding: 0.75rem 1rem; text-align: center;">
          <button class="btn btn-secundario btn-editar-empleado" data-id="${emp.id}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">✏️ Editar</button>
          <button class="btn btn-secundario btn-eliminar-empleado" data-id="${emp.id}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; color: var(--color-semaforo-rojo);">🗑️</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    this.asignarEventosEmpleados();
  },

  calcularBrechaHoraria() {
    const local = window.BaseDatos.obtenerLocalActivo();

    const totalSueldos = this.empleados.reduce((sum, e) => sum + this.calcularSueldoMensual(e), 0);
    document.getElementById('personal-total-sueldos').textContent = `$ ${totalSueldos.toLocaleString('es-AR')}`;

    if (!local) return;

    let minutosRequeridosSemana = 0;
    let minutosDescubiertosSemana = 0;
    let diasOperativosComercio = 0;

    const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const MAPA_DIAS_INT = { 'lunes': 1, 'martes': 2, 'miercoles': 3, 'jueves': 4, 'viernes': 5, 'sabado': 6, 'domingo': 7 };

    if (local.horarioSemanal) {
      DIAS.forEach(diaKey => {
        const confDia = local.horarioSemanal[diaKey];
        const numDia = MAPA_DIAS_INT[diaKey];

        if (confDia && confDia.abierto && confDia.turnos && confDia.turnos.length > 0) {
          diasOperativosComercio++;

          confDia.turnos.forEach(tComercio => {
            const [cIniH, cIniM] = tComercio.inicio.split(':').map(Number);
            const [cFinH, cFinM] = tComercio.fin.split(':').map(Number);

            let mIniC = cIniH * 60 + cIniM;
            let mFinC = cFinH * 60 + cFinM;
            if (mFinC <= mIniC) mFinC += 24 * 60;

            const duracionTurnoComercioMin = mFinC - mIniC;
            minutosRequeridosSemana += duracionTurnoComercioMin;

            const minutosCubiertos = new Array(duracionTurnoComercioMin).fill(0);

            this.empleados.forEach(emp => {
              (emp.turnos || []).forEach(tEmp => {
                const diaEmp = tEmp.dia_semana || tEmp.dia;
                if (diaEmp && diaEmp !== numDia) return; // Solo cuenta cobertura si el empleado trabaja este día

                if (!tEmp.horaInicio || !tEmp.horaFin) return;
                const [eIniH, eIniM] = tEmp.horaInicio.split(':').map(Number);
                const [eFinH, eFinM] = tEmp.horaFin.split(':').map(Number);

                let mIniE = eIniH * 60 + eIniM;
                let mFinE = eFinH * 60 + eFinM;
                if (mFinE <= mIniE) mFinE += 24 * 60;

                const inicioRelativo = Math.max(mIniE, mIniC) - mIniC;
                const finRelativo = Math.min(mFinE, mFinC) - mIniC;

                for (let i = inicioRelativo; i < finRelativo; i++) {
                  if (i >= 0 && i < duracionTurnoComercioMin) {
                    minutosCubiertos[i]++;
                  }
                }
              });
            });

            minutosDescubiertosSemana += minutosCubiertos.filter(c => c === 0).length;
          });
        }
      });
    }

    const horasRequeridasSemana = Math.round(minutosRequeridosSemana / 60);

    let horasCubiertasTotalesSemana = 0;
    this.empleados.forEach(emp => {
      (emp.turnos || []).forEach(t => {
        horasCubiertasTotalesSemana += (t.totalHoras || 0);
      });
    });

    document.getElementById('personal-horario-local').textContent = `${diasOperativosComercio} días de atención`;
    document.getElementById('personal-horas-cubiertas').textContent = `${horasCubiertasTotalesSemana} hs / sem (Req: ${horasRequeridasSemana} hs)`;

    const elemBrecha = document.getElementById('personal-estado-brecha');
    if (minutosDescubiertosSemana === 0) {
      elemBrecha.textContent = '✓ Cobertura Completa';
      elemBrecha.style.color = 'var(--color-semaforo-verde-oscuro)';
    } else {
      const horasFaltantesSemana = (minutosDescubiertosSemana / 60);
      const hsFaltaFormateado = horasFaltantesSemana % 1 === 0 ? horasFaltantesSemana : horasFaltantesSemana.toFixed(1);
      elemBrecha.textContent = `⚠️ Faltan ${hsFaltaFormateado} hs/sem sin cubrir`;
      elemBrecha.style.color = 'var(--color-semaforo-naranja)';
    }
  },

  configurarFormularioEmpleado(turnosExistentes = []) {
    const contenedor = document.getElementById('contenedor-horarios-empleado-dias');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    const mapaTurnos = {};
    if (turnosExistentes && turnosExistentes.length > 0) {
      turnosExistentes.forEach(t => {
        const diaNum = t.dia_semana || t.dia;
        if (diaNum) {
          mapaTurnos[diaNum] = {
            activo: true,
            horaInicio: t.horaInicio || t.inicio || '07:00',
            horaFin: t.horaFin || t.fin || '15:00'
          };
        }
      });
    }

    this.DIAS_SEMANA.forEach(d => {
      // Por defecto para nuevo empleado: Lunes a Viernes (1 a 5) activos
      const esDefectoActivo = turnosExistentes.length === 0 ? (d.num <= 5) : false;
      const conf = mapaTurnos[d.num] || { activo: esDefectoActivo, horaInicio: '07:00', horaFin: '15:00' };

      const row = document.createElement('div');
      row.className = 'emp-dia-row';
      row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; background-color: var(--color-tarjeta); padding: 0.35rem 0.5rem; border-radius: 6px; border: 1px solid var(--color-borde); font-size: 0.82rem;';

      const label = document.createElement('label');
      label.style.cssText = 'font-weight: 600; display: flex; align-items: center; gap: 0.4rem; cursor: pointer; min-width: 100px; color: var(--color-texto-principal);';
      label.innerHTML = `
        <input type="checkbox" class="chk-emp-dia" data-dia="${d.num}" ${conf.activo ? 'checked' : ''}>
        ${d.nombre}
      `;

      const divTimes = document.createElement('div');
      divTimes.style.cssText = `display: ${conf.activo ? 'flex' : 'none'}; align-items: center; gap: 0.4rem;`;

      const selectInicio = this.generarSelectHoras('input-emp-hora-inicio', d.num, conf.horaInicio);
      const selectFin = this.generarSelectHoras('input-emp-hora-fin', d.num, conf.horaFin);

      const spanDesde = document.createElement('span');
      spanDesde.style.color = 'var(--color-texto-secundario)';
      spanDesde.textContent = 'Desde:';

      const spanHasta = document.createElement('span');
      spanHasta.style.color = 'var(--color-texto-secundario)';
      spanHasta.textContent = 'Hasta:';

      divTimes.appendChild(spanDesde);
      divTimes.appendChild(selectInicio);
      divTimes.appendChild(spanHasta);
      divTimes.appendChild(selectFin);

      row.appendChild(label);
      row.appendChild(divTimes);

      const chk = label.querySelector('.chk-emp-dia');
      chk.addEventListener('change', (e) => {
        divTimes.style.display = e.target.checked ? 'flex' : 'none';
        this.actualizarPreviewSueldo();
      });

      selectInicio.addEventListener('change', () => this.actualizarPreviewSueldo());
      selectFin.addEventListener('change', () => this.actualizarPreviewSueldo());

      contenedor.appendChild(row);
    });

    const btnReplicar = document.getElementById('btn-copiar-horario-empleado');
    if (btnReplicar) {
      btnReplicar.onclick = () => this.replicarPrimerHorarioEmpleado();
    }
  },

  generarSelectHoras(clase, diaNum, valorSeleccionado) {
    const select = document.createElement('select');
    select.className = clase;
    select.setAttribute('data-dia', diaNum);
    select.style.cssText = 'padding: 0.2rem 0.4rem; border: 1px solid var(--color-borde); border-radius: 4px; font-size: 0.8rem; font-weight: 600; background-color: var(--color-tarjeta); color: var(--color-texto-principal); cursor: pointer;';

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

  replicarPrimerHorarioEmpleado() {
    const chks = document.querySelectorAll('.chk-emp-dia');
    let primerInicio = null;
    let primerFin = null;

    chks.forEach(chk => {
      if (chk.checked && !primerInicio) {
        const diaNum = chk.getAttribute('data-dia');
        const selIni = document.querySelector(`.input-emp-hora-inicio[data-dia="${diaNum}"]`);
        const selFin = document.querySelector(`.input-emp-hora-fin[data-dia="${diaNum}"]`);
        if (selIni && selFin) {
          primerInicio = selIni.value;
          primerFin = selFin.value;
        }
      }
    });

    if (!primerInicio || !primerFin) return;

    chks.forEach(chk => {
      if (chk.checked) {
        const diaNum = chk.getAttribute('data-dia');
        const selIni = document.querySelector(`.input-emp-hora-inicio[data-dia="${diaNum}"]`);
        const selFin = document.querySelector(`.input-emp-hora-fin[data-dia="${diaNum}"]`);
        if (selIni) selIni.value = primerInicio;
        if (selFin) selFin.value = primerFin;
      }
    });

    this.actualizarPreviewSueldo();
  },

  actualizarPreviewSueldo() {
    const preview = document.getElementById('empleado-sueldo-preview');
    if (!preview) return;

    const idRol = document.getElementById('empleado-rol')?.value;
    const rol = this.roles.find(r => r.id === idRol);
    const valorHora = this.obtenerValorHora(rol);

    let totalHorasSemana = 0;
    let diasCubiertos = 0;

    this.DIAS_SEMANA.forEach(d => {
      const chk = document.querySelector(`.chk-emp-dia[data-dia="${d.num}"]`);
      if (chk && chk.checked) {
        diasCubiertos++;
        const selIni = document.querySelector(`.input-emp-hora-inicio[data-dia="${d.num}"]`);
        const selFin = document.querySelector(`.input-emp-hora-fin[data-dia="${d.num}"]`);
        const hIniVal = selIni ? selIni.value : '07:00';
        const hFinVal = selFin ? selFin.value : '15:00';

        const [hIni, mIni] = hIniVal.split(':').map(Number);
        const [hFin, mFin] = hFinVal.split(':').map(Number);
        let tHoras = (hFin + mFin / 60) - (hIni + mIni / 60);
        if (tHoras <= 0) tHoras += 24;
        totalHorasSemana += tHoras;
      }
    });

    const horasDiariasPromedio = totalHorasSemana / 6;
    const sueldoEstimado = Math.round(valorHora * horasDiariasPromedio * this.DIAS_LABORALES_MES);

    preview.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>Sueldo Mensual Estimado:</span>
        <span style="font-weight: 800; font-size: 1.1rem; color: var(--color-primario);">$ ${sueldoEstimado.toLocaleString('es-AR')}</span>
      </div>
      <div style="font-size: 0.75rem; color: var(--color-texto-secundario); margin-top: 0.25rem;">
        $${valorHora.toLocaleString('es-AR')}/hs × ${diasCubiertos} días/sem (${totalHorasSemana} hs/sem) × ${this.DIAS_LABORALES_MES} días/mes
      </div>
    `;
  },

  cargarSelectRoles() {
    const select = document.getElementById('empleado-rol');
    if (!select) return;

    select.innerHTML = '';
    this.roles.forEach(rol => {
      const valorHora = this.obtenerValorHora(rol);
      const opt = document.createElement('option');
      opt.value = rol.id;
      opt.textContent = `${rol.nombre} ($${valorHora.toLocaleString('es-AR')}/hs)`;
      select.appendChild(opt);
    });
  },

  configurarEventos() {
    const btnNuevoRol = document.getElementById('btn-nuevo-rol');
    const modalRol = document.getElementById('modal-rol');
    const btnCerrarRol = document.getElementById('btn-cerrar-modal-rol');
    const btnCancelarRol = document.getElementById('btn-cancelar-modal-rol');
    const formRol = document.getElementById('form-rol');

    const btnNuevoEmp = document.getElementById('btn-nuevo-empleado');
    const modalEmp = document.getElementById('modal-empleado');
    const btnCerrarEmp = document.getElementById('btn-cerrar-modal-empleado');
    const btnCancelarEmp = document.getElementById('btn-cancelar-modal-empleado');
    const formEmp = document.getElementById('form-empleado');

    if (btnNuevoRol) {
      btnNuevoRol.addEventListener('click', () => {
        const modalTitulo = document.getElementById('modal-rol-titulo');
        if (modalTitulo) modalTitulo.textContent = 'Nuevo Rol de Trabajo';
        formRol.reset();
        document.getElementById('rol-id').value = '';
        modalRol.classList.add('activo');
      });
    }

    if (btnNuevoEmp) {
      btnNuevoEmp.addEventListener('click', () => {
        document.getElementById('modal-empleado-titulo').textContent = 'Nuevo Empleado';
        this.cargarSelectRoles();
        formEmp.reset();
        document.getElementById('empleado-id').value = '';
        this.configurarFormularioEmpleado([]);
        this.actualizarPreviewSueldo();
        modalEmp.classList.add('activo');
      });
    }

    if (btnCerrarRol) btnCerrarRol.addEventListener('click', () => modalRol.classList.remove('activo'));
    if (btnCancelarRol) btnCancelarRol.addEventListener('click', () => modalRol.classList.remove('activo'));
    if (btnCerrarEmp) btnCerrarEmp.addEventListener('click', () => modalEmp.classList.remove('activo'));
    if (btnCancelarEmp) btnCancelarEmp.addEventListener('click', () => modalEmp.classList.remove('activo'));

    if (formRol) {
      formRol.addEventListener('submit', (e) => {
        e.preventDefault();
        this.guardarRol();
        modalRol.classList.remove('activo');
      });
    }

    if (formEmp) {
      formEmp.addEventListener('submit', (e) => {
        e.preventDefault();
        this.guardarEmpleado();
        modalEmp.classList.remove('activo');
      });
    }

    const selectRolEmp = document.getElementById('empleado-rol');
    if (selectRolEmp) {
      selectRolEmp.addEventListener('change', () => this.actualizarPreviewSueldo());
    }
  },

  asignarEventosEmpleados() {
    document.querySelectorAll('.btn-editar-empleado').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const emp = this.empleados.find(e => e.id === id);
        if (emp) {
          this.cargarSelectRoles();
          document.getElementById('empleado-id').value = emp.id;
          document.getElementById('empleado-nombre').value = emp.nombre;
          document.getElementById('empleado-rol').value = emp.idRol;
          document.getElementById('empleado-contrato').value = emp.tipoContrato;
          this.configurarFormularioEmpleado(emp.turnos || []);
          this.actualizarPreviewSueldo();
          document.getElementById('modal-empleado').classList.add('activo');
        }
      });
    });

    document.querySelectorAll('.btn-eliminar-empleado').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target.closest('[data-id]');
        const id = target ? target.getAttribute('data-id') : null;
        if (id) {
          const estado = window.BaseDatos.obtenerEstado();
          estado.empleados = estado.empleados.filter(emp => emp.id !== id);
          window.BaseDatos.guardar();
          this.cargarDatos();
          window.renderizarResumenKPIs();
        }
      });
    });
  },

  async guardarRol() {
    const estado = window.BaseDatos.obtenerEstado();
    const id = document.getElementById('rol-id') ? document.getElementById('rol-id').value : '';
    const nombre = document.getElementById('rol-nombre').value.trim();
    const valorHora = parseFloat(document.getElementById('rol-sueldo').value) || 0;

    if (!nombre) return;

    let targetId = id;

    if (id) {
      const rolExistente = estado.roles.find(r => r.id === id);
      if (rolExistente) {
        rolExistente.nombre = nombre;
        rolExistente.valorHora = valorHora;
        rolExistente.sueldoNeto = valorHora;
      }
    } else {
      targetId = `rol_${Date.now()}`;
      const nuevoRol = {
        id: targetId,
        idLocal: estado.idLocalActivo,
        idProyecto: estado.idProyectoActivo,
        nombre,
        valorHora,
        sueldoNeto: valorHora
      };
      estado.roles.push(nuevoRol);
    }

    window.BaseDatos.guardar();

    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        const payloadRol = {
          empresa_id: estado.idProyectoActivo,
          local_id: estado.idLocalActivo,
          nombre: nombre,
          tarifa_hora: valorHora,
          valor_hora: valorHora
        };
        if (id && !id.startsWith('rol_')) payloadRol.id = id;

        await window.RepositorioRelacional.guardarRol(payloadRol);
      } catch (err) {
        console.warn('[ModuloPersonal] Error al guardar rol relacional:', err);
      }
    }

    await this.cargarDatos();
  },

  async guardarEmpleado() {
    const estado = window.BaseDatos.obtenerEstado();
    const id = document.getElementById('empleado-id').value;
    const nombre = document.getElementById('empleado-nombre').value;
    const idRol = document.getElementById('empleado-rol').value;
    const tipoContrato = document.getElementById('empleado-contrato').value;

    const turnos = [];
    this.DIAS_SEMANA.forEach(d => {
      const chk = document.querySelector(`.chk-emp-dia[data-dia="${d.num}"]`);
      if (chk && chk.checked) {
        const selIni = document.querySelector(`.input-emp-hora-inicio[data-dia="${d.num}"]`);
        const selFin = document.querySelector(`.input-emp-hora-fin[data-dia="${d.num}"]`);
        const horaInicio = selIni ? selIni.value : '07:00';
        const horaFin = selFin ? selFin.value : '15:00';

        const [hIni, mIni] = horaInicio.split(':').map(Number);
        const [hFin, mFin] = horaFin.split(':').map(Number);
        let totalHoras = (hFin + mFin / 60) - (hIni + mIni / 60);
        if (totalHoras <= 0) totalHoras += 24;

        turnos.push({
          dia_semana: d.num,
          dia: d.num,
          horaInicio,
          horaFin,
          hora_entrada: horaInicio,
          hora_salida: horaFin,
          totalHoras
        });
      }
    });

    const rol = this.roles.find(r => r.id === idRol) || estado.roles.find(r => r.id === idRol);
    const valorHora = this.obtenerValorHora(rol);
    let totalHorasSemana = 0;
    turnos.forEach(t => totalHorasSemana += t.totalHoras);
    const sueldoNeto = Math.round(valorHora * (totalHorasSemana / 6) * this.DIAS_LABORALES_MES);

    let targetId = id;

    if (id) {
      const emp = estado.empleados.find(e => e.id === id);
      if (emp) {
        emp.nombre = nombre;
        emp.idRol = idRol;
        emp.tipoContrato = tipoContrato;
        emp.sueldoNeto = sueldoNeto;
        emp.turnos = turnos;
      }
    } else {
      targetId = `emp_${Date.now()}`;
      const nuevoEmp = {
        id: targetId,
        idLocal: estado.idLocalActivo,
        idRol,
        nombre,
        tipoContrato,
        sueldoNeto,
        turnos
      };
      estado.empleados.push(nuevoEmp);
    }

    window.BaseDatos.guardar();

    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        const payloadEmp = {
          local_id: estado.idLocalActivo,
          rol_id: idRol,
          nombre_completo: nombre,
          rol_puesto: rol ? rol.nombre : 'Sin Rol',
          tarifa_hora: valorHora,
          tipo_contrato: tipoContrato
        };
        if (id) payloadEmp.id = id;

        const empRel = await window.RepositorioRelacional.guardarEmpleado(payloadEmp);
        if (empRel && empRel.id) {
          await window.RepositorioRelacional.guardarHorariosEmpleado(empRel.id, turnos);
        }
      } catch (err) {
        console.warn('[ModuloPersonal] Error al guardar empleado relacional:', err);
      }
    }

    await this.cargarDatos();
    window.renderizarResumenKPIs();
  }
};

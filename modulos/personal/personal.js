/**
 * personal.js - Controlador del Módulo de Personal, Roles y Análisis de Brecha Horaria
 * El sueldo del Rol se carga como VALOR POR HORA.
 * El sueldo mensual de cada empleado se calcula: valorHora × totalHorasDiarias × díasLaboralesMes.
 */

window.ModuloPersonal = {
  roles: [],
  empleados: [],

  // Factor promedio de días laborales por mes (configurable)
  DIAS_LABORALES_MES: 26,

  inicializar() {
    this.cargarDatos();
    this.configurarEventos();
  },

  cargarDatos() {
    const estado = window.BaseDatos.obtenerEstado();
    this.roles = estado.roles.filter(r => r.idLocal === estado.idLocalActivo);
    this.empleados = window.BaseDatos.obtenerEmpleadosLocalActivo();

    this.renderizarRoles();
    this.renderizarTablaEmpleados();
    this.calcularBrechaHoraria();
  },

  /**
   * Obtiene el valor por hora de un rol.
   * Soporta tanto el campo nuevo 'valorHora' como el legacy 'sueldoNeto'.
   */
  obtenerValorHora(rol) {
    if (!rol) return 0;
    return rol.valorHora !== undefined ? rol.valorHora : (rol.sueldoNeto || 0);
  },

  /**
   * Calcula el sueldo mensual estimado de un empleado en base a:
   * valorHora del Rol × horas diarias del turno × días laborales por mes
   */
  calcularSueldoMensual(emp) {
    const rol = this.roles.find(r => r.id === emp.idRol);
    const valorHora = this.obtenerValorHora(rol);

    // Sumar las horas diarias de todos los turnos del empleado
    let horasDiarias = 0;
    if (emp.turnos && emp.turnos.length > 0) {
      emp.turnos.forEach(t => {
        horasDiarias += (t.totalHoras || 0);
      });
    }

    return Math.round(valorHora * horasDiarias * this.DIAS_LABORALES_MES);
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
      tag.style.cssText = 'background-color: var(--color-fondo-pagina); border: 1px solid var(--color-borde); padding: 0.5rem 0.75rem; border-radius: 6px; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;';
      
      const elNombre = document.createElement('span');
      elNombre.style.fontWeight = '600';
      elNombre.textContent = rol.nombre;

      const elSueldo = document.createElement('span');
      elSueldo.style.cssText = 'color: var(--color-primario); font-weight: 700;';
      elSueldo.textContent = `$ ${valorHora.toLocaleString('es-AR')}/hs`;

      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.style.cssText = 'background: none; border: none; cursor: pointer; color: var(--color-semaforo-rojo); font-size: 0.85rem; font-weight: bold; padding: 2px 6px;';
      btnDel.title = 'Eliminar Rol';
      btnDel.textContent = '✖';
      btnDel.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.eliminarRol(rol.id);
      };

      tag.appendChild(elNombre);
      tag.appendChild(elSueldo);
      tag.appendChild(btnDel);

      contenedor.appendChild(tag);
    });
  },

  eliminarRol(id) {
    const estado = window.BaseDatos.obtenerEstado();
    estado.roles = estado.roles.filter(r => r.id !== id);
    window.BaseDatos.guardar();
    this.cargarDatos();
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

      const turnosTexto = emp.turnos.map(t => `${t.nombre}: ${t.horaInicio} a ${t.horaFin} (${t.totalHoras} hs)`).join(', ');

      // Horas diarias totales
      let horasDiarias = 0;
      emp.turnos.forEach(t => horasDiarias += (t.totalHoras || 0));

      tr.innerHTML = `
        <td style="padding: 0.75rem 1rem; font-weight: 600;">${emp.nombre}</td>
        <td style="padding: 0.75rem 1rem;"><span style="background-color: var(--color-primario-suave); color: var(--color-primario); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${nombreRol}</span></td>
        <td style="padding: 0.75rem 1rem;">${emp.tipoContrato}</td>
        <td style="padding: 0.75rem 1rem;">
          <div style="font-weight: 700;">$ ${sueldoMensual.toLocaleString('es-AR')}</div>
          <div style="font-size: 0.75rem; color: var(--color-texto-secundario);">${horasDiarias} hs/día × $${valorHora.toLocaleString('es-AR')}/hs × ${this.DIAS_LABORALES_MES} días</div>
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

    // Calcular total de sueldos mensuales estimados
    const totalSueldos = this.empleados.reduce((sum, e) => sum + this.calcularSueldoMensual(e), 0);
    document.getElementById('personal-total-sueldos').textContent = `$ ${totalSueldos.toLocaleString('es-AR')}`;

    if (!local) return;

    let minutosRequeridosSemana = 0;
    let minutosDescubiertosSemana = 0;
    let diasOperativosComercio = 0;

    const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

    if (local.horarioSemanal) {
      DIAS.forEach(diaKey => {
        const confDia = local.horarioSemanal[diaKey];
        if (confDia && confDia.abierto && confDia.turnos && confDia.turnos.length > 0) {
          diasOperativosComercio++;

          confDia.turnos.forEach(tComercio => {
            const [cIniH, cIniM] = tComercio.inicio.split(':').map(Number);
            const [cFinH, cFinM] = tComercio.fin.split(':').map(Number);

            let mIniC = cIniH * 60 + cIniM;
            let mFinC = cFinH * 60 + cFinM;
            if (mFinC <= mIniC) mFinC += 24 * 60; // Trasnoche

            const duracionTurnoComercioMin = mFinC - mIniC;
            minutosRequeridosSemana += duracionTurnoComercioMin;

            const minutosCubiertos = new Array(duracionTurnoComercioMin).fill(0);

            this.empleados.forEach(emp => {
              emp.turnos.forEach(tEmp => {
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
    } else {
      // Fallback horarios simples
      const hc = local.horariosComercio || { horarioApertura: '08:00', horarioCierre: '20:00', diasPorSemana: 6 };
      diasOperativosComercio = hc.diasPorSemana || 6;
      const [hApHora, hApMin] = (hc.horarioApertura || '08:00').split(':').map(Number);
      const [hCiHora, hCiMin] = (hc.horarioCierre || '20:00').split(':').map(Number);

      let mIniC = hApHora * 60 + hApMin;
      let mFinC = hCiHora * 60 + hCiMin;
      if (mFinC <= mIniC) mFinC += 24 * 60;

      const duracionDiaria = mFinC - mIniC;
      minutosRequeridosSemana = duracionDiaria * diasOperativosComercio;

      const minutosCubiertosDiario = new Array(duracionDiaria).fill(0);
      this.empleados.forEach(emp => {
        emp.turnos.forEach(tEmp => {
          if (!tEmp.horaInicio || !tEmp.horaFin) return;
          const [eIniH, eIniM] = tEmp.horaInicio.split(':').map(Number);
          const [eFinH, eFinM] = tEmp.horaFin.split(':').map(Number);

          let mIniE = eIniH * 60 + eIniM;
          let mFinE = eFinH * 60 + eFinM;
          if (mFinE <= mIniE) mFinE += 24 * 60;

          const inicioRelativo = Math.max(mIniE, mIniC) - mIniC;
          const finRelativo = Math.min(mFinE, mFinC) - mIniC;

          for (let i = inicioRelativo; i < finRelativo; i++) {
            if (i >= 0 && i < duracionDiaria) {
              minutosCubiertosDiario[i]++;
            }
          }
        });
      });

      const descDiarios = minutosCubiertosDiario.filter(c => c === 0).length;
      minutosDescubiertosSemana = descDiarios * diasOperativosComercio;
    }

    const horasRequeridasSemana = Math.round(minutosRequeridosSemana / 60);

    let horasCubiertasTotalesSemana = 0;
    this.empleados.forEach(emp => {
      emp.turnos.forEach(t => {
        horasCubiertasTotalesSemana += (t.totalHoras * diasOperativosComercio);
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
        formRol.reset();
        document.getElementById('rol-id').value = '';
        modalRol.classList.add('activo');
      });
    }

    if (btnNuevoEmp) {
      btnNuevoEmp.addEventListener('click', () => {
        document.getElementById('modal-empleado-titulo').textContent = 'Nuevo Empleado';
        this.cargarSelectRoles();
        this.cargarSelectsHorasEmpleado('07:00', '15:00');
        formEmp.reset();
        document.getElementById('empleado-id').value = '';
        // Mostrar preview de sueldo estimado
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

    // Al cambiar rol o turno, actualizar preview de sueldo estimado
    const selectRolEmp = document.getElementById('empleado-rol');
    if (selectRolEmp) {
      selectRolEmp.addEventListener('change', () => this.actualizarPreviewSueldo());
    }

    const selInicio = document.getElementById('empleado-turno-inicio');
    const selFin = document.getElementById('empleado-turno-fin');
    if (selInicio) selInicio.addEventListener('change', () => this.actualizarPreviewSueldo());
    if (selFin) selFin.addEventListener('change', () => this.actualizarPreviewSueldo());
  },

  /**
   * Actualiza el preview de sueldo mensual estimado en el modal de empleado.
   */
  actualizarPreviewSueldo() {
    const preview = document.getElementById('empleado-sueldo-preview');
    if (!preview) return;

    const idRol = document.getElementById('empleado-rol')?.value;
    const horaInicio = document.getElementById('empleado-turno-inicio')?.value || '07:00';
    const horaFin = document.getElementById('empleado-turno-fin')?.value || '15:00';

    const rol = this.roles.find(r => r.id === idRol);
    const valorHora = this.obtenerValorHora(rol);

    // Calcular horas del turno
    const [hIni, mIni] = horaInicio.split(':').map(Number);
    const [hFin, mFin] = horaFin.split(':').map(Number);
    let totalHoras = (hFin + mFin / 60) - (hIni + mIni / 60);
    if (totalHoras <= 0) totalHoras += 24;

    const sueldoEstimado = Math.round(valorHora * totalHoras * this.DIAS_LABORALES_MES);

    preview.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>Sueldo Mensual Estimado:</span>
        <span style="font-weight: 800; font-size: 1.1rem; color: var(--color-primario);">$ ${sueldoEstimado.toLocaleString('es-AR')}</span>
      </div>
      <div style="font-size: 0.75rem; color: var(--color-texto-secundario); margin-top: 0.25rem;">
        $${valorHora.toLocaleString('es-AR')}/hs × ${totalHoras} hs/día × ${this.DIAS_LABORALES_MES} días/mes
      </div>
    `;
  },

  cargarSelectsHorasEmpleado(valorInicio = '07:00', valorFin = '15:00') {
    const selInicio = document.getElementById('empleado-turno-inicio');
    const selFin = document.getElementById('empleado-turno-fin');
    if (!selInicio || !selFin) return;

    selInicio.innerHTML = '';
    selFin.innerHTML = '';

    for (let h = 0; h < 24; h++) {
      for (let m of [0, 30]) {
        const horaStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        
        const optIni = document.createElement('option');
        optIni.value = horaStr;
        optIni.textContent = `${horaStr} hs`;
        if (horaStr === valorInicio) optIni.selected = true;
        selInicio.appendChild(optIni);

        const optFin = document.createElement('option');
        optFin.value = horaStr;
        optFin.textContent = `${horaStr} hs`;
        if (horaStr === valorFin) optFin.selected = true;
        selFin.appendChild(optFin);
      }
    }
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

          if (emp.turnos.length > 0) {
            document.getElementById('empleado-turno-nombre').value = emp.turnos[0].nombre;
            this.cargarSelectsHorasEmpleado(emp.turnos[0].horaInicio, emp.turnos[0].horaFin);
          } else {
            this.cargarSelectsHorasEmpleado('07:00', '15:00');
          }

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

  guardarRol() {
    const estado = window.BaseDatos.obtenerEstado();
    const nombre = document.getElementById('rol-nombre').value;
    const valorHora = parseFloat(document.getElementById('rol-sueldo').value) || 0;

    const nuevoRol = {
      id: `rol_${Date.now()}`,
      idLocal: estado.idLocalActivo,
      nombre,
      valorHora,
      sueldoNeto: valorHora // legacy compatibility
    };

    estado.roles.push(nuevoRol);
    window.BaseDatos.guardar();
    this.cargarDatos();
  },

  guardarEmpleado() {
    const estado = window.BaseDatos.obtenerEstado();
    const id = document.getElementById('empleado-id').value;
    const nombre = document.getElementById('empleado-nombre').value;
    const idRol = document.getElementById('empleado-rol').value;
    const tipoContrato = document.getElementById('empleado-contrato').value;

    const turnoNombre = document.getElementById('empleado-turno-nombre').value || 'Turno';
    const horaInicio = document.getElementById('empleado-turno-inicio').value || '08:00';
    const horaFin = document.getElementById('empleado-turno-fin').value || '16:00';

    // Calcular horas del turno
    const [hIni, mIni] = horaInicio.split(':').map(Number);
    const [hFin, mFin] = horaFin.split(':').map(Number);
    let totalHoras = (hFin + mFin / 60) - (hIni + mIni / 60);
    if (totalHoras <= 0) totalHoras += 24;

    const turnos = [{ nombre: turnoNombre, horaInicio, horaFin, totalHoras }];

    // Calcular sueldo mensual
    const rol = estado.roles.find(r => r.id === idRol);
    const valorHora = this.obtenerValorHora(rol);
    const sueldoNeto = Math.round(valorHora * totalHoras * this.DIAS_LABORALES_MES);

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
      const nuevoEmp = {
        id: `emp_${Date.now()}`,
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
    this.cargarDatos();
    window.renderizarResumenKPIs();
  }
};

/**
 * analisisReal.js - Controlador para carga de ventas reales, comparación vs simulador y diagnóstico comercial
 */

window.ModuloAnalisisReal = {
  inicializar() {
    this.configurarFechaPorDefecto();
    this.configurarFormulario();
    this.cargarDatos();
  },

  configurarFechaPorDefecto() {
    const inputFecha = document.getElementById('real-fecha');
    if (inputFecha && !inputFecha.value) {
      inputFecha.value = new Date().toISOString().split('T')[0];
    }
  },

  configurarFormulario() {
    const form = document.getElementById('form-registro-real');
    if (!form) return;

    form.onsubmit = (e) => {
      e.preventDefault();
      const id = document.getElementById('real-registro-id').value;
      const fecha = document.getElementById('real-fecha').value;
      const monto = parseFloat(document.getElementById('real-monto').value) || 0;
      const notas = document.getElementById('real-notas').value.trim();
      const localActivo = window.BaseDatos.obtenerLocalActivo();

      if (!localActivo) return;

      const registro = {
        id: id || undefined,
        idLocal: localActivo.id,
        fecha,
        montoFacturado: monto,
        notas
      };

      window.BaseDatos.guardarRegistroReal(registro);
      form.reset();
      document.getElementById('real-registro-id').value = '';
      this.configurarFechaPorDefecto();
      this.cargarDatos();
      if (window.renderizarResumenKPIs) window.renderizarResumenKPIs();
    };
  },

  cargarDatos() {
    const registros = window.BaseDatos.obtenerRegistrosRealesLocalActivo();
    this.renderizarTabla(registros);
    this.calcularYRenderizarComparacion(registros);
  },

  renderizarTabla(registros) {
    const tbody = document.getElementById('tabla-registros-reales-body');
    const contador = document.getElementById('contador-registros-reales');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (contador) contador.textContent = `${registros.length} registro${registros.length === 1 ? '' : 's'}`;

    if (registros.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 1.5rem; color: var(--color-texto-secundario);">
            No hay registros de ventas reales cargados para este local.
          </td>
        </tr>
      `;
      return;
    }

    // Ordenar de más reciente a más antiguo
    const ordenados = [...registros].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;
    let facturacionDiariaObjetivo = 0;
    if (window.ModuloSimulador && window.ModuloSimulador.calcularTotalesParaMultiplicador) {
      const datosSim = window.ModuloSimulador.calcularTotalesParaMultiplicador(1.0);
      let factorDias = 26;
      const local = window.BaseDatos.obtenerLocalActivo();
      if (local && local.horariosComercio) factorDias = local.horariosComercio.diasPorSemana * 4.33;
      facturacionDiariaObjetivo = datosSim.facturacionTotal / factorDias;
    }

    ordenados.forEach(reg => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--color-borde)';

      const difVeto = facturacionDiariaObjetivo > 0 ? reg.montoFacturado - facturacionDiariaObjetivo : 0;
      const esPositivo = difVeto >= 0;

      const partesFecha = reg.fecha.split('-');
      const fechaLegible = partesFecha.length === 3 ? `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0]}` : reg.fecha;

      tr.innerHTML = `
        <td style="padding: 0.6rem 0.8rem; font-weight: 600;">${fechaLegible}</td>
        <td style="padding: 0.6rem 0.8rem; font-weight: 800; color: var(--color-texto-principal);">${fMon(reg.montoFacturado)}</td>
        <td style="padding: 0.6rem 0.8rem;">
          <span style="font-weight: 700; color: ${esPositivo ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)'}; font-size: 0.8rem;">
            ${esPositivo ? '+' : ''}${fMon(difVeto)}
          </span>
        </td>
        <td style="padding: 0.6rem 0.8rem; color: var(--color-texto-secundario); font-size: 0.8rem;">${reg.notas || '-'}</td>
        <td style="padding: 0.6rem 0.8rem; text-align: center;">
          <button class="btn btn-secundario btn-eliminar-real" data-id="${reg.id}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; color: var(--color-semaforo-rojo);">🗑️</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-eliminar-real').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('¿Eliminar este registro de venta real?')) {
          window.BaseDatos.eliminarRegistroReal(id);
          this.cargarDatos();
          if (window.renderizarResumenKPIs) window.renderizarResumenKPIs();
        }
      };
    });
  },

  calcularYRenderizarComparacion(registros) {
    const fMon = (v) => `$ ${Math.round(v).toLocaleString('es-AR')}`;

    let factSimuladaDiaria = 0;
    let factSimuladaMensual = 0;
    let costosFijosTotales = 0;
    let porcentajeMargenBruto = 40;

    if (window.ModuloSimulador && window.ModuloSimulador.calcularTotalesParaMultiplicador) {
      const sim = window.ModuloSimulador.calcularTotalesParaMultiplicador(1.0);
      factSimuladaMensual = sim.facturacionTotal;
      costosFijosTotales = sim.costosFijosTotales;
      porcentajeMargenBruto = sim.facturacionTotal > 0 ? (sim.margenBrutoTotal / sim.facturacionTotal) * 100 : 40;

      let factorDias = 26;
      const local = window.BaseDatos.obtenerLocalActivo();
      if (local && local.horariosComercio) factorDias = local.horariosComercio.diasPorSemana * 4.33;

      factSimuladaDiaria = factSimuladaMensual / factorDias;
    }

    const totalFacturadoReal = registros.reduce((sum, r) => sum + r.montoFacturado, 0);
    const cantDias = registros.length;
    const promedioDiarioReal = cantDias > 0 ? totalFacturadoReal / cantDias : 0;

    let factorDiasMes = 26;
    const local = window.BaseDatos.obtenerLocalActivo();
    if (local && local.horariosComercio) factorDiasMes = local.horariosComercio.diasPorSemana * 4.33;

    const factMensualProyectadaReal = promedioDiarioReal * factorDiasMes;
    const costoVarProyectadoReal = factMensualProyectadaReal * (1 - (porcentajeMargenBruto / 100));
    const margenBrutoProyectadoReal = factMensualProyectadaReal - costoVarProyectadoReal;
    const resultadoNetoProyectadoReal = margenBrutoProyectadoReal - costosFijosTotales;

    const diferenciaDiaria = promedioDiarioReal - factSimuladaDiaria;
    const variacionPct = factSimuladaDiaria > 0 ? ((promedioDiarioReal - factSimuladaDiaria) / factSimuladaDiaria) * 100 : 0;

    document.getElementById('real-facturado-acumulado').textContent = fMon(totalFacturadoReal);
    document.getElementById('real-dias-registrados').textContent = `${cantDias} día${cantDias === 1 ? '' : 's'} cargado${cantDias === 1 ? '' : 's'}`;

    document.getElementById('real-promedio-diario').textContent = `${fMon(promedioDiarioReal)} / día`;
    document.getElementById('real-variacion-diaria-pct').textContent = `vs ${fMon(factSimuladaDiaria)} simulado/día`;

    const elemNetoReal = document.getElementById('real-neto-proyectado');
    elemNetoReal.textContent = fMon(resultadoNetoProyectadoReal);
    elemNetoReal.style.color = resultadoNetoProyectadoReal >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)';
    document.getElementById('real-neto-proyectado-sub').textContent = `Proyección mensual real (${Math.round(factorDiasMes)} días)`;

    const elemDif = document.getElementById('real-diferencia-simulado');
    elemDif.textContent = `${diferenciaDiaria >= 0 ? '+' : ''}${fMon(diferenciaDiaria)} / día`;
    elemDif.style.color = diferenciaDiaria >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)';

    const elemPct = document.getElementById('real-diferencia-pct');
    elemPct.textContent = `${variacionPct >= 0 ? '+' : ''}${variacionPct.toFixed(1)}% vs simulación`;
    elemPct.style.color = variacionPct >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)';

    const elemBadge = document.getElementById('diagnostico-real-badge');
    const elemTitulo = document.getElementById('diagnostico-real-titulo');
    const elemDesc = document.getElementById('diagnostico-real-descripcion');
    const elemProm = document.getElementById('diagnostico-promedio-real');
    const elemCont = document.getElementById('diagnostico-real-contenedor');

    elemProm.textContent = `${fMon(promedioDiarioReal)} / día`;

    if (cantDias === 0) {
      elemCont.style.borderLeftColor = 'var(--color-primario)';
      elemBadge.style.backgroundColor = 'var(--color-primario-suave)';
      elemBadge.style.color = 'var(--color-primario)';
      elemBadge.textContent = 'ℹ️ Sin Datos Reales';
      elemTitulo.textContent = 'Ingresá la facturación real para activar el análisis';
      elemDesc.textContent = 'Cargá los montos diarios cobrados en tu local para compararlos en tiempo real contra el simulador.';
    } else if (resultadoNetoProyectadoReal < 0) {
      elemCont.style.borderLeftColor = 'var(--color-semaforo-rojo)';
      elemBadge.style.backgroundColor = 'var(--color-semaforo-rojo-suave)';
      elemBadge.style.color = 'var(--color-semaforo-rojo)';
      elemBadge.textContent = '🔴 En Zona de Pérdida Real';
      elemTitulo.textContent = `A este ritmo proyectás una PÉRDIDA de ${fMon(Math.abs(resultadoNetoProyectadoReal))} al mes`;
      elemDesc.textContent = `Tu promedio diario real (${fMon(promedioDiarioReal)}) está un ${Math.abs(variacionPct).toFixed(1)}% por debajo de la simulación. Necesitás facturar más para cubrir los $ ${Math.round(costosFijosTotales).toLocaleString('es-AR')} de costos fijos + sueldos.`;
    } else if (variacionPct >= 0) {
      elemCont.style.borderLeftColor = 'var(--color-semaforo-verde-oscuro)';
      elemBadge.style.backgroundColor = 'var(--color-semaforo-verde-oscuro-suave)';
      elemBadge.style.color = 'var(--color-semaforo-verde-oscuro)';
      elemBadge.textContent = '❇️ Superando Proyección Simulada';
      elemTitulo.textContent = `¡Excelente! Rendimiento real un ${variacionPct.toFixed(1)}% SUPERIOR a la simulación`;
      elemDesc.textContent = `Tu facturación promedio real genera una GANANCIA NETA estimada de ${fMon(resultadoNetoProyectadoReal)} mensuales tras pagar todos los costos fijos y sueldos.`;
    } else {
      elemCont.style.borderLeftColor = 'var(--color-semaforo-amarillo)';
      elemBadge.style.backgroundColor = 'var(--color-semaforo-amarillo-suave)';
      elemBadge.style.color = '#b45309';
      elemBadge.textContent = '🟨 Rentable pero por debajo del Simulador';
      elemTitulo.textContent = `Proyectás GANANCIA NETA de ${fMon(resultadoNetoProyectadoReal)}/mes (un ${Math.abs(variacionPct).toFixed(1)}% menor a lo simulado)`;
      elemDesc.textContent = `El negocio es sustentable y genera ganancias, pero la recaudación real no alcanza el volumen óptimo proyectado en la simulación.`;
    }
  }
};

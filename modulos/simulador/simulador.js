/**
 * simulador.js - Controlador del Módulo de Simulador de Ventas & Semáforo de Equilibrio (5 Franjas + Comparador de Escenarios)
 */

window.ModuloSimulador = {
  productos: [],
  categorias: [],
  escenarioActivo: 'moderado', // 'pesimista' (-20%), 'moderado' (100%), 'optimista' (+25%)
  pestanaProyeccionActiva: 'diaria', // 'diaria', 'semanal', 'mensual'

  inicializar() {
    this.cargarDatos();
    this.configurarEventosEscenarios();
    this.configurarEventosProyecciones();
  },

  cargarDatos() {
    const estado = window.BaseDatos.obtenerEstado();
    this.categorias = estado.categoriasProductos.filter(c => c.idProyecto === estado.idProyectoActivo);
    this.productos = window.BaseDatos.obtenerProductosProyectoActivo();

    this.renderizarTablaSimulacion();
    this.calcularYRenderizarEquilibrio();
  },

  configurarEventosEscenarios() {
    document.querySelectorAll('.btn-escenario').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-escenario').forEach(b => {
          b.classList.remove('activo', 'btn-primario');
          b.classList.add('btn-secundario');
        });

        const target = e.currentTarget;
        target.classList.remove('btn-secundario');
        target.classList.add('activo', 'btn-primario');

        this.escenarioActivo = target.getAttribute('data-escenario');
        this.calcularYRenderizarEquilibrio();
      });
    });
  },

  obtenerFactorEscenario() {
    if (this.escenarioActivo === 'pesimista') return 0.8; // -20%
    if (this.escenarioActivo === 'optimista') return 1.25; // +25%
    return 1.0; // moderado
  },

  obtenerFactorMensual(frecuencia) {
    const local = window.BaseDatos.obtenerLocalActivo();
    let diasOperativosMes = 26; // por defecto

    if (local && local.horarioSemanal) {
      const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      let diasSemana = 0;
      DIAS.forEach(d => {
        if (local.horarioSemanal[d] && local.horarioSemanal[d].abierto) diasSemana++;
      });
      if (diasSemana > 0) diasOperativosMes = Math.round(diasSemana * 4.33);
    } else if (local && local.horariosComercio && local.horariosComercio.diasPorSemana) {
      diasOperativosMes = Math.round(local.horariosComercio.diasPorSemana * 4.33);
    }

    switch (frecuencia) {
      case 'Diaria': return diasOperativosMes;
      case 'Semanal': return 4.33;
      case 'Quincenal': return 2;
      case 'Mensual': return 1;
      default: return diasOperativosMes;
    }
  },

  renderizarTablaSimulacion() {
    const tbody = document.getElementById('tabla-simulador-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (this.productos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 2rem; color: var(--color-texto-secundario);">
            No hay productos cargados en el proyecto activo. Agrega productos desde la sección <strong>Catálogo & Márgenes</strong>.
          </td>
        </tr>
      `;
      return;
    }

    const multEscenario = this.obtenerFactorEscenario();

    this.productos.forEach(prod => {
      const cat = this.categorias.find(c => c.id === prod.idCategoria);
      const nombreCat = cat ? cat.nombre : 'Sin Categoría';
      const factorMensual = this.obtenerFactorMensual(prod.frecuenciaVenta);

      const cantSimuladaBase = prod.cantidadSimulada || 0;
      const cantSimuladaEfectiva = cantSimuladaBase * multEscenario;
      const volMensual = Math.round(cantSimuladaEfectiva * factorMensual);
      const ventaMensual = volMensual * prod.precioVentaBulto;
      const costoMensual = volMensual * prod.precioCostoBulto;
      const margenMensual = ventaMensual - costoMensual;

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--color-borde)';

      tr.innerHTML = `
        <td style="padding: 0.6rem 0.8rem;">
          <div style="font-weight: 600;">${prod.nombre}</div>
          <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">${nombreCat}</span>
        </td>
        <td style="padding: 0.6rem 0.8rem;">
          <span style="background-color: var(--color-fondo-pagina); border: 1px solid var(--color-borde); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
            ${prod.frecuenciaVenta}
          </span>
        </td>
        <td style="padding: 0.6rem 0.8rem;">$ ${prod.precioCostoBulto.toLocaleString('es-AR')}</td>
        <td style="padding: 0.6rem 0.8rem; font-weight: 600; color: var(--color-primario);">$ ${prod.precioVentaBulto.toLocaleString('es-AR')}</td>
        <td style="padding: 0.6rem 0.8rem;"><span style="color: var(--color-semaforo-verde-oscuro); font-weight: 700;">+${prod.porcentajeMarcacion}%</span></td>
        <td style="padding: 0.6rem 0.8rem;">
          <div style="display: flex; align-items: center; gap: 0.25rem;">
            <input type="number" class="input-cant-simulada" data-id="${prod.id}" value="${cantSimuladaBase}" min="0" step="1" style="width: 80px; padding: 0.35rem; font-size: 0.85rem; border: 1px solid var(--color-borde); border-radius: 4px; font-weight: 700; text-align: center;">
            <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">/ ${prod.frecuenciaVenta === 'Diaria' ? 'día' : prod.frecuenciaVenta === 'Semanal' ? 'sem' : 'mes'}</span>
          </div>
        </td>
        <td style="padding: 0.6rem 0.8rem; font-weight: 600;">${volMensual.toLocaleString('es-AR')} bultos/mes</td>
        <td style="padding: 0.6rem 0.8rem; font-weight: 700; color: var(--color-texto-principal);">$ ${ventaMensual.toLocaleString('es-AR')}</td>
        <td style="padding: 0.6rem 0.8rem; font-weight: 700; color: var(--color-semaforo-verde-oscuro);">$ ${margenMensual.toLocaleString('es-AR')}</td>
      `;

      tbody.appendChild(tr);
    });

    this.asignarEventosInputs();
  },

  asignarEventosInputs() {
    document.querySelectorAll('.input-cant-simulada').forEach(input => {
      input.addEventListener('input', (e) => {
        const id = e.target.getAttribute('data-id');
        const nuevaCant = parseFloat(e.target.value) || 0;

        const estado = window.BaseDatos.obtenerEstado();
        const p = estado.productos.find(prod => prod.id === id);
        if (p) {
          p.cantidadSimulada = nuevaCant;
          window.BaseDatos.guardar();
        }

        this.actualizarFilayResumen(id, nuevaCant);
      });
    });

    const btnRestablecer = document.getElementById('btn-restablecer-cantidades');
    if (btnRestablecer) {
      btnRestablecer.onclick = () => {
        const estado = window.BaseDatos.obtenerEstado();
        estado.productos.forEach(p => p.cantidadSimulada = 0);
        window.BaseDatos.guardar();
        this.cargarDatos();
      };
    }
  },

  actualizarFilayResumen(idProducto, nuevaCant) {
    this.productos = window.BaseDatos.obtenerProductosProyectoActivo();
    const multEscenario = this.obtenerFactorEscenario();
    
    const input = document.querySelector(`.input-cant-simulada[data-id="${idProducto}"]`);
    if (input) {
      const tr = input.closest('tr');
      const prod = this.productos.find(p => p.id === idProducto);
      if (tr && prod) {
        const factorMensual = this.obtenerFactorMensual(prod.frecuenciaVenta);
        const cantEfectiva = nuevaCant * multEscenario;
        const volMensual = Math.round(cantEfectiva * factorMensual);
        const ventaMensual = volMensual * prod.precioVentaBulto;
        const costoMensual = volMensual * prod.precioCostoBulto;
        const margenMensual = ventaMensual - costoMensual;

        const celdas = tr.querySelectorAll('td');
        if (celdas.length >= 9) {
          celdas[6].textContent = `${volMensual.toLocaleString('es-AR')} bultos/mes`;
          celdas[7].textContent = `$ ${ventaMensual.toLocaleString('es-AR')}`;
          celdas[8].textContent = `$ ${margenMensual.toLocaleString('es-AR')}`;
        }
      }
    }

    this.calcularYRenderizarEquilibrio();
    window.renderizarResumenKPIs();
  },

  calcularTotalesParaMultiplicador(mult) {
    const gastosFijos = window.BaseDatos.obtenerGastosFijosLocalActivo();
    const empleados = window.BaseDatos.obtenerEmpleadosLocalActivo();

    const totalGastosFijos = gastosFijos
      .filter(g => g.estaActivo)
      .reduce((sum, g) => sum + g.montoMensualProrrateado, 0);

    let totalSueldos = 0;
    empleados.forEach(emp => {
      if (window.ModuloPersonal && window.ModuloPersonal.calcularSueldoMensual) {
        totalSueldos += window.ModuloPersonal.calcularSueldoMensual(emp);
      } else {
        totalSueldos += emp.sueldoNeto;
      }
    });

    const costosFijosTotales = totalGastosFijos + totalSueldos;

    let facturacionTotal = 0;
    let costoVariableTotal = 0;

    this.productos.forEach(prod => {
      const factorMensual = this.obtenerFactorMensual(prod.frecuenciaVenta);
      const cant = (prod.cantidadSimulada || 0) * mult;
      const volMensual = cant * factorMensual;

      facturacionTotal += (volMensual * prod.precioVentaBulto);
      costoVariableTotal += (volMensual * prod.precioCostoBulto);
    });

    const margenBrutoTotal = facturacionTotal - costoVariableTotal;
    const resultadoNeto = margenBrutoTotal - costosFijosTotales;

    return {
      facturacionTotal,
      costoVariableTotal,
      margenBrutoTotal,
      costosFijosTotales,
      resultadoNeto
    };
  },

  calcularYRenderizarEquilibrio() {
    const multActual = this.obtenerFactorEscenario();
    const datosActuales = this.calcularTotalesParaMultiplicador(multActual);

    const facturacionTotal = datosActuales.facturacionTotal;
    const costoVariableTotal = datosActuales.costoVariableTotal;
    const margenBrutoTotal = datosActuales.margenBrutoTotal;
    const costosFijosTotales = datosActuales.costosFijosTotales;
    const resultadoNeto = datosActuales.resultadoNeto;

    const porcentajeMargenBruto = facturacionTotal > 0 ? (margenBrutoTotal / facturacionTotal) * 100 : 0;
    const porcentajeResultadoNeto = facturacionTotal > 0 ? (resultadoNeto / facturacionTotal) * 100 : 0;

    const fMon = (val) => `$ ${Math.round(val).toLocaleString('es-AR')}`;

    // Actualizar tarjetas de comparativo de 3 escenarios
    const pesimista = this.calcularTotalesParaMultiplicador(0.8);
    const moderado = this.calcularTotalesParaMultiplicador(1.0);
    const optimista = this.calcularTotalesParaMultiplicador(1.25);

    document.getElementById('esc-pesimista-facturacion').textContent = fMon(pesimista.facturacionTotal);
    document.getElementById('esc-pesimista-resultado').textContent = `Neto: ${fMon(pesimista.resultadoNeto)}`;
    document.getElementById('esc-pesimista-resultado').style.color = pesimista.resultadoNeto >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)';

    document.getElementById('esc-moderado-facturacion').textContent = fMon(moderado.facturacionTotal);
    document.getElementById('esc-moderado-resultado').textContent = `Neto: ${fMon(moderado.resultadoNeto)}`;
    document.getElementById('esc-moderado-resultado').style.color = moderado.resultadoNeto >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)';

    document.getElementById('esc-optimista-facturacion').textContent = fMon(optimista.facturacionTotal);
    document.getElementById('esc-optimista-resultado').textContent = `Neto: ${fMon(optimista.resultadoNeto)}`;
    document.getElementById('esc-optimista-resultado').style.color = optimista.resultadoNeto >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)';

    // Actualizar KPIs del simulador
    document.getElementById('sim-facturacion-total').textContent = fMon(facturacionTotal);
    document.getElementById('sim-costo-variable-total').textContent = fMon(costoVariableTotal);
    document.getElementById('sim-margen-bruto-total').textContent = fMon(margenBrutoTotal);
    document.getElementById('sim-margen-bruto-porcentaje').textContent = `${porcentajeMargenBruto.toFixed(1)}% margen bruto prom.`;

    document.getElementById('sim-costos-fijos-totales').textContent = fMon(costosFijosTotales);

    const elemNeto = document.getElementById('sim-resultado-neto');
    elemNeto.textContent = fMon(resultadoNeto);
    elemNeto.style.color = resultadoNeto >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)';

    document.getElementById('sim-resultado-porcentaje').textContent = `${porcentajeResultadoNeto.toFixed(1)}% margen neto s/ventas`;

    // Métricas de Días y Cobertura
    let factorDiasMes = 26;
    const local = window.BaseDatos.obtenerLocalActivo();
    if (local && local.horariosComercio) factorDiasMes = local.horariosComercio.diasPorSemana * 4.33;

    const facturacionDiariaRequerida = (costosFijosTotales / (porcentajeMargenBruto / 100 || 1)) / factorDiasMes;
    document.getElementById('sim-facturacion-diaria-requerida').textContent = `${fMon(facturacionDiariaRequerida)} / día`;

    let diasParaEquilibrio = 0;
    if (margenBrutoTotal > 0) {
      const proporcionMargenAlcanzado = costosFijosTotales / margenBrutoTotal;
      diasParaEquilibrio = (proporcionMargenAlcanzado * factorDiasMes).toFixed(1);
    }

    const elemDias = document.getElementById('sim-dias-para-equilibrio');
    if (diasParaEquilibrio <= factorDiasMes && diasParaEquilibrio > 0) {
      elemDias.textContent = `${diasParaEquilibrio} días del mes (de ${Math.round(factorDiasMes)})`;
      elemDias.style.color = 'var(--color-primario)';
    } else {
      elemDias.textContent = `Insuficiente (${diasParaEquilibrio} días necesarios)`;
      elemDias.style.color = 'var(--color-semaforo-rojo)';
    }

    const porcentajeEquilibrioVolumen = margenBrutoTotal > 0 ? ((costosFijosTotales / margenBrutoTotal) * 100).toFixed(1) : 0;
    document.getElementById('sim-porcentaje-equilibrio').textContent = `${porcentajeEquilibrioVolumen}% del volumen simulado`;

    // SEMÁFORO DE SUSTENTABILIDAD (5 FRANJAS)
    const elemBadge = document.getElementById('simulador-semaforo-badge');
    const elemTitulo = document.getElementById('simulador-semaforo-titulo');
    const elemDesc = document.getElementById('simulador-semaforo-descripcion');
    const elemMontoFaltante = document.getElementById('simulador-monto-faltante');
    const elemContenedor = document.getElementById('simulador-semaforo-contenedor');

    for (let i = 1; i <= 5; i++) {
      const b = document.getElementById(`bar-franja-${i}`);
      if (b) b.style.opacity = '0.2';
    }

    let franjaActiva = 1;

    if (resultadoNeto < 0) {
      franjaActiva = 1;
      elemContenedor.style.borderLeftColor = 'var(--color-semaforo-rojo)';
      elemBadge.style.backgroundColor = 'var(--color-semaforo-rojo-suave)';
      elemBadge.style.color = 'var(--color-semaforo-rojo)';
      elemBadge.textContent = '🔴 Pérdida Crítica';
      elemTitulo.textContent = 'El negocio opera con Pérdida Proyectada';
      elemDesc.textContent = 'Las ventas simuladas no alcanzan a cubrir la totalidad de los costos fijos y sueldos del local.';
      
      const faltante = Math.abs(resultadoNeto);
      elemMontoFaltante.textContent = fMon(faltante);
      elemMontoFaltante.style.color = 'var(--color-semaforo-rojo)';
    } else {
      const ratioCobertura = costosFijosTotales > 0 ? (resultadoNeto / costosFijosTotales) * 100 : 100;

      elemMontoFaltante.textContent = `+ ${fMon(resultadoNeto)} de ganancia`;
      elemMontoFaltante.style.color = 'var(--color-semaforo-verde-oscuro)';

      if (ratioCobertura <= 10) {
        franjaActiva = 2;
        elemContenedor.style.borderLeftColor = 'var(--color-semaforo-naranja)';
        elemBadge.style.backgroundColor = 'var(--color-semaforo-naranja-suave)';
        elemBadge.style.color = 'var(--color-semaforo-naranja)';
        elemBadge.textContent = '🟧 Punto de Equilibrio Apenas Cubierto';
        elemTitulo.textContent = 'Equilibrio Frágil / Cobertura Mínima';
        elemDesc.textContent = 'Se cubren los costos fijos pero el margen de seguridad ante una caída de ventas es muy bajo.';
      } else if (ratioCobertura <= 25) {
        franjaActiva = 3;
        elemContenedor.style.borderLeftColor = 'var(--color-semaforo-amarillo)';
        elemBadge.style.backgroundColor = 'var(--color-semaforo-amarillo-suave)';
        elemBadge.style.color = '#b45309';
        elemBadge.textContent = '🟨 Rentabilidad Moderada / Estable';
        elemTitulo.textContent = 'Negocio Sustentable con Margen Moderado';
        elemDesc.textContent = 'El nivel de ventas genera un superávit aceptable para absorción de contingencias.';
      } else if (ratioCobertura <= 50) {
        franjaActiva = 4;
        elemContenedor.style.borderLeftColor = 'var(--color-semaforo-verde-claro)';
        elemBadge.style.backgroundColor = 'var(--color-semaforo-verde-claro-suave)';
        elemBadge.style.color = 'var(--color-semaforo-verde-claro)';
        elemBadge.textContent = '🟩 Negocio Saludable y Rentable';
        elemTitulo.textContent = 'Excelente Retorno y Cobertura Operativa';
        elemDesc.textContent = 'El volumen de ventas simulado genera una rentabilidad neta sólida y constante.';
      } else {
        franjaActiva = 5;
        elemContenedor.style.borderLeftColor = 'var(--color-semaforo-verde-oscuro)';
        elemBadge.style.backgroundColor = 'var(--color-semaforo-verde-oscuro-suave)';
        elemBadge.style.color = 'var(--color-semaforo-verde-oscuro)';
        elemBadge.textContent = '❇️ Alta Rentabilidad y Gran Margen';
        elemTitulo.textContent = 'Negocio Altamente Eficiente y Escalable';
        elemDesc.textContent = 'El superávit supera el 50% sobre los costos fijos totales del comercio.';
      }
    }

    const bActiva = document.getElementById(`bar-franja-${franjaActiva}`);
    if (bActiva) bActiva.style.opacity = '1';

    this.renderizarProyeccionesPeriodo(datosActuales, factorDiasMes);
  },

  configurarEventosProyecciones() {
    document.querySelectorAll('.btn-tab-proyeccion').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-tab-proyeccion').forEach(b => {
          b.classList.remove('activo', 'btn-primario');
          b.classList.add('btn-secundario');
        });

        const target = e.currentTarget;
        target.classList.remove('btn-secundario');
        target.classList.add('activo', 'btn-primario');

        this.pestanaProyeccionActiva = target.getAttribute('data-periodo');
        
        const multActual = this.obtenerFactorEscenario();
        const datosActuales = this.calcularTotalesParaMultiplicador(multActual);
        let factorDiasMes = 26;
        const local = window.BaseDatos.obtenerLocalActivo();
        if (local && local.horariosComercio) factorDiasMes = local.horariosComercio.diasPorSemana * 4.33;

        this.renderizarProyeccionesPeriodo(datosActuales, factorDiasMes);
      });
    });
  },

  renderizarProyeccionesPeriodo(datosMensuales, diasMes) {
    const contenedor = document.getElementById('contenedor-vista-proyeccion');
    if (!contenedor) return;

    const fMon = (val) => `$ ${Math.round(val).toLocaleString('es-AR')}`;
    const pActiva = this.pestanaProyeccionActiva;

    if (pActiva === 'diaria') {
      const factDiaria = datosMensuales.facturacionTotal / diasMes;
      const costoVarDiario = datosMensuales.costoVariableTotal / diasMes;
      const margenBrutoDiario = datosMensuales.margenBrutoTotal / diasMes;
      const costosFijosDiarios = datosMensuales.costosFijosTotales / diasMes;
      const netoDiario = datosMensuales.resultadoNeto / diasMes;
      const pctMargenBruto = datosMensuales.facturacionTotal > 0 ? (datosMensuales.margenBrutoTotal / datosMensuales.facturacionTotal) * 100 : 0;
      const factMinimaDiaria = (datosMensuales.costosFijosTotales / (pctMargenBruto / 100 || 1)) / diasMes;

      const superaPuntoEq = factDiaria >= factMinimaDiaria;

      contenedor.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
          <div style="background: var(--color-fondo-pagina); padding: 0.85rem; border-radius: 8px; border: 1px solid var(--color-borde);">
            <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">Facturación Diaria Proyectada:</span>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--color-texto-principal);">${fMon(factDiaria)} / día</div>
          </div>
          <div style="background: var(--color-fondo-pagina); padding: 0.85rem; border-radius: 8px; border: 1px solid var(--color-borde);">
            <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">Costo Variable Diario:</span>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--color-texto-secundario);">${fMon(costoVarDiario)} / día</div>
          </div>
          <div style="background: var(--color-fondo-pagina); padding: 0.85rem; border-radius: 8px; border: 1px solid var(--color-borde);">
            <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">Margen Bruto Diario:</span>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--color-semaforo-verde-oscuro);">${fMon(margenBrutoDiario)} / día</div>
          </div>
          <div style="background: var(--color-fondo-pagina); padding: 0.85rem; border-radius: 8px; border: 1px solid var(--color-borde);">
            <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">Contribución Neta Diaria:</span>
            <div style="font-size: 1.2rem; font-weight: 800; color: ${netoDiario >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)'};">${fMon(netoDiario)} / día</div>
          </div>
        </div>
        <div style="background-color: ${superaPuntoEq ? 'var(--color-primario-suave)' : 'var(--color-semaforo-rojo-suave)'}; padding: 0.85rem; border-radius: 8px; border: 1px solid ${superaPuntoEq ? 'var(--color-primario)' : 'var(--color-semaforo-rojo)'}; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <strong style="color: ${superaPuntoEq ? 'var(--color-primario)' : 'var(--color-semaforo-rojo)'}; font-size: 0.9rem;">
              ${superaPuntoEq ? '✅ Objetivo Diario de Equilibrio Cubierto' : '⚠️ Facturación Diaria Insuficiente'}
            </strong>
            <p style="font-size: 0.8rem; margin: 0.2rem 0 0 0; color: var(--color-texto-principal);">
              La facturación requerida para cubrir costos fijos es de <strong>${fMon(factMinimaDiaria)} / día</strong> (operando ${Math.round(diasMes)} días al mes).
            </p>
          </div>
          <span style="font-weight: 800; font-size: 1.1rem; color: ${superaPuntoEq ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)'};">
            ${superaPuntoEq ? '+' : ''}${fMon(factDiaria - factMinimaDiaria)} / día vs P.E.
          </span>
        </div>
      `;
    } else if (pActiva === 'semanal') {
      const semanasMes = 4.33;
      const factSemanal = datosMensuales.facturacionTotal / semanasMes;
      const costoVarSemanal = datosMensuales.costoVariableTotal / semanasMes;
      const margenBrutoSemanal = datosMensuales.margenBrutoTotal / semanasMes;
      const costosFijosSemanales = datosMensuales.costosFijosTotales / semanasMes;
      const netoSemanal = datosMensuales.resultadoNeto / semanasMes;

      contenedor.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
          <div style="background: var(--color-fondo-pagina); padding: 0.85rem; border-radius: 8px; border: 1px solid var(--color-borde);">
            <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">Facturación Semanal:</span>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--color-texto-principal);">${fMon(factSemanal)} / sem</div>
          </div>
          <div style="background: var(--color-fondo-pagina); padding: 0.85rem; border-radius: 8px; border: 1px solid var(--color-borde);">
            <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">Costo Variable Semanal:</span>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--color-texto-secundario);">${fMon(costoVarSemanal)} / sem</div>
          </div>
          <div style="background: var(--color-fondo-pagina); padding: 0.85rem; border-radius: 8px; border: 1px solid var(--color-borde);">
            <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">Costos Fijos Semanales:</span>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--color-texto-principal);">${fMon(costosFijosSemanales)} / sem</div>
          </div>
          <div style="background: var(--color-fondo-pagina); padding: 0.85rem; border-radius: 8px; border: 1px solid var(--color-borde);">
            <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">Resultado Neto Semanal:</span>
            <div style="font-size: 1.2rem; font-weight: 800; color: ${netoSemanal >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)'};">${fMon(netoSemanal)} / sem</div>
          </div>
        </div>
      `;
    } else {
      // mensual y proyección anual
      const m3 = datosMensuales.resultadoNeto * 3;
      const m6 = datosMensuales.resultadoNeto * 6;
      const m12 = datosMensuales.resultadoNeto * 12;

      contenedor.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
          <div style="background: var(--color-fondo-pagina); padding: 1rem; border-radius: 8px; border: 1px solid var(--color-borde);">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-primario);">Trimestral (3 Meses)</span>
            <div style="font-size: 1.2rem; font-weight: 800; margin-top: 0.4rem; color: ${m3 >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)'};">${fMon(m3)}</div>
            <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">Ganancia/Pérdida proyectada a 90 días</span>
          </div>
          <div style="background: var(--color-fondo-pagina); padding: 1rem; border-radius: 8px; border: 1px solid var(--color-borde);">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-primario);">Semestral (6 Meses)</span>
            <div style="font-size: 1.2rem; font-weight: 800; margin-top: 0.4rem; color: ${m6 >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)'};">${fMon(m6)}</div>
            <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">Ganancia/Pérdida proyectada a 180 días</span>
          </div>
          <div style="background: var(--color-fondo-pagina); padding: 1rem; border-radius: 8px; border: 1px solid var(--color-borde);">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--color-primario);">Anual (12 Meses)</span>
            <div style="font-size: 1.2rem; font-weight: 800; margin-top: 0.4rem; color: ${m12 >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)'};">${fMon(m12)}</div>
            <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">Ganancia/Pérdida proyectada a 1 año</span>
          </div>
        </div>
      `;
    }
  }
};

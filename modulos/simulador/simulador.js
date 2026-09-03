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

  async cargarDatos() {
    const estado = window.BaseDatos.obtenerEstado();

    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        const empresaId = window.EstadoGlobal.idProyectoActivo || 'e0000000-0000-4000-8000-000000000001';
        const catsRel = await window.RepositorioRelacional.obtenerCategoriasEmpresa(empresaId);
        const prodsRel = await window.RepositorioRelacional.obtenerProductosEmpresa(empresaId);

        if (catsRel) {
          this.categorias = catsRel.map(c => ({
            id: c.id,
            nombre: c.nombre
          }));
        }

        if (prodsRel) {
          this.productos = prodsRel.map(p => {
            const unidadesPorBulto = p.unidades_por_bulto !== undefined && p.unidades_por_bulto !== null ? parseInt(p.unidades_por_bulto) : 1;
            const cantidadSimulada = p.cantidad_simulada !== undefined && p.cantidad_simulada !== null ? parseInt(p.cantidad_simulada) : 1;
            const frecuenciaVenta = p.frecuencia_venta || 'Diaria';

            const costoUnitario = parseFloat(p.costo_unitario) || 0;
            const ventaUnitario = parseFloat(p.precio_venta) || 0;
            
            const costoBulto = costoUnitario * unidadesPorBulto;
            const ventaBulto = ventaUnitario * unidadesPorBulto;

            const markup = costoUnitario > 0 ? ((ventaUnitario - costoUnitario) / costoUnitario) * 100 : 0;

            return {
              id: p.id,
              nombre: p.nombre,
              idCategoria: p.categoria_id,
              costoUnitario: costoUnitario,
              precioVentaUnitario: ventaUnitario,
              precioCostoBulto: costoBulto,
              precioVentaBulto: ventaBulto,
              unidadesPorBulto: unidadesPorBulto,
              porcentajeMarcacion: Math.round(markup * 100) / 100,
              frecuenciaVenta: frecuenciaVenta,
              cantidadSimulada: cantidadSimulada
            };
          });
        }
      } catch (e) {
        console.warn('[ModuloSimulador] Error al cargar de Supabase, usando local:', e);
        this.categorias = estado.categoriasProductos.filter(c => c.idProyecto === estado.idProyectoActivo);
        this.productos = window.BaseDatos.obtenerProductosProyectoActivo();
      }
    } else {
      this.categorias = estado.categoriasProductos.filter(c => c.idProyecto === estado.idProyectoActivo);
      this.productos = window.BaseDatos.obtenerProductosProyectoActivo();
    }

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
          <td colspan="11" style="text-align: center; padding: 2rem; color: var(--color-texto-secundario);">
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
      const cantSimuladaEfectiva = prod.simulacionHabilitada !== false ? (cantSimuladaBase * multEscenario) : 0;
      const volMensual = Math.round(cantSimuladaEfectiva * factorMensual);
      const ventaMensual = volMensual * prod.precioVentaBulto;
      const costoMensual = volMensual * prod.precioCostoBulto;
      const margenMensual = ventaMensual - costoMensual;
      
      const porcentajeGanancia = prod.precioVentaBulto > 0 ? ((prod.precioVentaBulto - prod.precioCostoBulto) / prod.precioVentaBulto * 100).toFixed(2) : '0.00';
      const txtFreq = prod.frecuenciaVenta === 'Diaria' ? 'día' : prod.frecuenciaVenta === 'Semanal' ? 'sem' : 'mes';

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--color-borde)';
      if (prod.simulacionHabilitada === false) {
        tr.style.opacity = '0.5';
      }

      tr.innerHTML = `
        <td style="padding: 0.6rem 0.8rem; text-align: center;">
          <input type="checkbox" class="chk-habilitar-simulacion" data-id="${prod.id}" ${prod.simulacionHabilitada !== false ? 'checked' : ''} style="transform: scale(1.2); cursor: pointer;">
        </td>
        <td style="padding: 0.6rem 0.8rem;">
          <div style="font-weight: 600;">${prod.nombre}</div>
          <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">${nombreCat}</span>
        </td>
        <td style="padding: 0.6rem 0.8rem;">
          <span style="background-color: var(--color-fondo-pagina); border: 1px solid var(--color-borde); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
            ${prod.frecuenciaVenta}
          </span>
        </td>
        <td style="padding: 0.6rem 0.8rem;">${prod.unidadesPorBulto || 1}</td>
        <td style="padding: 0.6rem 0.8rem;">$ ${prod.precioCostoBulto.toLocaleString('es-AR')}</td>
        <td style="padding: 0.6rem 0.8rem; font-weight: 600; color: var(--color-primario);">$ ${prod.precioVentaBulto.toLocaleString('es-AR')}</td>
        <td style="padding: 0.6rem 0.8rem;"><span style="color: var(--color-semaforo-verde-oscuro); font-weight: 700;">+${prod.porcentajeMarcacion}%</span></td>
        <td style="padding: 0.6rem 0.8rem; font-weight: 600; color: var(--color-primario);">${porcentajeGanancia}%</td>
        <td style="padding: 0.6rem 0.8rem;">
          <div style="display: flex; align-items: center; gap: 0.25rem;">
            <input type="number" class="input-cant-simulada" data-id="${prod.id}" value="${cantSimuladaBase}" min="0" step="1" style="width: 80px; padding: 0.35rem; font-size: 0.85rem; border: 1px solid var(--color-borde); border-radius: 4px; font-weight: 700; text-align: center;">
            <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">/ ${txtFreq}</span>
          </div>
        </td>
        <td style="padding: 0.6rem 0.8rem; font-size: 0.85rem;">
          ${volMensual.toLocaleString('es-AR')} bultos/mes<br>
          <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">(${(volMensual * (prod.unidadesPorBulto || 1)).toLocaleString('es-AR')} uds)</span>
        </td>
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

    document.querySelectorAll('.chk-habilitar-simulacion').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const habilitado = e.target.checked;
        
        const prod = this.productos.find(p => p.id === id);
        if (prod) {
          prod.simulacionHabilitada = habilitado;
          // Actualizar estilo de fila
          const tr = e.target.closest('tr');
          if (tr) {
            tr.style.opacity = habilitado ? '1' : '0.5';
          }
          // Usar la cantidad actual para recalcular
          this.actualizarFilayResumen(id, prod.cantidadSimulada || 0);
        }
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
    const prod = this.productos.find(p => p.id === idProducto);
    if (prod) {
      prod.cantidadSimulada = nuevaCant;
    }
    const multEscenario = this.obtenerFactorEscenario();
    
    const input = document.querySelector(`.input-cant-simulada[data-id="${idProducto}"]`);
    if (input) {
      const tr = input.closest('tr');
      if (tr && prod) {
        const factorMensual = this.obtenerFactorMensual(prod.frecuenciaVenta);
        const cantEfectiva = prod.simulacionHabilitada !== false ? (nuevaCant * multEscenario) : 0;
        const volMensual = Math.round(cantEfectiva * factorMensual);
        const ventaMensual = volMensual * prod.precioVentaBulto;
        const costoMensual = volMensual * prod.precioCostoBulto;
        const margenMensual = ventaMensual - costoMensual;

        const celdas = tr.querySelectorAll('td');
        if (celdas.length >= 12) {
          celdas[9].innerHTML = `
            ${volMensual.toLocaleString('es-AR')} bultos/mes<br>
            <span style="font-size: 0.75rem; color: var(--color-texto-secundario);">(${(volMensual * (prod.unidadesPorBulto || 1)).toLocaleString('es-AR')} uds)</span>
          `;
          celdas[10].textContent = `$ ${ventaMensual.toLocaleString('es-AR')}`;
          celdas[11].textContent = `$ ${margenMensual.toLocaleString('es-AR')}`;
        }
      }
    }

    this.calcularYRenderizarEquilibrio();
    window.renderizarResumenKPIs();
  },

  calcularTotalesParaMultiplicador(mult) {
    // Priorizar datos cargados por los módulos (desde Supabase) sobre el estado local
    const gastosFijos = (window.ModuloGastos && window.ModuloGastos.gastos) 
      ? window.ModuloGastos.gastos 
      : window.BaseDatos.obtenerGastosFijosLocalActivo();
    const empleados = (window.ModuloPersonal && window.ModuloPersonal.empleados)
      ? window.ModuloPersonal.empleados
      : window.BaseDatos.obtenerEmpleadosLocalActivo();

    const totalGastosFijos = gastosFijos
      .filter(g => g.estaActivo)
      .reduce((sum, g) => {
        let montoMes = g.monto || 0;
        if (window.ModuloGastos && typeof window.ModuloGastos.calcularMontoMensual === 'function') {
          montoMes = window.ModuloGastos.calcularMontoMensual(g.monto, g.frecuencia);
        } else {
          // Fallback en caso de que el modulo de gastos no esté cargado
          const frec = g.frecuencia || 'Mensual';
          if (frec === 'Diaria') montoMes = g.monto * 26;
          else if (frec === 'Semanal') montoMes = g.monto * 4;
          else if (frec === 'Bimestral') montoMes = g.monto / 2;
          else if (frec === 'Anual') montoMes = g.monto / 12;
        }
        return sum + montoMes;
      }, 0);

    let totalSueldos = 0;
    empleados.forEach(emp => {
      if (window.ModuloPersonal && window.ModuloPersonal.calcularSueldoMensual) {
        totalSueldos += window.ModuloPersonal.calcularSueldoMensual(emp);
      } else {
        totalSueldos += emp.sueldoNeto;
      }
    });

    const costosFijosTotales = totalGastosFijos + totalSueldos;
    console.log(`[Simulador] Gastos Fijos: $${totalGastosFijos} | Sueldos (${empleados.length} empleados): $${totalSueldos} | TOTAL Costos Fijos: $${costosFijosTotales}`);

    let facturacionTotal = 0;
    let costoVariableTotal = 0;

    this.productos.forEach(prod => {
      const factorMensual = this.obtenerFactorMensual(prod.frecuenciaVenta);
      const cantSimulada = prod.simulacionHabilitada !== false ? (prod.cantidadSimulada || 0) : 0;
      const cant = cantSimulada * mult;
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
      resultadoNeto,
      totalGastosFijos,
      totalSueldos
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
    const elemDesglose = document.getElementById('sim-costos-fijos-desglose');
    if (elemDesglose) {
      elemDesglose.innerHTML = `
        <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 0.25rem;">
          <span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">📝 Gastos: ${fMon(datosActuales.totalGastosFijos)}</span>
          <span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">👥 Sueldos: ${fMon(datosActuales.totalSueldos)}</span>
        </div>
      `;
    }

    const elemNeto = document.getElementById('sim-resultado-neto');
    elemNeto.textContent = fMon(resultadoNeto);
    elemNeto.style.color = resultadoNeto >= 0 ? 'var(--color-semaforo-verde-oscuro)' : 'var(--color-semaforo-rojo)';

    document.getElementById('sim-resultado-porcentaje').textContent = `${porcentajeResultadoNeto.toFixed(1)}% margen neto s/ventas`;

    // Métricas de Días y Cobertura
    let diasSemana = 6;
    const local = window.BaseDatos.obtenerLocalActivo();
    if (local && local.horariosComercio) diasSemana = local.horariosComercio.diasPorSemana || 6;
    const factorDiasMes = Math.round(diasSemana * 4.33);

    const facturacionDiariaRequerida = (costosFijosTotales / (porcentajeMargenBruto / 100 || 1)) / factorDiasMes;
    document.getElementById('sim-facturacion-diaria-requerida').textContent = `${fMon(facturacionDiariaRequerida)} / día`;

    let diasParaEquilibrio = 0;
    if (margenBrutoTotal > 0) {
      const proporcionMargenAlcanzado = costosFijosTotales / margenBrutoTotal;
      diasParaEquilibrio = (proporcionMargenAlcanzado * factorDiasMes).toFixed(1);
    }

    const elemDias = document.getElementById('sim-dias-para-equilibrio');
    if (diasParaEquilibrio <= factorDiasMes && diasParaEquilibrio > 0) {
      elemDias.textContent = `${diasParaEquilibrio} días del mes (de ${factorDiasMes})`;
      elemDias.style.color = 'var(--color-primario)';
    } else {
      elemDias.textContent = `Insuficiente (${diasParaEquilibrio} días necesarios)`;
      elemDias.style.color = 'var(--color-semaforo-rojo)';
    }

    const elemAnalisisHorarios = document.getElementById('sim-analisis-horarios');
    if (elemAnalisisHorarios) {
      elemAnalisisHorarios.style.display = 'block';
      let diasRentablesTxt = '';
      let recomendacionTxt = '';

      if (margenBrutoTotal <= 0) {
        diasRentablesTxt = `No hay margen bruto suficiente para cubrir los costos fijos.`;
      } else if (diasParaEquilibrio <= factorDiasMes) {
        diasRentablesTxt = `El local alcanza su punto de equilibrio en el día <strong>${Math.ceil(diasParaEquilibrio)}</strong> del mes.`;
        const diasGanancia = factorDiasMes - Math.ceil(diasParaEquilibrio);
        recomendacionTxt = `Te quedan <strong>${diasGanancia} días</strong> de ganancia neta operando ${diasSemana} días a la semana.`;
      } else {
        diasRentablesTxt = `El local necesita <strong>${Math.ceil(diasParaEquilibrio)} días</strong> para alcanzar el punto de equilibrio, pero solo opera <strong>${factorDiasMes} días</strong> al mes.`;
        recomendacionTxt = `<span style="color: var(--color-semaforo-rojo);"><strong>Sugerencia:</strong> Deberías evaluar abrir más días, aumentar margen/volumen, o reducir costos fijos.</span>`;
      }

      elemAnalisisHorarios.innerHTML = `
        <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--color-texto);">
          ⏱ Horarios y Apertura (${local?.nombre || 'Local Activo'})
        </div>
        <div style="font-size: 0.85rem; color: var(--color-texto-secundario); margin-bottom: 0.5rem;">
          Atención: <strong>${diasSemana} días por semana</strong> (~${factorDiasMes} días hábiles al mes).
        </div>
        <div style="font-size: 0.85rem;">
          ${diasRentablesTxt} ${recomendacionTxt}
        </div>
      `;
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

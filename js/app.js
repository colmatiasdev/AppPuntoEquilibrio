window.mostrarSpinner = function(mensaje = 'Cargando datos desde la Base de Datos...') {
  const overlay = document.getElementById('overlay-spinner-global');
  const txt = document.getElementById('spinner-texto-mensaje');
  if (txt) txt.textContent = mensaje;
  if (overlay) overlay.classList.add('activo');
};

window.ocultarSpinner = function() {
  const overlay = document.getElementById('overlay-spinner-global');
  if (overlay) overlay.classList.remove('activo');
};

document.addEventListener('DOMContentLoaded', () => {
  inicializarUI();
});

async function inicializarUI() {
  window.mostrarSpinner('Cargando datos del sistema...');

  try {
    configurarNavegacionSidebar();
    configurarToggleSidebar();

    if (window.ClienteSupabase) {
      await window.ClienteSupabase.inicializar();
    }

    if (window.ModuloProyectos) {
      await window.ModuloProyectos.inicializar();
    }

    cargarSelectoresContexto();

    if (window.ModuloGastos) await window.ModuloGastos.inicializar();
    if (window.ModuloPersonal) await window.ModuloPersonal.inicializar();
    if (window.ModuloProductos) await window.ModuloProductos.inicializar();
    if (window.ModuloSimulador) await window.ModuloSimulador.inicializar();
    if (window.ModuloAnalisisReal) await window.ModuloAnalisisReal.inicializar();
    if (window.ModuloConfiguracion) await window.ModuloConfiguracion.inicializar();
    if (window.ModuloMayoristas) await window.ModuloMayoristas.inicializar();
    if (window.ModuloCuentas) await window.ModuloCuentas.inicializar();
    if (window.ModuloProveedores) await window.ModuloProveedores.inicializar();
    if (window.ModuloCaja) await window.ModuloCaja.inicializar();
    if (window.ModuloPortabilidad) await window.ModuloPortabilidad.inicializar();

    renderizarResumenKPIs();
  } catch (err) {
    console.error('[App] Error al inicializar UI:', err);
  } finally {
    window.ocultarSpinner();
  }
}

// Cambios de vista entre módulos con persistencia de Hash al presionar F5 / recargar
function configurarNavegacionSidebar() {
  const enlacesSidebar = document.querySelectorAll('.sidebar-link');
  const seccionesModulo = document.querySelectorAll('.modulo-seccion');

  async function navegarAModulo(moduloDestino) {
    if (!moduloDestino) moduloDestino = 'resumen';

    // Quitar clase activo de todos los enlaces
    enlacesSidebar.forEach(link => {
      if (link.getAttribute('data-modulo') === moduloDestino) {
        link.classList.add('activo');
      } else {
        link.classList.remove('activo');
      }
    });

    // Quitar clase activo de todas las secciones
    seccionesModulo.forEach(sec => sec.classList.remove('activo'));

    const seccionDestino = document.getElementById(`modulo-${moduloDestino}`);
    if (seccionDestino) {
      seccionDestino.classList.add('activo');
    }

    // Actualizar hash en la URL sin recargar
    if (window.location.hash !== `#${moduloDestino}`) {
      window.location.hash = `#${moduloDestino}`;
    }

    // En mobile cerrar sidebar al hacer click
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('desplegado');
    }

    // Mostrar Spinner y Cargar Datos Reales de la Base de Datos
    if (window.mostrarSpinner) window.mostrarSpinner('Cargando datos desde la Base de Datos...');
    try {
      if (moduloDestino === 'proyectos' && window.ModuloProyectos) await window.ModuloProyectos.cargarDatos();
      else if (moduloDestino === 'personal' && window.ModuloPersonal) await window.ModuloPersonal.cargarDatos();
      else if (moduloDestino === 'gastos' && window.ModuloGastos) await window.ModuloGastos.cargarGastos();
      else if (moduloDestino === 'productos' && window.ModuloProductos) await window.ModuloProductos.cargarDatos();
      else if (moduloDestino === 'caja' && window.ModuloCaja) await window.ModuloCaja.cargarDatos();
      else if (moduloDestino === 'proveedores' && window.ModuloProveedores) await window.ModuloProveedores.cargarDatos();
      else if (moduloDestino === 'mayoristas' && window.ModuloMayoristas) await window.ModuloMayoristas.cargarDatos();
      else if (moduloDestino === 'cuentas' && window.ModuloCuentas) await window.ModuloCuentas.cargarDatos();
      else if (moduloDestino === 'analisis-real' && window.ModuloAnalisisReal) await window.ModuloAnalisisReal.cargarDatos();
    } catch (err) {
      console.warn(`[App] Error al cargar módulo ${moduloDestino} desde DB:`, err);
    } finally {
      if (window.ocultarSpinner) window.ocultarSpinner();
    }
  }

  enlacesSidebar.forEach(enlace => {
    enlace.addEventListener('click', (e) => {
      e.preventDefault();
      const modulo = enlace.getAttribute('data-modulo');
      navegarAModulo(modulo);
    });
  });

  // Manejar cambio de hash en la URL (F5 / navegación directa)
  window.addEventListener('hashchange', () => {
    const moduloHash = window.location.hash.replace('#', '');
    if (moduloHash) navegarAModulo(moduloHash);
  });

  // Al inicializar la app, leer hash actual o ir a resumen
  const moduloInicial = window.location.hash.replace('#', '') || 'resumen';
  navegarAModulo(moduloInicial);
}

// Toggle Sidebar en dispositivos móviles
function configurarToggleSidebar() {
  const btnToggle = document.getElementById('btn-toggle-sidebar');
  const sidebar = document.getElementById('sidebar');

  if (btnToggle && sidebar) {
    btnToggle.addEventListener('click', () => {
      sidebar.classList.toggle('desplegado');
    });
  }
}

// Cargar opciones en selectores de la barra superior (Topbar)
window.cargarSelectoresContexto = cargarSelectoresContexto;

function cargarSelectoresContexto() {
  const estado = window.BaseDatos.obtenerEstado();
  const selectProyecto = document.getElementById('select-proyecto');
  const selectLocal = document.getElementById('select-local');

  if (!selectProyecto || !selectLocal) return;

  // Cargar Proyectos
  selectProyecto.innerHTML = '';
  const proyActivo = estado.proyectos.find(p => p.id === estado.idProyectoActivo) || estado.proyectos[0];

  const topbarLogoContenedor = document.getElementById('topbar-logo-proyecto');
  if (topbarLogoContenedor) {
    if (proyActivo && proyActivo.logo) {
      topbarLogoContenedor.innerHTML = `<img src="${proyActivo.logo}" alt="${proyActivo.nombre}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
      topbarLogoContenedor.innerHTML = `🏬`;
    }
  }

  estado.proyectos.forEach(proy => {
    const option = document.createElement('option');
    option.value = proy.id;
    option.textContent = proy.nombre;
    if (proy.id === estado.idProyectoActivo) option.selected = true;
    selectProyecto.appendChild(option);
  });

  // Cargar Locales (solo los pertenecientes al proyecto activo)
  selectLocal.innerHTML = '';
  const localesProyecto = estado.locales.filter(loc => loc.idProyecto === estado.idProyectoActivo);

  // Asegurar que idLocalActivo sea uno válido del proyecto activo
  if (localesProyecto.length > 0 && !localesProyecto.some(loc => loc.id === estado.idLocalActivo)) {
    estado.idLocalActivo = localesProyecto[0].id;
    window.BaseDatos.guardar();
  }

  localesProyecto.forEach(loc => {
    const option = document.createElement('option');
    option.value = loc.id;
    const direccionTexto = loc.direccion ? ` - ${loc.direccion}` : '';
    option.textContent = `${loc.nombre}${direccionTexto}`;
    if (loc.id === estado.idLocalActivo) option.selected = true;
    selectLocal.appendChild(option);
  });

  // Event Listeners para cambios
  selectProyecto.onchange = (e) => {
    window.BaseDatos.seleccionarProyecto(e.target.value);
    actualizarModulosActivos();
  };

  selectLocal.onchange = (e) => {
    window.BaseDatos.seleccionarLocal(e.target.value);
    actualizarModulosActivos();
  };
}

async function actualizarModulosActivos() {
  if (window.mostrarSpinner) window.mostrarSpinner('Actualizando módulo activo...');
  try {
    cargarSelectoresContexto();
    if (window.ModuloProyectos) await window.ModuloProyectos.cargarDatos();
    if (window.ModuloGastos) await window.ModuloGastos.cargarGastos();
    if (window.ModuloPersonal) await window.ModuloPersonal.cargarDatos();
    if (window.ModuloProductos) await window.ModuloProductos.cargarDatos();
    if (window.ModuloSimulador) await window.ModuloSimulador.cargarDatos();
    if (window.ModuloAnalisisReal) await window.ModuloAnalisisReal.cargarDatos();
    if (window.ModuloConfiguracion) await window.ModuloConfiguracion.cargarDatos();
    if (window.ModuloMayoristas) await window.ModuloMayoristas.cargarDatos();
    if (window.ModuloCuentas) await window.ModuloCuentas.cargarDatos();
    if (window.ModuloProveedores) await window.ModuloProveedores.cargarDatos();
    if (window.ModuloCaja) await window.ModuloCaja.cargarDatos();
    renderizarResumenKPIs();
  } catch (err) {
    console.error('[App] Error al actualizar módulos:', err);
  } finally {
    if (window.ocultarSpinner) window.ocultarSpinner();
  }
}

// Render preliminar de KPIs en Resumen
function renderizarResumenKPIs() {
  const gastosFijos = window.BaseDatos.obtenerGastosFijosLocalActivo();
  const empleados = window.BaseDatos.obtenerEmpleadosLocalActivo();
  const productos = window.BaseDatos.obtenerProductosProyectoActivo();

  // Total Gastos Directos
  const totalGastosFijos = gastosFijos
    .filter(g => g.estaActivo)
    .reduce((sum, g) => sum + g.montoMensualProrrateado, 0);

  // Total Empleados
  const totalSueldosNetos = empleados.reduce((sum, e) => sum + e.sueldoNeto, 0);

  const totalCostosFijosMensuales = totalGastosFijos + totalSueldosNetos;

  // Facturación Proyectada preliminar
  let facturacionProyectada = 0;
  productos.forEach(p => {
    let factorMensual = 26; // por defecto diario
    if (p.frecuenciaVenta === 'Semanal') factorMensual = 4;
    if (p.frecuenciaVenta === 'Quincenal') factorMensual = 2;
    if (p.frecuenciaVenta === 'Mensual') factorMensual = 1;

    facturacionProyectada += (p.precioVentaBulto * p.cantidadSimulada * factorMensual);
  });

  // Formateador de moneda
  const formatearMoneda = (val) => `$ ${val.toLocaleString('es-AR')}`;

  document.getElementById('kpi-gastos-fijos').textContent = formatearMoneda(totalCostosFijosMensuales);
  document.getElementById('kpi-facturacion-proyectada').textContent = formatearMoneda(facturacionProyectada);
  
  const gananciaNeta = facturacionProyectada - totalCostosFijosMensuales;
  document.getElementById('kpi-ganancia-neta').textContent = formatearMoneda(gananciaNeta);
  document.getElementById('kpi-punto-equilibrio').textContent = formatearMoneda(totalCostosFijosMensuales);
}

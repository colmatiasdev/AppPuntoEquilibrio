/**
 * app.js - Lógica principal de UI y control de navegación entre módulos
 */

document.addEventListener('DOMContentLoaded', () => {
  inicializarUI();
});

async function inicializarUI() {
  configurarNavegacionSidebar();
  configurarToggleSidebar();
  cargarSelectoresContexto();

  if (window.ModuloGastos) {
    window.ModuloGastos.inicializar();
  }

  if (window.ModuloPersonal) {
    window.ModuloPersonal.inicializar();
  }

  if (window.ModuloProductos) {
    window.ModuloProductos.inicializar();
  }

  if (window.ModuloProyectos) {
    window.ModuloProyectos.inicializar();
  }

  if (window.ModuloSimulador) {
    window.ModuloSimulador.inicializar();
  }

  if (window.ModuloAnalisisReal) {
    window.ModuloAnalisisReal.inicializar();
  }

  if (window.ModuloConfiguracion) {
    window.ModuloConfiguracion.inicializar();
  }

  if (window.ModuloMayoristas) {
    window.ModuloMayoristas.inicializar();
  }

  if (window.ModuloCuentas) {
    window.ModuloCuentas.inicializar();
  }

  if (window.ModuloProveedores) {
    window.ModuloProveedores.inicializar();
  }

  if (window.ModuloCaja) {
    window.ModuloCaja.inicializar();
  }

  if (window.ModuloPortabilidad) {
    window.ModuloPortabilidad.inicializar();
  }

  renderizarResumenKPIs();
}

// Cambios de vista entre módulos con persistencia de Hash al presionar F5 / recargar
function configurarNavegacionSidebar() {
  const enlacesSidebar = document.querySelectorAll('.sidebar-link');
  const seccionesModulo = document.querySelectorAll('.modulo-seccion');

  function navegarAModulo(moduloDestino) {
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
function cargarSelectoresContexto() {
  const estado = window.BaseDatos.obtenerEstado();
  const selectProyecto = document.getElementById('select-proyecto');
  const selectLocal = document.getElementById('select-local');

  if (!selectProyecto || !selectLocal) return;

  // Cargar Proyectos
  selectProyecto.innerHTML = '';
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

function actualizarModulosActivos() {
  cargarSelectoresContexto();
  if (window.ModuloProyectos) window.ModuloProyectos.cargarDatos();
  if (window.ModuloGastos) window.ModuloGastos.cargarGastos();
  if (window.ModuloPersonal) window.ModuloPersonal.cargarDatos();
  if (window.ModuloProductos) window.ModuloProductos.cargarDatos();
  if (window.ModuloSimulador) window.ModuloSimulador.cargarDatos();
  if (window.ModuloAnalisisReal) window.ModuloAnalisisReal.cargarDatos();
  if (window.ModuloConfiguracion) window.ModuloConfiguracion.cargarDatos();
  if (window.ModuloMayoristas) window.ModuloMayoristas.cargarDatos();
  if (window.ModuloCuentas) window.ModuloCuentas.cargarDatos();
  if (window.ModuloProveedores) window.ModuloProveedores.cargarDatos();
  if (window.ModuloCaja) window.ModuloCaja.cargarDatos();
  renderizarResumenKPIs();
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

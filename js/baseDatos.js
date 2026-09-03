/**
 * BaseDatos.js - Engine de almacenamiento LocalStorage 100% en Español
 * Clave principal: app_punto_equilibrio_bd_v1
 */

const CLAVE_LOCAL_STORAGE = 'app_punto_equilibrio_bd_v1';

// Seed Data Inicial en Español
const DATOS_SEMILLA = {
  idProyectoActivo: "proy_01",
  idLocalActivo: "loc_01",
  configuracion: {
    porcentajeMarcacionDefecto: 40,
    simboloMoneda: "$",
    diasLaborablesMes: 26
  },
  proyectos: [
    {
      id: "proy_01",
      nombre: "Panadería y Confitería",
      descripcion: "Elaboración y venta de productos de panadería",
      fechaCreacion: new Date().toISOString()
    }
  ],
  locales: [
    {
      id: "loc_01",
      idProyecto: "proy_01",
      nombre: "Local Av. Principal #1040",
      direccion: "Av. Principal 1040",
      horariosComercio: {
        diasPorSemana: 6,
        horarioApertura: "07:00",
        horarioCierre: "21:00",
        horasOperativasDiarias: 14
      },
      estimadoVentasMinimasZona: 15000000
    }
  ],
  gastosFijos: [
    {
      id: "gas_01",
      idLocal: "loc_01",
      nombre: "Alquiler Mensual Base",
      categoria: "Alquiler",
      monto: 450000,
      frecuencia: "Mensual",
      montoMensualProrrateado: 450000,
      esAjusteContrato: false,
      estaActivo: true
    },
    {
      "id": "gas_02",
      "idLocal": "loc_01",
      "nombre": "Luz / Electricidad",
      "categoria": "Servicios Públicos",
      "monto": 80000,
      "frecuencia": "Mensual",
      "montoMensualProrrateado": 80000,
      "esAjusteContrato": false,
      "estaActivo": true
    },
    {
      "id": "gas_03",
      "idLocal": "loc_01",
      "nombre": "Comisión Renovación Contrato (Proyectado)",
      "categoria": "Gastos Contrato",
      "monto": 600000,
      "frecuencia": "Anual",
      "montoMensualProrrateado": 50000,
      "esAjusteContrato": true,
      "estaActivo": true
    }
  ],
  roles: [],
  empleados: [],
  categoriasProductos: [
    {
      id: "cat_01",
      idProyecto: "proy_01",
      nombre: "Panificados y Bizcochos",
      porcentajeMarcacionDefecto: 50,
      frecuenciaVenta: "Diaria"
    },
    {
      id: "cat_02",
      idProyecto: "proy_01",
      nombre: "Facturas y Especiales",
      porcentajeMarcacionDefecto: 40,
      frecuenciaVenta: "Diaria"
    },
    {
      id: "cat_03",
      idProyecto: "proy_01",
      nombre: "Tortas Personalizadas",
      porcentajeMarcacionDefecto: 60,
      frecuenciaVenta: "Mensual"
    }
  ],
  productos: [
    {
      id: "prod_01",
      idCategoria: "cat_02",
      nombre: "1 Lata Facturas (36 unidades)",
      unidadesPorBulto: 36,
      precioCostoBulto: 45000,
      porcentajeMarcacion: 40,
      precioVentaBulto: 63000,
      costoUnitario: 1250,
      precioVentaUnitario: 1750,
      frecuenciaVenta: "Diaria",
      cantidadSimulada: 15
    },
    {
      id: "prod_02",
      idCategoria: "cat_01",
      nombre: "Bolsa 5 Kg Pan",
      unidadesPorBulto: 1,
      precioCostoBulto: 15000,
      porcentajeMarcacion: 50,
      precioVentaBulto: 22500,
      costoUnitario: 15000,
      precioVentaUnitario: 22500,
      frecuenciaVenta: "Diaria",
      cantidadSimulada: 30
    }
  ],
  canalesCobro: [
    { id: "can_efectivo", nombre: "Efectivo", activo: true, esEfectivo: true },
    { id: "can_transf", nombre: "Transferencia", activo: true, esEfectivo: false },
    { id: "can_nx", nombre: "Naranja X", activo: true, esEfectivo: false },
    { id: "can_mp", nombre: "Mercado Pago", activo: true, esEfectivo: false },
    { id: "can_peya", nombre: "Pedidos Ya", activo: true, esEfectivo: false },
    { id: "can_rappi", nombre: "Rappi", activo: true, esEfectivo: false },
    { id: "can_may", nombre: "Mayoristas", activo: true, esEfectivo: false }
  ],
  proveedores: [
    { id: "prov_01", idProyecto: "proy_01", nombre: "Coca-Cola", idCategoria: "cat_02" },
    { id: "prov_02", idProyecto: "proy_01", nombre: "Panificación Colombres", idCategoria: "cat_01" },
    { id: "prov_03", idProyecto: "proy_01", nombre: "Pepsi", idCategoria: "cat_02" },
    { id: "prov_04", idProyecto: "proy_01", nombre: "Fabiana Golosinas", idCategoria: "cat_01" },
    { id: "prov_05", idProyecto: "proy_01", nombre: "Elisa Fiambres", idCategoria: "cat_01" }
  ],
  mayoristas: [
    { id: "may_01", idProyecto: "proy_01", nombre: "Comercio Don Pedro", direccion: "Av. San Martín 450", whatsapp: "5493815123456", porcentajeMarcacion: 15, saldoDeuda: 0 },
    { id: "may_02", idProyecto: "proy_01", nombre: "Minisuper Express", direccion: "Calle Belgrano 1200", whatsapp: "5493815987654", porcentajeMarcacion: 15, saldoDeuda: 35000 }
  ],
  comprasProveedores: [
    {
      id: "comp_01",
      idLocal: "loc_01",
      fecha: "2026-09-01",
      idProveedor: "prov_01",
      idCategoria: "cat_02",
      montoTotal: 75600,
      pagadoCaja: 0,
      pagadoCuenta: 75600,
      estadoPago: "PAGADO", // PAGADO, PAGO_PENDIENTE, PEDIDO_PENDIENTE
      metodoPago: "CUENTA" // CAJA, CUENTA, MIXTO
    },
    {
      id: "comp_02",
      idLocal: "loc_01",
      fecha: "2026-09-02",
      idProveedor: "prov_04",
      idCategoria: "cat_01",
      montoTotal: 115700,
      pagadoCaja: 115700,
      pagadoCuenta: 0,
      estadoPago: "PAGADO",
      metodoPago: "CAJA"
    }
  ],
  cajaDiaria: [
    {
      id: "caja_01",
      idLocal: "loc_01",
      fecha: "2026-09-01",
      ingresosCanales: {
        can_efectivo: 200000,
        can_transf: 0,
        can_nx: 0,
        can_mp: 0,
        can_peya: 0,
        can_rappi: 0,
        can_may: 0
      },
      retirosSocios: 0,
      notas: "Apertura mes"
    },
    {
      id: "caja_02",
      idLocal: "loc_01",
      fecha: "2026-09-02",
      ingresosCanales: {
        can_efectivo: 350000,
        can_transf: 120000,
        can_nx: 0,
        can_mp: 50000,
        can_peya: 0,
        can_rappi: 0,
        can_may: 0
      },
      retirosSocios: 0,
      notas: "Ventas regulares"
    }
  ],
  movimientosMayoristas: [
    {
      id: "mov_may_01",
      idMayorista: "may_02",
      fecha: "2026-08-28",
      tipo: "ENTREGA", // "ENTREGA" (deuda +) o "PAGO" (deuda -)
      monto: 35000,
      nota: "Entrega inicial de productos"
    }
  ],
  cuentasBancarias: [
    { id: "cta_mp", idProyecto: "proy_01", nombre: "Mercado Pago", tipo: "Billetera Digital", icono: "📲", saldo: 130000 },
    { id: "cta_nx", idProyecto: "proy_01", nombre: "Naranja X", tipo: "Billetera Digital", icono: "📙", saldo: 0 },
    { id: "cta_banco", idProyecto: "proy_01", nombre: "Banco CBU Directo", tipo: "Cuenta Bancaria", icono: "🏦", saldo: 150000 },
    { id: "cta_peya", idProyecto: "proy_01", nombre: "Pedidos Ya", tipo: "Plataforma Delivery", icono: "🛵", saldo: 0 },
    { id: "cta_rappi", idProyecto: "proy_01", nombre: "Rappi", tipo: "Plataforma Delivery", icono: "🚀", saldo: 0 }
  ],
  movimientosCuentas: [
    {
      id: "mov_cta_sem_01",
      idCuenta: "cta_mp",
      fecha: "2026-09-01",
      origenDestino: "Saldo Inicial de Cuenta",
      tipo: "INGRESO",
      monto: 130000,
      nota: "Apertura de saldo inicial"
    },
    {
      id: "mov_cta_sem_02",
      idCuenta: "cta_banco",
      fecha: "2026-09-01",
      origenDestino: "Saldo Inicial de Cuenta",
      tipo: "INGRESO",
      monto: 150000,
      nota: "Apertura de saldo inicial"
    }
  ],
  registrosReales: []
};

class BaseDatosManager {
  constructor() {
    this.estado = null;
    this.inicializar();
  }

  inicializar() {
    // Si existía el dato legacy en localStorage, se limpia
    if (localStorage.getItem(CLAVE_LOCAL_STORAGE)) {
      localStorage.removeItem(CLAVE_LOCAL_STORAGE);
    }
    this.estado = JSON.parse(JSON.stringify(DATOS_SEMILLA));
  }

  guardar(sincronizarNube = true) {
    try {
      // Ya no se guarda la tabla completa en LocalStorage. 
      // Se limpia si aún existía.
      if (localStorage.getItem(CLAVE_LOCAL_STORAGE)) {
        localStorage.removeItem(CLAVE_LOCAL_STORAGE);
      }

      // Sincronizar en tiempo real con Supabase si está activo
      if (sincronizarNube && window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
        window.ClienteSupabase.guardarEnNube(this.estado);
      }

      return true;
    } catch (error) {
      console.error("Error al sincronizar estado", error);
      return false;
    }
  }

  obtenerEstado() {
    return this.estado;
  }

  reiniciarConDatosSemilla() {
    this.estado = JSON.parse(JSON.stringify(DATOS_SEMILLA));
    this.guardar();
  }

  // Métodos de lectura rápidos
  obtenerProyectoActivo() {
    return this.estado.proyectos.find(p => p.id === this.estado.idProyectoActivo) || this.estado.proyectos[0];
  }

  obtenerLocalActivo() {
    return this.estado.locales.find(l => l.id === this.estado.idLocalActivo) || this.estado.locales[0];
  }

  obtenerGastosFijosLocalActivo() {
    return this.estado.gastosFijos.filter(g => g.idLocal === this.estado.idLocalActivo);
  }

  obtenerEmpleadosLocalActivo() {
    return this.estado.empleados.filter(e => e.idLocal === this.estado.idLocalActivo);
  }

  obtenerProductosProyectoActivo() {
    const categoriasId = this.estado.categoriasProductos
      .filter(c => c.idProyecto === this.estado.idProyectoActivo)
      .map(c => c.id);

    return this.estado.productos.filter(p => 
      p.idProyecto === this.estado.idProyectoActivo || categoriasId.includes(p.idCategoria)
    );
  }

  // PROVEEDORES
  obtenerProveedoresProyectoActivo() {
    if (!this.estado.proveedores) this.estado.proveedores = [];
    return this.estado.proveedores.filter(p => p.idProyecto === this.estado.idProyectoActivo);
  }

  guardarProveedor(proveedor) {
    if (!this.estado.proveedores) this.estado.proveedores = [];
    if (proveedor.id) {
      const idx = this.estado.proveedores.findIndex(p => p.id === proveedor.id);
      if (idx >= 0) this.estado.proveedores[idx] = proveedor;
      else this.estado.proveedores.push(proveedor);
    } else {
      proveedor.id = `prov_${Date.now()}`;
      proveedor.idProyecto = this.estado.idProyectoActivo;
      this.estado.proveedores.push(proveedor);
    }
    this.guardar();
    return proveedor;
  }

  eliminarProveedor(id) {
    if (!this.estado.proveedores) return;
    this.estado.proveedores = this.estado.proveedores.filter(p => p.id !== id);
    this.guardar();
  }

  // MAYORISTAS
  obtenerMayoristasProyectoActivo() {
    if (!this.estado.mayoristas) this.estado.mayoristas = [];
    return this.estado.mayoristas.filter(m => m.idProyecto === this.estado.idProyectoActivo);
  }

  guardarMayorista(mayorista) {
    if (!this.estado.mayoristas) this.estado.mayoristas = [];
    if (mayorista.id) {
      const idx = this.estado.mayoristas.findIndex(m => m.id === mayorista.id);
      if (idx >= 0) this.estado.mayoristas[idx] = mayorista;
      else this.estado.mayoristas.push(mayorista);
    } else {
      mayorista.id = `may_${Date.now()}`;
      mayorista.idProyecto = this.estado.idProyectoActivo;
      this.estado.mayoristas.push(mayorista);
    }
    this.guardar();
    return mayorista;
  }

  eliminarMayorista(id) {
    if (!this.estado.mayoristas) return;
    this.estado.mayoristas = this.estado.mayoristas.filter(m => m.id !== id);
    if (this.estado.movimientosMayoristas) {
      this.estado.movimientosMayoristas = this.estado.movimientosMayoristas.filter(m => m.idMayorista !== id);
    }
    this.guardar();
  }

  // MOVIMIENTOS MAYORISTAS
  obtenerMovimientosMayorista(idMayorista) {
    if (!this.estado.movimientosMayoristas) this.estado.movimientosMayoristas = [];
    return this.estado.movimientosMayoristas.filter(m => m.idMayorista === idMayorista);
  }

  guardarMovimientoMayorista(movimiento) {
    if (!this.estado.movimientosMayoristas) this.estado.movimientosMayoristas = [];
    if (!movimiento.id) movimiento.id = `mov_may_${Date.now()}`;
    this.estado.movimientosMayoristas.push(movimiento);
    this.guardar();
    return movimiento;
  }

  eliminarMovimientoMayorista(idMovimiento) {
    if (!this.estado.movimientosMayoristas) return;
    this.estado.movimientosMayoristas = this.estado.movimientosMayoristas.filter(m => m.id !== idMovimiento);
    this.guardar();
  }

  // CUENTAS Y BILLETERAS DIGITALES
  obtenerCuentasProyectoActivo() {
    if (!this.estado.cuentasBancarias) this.estado.cuentasBancarias = [];
    return this.estado.cuentasBancarias.filter(c => c.idProyecto === this.estado.idProyectoActivo);
  }

  guardarCuentaBancaria(cuenta) {
    if (!this.estado.cuentasBancarias) this.estado.cuentasBancarias = [];
    if (cuenta.id) {
      const idx = this.estado.cuentasBancarias.findIndex(c => c.id === cuenta.id);
      if (idx >= 0) this.estado.cuentasBancarias[idx] = cuenta;
      else this.estado.cuentasBancarias.push(cuenta);
    } else {
      cuenta.id = `cta_${Date.now()}`;
      cuenta.idProyecto = this.estado.idProyectoActivo;
      if (cuenta.saldo === undefined) cuenta.saldo = 0;
      this.estado.cuentasBancarias.push(cuenta);
    }
    this.guardar();
    return cuenta;
  }

  eliminarCuentaBancaria(id) {
    if (!this.estado.cuentasBancarias) return;
    this.estado.cuentasBancarias = this.estado.cuentasBancarias.filter(c => c.id !== id);
    if (this.estado.movimientosCuentas) {
      this.estado.movimientosCuentas = this.estado.movimientosCuentas.filter(m => m.idCuenta !== id);
    }
    this.guardar();
  }

  obtenerMovimientosCuenta(idCuenta) {
    if (!this.estado.movimientosCuentas) this.estado.movimientosCuentas = [];
    return this.estado.movimientosCuentas.filter(m => m.idCuenta === idCuenta);
  }

  registrarMovimientoCuenta(movimiento) {
    if (!this.estado.movimientosCuentas) this.estado.movimientosCuentas = [];
    if (!movimiento.id) movimiento.id = `mov_cta_${Date.now()}`;
    this.estado.movimientosCuentas.push(movimiento);

    // Ajustar saldo de la cuenta
    if (this.estado.cuentasBancarias) {
      const cta = this.estado.cuentasBancarias.find(c => c.id === movimiento.idCuenta);
      if (cta) {
        if (movimiento.tipo === 'INGRESO') {
          cta.saldo = (cta.saldo || 0) + movimiento.monto;
        } else if (movimiento.tipo === 'EGRESO') {
          cta.saldo = (cta.saldo || 0) - movimiento.monto;
        }
      }
    }
    this.guardar();
    return movimiento;
  }

  // COMPRAS PROVEEDORES
  obtenerComprasLocalActivo() {
    if (!this.estado.comprasProveedores) this.estado.comprasProveedores = [];
    return this.estado.comprasProveedores.filter(c => c.idLocal === this.estado.idLocalActivo);
  }

  guardarCompraProveedor(compra) {
    if (!this.estado.comprasProveedores) this.estado.comprasProveedores = [];
    if (compra.id) {
      const idx = this.estado.comprasProveedores.findIndex(c => c.id === compra.id);
      if (idx >= 0) this.estado.comprasProveedores[idx] = compra;
      else this.estado.comprasProveedores.push(compra);
    } else {
      compra.id = `comp_${Date.now()}`;
      compra.idLocal = this.estado.idLocalActivo;
      this.estado.comprasProveedores.push(compra);
    }
    this.guardar();
    return compra;
  }

  eliminarCompraProveedor(id) {
    if (!this.estado.comprasProveedores) return;
    this.estado.comprasProveedores = this.estado.comprasProveedores.filter(c => c.id !== id);
    this.guardar();
  }

  // CAJA DIARIA
  obtenerCajaDiariaLocalActivo() {
    if (!this.estado.cajaDiaria) this.estado.cajaDiaria = [];
    return this.estado.cajaDiaria.filter(c => c.idLocal === this.estado.idLocalActivo);
  }

  guardarCajaDiaria(registro) {
    if (!this.estado.cajaDiaria) this.estado.cajaDiaria = [];
    const local = this.obtenerLocalActivo();
    registro.idLocal = local.id;

    const idx = this.estado.cajaDiaria.findIndex(c => c.idLocal === local.id && c.fecha === registro.fecha);
    if (idx >= 0) {
      this.estado.cajaDiaria[idx] = registro;
    } else {
      if (!registro.id) registro.id = `caja_${Date.now()}`;
      this.estado.cajaDiaria.push(registro);
    }
    this.guardar();
    return registro;
  }

  eliminarCajaDiaria(id) {
    if (!this.estado.cajaDiaria) return;
    this.estado.cajaDiaria = this.estado.cajaDiaria.filter(c => c.id !== id);
    this.guardar();
  }

  obtenerRegistrosRealesLocalActivo() {
    if (!this.estado.registrosReales) this.estado.registrosReales = [];
    return this.estado.registrosReales.filter(r => r.idLocal === this.estado.idLocalActivo);
  }

  guardarRegistroReal(registro) {
    if (!this.estado.registrosReales) this.estado.registrosReales = [];
    if (registro.id) {
      const idx = this.estado.registrosReales.findIndex(r => r.id === registro.id);
      if (idx >= 0) {
        this.estado.registrosReales[idx] = registro;
      } else {
        this.estado.registrosReales.push(registro);
      }
    } else {
      registro.id = `rr_${Date.now()}`;
      this.estado.registrosReales.push(registro);
    }
    this.guardar();
  }

  eliminarRegistroReal(idRegistro) {
    if (!this.estado.registrosReales) return;
    this.estado.registrosReales = this.estado.registrosReales.filter(r => r.id !== idRegistro);
    this.guardar();
  }

  seleccionarProyecto(idProyecto) {
    this.estado.idProyectoActivo = idProyecto;
    const localesDelProyecto = this.estado.locales.filter(l => l.idProyecto === idProyecto);
    if (localesDelProyecto.length > 0) {
      this.estado.idLocalActivo = localesDelProyecto[0].id;
    }
    this.guardar();
  }

  seleccionarLocal(idLocal) {
    this.estado.idLocalActivo = idLocal;
    this.guardar();
  }

  restablecerDemo() {
    this.estado = JSON.parse(JSON.stringify(DATOS_SEMILLA));
    this.guardar();
  }
}

// Instancia global
window.BaseDatos = new BaseDatosManager();

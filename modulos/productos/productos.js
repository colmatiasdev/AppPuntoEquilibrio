/**
 * productos.js - Controlador del Módulo de Catálogo de Productos y Márgenes (Marcación/Markup)
 */

window.ModuloProductos = {
  categorias: [],
  productos: [],

  inicializar() {
    this.cargarDatos();
    this.configurarEventos();
  },

  async cargarDatos() {
    const estado = window.BaseDatos.obtenerEstado();

    // Si Supabase relacional esta activo, traer categorias y productos directo de la base de datos
    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        const empresaId = window.EstadoGlobal.idProyectoActivo || 'e0000000-0000-4000-8000-000000000001';
        const catsRel = await window.RepositorioRelacional.obtenerCategoriasEmpresa(empresaId);
        const prodsRel = await window.RepositorioRelacional.obtenerProductosEmpresa(empresaId);

        if (catsRel) {
          this.categorias = catsRel.map(c => ({
            id: c.id,
            nombre: c.nombre,
            porcentajeMarcacionDefecto: parseFloat(c.porcentaje_marcacion) || 0,
            frecuenciaVenta: 'Diaria'
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
              porcentajeMarcacion: Math.round(markup * 100) / 100, // Redondeo a 2 decimales
              frecuenciaVenta: frecuenciaVenta,
              cantidadSimulada: cantidadSimulada
            };
          });
        }
      } catch (err) {
        console.warn('[ModuloProductos] Fallo la carga relacional, usando fallback:', err);
        this.categorias = estado.categoriasProductos.filter(c => c.idProyecto === estado.idProyectoActivo);
        this.productos = window.BaseDatos.obtenerProductosProyectoActivo();
      }
    } else {
      this.categorias = estado.categoriasProductos.filter(c => c.idProyecto === estado.idProyectoActivo);
      this.productos = window.BaseDatos.obtenerProductosProyectoActivo();
    }

    this.renderizarCategorias();
    this.renderizarTablaProductos();
    this.actualizarResumen();
  },

  renderizarCategorias() {
    const contenedor = document.getElementById('contenedor-categorias');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    if (this.categorias.length === 0) {
      contenedor.innerHTML = '<span style="font-size: 0.85rem; color: var(--color-texto-secundario);">No hay categorías definidas.</span>';
      return;
    }

    this.categorias.forEach(cat => {
      const tag = document.createElement('div');
      tag.style.cssText = 'background-color: var(--color-fondo-pagina); border: 1px solid var(--color-borde); padding: 0.5rem 0.75rem; border-radius: 6px; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;';

      const elNombre = document.createElement('span');
      elNombre.style.fontWeight = '600';
      elNombre.textContent = cat.nombre;

      const elMarcacion = document.createElement('span');
      elMarcacion.style.cssText = 'color: var(--color-primario); font-weight: 700;';
      elMarcacion.textContent = `${cat.porcentajeMarcacionDefecto}%`;

      const elFrec = document.createElement('span');
      elFrec.style.cssText = 'color: var(--color-texto-mutado); font-size: 0.75rem;';
      elFrec.textContent = cat.frecuenciaVenta;

      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.style.cssText = 'background: none; border: none; cursor: pointer; font-size: 0.8rem;';
      btnEdit.title = 'Editar';
      btnEdit.textContent = '✏️';
      btnEdit.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.abrirModalEditarCategoria(cat.id);
      };

      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.style.cssText = 'background: none; border: none; cursor: pointer; color: var(--color-semaforo-rojo); font-size: 0.85rem; font-weight: bold; padding: 2px 6px;';
      btnDel.title = 'Eliminar';
      btnDel.textContent = '✖';
      btnDel.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.eliminarCategoria(cat.id);
      };

      tag.appendChild(elNombre);
      tag.appendChild(elMarcacion);
      tag.appendChild(elFrec);
      tag.appendChild(btnEdit);
      tag.appendChild(btnDel);

      contenedor.appendChild(tag);
    });
  },

  abrirModalEditarCategoria(id) {
    const cat = this.categorias.find(c => c.id === id);
    if (cat) {
      document.getElementById('modal-categoria-titulo').textContent = 'Editar Categoría';
      document.getElementById('categoria-id').value = cat.id;
      document.getElementById('categoria-nombre').value = cat.nombre;
      document.getElementById('categoria-marcacion').value = cat.porcentajeMarcacionDefecto;
      document.getElementById('categoria-frecuencia').value = cat.frecuenciaVenta;
      document.getElementById('modal-categoria').classList.add('activo');
    }
  },

  eliminarCategoria(id) {
    const cat = this.categorias.find(c => c.id === id);
    if (!cat) return;

    // Eliminación limpia y directa sin dependencias de diálogos bloqueados por el navegador
    const estado = window.BaseDatos.obtenerEstado();
    estado.categoriasProductos = estado.categoriasProductos.filter(c => c.id !== id);
    window.BaseDatos.guardar();
    this.cargarDatos();
  },

  renderizarTablaProductos() {
    const tbody = document.getElementById('tabla-productos-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (this.productos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--color-texto-secundario);">
            No hay productos cargados. Agregá tu primer producto.
          </td>
        </tr>
      `;
      return;
    }

    this.productos.forEach(prod => {
      const cat = this.categorias.find(c => c.id === prod.idCategoria);
      const nombreCat = cat ? cat.nombre : 'Sin Categoría';
      const porcentajeGanancia = prod.precioVentaBulto > 0
        ? ((prod.precioVentaBulto - prod.precioCostoBulto) / prod.precioVentaBulto * 100).toFixed(2)
        : '0.00';
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--color-borde)';

      tr.innerHTML = `
        <td style="padding: 0.75rem 1rem; font-weight: 600;">${prod.nombre}</td>
        <td style="padding: 0.75rem 1rem;"><span style="background-color: var(--color-primario-suave); color: var(--color-primario); padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${nombreCat}</span></td>
        <td style="padding: 0.75rem 1rem;">${prod.unidadesPorBulto}</td>
        <td style="padding: 0.75rem 1rem;">$ ${prod.precioCostoBulto.toLocaleString('es-AR')}</td>
        <td style="padding: 0.75rem 1rem; font-weight: 600;">${prod.porcentajeMarcacion}%</td>
        <td style="padding: 0.75rem 1rem; font-weight: 600; color: var(--color-semaforo-verde-oscuro);">${porcentajeGanancia}%</td>
        <td style="padding: 0.75rem 1rem; font-weight: 700; color: var(--color-primario);">$ ${prod.precioVentaBulto.toLocaleString('es-AR')}</td>
        <td style="padding: 0.75rem 1rem; font-size: 0.85rem;">$ ${prod.costoUnitario.toLocaleString('es-AR')} → $ ${prod.precioVentaUnitario.toLocaleString('es-AR')}</td>
        <td style="padding: 0.75rem 1rem; text-align: center;">
          <button class="btn btn-secundario btn-editar-producto" data-id="${prod.id}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;">✏️</button>
          <button class="btn btn-secundario btn-eliminar-producto" data-id="${prod.id}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; color: var(--color-semaforo-rojo);">🗑️</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    this.asignarEventosProductos();
  },

  actualizarResumen() {
    const totalProductos = this.productos.length;
    const totalCategorias = this.categorias.length;

    let facturacionPotencial = 0;
    const diasLab = window.BaseDatos.obtenerEstado().configuracion.diasLaborablesMes || 26;
    this.productos.forEach(p => {
      let factor = diasLab;
      if (p.frecuenciaVenta === 'Semanal') factor = 4;
      if (p.frecuenciaVenta === 'Quincenal') factor = 2;
      if (p.frecuenciaVenta === 'Mensual') factor = 1;
      facturacionPotencial += (p.precioVentaBulto * p.cantidadSimulada * factor);
    });

    const elTotal = document.getElementById('productos-total-items');
    const elCats = document.getElementById('productos-total-categorias');
    const elFact = document.getElementById('productos-facturacion-potencial');

    if (elTotal) elTotal.textContent = `${totalProductos} productos`;
    if (elCats) elCats.textContent = `${totalCategorias} categorías`;
    if (elFact) elFact.textContent = `$ ${facturacionPotencial.toLocaleString('es-AR')}`;
  },

  configurarEventos() {
    // Modal Categoría
    const btnNuevaCat = document.getElementById('btn-nueva-categoria');
    const modalCat = document.getElementById('modal-categoria');
    const btnCerrarCat = document.getElementById('btn-cerrar-modal-categoria');
    const btnCancelarCat = document.getElementById('btn-cancelar-modal-categoria');
    const formCat = document.getElementById('form-categoria');

    if (btnNuevaCat) {
      btnNuevaCat.addEventListener('click', () => {
        document.getElementById('modal-categoria-titulo').textContent = 'Nueva Categoría';
        formCat.reset();
        document.getElementById('categoria-id').value = '';
        modalCat.classList.add('activo');
      });
    }

    if (btnCerrarCat) btnCerrarCat.addEventListener('click', () => modalCat.classList.remove('activo'));
    if (btnCancelarCat) btnCancelarCat.addEventListener('click', () => modalCat.classList.remove('activo'));

    if (formCat) {
      formCat.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.guardarCategoria();
        modalCat.classList.remove('activo');
      });
    }

    // Modal Producto
    const btnNuevoProd = document.getElementById('btn-nuevo-producto');
    const modalProd = document.getElementById('modal-producto');
    const btnCerrarProd = document.getElementById('btn-cerrar-modal-producto');
    const btnCancelarProd = document.getElementById('btn-cancelar-modal-producto');
    const formProd = document.getElementById('form-producto');

    if (btnNuevoProd) {
      btnNuevoProd.addEventListener('click', () => {
        document.getElementById('modal-producto-titulo').textContent = 'Nuevo Producto';
        formProd.reset();
        document.getElementById('producto-id').value = '';
        this.cargarSelectCategorias();
        modalProd.classList.add('activo');
      });
    }

    if (btnCerrarProd) btnCerrarProd.addEventListener('click', () => modalProd.classList.remove('activo'));
    if (btnCancelarProd) btnCancelarProd.addEventListener('click', () => modalProd.classList.remove('activo'));

    if (formProd) {
      formProd.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.guardarProducto();
        modalProd.classList.remove('activo');
      });
    }

    // Auto-completar marcación al cambiar categoría
    const selectCatProd = document.getElementById('producto-categoria');
    if (selectCatProd) {
      selectCatProd.addEventListener('change', (e) => {
        const cat = this.categorias.find(c => c.id === e.target.value);
        if (cat) {
          document.getElementById('producto-marcacion').value = cat.porcentajeMarcacionDefecto;
          document.getElementById('producto-frecuencia').value = cat.frecuenciaVenta;
          this.recalcularPrecios();
        }
      });
    }

    // Recalcular precios en tiempo real al editar costo, unidades o marcación
    ['producto-costo-bulto', 'producto-unidades-bulto', 'producto-marcacion'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.recalcularPrecios());
    });
  },

  recalcularPrecios() {
    const costoBulto = parseFloat(document.getElementById('producto-costo-bulto').value) || 0;
    const unidades = parseInt(document.getElementById('producto-unidades-bulto').value) || 1;
    const marcacion = parseFloat(document.getElementById('producto-marcacion').value) || 0;

    const costoUnitario = unidades > 0 ? Math.round(costoBulto / unidades) : 0;
    const precioVentaBulto = Math.round(costoBulto * (1 + marcacion / 100));
    const precioVentaUnitario = unidades > 0 ? Math.round(precioVentaBulto / unidades) : 0;

    const elPreview = document.getElementById('producto-preview-precios');
    if (elPreview) {
      elPreview.innerHTML = `
        <span>Costo Unit: <strong>$ ${costoUnitario.toLocaleString('es-AR')}</strong></span> |
        <span>Venta Bulto: <strong style="color: var(--color-primario);">$ ${precioVentaBulto.toLocaleString('es-AR')}</strong></span> |
        <span>Venta Unit: <strong style="color: var(--color-primario);">$ ${precioVentaUnitario.toLocaleString('es-AR')}</strong></span>
      `;
    }
  },

  cargarSelectCategorias() {
    const select = document.getElementById('producto-categoria');
    if (!select) return;
    select.innerHTML = '';
    this.categorias.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = `${cat.nombre} (${cat.porcentajeMarcacionDefecto}%)`;
      select.appendChild(opt);
    });
  },

  asignarEventosProductos() {
    document.querySelectorAll('.btn-editar-producto').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const prod = this.productos.find(p => p.id === id);
        if (prod) {
          this.cargarSelectCategorias();
          document.getElementById('modal-producto-titulo').textContent = 'Editar Producto';
          document.getElementById('producto-id').value = prod.id;
          document.getElementById('producto-nombre').value = prod.nombre;
          document.getElementById('producto-categoria').value = prod.idCategoria;
          document.getElementById('producto-costo-bulto').value = prod.precioCostoBulto;
          document.getElementById('producto-unidades-bulto').value = prod.unidadesPorBulto;
          document.getElementById('producto-marcacion').value = prod.porcentajeMarcacion;
          document.getElementById('producto-frecuencia').value = prod.frecuenciaVenta;
          document.getElementById('producto-cantidad-simulada').value = prod.cantidadSimulada;
          this.recalcularPrecios();
          document.getElementById('modal-producto').classList.add('activo');
        }
      });
    });

    document.querySelectorAll('.btn-eliminar-producto').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target.closest('[data-id]');
        const id = target ? target.getAttribute('data-id') : null;
        if (id) {
          const estado = window.BaseDatos.obtenerEstado();
          estado.productos = estado.productos.filter(p => p.id !== id);
          window.BaseDatos.guardar();
          this.cargarDatos();
          window.renderizarResumenKPIs();
        }
      });
    });
  },

  async guardarCategoria() {
    const estado = window.BaseDatos.obtenerEstado();
    const id = document.getElementById('categoria-id').value;
    const nombre = document.getElementById('categoria-nombre').value;
    const porcentaje = parseFloat(document.getElementById('categoria-marcacion').value) || 0;
    const frecuencia = document.getElementById('categoria-frecuencia').value;

    if (id) {
      const cat = estado.categoriasProductos.find(c => c.id === id);
      if (cat) {
        cat.nombre = nombre;
        cat.porcentajeMarcacionDefecto = porcentaje;
        cat.frecuenciaVenta = frecuencia;
      }
    } else {
      estado.categoriasProductos.push({
        id: `cat_${Date.now()}`,
        idProyecto: estado.idProyectoActivo,
        nombre,
        porcentajeMarcacionDefecto: porcentaje,
        frecuenciaVenta: frecuencia
      });
    }

    // Sincronizar en la tabla relacional 'categorias_productos' de Supabase
    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        const empresaId = window.EstadoGlobal.idProyectoActivo || 'e0000000-0000-4000-8000-000000000001';
        const payload = {
          empresa_id: empresaId,
          nombre: nombre,
          porcentaje_marcacion: porcentaje,
          descripcion: `Frecuencia venta: ${frecuencia}`
        };
        if (id && id.length === 36) payload.id = id;

        await window.RepositorioRelacional.guardarCategoriaProducto(payload);
      } catch (err) {
        console.warn('[ModuloProductos] Error al guardar categoria en tabla relacional:', err);
      }
    }

    window.BaseDatos.guardar();
    this.cargarDatos();
  },

  async guardarProducto() {
    const estado = window.BaseDatos.obtenerEstado();
    const id = document.getElementById('producto-id').value;
    const nombre = document.getElementById('producto-nombre').value;
    const idCategoria = document.getElementById('producto-categoria').value;
    const precioCostoBulto = parseFloat(document.getElementById('producto-costo-bulto').value) || 0;
    const unidadesPorBulto = parseInt(document.getElementById('producto-unidades-bulto').value) || 1;
    const porcentajeMarcacion = parseFloat(document.getElementById('producto-marcacion').value) || 0;

    const costoBulto = parseFloat(document.getElementById('producto-costo-bulto').value) || 0;
    const unidades = parseInt(document.getElementById('producto-unidades-bulto').value) || 1;
    const marcacion = parseFloat(document.getElementById('producto-marcacion').value) || 0;
    const frecuenciaVenta = document.getElementById('producto-frecuencia').value;
    const cantidadSimulada = parseInt(document.getElementById('producto-cantidad-simulada').value) || 1;

    const costoUnitario = unidades > 0 ? Math.round(costoBulto / unidades) : 0;
    const precioVentaBulto = Math.round(costoBulto * (1 + marcacion / 100));
    const precioVentaUnitario = unidades > 0 ? Math.round(precioVentaBulto / unidades) : 0;

    const datosProd = {
      nombre,
      idCategoria,
      precioCostoBulto: costoBulto,
      unidadesPorBulto: unidades,
      porcentajeMarcacion: marcacion,
      precioVentaBulto,
      costoUnitario,
      precioVentaUnitario,
      frecuenciaVenta,
      cantidadSimulada
    };

    if (id) {
      let prod = estado.productos.find(p => p.id === id);
      if (prod) {
        Object.assign(prod, datosProd);
      } else {
        // Si no estaba en local pero vino de Supabase, lo guardamos para preservar variables locales
        datosProd.id = id;
        datosProd.idProyecto = estado.idProyectoActivo;
        estado.productos.push(datosProd);
      }
    } else {
      datosProd.id = `prod_${Date.now()}`;
      datosProd.idProyecto = estado.idProyectoActivo;
      estado.productos.push(datosProd);
    }

    // Sincronizar relacionalmente en la tabla 'productos' de Supabase
    if (window.ClienteSupabase && window.ClienteSupabase.sincronizacionActiva) {
      try {
        const empresaId = window.EstadoGlobal.idProyectoActivo || 'e0000000-0000-4000-8000-000000000001';
        const payload = {
          empresa_id: empresaId,
          categoria_id: idCategoria && idCategoria.length === 36 ? idCategoria : null,
          nombre: nombre,
          costo_unitario: costoUnitario,
          precio_venta: precioVentaUnitario,
          unidades_por_bulto: unidades,
          cantidad_simulada: cantidadSimulada,
          frecuencia_venta: frecuenciaVenta
        };
        if (id && id.length === 36) payload.id = id;

        await window.RepositorioRelacional.guardarProducto(payload);
      } catch (err) {
        console.warn('[ModuloProductos] Error al guardar producto relacional:', err);
      }
    }

    window.BaseDatos.guardar();
    await this.cargarDatos();
    window.renderizarResumenKPIs();
  }
};

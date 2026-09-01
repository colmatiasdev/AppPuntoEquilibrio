/**
 * configuracion.js - Controlador del módulo de Configuración & Marcaciones
 */

window.ModuloConfiguracion = {
  inicializar() {
    this.configurarEventos();
    this.cargarDatos();
  },

  cargarDatos() {
    this.renderizarProveedores();
  },

  configurarEventos() {
    const btnNuevo = document.getElementById('btn-nuevo-proveedor-modal');
    const modal = document.getElementById('modal-proveedor');
    const btnCerrar = document.getElementById('btn-cerrar-modal-proveedor');
    const btnCancelar = document.getElementById('btn-cancelar-modal-proveedor');
    const form = document.getElementById('form-proveedor');

    if (btnNuevo && modal) {
      btnNuevo.onclick = () => {
        document.getElementById('config-proveedor-id').value = '';
        form.reset();
        this.cargarSelectCategorias();
        modal.classList.add('activo');
      };
    }

    const cerrar = () => modal && modal.classList.remove('activo');
    if (btnCerrar) btnCerrar.onclick = cerrar;
    if (btnCancelar) btnCancelar.onclick = cerrar;

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const id = document.getElementById('config-proveedor-id').value;
        const nombre = document.getElementById('config-proveedor-nombre').value.trim();
        const idCategoria = document.getElementById('config-proveedor-categoria').value;

        window.BaseDatos.guardarProveedor({
          id: id || undefined,
          nombre,
          idCategoria
        });

        cerrar();
        this.cargarDatos();
        if (window.ModuloProveedores) window.ModuloProveedores.cargarDatos();
      };
    }
  },

  cargarSelectCategorias() {
    const select = document.getElementById('config-proveedor-categoria');
    if (!select) return;
    select.innerHTML = '';

    const estado = window.BaseDatos.obtenerEstado();
    const categorias = estado.categoriasProductos.filter(c => c.idProyecto === estado.idProyectoActivo);

    categorias.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = `${cat.nombre} (${cat.porcentajeMarcacionDefecto}%)`;
      select.appendChild(opt);
    });
  },

  renderizarProveedores() {
    const tbody = document.getElementById('tabla-config-proveedores-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const proveedores = window.BaseDatos.obtenerProveedoresProyectoActivo();
    const estado = window.BaseDatos.obtenerEstado();

    if (proveedores.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; padding: 1rem; color: var(--color-texto-secundario);">
            No hay proveedores cargados.
          </td>
        </tr>
      `;
      return;
    }

    proveedores.forEach(prov => {
      const cat = estado.categoriasProductos.find(c => c.id === prov.idCategoria);
      const catNombre = cat ? `${cat.nombre} (${cat.porcentajeMarcacionDefecto}%)` : 'Sin Categoría';

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--color-borde)';
      tr.innerHTML = `
        <td style="padding: 0.6rem; font-weight: 600;">${prov.nombre}</td>
        <td style="padding: 0.6rem; color: var(--color-texto-secundario);">${catNombre}</td>
        <td style="padding: 0.6rem; text-align: center;">
          <button class="btn btn-secundario btn-editar-prov" data-id="${prov.id}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">✏️ Edit</button>
          <button class="btn btn-secundario btn-eliminar-prov" data-id="${prov.id}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; color: var(--color-semaforo-rojo);">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-editar-prov').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const prov = proveedores.find(p => p.id === id);
        if (prov) {
          document.getElementById('config-proveedor-id').value = prov.id;
          document.getElementById('config-proveedor-nombre').value = prov.nombre;
          this.cargarSelectCategorias();
          document.getElementById('config-proveedor-categoria').value = prov.idCategoria;
          document.getElementById('modal-proveedor').classList.add('activo');
        }
      };
    });

    tbody.querySelectorAll('.btn-eliminar-prov').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('¿Eliminar este proveedor?')) {
          window.BaseDatos.eliminarProveedor(id);
          this.cargarDatos();
          if (window.ModuloProveedores) window.ModuloProveedores.cargarDatos();
        }
      };
    });
  }
};

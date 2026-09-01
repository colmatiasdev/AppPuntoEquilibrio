/**
 * portabilidad.js - Módulo de Importación, Exportación y Restablecimiento de Datos
 */

window.ModuloPortabilidad = {
  inicializar() {
    this.configurarEventos();
  },

  configurarEventos() {
    const btnExportar = document.getElementById('btn-exportar-json');
    const btnSeleccionarFile = document.getElementById('btn-seleccionar-importar-json');
    const inputFile = document.getElementById('input-importar-json');
    const btnRestablecerDemo = document.getElementById('btn-restablecer-demo');

    if (btnExportar) {
      btnExportar.onclick = () => this.exportarBaseDatos();
    }

    if (btnSeleccionarFile && inputFile) {
      btnSeleccionarFile.onclick = () => inputFile.click();
      inputFile.onchange = (e) => this.importarBaseDatos(e);
    }

    if (btnRestablecerDemo) {
      btnRestablecerDemo.onclick = () => this.restablecerDatosDemo();
    }
  },

  async exportarBaseDatos() {
    const estado = window.BaseDatos.obtenerEstado();
    const contenidoJson = JSON.stringify(estado, null, 2);
    const fechaStr = new Date().toISOString().slice(0, 10);
    const nombreSugerido = `punto_equilibrio_backup_${fechaStr}.json`;

    // Intentar usar la API nativa de dialogo "Guardar como..." (Windows Explorer / File System Access API)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: nombreSugerido,
          startIn: 'downloads',
          types: [{
            description: 'Archivo JSON de Respaldo',
            accept: { 'application/json': ['.json'] }
          }]
        });

        const writable = await handle.createWritable();
        await writable.write(contenidoJson);
        await writable.close();
        return;
      } catch (err) {
        // Si el usuario cancela el diálogo nativo, no hacemos nada más
        if (err.name === 'AbortError') return;
        console.warn('Fallback a descarga tradicional:', err);
      }
    }

    // Fallback tradicional en la carpeta Descargas (Downloads) del usuario
    const blob = new Blob([contenidoJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreSugerido;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importarBaseDatos(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const nuevoEstado = JSON.parse(event.target.result);

        // Validación estructural básica
        if (!nuevoEstado.proyectos || !nuevoEstado.locales || !nuevoEstado.gastosFijos) {
          alert('El archivo JSON no posee el formato válido de la aplicación Punto de Equilibrio.');
          return;
        }

        window.BaseDatos.estado = nuevoEstado;
        window.BaseDatos.guardar();
        window.actualizarModulosActivos();

        alert('✅ Base de datos importada con éxito. Todos los proyectos y configuraciones han sido actualizados.');
      } catch (err) {
        alert('❌ Error al procesar el archivo JSON: ' + err.message);
      }
    };

    reader.readAsText(file);
  },

  restablecerDatosDemo() {
    if (confirm('⚠️ ¿Estás seguro de que deseas restablecer los datos de demostración? Se perderán las modificaciones locales no exportadas.')) {
      window.BaseDatos.restablecerDemo();
      window.actualizarModulosActivos();
      alert('✅ Datos de demostración restablecidos correctamente.');
    }
  }
};

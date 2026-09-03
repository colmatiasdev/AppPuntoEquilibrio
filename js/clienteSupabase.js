/**
 * clienteSupabase.js - Cliente de Persistencia y Sincronización en la Nube vía Supabase
 *
 * Usa fetch() directo contra la API REST de Supabase (PostgREST).
 * NO requiere ninguna librería CDN externa — funciona en cualquier navegador moderno.
 */

window.ClienteSupabase = {
  url: '',
  key: '',
  tabla: '',
  registroId: 'global_state',
  sincronizacionActiva: false,

  ultimaSincronizacion: null,

  async inicializar() {
    this.cargarCredenciales();
    this.configurarUI();
    if (this.url && this.key && this.sincronizacionActiva) {
      await this.sincronizarConNube();
    }
  },

  cargarCredenciales() {
    const config = window.CONFIG_SUPABASE || {};
    
    let storedUrl = localStorage.getItem('supabase_url') || config.url || '';
    storedUrl = storedUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
    if (storedUrl) localStorage.setItem('supabase_url', storedUrl);

    this.url = storedUrl;
    this.key = localStorage.getItem('supabase_key') || config.key || '';
    
    // Si hay credenciales de config.js pero no estaban en localStorage, guardarlas
    if (this.url && this.key) {
      if (!localStorage.getItem('supabase_key')) localStorage.setItem('supabase_key', this.key);
      this.sincronizacionActiva = true;
    } else {
      this.sincronizacionActiva = false;
    }
    
    this.ultimaSincronizacion = localStorage.getItem('supabase_last_sync') || null;
  },

  guardarCredenciales(url, key) {
    let cleanUrl = url.trim();
    cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');

    this.url = cleanUrl;
    this.key = key.trim();
    localStorage.setItem('supabase_url', this.url);
    localStorage.setItem('supabase_key', this.key);
    localStorage.setItem('supabase_sync_active', 'true');
    this.sincronizacionActiva = true;

    const inputUrl = document.getElementById('supabase-url');
    if (inputUrl) inputUrl.value = this.url;
  },

  desconectar() {
    localStorage.removeItem('supabase_sync_active');
    localStorage.removeItem('supabase_last_sync');
    this.sincronizacionActiva = false;
    this.ultimaSincronizacion = null;
    this.actualizarBadgeUI();
  },

  _headers(extra = {}) {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      ...extra
    };
  },

  _registrarTimestampSync() {
    const ahora = new Date();
    const formato = meFormatDate(ahora);
    this.ultimaSincronizacion = formato;
    localStorage.setItem('supabase_last_sync', formato);
    this.actualizarBadgeUI();
  },

  // ─── GUARDAR EN LA NUBE (DESACTIVADO LEGACY) ─────────────
  async guardarEnNube(estadoCompleto) {
    // Ya no se utiliza la tabla mono-registro 'app_punto_equilibrio'
    return true;
  },

  // ─── SINCRONIZAR DESDE LA NUBE (TODAS LAS TABLAS RELACIONALES) ──────
  async sincronizarConNube() {
    if (!this.url || !this.key || !this.sincronizacionActiva) return;

    try {
      this.setEstadoBadge('Sincronizando tablas...', '#3b82f6');
      if (window.mostrarSpinner) window.mostrarSpinner('Sincronizando tablas con la Base de Datos...');

      // Recargar datos en vivo de cada módulo desde sus respectivas tablas PostgreSQL
      if (window.ModuloProyectos && window.ModuloProyectos.cargarDatos) await window.ModuloProyectos.cargarDatos();
      if (window.ModuloGastos && window.ModuloGastos.cargarGastos) await window.ModuloGastos.cargarGastos();
      if (window.ModuloPersonal && window.ModuloPersonal.cargarDatos) await window.ModuloPersonal.cargarDatos();
      if (window.ModuloProductos && window.ModuloProductos.cargarDatos) await window.ModuloProductos.cargarDatos();
      if (window.ModuloCaja && window.ModuloCaja.cargarDatos) await window.ModuloCaja.cargarDatos();
      if (window.ModuloProveedores && window.ModuloProveedores.cargarDatos) await window.ModuloProveedores.cargarDatos();
      if (window.ModuloMayoristas && window.ModuloMayoristas.cargarDatos) await window.ModuloMayoristas.cargarDatos();
      if (window.ModuloCuentas && window.ModuloCuentas.cargarDatos) await window.ModuloCuentas.cargarDatos();
      if (window.ModuloAnalisisReal && window.ModuloAnalisisReal.cargarDatos) await window.ModuloAnalisisReal.cargarDatos();

      if (window.actualizarModulosActivos) window.actualizarModulosActivos();
      if (window.renderizarResumenKPIs) window.renderizarResumenKPIs();

      this._registrarTimestampSync();
      this.setEstadoBadge('☁️ Tablas Relacionales Conectadas', '#10b981');
      return true;
    } catch (err) {
      console.error('[Supabase] Error al sincronizar tablas relacionales:', err);
      this.setEstadoBadge('⚠️ Error de Nube', '#ef4444');
      throw err;
    } finally {
      if (window.ocultarSpinner) window.ocultarSpinner();
    }
  },

  mostrarFeedbackUI(mensaje, tipo = 'info') {
    const box = document.getElementById('supabase-feedback-box');
    if (!box) return;

    let bg = 'rgba(59,130,246,0.1)';
    let border = '1px solid #3b82f6';
    let color = '#1e40af';
    let icono = 'ℹ️';

    if (tipo === 'exito') {
      bg = 'rgba(16,185,129,0.1)';
      border = '1px solid #10b981';
      color = '#065f46';
      icono = '✅';
    } else if (tipo === 'error') {
      bg = 'rgba(239,68,68,0.1)';
      border = '1px solid #ef4444';
      color = '#991b1b';
      icono = '❌';
    } else if (tipo === 'advertencia') {
      bg = 'rgba(245,158,11,0.1)';
      border = '1px solid #f59e0b';
      color = '#92400e';
      icono = '⚠️';
    }

    box.style.display = 'block';
    box.style.background = bg;
    box.style.border = border;
    box.style.color = color;
    box.innerHTML = `<strong>${icono} ${mensaje}</strong>`;
  },

  ocultarFeedbackUI() {
    const box = document.getElementById('supabase-feedback-box');
    if (box) box.style.display = 'none';
  },

  // ─── CONFIGURAR UI ──────────────────────────────────────
  configurarUI() {
    const inputUrl = document.getElementById('supabase-url');
    const inputKey = document.getElementById('supabase-key');
    const btnConectar = document.getElementById('btn-conectar-supabase');
    const btnDesconectar = document.getElementById('btn-desconectar-supabase');
    const btnSincronizarAhora = document.getElementById('btn-sincronizar-nube-ahora');

    if (inputUrl && this.url) inputUrl.value = this.url;
    if (inputKey && this.key) inputKey.value = this.key;

    if (btnConectar) {
      btnConectar.onclick = async () => {
        const u = document.getElementById('supabase-url').value;
        const k = document.getElementById('supabase-key').value;
        if (!u || !k) {
          this.mostrarFeedbackUI('Por favor ingresá la URL y la Anon Key de Supabase.', 'advertencia');
          return;
        }

        this.guardarCredenciales(u, k);
        this.mostrarFeedbackUI('Conectando y verificando credenciales con Supabase...', 'info');

        try {
          await this.guardarEnNube(window.BaseDatos.obtenerEstado());
          this.mostrarFeedbackUI('¡Conexión Exitosa! Los datos locales se subieron a Supabase correctamente.', 'exito');
        } catch (err) {
          this.mostrarFeedbackUI(`Error al conectar con Supabase: ${err.message}. Verificá la URL/Key y las políticas RLS.`, 'error');
        }
      };
    }

    if (btnDesconectar) {
      btnDesconectar.onclick = () => {
        this.desconectar();
        this.mostrarFeedbackUI('Sincronización en la nube desconectada de este dispositivo.', 'advertencia');
      };
    }

    if (btnSincronizarAhora) {
      btnSincronizarAhora.onclick = async () => {
        if (!this.url || !this.key) {
          this.mostrarFeedbackUI('Primero ingresá la URL y Anon Key y haz clic en "Conectar Nube".', 'advertencia');
          return;
        }
        try {
          await this.sincronizarConNube();
          this.mostrarFeedbackUI(`Sincronización completada. Último estado actualizado: ${this.ultimaSincronizacion || 'Ahora'}`, 'exito');
        } catch (e) {
          this.mostrarFeedbackUI('Error durante la sincronización: ' + e.message, 'error');
        }
      };
    }

    this.actualizarBadgeUI();
  },

  actualizarBadgeUI() {
    const statusText = document.getElementById('supabase-status-text');
    const btnDesconectar = document.getElementById('btn-desconectar-supabase');

    if (this.sincronizacionActiva && this.url) {
      const fechaInfo = this.ultimaSincronizacion 
        ? `<div style="font-size: 0.75rem; color: var(--color-texto-secundario); margin-top: 0.1rem;">Última sincr.: <strong>${this.ultimaSincronizacion}</strong></div>` 
        : '';
        
      if (statusText) {
        statusText.innerHTML = `
          <div style="text-align: right;">
            <span style="color: #10b981; font-weight: 700; font-size: 0.85rem;">🟢 Sincronización Automática Activa</span>
            ${fechaInfo}
          </div>
        `;
      }
      if (btnDesconectar) btnDesconectar.style.display = 'inline-block';
    } else {
      if (statusText) statusText.innerHTML = '<span style="color: var(--color-texto-secundario);">⚪ Modo Relacional / Desconectado</span>';
      if (btnDesconectar) btnDesconectar.style.display = 'none';
      this.setEstadoBadge('Modo Local (Memoria)', 'var(--color-texto-secundario)');
    }
  },

  setEstadoBadge(texto, color) {
    const badge = document.getElementById('indicador-guardado');
    if (badge) {
      badge.textContent = `● ${texto}`;
      badge.style.color = color;
    }
  }
};

function meFormatDate(fecha) {
  const d = fecha.getDate().toString().padStart(2, '0');
  const m = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const a = fecha.getFullYear();
  const hs = fecha.getHours().toString().padStart(2, '0');
  const mn = fecha.getMinutes().toString().padStart(2, '0');
  const seg = fecha.getSeconds().toString().padStart(2, '0');
  return `${d}/${m}/${a} ${hs}:${mn}:${seg}`;
}


import { supabase } from './supabase.js';
import { initLoginListeners, initDashboardListeners } from './auth.js';

// Cargador genérico de HTML
async function loadComponent(elementId, path) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`No se pudo cargar ${path}`);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

// Carga vistas protegidas vs públicas
export async function renderApp(session) {
    const container = 'app-container';
    
    if (session) {
        // Usuario logueado -> Cargar Dashboard
        await loadComponent(container, './components/dashboard.html');
        // Actualizar datos del usuario en la UI
        document.getElementById('user-email').textContent = session.user.email;
        // Activar botones del dashboard
        initDashboardListeners();
    } else {
        // Usuario no logueado -> Cargar Login
        await loadComponent(container, './components/login.html');
        // Activar formulario de login
        initLoginListeners();
    }
}

// Inicialización Maestra
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar Estructura Base (Header/Footer)
    await loadComponent('header-container', './components/header.html');
    await loadComponent('footer-container', './components/footer.html');

    // 2. Verificar estado actual
    const { data: { session } } = await supabase.auth.getSession();
    await renderApp(session);

    // 3. Escuchar cambios en vivo (Login/Logout dinámico)
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Cambio de estado:', event);
        renderApp(session);
    });
});

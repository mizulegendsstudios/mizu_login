import { supabase } from './supabase.js'; 
import { 
    initLoginListeners, 
    initDashboardListeners, 
    initRegisterListeners, 
    initForgotListeners,
    initResetPasswordListeners
} from './auth.js';

// --- ESTRATEGIA SNAPSHOT (CRÍTICO) ---
// Capturamos la URL en el milisegundo 0, antes de que Supabase o el navegador la limpien.
// Guardamos esto en una constante que nadie puede modificar.
const INITIAL_URL = window.location.href;
console.log("📸 FOTO INICIAL URL:", INITIAL_URL);

// --- SISTEMA DE CARGA DE VISTAS ---
export async function loadView(viewName) {
    const containerId = 'app-container';
    let path = '';
    let initFunction = null;

    switch (viewName) {
        case 'login':
            path = './components/login.html';
            initFunction = initLoginListeners;
            break;
        case 'register':
            path = './components/register.html';
            initFunction = initRegisterListeners;
            break;
        case 'forgot':
            path = './components/forgot.html';
            initFunction = initForgotListeners;
            break;
        case 'reset-password': 
            path = './components/reset-password.html';
            initFunction = initResetPasswordListeners;
            break;
        case 'dashboard':
            path = './components/dashboard.html';
            initFunction = initDashboardListeners;
            break;
        default:
            console.error('Vista no reconocida:', viewName);
            return;
    }

    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Fallo al cargar ${path}`);
        const html = await response.text();
        document.getElementById(containerId).innerHTML = html;
        if (initFunction) initFunction();
    } catch (err) {
        console.error('Error al cargar la vista:', err);
    }
}

// --- LÓGICA PRINCIPAL ---
export async function renderApp(session, event = null) {
    
    // 1. ANÁLISIS FORENSE DEL SNAPSHOT
    // Usamos la variable INITIAL_URL que capturamos al principio, NO window.location actual
    const urlToCheck = INITIAL_URL; 
    
    const hasRecoveryType = urlToCheck.includes('type=recovery');
    // A veces Supabase usa 'type=signup' o solo el token, pero 'type=recovery' es el estándar para esto.
    
    // 2. INTERCEPCIÓN
    // Si la URL original tenía "recovery" O el evento explícito es recuperación
    if (hasRecoveryType || event === 'PASSWORD_RECOVERY') {
        console.log("🚨 DETECCIÓN POSITIVA: Modo Recuperación activado.");
        await loadView('reset-password');
        return; 
    }

    // 3. FLUJO NORMAL
    if (session) {
        await loadView('dashboard');
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement) {
            userEmailElement.textContent = session.user.email;
        }
    } else {
        await loadView('login');
    }
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    
    // Carga de estructura base
    try {
        const headerRes = await fetch('./components/header.html');
        document.getElementById('header-container').innerHTML = await headerRes.text();
        const footerRes = await fetch('./components/footer.html');
        document.getElementById('footer-container').innerHTML = await footerRes.text();
    } catch (e) { console.error("Error estático", e); }

    // Obtenemos sesión
    const { data: { session } } = await supabase.auth.getSession();
    
    // Renderizamos pasando SOLO la sesión inicial.
    // La magia del INITIAL_URL dentro de renderApp hará el trabajo sucio.
    await renderApp(session); 

    // Escuchamos eventos futuros
    supabase.auth.onAuthStateChange((event, session) => {
        // Si el evento es SIGNED_IN (que ocurre al hacer clic en el link),
        // renderApp volverá a ejecutarse. Como INITIAL_URL sigue teniendo "recovery",
        // nos mantendrá en la página correcta.
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
             renderApp(session, event);
        }
    });
});

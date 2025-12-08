import { supabase } from './supabase.js'; 
import { 
    initLoginListeners, 
    initDashboardListeners, 
    initRegisterListeners, 
    initForgotListeners,
    initResetPasswordListeners
} from './auth.js';

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

// --- LÓGICA PRINCIPAL DE ESTADO ---
// Aceptamos 'event' como segundo parámetro para interceptar la señal de Supabase
export async function renderApp(session, event = null) {
    
    console.log(`Evento: ${event}, Sesión: ${session ? 'Activa' : 'Inactiva'}`);

    // 1. PRIORIDAD ABSOLUTA: Evento de Recuperación de Contraseña
    // Si Supabase nos dice "Este usuario entró por recuperación", obedecemos.
    if (event === 'PASSWORD_RECOVERY') {
        console.log("🚨 ALERTA: Modo de Recuperación Detectado por Evento.");
        await loadView('reset-password');
        return; // Detenemos aquí. No cargamos dashboard.
    }

    // 2. Comportamiento normal
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
    
    // Cargar componentes estáticos
    try {
        const headerRes = await fetch('./components/header.html');
        document.getElementById('header-container').innerHTML = await headerRes.text();
        const footerRes = await fetch('./components/footer.html');
        document.getElementById('footer-container').innerHTML = await footerRes.text();
    } catch (e) { console.error("Error cargando header/footer"); }

    // Verificar sesión inicial (sin evento todavía)
    const { data: { session } } = await supabase.auth.getSession();
    
    // NOTA: Al cargar la página por primera vez con el link de correo, 
    // onAuthStateChange se disparará casi inmediatamente después.
    // Por eso aquí solo renderizamos el estado base.
    await renderApp(session); 

    // ESCUCHA DE EVENTOS EN VIVO
    supabase.auth.onAuthStateChange((event, session) => {
        console.log("⚡ Cambio de estado detectado:", event);
        // Pasamos el evento explícitamente a renderApp
        renderApp(session, event);
    });
});

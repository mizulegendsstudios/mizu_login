import { supabase } from './supabase.js'; 
import { 
    initLoginListeners, 
    initDashboardListeners, 
    initRegisterListeners, 
    initForgotListeners,
    initResetPasswordListeners
} from './auth.js';

/**
 * Carga el componente HTML en el contenedor principal y adjunta sus listeners.
 * @param {string} viewName - El nombre de la vista a cargar.
 */
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
        
        // Ejecutar la lógica de eventos específica
        if (initFunction) initFunction();

    } catch (err) {
        console.error('Error al cargar la vista:', err);
    }
}

/**
 * Decide qué vista mostrar basado en el estado de autenticación y los parámetros de la URL.
 * @param {object | null} session - El objeto de sesión actual de Supabase.
 */
export async function renderApp(session) {
    
    // 1. Verificar tokens de Supabase en el Query String (?)
    const searchParams = new URLSearchParams(window.location.search);
    const searchType = searchParams.get('type');
    const searchAccessToken = searchParams.get('access_token');
    
    // 2. Verificar tokens en el HASH (#)
    const hash = window.location.hash.substring(1); 
    const hashParams = new URLSearchParams(hash);
    const hashType = hashParams.get('type');
    const hashAccessToken = hashParams.get('access_token');
    
    // INTERCEPCIÓN: Si encontramos 'recovery' o un token en cualquiera de los dos lugares.
    if (searchType === 'recovery' || hashType === 'recovery' || searchAccessToken || hashAccessToken) { 
        
        await loadView('reset-password');
        
        // Limpiamos los tokens de la URL después de la intercepción
        window.history.replaceState(null, '', window.location.pathname);
        return; 
    }

    // 3. Comportamiento normal (Cargar Login o Dashboard)
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

// Inicialización del motor de la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    
    // Cargar Header y Footer
    try {
        const headerRes = await fetch('./components/header.html');
        document.getElementById('header-container').innerHTML = await headerRes.text();
        
        const footerRes = await fetch('./components/footer.html');
        document.getElementById('footer-container').innerHTML = await footerRes.text();
    } catch (e) {
        console.error("Error al cargar componentes estáticos.");
    }

    // Obtener estado inicial de la sesión
    const { data: { session } } = await supabase.auth.getSession();
    await renderApp(session);

    // Escuchar cualquier cambio de autenticación en tiempo real
    supabase.auth.onAuthStateChange((event, session) => {
        // Redibuja la aplicación si el estado de auth cambia
        renderApp(session);
    });
});

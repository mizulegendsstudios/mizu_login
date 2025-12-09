import { supabase } from './supabase.js'; 
import { 
    initLoginListeners, 
    initDashboardListeners, 
    initRegisterListeners, 
    initForgotListeners,
    initResetPasswordListeners
} from './auth.js';

// --- ESTRATEGIA SNAPSHOT ---
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
    
    // Detectamos si hay intención de recuperación
    const urlToCheck = INITIAL_URL; 
    const hasRecoveryToken = urlToCheck.includes('access_token') && urlToCheck.includes('type=recovery');
    const isRecoveryEvent = event === 'PASSWORD_RECOVERY';
    
    // --- LÓGICA DE PRIORIDAD (Aquí rompemos el bucle) ---
    
    // CASO 1: Sesión activa NORMAL.
    // Si tenemos sesión y NO es un evento explícito de recuperación, vamos al Dashboard.
    // Esto evita que un token viejo en INITIAL_URL nos secuestre si ya estamos logueados bien.
    if (session && !isRecoveryEvent) {
        
        // Sincronización de seguridad para asegurar el email
        const { data: { user } } = await supabase.auth.getUser();
        const finalUser = user || session.user;

        await loadView('dashboard');
        const userEmailElement = document.getElementById('user-email');

        if (userEmailElement) {
            userEmailElement.textContent = finalUser?.email || "Cargando..."; 
        }
        return;
    }

    // CASO 2: Modo Recuperación (Solo si NO hay sesión o si el evento lo manda)
    if (hasRecoveryToken || isRecoveryEvent) {
        console.log("🚨 DETECCIÓN POSITIVA: Modo Recuperación activado.");
        
        // Reparación manual de sesión si es necesaria
        if (!session) {
            console.log("🛠️ Intentando reparación manual de sesión...");
            try {
                const hashFragment = urlToCheck.split('#').pop(); 
                const params = new URLSearchParams(hashFragment);
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (accessToken && refreshToken) {
                    await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });
                    console.log("✅ Sesión restaurada manualmente.");
                }
            } catch (err) {
                console.error("Error parseando tokens:", err);
            }
        }

        await loadView('reset-password');
        return; 
    }

    // CASO 3: Usuario no logueado -> Login
    await loadView('login');
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    
    try {
        const headerRes = await fetch('./components/header.html');
        document.getElementById('header-container').innerHTML = await headerRes.text();
        const footerRes = await fetch('./components/footer.html');
        document.getElementById('footer-container').innerHTML = await footerRes.text();
    } catch (e) { console.error("Error estático", e); }

    const { data: { session } } = await supabase.auth.getSession();
    
    await renderApp(session); 

    supabase.auth.onAuthStateChange((event, session) => {
        // Ignoramos INITIAL_SESSION si tenemos un token de recuperación pendiente
        // para dejar que la lógica de renderApp maneje la reparación manual.
        if (event === 'INITIAL_SESSION' && INITIAL_URL.includes('type=recovery')) return;

        renderApp(session, event);
    });
});

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
    
    // 1. ANÁLISIS FORENSE
    const urlToCheck = INITIAL_URL; 
    const hasRecoveryType = urlToCheck.includes('type=recovery');
    
    // 2. INTERCEPCIÓN Y REPARACIÓN MANUAL
    if (hasRecoveryType || event === 'PASSWORD_RECOVERY') {
        console.log("🚨 DETECCIÓN POSITIVA: Modo Recuperación activado.");
        
        // --- CIRUGÍA: ALIMENTACIÓN MANUAL DE SESIÓN ---
        // Si no hay sesión (porque falló el doble hash ##), la forzamos usando los datos de la URL.
        if (!session) {
            console.log("🛠️ Intentando reparación manual de sesión...");
            try {
                // Obtenemos todo lo que está después del último '#'
                const hashFragment = urlToCheck.split('#').pop(); 
                const params = new URLSearchParams(hashFragment);
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (accessToken && refreshToken) {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });
                    
                    if (!error) {
                        console.log("✅ Sesión restaurada manualmente con éxito.");
                    } else {
                        console.error("❌ Fallo al restaurar sesión manualmente:", error);
                    }
                }
            } catch (err) {
                console.error("Error parseando tokens:", err);
            }
        }
        // ------------------------------------------------

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
    try {
        const headerRes = await fetch('./components/header.html');
        document.getElementById('header-container').innerHTML = await headerRes.text();
        const footerRes = await fetch('./components/footer.html');
        document.getElementById('footer-container').innerHTML = await footerRes.text();
    } catch (e) { console.error("Error estático", e); }

    const { data: { session } } = await supabase.auth.getSession();
    await renderApp(session); 

    supabase.auth.onAuthStateChange((event, session) => {
        // Ignoramos el evento INITIAL_SESSION si ya detectamos recuperación para evitar parpadeos
        if (event === 'INITIAL_SESSION' && INITIAL_URL.includes('type=recovery')) return;

        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
             renderApp(session, event);
        }
    });
});

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
    
    // 1. DETECCIÓN: ¿Es esto un intento de recuperación?
    const urlToCheck = INITIAL_URL; 
    
    // Buscamos 'type=recovery'. Esta es la bandera maestra.
    // También buscamos 'access_token' por si acaso, pero 'type=recovery' es lo que distingue
    // un "login por recuperación" de un "login mágico" o normal.
    const isRecoveryFlow = urlToCheck.includes('type=recovery') || event === 'PASSWORD_RECOVERY';

    // 2. PRIORIDAD MÁXIMA: MODO RECUPERACIÓN
    // Si detectamos recuperación, MOSTRAMOS el reset password,
    // NO IMPORTA si ya existe una sesión (Supabase auto-loguea, así que es normal tener sesión).
    if (isRecoveryFlow) {
        console.log("🚨 PRIORIDAD: Modo Recuperación activado. Ignorando Dashboard.");
        
        // Reparación manual de sesión SOLO si Supabase falló en el auto-login (el caso ##)
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
        return; // DETENEMOS AQUÍ para que no cargue el dashboard
    }

    // 3. PRIORIDAD SECUNDARIA: SESIÓN NORMAL
    // Solo llegamos aquí si NO es un flujo de recuperación.
    if (session) {
        const { data: { user } } = await supabase.auth.getUser();
        const finalUser = user || session.user;

        await loadView('dashboard');
        const userEmailElement = document.getElementById('user-email');

        if (userEmailElement) {
            userEmailElement.textContent = finalUser?.email || "Cargando..."; 
        }
        return;
    }

    // 4. SI NADA DE LO ANTERIOR: LOGIN
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
        // Ignoramos INITIAL_SESSION si estamos en modo recuperación
        // para evitar que la detección de sesión nos saque de la pantalla de reset.
        if (event === 'INITIAL_SESSION' && INITIAL_URL.includes('type=recovery')) return;

        renderApp(session, event);
    });
});

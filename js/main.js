import { supabase } from './supabase.js'; 
import { 
    initLoginListeners, 
    initDashboardListeners, 
    initRegisterListeners, 
    initForgotListeners,
    initResetPasswordListeners
} from './auth.js';

// Importamos la nueva lógica y la variable de estado del perfil
import { initProfilesListeners, activeProfile } from './profiles.js';

// --- ESTRATEGIA SNAPSHOT (Necesaria para manejar el token de recuperación) ---
const INITIAL_URL = window.location.href;
console.log("📸 FOTO INICIAL URL:", INITIAL_URL);

// --- SISTEMA DE CARGA DE VISTAS ---
export async function loadView(viewName) {
    const containerId = 'app-container';
    let path = '';
    let initFunction = null;

    switch (viewName) {
        case 'login': path = './components/login.html'; initFunction = initLoginListeners; break;
        case 'register': path = './components/register.html'; initFunction = initRegisterListeners; break;
        case 'forgot': path = './components/forgot.html'; initFunction = initForgotListeners; break;
        case 'reset-password': path = './components/reset-password.html'; initFunction = initResetPasswordListeners; break;
        
        // NUEVA RUTA DE PERFILES
        case 'profiles': 
            path = './components/profiles.html'; 
            initFunction = initProfilesListeners; 
            break;
            
        case 'dashboard': path = './components/dashboard.html'; initFunction = initDashboardListeners; break;
        default: console.error('Vista no reconocida:', viewName); return;
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
    
    // 1. PRIORIDAD MÁXIMA: MODO RECUPERACIÓN (Mantiene la solución anterior)
    const urlToCheck = INITIAL_URL; 
    const isRecoveryFlow = urlToCheck.includes('type=recovery') || event === 'PASSWORD_RECOVERY';

    if (isRecoveryFlow) {
        console.log("🚨 PRIORIDAD: Modo Recuperación activado.");
        
        // Reparación manual de sesión si es necesaria
        if (!session) {
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
                }
            } catch (err) {
                console.error("Error parseando tokens:", err);
            }
        }

        await loadView('reset-password');
        return; 
    }

    // 2. PRIORIDAD SECUNDARIA: SESIÓN NORMAL
    if (session) {
        
        // 🔑 NUEVO: Comprobamos si hay un perfil activo
        if (activeProfile) {
            // SÍ: Perfil activo, vamos al Dashboard
            
            // Sincronización de seguridad para asegurar el email (en caso de que se necesite)
            const { data: { user } } = await supabase.auth.getUser();
            const finalUser = user || session.user;

            await loadView('dashboard');
            
            // Inyectar datos del perfil en el dashboard inmediatamente
            const profileNameElement = document.getElementById('profile-name');
            const profileRoleElement = document.getElementById('profile-role');
            
            if (profileNameElement) profileNameElement.textContent = activeProfile.nickname;
            if (profileRoleElement) profileRoleElement.textContent = activeProfile.role;
            
        } else {
            // NO: Hay sesión, pero falta elegir el perfil
            await loadView('profiles');
        }
        return;
    }

    // 3. Si nada de lo anterior: LOGIN
    await loadView('login');
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    
    // Carga de estructura base (Header/Footer)
    try {
        const headerRes = await fetch('./components/header.html');
        document.getElementById('header-container').innerHTML = await headerRes.text();
        const footerRes = await fetch('./components/footer.html');
        document.getElementById('footer-container').innerHTML = await footerRes.text();
    } catch (e) { console.error("Error al cargar componentes estáticos", e); }

    // Obtenemos sesión
    const { data: { session } } = await supabase.auth.getSession();
    
    // Renderizamos la primera vista
    await renderApp(session); 

    // Escuchamos eventos futuros
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION' && INITIAL_URL.includes('type=recovery')) return;

        renderApp(session, event);
    });
});

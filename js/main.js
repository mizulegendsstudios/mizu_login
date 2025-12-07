import { supabase } from './supabase.js'; 
import { 
    initLoginListeners, 
    initDashboardListeners, 
    initRegisterListeners, 
    initForgotListeners,
    initResetPasswordListeners
} from './auth.js';

// Función genérica para cargar componentes HTML en el contenedor principal
export async function loadView(viewName) {
    const containerId = 'app-container';
    let path = '';
    let initFunction = null;

    // Asignación de ruta y función de inicialización para todas las vistas
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

    // Carga del componente y ejecución de la lógica
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

// Decide qué vista cargar basada en el estado de autenticación y la URL
export async function renderApp(session) {
    
    // 1. REVISIÓN CRÍTICA: Buscar tokens de Supabase en el Query String (?)
    // Esto intercepta el redireccionamiento después de hacer clic en el email.
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const accessToken = params.get('access_token');
    
    // Si encontramos el token de recuperación (recovery) O el token de acceso (access_token),
    // asumimos que es el flujo de recuperación y cargamos la vista de reseteo.
    if (type === 'recovery' || accessToken) {
        
        console.log("INTERCEPCIÓN DE URL: Cargando formulario de reseteo.");
        await loadView('reset-password');
        
        // Limpiamos la URL de los tokens después de la carga
        window.history.replaceState(null, '', window.location.pathname);
        return; 
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

// Inicialización del motor de la aplicación
document.addEventListener('DOMContentLoaded', async () => {
    
    // Cargar Header y Footer
    try {
        const headerRes = await fetch('./components/header.html');
        document.getElementById('header-container').innerHTML = await headerRes.text();
        
        const footerRes = await fetch('./components/footer.html');
        document.getElementById('footer-container').innerHTML = await footerRes.text();
    } catch (e) {
        console.error("Asegúrate de que components/header.html y footer.html existan.");
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

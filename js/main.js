import { supabase } from './supabase.js'; // Asumido desde paso 3
import { 
    initLoginListeners, 
    initDashboardListeners, 
    initRegisterListeners, 
    initForgotListeners,
    initResetPasswordListeners // <- Nuevo listener importado
} from './auth.js';

// Función genérica para cargar componentes HTML en el contenedor principal
export async function loadView(viewName) {
    const containerId = 'app-container';
    let path = '';
    let initFunction = null;

    // 1. Asignación de ruta y función de inicialización
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
        case 'reset-password': // Maneja la intercepción del link de recuperación
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

    // 2. Carga del componente HTML y ejecución de la lógica
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Fallo al cargar ${path}`);
        const html = await response.text();
        document.getElementById(containerId).innerHTML = html;
        
        // Ejecutamos la lógica específica de esa vista (asigna eventos)
        if (initFunction) initFunction();

    } catch (err) {
        console.error('Error al cargar la vista:', err);
    }
}

// Decide qué vista cargar basada en el estado de autenticación y la URL
export async function renderApp(session) {
    
    // 1. Revisamos el URL para interceptar el link de recuperación
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    
    if (type === 'recovery') {
        // Si hay token de recuperación en la URL, cargamos el formulario de reseteo
        await loadView('reset-password');
        
        // Limpiamos los parámetros del URL para evitar recargas erróneas
        window.history.replaceState(null, '', window.location.pathname);
        return; 
    }

    // 2. Comportamiento normal (sin token de recuperación)
    if (session) {
        await loadView('dashboard');
        // Asegurarse de que el elemento existe antes de intentar establecer el texto
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement) {
            userEmailElement.textContent = session.user.email;
        }
    } else {
        await loadView('login');
    }
}

// Inicialización Maestra al cargar el DOM
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar Header y Footer estáticos
    const headerRes = await fetch('./components/header.html');
    document.getElementById('header-container').innerHTML = await headerRes.text();
    
    const footerRes = await fetch('./components/footer.html');
    document.getElementById('footer-container').innerHTML = await footerRes.text();

    // Obtener estado inicial y renderizar
    const { data: { session } } = await supabase.auth.getSession();
    await renderApp(session);

    // Escuchar cambios en vivo (Login/Logout/etc.)
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
            renderApp(session);
        }
    });
});

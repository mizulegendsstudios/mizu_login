import { supabase } from './supabase.js';
import { initLoginListeners, initDashboardListeners, initRegisterListeners, initForgotListeners } from './auth.js';

// --- Hacemos exportable esta función para usarla en auth.js ---
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
        case 'dashboard':
            path = './components/dashboard.html';
            initFunction = initDashboardListeners;
            break;
    }

    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Fallo al cargar ${path}`);
        const html = await response.text();
        document.getElementById(containerId).innerHTML = html;
        
        // Ejecutamos la lógica específica de esa vista
        if (initFunction) initFunction();

    } catch (err) {
        console.error(err);
    }
}

export async function renderApp(session) {
    if (session) {
        await loadView('dashboard');
        document.getElementById('user-email').textContent = session.user.email;
    } else {
        await loadView('login');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Cargar layout base
    const headerRes = await fetch('./components/header.html');
    document.getElementById('header-container').innerHTML = await headerRes.text();
    
    const footerRes = await fetch('./components/footer.html');
    document.getElementById('footer-container').innerHTML = await footerRes.text();

    // Sesión
    const { data: { session } } = await supabase.auth.getSession();
    await renderApp(session);

    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            renderApp(session);
        }
    });
});

import { supabase } from './supabase.js';
import { loadDashboard } from './main.js'; // Referencia circular manejada con cuidado

// Función para iniciar sesión
export async function handleLogin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert('Error en la maniobra: ' + error.message);
    } else {
        // El listener de onAuthStateChange en main.js detectará esto
        console.log('Login exitoso:', data);
    }
}

// Función para cerrar sesión
export async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error al salir:', error);
    // La página se recargará o main.js detectará el cambio
}

// Asigna el evento al formulario de Login (Se llama DESPUÉS de cargar login.html)
export function initLoginListeners() {
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('btn-submit');
            
            btn.textContent = 'Autenticando...';
            btn.disabled = true;
            
            await handleLogin(email, password);
            
            btn.textContent = 'Entrar';
            btn.disabled = false;
        });
    }
}

// Asigna el evento al botón de Logout (Se llama DESPUÉS de cargar dashboard.html)
export function initDashboardListeners() {
    const btn = document.getElementById('btn-logout');
    if (btn) {
        btn.addEventListener('click', handleLogout);
    }
}

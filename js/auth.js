import { supabase } from './supabase.js';

// NOTA: Ya no importamos nada de main.js para evitar el error de referencia circular.
// La actualización de la pantalla la hará el listener en main.js automáticamente.

// Función para iniciar sesión
export async function handleLogin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert('Error en la maniobra: ' + error.message);
        throw error; // Lanzamos el error para que el botón sepa que falló
    } else {
        console.log('Login exitoso. Supabase notificará a main.js');
    }
}

// Función para cerrar sesión
export async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error al salir:', error);
}

// Asigna el evento al formulario de Login
export function initLoginListeners() {
    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = document.getElementById('btn-submit');
            
            // Guardamos el texto original
            const originalText = btn.textContent;
            
            try {
                btn.textContent = 'Autenticando...';
                btn.disabled = true;
                
                await handleLogin(email, password);
                // Si todo sale bien, main.js cambiará la pantalla a Dashboard
                
            } catch (error) {
                // Si falla, restauramos el botón
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
}

// Asigna el evento al botón de Logout
export function initDashboardListeners() {
    const btn = document.getElementById('btn-logout');
    if (btn) {
        btn.addEventListener('click', handleLogout);
    }
}

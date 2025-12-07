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

// Asigna el evento al formulario de Login con VALIDACIÓN DE DOMINIO
export function initLoginListeners() {
    const form = document.getElementById('login-form');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('email');
            const password = document.getElementById('password').value;
            const btn = document.getElementById('btn-submit');
            
            const email = emailInput.value.trim().toLowerCase(); // Limpiamos espacios y pasamos a minúsculas

            // 1. Definir los dominios permitidos (White List)
            const allowedDomains = [
                'gmail.com',
                'outlook.com',
                'hotmail.com',
                'yahoo.com',
                'icloud.com',
                'proton.me',
                'protonmail.com',
                'naver.com',
                'aol.com',
                'live.com'
            ];

            // 2. Extraer el dominio del correo escrito
            const emailParts = email.split('@');
            
            // Validación básica de formato (que tenga arroba y texto después)
            if (emailParts.length !== 2 || !emailParts[1]) {
                alert("Por favor, escribe un correo válido.");
                return;
            }

            const domain = emailParts[1];

            // 3. Verificar si el dominio está en nuestra lista
            if (!allowedDomains.includes(domain)) {
                alert(`🚫 Acceso restringido.\n\nSolo aceptamos correos de: \n${allowedDomains.join(', ')}`);
                
                // Efecto visual de error (borde rojo temporal)
                emailInput.classList.add('border-red-500', 'text-red-500');
                setTimeout(() => {
                    emailInput.classList.remove('border-red-500', 'text-red-500');
                }, 3000);
                
                return; // DETENEMOS LA EJECUCIÓN AQUÍ. No se envía nada a Supabase.
            }

            // Si pasa el guardia, continuamos con el login normal
            const originalText = btn.textContent;
            
            try {
                btn.textContent = 'Autenticando...';
                btn.disabled = true;
                
                await handleLogin(email, password);
                
            } catch (error) {
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

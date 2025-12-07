import { supabase } from './supabase.js';
import { loadView } from './main.js'; // Importamos la función de navegación

// --- UTILIDADES Y CONSTANTES ---

// Lista de dominios permitidos (La Guardia Real)
const ALLOWED_DOMAINS = [
    'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 
    'icloud.com', 'proton.me', 'protonmail.com', 'naver.com', 'aol.com', 'live.com'
];

// Validador reutilizable de dominio
function validateDomain(email) {
    const parts = email.split('@');
    if (parts.length !== 2 || !parts[1]) return false;
    return ALLOWED_DOMAINS.includes(parts[1].toLowerCase());
}

// --- LOGICA SUPABASE ---

async function handleLogin(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
}

async function handleRegister(email, password) {
    const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            // Importante para la confirmación de correo
            emailRedirectTo: window.location.href 
        }
    });
    if (error) throw error;
    alert('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta antes de entrar.');
    loadView('login'); // Volver al login
}

async function handleResetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Necesario para que el link de Supabase redirija correctamente a tu app
        redirectTo: window.location.href, 
    });
    if (error) throw error;
    alert('Revisa tu correo. Te hemos enviado un enlace de recuperación.');
    loadView('login');
}

async function handleNewPasswordSet(newPassword) {
    // Funciona porque el usuario está temporalmente autenticado por el token de URL
    const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
    });
    
    if (error) throw error;
    
    alert('✅ Contraseña actualizada con éxito. Ahora estás en el Dashboard.');
    // La app ya está logueada, main.js se encargará de renderizar el dashboard
}

export async function handleLogout() {
    await supabase.auth.signOut();
}

// --- LISTENERS (Controladores de Eventos) ---

// 1. VISTA LOGIN
export function initLoginListeners() {
    document.getElementById('link-register')?.addEventListener('click', () => loadView('register'));
    document.getElementById('link-forgot')?.addEventListener('click', () => loadView('forgot'));

    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const btn = document.getElementById('btn-submit');

            if (!validateDomain(email)) {
                alert(`🚫 Dominio no permitido. Solo: ${ALLOWED_DOMAINS.join(', ')}`);
                return;
            }

            const originalText = btn.textContent;
            try {
                btn.textContent = 'Autenticando...';
                btn.disabled = true;
                await handleLogin(email, password);
            } catch (error) {
                alert(error.message);
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
}

// 2. VISTA REGISTRO
export function initRegisterListeners() {
    document.getElementById('link-to-login')?.addEventListener('click', () => loadView('login'));

    const form = document.getElementById('register-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const btn = document.getElementById('btn-register');

            if (!validateDomain(email)) {
                alert(`🚫 Dominio no permitido. Solo: ${ALLOWED_DOMAINS.join(', ')}`);
                return;
            }

            if (password.length < 6) {
                alert("La contraseña debe tener al menos 6 caracteres.");
                return;
            }

            const originalText = btn.textContent;
            try {
                btn.textContent = 'Registrando...';
                btn.disabled = true;
                await handleRegister(email, password);
            } catch (error) {
                alert(error.message);
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
}

// 3. VISTA OLVIDÉ CONTRASEÑA
export function initForgotListeners() {
    document.getElementById('link-to-login-2')?.addEventListener('click', () => loadView('login'));

    const form = document.getElementById('forgot-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value.trim();
            const btn = document.getElementById('btn-forgot');

            if (!validateDomain(email)) {
                alert("Correo inválido o dominio no permitido.");
                return;
            }

            const originalText = btn.textContent;
            try {
                btn.textContent = 'Enviando...';
                btn.disabled = true;
                await handleResetPassword(email);
            } catch (error) {
                alert(error.message);
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
}

// 4. VISTA CAMBIAR CONTRASEÑA (INTERCEPCCIÓN DE URL)
export function initResetPasswordListeners() {
    const form = document.getElementById('reset-password-form');
    const msgElement = document.getElementById('reset-message');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const btn = document.getElementById('btn-reset');

            msgElement.textContent = '';
            msgElement.classList.add('hidden');

            if (newPassword !== confirmPassword) {
                msgElement.textContent = 'Las contraseñas no coinciden.';
                msgElement.classList.remove('hidden');
                return;
            }
            if (newPassword.length < 6) {
                msgElement.textContent = 'La contraseña debe tener al menos 6 caracteres.';
                msgElement.classList.remove('hidden');
                return;
            }

            const originalText = btn.textContent;
            try {
                btn.textContent = 'Cambiando...';
                btn.disabled = true;
                await handleNewPasswordSet(newPassword);
            } catch (error) {
                msgElement.textContent = `Error: ${error.message}`;
                msgElement.classList.remove('hidden');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
}


// 5. VISTA DASHBOARD
export function initDashboardListeners() {
    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);
}

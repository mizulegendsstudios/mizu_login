import { supabase } from './supabase.js';
import { loadView } from './main.js'; // Importamos la función de navegación

// --- UTILIDADES ---

// Lista de dominios permitidos (La Guardia Real)
const ALLOWED_DOMAINS = [
    'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 
    'icloud.com', 'proton.me', 'protonmail.com', 'naver.com', 'aol.com', 'live.com'
];

// Validador reutilizable
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
            emailRedirectTo: window.location.href // Importante para confirmar correo
        }
    });
    if (error) throw error;
    alert('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta antes de entrar.');
    loadView('login'); // Volver al login
}

async function handleResetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.href,
    });
    if (error) throw error;
    alert('Revisa tu correo. Te hemos enviado un enlace de recuperación.');
    loadView('login');
}

export async function handleLogout() {
    await supabase.auth.signOut();
}

// --- LISTENERS (Controladores de Eventos) ---

// 1. VISTA LOGIN
export function initLoginListeners() {
    // Botón de navegación a Registro
    document.getElementById('link-register')?.addEventListener('click', () => loadView('register'));
    // Botón de navegación a Olvidé Contraseña
    document.getElementById('link-forgot')?.addEventListener('click', () => loadView('forgot'));

    // Formulario Login
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
    // Botón volver
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
    // Botón volver
    document.getElementById('link-to-login-2')?.addEventListener('click', () => loadView('login'));

    const form = document.getElementById('forgot-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value.trim();
            const btn = document.getElementById('btn-forgot');

            // También validamos dominio aquí por seguridad
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

// 4. VISTA DASHBOARD
export function initDashboardListeners() {
    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);
}

import { supabase } from './supabase.js';
import { loadView } from './main.js';

// --- CONFIGURACIÓN ---
const ALLOWED_DOMAINS = [
    'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 
    'icloud.com', 'proton.me', 'protonmail.com', 'naver.com', 'aol.com', 'live.com'
];

function validateDomain(email) {
    const parts = email.split('@');
    if (parts.length !== 2 || !parts[1]) return false;
    return ALLOWED_DOMAINS.includes(parts[1].toLowerCase());
}

// --- ACCIONES SUPABASE ---

async function handleLogin(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
}

async function handleRegister(email, password) {
    const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { emailRedirectTo: window.location.href }
    });
    if (error) throw error;
    alert('¡Registro exitoso! Revisa tu correo.');
    loadView('login');
}

async function handleResetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.href, // Redirige a la raíz
    });
    if (error) throw error;
    alert('Enlace enviado. Revisa tu correo.');
    loadView('login');
}

async function handleNewPasswordSet(newPassword) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    
    alert('✅ Contraseña actualizada. Bienvenido de nuevo.');
    
    // 💥 CRÍTICO UX: BORRAR EL TOKEN DE LA URL 
    // Esto rompe el bucle y elimina la evidencia que mantiene a la pestaña en modo "reset".
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Forzamos la obtención de la sesión/usuario actualizada para sincronizar el email
    await supabase.auth.getUser(); 
    
    loadView('dashboard');
}

export async function handleLogout() {
    await supabase.auth.signOut();
}

// --- LISTENERS (sin cambios) ---

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
                alert(`Dominio no permitido.`);
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

export function initRegisterListeners() {
    document.getElementById('link-to-login')?.addEventListener('click', () => loadView('login'));
    const form = document.getElementById('register-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const btn = document.getElementById('btn-register');

            if (!validateDomain(email)) return alert("Dominio no permitido");
            if (password.length < 6) return alert("Mínimo 6 caracteres");

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

export function initForgotListeners() {
    document.getElementById('link-to-login-2')?.addEventListener('click', () => loadView('login'));
    const form = document.getElementById('forgot-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value.trim();
            const btn = document.getElementById('btn-forgot');
            
            if (!validateDomain(email)) return alert("Correo inválido");

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
                msgElement.textContent = 'Mínimo 6 caracteres.';
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

export function initDashboardListeners() {
    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);
}

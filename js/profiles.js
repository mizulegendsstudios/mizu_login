import { supabase } from './supabase.js';
import { loadView } from './main.js';
import { handleLogout } from './auth.js';

// Variable para guardar el perfil seleccionado actualmente en memoria
export let activeProfile = null;

// --- FUNCIONES DB Y LÓGICA ---

async function fetchProfiles() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error cargando perfiles:', error);
        return [];
    }
    return data;
}

async function createProfile(nickname, role) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
        .from('profiles')
        .insert([{ user_id: user.id, nickname: nickname, role: role }]);

    if (error) throw error;
}

function selectProfile(profile) {
    console.log("Perfil seleccionado:", profile.nickname);
    activeProfile = profile; 
    loadView('dashboard');   
}

// --- RENDERIZADO ---

function renderProfileCard(profile) {
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.nickname}`;

    const card = document.createElement('div');
    card.className = "group cursor-pointer flex flex-col items-center gap-3 hover:scale-105 transition duration-300";
    card.innerHTML = `
        <div class="w-32 h-32 rounded bg-gray-700 border-2 border-transparent group-hover:border-white overflow-hidden shadow-lg relative">
            <img src="${avatarUrl}" alt="${profile.nickname}" class="w-full h-full object-cover">
            <div class="absolute bottom-0 w-full bg-black bg-opacity-60 text-xs text-center text-gray-300 py-1">
                ${profile.role}
            </div>
        </div>
        <span class="text-gray-400 group-hover:text-white text-lg font-medium">${profile.nickname}</span>
    `;

    card.addEventListener('click', () => selectProfile(profile));
    return card;
}

/**
 * Función que SOLO carga y dibuja los perfiles.
 * No adjunta listeners, por lo que es segura de llamar repetidamente.
 */
async function renderProfilesList() {
    const grid = document.getElementById('profiles-grid');
    grid.innerHTML = '<p class="text-gray-500 animate-pulse col-span-full text-center">Invocando perfiles...</p>';

    const profiles = await fetchProfiles();
    grid.innerHTML = ''; 

    if (profiles.length === 0) {
        grid.innerHTML = '<p class="text-gray-500 col-span-full text-center">No tienes perfiles. Crea el primero abajo.</p>';
    } else {
        profiles.forEach(profile => {
            grid.appendChild(renderProfileCard(profile));
        });
    }
}

// --- LISTENER EXPORTADO (Adjunta eventos solo una vez) ---

export async function initProfilesListeners() {
    // 1. Configurar botón de logout global
    document.getElementById('btn-logout-profiles')?.addEventListener('click', handleLogout);

    // 2. Cargar y Pintar perfiles (Llamada inicial)
    await renderProfilesList();

    // 3. Configurar formulario de creación (ESTO SOLO SE ADJUNTA UNA VEZ)
    const form = document.getElementById('create-profile-form');
    if (form && !form.dataset.listenerAttached) { // <--- Doble chequeo para seguridad
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nickname = document.getElementById('new-nickname').value.trim();
            const role = document.getElementById('new-role').value;
            const btn = form.querySelector('button');

            if (!nickname) return;

            const originalText = btn.textContent;
            try {
                btn.textContent = 'Creando...';
                btn.disabled = true;
                await createProfile(nickname, role);
                
                // ¡CORRECCIÓN CLAVE! SOLO RENDERIZAR LA LISTA, NO REINICIAR LOS LISTENERS
                form.reset();
                await renderProfilesList(); 
                
            } catch (error) {
                alert('Error al crear perfil: Asegúrate que el nickname sea único (si aplicas reglas DB) o ' + error.message);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
        
        form.dataset.listenerAttached = 'true';
    }
}

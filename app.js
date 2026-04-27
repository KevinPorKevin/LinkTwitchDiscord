// --- CONFIGURACIÓN ---
const TWITCH_CLIENT_ID = 'etegextzabxktszzfsxxfxob6kmqv4';
const DISCORD_CLIENT_ID = '1030917054150213755';
const URL_DE_TU_RENDER = 'https://backend-vinculacion-8twr.onrender.com';

// Genera la URL de redirección automáticamente según la ubicación de la web
const REDIRECT_URI = encodeURIComponent(window.location.origin + window.location.pathname); 

const btnTwitch = document.getElementById('btn-twitch');
const btnDiscord = document.getElementById('btn-discord');
const statusDiv = document.getElementById('status-message');

// --- EVENTOS DE BOTONES ---
btnTwitch.addEventListener('click', () => {
    window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=user:read:email&state=twitch`;
});

btnDiscord.addEventListener('click', () => {
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=identify&state=discord`;
});

// --- LÓGICA AL CARGAR LA PÁGINA ---
window.addEventListener('DOMContentLoaded', async () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const state = params.get('state');

    // 1. Detectar si volvemos de una redirección con token
    if (accessToken && state) {
        // Guardamos el token en el almacenamiento local
        localStorage.setItem(`${state}_token`, accessToken);
        
        // "Salto limpio" con un pequeño retardo:
        // Esto ayuda al navegador móvil a asentar el diseño antes de limpiar la URL,
        // corrigiendo el problema del zoom out automático.
        setTimeout(() => {
            window.location.href = window.location.origin + window.location.pathname;
        }, 100); 
        return;
    }

    // 2. Comprobar tokens guardados
    const twitchToken = localStorage.getItem('twitch_token');
    const discordToken = localStorage.getItem('discord_token');

    // Actualizar botones visualmente si ya están conectados
    if (twitchToken) { 
        btnTwitch.innerHTML = 'Twitch Conectado ✓'; 
        btnTwitch.disabled = true; 
        btnTwitch.style.opacity = '0.6';
    }
    if (discordToken) { 
        btnDiscord.innerHTML = 'Discord Conectado ✓'; 
        btnDiscord.disabled = true; 
        btnDiscord.style.opacity = '0.6';
    }

    // 3. Si ambas cuentas están listas, procesar en el servidor
    if (twitchToken && discordToken) {
        if (localStorage.getItem('webhook_enviado') === 'true') {
            statusDiv.style.display = 'block';
            statusDiv.innerHTML = "¡Tus cuentas ya han sido vinculadas con éxito!";
            statusDiv.className = 'success';
            return;
        }

        statusDiv.style.display = 'block';
        statusDiv.innerHTML = 'Sincronizando perfiles...';

        try {
            const response = await fetch(`${URL_DE_TU_RENDER}/api/vincular`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ twitchToken, discordToken })
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('webhook_enviado', 'true');
                // Recarga final para mostrar el estado de éxito limpio
                window.location.reload(); 
            } else {
                statusDiv.innerHTML = "Hubo un problema en la vinculación. Inténtalo de nuevo.";
                localStorage.clear();
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            statusDiv.innerHTML = "Error de conexión con el servidor de Render.";
        }
    }
});

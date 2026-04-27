// --- CONFIGURACIÓN ---
const TWITCH_CLIENT_ID = 'etegextzabxktszzfsxxfxob6kmqv4';
const DISCORD_CLIENT_ID = '1030917054150213755';
const URL_DE_TU_RENDER = 'https://backend-vinculacion-8twr.onrender.com';

const REDIRECT_URI = encodeURIComponent(window.location.origin + window.location.pathname); 

const btnTwitch = document.getElementById('btn-twitch');
const btnDiscord = document.getElementById('btn-discord');
const statusDiv = document.getElementById('status-message');

// --- EVENTOS ---
btnTwitch.addEventListener('click', () => {
    window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=user:read:email&state=twitch`;
});

btnDiscord.addEventListener('click', () => {
    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=identify&state=discord`;
});

// --- FUNCIÓN PARA MOSTRAR MENSAJES Y EL BOTÓN ROJO ---
function mostrarEstado(mensaje, tipo = 'info') {
    statusDiv.style.display = 'block';
    statusDiv.className = tipo === 'exito' ? 'success' : '';
    
    // Aquí definimos el HTML del mensaje y el botón de reiniciar
    statusDiv.innerHTML = `
        <div style="margin-bottom: 15px; font-weight: 500;">${mensaje}</div>
        <button id="btn-reiniciar" style="background-color: #e74c3c; color: white; border: none; padding: 10px; border-radius: 6px; width: 100%; cursor: pointer; font-weight: bold; font-size: 14px;">
            Reiniciar proceso
        </button>
    `;

    document.getElementById('btn-reiniciar').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = window.location.origin + window.location.pathname;
    });
}

// --- LÓGICA PRINCIPAL ---
window.addEventListener('DOMContentLoaded', async () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const state = params.get('state');

    if (accessToken && state) {
        localStorage.setItem(`${state}_token`, accessToken);
        // El "salto limpio" para el zoom
        setTimeout(() => {
            window.location.href = window.location.origin + window.location.pathname;
        }, 100); 
        return;
    }

    const twitchToken = localStorage.getItem('twitch_token');
    const discordToken = localStorage.getItem('discord_token');

    // Actualizar botones
    if (twitchToken) { btnTwitch.innerHTML = 'Twitch Conectado ✓'; btnTwitch.disabled = true; btnTwitch.style.opacity = '0.6'; }
    if (discordToken) { btnDiscord.innerHTML = 'Discord Conectado ✓'; btnDiscord.disabled = true; btnDiscord.style.opacity = '0.6'; }

    // CASO A: Ambas cuentas conectadas
    if (twitchToken && discordToken) {
        if (localStorage.getItem('webhook_enviado') === 'true') {
            mostrarEstado("¡Tus cuentas ya están vinculadas con éxito!", "exito");
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
                window.location.reload(); 
            } else {
                mostrarEstado("Hubo un error en el servidor. Prueba a reiniciar.");
            }
        } catch (error) {
            mostrarEstado("Error de conexión con el servidor.");
        }
    } 
    // CASO B: Solo una cuenta conectada (Aquí es donde recuperamos el botón)
    else if (twitchToken || discordToken) {
        const conectada = twitchToken ? "Twitch" : "Discord";
        const falta = twitchToken ? "Discord" : "Twitch";
        mostrarEstado(`Has conectado ${conectada}. Ahora falta conectar ${falta}.`);
    }
});

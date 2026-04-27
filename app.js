const TWITCH_CLIENT_ID = 'etegextzabxktszzfsxxfxob6kmqv4';
const DISCORD_CLIENT_ID = '1030917054150213755';
const URL_DE_TU_RENDER = 'https://backend-vinculacion-8twr.onrender.com';

const REDIRECT_URI = encodeURIComponent(window.location.origin + window.location.pathname); 

const btnTwitch = document.getElementById('btn-twitch');
const btnDiscord = document.getElementById('btn-discord');
const statusDiv = document.getElementById('status-message');

// --- BOTONES ---
btnTwitch.onclick = () => window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=user:read:email&state=twitch`;
btnDiscord.onclick = () => window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=identify&state=discord`;

// --- FUNCIÓN ÚNICA PARA MENSAJES ---
function mostrarEstado(mensaje, tipo = '') {
    statusDiv.style.display = 'block';
    statusDiv.className = tipo; // 'success' o vacío
    
    statusDiv.innerHTML = `
        <div class="msg-text">${mensaje}</div>
        <button class="btn-reset" onclick="resetearTodo()">Reiniciar proceso</button>
    `;
}

function resetearTodo() {
    localStorage.clear();
    window.location.href = window.location.origin + window.location.pathname;
}

// --- LÓGICA PRINCIPAL ---
window.addEventListener('DOMContentLoaded', async () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const state = params.get('state');

    if (accessToken && state) {
        localStorage.setItem(`${state}_token`, accessToken);
        setTimeout(() => {
            window.location.href = window.location.origin + window.location.pathname;
        }, 100); 
        return;
    }

    const twitchToken = localStorage.getItem('twitch_token');
    const discordToken = localStorage.getItem('discord_token');

    if (twitchToken) { btnTwitch.innerHTML = 'Twitch Conectado ✓'; btnTwitch.disabled = true; }
    if (discordToken) { btnDiscord.innerHTML = 'Discord Conectado ✓'; btnDiscord.disabled = true; }

    if (twitchToken && discordToken) {
        if (localStorage.getItem('webhook_enviado') === 'true') {
            mostrarEstado("¡Tus cuentas ya están vinculadas con éxito!", "success");
            return;
        }

        // Mientras se hace el fetch, mostramos el mensaje con el botón de reiniciar disponible
        mostrarEstado("Sincronizando perfiles en el servidor...");

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
                mostrarEstado("Error en el servidor. Inténtalo de nuevo.");
            }
        } catch (e) {
            mostrarEstado("Error de conexión. Pulsa reiniciar.");
        }
    } 
    else if (twitchToken || discordToken) {
        const falta = twitchToken ? "Discord" : "Twitch";
        mostrarEstado(`Has conectado una cuenta. Ahora falta conectar ${falta}.`);
    }
});

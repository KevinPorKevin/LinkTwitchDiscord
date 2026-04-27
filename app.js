// --- CONFIGURACIÓN ---
const TWITCH_CLIENT_ID = 'etegextzabxktszzfsxxfxob6kmqv4';
const DISCORD_CLIENT_ID = '1030917054150213755';
const URL_DE_TU_RENDER = 'https://backend-vinculacion-8twr.onrender.com';

const REDIRECT_URI = encodeURIComponent(window.location.origin + window.location.pathname); 

const btnTwitch = document.getElementById('btn-twitch');
const btnDiscord = document.getElementById('btn-discord');
const statusDiv = document.getElementById('status-message');

btnTwitch.onclick = () => window.location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=user:read:email&state=twitch`;
btnDiscord.onclick = () => window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=identify&state=discord`;

function mostrarEstado(mensaje, tipo = '') {
    statusDiv.style.display = 'block';
    statusDiv.className = tipo; 
    statusDiv.innerHTML = `
        <div class="msg-text">${mensaje}</div>
        <button class="btn-reset" onclick="resetearTodo()">Reiniciar proceso</button>
    `;
}

function resetearTodo() {
    localStorage.clear();
    window.location.href = window.location.origin + window.location.pathname;
}

window.addEventListener('DOMContentLoaded', async () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const state = params.get('state');

    // 1. Si volvemos de una redirección con token, obtenemos el nombre antes de limpiar la URL
    if (accessToken && state) {
        localStorage.setItem(`${state}_token`, accessToken);
        
        try {
            // Consultamos el nombre a la API correspondiente
            if (state === 'twitch') {
                const res = await fetch('https://api.twitch.tv/helix/users', {
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Client-Id': TWITCH_CLIENT_ID }
                });
                const data = await res.json();
                if (data.data && data.data[0]) {
                    localStorage.setItem('twitch_user', data.data[0].display_name);
                }
            } else {
                const res = await fetch('https://discord.com/api/users/@me', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                const data = await res.json();
                if (data.username) {
                    localStorage.setItem('discord_user', data.username);
                }
            }
        } catch (e) {
            console.error("Error al obtener el nombre de usuario", e);
        }

        // Salto limpio para el zoom y limpiar la barra de direcciones
        setTimeout(() => {
            window.location.href = window.location.origin + window.location.pathname;
        }, 150); 
        return;
    }

    // 2. Recuperamos tokens y nombres guardados
    const twitchToken = localStorage.getItem('twitch_token');
    const discordToken = localStorage.getItem('discord_token');
    const twitchName = localStorage.getItem('twitch_user');
    const discordName = localStorage.getItem('discord_user');

    // 3. Actualizamos los botones con el nombre de usuario
    if (twitchToken) { 
        btnTwitch.innerHTML = `Twitch ${twitchName || ''} conectado ✓`.replace(/\s+/g, ' '); 
        btnTwitch.disabled = true; 
        btnTwitch.style.opacity = '0.6'; 
    }
    if (discordToken) { 
        btnDiscord.innerHTML = `Discord ${discordName || ''} conectado ✓`.replace(/\s+/g, ' '); 
        btnDiscord.disabled = true; 
        btnDiscord.style.opacity = '0.6'; 
    }

    // 4. Lógica de envío al servidor
    if (twitchToken && discordToken) {
        if (localStorage.getItem('webhook_enviado') === 'true') {
            mostrarEstado("Sincronización finalizada correctamente.", "success");
            return;
        }

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
        const conectado = twitchToken ? `Twitch (${twitchName})` : `Discord (${discordName})`;
        const falta = twitchToken ? "Discord" : "Twitch";
        mostrarEstado(`Has conectado correctamente <b>${conectado}</b>.<br>Ahora falta conectar tu cuenta de <b>${falta}</b>.`);
    }
});

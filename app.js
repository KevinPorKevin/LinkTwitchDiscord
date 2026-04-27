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

    if (accessToken && state) {
        localStorage.setItem(`${state}_token`, accessToken);
        setTimeout(() => {
            window.location.href = window.location.origin + window.location.pathname;
        }, 150); 
        return;
    }

    const twitchToken = localStorage.getItem('twitch_token');
    const discordToken = localStorage.getItem('discord_token');

    if (twitchToken) { btnTwitch.innerHTML = 'Twitch Conectado ✓'; btnTwitch.disabled = true; }
    if (discordToken) { btnDiscord.innerHTML = 'Discord Conectado ✓'; btnDiscord.disabled = true; }

    if (twitchToken && discordToken) {
        if (localStorage.getItem('webhook_enviado') === 'true') {
            mostrarEstado("Sincronización finalizada correctamente.", "success");
            return;
        }

        mostrarEstado("Conectando con el servidor para asignar el rol...");

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
                mostrarEstado("Error al otorgar el rol. Por favor, pulsa reiniciar e inténtalo de nuevo.");
            }
        } catch (e) {
            mostrarEstado("Error de conexión con el servidor. Pulsa reiniciar.");
        }
    } 
    // --- ESTA ES LA PARTE QUE HEMOS MEJORADO ---
    else if (twitchToken || discordToken) {
        // Determinamos qué hay conectado y qué falta de forma explícita
        const conectado = twitchToken ? "Twitch" : "Discord";
        const falta = twitchToken ? "Discord" : "Twitch";
        
        mostrarEstado(`Has conectado correctamente <b>${conectado}</b>.<br>Ahora falta conectar tu cuenta de <b>${falta}</b>.`);
    }
});

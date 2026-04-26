// --- CONFIGURACIÓN ---
const TWITCH_CLIENT_ID = 'etegextzabxktszzfsxxfxob6kmqv4';
const DISCORD_CLIENT_ID = '1030917054150213755';

// La URL a la que vuelven tras iniciar sesión (Tu GitHub Pages)
const REDIRECT_URI = encodeURIComponent(window.location.origin + window.location.pathname); 

// --- LÓGICA DE INTERFAZ ---
const btnTwitch = document.getElementById('btn-twitch');
const btnDiscord = document.getElementById('btn-discord');
const statusDiv = document.getElementById('status-message');

btnTwitch.addEventListener('click', () => {
    const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=user:read:email&state=twitch`;
    window.location.href = twitchAuthUrl;
});

btnDiscord.addEventListener('click', () => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=identify&state=discord`;
    window.location.href = discordAuthUrl;
});

// Función para mostrar mensajes de estado (Éxito o Info)
function mostrarEstado(mensaje, tipo = 'info') {
    statusDiv.style.display = 'block';
    
    if (tipo === 'exito') {
        statusDiv.classList.add('success');
        statusDiv.style.border = ''; 
        statusDiv.style.backgroundColor = '';
        statusDiv.style.color = '';
    } else {
        statusDiv.classList.remove('success');
        statusDiv.style.border = '1px solid #444';
        statusDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        statusDiv.style.color = '#fff';
    }

    statusDiv.innerHTML = `
        <div style="margin-bottom: 15px;"><strong>${mensaje}</strong></div>
        <button id="btn-relink" style="padding: 10px 15px; border: none; border-radius: 6px; background-color: #e74c3c; color: white; cursor: pointer; font-weight: bold; width: 100%; transition: 0.2s;">
            Reiniciar proceso
        </button>
    `;

    document.getElementById('btn-relink').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = window.location.pathname; 
    });
}

// --- LÓGICA AL CARGAR LA PÁGINA ---
window.addEventListener('DOMContentLoaded', async () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const state = params.get('state');

    if (accessToken && state) {
        localStorage.setItem(`${state}_token`, accessToken);
        window.history.replaceState(null, '', window.location.pathname);
    }

    const twitchToken = localStorage.getItem('twitch_token');
    const discordToken = localStorage.getItem('discord_token');

    if (twitchToken) { btnTwitch.innerHTML = 'Twitch Conectado ✓'; btnTwitch.disabled = true; }
    if (discordToken) { btnDiscord.innerHTML = 'Discord Conectado ✓'; btnDiscord.disabled = true; }

    // CASO 1: Ambas cuentas conectadas
    if (twitchToken && discordToken) {
        if (localStorage.getItem('webhook_enviado') === 'true') {
            mostrarEstado("¡Tus cuentas ya están vinculadas correctamente!", "exito");
            return; 
        }

        statusDiv.style.display = 'block';
        statusDiv.classList.remove('success');
        statusDiv.innerHTML = 'Sincronizando información y verificando acceso...';
        
        try {
            // SUSTITUYE esto por tu enlace real de Render (sin barra al final)
            const URL_DE_TU_RENDER = 'https://backend-vinculacion-8twr.onrender.com';
            
            const response = await fetch(`${URL_DE_TU_RENDER}/api/vincular`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ twitchToken, discordToken })
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('webhook_enviado', 'true');
                mostrarEstado("¡Vinculación completada con éxito!", "exito");
            } 
            // Manejo del error cuando el usuario no pertenece al servidor
            else if (result.error === 'not_in_server') {
                statusDiv.style.display = 'block';
                statusDiv.classList.remove('success');
                statusDiv.style.border = '1px solid #e74c3c';
                statusDiv.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
                statusDiv.style.color = '#fff';

                statusDiv.innerHTML = `
                    <div style="margin-bottom: 15px;"><strong>¡No es posible vincular la cuenta!</strong><br><br>Se ha denegado la vinculación porque no te encuentras en el servidor de Discord correspondiente.</div>
                    <button id="btn-relink" style="padding: 10px 15px; border: none; border-radius: 6px; background-color: #555; color: white; cursor: pointer; font-weight: bold; width: 100%; transition: 0.2s;">Finalizar</button>
                `;

                document.getElementById('btn-relink').addEventListener('click', () => {
                    localStorage.clear();
                    window.location.href = window.location.pathname; 
                });
            }
            else {
                throw new Error('Error general en el servidor.');
            }

        } catch (error) {
            console.error("Error en la petición:", error);
            localStorage.clear();
            statusDiv.innerHTML = 'Hubo un problema al procesar la vinculación. Reintentando...';
            setTimeout(() => window.location.reload(), 3000);
        }
    } 
    // CASO 2: Falta una de las dos cuentas por conectar
    else if (twitchToken || discordToken) {
        const plataformaFaltante = !twitchToken ? "Twitch" : "Discord";
        mostrarEstado(`Por favor, conecta también tu cuenta de ${plataformaFaltante}.`, "info");
    }
});
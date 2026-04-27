// --- CONFIGURACIÓN ---
const TWITCH_CLIENT_ID = 'etegextzabxktszzfsxxfxob6kmqv4';
const DISCORD_CLIENT_ID = '1030917054150213755';

// ⚠️ SUSTITUYE esto por tu enlace real de Render (sin barra al final)
const URL_DE_TU_RENDER = 'https://backend-vinculacion-8twr.onrender.com';

// Genera la URL de redirección automáticamente según dónde esté alojada la web
const REDIRECT_URI = encodeURIComponent(window.location.origin + window.location.pathname); 

// --- ELEMENTOS DE LA INTERFAZ ---
const btnTwitch = document.getElementById('btn-twitch');
const btnDiscord = document.getElementById('btn-discord');
const statusDiv = document.getElementById('status-message');

// --- BOTONES DE LOGIN ---
btnTwitch.addEventListener('click', () => {
    const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=user:read:email&state=twitch`;
    window.location.href = twitchAuthUrl;
});

btnDiscord.addEventListener('click', () => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=identify&state=discord`;
    window.location.href = discordAuthUrl;
});

// --- FUNCIÓN PARA MOSTRAR MENSAJES ---
function mostrarEstado(mensaje, tipo = 'info') {
    statusDiv.style.display = 'block';
    
    if (tipo === 'exito') {
        statusDiv.classList.add('success');
        statusDiv.style.border = '1px solid #2ecc71';
        statusDiv.style.backgroundColor = 'rgba(46, 204, 113, 0.1)';
    } else {
        statusDiv.classList.remove('success');
        statusDiv.style.border = '1px solid #e74c3c';
        statusDiv.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
    }

    statusDiv.innerHTML = `
        <div style="margin-bottom: 15px;"><strong>${mensaje}</strong></div>
        <button id="btn-relink" style="padding: 10px 15px; border: none; border-radius: 6px; background-color: #555; color: white; cursor: pointer; font-weight: bold; width: 100%;">
            Reiniciar proceso
        </button>
    `;

    document.getElementById('btn-relink').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = window.location.pathname; 
    });
}

// --- LÓGICA PRINCIPAL (CARGA DE PÁGINA) ---
window.addEventListener('DOMContentLoaded', async () => {
    // 1. Extraer tokens de la URL (si vienen de una redirección)
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const state = params.get('state');

    // 2. Si hay token en la URL, guardarlo y LIMPIAR LA URL (Corrige el zoom en móviles)
    if (accessToken && state) {
        localStorage.setItem(`${state}_token`, accessToken);
        
        // Esta línea borra el hash de la URL sin recargar la página
        window.history.replaceState(null, '', window.location.pathname);
    }

    // 3. Comprobar qué tokens tenemos guardados
    const twitchToken = localStorage.getItem('twitch_token');
    const discordToken = localStorage.getItem('discord_token');

    // Actualizar visualmente los botones
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

    // 4. Si ambos están presentes, enviamos la información al servidor de Render
    if (twitchToken && discordToken) {
        // Evitar envíos duplicados si ya se hizo con éxito
        if (localStorage.getItem('webhook_enviado') === 'true') {
            mostrarEstado("¡Tus cuentas ya están vinculadas correctamente!", "exito");
            return; 
        }

        statusDiv.style.display = 'block';
        statusDiv.innerHTML = 'Sincronizando cuentas y asignando rol...';
        
        try {
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
            else if (result.error === 'not_in_server') {
                mostrarEstado("No es posible vincular: No te encuentras en el servidor de Discord.");
            } else {
                throw new Error('Fallo en el servidor');
            }

        } catch (error) {
            console.error("Error en la vinculación:", error);
            // Si hay un error, limpiamos para que el usuario pueda reintentar
            localStorage.clear();
            mostrarEstado("Hubo un problema al procesar los datos. Por favor, reintenta.");
        }
    } 
    // Si solo falta una cuenta
    else if (twitchToken || discordToken) {
        const falta = !twitchToken ? "Twitch" : "Discord";
        mostrarEstado(`Casi listo. Ahora conecta tu cuenta de ${falta}.`, "info");
    }
});

const SUPABASE_URL = 'https://udzvhvxleujmyyzwfvjc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TehtfAvBQg05hNcaSVdg1Q_E7Nc7ltt';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_USER = 'capiluisxavi';

let currentUser = null;
let playersData = [];

document.getElementById('twitchLoginBtn').addEventListener('click', async () => {
  await sb.auth.signInWithOAuth({ provider: 'twitch', options: { redirectTo: window.location.href } });
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await sb.auth.signOut();
  window.location.reload();
});

document.getElementById('refreshBtn').addEventListener('click', loadPlayers);

document.getElementById('searchBox').addEventListener('input', (e) => {
  renderTable(e.target.value);
});

sb.auth.onAuthStateChange(async (_event, session) => {
  currentUser = session?.user || null;
  if (currentUser) {
    const username = currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || currentUser.email;
    if (username.toLowerCase() === ADMIN_USER.toLowerCase()) {
      // Es Admin
      document.getElementById('loginArea').style.display = 'none';
      document.getElementById('adminArea').style.display = 'block';
      document.getElementById('adminName').textContent = `Admin: ${username}`;
      loadPlayers();
    } else {
      // No es Admin
      document.getElementById('loginArea').innerHTML = `
        <h2 style="color: red;">ACCESO DENEGADO</h2>
        <p>El usuario ${username} no es administrador.</p>
        <button onclick="sb.auth.signOut().then(() => window.location.reload())" class="menu-btn" style="width:auto;">CERRAR SESIÓN</button>
        <br><a href="index.html" class="back-btn">VOLVER AL JUEGO</a>
      `;
    }
  } else {
    document.getElementById('loginArea').style.display = 'flex';
    document.getElementById('adminArea').style.display = 'none';
  }
});

async function loadPlayers() {
  const { data, error } = await sb.from('player_wallets').select('*').order('balance', { ascending: false });
  if (error) {
    console.error('Error loading players:', error);
    alert('Error cargando datos. Asegúrate de que las políticas RLS en Supabase te permitan hacer SELECT.');
    return;
  }
  playersData = data || [];
  renderTable();
}

function renderTable(filter = '') {
  const tbody = document.getElementById('playersList');
  tbody.innerHTML = '';

  const filtered = playersData.filter(p => 
    p.twitch_username.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No se encontraron jugadores.</td></tr>`;
    return;
  }

  filtered.forEach(p => {
    const inv = p.inventory || {};
    const invHTML = Object.keys(inv).map(key => {
      if (inv[key] > 0) {
        return `<div class="inv-badge">${key}: ${inv[key]}</div>`;
      }
      return '';
    }).join('');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:bold; color:var(--gold);">${p.twitch_username}</td>
      <td>
        <input type="number" id="bal-${p.twitch_user_id}" class="input-coin" value="${p.balance}">
        <button onclick="updateBalance('${p.twitch_user_id}')" class="btn-action">Guardar</button>
      </td>
      <td>
        <div class="inventory-badges">${invHTML || '<span style="color:#888;">Vacío</span>'}</div>
      </td>
      <td>
        <button onclick="addCoins('${p.twitch_user_id}', 100)" class="btn-action" style="background:#00c896;">+100 🟡</button>
        <button onclick="giveItem('${p.twitch_user_id}', 'shield')" class="btn-action" style="background:#1565C0;">+🛡</button>
        <button onclick="giveItem('${p.twitch_user_id}', 'magnet')" class="btn-action" style="background:#6A1B9A;">+🧲</button>
        <button onclick="giveItem('${p.twitch_user_id}', 'multi')" class="btn-action" style="background:#E65100;">+x2</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function updateBalance(uid) {
  const input = document.getElementById(`bal-${uid}`);
  const newBal = parseInt(input.value) || 0;
  
  const { error } = await sb.from('player_wallets').update({ balance: newBal }).eq('twitch_user_id', uid);
  if (error) {
    alert('Error al actualizar. Revisa RLS en Supabase.');
    console.error(error);
  } else {
    alert('Saldo actualizado.');
    loadPlayers(); // recargar
  }
}

async function addCoins(uid, amount) {
  const player = playersData.find(p => p.twitch_user_id === uid);
  if (!player) return;
  const newBal = (player.balance || 0) + amount;
  
  const { error } = await sb.from('player_wallets').update({ balance: newBal }).eq('twitch_user_id', uid);
  if (error) {
    alert('Error al actualizar monedas.');
    console.error(error);
  } else {
    loadPlayers();
  }
}

async function giveItem(uid, item) {
  const player = playersData.find(p => p.twitch_user_id === uid);
  if (!player) return;
  
  const inv = player.inventory || {};
  inv[item] = (inv[item] || 0) + 1;

  const { error } = await sb.from('player_wallets').update({ inventory: inv }).eq('twitch_user_id', uid);
  if (error) {
    alert('Error al entregar objeto.');
    console.error(error);
  } else {
    loadPlayers();
  }
}

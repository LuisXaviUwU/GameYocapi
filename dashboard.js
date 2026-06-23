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
      loadStoreItems();
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

const ITEM_ICONS = {
  shield: 'assets/inmortal.png',
  shield30: 'assets/inmortal.png',
  shield60: 'assets/inmortal.png',
  doubleJump: 'assets/jump.png',
  magnet: 'assets/iman.png',
  multi: 'assets/x2.png',
  multi4: 'assets/x4.png',
  multi6: 'assets/x6.png'
};

function renderTable(filter = '') {
  const tbody = document.getElementById('playersList');
  tbody.innerHTML = '';

  const filtered = playersData.filter(p => 
    p.twitch_username.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px;">No se encontraron jugadores. (Si solo sales tú, desactiva el RLS en Supabase)</td></tr>`;
    return;
  }

  filtered.forEach(p => {
    const inv = p.inventory || {};
    const invHTML = Object.keys(inv).map(key => {
      if (inv[key] > 0) {
        const iconSrc = ITEM_ICONS[key] || '';
        return `<div class="inv-badge"><img src="${iconSrc}" title="${key}"> x${inv[key]}</div>`;
      }
      return '';
    }).join('');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:bold; color:var(--gold); font-size: 14px;">
         <img src="assets/logo_capi.png" style="width:24px; vertical-align:middle; margin-right:8px; border-radius:50%; background:#000;">
         ${p.twitch_username}
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="assets/coin.png" style="width:20px;">
          <input type="number" id="bal-${p.twitch_user_id}" class="input-coin" value="${p.balance}">
          <button onclick="updateBalance('${p.twitch_user_id}')" class="btn-action">💾</button>
        </div>
      </td>
      <td>
        <div class="inventory-badges">${invHTML || '<span style="color:#888;">Vacío</span>'}</div>
      </td>
      <td>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button onclick="addCoins('${p.twitch_user_id}', 100)" class="btn-action" style="background:#00c896; font-size:10px;">+100<img src="assets/coin.png" style="width:12px; vertical-align:middle;"></button>
          <button onclick="giveItem('${p.twitch_user_id}', 'shield')" class="btn-action" style="background:#1565C0;" title="Escudo 10s">+🛡10</button>
          <button onclick="giveItem('${p.twitch_user_id}', 'shield30')" class="btn-action" style="background:#1565C0;" title="Escudo 30s">+🛡30</button>
          <button onclick="giveItem('${p.twitch_user_id}', 'shield60')" class="btn-action" style="background:#1565C0;" title="Escudo 60s">+🛡60</button>
          <button onclick="giveItem('${p.twitch_user_id}', 'doubleJump')" class="btn-action" style="background:#2E7D32;" title="Dar Doble Salto">+<img src="assets/jump.png" style="width:14px; vertical-align:middle;"></button>
          <button onclick="giveItem('${p.twitch_user_id}', 'magnet')" class="btn-action" style="background:#6A1B9A;" title="Dar Imán">+<img src="assets/iman.png" style="width:14px; vertical-align:middle;"></button>
          <button onclick="giveItem('${p.twitch_user_id}', 'multi')" class="btn-action" style="background:#E65100;" title="Dar x2">+<img src="assets/x2.png" style="width:14px; vertical-align:middle;"></button>
          <button onclick="giveItem('${p.twitch_user_id}', 'multi4')" class="btn-action" style="background:#E65100;" title="Dar x4">+<img src="assets/x4.png" style="width:14px; vertical-align:middle;"></button>
          <button onclick="giveItem('${p.twitch_user_id}', 'multi6')" class="btn-action" style="background:#E65100;" title="Dar x6">+<img src="assets/x6.png" style="width:14px; vertical-align:middle;"></button>
        </div>
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

// ---------- Tab switcher ----------
function switchDashTab(tab) {
  document.querySelectorAll('.dash-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.getElementById('dash-' + tab).classList.add('active');
  // Highlight button
  document.querySelectorAll('.dash-tab').forEach(b => {
    if (b.textContent.toLowerCase().includes(tab === 'players' ? 'jugadores' : 'tienda')) {
      b.classList.add('active');
    }
  });
}

// ---------- Gestión de Tienda ----------
let storeData = [];

const ASSET_LIST = [
  'assets/inmortal.png',
  'assets/jump.png',
  'assets/iman.png',
  'assets/x2.png',
  'assets/x4.png',
  'assets/x6.png',
  'assets/coin.png',
];

async function loadStoreItems() {
  const list = document.getElementById('storeItemsList');
  list.innerHTML = '<p style="color:#aaa;">Cargando...</p>';
  const { data, error } = await sb.from('store_config').select('*').order('tab').order('price');
  if (error) {
    list.innerHTML = `<p style="color:red;">Error: ${error.message}<br>Crea la tabla <b>store_config</b> en Supabase primero.</p>`;
    return;
  }
  storeData = data || [];
  renderStoreEditor();
}

function renderStoreEditor() {
  const list = document.getElementById('storeItemsList');
  if (!storeData.length) {
    list.innerHTML = `<p style="color:#aaa;">No hay ítems aún. Presiona "+ NUEVO ÍTEM" para agregar.</p>`;
    return;
  }
  list.innerHTML = storeData.map(item => `
    <div class="store-editor-row" id="row-${item.id}">
      <img src="${item.image || 'assets/coin.png'}" class="store-preview-img" id="preview-${item.id}">
      <label>Tab/Categoría<input type="text" value="${item.tab || ''}" id="tab-${item.id}"></label>
      <label>Tipo (key)<input type="text" value="${item.type || ''}" id="type-${item.id}"></label>
      <label>Etiqueta<input type="text" value="${item.label || ''}" id="label-${item.id}"></label>
      <label>Descripción<input type="text" value="${item.description || ''}" id="desc-${item.id}"></label>
      <label>Imagen
        <select id="img-${item.id}" onchange="document.getElementById('preview-${item.id}').src=this.value">
          ${ASSET_LIST.map(a => `<option value="${a}"${item.image===a?' selected':''}>${a.replace('assets/','')}</option>`).join('')}
        </select>
      </label>
      <label>Segundos<input type="number" value="${item.seconds || 15}" id="secs-${item.id}" style="width:60px;"></label>
      <label>Precio<input type="number" value="${item.price || 0}" id="price-${item.id}" style="width:80px;"></label>
      <label>Activo<input type="checkbox" ${item.enabled?'checked':''} id="enabled-${item.id}"></label>
      <div style="display:flex; flex-direction:column; gap:6px;">
        <button onclick="saveStoreItem(${item.id})" class="btn-action" style="background:#00c896;">💾 Guardar</button>
        <button onclick="deleteStoreItem(${item.id})" class="btn-action btn-danger">🗑 Borrar</button>
      </div>
    </div>
  `).join('');
}

async function saveStoreItem(id) {
  const payload = {
    tab:         document.getElementById(`tab-${id}`).value.trim(),
    type:        document.getElementById(`type-${id}`).value.trim(),
    label:       document.getElementById(`label-${id}`).value.trim(),
    description: document.getElementById(`desc-${id}`).value.trim(),
    image:       document.getElementById(`img-${id}`).value,
    seconds:     parseInt(document.getElementById(`secs-${id}`).value) || 15,
    price:       parseInt(document.getElementById(`price-${id}`).value) || 0,
    enabled:     document.getElementById(`enabled-${id}`).checked,
  };
  const { error } = await sb.from('store_config').update(payload).eq('id', id);
  if (error) { alert('Error guardando: ' + error.message); console.error(error); }
  else { alert('¡Guardado!'); loadStoreItems(); }
}

async function deleteStoreItem(id) {
  if (!confirm('¿Eliminar este ítem de la tienda?')) return;
  const { error } = await sb.from('store_config').delete().eq('id', id);
  if (error) { alert('Error borrando: ' + error.message); }
  else { loadStoreItems(); }
}

async function addStoreItem() {
  const { error } = await sb.from('store_config').insert({
    tab: 'Nueva Categoría',
    type: 'nuevoItem',
    label: 'Nuevo Ítem',
    description: 'Descripción del ítem',
    image: 'assets/coin.png',
    seconds: 15,
    price: 500,
    enabled: true,
  });
  if (error) { alert('Error creando: ' + error.message); console.error(error); }
  else { loadStoreItems(); }
}

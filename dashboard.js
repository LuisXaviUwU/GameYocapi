const SUPABASE_URL = 'https://udzvhvxleujmyyzwfvjc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TehtfAvBQg05hNcaSVdg1Q_E7Nc7ltt';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_USER = 'capiluisxavi';

let currentUser = null;
let playersData = [];
let storeData = [];

const ITEM_ICONS = {
  shield:    'assets/inmortal.png',
  shield30:  'assets/inmortal.png',
  shield60:  'assets/inmortal.png',
  doubleJump:'assets/jump.png',
  magnet:    'assets/iman.png',
  multi:     'assets/x2.png',
  multi4:    'assets/x4.png',
  multi6:    'assets/x6.png'
};

const ASSET_LIST = [
  'assets/inmortal.png',
  'assets/jump.png',
  'assets/iman.png',
  'assets/x2.png',
  'assets/x4.png',
  'assets/x6.png',
  'assets/coin.png',
];

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('twitchLoginBtn').addEventListener('click', async () => {
    await sb.auth.signInWithOAuth({ provider: 'twitch', options: { redirectTo: window.location.href } });
  });

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', async () => { await sb.auth.signOut(); window.location.reload(); });

  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) refreshBtn.addEventListener('click', loadPlayers);

  const searchBox = document.getElementById('searchBox');
  if (searchBox) searchBox.addEventListener('input', (e) => renderTable(e.target.value));
});

sb.auth.onAuthStateChange(async (_event, session) => {
  currentUser = session?.user || null;
  if (currentUser) {
    const username = currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || currentUser.email;
    if (username.toLowerCase() === ADMIN_USER.toLowerCase()) {
      document.getElementById('loginArea').style.display = 'none';
      document.getElementById('adminArea').style.display = 'block';
      document.getElementById('adminName').textContent = `Admin: ${username}`;
      loadPlayers();
      loadStoreItems();
    } else {
      document.getElementById('loginArea').innerHTML = `
        <h2 style="color: red;">ACCESO DENEGADO</h2>
        <p>El usuario <b>${username}</b> no es administrador.</p>
        <button onclick="sb.auth.signOut().then(() => window.location.reload())" class="menu-btn" style="width:auto;">CERRAR SESIÓN</button>
        <br><a href="index.html" class="back-btn">VOLVER AL JUEGO</a>
      `;
    }
  } else {
    document.getElementById('loginArea').style.display = 'flex';
    document.getElementById('adminArea').style.display = 'none';
  }
});

// ---- Tab switcher ----
function switchDashTab(tab) {
  document.querySelectorAll('.dash-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.getElementById('dash-' + tab).classList.add('active');
  document.querySelectorAll('.dash-tab').forEach(b => {
    const txt = b.textContent.toLowerCase();
    if ((tab === 'players' && txt.includes('jugadores')) || (tab === 'store' && txt.includes('tienda'))) {
      b.classList.add('active');
    }
  });
}

// ---- Players ----
async function loadPlayers() {
  const { data, error } = await sb.from('player_wallets').select('*').order('balance', { ascending: false });
  if (error) {
    console.error('Error loading players:', error);
    document.getElementById('playersList').innerHTML = `<tr><td colspan="4" style="color:red;">Error: ${error.message}<br>Revisa el RLS de Supabase.</td></tr>`;
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
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">No se encontraron jugadores.<br><small style="color:#888;">Si solo apareces tú, desactiva el RLS en Supabase para la tabla player_wallets.</small></td></tr>`;
    return;
  }

  filtered.forEach(p => {
    const inv = p.inventory || {};
    const invHTML = Object.keys(inv).map(key => {
      if (inv[key] > 0) {
        const iconSrc = ITEM_ICONS[key] || '';
        return `<div class="inv-badge"><img src="${iconSrc}" title="${key}" style="width:20px; image-rendering:pixelated;"> <b>x${inv[key]}</b></div>`;
      }
      return '';
    }).join('') || '<span style="color:#888; font-size:12px;">Vacío</span>';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:bold; color:var(--gold); font-size:15px;">
        <img src="assets/logo_capi.png" style="width:28px; vertical-align:middle; margin-right:8px; border-radius:50%; background:#000; object-fit:cover;">
        ${p.twitch_username}
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:8px;">
          <img src="assets/coin.png" style="width:24px;">
          <input type="number" id="bal-${p.twitch_user_id}" class="input-coin" value="${p.balance}" style="width:90px; font-size:14px;">
          <button onclick="updateBalance('${p.twitch_user_id}')" class="btn-action" style="font-size:12px; padding:8px 12px;">💾 Guardar</button>
        </div>
      </td>
      <td>
        <div class="inventory-badges">${invHTML}</div>
      </td>
      <td>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px;">
          <button onclick="addCoins('${p.twitch_user_id}', 100)" class="btn-action-big" style="background:#00c896; border-color:#008f6b;">
            +100 <img src="assets/coin.png" style="width:16px; vertical-align:middle;">
          </button>
          <button onclick="addCoins('${p.twitch_user_id}', 500)" class="btn-action-big" style="background:#00c896; border-color:#008f6b;">
            +500 <img src="assets/coin.png" style="width:16px; vertical-align:middle;">
          </button>
          <button onclick="addCoins('${p.twitch_user_id}', 1000)" class="btn-action-big" style="background:#00c896; border-color:#008f6b;">
            +1000 <img src="assets/coin.png" style="width:16px; vertical-align:middle;">
          </button>
          <button onclick="giveItem('${p.twitch_user_id}', 'shield')" class="btn-action-big" style="background:#1565C0; border-color:#0d47a1;" title="Escudo 10s">
            🛡 10s
          </button>
          <button onclick="giveItem('${p.twitch_user_id}', 'shield30')" class="btn-action-big" style="background:#1565C0; border-color:#0d47a1;" title="Escudo 30s">
            🛡 30s
          </button>
          <button onclick="giveItem('${p.twitch_user_id}', 'shield60')" class="btn-action-big" style="background:#1565C0; border-color:#0d47a1;" title="Escudo 60s">
            🛡 60s
          </button>
          <button onclick="giveItem('${p.twitch_user_id}', 'doubleJump')" class="btn-action-big" style="background:#2E7D32; border-color:#1b5e20;" title="Doble Salto">
            <img src="assets/jump.png" style="width:18px; vertical-align:middle;"> Salto
          </button>
          <button onclick="giveItem('${p.twitch_user_id}', 'magnet')" class="btn-action-big" style="background:#6A1B9A; border-color:#4a148c;" title="Imán">
            <img src="assets/iman.png" style="width:18px; vertical-align:middle;"> Imán
          </button>
          <button onclick="giveItem('${p.twitch_user_id}', 'multi')" class="btn-action-big" style="background:#E65100; border-color:#bf360c;">
            <img src="assets/x2.png" style="width:18px; vertical-align:middle;"> x2
          </button>
          <button onclick="giveItem('${p.twitch_user_id}', 'multi4')" class="btn-action-big" style="background:#E65100; border-color:#bf360c;">
            <img src="assets/x4.png" style="width:18px; vertical-align:middle;"> x4
          </button>
          <button onclick="giveItem('${p.twitch_user_id}', 'multi6')" class="btn-action-big" style="background:#E65100; border-color:#bf360c;">
            <img src="assets/x6.png" style="width:18px; vertical-align:middle;"> x6
          </button>
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
  if (error) { alert('Error al actualizar. Revisa RLS en Supabase.'); console.error(error); }
  else { loadPlayers(); }
}

async function addCoins(uid, amount) {
  const player = playersData.find(p => p.twitch_user_id === uid);
  if (!player) return;
  const newBal = (player.balance || 0) + amount;
  const { error } = await sb.from('player_wallets').update({ balance: newBal }).eq('twitch_user_id', uid);
  if (error) { alert('Error al actualizar monedas.'); console.error(error); }
  else { loadPlayers(); }
}

async function giveItem(uid, item) {
  const player = playersData.find(p => p.twitch_user_id === uid);
  if (!player) return;
  const inv = { ...(player.inventory || {}) };
  inv[item] = (inv[item] || 0) + 1;
  const { error } = await sb.from('player_wallets').update({ inventory: inv }).eq('twitch_user_id', uid);
  if (error) { alert('Error al entregar objeto.'); console.error(error); }
  else { loadPlayers(); }
}

// ---- Store editor ----
async function loadStoreItems() {
  const list = document.getElementById('storeItemsList');
  if (!list) return;
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
  if (!list) return;
  if (!storeData.length) {
    list.innerHTML = `<p style="color:#aaa;">No hay ítems aún. Presiona "+ NUEVO ÍTEM" para agregar.</p>`;
    return;
  }
  list.innerHTML = storeData.map(item => `
    <div class="store-editor-row" id="row-${item.id}">
      <img src="${item.image || 'assets/coin.png'}" class="store-preview-img" id="preview-${item.id}">
      <label>Tab/Categoría<input type="text" value="${escHtml(item.tab || '')}" id="stab-${item.id}"></label>
      <label>Tipo (key)<input type="text" value="${escHtml(item.type || '')}" id="stype-${item.id}"></label>
      <label>Etiqueta<input type="text" value="${escHtml(item.label || '')}" id="slabel-${item.id}"></label>
      <label>Descripción<input type="text" value="${escHtml(item.description || '')}" id="sdesc-${item.id}"></label>
      <label>Imagen
        <select id="simg-${item.id}" onchange="document.getElementById('preview-${item.id}').src=this.value">
          ${ASSET_LIST.map(a => `<option value="${a}"${item.image===a?' selected':''}>${a.replace('assets/','')}</option>`).join('')}
        </select>
      </label>
      <label>Segundos<input type="number" value="${item.seconds || 15}" id="ssecs-${item.id}" style="width:65px;"></label>
      <label>Precio<input type="number" value="${item.price || 0}" id="sprice-${item.id}" style="width:90px;"></label>
      <label style="flex-direction:row; align-items:center; gap:6px;">Activo<input type="checkbox" ${item.enabled?'checked':''} id="senabled-${item.id}"></label>
      <div style="display:flex; flex-direction:column; gap:6px; margin-left:auto;">
        <button onclick="saveStoreItem(${item.id})" class="btn-action" style="background:#00c896; padding:10px 16px;">💾 Guardar</button>
        <button onclick="deleteStoreItem(${item.id})" class="btn-action btn-danger" style="padding:10px 16px;">🗑 Borrar</button>
      </div>
    </div>
  `).join('');
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function saveStoreItem(id) {
  const payload = {
    tab:         document.getElementById(`stab-${id}`).value.trim(),
    type:        document.getElementById(`stype-${id}`).value.trim(),
    label:       document.getElementById(`slabel-${id}`).value.trim(),
    description: document.getElementById(`sdesc-${id}`).value.trim(),
    image:       document.getElementById(`simg-${id}`).value,
    seconds:     parseInt(document.getElementById(`ssecs-${id}`).value) || 15,
    price:       parseInt(document.getElementById(`sprice-${id}`).value) || 0,
    enabled:     document.getElementById(`senabled-${id}`).checked,
  };
  const { error } = await sb.from('store_config').update(payload).eq('id', id);
  if (error) { alert('Error guardando: ' + error.message); console.error(error); }
  else { loadStoreItems(); }
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

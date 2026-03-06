const SUPABASE_URL = 'https://aguqmgbwuhvxabvxzecx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndXFtZ2J3dWh2eGFidnh6ZWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTMwNTIsImV4cCI6MjA4ODM4OTA1Mn0.TlVJDAMnrCIyXzQVJzUVMoLb_MrJTqOsliV_Fi_NKkI'
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

async function getProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data
}

async function requireAuth(allowedRoles = []) {
  const session = await getSession()
  if (!session) { window.location.href = 'index.html'; return null }
  const profile = await getProfile(session.user.id)
  if (!profile) { window.location.href = 'index.html'; return null }
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    window.location.href = 'dashboard.html'; return null
  }
  return { session, profile }
}

async function logout() {
  await supabase.auth.signOut()
  window.location.href = 'index.html'
}

function renderSidebar(profile, activePage) {
  const allLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', href: 'dashboard.html', roles: ['admin','consultant','marketing'] },
    { id: 'contacts', label: 'Contacts', icon: '👥', href: 'contacts.html', roles: ['admin','consultant'] },
    { id: 'lists', label: 'Mes listes', icon: '📋', href: 'lists.html', roles: ['admin','consultant'] },
    { id: 'emails', label: 'Emails', icon: '✉️', href: 'emails.html', roles: ['admin','consultant','marketing'] },
    { id: 'relances', label: 'À relancer', icon: '🔔', href: 'relances.html', roles: ['admin','consultant'] },
    { id: 'tasks', label: 'Historique', icon: '📝', href: 'tasks.html', roles: ['admin','consultant','marketing'] },
    { id: 'admin', label: 'Administration', icon: '⚙️', href: 'admin.html', roles: ['admin'] },
  ]
  const links = allLinks.filter(l => l.roles.includes(profile.role))
  const roleLabels = { admin: 'Administrateur', consultant: 'Consultant', marketing: 'Marketing' }
  return `
    <nav class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">⚡</span>
        <span class="logo-text">CRM</span>
      </div>
      <ul class="sidebar-menu">
        ${links.map(l => `
          <li class="menu-item ${activePage === l.id ? 'active' : ''}">
            <a href="${l.href}"><span class="menu-icon">${l.icon}</span>${l.label}</a>
          </li>`).join('')}
      </ul>
      <div class="sidebar-footer">
        <div class="user-info">
          <span class="user-name">${profile.full_name || 'Utilisateur'}</span>
          <span class="user-role">${roleLabels[profile.role] || profile.role}</span>
        </div>
        <button onclick="logout()" class="logout-btn">Déconnexion</button>
      </div>
    </nav>`
}

async function loadNotifications(userId) {
  const now = new Date().toISOString()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .lte('scheduled_for', now)
    .order('created_at', { ascending: false })
  return data || []
}

const sharedCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --primary: #4F46E5;
    --primary-dark: #3730A3;
    --sidebar-bg: #0F172A;
    --sidebar-text: #94A3B8;
    --bg: #F1F5F9;
    --card: #FFFFFF;
    --text: #0F172A;
    --muted: #64748B;
    --border: #E2E8F0;
    --success: #10B981;
    --warning: #F59E0B;
    --danger: #EF4444;
    --sidebar-w: 240px;
  }
  body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); display: flex; min-height: 100vh; }
  .sidebar { width: var(--sidebar-w); background: var(--sidebar-bg); display: flex; flex-direction: column; position: fixed; height: 100vh; z-index: 100; }
  .sidebar-logo { padding: 24px 20px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #1E293B; }
  .logo-icon { font-size: 24px; }
  .logo-text { color: white; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
  .sidebar-menu { list-style: none; padding: 16px 0; flex: 1; overflow-y: auto; }
  .menu-item a { display: flex; align-items: center; gap: 12px; padding: 11px 20px; color: var(--sidebar-text); text-decoration: none; font-size: 14px; font-weight: 500; border-radius: 0; transition: all 0.15s; }
  .menu-item a:hover { background: #1E293B; color: white; }
  .menu-item.active a { background: var(--primary); color: white; }
  .menu-icon { font-size: 16px; width: 20px; text-align: center; }
  .sidebar-footer { padding: 16px 20px; border-top: 1px solid #1E293B; }
  .user-name { display: block; color: white; font-size: 13px; font-weight: 600; }
  .user-role { display: block; color: var(--sidebar-text); font-size: 11px; margin-bottom: 12px; }
  .logout-btn { width: 100%; padding: 8px; background: #1E293B; color: var(--sidebar-text); border: none; border-radius: 6px; font-size: 13px; cursor: pointer; transition: all 0.15s; }
  .logout-btn:hover { background: var(--danger); color: white; }
  .main { margin-left: var(--sidebar-w); flex: 1; display: flex; flex-direction: column; }
  .topbar { background: var(--card); border-bottom: 1px solid var(--border); padding: 16px 32px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; }
  .topbar-title { font-size: 18px; font-weight: 600; }
  .notif-btn { position: relative; background: none; border: none; font-size: 20px; cursor: pointer; padding: 4px; }
  .notif-badge { position: absolute; top: 0; right: 0; background: var(--danger); color: white; font-size: 10px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  .content { padding: 32px; flex: 1; }
  .card { background: var(--card); border-radius: 12px; border: 1px solid var(--border); padding: 24px; }
  .card-title { font-size: 15px; font-weight: 600; margin-bottom: 16px; }
  .btn { padding: 9px 18px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }
  .btn-primary { background: var(--primary); color: white; }
  .btn-primary:hover { background: var(--primary-dark); }
  .btn-secondary { background: var(--bg); color: var(--text); border: 1px solid var(--border); }
  .btn-secondary:hover { background: var(--border); }
  .btn-danger { background: var(--danger); color: white; }
  .btn-success { background: var(--success); color: white; }
  .btn-sm { padding: 6px 12px; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 10px 14px; font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border); background: var(--bg); }
  td { padding: 12px 14px; font-size: 14px; border-bottom: 1px solid var(--border); }
  tr:hover td { background: #F8FAFC; }
  .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
  .badge-pending { background: #FEF3C7; color: #92400E; }
  .badge-sent { background: #DBEAFE; color: #1E40AF; }
  .badge-replied { background: #D1FAE5; color: #065F46; }
  .badge-admin { background: #EDE9FE; color: #5B21B6; }
  .badge-consultant { background: #DBEAFE; color: #1E40AF; }
  .badge-marketing { background: #FCE7F3; color: #9D174D; }
  input, select, textarea { padding: 9px 13px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; font-family: 'Inter', sans-serif; outline: none; width: 100%; transition: border-color 0.15s; background: white; }
  input:focus, select:focus, textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
  .form-group { margin-bottom: 16px; }
  .form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; color: var(--text); }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: center; justify-content: center; }
  .modal { background: white; border-radius: 16px; padding: 28px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .modal-title { font-size: 17px; font-weight: 600; }
  .modal-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--muted); }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .stat-card { background: var(--card); border-radius: 12px; border: 1px solid var(--border); padding: 20px; }
  .stat-value { font-size: 32px; font-weight: 700; margin: 8px 0 4px; }
  .stat-label { font-size: 13px; color: var(--muted); }
  .stat-icon { font-size: 24px; }
  .search-bar { display: flex; gap: 10px; margin-bottom: 20px; }
  .search-bar input { max-width: 320px; }
  .empty-state { text-align: center; padding: 60px 20px; color: var(--muted); }
  .empty-state .empty-icon { font-size: 48px; margin-bottom: 12px; }
  .empty-state p { font-size: 15px; }
  .alert { padding: 12px 16px; border-radius: 8px; font-size: 14px; margin-bottom: 16px; }
  .alert-error { background: #FEE2E2; color: #991B1B; }
  .alert-success { background: #D1FAE5; color: #065F46; }
  .hidden { display: none !important; }
`

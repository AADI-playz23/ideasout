// Simple portfolio app: users, projects, comments persisted to localStorage
// Keys
const USERS_KEY = 'sm_users_v1';
const PROJECTS_KEY = 'sm_projects_v1';
const SESSION_KEY = 'sm_current_user_v1';

// DOM
const welcomeText = document.getElementById('welcome-text');
const btnShowLogin = document.getElementById('btn-show-login');
const btnShowSignup = document.getElementById('btn-show-signup');
const btnLogout = document.getElementById('btn-logout');
const btnToggleSubmit = document.getElementById('btn-toggle-submit');
const submitPanel = document.getElementById('submit-panel');
const projectForm = document.getElementById('project-form');
const projectsGrid = document.getElementById('projects-grid');
const imageInput = document.getElementById('project-image');
const imagePreviewContainer = document.getElementById('image-preview-container');
const materialInput = document.getElementById('material-input');
const btnAddMaterial = document.getElementById('btn-add-material');
const materialsList = document.getElementById('materials-list');
const btnCancelSubmit = document.getElementById('btn-cancel-submit');

const projectModal = document.getElementById('project-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

const authModal = document.getElementById('auth-modal');
const authClose = document.getElementById('auth-close');
const btnLogin = document.getElementById('btn-login');
const btnSignup = document.getElementById('btn-signup');
const btnSwitchToSignup = document.getElementById('btn-switch-to-signup');
const btnSwitchToLogin = document.getElementById('btn-switch-to-login');

const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const signupUsername = document.getElementById('signup-username');
const signupPassword = document.getElementById('signup-password');
const signupPasswordConfirm = document.getElementById('signup-password-confirm');
const loginMsg = document.getElementById('login-msg');
const signupMsg = document.getElementById('signup-msg');
const loginFormSection = document.getElementById('login-form');
const signupFormSection = document.getElementById('signup-form');

const btnShowLogin2 = document.getElementById('btn-show-login');
const btnShowSignup2 = document.getElementById('btn-show-signup');

// Utilities
function readJSON(key, fallback) {
  const s = localStorage.getItem(key);
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

// Password hashing using SubtleCrypto
async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
}

// Data access
function loadUsers() { return readJSON(USERS_KEY, []); }
function saveUsers(users) { writeJSON(USERS_KEY, users); }

function loadProjects() { return readJSON(PROJECTS_KEY, []); }
function saveProjects(projects) { writeJSON(PROJECTS_KEY, projects); }

function setCurrentUser(username) { writeJSON(SESSION_KEY, { username }); }
function getCurrentUser() { const s = readJSON(SESSION_KEY, null); return s ? s.username : null; }
function clearCurrentUser() { localStorage.removeItem(SESSION_KEY); }

// Initialize default admin if no users
(async function initDefaults(){
  let users = loadUsers();
  if (!users || users.length === 0) {
    const adminHash = await hashPassword('admin');
    users = [{ id: generateId('u_'), username: 'admin', passwordHash: adminHash, role: 'admin' }];
    saveUsers(users);
    console.log('Default admin created: admin / admin');
  }
  renderUI();
})();

// UI rendering and actions
function renderUI(){
  const username = getCurrentUser();
  if (username) {
    welcomeText.textContent = `Logged in as ${username}`;
    btnShowLogin.classList.add('hidden');
    btnShowSignup.classList.add('hidden');
    btnLogout.classList.remove('hidden');
    btnToggleSubmit.classList.remove('hidden');
  } else {
    welcomeText.textContent = `Not signed in`;
    btnShowLogin.classList.remove('hidden');
    btnShowSignup.classList.remove('hidden');
    btnLogout.classList.add('hidden');
    btnToggleSubmit.classList.remove('hidden');
  }
  renderProjectsGrid();
  clearProjectForm();
}

// Project form helpers
let currentMaterials = [];
function renderMaterials() {
  materialsList.innerHTML = '';
  currentMaterials.forEach((m, i) => {
    const span = document.createElement('span');
    span.className = 'material-chip';
    span.textContent = m + ' ';
    const del = document.createElement('button');
    del.textContent = '×';
    del.title = 'Remove';
    del.style.marginLeft = '8px';
    del.onclick = () => { currentMaterials.splice(i,1); renderMaterials(); };
    span.appendChild(del);
    materialsList.appendChild(span);
  });
}
btnAddMaterial.addEventListener('click', () => {
  const v = materialInput.value.trim();
  if (v) {
    currentMaterials.push(v);
    materialInput.value = '';
    renderMaterials();
  }
});
materialInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); btnAddMaterial.click(); }
});

// Image preview
let currentImageDataUrl = null;
imageInput.addEventListener('change', () => {
  const f = imageInput.files && imageInput.files[0];
  if (!f) { imagePreviewContainer.innerHTML = ''; currentImageDataUrl = null; return; }
  const reader = new FileReader();
  reader.onload = (ev) => {
    currentImageDataUrl = ev.target.result;
    imagePreviewContainer.innerHTML = `<img src="${currentImageDataUrl}" alt="preview">`;
  };
  reader.readAsDataURL(f);
});

// Submit project UI toggles
btnToggleSubmit.addEventListener('click', () => {
  const username = getCurrentUser();
  if (!username) {
    showAuthModal('login');
    return;
  }
  submitPanel.classList.toggle('hidden');
});
btnCancelSubmit.addEventListener('click', () => {
  submitPanel.classList.add('hidden');
  clearProjectForm();
});

function clearProjectForm() {
  projectForm.reset();
  imagePreviewContainer.innerHTML = '';
  currentImageDataUrl = null;
  currentMaterials = [];
  renderMaterials();
}

// Submit project
projectForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = getCurrentUser();
  if (!username) { alert('You must be logged in to submit a project'); return; }
  const title = document.getElementById('project-title').value.trim();
  const description = document.getElementById('project-description').value.trim();
  if (!title || !description) { alert('Title and description required'); return; }
  const project = {
    id: generateId('p_'),
    title,
    description,
    image: currentImageDataUrl || null,
    materials: currentMaterials.slice(),
    author: username,
    createdAt: new Date().toISOString(),
    comments: []
  };
  const projects = loadProjects();
  projects.unshift(project);
  saveProjects(projects);
  clearProjectForm();
  submitPanel.classList.add('hidden');
  renderProjectsGrid();
});

// Render projects grid
function renderProjectsGrid(){
  const projects = loadProjects();
  projectsGrid.innerHTML = '';
  if (!projects || projects.length === 0) {
    projectsGrid.innerHTML = '<p class="small">No projects yet — be the first to submit!</p>';
    return;
  }
  projects.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.title)}">` : `<div style="height:140px;background:#eef2ff;display:flex;align-items:center;justify-content:center;color:#254a8a">No image</div>`}
      <div class="card-body">
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description.slice(0,150))}${p.description.length>150?'…':''}</p>
        <div class="card-footer">
          <div class="meta">By ${escapeHtml(p.author)}</div>
          <div><button data-id="${p.id}" class="primary btn-open">Open</button></div>
        </div>
      </div>
    `;
    const openBtn = card.querySelector('.btn-open');
    openBtn.addEventListener('click', () => openProjectModal(p.id));
    projectsGrid.appendChild(card);
  });
}

// Project modal
modalClose.addEventListener('click', closeProjectModal);
projectModal.addEventListener('click', (e) => { if (e.target === projectModal) closeProjectModal(); });
function openProjectModal(projectId) {
  const projects = loadProjects();
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  modalBody.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <h2>${escapeHtml(p.title)}</h2>
    <div class="meta">By ${escapeHtml(p.author)} • ${new Date(p.createdAt).toLocaleString()}</div>
    ${p.image ? `<img src="${p.image}" style="max-width:100%;margin:12px 0;border-radius:8px">` : ''}
    <p style="white-space:pre-wrap">${escapeHtml(p.description)}</p>
    <h4>Materials</h4>
    <div id="modal-materials"></div>
    <hr>
    <h4>Comments</h4>
    <div id="modal-comments"></div>
    <div id="modal-comment-form"></div>
    <div style="margin-top:12px"></div>
  `;
  modalBody.appendChild(wrapper);

  const modalMaterials = document.getElementById('modal-materials');
  p.materials.forEach(m => {
    const chip = document.createElement('span');
    chip.className = 'material-chip';
    chip.textContent = m;
    modalMaterials.appendChild(chip);
  });

  renderModalComments(p);

  // Delete project button (owner or admin)
  const username = getCurrentUser();
  const users = loadUsers();
  const currentUserObj = users.find(u => u.username === username);
  if (username && (username === p.author || (currentUserObj && currentUserObj.role === 'admin'))) {
    const delbtn = document.createElement('button');
    delbtn.textContent = 'Delete project';
    delbtn.className = 'btn-delete';
    delbtn.style.marginTop = '8px';
    delbtn.onclick = () => {
      if (!confirm('Delete this project?')) return;
      deleteProject(p.id);
      closeProjectModal();
    };
    wrapper.appendChild(delbtn);
  }

  projectModal.classList.remove('hidden');
  projectModal.setAttribute('aria-hidden', 'false');
}

function closeProjectModal() {
  projectModal.classList.add('hidden');
  projectModal.setAttribute('aria-hidden', 'true');
  modalBody.innerHTML = '';
}

// Comments rendering and adding
function renderModalComments(project) {
  const commentsDiv = document.getElementById('modal-comments');
  commentsDiv.innerHTML = '';
  if (!project.comments || project.comments.length === 0) {
    commentsDiv.innerHTML = '<p class="small">No comments yet.</p>';
  } else {
    project.comments.forEach((c) => {
      const div = document.createElement('div');
      div.className = 'comment';
      div.innerHTML = `<div class="meta">${escapeHtml(c.author)} • ${new Date(c.createdAt).toLocaleString()}</div>
                       <div style="white-space:pre-wrap">${escapeHtml(c.content)}</div>`;
      // delete comment if owner or admin
      const username = getCurrentUser();
      const users = loadUsers();
      const currentUserObj = users.find(u => u.username === username);
      if (username && (username === c.author || (currentUserObj && currentUserObj.role === 'admin'))) {
        const del = document.createElement('button');
        del.className = 'btn-delete';
        del.style.marginTop = '8px';
        del.textContent = 'Delete comment';
        del.onclick = () => {
          if (!confirm('Delete this comment?')) return;
          deleteComment(project.id, c.id);
          // re-open modal content
          const projects = loadProjects();
          const pUpdated = projects.find(x => x.id === project.id);
          renderModalComments(pUpdated);
        };
        div.appendChild(del);
      }
      commentsDiv.appendChild(div);
    });
  }

  // Comment form (only if logged in)
  const commentFormDiv = document.getElementById('modal-comment-form');
  commentFormDiv.innerHTML = '';
  const username = getCurrentUser();
  if (!username) {
    commentFormDiv.innerHTML = `<p class="small">Log in to comment.</p>`;
  } else {
    const ta = document.createElement('textarea');
    ta.rows = 3;
    ta.placeholder = 'Write a comment...';
    const submit = document.createElement('button');
    submit.className = 'primary';
    submit.textContent = 'Post comment';
    submit.onclick = () => {
      const content = ta.value.trim();
      if (!content) return;
      addComment(project.id, content);
      // refresh
      const projects = loadProjects();
      const pUpdated = projects.find(x => x.id === project.id);
      renderModalComments(pUpdated);
      ta.value = '';
    };
    commentFormDiv.appendChild(ta);
    commentFormDiv.appendChild(document.createElement('br'));
    commentFormDiv.appendChild(submit);
  }
}

function addComment(projectId, content) {
  const username = getCurrentUser();
  if (!username) { alert('Log in to comment'); return; }
  const projects = loadProjects();
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  const comment = { id: generateId('c_'), author: username, content, createdAt: new Date().toISOString() };
  p.comments.push(comment);
  saveProjects(projects);
}

function deleteComment(projectId, commentId) {
  const projects = loadProjects();
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  p.comments = p.comments.filter(c => c.id !== commentId);
  saveProjects(projects);
}

function deleteProject(projectId) {
  let projects = loadProjects();
  projects = projects.filter(p => p.id !== projectId);
  saveProjects(projects);
  renderProjectsGrid();
}

// Auth modal controls
btnShowLogin.addEventListener('click', () => showAuthModal('login'));
btnShowSignup.addEventListener('click', () => showAuthModal('signup'));
authClose.addEventListener('click', () => { authModal.classList.add('hidden'); });
authModal.addEventListener('click', (e) => { if (e.target === authModal) authModal.classList.add('hidden'); });

btnSwitchToSignup.addEventListener('click', () => { showAuthModal('signup'); });
btnSwitchToLogin.addEventListener('click', () => { showAuthModal('login'); });

function showAuthModal(tab = 'login') {
  loginMsg.textContent = '';
  signupMsg.textContent = '';
  loginFormSection.classList.toggle('hidden', tab !== 'login');
  signupFormSection.classList.toggle('hidden', tab !== 'signup');
  authModal.classList.remove('hidden');
}

// Login logic
btnLogin.addEventListener('click', async () => {
  const u = loginUsername.value.trim();
  const p = loginPassword.value;
  loginMsg.textContent = '';
  if (!u || !p) { loginMsg.textContent = 'Missing username or password'; return; }
  const users = loadUsers();
  const user = users.find(x => x.username === u);
  if (!user) { loginMsg.textContent = 'Invalid credentials'; return; }
  const h = await hashPassword(p);
  if (h !== user.passwordHash) { loginMsg.textContent = 'Invalid credentials'; return; }
  setCurrentUser(u);
  authModal.classList.add('hidden');
  loginUsername.value = ''; loginPassword.value = '';
  renderUI();
});

// Signup logic
btnSignup.addEventListener('click', async () => {
  const u = signupUsername.value.trim();
  const p = signupPassword.value;
  const pc = signupPasswordConfirm.value;
  signupMsg.textContent = '';
  if (!u || !p) { signupMsg.textContent = 'Missing username or password'; return; }
  if (p !== pc) { signupMsg.textContent = 'Passwords do not match'; return; }
  const users = loadUsers();
  if (users.find(x => x.username === u)) { signupMsg.textContent = 'Username taken'; return; }
  const h = await hashPassword(p);
  users.push({ id: generateId('u_'), username: u, passwordHash: h, role: 'user' });
  saveUsers(users);
  setCurrentUser(u);
  authModal.classList.add('hidden');
  signupUsername.value = ''; signupPassword.value = ''; signupPasswordConfirm.value = '';
  renderUI();
});

// Logout
btnLogout.addEventListener('click', () => {
  clearCurrentUser();
  renderUI();
});

// Helpers
function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, function (m) {
    return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m];
  });
}
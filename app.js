// Supabase Configuration from your screenshot
const SUPABASE_URL = 'https://nnrmgjtiyueakkxxixjr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0Hsiy0X6cDuA9eP-4QJFeg_IZGGy-rn';
const supabase = lib.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM Elements
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

// Initialize App
async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    renderUI(session?.user);
}
init();

// UI Rendering
function renderUI(user) {
    if (user) {
        welcomeText.textContent = `Logged in as ${user.email}`;
        btnShowLogin.classList.add('hidden');
        btnShowSignup.classList.add('hidden');
        btnLogout.classList.remove('hidden');
    } else {
        welcomeText.textContent = `Not signed in`;
        btnShowLogin.classList.remove('hidden');
        btnShowSignup.classList.remove('hidden');
        btnLogout.classList.add('hidden');
    }
    renderProjectsGrid();
    clearProjectForm();
}

// Fetch and Render Projects
async function renderProjectsGrid() {
    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) { console.error(error); return; }

    projectsGrid.innerHTML = '';
    if (!projects || projects.length === 0) {
        projectsGrid.innerHTML = '<p class="small">No projects yet.</p>';
        return;
    }

    projects.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
      ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.title)}">` : `<div style="height:140px;background:#eef2ff;display:flex;align-items:center;justify-content:center;color:#254a8a">No image</div>`}
      <div class="card-body">
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.description.slice(0,100))}...</p>
        <div class="card-footer">
          <div class="meta">By ${escapeHtml(p.author)}</div>
          <button onclick="openProjectModal('${p.id}')" class="primary">Open</button>
        </div>
      </div>
    `;
        projectsGrid.appendChild(card);
    });
}

// Project Materials Logic
let currentMaterials = [];
btnAddMaterial.onclick = () => {
    const v = materialInput.value.trim();
    if (v) {
        currentMaterials.push(v);
        materialInput.value = '';
        renderMaterialsList();
    }
};

function renderMaterialsList() {
    materialsList.innerHTML = '';
    currentMaterials.forEach((m, i) => {
        const span = document.createElement('span');
        span.className = 'material-chip';
        span.textContent = m + ' ';
        const del = document.createElement('button');
        del.textContent = '×';
        del.onclick = () => { currentMaterials.splice(i, 1); renderMaterialsList(); };
        span.appendChild(del);
        materialsList.appendChild(span);
    });
}

// Image Preview
let currentImageDataUrl = null;
imageInput.onchange = () => {
    const f = imageInput.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        currentImageDataUrl = e.target.result;
        imagePreviewContainer.innerHTML = `<img src="${currentImageDataUrl}">`;
    };
    reader.readAsDataURL(f);
};

// Create Project
projectForm.onsubmit = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Log in first');

    const project = {
        title: document.getElementById('project-title').value,
        description: document.getElementById('project-description').value,
        image: currentImageDataUrl,
        materials: currentMaterials,
        author: user.email
    };

    const { error } = await supabase.from('projects').insert([project]);
    if (error) alert(error.message);
    else {
        submitPanel.classList.add('hidden');
        renderProjectsGrid();
    }
};

// Modal Logic
async function openProjectModal(id) {
    const { data: p } = await supabase.from('projects').select('*').eq('id', id).single();
    const { data: comments } = await supabase.from('comments').select('*').eq('project_id', id);

    modalBody.innerHTML = `
    <h2>${escapeHtml(p.title)}</h2>
    <div class="meta">By ${escapeHtml(p.author)}</div>
    ${p.image ? `<img src="${p.image}" style="max-width:100%; border-radius:8px; margin:10px 0;">` : ''}
    <p>${escapeHtml(p.description)}</p>
    <h4>Materials</h4>
    <div>${p.materials.map(m => `<span class="material-chip">${m}</span>`).join('')}</div>
    <hr>
    <h4>Comments</h4>
    <div id="comments-list">${comments.map(c => `<div class="comment"><b>${c.author}:</b> ${c.content}</div>`).join('')}</div>
    <textarea id="new-comment" placeholder="Add a comment..." rows="2"></textarea>
    <button onclick="addComment('${p.id}')" class="primary">Post</button>
  `;
    projectModal.classList.remove('hidden');
}

async function addComment(projectId) {
    const content = document.getElementById('new-comment').value;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Log in to comment');

    await supabase.from('comments').insert([{ project_id: projectId, author: user.email, content }]);
    openProjectModal(projectId);
}

// Auth Handlers
btnLogin.onclick = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: loginUsername.value,
        password: loginPassword.value
    });
    if (error) loginMsg.textContent = error.message;
    else { authModal.classList.add('hidden'); renderUI(data.user); }
};

btnSignup.onclick = async () => {
    const { data, error } = await supabase.auth.signUp({
        email: signupUsername.value,
        password: signupPassword.value
    });
    if (error) signupMsg.textContent = error.message;
    else { alert('Check your email for confirmation!'); authModal.classList.add('hidden'); }
};

btnLogout.onclick = async () => {
    await supabase.auth.signOut();
    renderUI(null);
};

// Utils
function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

function clearProjectForm() {
    projectForm.reset();
    currentMaterials = [];
    currentImageDataUrl = null;
    imagePreviewContainer.innerHTML = '';
    renderMaterialsList();
}

btnToggleSubmit.onclick = () => submitPanel.classList.toggle('hidden');
modalClose.onclick = () => projectModal.classList.add('hidden');
btnSwitchToSignup.onclick = () => { loginFormSection.classList.add('hidden'); signupFormSection.classList.remove('hidden'); };
btnSwitchToLogin.onclick = () => { signupFormSection.classList.add('hidden'); loginFormSection.classList.remove('hidden'); };
btnShowLogin.onclick = () => { authModal.classList.remove('hidden'); loginFormSection.classList.remove('hidden'); signupFormSection.classList.add('hidden'); };
btnShowSignup.onclick = () => { authModal.classList.remove('hidden'); signupFormSection.classList.remove('hidden'); loginFormSection.classList.add('hidden'); };
authClose.onclick = () => authModal.classList.add('hidden');

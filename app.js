// --- CONFIGURATION ---
// Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://nnrmgjtiyueakkxxixjr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0HsiyOX6cDuA9eP-4QJFeg_IZGGy-rn';
const supabase = lib.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- DOM ELEMENTS ---
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

// --- INITIALIZATION ---
async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  renderUI(session?.user);

  // Auto-refresh UI when login state changes
  supabase.auth.onAuthStateChange((_event, session) => {
    renderUI(session?.user);
  });
}
init();

// --- CORE UI RENDERING ---
async function renderUI(user) {
  if (user) {
    welcomeText.textContent = `Logged in as ${user.email}`;
    btnShowLogin.classList.add('hidden');
    btnShowSignup.classList.add('hidden');
    btnLogout.classList.remove('hidden');
    btnToggleSubmit.classList.remove('hidden');
  } else {
    welcomeText.textContent = `Not signed in`;
    btnShowLogin.classList.remove('hidden');
    btnShowSignup.classList.remove('hidden');
    btnLogout.classList.add('hidden');
    btnToggleSubmit.classList.add('hidden');
  }
  renderProjectsGrid();
}

// --- PROJECT DISPLAY ---
async function renderProjectsGrid() {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return;

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
        <p>${escapeHtml(p.description.slice(0, 100))}...</p>
        <div class="card-footer">
          <div class="meta">By ${escapeHtml(p.author)}</div>
          <button onclick="openProjectModal('${p.id}')" class="primary">Open</button>
        </div>
      </div>
    `;
    projectsGrid.appendChild(card);
  });
}

// --- PROJECT SUBMISSION LOGIC ---
let currentMaterials = [];
let currentImageDataUrl = null;

btnAddMaterial.onclick = () => {
  const val = materialInput.value.trim();
  if (val) {
    currentMaterials.push(val);
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

imageInput.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    currentImageDataUrl = event.target.result;
    imagePreviewContainer.innerHTML = `<img src="${currentImageDataUrl}" style="max-width:100%;border-radius:6px;margin-top:8px">`;
  };
  reader.readAsDataURL(file);
};

projectForm.onsubmit = async (e) => {
  e.preventDefault();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return alert("Please log in to submit a project.");

  const newProject = {
    title: document.getElementById('project-title').value.trim(),
    description: document.getElementById('project-description').value.trim(),
    image: currentImageDataUrl,
    materials: currentMaterials,
    author: user.email
  };

  const { error } = await supabase.from('projects').insert([newProject]);

  if (error) {
    alert("Error saving project: " + error.message);
  } else {
    submitPanel.classList.add('hidden');
    projectForm.reset();
    currentMaterials = [];
    currentImageDataUrl = null;
    imagePreviewContainer.innerHTML = '';
    renderMaterialsList();
    renderProjectsGrid();
  }
};

// --- MODAL & COMMENTS ---
async function openProjectModal(id) {
  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single();
  const { data: comments } = await supabase.from('comments').select('*').eq('project_id', id).order('created_at', { ascending: true });

  modalBody.innerHTML = `
    <h2>${escapeHtml(project.title)}</h2>
    <div class="meta">By ${escapeHtml(project.author)}</div>
    ${project.image ? `<img src="${project.image}" style="max-width:100%;margin:15px 0;border-radius:8px">` : ''}
    <p>${escapeHtml(project.description)}</p>
    <h4>Materials</h4>
    <div>${project.materials.map(m => `<span class="material-chip">${escapeHtml(m)}</span>`).join('')}</div>
    <hr style="margin:20px 0;border:0;border-top:1px solid #eee">
    <h4>Comments</h4>
    <div id="modal-comments-list" style="margin-bottom:15px">
      ${comments.length ? comments.map(c => `<div style="margin-bottom:8px;font-size:0.9rem"><strong>${escapeHtml(c.author)}:</strong> ${escapeHtml(c.content)}</div>`).join('') : '<p class="small">No comments yet.</p>'}
    </div>
    <textarea id="new-comment-text" placeholder="Add a comment..." rows="2"></textarea>
    <button onclick="postComment('${project.id}')" class="primary">Post Comment</button>
  `;
  projectModal.classList.remove('hidden');
}

async function postComment(projectId) {
  const content = document.getElementById('new-comment-text').value.trim();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return alert("Log in to comment.");
  if (!content) return;

  const { error } = await supabase.from('comments').insert([{
    project_id: projectId,
    author: user.email,
    content: content
  }]);

  if (error) alert(error.message);
  else openProjectModal(projectId); // Refresh modal
}

// --- AUTHENTICATION ---
btnLogin.onclick = async () => {
  const email = loginUsername.value.trim();
  const password = loginPassword.value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) loginMsg.textContent = error.message;
  else authModal.classList.add('hidden');
};

btnSignup.onclick = async () => {
  const email = signupUsername.value.trim();
  const password = signupPassword.value;
  if (password !== signupPasswordConfirm.value) {
    signupMsg.textContent = "Passwords do not match";
    return;
  }
  const { error } = await supabase.auth.signUp({ email, password });
  
  if (error) signupMsg.textContent = error.message;
  else signupMsg.textContent = "Check your email for a confirmation link!";
};

btnLogout.onclick = async () => {
  await supabase.auth.signOut();
};

// --- UI HELPERS ---
function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// Toggles (Same as original)
btnToggleSubmit.onclick = () => submitPanel.classList.toggle('hidden');
btnCancelSubmit.onclick = () => submitPanel.classList.add('hidden');
modalClose.onclick = () => projectModal.classList.add('hidden');
btnShowLogin.onclick = () => { authModal.classList.remove('hidden'); loginFormSection.classList.remove('hidden'); signupFormSection.classList.add('hidden'); };
btnShowSignup.onclick = () => { authModal.classList.remove('hidden'); signupFormSection.classList.remove('hidden'); loginFormSection.classList.add('hidden'); };
authClose.onclick = () => authModal.classList.add('hidden');
btnSwitchToSignup.onclick = () => { loginFormSection.classList.add('hidden'); signupFormSection.classList.remove('hidden'); };
btnSwitchToLogin.onclick = () => { signupFormSection.classList.add('hidden'); loginFormSection.classList.remove('hidden'); };

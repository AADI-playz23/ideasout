// --- CONFIGURATION ---
// Credentials from your screenshot
const SUPABASE_URL = 'https://nnrmgjtiyueakkxxixjr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0Hsiy0X6cDuA9eP-4QJFeg_IZGGy-rn';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- DOM ELEMENTS (Matching your index.html) ---
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
const projectModal = document.getElementById('project-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const authModal = document.getElementById('auth-modal');
const authClose = document.getElementById('auth-close');
const btnLogin = document.getElementById('btn-login');
const btnSignup = document.getElementById('btn-signup');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const signupUsername = document.getElementById('signup-username');
const signupPassword = document.getElementById('signup-password');
const signupPasswordConfirm = document.getElementById('signup-password-confirm');
const loginMsg = document.getElementById('login-msg');
const signupMsg = document.getElementById('signup-msg');
const loginFormSection = document.getElementById('login-form');
const signupFormSection = document.getElementById('signup-form');
const btnSwitchToSignup = document.getElementById('btn-switch-to-signup');
const btnSwitchToLogin = document.getElementById('btn-switch-to-login');

// --- INITIALIZATION ---
async function init() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  updateUIState(session?.user);

  // AUTH LISTENER: This ensures the modal closes whenever a user signs in
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      authModal.classList.add('hidden'); // Hides the login box immediately
      authModal.setAttribute('aria-hidden', 'true');
    }
    updateUIState(session?.user);
  });
}
init();

// --- UI STATE MANAGEMENT ---
function updateUIState(user) {
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
  renderProjects();
}

// --- AUTH ACTIONS ---
btnLogin.addEventListener('click', async () => {
  loginMsg.textContent = '';
  const email = loginUsername.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    loginMsg.textContent = 'Please enter email and password';
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) loginMsg.textContent = error.message;
  // Note: The modal closure is now handled by the listener in init()
});

btnSignup.addEventListener('click', async () => {
  signupMsg.textContent = '';
  const email = signupUsername.value.trim();
  const password = signupPassword.value;
  const confirm = signupPasswordConfirm.value;

  if (password !== confirm) {
    signupMsg.textContent = 'Passwords do not match';
    return;
  }

  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) signupMsg.textContent = error.message;
  else signupMsg.textContent = 'Check your email for a confirmation link!';
});

btnLogout.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
});

// --- PROJECT DISPLAY ---
async function renderProjects() {
  const { data: projects, error } = await supabaseClient
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return;

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
        <p>${escapeHtml(p.description.slice(0,150))}</p>
        <div class="card-footer">
          <div class="meta">By ${escapeHtml(p.author)}</div>
          <button onclick="openProjectDetails('${p.id}')" class="primary">Open</button>
        </div>
      </div>
    `;
    projectsGrid.appendChild(card);
  });
}

// --- UTILS & TOGGLES (Keeping your original UI behavior) ---
function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

btnShowLogin.onclick = () => {
  loginFormSection.classList.remove('hidden');
  signupFormSection.classList.add('hidden');
  authModal.classList.remove('hidden');
};

btnShowSignup.onclick = () => {
  signupFormSection.classList.remove('hidden');
  loginFormSection.classList.add('hidden');
  authModal.classList.remove('hidden');
};

authClose.onclick = () => authModal.classList.add('hidden');

btnSwitchToSignup.onclick = () => {
  loginFormSection.classList.add('hidden');
  signupFormSection.classList.remove('hidden');
};

btnSwitchToLogin.onclick = () => {
  signupFormSection.classList.add('hidden');
  loginFormSection.classList.remove('hidden');
};

// ... Include your existing Material and Image Preview logic here ...

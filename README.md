# Science Models & Projects Showcase (client-side)

This is a simple single-page application meant for local use (or to be hosted on GitHub Pages). All data is stored in the browser's localStorage.

Features
- Sign up / Login with username & password (passwords hashed with SHA-256)
- Default admin: username `admin`, password `admin` (created automatically)
- Submit projects with title, image (stored as data URL), description, and a materials list
- Project cards grid with modal details view
- Commenting on projects (only for logged-in users)
- Deleting projects and comments allowed for the resource owner or the admin
- All data persists in localStorage under keys:
  - Users: `sm_users_v1`
  - Projects: `sm_projects_v1`
  - Current session: `sm_current_user_v1`

How to use
1. Open `index.html` in a modern browser.
2. Create an account or login using the default admin `admin / admin`.
3. Click "Submit Project" to add a new project (image preview supported).
4. Click any project "Open" to see details and post comments.

Hosting on GitHub Pages
- Create a new repo, add these files, push to `main` (or `gh-pages`) and enable GitHub Pages from the repository settings.
- Since storage is client-side, each browser/user will have separate data.

Limitations & Notes
- This is purely client-side: do not use for sensitive production data.
- Passwords are hashed but stored client-side — this is not a secure authentication system.
- Images are stored as data URLs in localStorage (may run into size limits for many/large images).

If you'd like, I can:
- Add optional Markdown support for project descriptions.
- Add export/import (JSON) for backup and transfer between browsers.
- Add pagination / search / filtering for projects.
- Add a lightweight server-backed version so data is shared between users.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Firebase hosting with Cloudflare DNS

This project is configured for Firebase Hosting via `firebase.json`.

### Deploy to Firebase

1. Install Firebase CLI if needed:
   ```bash
   npm install -g firebase-tools
   ```
2. Login to Firebase:
   ```bash
   firebase login
   ```
3. Select your Firebase project:
   ```bash
   firebase use --add
   ```
4. Build and deploy:
   ```bash
   npm run deploy
   ```

### Use Cloudflare for `anistream.zayriontech.com`

1. In Cloudflare DNS, add a CNAME record:
   - Name: `anistream`
   - Target: your Firebase Hosting domain (for example `project-id.web.app` or `project-id.firebaseapp.com`)
   - Proxy status: DNS only (abu-abu)
   - TTL: Auto
2. In Firebase Hosting, add the custom domain `anistream.zayriontech.com` and verify it.
3. If Firebase asks for DNS verification, add the required TXT record at the root `zayriontech.com`.
4. Wait a few minutes for DNS propagation, then visit `https://anistream.zayriontech.com`.

### Notes

- Your app is already set to serve SPA routes because `firebase.json` rewrites all requests to `/index.html`.
- Keep `dist` ignored in Git; the build output is generated locally before deploying.

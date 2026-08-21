# Modern Frontend Tooling: React + Vite + Tailwind CSS

## 1. Tailwind CSS v4 vs v3
Tailwind CSS v4 is a significant rewrite that introduces a CSS-first configuration and a new Rust-powered engine.

### Speed and Performance
- **Oxide Engine:** Replaces the standard PostCSS plugin with a new Rust-powered engine (built on Lightning CSS), resulting in up to 5-10x faster build times and near-instant incremental rebuilds.

### Architecture Changes
- **CSS-First Configuration:** The mandatory `tailwind.config.js` is removed. You now define your design tokens (colors, fonts, spacing, etc.) directly in your CSS file using the `@theme` directive.
- **Auto-Content Detection:** You no longer need to manually configure content paths; Tailwind automatically detects your template files.
- **Native CSS Variables:** Theme tokens are now standard CSS variables, making them easily accessible throughout your styles and in third-party libraries.
- **Zero-Config Setup:** Simply use `@import "tailwindcss";` without complex PostCSS or Autoprefixer configuration.

## 2. Setting up Vite + React + Tailwind v4
Setting up a modern React project with Vite and Tailwind CSS v4 is extremely streamlined. Below are the recommended steps using `pnpm`.

### Step 1: Initialize the Vite Project
```bash
# Using pnpm
pnpm create vite@latest frontend --template react-ts
```

### Step 2: Install Tailwind CSS
Install the core package and its dedicated Vite plugin:
```bash
cd frontend
pnpm add -D tailwindcss @tailwindcss/vite
```

### Step 3: Configure Vite
Open your `vite.config.ts` and add the Tailwind plugin:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

### Step 4: Import Tailwind CSS
Open your main CSS file (e.g., `src/index.css`) and replace its contents with:
```css
@import "tailwindcss";
```

### Step 5: Start the Development Server
```bash
pnpm run dev
```

## 3. Summary
Tailwind CSS v4 simplifies the development workflow by removing boilerplate configuration, moving to a CSS-first approach, and significantly improving performance with its Rust-based engine. When combined with Vite, the setup requires only installing the `@tailwindcss/vite` plugin and importing Tailwind into your CSS.

**Sources:**
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)

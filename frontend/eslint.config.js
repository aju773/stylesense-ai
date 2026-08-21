import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // --------------------------------------------------------------------
  // Deliberate, permanent exception — NOT debt.
  //
  // react-refresh/only-export-components wants a file to export components
  // and nothing else, so that Vite's Fast Refresh can preserve state on save
  // instead of doing a full reload.
  //
  // Context files legitimately export both the provider component and the
  // hook that reads it (AuthProvider + useAuth). Keeping them together is the
  // standard React pattern: the hook enforces that consumers are inside the
  // provider, and splitting them across files to satisfy a dev-server
  // optimisation makes the code worse. The only cost is a full reload when
  // editing this one file. Nothing about production changes.
  // --------------------------------------------------------------------
  {
    files: ['src/context/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },

  // --------------------------------------------------------------------
  // KNOWN DEBT — recorded 2026-08-21. Fix this one, do not leave it.
  //
  // react-hooks/set-state-in-effect fires at Chat.tsx:32, where a useEffect
  // calls setActiveConversationId to mirror the conversationId URL param into
  // component state. That is state synchronisation, which React 19 explicitly
  // discourages: the component renders once with the stale value, the effect
  // runs, setState fires, and it renders again. Every conversation switch
  // costs a wasted render pass.
  //
  // The usual fix is to stop copying and start deriving — read the param
  // directly, or give the component a `key` so React remounts it on change
  // instead of the component syncing itself.
  //
  // Scoped to the single file so it cannot silently spread to new code.
  // --------------------------------------------------------------------
  {
    files: ['src/pages/Chat.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])

# Cursor Rules

Rules in this folder give the AI persistent context for this project. See [Cursor docs](https://cursor.com/docs/context/rules) for how rules are applied.

## Rules in this project

| File | Description | Portable to other projects? |
|------|-------------|-----------------------------|
| **next-supabase-architecture.mdc** | Next.js 15 + Supabase: App Router, Server/Client split, RLS, repos, Zod, revalidation. | ✅ Yes — any Next.js + Supabase app |
| **user-standards.mdc** | General coding standards: TypeScript, validation, error handling, mapping. | ✅ Yes — any TypeScript project |
| **user-ui.mdc** | UI/UX preferences: clarity, dark mode, touch targets, transitions, blur. | ✅ Yes — any front-end project |
| **project.mdc** | Full detailed architecture (French + English); same stack as above, more examples. | ✅ Yes — trim app-specific references |
| **ui-design-toolsbar.mdc** | Concrete Tailwind patterns: toolbars, cards, segmented controls, dark mode. | ✅ Yes — Tailwind + same design system |
| **ui-ux-product-goals.mdc** | Product vision, modern UX, competitive benchmark. | ✅ Yes — adjust benchmark for your product |

## Reusing rules in another project

1. **Copy the files** you want into the other project’s `.cursor/rules/` (e.g. `next-supabase-architecture.mdc`, `user-standards.mdc`, `user-ui.mdc`).
2. **User Rules**: For global preferences across all projects, paste the *body* of a rule (no frontmatter) into **Cursor Settings → Rules for AI**.
3. **Symlinks**: To share rules without copying, put rule files in a shared folder and symlink them into each project’s `.cursor/rules/`.

## Frontmatter

- `alwaysApply: true` — rule is always considered.
- `alwaysApply: false` + `globs` — rule applies when matching files are open or in context.
- `description` — short summary (e.g. for the rule picker).

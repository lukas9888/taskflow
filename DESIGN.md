# TaskFlow Productivity Manager — Design system

Design tokens are sourced from the **Stitch** project **TaskFlow Productivity Manager** (`projectId: 4800714208051096306`), style-guide screen. This document maps them to **Angular Material** (Material 3) usage in the app.

## Brand

- **Product**: TaskFlow — task management focused on clarity and low cognitive load.
- **Aesthetic**: Light surfaces, indigo primary, neutral secondary text, Material Symbols for icons where applicable.
- **Font**: **Inter** (Google Fonts). Weights used in scale: 400, 500, 600, 700.

## Color palette

Semantic names follow Material-style roles (light theme). Hex values are the Stitch tokens.

| Token | Hex | Usage |
|--------|-----|--------|
| `primary` | `#3525CD` | Primary actions, key accents, selected nav |
| `on-primary` | `#FFFFFF` | Text/icons on primary |
| `primary-container` | `#4F46E5` | Strong filled surfaces (e.g. emphasis) |
| `on-primary-container` | `#DAD7FF` | Text on primary-container (Stitch) |
| `primary-fixed` | `#E2DFFF` | Fixed primary surface tone |
| `primary-fixed-dim` | `#C3C0FF` | Dimmed primary fixed |
| `on-primary-fixed` | `#0F0069` | Text on primary-fixed |
| `inverse-primary` | `#C3C0FF` | Inverse primary highlight |
| `secondary` | `#515F74` | Secondary text, subdued UI |
| `on-secondary` | `#FFFFFF` | On secondary |
| `secondary-container` | `#D5E3FD` | Secondary container |
| `on-secondary-container` | `#57657B` | Text on secondary-container |
| `tertiary` | `#7E3000` | Tertiary / warm accent |
| `on-tertiary` | `#FFFFFF` | On tertiary |
| `tertiary-container` | `#A44100` | Tertiary container |
| `on-tertiary-container` | `#FFD2BE` | Text on tertiary-container |
| `error` | `#BA1A1A` | Error states |
| `on-error` | `#FFFFFF` | On error |
| `error-container` | `#FFDAD6` | Error container (Stitch: `#FFDAD6` / similar) |
| `on-error-container` | `#93000A` | Text on error container |
| `background` | `#F7F9FB` | App background |
| `on-background` | `#191C1E` | Text on background |
| `surface` | `#F7F9FB` | Cards, sheets |
| `on-surface` | `#191C1E` | Primary text |
| `surface-variant` | `#E0E3E5` | Subtle surfaces |
| `on-surface-variant` | `#464555` | Secondary text on surface |
| `outline` | `#777587` | Borders, dividers |
| `outline-variant` | `#C7C4D8` | Light borders |
| `inverse-surface` | `#2D3133` | Snackbar / inverse surfaces |
| `inverse-on-surface` | `#EFF1F3` | Text on inverse surface |
| `surface-dim` | `#D8DADC` | Dimmed surface |
| `surface-bright` | `#F7F9FB` | Bright surface |
| `surface-container-lowest` | `#FFFFFF` | Lowest elevation container |
| `surface-container-low` | `#F2F4F6` | Low container |
| `surface-container` | `#ECEEF0` | Default container |
| `surface-container-high` | `#E6E8EA` | High container |
| `surface-container-highest` | `#E0E3E5` | Highest container |
| `surface-tint` | `#4D44E3` | Surface tint |

**Implementation note**: Angular Material M3 theme in code uses the **primary** seed `#3525CD` and theme generation; some secondary/tertiary tones are approximated via Material palettes where exact Stitch hex is not expressible as a single M3 seed. App chrome should still align visually with the table above.

## Typography scale (Inter)

| Role | Size | Line height | Weight | Letter spacing |
|------|------|-------------|--------|----------------|
| Display large | 48px | 56px | 700 | -0.02em |
| Headline medium | 30px | 36px | 600 | -0.01em |
| Title large | 20px | 28px | 600 | 0 |
| Body large | 16px | 24px | 400 | 0 |
| Body medium | 14px | 20px | 400 | 0 |
| Label small | 12px | 16px | 500 | 0.05em |

Use **Body medium** for dense forms; **Title large** for card titles; **Headline medium** for page titles inside content areas.

## Spacing & shape (Stitch reference)

- **Spacing**: `xs` 4px, `base` 8px, `sm` 12px, `md` 24px, `margin` 32px, `lg` 48px, `xl` 64px, `gutter` 24px.
- **Radius**: default 0.125rem (2px), `lg` 0.25rem, `xl` 0.5rem, full 0.75rem — prefer Material component defaults; use `mat-card` / `mat-form-field` for consistency.

## Angular Material — component guidelines

- **Layout**: `mat-toolbar` for app header; `mat-card` for grouped content (auth, task form, list sections).
- **Forms**: `mat-form-field` + `matInput`; validation messages in `mat-error`.
- **Actions**: `mat-flat-button` / `mat-stroked-button` for primary/secondary actions; `mat-icon-button` for compact actions (edit/delete).
- **Lists**: `mat-list` / `mat-list-item` for task rows; dividers optional.
- **Feedback**: Inline `mat-error` for field errors; `MatSnackBar` acceptable for transient server errors (optional).

## Do / don’t

- **Do** use Material components for interactive controls (buttons, fields, lists).
- **Do** keep copy short; use `on-surface` / `secondary` roles for hierarchy.
- **Don’t** mix ad-hoc pixel borders that fight Material elevation and focus rings.
- **Don’t** use tertiary/error colors for non-semantic decoration.

## External assets

- **Inter**: `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`
- **Material Symbols** (optional): Google Fonts Material Symbols Outlined.
- **Angular Material**: [Angular Material](https://material.angular.dev/)

---
name: Editorial Luxury
colors:
  surface: '#fdf8f8'
  surface-dim: '#ddd9d8'
  surface-bright: '#fdf8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3f2'
  surface-container: '#f1edec'
  surface-container-high: '#ebe7e6'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#444748'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#745a27'
  on-secondary: '#ffffff'
  secondary-container: '#fedb9b'
  on-secondary-container: '#795f2b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1b1a'
  on-tertiary-container: '#868382'
  error: '#D64045'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffdea4'
  secondary-fixed-dim: '#e4c285'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5a4312'
  tertiary-fixed: '#e6e2df'
  tertiary-fixed-dim: '#cac6c4'
  on-tertiary-fixed: '#1c1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#fdf8f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
  text-dark: '#333333'
  text-muted: '#777777'
  text-light: '#AAAAAA'
  border: '#E5E5E5'
  bg-white: '#FFFFFF'
  bg-cream: '#F9F7F4'
  bg-light: '#F5F5F5'
  success: '#2D8A4E'
  ai-accent: '#6366F1'
typography:
  h1:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h1-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h2:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h3:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h4:
    fontFamily: Playfair Display
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  body-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.1em
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px
  max-container: 1280px
---

# Design System: Editorial Luxury

## Color Palette
- **Primary Black**: `#1A1A1A` (Headings, CTAs)
- **Text Dark**: `#333333` (Body text)
- **Text Muted**: `#777777` (Secondary text, labels)
- **Text Light**: `#AAAAAA` (Placeholders, disabled)
- **Border**: `#E5E5E5` (Dividers, card borders)
- **Background White**: `#FFFFFF` (Primary background)
- **Background Cream**: `#F9F7F4` (Section backgrounds, hover states)
- **Background Light**: `#F5F5F5` (Input backgrounds, cards)
- **Accent Warm**: `#C9A96E` (Subtle gold for premium touches)
- **Success**: `#2D8A4E` (Status indicators)
- **Error**: `#D64045` (Validation/Errors)
- **AI Accent**: `#6366F1` (AI-specific elements)

## Typography
- **Heading Font**: "Playfair Display", serif
- **Body Font**: "Inter", sans-serif
- **Scale**:
  - H1: 48px / -0.02em
  - H2: 36px / -0.02em
  - H3: 24px / -0.02em
  - H4: 18px / -0.02em
  - Body Large: 18px
  - Body Base: 16px
  - Body Small: 14px
  - Body XS: 12px
- **Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Labels**: Uppercase with 0.1em letter spacing

## Spacing & Layout
- **Grid**: 4px base (4, 8, 12, 16, 24, 32, 48, 64, 96, 128)
- **Container**: 1280px max-width, centered
- **Section Padding**: 96px vertical (Desktop)

## Components
- **Buttons/Inputs**: 0px border radius (sharp corners)
- **Cards**: 8px border radius
- **Avatars**: 50% border radius
- **Borders**: 1px width (2px for focus)

## Shadows
- **Card**: 0 1px 3px rgba(0,0,0,0.06)
- **Hover**: 0 4px 12px rgba(0,0,0,0.08)
- **Modal**: 0 16px 48px rgba(0,0,0,0.12)
- **Navbar**: Bottom border #E5E5E5

## Transitions
- **Default**: 200ms ease
- **Hover**: 150ms ease-in-out
- **Page**: 300ms ease

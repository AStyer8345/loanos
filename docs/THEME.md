# LoanOS UI Theme — Single Source of Truth

Use this doc to describe how the app should look. When you want changes, **edit this file** or say "per THEME.md" and we'll align code to it. No screenshots required.

---

## Records — September 2026 user-directed exception

Loan Records and Contact Records, including the individual pages opened by clicking a record, follow the cream and green Lead Desk design requested by Adam. Styles are scoped to these records and Jungo history; other screens retain their existing theme. Use readable serif headings, normal-case labels, restrained green accents, simple views, and visible notes and referral names. Detail pages use normal page scrolling, prominent notes and related records, with longer loan field groups under Full loan details. Retain existing field editors and communication actions.

## Global

| What | Value |
|------|--------|
| **Page background** | `#050505` (matte black) |
| **Body text** | Off-white / grey — `#e5e5e5` (zinc-200) |
| **Headings** | Command Center style: **bold, uppercase, monospace**, e.g. `font-mono font-bold uppercase tracking-wider` |
| **Borders** | Hard 1px, no soft shadows. Use `border border-zinc-700` or `border-zinc-800`. |
| **Accent (cards, CTAs)** | Gold/amber `#D4AF37` — e.g. `border-l-[3px] border-l-amber-500`, `text-amber-400` |
| **Status / success** | System green `#4ADE80` — e.g. "All clear", "Systems Nominal", checkmarks |

---

## CSS Variables (globals.css)

```css
--bg:       #050505;
--surface:  #0a0a0a;
--surface2: #171717;
--border:   #262626;
--text:     #e5e5e5;
--muted:    #737373;
--fg:       #e5e5e5;
--gold:     #D4AF37;
--green:    #4ADE80;
--red:      #DC2626;
```

---

## Components

### Stat / KPI cards
- Background: dark (`bg-zinc-900/80` or `var(--surface)`).
- **Left edge**: gold bar — `border-l-[3px] border-l-amber-500`, `rounded-r-lg` (no rounded left).
- No white background, no `shadow-sm` / `shadow-md`.
- Label: `text-zinc-400 font-mono text-xs uppercase tracking-wider`.
- Value: `text-zinc-100` or `text-amber-400` for numbers.

### Nav / sidebar
- Dark bar; inactive text low-opacity grey (`text-zinc-400`).
- **Active state**: gold highlight — `bg-amber-500/20 text-amber-200 border border-amber-500/50`.
- Dropdowns: dark panel `bg-zinc-900 border border-zinc-700`, hover `text-amber-200`.

### Buttons
- Primary (e.g. Save, Confirm): `bg-amber-500 text-zinc-900 hover:bg-amber-400`.
- Secondary: `border border-zinc-600 text-zinc-400 hover:bg-zinc-800`.

### Status bar (e.g. "Systems Nominal")
- Dark background, 1px border.
- Text: **bright green monospace** `#4ADE80`, e.g. `text-[#4ADE80] font-mono`.

### Workflow / pipeline stepper
- Dark circular step icons; first step has **gold glow** — e.g. `border-amber-500 shadow-[0_0_8px_rgba(212,175,55,0.4)]`.
- Connector lines: `bg-zinc-700` or similar; animated dot gold.

### Tables
- Header row: `bg-zinc-800/80 border-b border-zinc-700`, `text-zinc-400 font-mono uppercase tracking-wider`.
- Rows: `border-b border-zinc-700`; hover `bg-zinc-800/50`.
- No `bg-white`, no `bg-slate-50`.

### Inputs
- Background: `bg-zinc-800`; border: `border-zinc-600`; focus: `focus:border-amber-500`.
- Text: `text-zinc-200`; placeholder: `placeholder-zinc-500`.

---

## Don’t use

- `bg-white`, `bg-slate-50`, `bg-slate-100`
- `text-slate-900`, `text-slate-700`, `text-slate-500` (use zinc equivalents)
- `shadow-sm`, `shadow-md` (use borders instead)
- `border-slate-200`, `border-slate-300`
- Emerald for primary accent (use amber/gold); reserve green for status/success only.

---

## How to request changes

**Option A — Edit this file**  
Change THEME.md (e.g. "Stat cards use border-l-4" or add a new component). Say: "Apply THEME.md" or "Make X match THEME.md."

**Option B — Short spec in chat**  
- **Where**: page or component name (e.g. "Contacts table", "Daily briefing header").
- **What**: color | layout | copy | component.
- **Detail**: e.g. "Header: zinc-100, font-mono uppercase" or "Cards: dark bg, left gold bar, no shadow."

Example: *"Briefing page: stat cards — dark bg, left gold bar, label uppercase monospace."*

**Option C — Reference a state**  
e.g. "Match the automations page card style" or "Same as THEME.md stat cards."

Screenshots are optional. Prefer THEME.md + one of the options above for speed.

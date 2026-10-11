# JobHunt Hub — Design Guide

Companion to `JOBHUNT_SPEC.md`. That file says what to build; this one says how it should look and behave. Use both as the brief for the UI.

---

## 1. Design direction

A calm work tool. It should feel like a well-organised inbox for jobs, not a job portal full of banners.

- **Calm.** Job hunting is stressful. No urgency tricks, no countdowns, no red badges unless something needs action.
- **Scannable.** A user should judge a job in two seconds from its card: title, company and its type, where, work mode, how old.
- **One highlight.** The "Career page only" tag is the app's main advantage. It is the only element on a job card that uses a second colour.
- **Phone first.** Design each screen for a 360px-wide phone, then widen it. Many users will open it on mobile data, so pages must stay light.
- **The user decides.** Every send and every apply is a clear button with a preview. Nothing happens silently.

## 2. Layout

### Breakpoints

| Name | Width | Layout |
|---|---|---|
| Mobile | below 768px | Single column, bottom tab bar, filters in a slide-up sheet |
| Tablet | 768px to 1023px | Collapsed icon sidebar, single column list, detail opens as a full page |
| Desktop | 1024px and up | Sidebar (240px) + two-pane jobs view |

Content width is capped at 1280px and centred on very wide screens.

### Navigation

- Desktop: left sidebar with Jobs, Companies, Applications, Settings. User menu at the bottom of the sidebar.
- Mobile: bottom tab bar with the same four items. Labels always visible under the icons.
- The current section is marked with the accent colour and a filled background, not colour alone.

### Jobs page, desktop

```
+----------+------------------------------------------------------------+
| JobHunt  |  [ Search role or keyword                 ]   [Saved v]    |
|          |  (Remote)(Hybrid)(On-site) [Pune +1 v] [Type v] [More]     |
| > Jobs   +------------------------------+-----------------------------+
|   Compan.|  128 jobs · sorted by newest |  Senior React Developer     |
|   Applic.|  +-------------------------+ |  Acme Tech · Pune · Hybrid  |
|   Setting|  | Senior React Developer  | |  Posted 2 days ago          |
|          |  | Acme Tech · SaaS        | |  [Career page only]         |
|          |  | Pune · Hybrid · 2d      | |                             |
|          |  | [Career page only]      | |  [ Apply ]  [ Save ]        |
|          |  +-------------------------+ |                             |
|          |  | Frontend Engineer       | |  About the role             |
|          |  | Bright Labs · Product   | |  ...                        |
|          |  | Remote (India) · 5h     | |                             |
|          |  | in  nk                  | |  Company                    |
|          |  +-------------------------+ |  ...                        |
| (user)   |  ...                         |                             |
+----------+------------------------------+-----------------------------+
```

- List pane is 420px; detail pane takes the rest.
- Selecting a job updates the detail pane and the URL (`/jobs/[id]`), so links can be shared and the back button works.
- The filter bar stays fixed at the top while the list scrolls. Its order: work mode chips, location, company type, then More.

### Jobs page, mobile

```
+--------------------------------+
| [ Search role or keyword     ] |
| (Remote) (Hybrid) (On-site)    |
| [Filters 2]                    |
+--------------------------------+
| Senior React Developer         |
| Acme Tech · SaaS               |
| Pune · Hybrid · 2d             |
| [Career page only]             |
+--------------------------------+
| Frontend Engineer              |
| Bright Labs · Product          |
| Remote (India) · 5h      in nk |
+--------------------------------+
|  Jobs  Companies  Applied  Me  |
+--------------------------------+
```

- Work mode chips scroll sideways if they do not fit.
- "Filters" opens a bottom sheet; the number shows how many filters are active.
- Tapping a card opens the job as a full page with a sticky Apply button at the bottom.

## 3. Colour

One neutral family, one accent, one highlight. Defined as CSS variables so shadcn/ui components pick them up, with a dark theme that follows the system setting and can be switched in Settings.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--background` | `#FAFAF9` | `#0C0A09` | Page background |
| `--surface` | `#FFFFFF` | `#1C1917` | Cards, panels, sheets |
| `--border` | `#E7E5E4` | `#292524` | Dividers, card outlines |
| `--text` | `#1C1917` | `#F5F5F4` | Main text |
| `--text-muted` | `#57534E` | `#A8A29E` | Secondary text, metadata |
| `--accent` | `#0F766E` | `#2DD4BF` | Primary buttons, links, active nav |
| `--on-accent` | `#FFFFFF` | `#042F2E` | Text on accent buttons |
| `--accent-soft` | `#CCFBF1` | `#134E4A` | Selected chip background |
| `--accent-soft-text` | `#115E59` | `#99F6E4` | Selected chip text |
| `--highlight-bg` | `#FEF3C7` | `#451A03` | "Career page only" tag |
| `--highlight-text` | `#92400E` | `#FCD34D` | "Career page only" tag text |
| `--danger` | `#B91C1C` | `#FCA5A5` | Errors, destructive actions |

Application status colours (used only in the tracker and on status badges):

| Status | Light bg / text | Dark bg / text |
|---|---|---|
| Saved | `#E7E5E4` / `#44403C` | `#292524` / `#D6D3D1` |
| Applied | `#DBEAFE` / `#1D4ED8` | `#1E3A8A` / `#93C5FD` |
| Interview | `#EDE9FE` / `#6D28D9` | `#4C1D95` / `#C4B5FD` |
| Offer | `#DCFCE7` / `#166534` | `#14532D` / `#86EFAC` |
| Rejected | `#FEE2E2` / `#B91C1C` | `#7F1D1D` / `#FCA5A5` |

Rules:
- Every text and background pair above meets WCAG AA contrast (4.5:1) in both themes.
- Never use colour as the only signal: status badges always carry the status word, the active nav item also gets a filled background.
- Source badges (LinkedIn, Naukri, Glassdoor, Career page) are neutral grey with a short label, not brand colours or logos.

## 4. Typography

- Font: Geist Sans through `next/font`, with the system sans-serif stack as fallback. Geist Mono for IDs and code only.
- Numbers in tables and counts use tabular figures so columns line up.

| Style | Size / line height | Weight | Used for |
|---|---|---|---|
| Page title | 24 / 32 | 600 | One per page |
| Section title | 18 / 28 | 600 | Panel and section headings |
| Card title | 16 / 24 | 600 | Job title on a card |
| Body | 15 / 24 | 400 | Descriptions, forms |
| Small | 13 / 20 | 400 | Metadata, badges, helper text |

- Minimum text size is 13px. Body text on mobile stays at 15px; inputs use 16px so phones do not zoom on focus.
- Job descriptions are capped at about 70 characters per line for readability.
- Sentence case everywhere: "Career page only", "Save search", not title case or capitals.

## 5. Spacing and shape

- Spacing scale in multiples of 4px: 4, 8, 12, 16, 24, 32, 48.
- Card padding: 16px on mobile, 20px on desktop. Gap between cards: 8px in lists, 16px in grids.
- Corner radius: 8px for cards and inputs, 6px for buttons, fully rounded for chips and badges.
- Borders, not shadows, separate surfaces. A soft shadow is used only for things that float: sheets, dialogs, dropdowns.
- Tap targets are at least 44px high on mobile.

## 6. Core components

### Job card

```
+------------------------------------------------+
| Senior React Developer                 [Save]   |
| Acme Tech · SaaS                               |
| Pune · Hybrid · 2 days ago                     |
| [Career page only]              [in] [nk]      |
+------------------------------------------------+
```

- Order: title, company with its type (for example "Acme Tech · SaaS"), then one metadata line (location, work mode, age).
- Company type is plain muted text beside the company name, never a coloured badge, so the highlight tag stays the only second colour on the card. It is left out when the company is not classified.
- Bottom row: highlight tag on the left if it applies, source badges on the right.
- Already applied: the card shows an "Applied" status badge in place of the Save button and the title is slightly muted.
- States: default, hover (border darkens), selected (accent left edge + soft background), focused (2px accent outline).
- The whole card is one link; Save is a separate button with its own label for screen readers.

### Work mode chips

- Three toggle chips: Remote, Hybrid, On-site. Any combination can be on.
- Selected: accent-soft background, accent-soft text, a check icon. Unselected: outline only.
- None selected means "all work modes".

### Location picker

- A searchable multi-select combobox. Shows chosen cities as removable chips inside the field.
- First options in the list: the user's saved cities, then "Anywhere in India", then search results.
- Typing "Bangalore" finds "Bengaluru"; the list shows the normalised name.
- A small "Within 25 km" control appears only when exactly one city is chosen.

### Company type filter

- A dropdown labelled "Company type" with checkbox items: SaaS, Product, Services, Manufacturing, Other.
- Each item has a short line under it so the meaning is clear, for example "Services: builds or runs things for clients".
- When active, the button shows the count: "Company type · 2". A last item, "Hide not classified", is off by default.
- On mobile it sits inside the Filters sheet as a group of toggle chips, under work mode and location.

### Buttons

| Type | Look | Used for |
|---|---|---|
| Primary | Accent fill | The one main action on a screen: Apply, Send, Save search |
| Secondary | Outline | Save, Edit, Regenerate |
| Quiet | Text only | Cancel, Skip, low-priority actions |
| Destructive | Danger outline, fill on confirm | Delete resume, delete my data |

One primary button per view.

### Badges and tags

- Highlight tag: "Career page only", amber pair from the colour table, with a small building icon.
- Status badge: status colours, always with the word.
- Source badge: neutral, two-letter or short label with a tooltip giving the full name.
- "Not specified" work mode shows as muted text, not a badge.

## 7. Screens

### Landing and sign-in
- One headline, one sentence, sign-in buttons for Google and LinkedIn, and a single product screenshot. No carousel.
- Below: three short points (find jobs in one place, spot career-page-only roles, track and prepare).

### Onboarding
- Four steps with a progress bar: 1. Resume, 2. What you want (roles, work modes, cities, company types), 3. Job alert forwarding, 4. Gmail for sending.
- Steps 3 and 4 can be skipped and finished later from Settings; the app is usable after step 2.
- The forwarding step shows the private address with a Copy button, short instructions with pictures for Gmail, and a live "Waiting for your first alert email" status that turns into a tick.

### Job detail
- Header: title, company (link to company page) with its type, location, work mode, age, tags.
- Actions directly under the header: Apply (primary), Save, Not interested.
- Sections: About the role, Requirements, Company, Where this job was seen (sources with links).
- If the job is no longer on the company site: a muted notice "This role may be closed".

### Apply panel
- Opens as a right-side panel on desktop and a full-height sheet on mobile, so the list stays in place behind it.
- Apply link: shows which resume will be used with a Download button, copy-ready answers from the saved profile (name, phone, notice period), then "Open application page".
- Email: To, Subject, editable message, attached resume shown as a file chip, and "Send from your Gmail". A line under the button states the address it will be sent from.
- After sending: a confirmation with "View in tracker" and an Undo-style "Mark as not applied" for mis-clicks.

### Companies
- A table on desktop, cards on mobile: company, type, open roles, career-page-only roles, last checked. The table can be filtered by type.
- "Add company" accepts a name or website and shows progress while the careers page is being found.
- Company page: two columns, "On the career page" and "On job platforms", so the difference is visible at a glance. Stacked tabs on mobile.
- Companies that could not be read show "Check manually" with a link, not an error.
- The company page header shows the type with its one-line reason and a "Change" link. Changing it opens a small menu of the five types; the choice applies to the user's own view straight away, with a toast saying it was sent for review.
- An unclassified company shows "Not classified" in muted text with a "Set type" link.

### Applications tracker
- Desktop: a board with five columns (Saved, Applied, Interview, Offer, Rejected). Cards can be dragged, and each card also has a "Move to" menu so dragging is never required.
- Mobile: one list grouped by status with collapsible groups and counts; status changes through the "Move to" menu.
- Card: role, company, days since applied, next action (for example "Follow up today").
- Rejected is collapsed by default.

### Interview prep
- Reads like a document, not a dashboard: one column, max 720px wide.
- Order: interview date and checklist at the top, then role summary, skills gap, questions, company notes, round notes.
- Each question is a collapsible row with space for the user's own answer. "Regenerate" sits at the section level with a short prompt field.
- Generated text is marked "Draft, edit freely" until the user changes it.

### Settings
- Sections: Profile, Resumes, Preferences, Connections, Notifications, Data.
- Connections shows each one with a plain status: Connected, Not set up, Needs attention.
- "Delete my data" is at the bottom, behind a confirmation that asks the user to type DELETE.

## 8. States

Every list and panel needs all four:

| State | Treatment |
|---|---|
| Loading | Skeleton rows in the shape of the content. No full-page spinners. |
| Empty | One sentence on why it is empty and one button for the next step. Example: "No jobs match these filters. Clear filters" |
| Error | What went wrong in plain words, and a Retry button. Never a raw error code alone. |
| Partial | Show what loaded; mark the part that failed. Example: a company whose check failed still shows its last known roles with "Last checked 3 days ago". |

Feedback:
- Toasts for quick confirmations (saved, moved, copied), bottom-centre on mobile and bottom-right on desktop, gone after 4 seconds.
- Anything the user must read or act on is shown inline, not in a toast.
- Long tasks (checking a careers page) show progress in place and do not block the rest of the page.

## 9. Writing in the interface

- Plain words: "Find jobs", "Send resume", "Career page only". No jargon such as ATS in the interface.
- Buttons say what happens: "Send from Gmail", not "Submit".
- Dates are relative up to 7 days ("2 days ago"), then a date ("28 Sep").
- Salary shown in the listing's own format; lakhs per annum written as "12 to 18 LPA".
- Errors name the fix: "Could not reach this careers page. Check the web address or try again later."

## 10. Accessibility

- Full keyboard use: Tab order follows the visual order; in the jobs list, Up and Down move between jobs and Enter opens one.
- Visible focus ring (2px accent outline with 2px offset) on every interactive element.
- Semantic landmarks: `nav`, `main`, headings in order, one `h1` per page.
- Form fields have visible labels; placeholders are examples, not labels.
- Drag and drop always has a non-drag alternative.
- Respects `prefers-reduced-motion`: transitions become instant.
- Layout holds at 200% browser zoom without horizontal scrolling.

## 11. Motion

- Short and functional: 150ms for hover and press, 200ms for panels and sheets.
- Panels slide from the edge they are attached to; nothing bounces or loops.
- No animation on page load.

## 12. Building it with shadcn/ui

| Need | Component |
|---|---|
| Buttons, inputs, forms | Button, Input, Textarea, Label, Form, Checkbox, Select |
| Work mode chips | Toggle Group |
| Location picker | Popover + Command (combobox) |
| Company type filter | Dropdown Menu with checkbox items |
| Filters sheet, apply panel | Sheet (bottom on mobile, right on desktop) |
| Confirmations | Alert Dialog |
| Tags and status | Badge |
| Job and tracker cards | Card |
| Onboarding progress | Progress |
| Loading | Skeleton |
| Toasts | Sonner |
| Menus | Dropdown Menu |
| Company view on mobile | Tabs |
| Prep questions | Accordion |
| Hints on badges | Tooltip |

Also needed:
- Icons: `lucide-react`, 16px in text and 20px in navigation, always with a text label or an accessible name.
- Tracker drag and drop: `@dnd-kit/core`.
- Theme switching: `next-themes`.

Theme variables go in `app/globals.css` under `:root` and `.dark`, using the tokens from section 3, and are mapped to Tailwind colours so classes like `bg-surface` and `text-muted` work.

## 13. Design done when

- [ ] Every screen in section 7 works at 360px, 768px and 1280px wide.
- [ ] Light and dark themes both pass the contrast rule in section 3.
- [ ] A job card can be judged without opening it: title, company and its type, location, work mode, age.
- [ ] "Career page only" is the only second colour on the jobs list.
- [ ] Each list has loading, empty and error states.
- [ ] The whole apply flow can be completed with the keyboard alone.

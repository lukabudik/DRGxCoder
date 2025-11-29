# DRGxCoder Frontend - Production Polish TODO

## 🎯 Phase 1: Core Table & Search (Priority: HIGH)

### Table Enhancements
- [ ] Add secondary codes column with "+N codes" badge
- [ ] Add status icon column (✓ ⏳ ❌ 🔄)
- [ ] Add confidence color coding (green >90%, yellow 70-90%, red <70%)
- [ ] Improve main diagnosis display (code + name on separate lines)
- [ ] Add actions menu (•••) with quick actions dropdown
- [ ] Make table rows more polished with better spacing
- [ ] Add hover effects with subtle elevation
- [ ] Add sortable columns with click handlers
- [ ] Add loading skeleton for table

### Search & Filters
- [ ] Add search bar above table
- [ ] Implement search by patient ID
- [ ] Implement search by code (main or secondary)
- [ ] Implement search by diagnosis name
- [ ] Add status filter dropdown (All/Pending/Approved/Rejected)
- [ ] Add date range filter
- [ ] Add confidence filter
- [ ] Add "Clear filters" button
- [ ] Show active filter count badge
- [ ] Persist filters in URL query params

## 🎨 Phase 2: Sidebar Redesign (Priority: HIGH)

### Layout & Structure
- [ ] Add case context card at top
- [ ] Add collapsible clinical text section
- [ ] Restructure main diagnosis card
- [ ] Improve secondary diagnoses list layout
- [ ] Add code selection process section (collapsible)
- [ ] Add metadata footer
- [ ] Add feedback/validation history section
- [ ] Improve spacing and visual hierarchy

### Styling
- [ ] Apply consistent color system
- [ ] Add better typography hierarchy
- [ ] Add section icons (📋 📄 🎯 🔖 etc.)
- [ ] Add dividers between sections
- [ ] Improve badge styling
- [ ] Add confidence progress bars
- [ ] Better button styling and states

## 🔧 Phase 3: Actions & Editing (Priority: MEDIUM)

### Approve/Reject Workflow
- [ ] Wire up approve button to API
- [ ] Wire up reject button to API
- [ ] Add rejection modal with comment field
- [ ] Add success toast notifications
- [ ] Add error handling
- [ ] Update table row after approval/rejection
- [ ] Add validation status history

### Code Editing (Future)
- [ ] Add "Edit" button on main diagnosis
- [ ] Create code picker modal
- [ ] Add autocomplete search in code picker
- [ ] Add ability to remove secondary codes
- [ ] Add ability to add new secondary codes
- [ ] Add ability to reorder secondary codes (drag-drop)
- [ ] Save edited predictions

### Bulk Actions (Future)
- [ ] Add checkbox column for multi-select
- [ ] Add bulk select header checkbox
- [ ] Add bulk action bar when items selected
- [ ] Implement bulk approve
- [ ] Implement bulk reject
- [ ] Implement bulk export

## 🔗 Phase 4: Navigation & Pages (Priority: MEDIUM)

### Routing
- [ ] Add URL-based sidebar opening (?prediction=id)
- [ ] Add shareable prediction links
- [ ] Preserve filters in URL
- [ ] Add breadcrumbs navigation

### New Pages (Future)
- [ ] Patient detail page (/patients/:id)
- [ ] Case detail page (/cases/:id)
- [ ] Code browser page (/codes)
- [ ] Code detail page (/codes/:code)
- [ ] Analytics dashboard (/analytics)
- [ ] Settings page (/settings)

## 📊 Phase 5: Analytics & Dashboard (Priority: LOW)

- [ ] Create analytics page layout
- [ ] Add KPI cards (total, avg confidence, approval rate, etc.)
- [ ] Add predictions over time chart
- [ ] Add most common codes list
- [ ] Add top performing models
- [ ] Add filter by date range
- [ ] Add export analytics report

## ⚡ Phase 6: UX Enhancements (Priority: MEDIUM)

### Keyboard Shortcuts
- [ ] Add keyboard shortcut handler
- [ ] Implement Cmd/Ctrl+K for search
- [ ] Implement N for new prediction
- [ ] Implement Esc for close sidebar
- [ ] Implement ↑/↓ for navigation
- [ ] Implement Enter for open row
- [ ] Add keyboard shortcuts help modal (?)

### Micro-interactions
- [ ] Add row hover animations
- [ ] Add button press animations
- [ ] Add loading skeleton screens
- [ ] Add success animations
- [ ] Add error shake animations
- [ ] Add smooth transitions

### Empty States
- [ ] Design empty state for no predictions
- [ ] Design empty state for no search results
- [ ] Design loading state improvements

### Notifications (Future)
- [ ] Add toast notification system
- [ ] Add notification center
- [ ] Add real-time updates (WebSocket)

## 🎨 Phase 7: Design System (Priority: MEDIUM)

### Colors
- [ ] Define and document color system
- [ ] Update CSS variables for all colors
- [ ] Apply status colors consistently
- [ ] Apply confidence colors consistently

### Typography
- [ ] Audit and standardize font sizes
- [ ] Audit and standardize font weights
- [ ] Ensure consistent line heights
- [ ] Add proper heading hierarchy

### Components
- [ ] Create reusable badge variants
- [ ] Create reusable button variants
- [ ] Create reusable card component
- [ ] Create reusable dropdown menu
- [ ] Create reusable modal component
- [ ] Create reusable toast component

### Spacing
- [ ] Enforce 8px grid system
- [ ] Standardize padding/margins
- [ ] Standardize card padding
- [ ] Standardize section gaps

## 📱 Phase 8: Responsive Design (Priority: LOW)

- [ ] Make table responsive (stack on mobile)
- [ ] Convert sidebar to bottom sheet on mobile
- [ ] Add hamburger menu for mobile
- [ ] Ensure touch targets are 44px minimum
- [ ] Test on tablet sizes
- [ ] Test on mobile sizes

## 🚀 Phase 9: Performance & Polish (Priority: MEDIUM)

### Performance
- [ ] Add pagination to table (infinite scroll or pages)
- [ ] Optimize re-renders with React.memo
- [ ] Add debounce to search input
- [ ] Lazy load sidebar content
- [ ] Add request caching strategies

### Accessibility
- [ ] Add proper ARIA labels
- [ ] Ensure keyboard navigation works
- [ ] Test with screen reader
- [ ] Add focus indicators
- [ ] Ensure color contrast ratios

### Error Handling
- [ ] Add error boundaries
- [ ] Add retry logic for failed requests
- [ ] Add offline detection
- [ ] Add better error messages
- [ ] Add error reporting

## ✅ Completed
- [x] Basic table with predictions
- [x] Sidebar opens on row click
- [x] API integration
- [x] React Query setup
- [x] Basic styling with CSS modules
- [x] Backend connection working

---

## 📋 Current Sprint (Next 3-4 hours)

### Sprint 1: Table Polish & Search
1. ✅ Enhanced table columns (status, secondary codes, colors)
2. ✅ Search bar with filters
3. ✅ Sortable columns
4. ✅ Better styling and spacing

### Sprint 2: Sidebar Redesign
1. Case context card
2. Restructured layout with sections
3. Better visual hierarchy
4. Collapsible sections

### Sprint 3: Actions
1. Wire up approve/reject
2. Toast notifications
3. Error handling
4. Update table after actions

---

**Legend:**
- 🎯 High Priority - Core functionality
- ⚡ Medium Priority - Important UX improvements
- 📊 Low Priority - Nice to have features

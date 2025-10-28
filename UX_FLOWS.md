# Streetwise Coach App - UX Flows Documentation

## Overview

This document outlines the detailed user experience flows for the Streetwise Coach application, covering all primary user journeys, interaction patterns, error states, and edge cases. The flows are designed to support efficient coaching sessions while maintaining data integrity and providing intuitive navigation.

## Primary User Flows

### 1. Dashboard Flow

**Entry Points:**
- Direct navigation to `http://localhost:3000` or `http://localhost:3000/dashboard`
- Click "Dashboard" from sidebar navigation
- Click "SAKAI" logo to return to dashboard

**Flow Steps:**

1. **Landing Page Load**
   - System loads dashboard with Sakai template layout
   - Sidebar displays navigation menu with collapsible sections
   - Main content area shows "Quick Actions" section

2. **Quick Actions Display**
   - Three action cards displayed in responsive grid:
     - **Curriculum Card**: "Browse lessons & slices like a dynamic textbook"
     - **Coach Mode Card**: "Run a session and log observations fast"
     - **Students Card**: "Roster, attendance, quick notes" (future feature)

3. **Navigation Options**
   - Click any action card to navigate to respective feature
   - Use sidebar navigation for direct access to all features
   - Access UI Components, Prime Blocks, Utilities, and Pages sections

**UI Components Used:**
- PrimeReact Grid system (`col-12`, `md:col-6`, `lg:col-4`)
- PrimeReact Button components with icons
- PrimeReact Card components with shadows and borders
- Sakai template sidebar with collapsible menu groups

**Edge Cases:**
- **First-time user**: Clear onboarding with prominent action cards
- **Empty state**: Graceful handling if no curriculum data available
- **Browser compatibility**: Fallback for unsupported localStorage

**Error States:**
- **Network unavailable**: Offline mode with cached curriculum data
- **localStorage quota exceeded**: Warning message with cleanup options
- **Invalid curriculum data**: Error boundary with recovery suggestions

### 2. Curriculum Browser Flow

**Entry Points:**
- Click "Curriculum" from dashboard Quick Actions
- Click "Curriculum" from sidebar navigation (`/curriculum`)
- Direct navigation to `/curriculum`

**Flow Steps:**

1. **Page Load**
   - System loads curriculum page with Sakai layout
   - Page title displays "Gracie Combatives 2.0"
   - Curriculum browser component renders lesson grid

2. **Lesson Grid Display**
   - All lessons displayed in responsive grid layout
   - Each lesson card shows:
     - Lesson number and technique name
     - Position (if available)
     - Slice count indicator
     - Overview text (truncated)

3. **Lesson Card Interaction**
   - Click lesson card to expand detailed view
   - Slice accordion displays all slices and bonus slices
   - Each slice shows:
     - Slice number and title
     - Indicator (recognition cues)
     - Essential detail (key points)
     - Most common mistake
     - Bad guy reminder (safety notes)
     - Step-by-step instructions

4. **Slice Accordion Navigation**
   - Expand/collapse individual slices
   - View detailed step instructions
   - Access core principles references
   - Navigate between slices within lesson

**UI Components Used:**
- `CurriculumBrowser` component with responsive grid
- `LessonCard` component with expandable content
- `SliceAccordion` component for detailed slice view
- PrimeReact Accordion for slice expansion
- PrimeReact Card components for lesson display

**Edge Cases:**
- **Empty curriculum**: Message indicating no lessons available
- **Missing slice details**: Graceful handling of incomplete data
- **Bonus slices**: Clear visual distinction from regular slices
- **Long content**: Proper text truncation and scrolling

**Error States:**
- **Curriculum load failure**: Error message with retry option
- **Invalid lesson data**: Skip problematic lessons with warning
- **Missing slice data**: Display available information with placeholder

### 3. Coach Session Flow

**Entry Points:**
- Click "Coach Mode" from dashboard Quick Actions
- Click "Coach" from sidebar navigation (`/coach`)
- Direct navigation to `/coach`

**Flow Steps:**

1. **Session Initialization**
   - System automatically creates new coaching session
   - Session assigned unique UUID identifier
   - Timestamp recorded for session start
   - Session type defaults to 'private'

2. **Lesson Selection**
   - Dropdown displays all available lessons
   - Format: "L{number} — {technique name}"
   - Default selection: First lesson in curriculum
   - Lesson details display below dropdown

3. **Session Interface Setup**
   - Selected lesson technique name displayed prominently
   - Lesson overview shown (if available)
   - All slices and bonus slices listed for assessment
   - "End Session" button available (currently disabled)

4. **Slice Assessment Process**
   - For each slice, assessment card displays:
     - Slice number and title
     - Confidence level selector (1-3 scale)
     - Optional notes text area
     - Next action recommendation dropdown
   - Coach selects confidence level for each slice
   - Optional notes can be added for context
   - Next action guides future instruction planning

5. **Observation Recording**
   - Each assessment creates observation record
   - Observation appended to session events array
   - Data persisted to localStorage immediately
   - UI provides visual feedback for recorded assessments

6. **Session Management**
   - Real-time session data updates
   - All observations maintained in chronological order
   - Session duration tracked automatically
   - Coach notes can be added at session level

**UI Components Used:**
- `CoachSessionView` component for main interface
- `SliceAssessmentCard` component for individual assessments
- PrimeReact Dropdown for lesson selection
- PrimeReact Button for confidence selection
- PrimeReact InputTextarea for notes
- PrimeReact SelectButton for next actions

**Edge Cases:**
- **No lesson selected**: Display message "Pick a lesson to begin"
- **Rapid-fire assessments**: Handle quick successive assessments
- **Session recovery**: Restore session state after browser refresh
- **Empty slices**: Handle lessons with no slice data

**Error States:**
- **localStorage failure**: Warning message with data loss prevention
- **Invalid lesson data**: Skip to next valid lesson
- **Assessment validation**: Prevent invalid confidence values
- **Session corruption**: Recovery mechanism with data validation

### 4. History Review Flow

**Entry Points:**
- Click "History" from sidebar navigation (`/history`)
- Direct navigation to `/history`

**Flow Steps:**

1. **History Page Load**
   - System loads session history page
   - `SessionList` component renders all past sessions
   - Sessions displayed in chronological order (newest first)

2. **Session List Display**
   - Each session shows:
     - Session date and time
     - Session type (private/group)
     - Duration (if available)
     - Number of observations recorded
     - Coach notes preview (if available)

3. **Session Detail View**
   - Click session to view detailed observations
   - All observations displayed in chronological order
   - Each observation shows:
     - Type (step-assessed, slice-assessed, timer)
     - Target (slice/step ID)
     - Confidence level
     - Notes and next action
     - Timestamp

4. **Session Analysis**
   - Review assessment patterns
   - Identify areas needing attention
   - Track progress over time
   - Export session data (future feature)

**UI Components Used:**
- `SessionList` component for history display
- PrimeReact DataTable for session listing
- PrimeReact Card components for session details
- PrimeReact Timeline for observation chronology
- PrimeReact Button for actions

**Edge Cases:**
- **No sessions yet**: Empty state message with coaching encouragement
- **Corrupted session data**: Skip problematic sessions with warning
- **Large session history**: Pagination or virtual scrolling
- **Missing session details**: Graceful handling of incomplete data

**Error States:**
- **History load failure**: Error message with retry option
- **Corrupted session data**: Data validation and recovery
- **Storage quota exceeded**: Cleanup suggestions and warnings

## Error States and Recovery

### Network and Connectivity Issues

**Offline Mode:**
- Application continues to function with cached curriculum data
- New sessions can be created and stored locally
- Warning message indicates offline status
- Data syncs when connection restored

**API Failures (Future):**
- Graceful degradation to localStorage mode
- Retry mechanisms for failed requests
- User notification of sync issues
- Manual sync options when available

### Data Integrity Issues

**localStorage Quota Exceeded:**
- Warning message with storage usage details
- Cleanup suggestions for old sessions
- Export options for important data
- Compression strategies for large datasets

**Corrupted Session Data:**
- Data validation on load
- Recovery mechanisms for partial data
- User notification of data issues
- Backup and restore options

**Invalid Curriculum Data:**
- Skip problematic lessons with warnings
- Fallback to basic lesson structure
- Error reporting for curriculum issues
- Manual curriculum validation tools

### Browser Compatibility Issues

**localStorage Not Supported:**
- Graceful degradation to session-only mode
- Warning message about data persistence
- Alternative storage suggestions
- Browser upgrade recommendations

**JavaScript Disabled:**
- Static curriculum display only
- No session functionality available
- Clear message about requirements
- Alternative access methods

## Interaction Patterns

### Navigation Patterns

**Sidebar Navigation:**
- Collapsible menu sections
- Active route highlighting
- Breadcrumb navigation for deep pages
- Quick access to all major features

**Breadcrumb Navigation:**
- Clear path indication
- Clickable navigation history
- Context-aware breadcrumbs
- Mobile-responsive design

**Card-based Navigation:**
- Dashboard quick actions
- Lesson card interactions
- Session card displays
- Consistent visual hierarchy

### Form Interaction Patterns

**Assessment Forms:**
- Single-page assessment interface
- Real-time validation feedback
- Auto-save functionality
- Clear success/error states

**Dropdown Selections:**
- Searchable lesson dropdowns
- Clear option labeling
- Default value handling
- Keyboard navigation support

**Text Input Patterns:**
- Optional notes fields
- Character count indicators
- Auto-resize textareas
- Placeholder text guidance

### Feedback Patterns

**Success Feedback:**
- Visual confirmation of saved assessments
- Toast notifications for actions
- Progress indicators for long operations
- Clear completion states

**Error Feedback:**
- Inline validation messages
- Error boundaries for crashes
- Retry mechanisms for failures
- Clear error resolution steps

**Loading States:**
- Skeleton screens for content loading
- Progress indicators for operations
- Disabled states during processing
- Optimistic UI updates

## Accessibility Considerations

### Keyboard Navigation
- Full keyboard accessibility for all interactions
- Tab order follows logical flow
- Escape key closes modals and dropdowns
- Enter key activates buttons and links

### Screen Reader Support
- Semantic HTML structure
- ARIA labels for complex components
- Alt text for images and icons
- Descriptive link text

### Visual Accessibility
- High contrast color schemes
- Scalable text and components
- Clear focus indicators
- Consistent visual hierarchy

### Motor Accessibility
- Large click targets for touch interfaces
- Drag-and-drop alternatives
- Voice control compatibility
- Reduced motion options

## Mobile Responsiveness

### Breakpoint Strategy
- Mobile-first design approach
- Responsive grid system (PrimeFlex)
- Collapsible sidebar on mobile
- Touch-friendly interface elements

### Mobile-specific Patterns
- Swipe gestures for navigation
- Touch-optimized form controls
- Mobile-specific error handling
- Offline-first functionality

### Performance Considerations
- Lazy loading for large datasets
- Optimized images and assets
- Minimal JavaScript bundles
- Efficient state management

## Future UX Enhancements

### Real-time Collaboration
- Live session sharing
- Multi-coach observations
- Real-time progress updates
- Collaborative planning tools

### Advanced Analytics
- Progress visualization
- Skill development trends
- Performance insights
- Predictive recommendations

### Mobile App Integration
- Native mobile app
- Offline synchronization
- Push notifications
- Camera integration for video notes

### Accessibility Improvements
- Voice command integration
- Advanced screen reader support
- Customizable interface themes
- Assistive technology optimization

This comprehensive UX flow documentation ensures consistent user experience across all features while providing clear guidance for future development and enhancement.

============================================================
FRONTEND IMPLEMENTATION — MANDATORY
============================================================

IMPORTANT:

The frontend is a first-class part of this implementation.

Do NOT consider the task complete when only backend APIs are implemented.

Every backend feature implemented in this task must have the corresponding
frontend UI integrated with the real API.

Do NOT create fake/static/mock data for functionality that already has a
backend implementation.

Use the existing frontend framework, architecture, design system, routing,
API client, state management, and reusable components.

Before creating new frontend infrastructure, inspect the existing project.

============================================================
1. FRONTEND ARCHITECTURE
============================================================

First inspect:

- frontend framework
- routing
- API client
- authentication state
- authorization/RBAC
- state management
- form library
- validation
- UI component library
- table components
- modal components
- toast/notification system
- loading components
- error handling
- theme/design system

Reuse existing infrastructure.

DO NOT introduce another:

- router
- HTTP client
- state management library
- form library
- UI library
- notification library

unless the project genuinely has no equivalent and it is necessary.

============================================================
2. APPLICATION LAYOUT
============================================================

Implement a consistent ERP application layout.

The layout should include:

- Sidebar
- Top navigation/header
- User profile/menu
- Notifications
- Breadcrumbs where useful
- Main content area

Sidebar navigation must be role-aware.

Example:

PROCUREMENT OFFICER

Dashboard
Vendors
RFQs
Quotations
Purchase Orders
Invoices
Reports
Activity


VENDOR

Dashboard
My RFQs
My Quotations
Purchase Orders
Invoices
Notifications


MANAGER

Dashboard
Approvals
Purchase Orders
Invoices
Reports
Activity


ADMIN

Dashboard
Users
Vendors
Procurement
Reports
Activity

Do not expose navigation items that the current user is not authorized to access.

Frontend hiding is NOT a security mechanism.

Backend authorization remains mandatory.

============================================================
3. DASHBOARD UI
============================================================

Implement the Dashboard required by the PS.

The dashboard must contain:

- Pending approvals
- Active RFQs
- Recent purchase orders
- Recent invoices
- Analytics cards
- Quick action buttons

Use real backend data.

Do NOT hardcode statistics.

------------------------------------------------------------
Analytics cards
------------------------------------------------------------

Create reusable cards such as:

Active RFQs
Pending Quotations
Pending Approvals
Purchase Orders
Invoices
Total Procurement Value

Cards should support:

- loading state
- error state
- empty/zero state

============================================================
4. VENDOR MANAGEMENT UI
============================================================

Route:

/vendors

Create a professional vendor management table.

Columns:

- Vendor
- Category
- GST
- Contact
- Status
- Created
- Actions

Features:

- Search
- Status filter
- Category filter
- Pagination
- Sorting
- Add Vendor
- Edit Vendor
- View Vendor
- Change Status

Create vendor form with:

- Business name
- Contact person
- Email
- Phone
- GST
- Address
- Category
- Status

Use frontend validation.

Validation must match backend Zod/schema rules.

Do not duplicate business rules unnecessarily.

============================================================
5. VENDOR DETAIL PAGE
============================================================

Route:

/vendors/:id

Display:

Vendor Information
Contact Information
GST Information
Status

Then show procurement history:

RFQs
Quotations
Purchase Orders
Invoices

Use tabs where appropriate.

Do not expose information that the current role is not authorized to view.

============================================================
6. VENDOR QUOTATION UI
============================================================

Vendor route:

/my-quotations

and/or:

/rfqs/:rfqId/quote

The quotation screen must support the PS requirements:

- Pricing details
- Delivery timeline
- Notes/comments
- Editable quotation
- Submission

The UI should display the RFQ requirements clearly.

For every RFQ item show:

- Product/service
- Description
- Requested quantity
- Unit
- Required delivery date if available

Then allow vendor to enter:

- Unit price
- Tax
- Delivery timeline
- Notes

Automatically calculate visible:

- Item subtotal
- Tax
- Total

BUT:

Frontend totals are informational only.

Backend must recalculate financial values.

============================================================
7. QUOTATION DRAFT
============================================================

Vendor should be able to:

Save Draft
Edit Draft
Submit Quotation

Draft state should be visually obvious.

Example:

DRAFT
SUBMITTED
UNDER REVIEW
SHORTLISTED
REJECTED
ACCEPTED
EXPIRED

Disable actions according to the quotation state.

Examples:

Submitted quotation:
→ Edit disabled unless backend allows editing.

Expired quotation:
→ Submit disabled.

Rejected quotation:
→ Editing disabled.

Do not rely only on disabled buttons.

Backend must enforce the same rules.

============================================================
8. QUOTATION COMPARISON UI
============================================================

Route:

/rfqs/:rfqId/compare

This is one of the most important procurement screens.

The PS requires:

- Side-by-side comparison
- Lowest price highlighting
- Delivery comparison
- Vendor rating indicators
- Sorting
- Filtering

Implement a comparison table.

Example:

                 Vendor A    Vendor B    Vendor C

Item 1 Price     ₹100        ₹110        ₹95
Item 2 Price     ₹200        ₹180        ₹210
Subtotal         ₹300        ₹290        ₹305
Tax              ₹54         ₹52         ₹55
Total            ₹354        ₹342        ₹360

Delivery         7 days      10 days     5 days
Rating           ...         ...         ...

Use visual highlighting for lowest values.

Do NOT automatically select the vendor.

The UI should provide procurement information for the authorized user
to make the selection.

============================================================
9. QUOTATION COMPARISON RESPONSIVENESS
============================================================

Comparison tables can become very wide.

Implement responsive behavior.

For desktop:

Use a wide comparison table.

For smaller screens:

Allow:

- horizontal scrolling
- sticky first column
- sticky header where appropriate

Do not destroy the comparison usability on smaller screens.

============================================================
10. APPROVAL UI
============================================================

Routes:

/approvals
/approvals/:id

Show:

- RFQ
- Vendor
- Quotation
- Total amount
- Requested by
- Date
- Status

Approval page must provide:

Approve
Reject

Reject must require remarks.

Display approval timeline:

Requested
    ↓
Under Review
    ↓
Approved / Rejected

Show:

- approver
- timestamp
- remarks

Only authorized managers/approvers should see approval actions.

============================================================
11. PURCHASE ORDER UI
============================================================

Routes:

/purchase-orders
/purchase-orders/:id

List columns:

- PO Number
- Vendor
- RFQ
- Amount
- Date
- Status
- Actions

Detail page:

PO Header
Vendor
RFQ
Quotation
PO Items
Pricing
Tax
Total
Delivery Information
Status
Activity Timeline

Actions:

- View
- Generate Invoice
- Print
- Download PDF where supported

Do not allow unauthorized PO modifications.

============================================================
12. INVOICE UI
============================================================

Routes:

/invoices
/invoices/:id

Invoice list:

- Invoice Number
- PO Number
- Vendor
- Amount
- Date
- Due Date
- Status
- Actions

Invoice detail must look like an actual ERP invoice.

Include:

Company information
Invoice number
Invoice date
Vendor information
GST information
PO number
Item table
Quantity
Unit price
Tax
Subtotal
Total

Actions:

Download PDF
Print
Send Email

Email action must call the real backend email functionality.

Do not fake email sending with a frontend toast.

============================================================
13. INVOICE PRINTING
============================================================

Implement a clean printable invoice.

When Print is clicked:

- Hide application navigation
- Hide buttons
- Hide unnecessary UI
- Show invoice document
- Trigger browser print

The printed result should be suitable for an actual business document.

============================================================
14. ACTIVITY TIMELINE UI
============================================================

Create a reusable activity timeline component.

Display events such as:

RFQ Created
Vendor Invited
Quotation Submitted
Quotation Shortlisted
Approval Requested
Approval Approved
PO Created
Invoice Generated
Invoice Sent

Each event should show:

- Icon/status indicator
- Description
- Actor
- Timestamp

Use the actual Activity Log API.

Do not hardcode events.

============================================================
15. NOTIFICATION UI
============================================================

Implement a notification center.

The top navigation should contain a notification icon.

Display:

- unread count
- notification list
- read/unread state
- timestamp
- notification type

Examples:

New RFQ received
Quotation submitted
Approval requested
Approval approved
Invoice generated
Invoice sent

Clicking a notification should navigate to the relevant entity where appropriate.

============================================================
16. REPORTS & ANALYTICS UI
============================================================

Route:

/reports

Implement the PS requirements:

- Vendor performance analytics
- Procurement statistics
- Spending summaries
- Monthly procurement trends
- Exportable reports

Use charts where they improve understanding.

Possible charts:

Monthly Procurement Value
RFQs by Status
PO Value by Vendor
Monthly Invoice Value
Vendor Response Rate

Do NOT invent data.

Charts must use API data.

Provide filters:

- Date range
- Vendor
- Category
- Status

Provide export buttons:

Export CSV
Export Excel
Export PDF

Only expose formats supported by the backend.

============================================================
17. ROLE-BASED FRONTEND
============================================================

The frontend must react to the authenticated user's role.

Do not merely hide buttons.

Implement:

- route protection
- navigation protection
- action visibility
- page-level authorization handling

If a user manually enters an unauthorized URL:

Example:

/admin/users

the frontend must show an appropriate unauthorized page.

BUT:

Frontend authorization is only UX.

The backend must still enforce authorization.

============================================================
18. FORM UX
============================================================

All forms should provide:

- labels
- validation
- helpful error messages
- required indicators
- loading state
- disabled submit during request
- success feedback
- API error feedback

Prevent duplicate submissions.

Example:

When submitting quotation:

Submit
→ loading
→ disable button
→ API request
→ success/error

Do not allow repeated clicks to create duplicate records.

============================================================
19. API INTEGRATION
============================================================

All implemented frontend functionality must use the real backend APIs.

Create/use typed API functions if the project architecture supports them.

Avoid:

- hardcoded data
- fake delays
- mock responses
- local-only state pretending to be persisted
- fake success messages

After a successful mutation:

- invalidate/refetch relevant data
- update UI state
- show feedback

Follow the project's existing data-fetching architecture.

============================================================
20. LOADING STATES
============================================================

Every data-driven page must handle loading.

Use existing:

- Skeleton
- Spinner
- Loading component

Prefer skeletons for large tables/cards where the existing UI supports them.

Examples:

Vendor list loading
Quotation comparison loading
Dashboard loading
Invoice loading
Reports loading

============================================================
21. EMPTY STATES
============================================================

Create meaningful empty states.

Examples:

"No active RFQs"
"No quotations submitted yet"
"No pending approvals"
"No purchase orders"
"No invoices"
"No notifications"

Where appropriate provide a relevant action:

Create RFQ
Submit Quotation
View RFQs

============================================================
22. ERROR STATES
============================================================

Handle:

- 400
- 401
- 403
- 404
- 409
- 422
- 500
- network errors

Display human-readable messages.

Examples:

403:
"You don't have permission to access this resource."

404:
"Quotation not found."

409:
"This RFQ has already been closed."

Do not expose raw backend/database errors.

============================================================
23. CONFIRMATION DIALOGS
============================================================

Use confirmation dialogs for destructive/important actions:

- Cancel RFQ
- Reject quotation
- Reject approval
- Cancel PO
- Cancel invoice if supported

Approval rejection must require remarks.

============================================================
24. RESPONSIVE DESIGN
============================================================

The entire frontend must work on:

- Desktop
- Laptop
- Tablet
- Mobile

Prioritize desktop ERP usability but do not allow mobile layouts to break.

Tables should support:

- horizontal scrolling
- responsive columns
- mobile-friendly actions

Forms should adapt to smaller screens.

============================================================
25. UI CONSISTENCY
============================================================

Maintain a consistent design language.

Use the existing project's:

- colors
- typography
- spacing
- border radius
- shadows
- buttons
- forms
- cards
- tables
- modals

Do not introduce random styles.

Do not redesign existing screens unless necessary for integration.

============================================================
26. FRONTEND ROUTE MAP
============================================================

Maintain/implement the following where appropriate:

/login
/signup

/dashboard

/vendors
/vendors/:id

/rfqs
/rfqs/create
/rfqs/:id

/rfqs/:rfqId/compare

/quotations
/quotations/:id

/approvals
/approvals/:id

/purchase-orders
/purchase-orders/:id

/invoices
/invoices/:id

/reports

/activity

Only create routes required by the existing architecture.

============================================================
27. FRONTEND SECURITY
============================================================

Never store sensitive information unnecessarily in:

- localStorage
- sessionStorage
- URL query parameters

Follow the existing authentication architecture.

Do not expose:

- competitor quotation data
- internal approval information
- internal procurement notes
- admin-only analytics

to vendors.

============================================================
28. FRONTEND TESTING
============================================================

Test important frontend flows.

Minimum:

1. Login redirects according to role.
2. Procurement Officer sees procurement navigation.
3. Vendor sees only vendor functionality.
4. Manager sees approval functionality.
5. Admin sees admin functionality.
6. Vendor can view assigned RFQ.
7. Vendor can create quotation.
8. Vendor can edit draft quotation.
9. Vendor can submit quotation.
10. Comparison screen renders multiple quotations.
11. Approval screen allows authorized approval.
12. Unauthorized users cannot access protected pages.
13. PO detail renders correctly.
14. Invoice detail renders correctly.
15. Print invoice works.
16. Notification center displays notifications.
17. Dashboard displays real API data.
18. Reports display real API data.
19. Loading states work.
20. Error states work.
21. Empty states work.

============================================================
29. FRONTEND TASK TRACKING
============================================================

Every frontend task MUST also be tracked in TASK.md.

Example:

## Frontend Status

| Screen | Status |
|---|---|
| Login | COMPLETE |
| Dashboard | IN_PROGRESS |
| Vendors | COMPLETE |
| RFQ | COMPLETE |
| Quotation | IN_PROGRESS |
| Comparison | NOT_STARTED |
| Approval | NOT_STARTED |
| Purchase Orders | NOT_STARTED |
| Invoices | NOT_STARTED |
| Notifications | NOT_STARTED |
| Reports | NOT_STARTED |

For each screen document:

- route
- components
- API endpoints
- current status
- remaining work
- known bugs

============================================================
30. FRONTEND-BACKEND COMPLETION RULE
============================================================

A feature is NOT COMPLETE if only one side exists.

For example:

Quotation Management:

Backend API exists
+
Frontend UI exists
+
Authentication works
+
RBAC works
+
Validation works
+
Database persistence works
+
Error handling works
+
Relevant tests/checks pass

= COMPLETE

Backend-only implementation = PARTIALLY_COMPLETE

Frontend-only implementation = PARTIALLY_COMPLETE

============================================================
31. FINAL UI VERIFICATION
============================================================

Before declaring the project complete:

Run the frontend build.

Verify:

- no TypeScript errors
- no broken imports
- no missing routes
- no console errors caused by implementation
- no broken API calls
- no unauthorized screens accessible
- no obvious responsive layout failures

Then test the complete browser workflow:

LOGIN
↓
DASHBOARD
↓
RFQ
↓
VENDOR
↓
QUOTATION
↓
COMPARISON
↓
APPROVAL
↓
PURCHASE ORDER
↓
INVOICE
↓
PDF
↓
PRINT
↓
EMAIL
↓
ACTIVITY
↓
REPORTS

Update TASK.md after verification.
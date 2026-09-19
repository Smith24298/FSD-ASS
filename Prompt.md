You are working on the existing VendorBridge project.

VendorBridge is a Procurement & Vendor Management ERP.

IMPORTANT:
The RFQ Management module has already been implemented separately.

Your task now is to analyze the existing codebase and implement ALL REMAINING functionality required by the official VendorBridge Problem Statement.

DO NOT rebuild or duplicate the RFQ Management module.

The implementation must integrate with the existing RFQ module and existing architecture.

============================================================
OFFICIAL PROBLEM STATEMENT
============================================================

VendorBridge is required to provide a centralized ERP platform for:

- Vendor management
- RFQ creation
- Vendor quotations
- Quotation comparison
- Procurement approvals
- Purchase orders
- Invoice generation
- Invoice printing
- Invoice email
- Procurement activity tracking

The official workflow is:

Procurement Officer creates RFQ
        ↓
Vendors receive invitations
        ↓
Vendors submit quotations
        ↓
Procurement team compares quotations
        ↓
Approval workflow
        ↓
Approved quotation
        ↓
Purchase Order
        ↓
Invoice
        ↓
Print / Email Invoice
        ↓
Activity Logs + Analytics

The RFQ module already exists.

Implement everything around this workflow that is still missing.

============================================================
0. FIRST: ANALYZE EXISTING PROJECT
============================================================

Before writing code:

1. Inspect the entire backend.
2. Inspect the entire frontend.
3. Inspect Prisma schema.
4. Inspect existing RFQ implementation.
5. Inspect existing authentication.
6. Inspect existing JWT implementation.
7. Inspect existing RBAC.
8. Inspect existing User model.
9. Inspect existing Vendor model.
10. Inspect existing Product model.
11. Inspect existing notification system.
12. Inspect existing email service.
13. Inspect existing Redis/BullMQ infrastructure.
14. Inspect existing file upload/S3 infrastructure.
15. Inspect existing audit/activity log functionality.
16. Inspect existing UI components.
17. Inspect existing API utilities.
18. Inspect existing error handling.
19. Inspect existing pagination/filtering utilities.

Search the codebase for existing functionality before creating anything.

If a service/helper already exists:

USE IT.

Do NOT create duplicate:

- JWT utilities
- Prisma clients
- authentication middleware
- RBAC middleware
- email services
- notification services
- file upload services
- audit logging
- API response handlers
- error handlers
- pagination utilities
- vendor services

Follow the existing architecture.

============================================================
1. VENDOR MANAGEMENT
============================================================

Implement the Vendor Management functionality required by the PS.

The official PS requires:

- Vendor registration
- Vendor status tracking
- Vendor categories
- GST details
- Contact details
- Search
- Filtering

Create a complete vendor management module if it does not already exist.

------------------------------------------------------------
Vendor fields
------------------------------------------------------------

Support appropriate fields such as:

- vendor ID
- vendor code
- company/business name
- contact person
- email
- phone
- GST number
- address
- category
- status
- createdAt
- updatedAt

Reuse the existing User/Vendor schema where possible.

Do NOT create a second Vendor model if one already exists.

------------------------------------------------------------
Vendor status
------------------------------------------------------------

Support statuses appropriate for the current architecture, for example:

ACTIVE
INACTIVE
PENDING
SUSPENDED

Do not blindly introduce duplicate status enums if an equivalent already exists.

------------------------------------------------------------
Vendor APIs
------------------------------------------------------------

Implement appropriate APIs:

GET /vendors
GET /vendors/:id
POST /vendors
PATCH /vendors/:id
PATCH /vendors/:id/status

Support:

- pagination
- search
- category filter
- status filter
- sorting

Only authorized users should be able to manage vendors.

Vendor users should not be able to arbitrarily modify their organization/vendor record unless the existing business rules explicitly permit it.

------------------------------------------------------------
Vendor UI
------------------------------------------------------------

Create:

/vendors

/vendor/:id

The list should show:

- Vendor name
- Category
- GST
- Contact
- Status
- Created date
- Actions

Provide:

- Search
- Status filter
- Category filter
- Pagination

Vendor detail page should show:

- Basic information
- Contact information
- GST information
- RFQs received
- Quotations submitted
- Purchase orders
- Procurement history

Only show information permitted by the user's role.

============================================================
2. VENDOR QUOTATION SUBMISSION
============================================================

Implement the Vendor Quotation Submission functionality.

The official PS requires vendors to be able to:

- Enter pricing details
- Enter delivery timelines
- Add notes/comments
- Edit quotations
- Submit quotations

The quotation module must integrate with the existing RFQ module.

DO NOT put quotation business logic inside the RFQ module.

Architecture:

RFQ
 |
 +-- RFQ Items
 |
 +-- RFQ Vendors
 |
 +-- Quotations
        |
        +-- Quotation Items

------------------------------------------------------------
Quotation model
------------------------------------------------------------

Design/update the Prisma schema as necessary.

A quotation should support:

- id
- quotation number
- rfqId
- vendorId
- status
- subtotal
- tax
- discount if supported
- total
- delivery timeline
- payment terms
- validity period
- notes
- submittedAt
- createdAt
- updatedAt

Quotation Item:

- id
- quotationId
- rfqItemId
- unit price
- quantity
- tax
- subtotal
- delivery information if required

Reuse Product/RFQ Item relationships where appropriate.

------------------------------------------------------------
Quotation statuses
------------------------------------------------------------

Use a state model compatible with the existing system.

Possible states:

DRAFT
SUBMITTED
UNDER_REVIEW
SHORTLISTED
REJECTED
ACCEPTED
EXPIRED
WITHDRAWN

Do not create duplicate state systems.

------------------------------------------------------------
Vendor security
------------------------------------------------------------

A vendor may ONLY:

- see RFQs assigned to that vendor
- create a quotation for those RFQs
- edit its own draft quotation
- submit its own quotation
- see its own submitted quotation
- see its own quotation status

A vendor MUST NOT:

- see other vendors
- see competitor quotations
- see competitor pricing
- see internal comparison data
- see internal approval remarks
- modify another vendor's quotation
- modify the RFQ

All authorization must be enforced on the backend.

------------------------------------------------------------
Quotation editing
------------------------------------------------------------

Support editable quotations as required by the PS.

Rules:

- Draft quotations can be edited.
- Submitted quotations may only be edited if the existing business rules allow it.
- After the RFQ deadline, quotation submission/editing must be rejected.
- After final acceptance/rejection, quotation must become immutable.

Do not rely on frontend validation for deadlines.

============================================================
3. QUOTATION COMPARISON
============================================================

Implement the Quotation Comparison module.

The official PS explicitly requires:

- Side-by-side comparison
- Lowest price highlighting
- Delivery timeline comparison
- Vendor rating indicators
- Sorting
- Filtering

Create a procurement-facing comparison interface.

Route:

/rfqs/:rfqId/compare

------------------------------------------------------------
Comparison data
------------------------------------------------------------

Display quotations side-by-side.

For every vendor quotation show:

- Vendor
- Quotation number
- Item prices
- Subtotal
- Tax
- Total
- Delivery timeline
- Payment terms
- Validity
- Vendor rating
- Quotation status

------------------------------------------------------------
Comparison rules
------------------------------------------------------------

The comparison system should calculate:

- lowest item price
- lowest total price
- fastest delivery
- price differences
- total differences

Highlight the lowest price as requested by the PS.

IMPORTANT:

Do not automatically decide the winning vendor only because it has the lowest price.

The system should provide comparison information to the procurement officer/manager.

The procurement team makes the final selection.

------------------------------------------------------------
Sorting/filtering
------------------------------------------------------------

Support:

- Lowest total
- Lowest item price
- Fastest delivery
- Highest vendor rating
- Status

Add useful filters where appropriate.

------------------------------------------------------------
Vendor visibility
------------------------------------------------------------

Comparison data is INTERNAL.

Only authorized:

- Procurement Officers
- Managers
- Admin

may access it.

Vendors MUST NEVER access comparison data.

============================================================
4. APPROVAL WORKFLOW
============================================================

Implement the Approval Workflow.

The official PS requires:

- Approve/reject actions
- Approval remarks
- Approval timeline
- Status tracking
- Workflow state transitions

Workflow:

Quotation selected
       ↓
Approval requested
       ↓
Manager reviews
       ↓
APPROVED / REJECTED
       ↓
If approved → Purchase Order

------------------------------------------------------------
Approval entity
------------------------------------------------------------

Create/use an Approval model.

Support:

- id
- reference type
- reference ID
- requestedBy
- approver
- status
- remarks
- requestedAt
- approvedAt
- rejectedAt

Reuse any existing approval infrastructure.

------------------------------------------------------------
Approval statuses
------------------------------------------------------------

Possible:

PENDING
APPROVED
REJECTED
CANCELLED

Use the project's existing equivalent if available.

------------------------------------------------------------
Approval APIs
------------------------------------------------------------

Implement appropriate APIs:

POST /approvals
GET /approvals
GET /approvals/:id
POST /approvals/:id/approve
POST /approvals/:id/reject

Only authorized approvers can approve/reject.

Rejecting must require a reason/remark.

------------------------------------------------------------
Approval timeline
------------------------------------------------------------

Display:

- Approval requested
- Approver
- Pending state
- Approval/rejection
- Remarks
- Timestamp

This should integrate with Activity Logs.

------------------------------------------------------------
State transition
------------------------------------------------------------

Do not allow:

DRAFT → APPROVED

The proper workflow should be enforced.

Expected flow:

RFQ
→ QUOTATION
→ SHORTLIST
→ APPROVAL
→ APPROVED
→ PURCHASE ORDER

Rejecting should preserve history.

Do NOT delete rejected approval records.

============================================================
5. PURCHASE ORDER
============================================================

Implement Purchase Order functionality.

The PS requires:

- Auto-generated PO number
- Conversion from approved quotation
- Status updates

Purchase Order must only be generated from an approved quotation.

------------------------------------------------------------
PO model
------------------------------------------------------------

Support:

- id
- PO number
- quotationId
- rfqId
- vendorId
- createdBy
- status
- issue date
- expected delivery date
- subtotal
- tax
- total
- notes
- createdAt
- updatedAt

PO Items:

- product/service
- description
- quantity
- unit price
- tax
- subtotal
- total

------------------------------------------------------------
PO number
------------------------------------------------------------

Automatically generate a unique PO number.

Example:

PO-2026-000001

Use a safe unique-generation strategy.

Do not rely only on timestamps.

------------------------------------------------------------
PO creation
------------------------------------------------------------

When an approved quotation is converted:

1. Verify quotation exists.
2. Verify quotation belongs to RFQ.
3. Verify quotation belongs to vendor.
4. Verify approval is APPROVED.
5. Verify quotation is eligible.
6. Create PO.
7. Copy quotation pricing into PO.
8. Create PO items.
9. Create activity event.
10. Update relevant statuses.

IMPORTANT:

The PO should contain a snapshot of the approved quotation values.

Future quotation modifications must not silently change the PO.

Use a database transaction.

------------------------------------------------------------
PO statuses
------------------------------------------------------------

Support appropriate statuses:

DRAFT
ISSUED
CONFIRMED
IN_PROGRESS
COMPLETED
CANCELLED

Use existing project conventions if present.

============================================================
6. INVOICE GENERATION
============================================================

Implement Invoice functionality from the Purchase Order.

The PS explicitly requires:

- Invoice generation
- Tax calculations
- Total calculations
- PDF download
- Print
- Email
- Status updates

Invoice must be associated with the Purchase Order.

------------------------------------------------------------
Invoice model
------------------------------------------------------------

Support:

- invoice ID
- invoice number
- PO ID
- vendor ID
- issue date
- due date
- subtotal
- tax
- total
- status
- notes
- createdAt
- updatedAt

Invoice items:

- description
- quantity
- unit price
- tax
- subtotal
- total

------------------------------------------------------------
Invoice numbering
------------------------------------------------------------

Automatically generate unique invoice numbers.

Example:

INV-2026-000001

Use a concurrency-safe approach.

============================================================
7. TAX + TOTAL CALCULATION
============================================================

Implement proper calculation logic.

At minimum:

subtotal
+
tax
-
discount if supported
=
total

Do NOT trust totals sent from frontend.

Backend must calculate totals.

Use decimal-safe database/application calculations.

Do not use unsafe floating point arithmetic for financial calculations if the project can use Decimal.

Create reusable calculation utilities if one does not already exist.

Do NOT duplicate calculation logic across:

- quotation
- PO
- invoice

Create one appropriate financial calculation utility/service and reuse it.

============================================================
8. INVOICE PDF
============================================================

Implement invoice PDF generation.

Invoice PDF should contain:

- Company information
- Invoice number
- Invoice date
- Vendor information
- GST information if available
- PO number
- Item table
- Quantity
- Unit price
- Tax
- Subtotal
- Total
- Payment information if available

Reuse an existing PDF generation utility if available.

Do not create unnecessary duplicate PDF infrastructure.

Endpoint example:

GET /invoices/:id/pdf

The endpoint must verify authorization before generating/accessing the document.

============================================================
9. PRINT INVOICE
============================================================

Provide a printable invoice UI.

The user should be able to:

- Open invoice
- Preview invoice
- Print invoice

Use browser print functionality or the existing PDF infrastructure.

Do not create a separate unrelated invoice representation.

============================================================
10. EMAIL INVOICE
============================================================

Implement:

Send Invoice via Email

The official PS explicitly requires invoice email functionality.

Use the existing email service / BullMQ / Redis queue.

Do NOT create another mail infrastructure.

Workflow:

Invoice
 ↓
Send Email
 ↓
Queue email
 ↓
Email service
 ↓
Vendor receives invoice

Email should contain:

- invoice number
- PO number
- total
- invoice date
- due date if available
- invoice PDF attachment or secure document link

Track email status if existing notification infrastructure supports it.

============================================================
11. ACTIVITY LOGS
============================================================

Implement the Activity Logs functionality.

The PS requires:

- Activity timeline
- Audit logs
- Procurement activity tracking

Track important events across the procurement lifecycle.

Examples:

RFQ_CREATED
RFQ_PUBLISHED
VENDOR_INVITED
QUOTATION_SUBMITTED
QUOTATION_UPDATED
QUOTATION_SHORTLISTED
APPROVAL_REQUESTED
APPROVAL_APPROVED
APPROVAL_REJECTED
PO_CREATED
PO_ISSUED
INVOICE_CREATED
INVOICE_SENT
INVOICE_PRINTED

Reuse the existing ActivityLog/AuditLog system if available.

DO NOT create a second audit system.

------------------------------------------------------------
Activity record
------------------------------------------------------------

Track:

- actor/user
- action
- entity type
- entity ID
- description
- timestamp
- metadata if supported

Do not store sensitive information unnecessarily.

============================================================
12. ACTIVITY TIMELINE UI
============================================================

Create a reusable timeline component.

Example:

RFQ Created
   ↓
Vendor Invited
   ↓
Quotation Submitted
   ↓
Quotation Shortlisted
   ↓
Approval Requested
   ↓
Approved
   ↓
PO Created
   ↓
Invoice Generated
   ↓
Invoice Sent

Timeline should show:

- action
- actor
- timestamp
- status
- relevant remarks

Use it on appropriate detail pages.

============================================================
13. NOTIFICATIONS
============================================================

Implement notifications required by the PS.

The PS specifically mentions:

- RFQ notifications
- Approval alerts
- Invoice updates

Integrate with existing notification infrastructure.

Examples:

Vendor:
- New RFQ invitation
- RFQ deadline approaching
- RFQ cancelled
- Quotation status changed
- PO available
- Invoice received

Procurement Officer:
- Quotation submitted
- Approval decision
- PO created
- Invoice generated

Manager:
- Approval requested
- Approval reminder

Use existing:

- BullMQ
- Redis
- Email service
- in-app notification service

if already implemented.

Do not build duplicate infrastructure.

============================================================
14. DASHBOARD / HOME SCREEN
============================================================

Implement the Dashboard required by the PS.

The dashboard must show:

- Pending approvals
- Active RFQs
- Recent purchase orders
- Recent invoices
- Analytics cards
- Quick action buttons

The dashboard must be role-aware.

------------------------------------------------------------
Procurement Officer dashboard
------------------------------------------------------------

Show:

- Active RFQs
- Pending quotations
- Pending approvals
- Recent POs
- Recent invoices
- Quick Create RFQ
- View Quotations
- Create PO where permitted

------------------------------------------------------------
Manager dashboard
------------------------------------------------------------

Show:

- Pending approvals
- Procurement requests awaiting review
- Recent approvals
- Recent POs
- Procurement statistics

------------------------------------------------------------
Vendor dashboard
------------------------------------------------------------

Show:

- Active RFQs
- Pending quotations
- Submitted quotations
- RFQ deadlines
- Purchase orders
- Invoice information

Do NOT show internal procurement data to vendors.

------------------------------------------------------------
Admin dashboard
------------------------------------------------------------

Show:

- Users
- Vendors
- Active RFQs
- Procurement statistics
- PO statistics
- Invoice statistics
- Spending summaries

============================================================
15. DASHBOARD ANALYTICS CARDS
============================================================

Create reusable statistics APIs.

Examples:

GET /dashboard/stats

Possible statistics:

- Total vendors
- Active vendors
- Active RFQs
- Pending quotations
- Pending approvals
- Purchase orders
- Invoices
- Total procurement value

Do not calculate everything by downloading all database records.

Use efficient database aggregate queries.

============================================================
16. REPORTS & ANALYTICS
============================================================

Implement the Reports & Analytics screen.

The PS explicitly requires:

- Vendor performance analytics
- Exportable reports
- Procurement statistics
- Spending summaries
- Monthly procurement trends

Create:

/reports

------------------------------------------------------------
Procurement statistics
------------------------------------------------------------

Show:

- RFQs created
- Quotations received
- Approvals
- Purchase orders
- Invoices
- Procurement value

------------------------------------------------------------
Spending summary
------------------------------------------------------------

Calculate spending based on approved/issued procurement documents.

Show:

- Total spending
- Spending by vendor
- Spending by category
- Monthly spending

Do not count rejected/cancelled procurement as actual spending.

Use the appropriate business state.

------------------------------------------------------------
Monthly trends
------------------------------------------------------------

Show monthly:

- RFQs
- POs
- Invoices
- Spending

Use efficient aggregation queries.

============================================================
17. VENDOR PERFORMANCE ANALYTICS
============================================================

Implement vendor performance indicators.

Possible metrics:

- RFQs received
- Quotations submitted
- Response rate
- Average quotation response time
- Average delivery timeline
- Accepted quotations
- Rejected quotations
- Purchase orders
- Procurement value

If a vendor rating already exists, reuse it.

Do not invent arbitrary ratings.

Display indicators transparently.

============================================================
18. EXPORTABLE REPORTS
============================================================

Allow authorized users to export reports.

Possible formats:

- CSV
- Excel
- PDF

At minimum implement the formats already supported by the project.

Reports should respect:

- role permissions
- filters
- date ranges
- selected vendor/category

Do not export unauthorized vendor or financial information.

============================================================
19. ROLE-BASED ACCESS
============================================================

The official PS defines four roles:

PROCUREMENT OFFICER
VENDOR
MANAGER / APPROVER
ADMIN

Implement/verify permissions across all modules.

------------------------------------------------------------
PROCUREMENT OFFICER
------------------------------------------------------------

Can:

- Create RFQs
- Compare quotations
- Generate purchase orders
- Generate invoices
- View procurement activities
- Manage relevant procurement workflow

------------------------------------------------------------
VENDOR
------------------------------------------------------------

Can:

- View assigned RFQs
- Submit quotations
- Track RFQ status
- View permitted purchase orders
- View permitted invoices

Cannot:

- See competitor quotations
- Compare vendors
- Approve procurement
- Manage RFQs
- Access internal analytics

------------------------------------------------------------
MANAGER / APPROVER
------------------------------------------------------------

Can:

- View approval requests
- Approve procurement
- Reject procurement
- Add approval remarks
- Monitor procurement workflow

------------------------------------------------------------
ADMIN
------------------------------------------------------------

Can:

- Manage users
- Manage vendors
- View procurement analytics
- Access administrative functionality

Use existing JWT + RBAC middleware.

Do not implement role checks only in frontend.

============================================================
20. END-TO-END WORKFLOW
============================================================

After implementing all modules, make sure the complete PS workflow works:

1. Procurement Officer logs in.
2. Procurement Officer creates RFQ.
3. Vendors receive RFQ invitations.
4. Vendor logs in.
5. Vendor sees assigned RFQ.
6. Vendor creates quotation.
7. Vendor enters:
   - pricing
   - delivery timeline
   - notes
8. Vendor submits quotation.
9. Procurement Officer sees quotation.
10. Multiple vendor quotations can be compared.
11. Procurement Officer shortlists/selects quotation.
12. Approval workflow starts.
13. Manager receives approval notification.
14. Manager reviews procurement.
15. Manager approves/rejects.
16. If approved, PO can be generated.
17. PO gets unique PO number.
18. PO contains approved quotation snapshot.
19. Invoice is generated.
20. Tax and total are calculated.
21. Invoice gets unique invoice number.
22. Invoice can be viewed.
23. Invoice can be downloaded as PDF.
24. Invoice can be printed.
25. Invoice can be emailed.
26. All important events appear in activity logs.
27. Dashboard statistics update.
28. Reports/analytics reflect procurement data.

============================================================
21. DATABASE DESIGN
============================================================

Before changing Prisma:

Inspect existing schema.

Reuse existing:

- User
- Vendor
- RFQ
- RFQItem
- Quotation
- Product
- Approval
- PurchaseOrder
- Invoice
- ActivityLog
- Notification

if already available.

Only add missing entities/fields.

Potential relationships:

User
 |
 +-- Vendor
 |
 +-- RFQs
 |
 +-- Approvals
 |
 +-- ActivityLogs

Vendor
 |
 +-- RFQ Invitations
 +-- Quotations
 +-- Purchase Orders
 +-- Invoices

RFQ
 |
 +-- RFQ Items
 +-- Vendors
 +-- Quotations
 +-- Approvals
 +-- Purchase Order
 +-- Activity Logs

Quotation
 |
 +-- Quotation Items
 +-- Approval
 +-- Purchase Order

Purchase Order
 |
 +-- PO Items
 +-- Invoice

Invoice
 |
 +-- Invoice Items

Adapt this to the existing schema instead of blindly implementing it.

============================================================
22. FINANCIAL DATA SAFETY
============================================================

Financial calculations must be reliable.

Never trust:

- frontend subtotal
- frontend tax
- frontend total
- frontend PO total
- frontend invoice total

Calculate totals server-side.

Use database Decimal / appropriate monetary representation.

Preserve approved quotation pricing in the PO.

Preserve PO pricing in the invoice.

Do not allow historical documents to change because another upstream record was edited.

============================================================
23. TRANSACTION SAFETY
============================================================

Use database transactions for operations such as:

Quotation submission
Approval
PO generation
Invoice generation

Example PO generation:

Validate quotation
+
Validate approval
+
Create PO
+
Create PO items
+
Update quotation status
+
Create activity log
+
Create notification event

All related database changes should succeed or fail together.

============================================================
24. SECURITY
============================================================

Pay special attention to IDOR and role escalation.

Never trust:

userId
vendorId
quotationId
rfqId
approvalId

from the client without validating ownership/authorization.

Examples:

Vendor A must not access Vendor B's quotation.

Vendor must not access:

/quotations/:competitorQuotationId

Manager must not approve an unrelated procurement request.

Procurement Officer must not access admin-only user management.

All APIs must perform authorization checks.

============================================================
25. FRONTEND ARCHITECTURE
============================================================

Use the existing frontend architecture.

Do not introduce another UI framework.

Reuse:

- Layout
- Sidebar
- Navbar
- Buttons
- Forms
- Tables
- Modals
- Toasts
- Pagination
- Loading states
- Error states

Create screens:

/dashboard
/vendors
/vendors/:id
/quotations
/quotations/:id
/rfqs/:rfqId/compare
/approvals
/approvals/:id
/purchase-orders
/purchase-orders/:id
/invoices
/invoices/:id
/reports
/activity

Only create routes that fit the existing project.

============================================================
26. UX REQUIREMENTS
============================================================

Every major page should have:

- Loading state
- Empty state
- Error state
- Success feedback
- Confirmation dialogs for destructive actions
- Pagination where required
- Search/filter where required

Tables should support:

- sorting
- pagination
- useful filters

Financial values should be formatted consistently.

Statuses should use consistent badges.

Dates/times should use one consistent format.

============================================================
27. API ERROR HANDLING
============================================================

Reuse existing error handling.

Important errors:

- Vendor not found
- RFQ not found
- Quotation not found
- Unauthorized access
- Invalid workflow state
- Approval not found
- PO already exists
- Invoice already exists
- Deadline passed
- Invalid financial calculation
- Cannot generate PO before approval
- Cannot generate invoice before PO
- Cannot approve already rejected request

Do not expose raw Prisma/database errors.

============================================================
28. TESTING
============================================================

Add/verify tests for:

VENDOR:

1. Admin can create vendor.
2. Admin can update vendor.
3. Vendor search works.
4. Vendor filtering works.

QUOTATION:

5. Vendor can see assigned RFQ.
6. Vendor cannot see another vendor's RFQ.
7. Vendor can create quotation.
8. Vendor can edit draft quotation.
9. Vendor can submit quotation.
10. Vendor cannot submit after deadline.
11. Vendor cannot access competitor quotation.

COMPARISON:

12. Officer can compare quotations.
13. Vendor cannot access comparison.
14. Lowest price calculation works.
15. Delivery comparison works.

APPROVAL:

16. Approval can be created.
17. Manager can approve.
18. Manager can reject.
19. Rejection requires remarks.
20. Unauthorized user cannot approve.

PURCHASE ORDER:

21. PO cannot be generated without approval.
22. Approved quotation can generate PO.
23. PO number is unique.
24. PO contains quotation snapshot.

INVOICE:

25. Invoice can be generated from PO.
26. Invoice number is unique.
27. Tax calculation works.
28. Total calculation works.
29. Invoice PDF can be generated.
30. Invoice can be emailed.

SECURITY:

31. Vendor cannot access competitor data.
32. User cannot access unauthorized RFQs.
33. Manager cannot access admin-only operations.

ACTIVITY:

34. Important procurement events create activity logs.

DASHBOARD:

35. Dashboard statistics are accurate.

REPORTS:

36. Spending reports exclude cancelled/rejected procurement.

============================================================
29. DO NOT BREAK EXISTING RFQ
============================================================

The existing RFQ implementation is already available.

DO NOT:

- rewrite it
- duplicate it
- create another RFQ schema
- create another RFQ service
- create another RFQ controller
- create another RFQ route system

Instead:

INTEGRATE WITH IT.

If the existing RFQ implementation is incomplete and a change is absolutely required for integration:

1. Identify the issue.
2. Make the smallest compatible change.
3. Preserve existing API contracts where possible.
4. Do not replace the whole implementation.

============================================================
30. CODE REUSE RULE
============================================================

Before creating any new utility/service, search the repository.

If you find:

authService
jwtService
emailService
notificationService
queueService
fileService
s3Service
pdfService
auditService
activityService
paginationService
responseService
errorService
vendorService
financialService

reuse it.

Do not create:

newAuthService
newJwtService
newEmailService
newNotificationService

or equivalent duplicates.

============================================================
31. IMPLEMENTATION ORDER
============================================================

Implement in this order:

PHASE 1
Analyze existing architecture.

PHASE 2
Complete Vendor Management.

PHASE 3
Implement Quotation Management.

PHASE 4
Implement Quotation Comparison.

PHASE 5
Implement Approval Workflow.

PHASE 6
Implement Purchase Order.

PHASE 7
Implement Invoice.

PHASE 8
Implement PDF / Print / Email Invoice.

PHASE 9
Implement Activity Logs and Notifications.

PHASE 10
Implement Dashboard.

PHASE 11
Implement Reports & Analytics.

PHASE 12
Verify RBAC.

PHASE 13
Integrate complete workflow.

PHASE 14
Testing.

PHASE 15
Fix TypeScript/lint/database errors.

============================================================
32. FINAL ACCEPTANCE CRITERIA
============================================================

The implementation is considered complete only when the following workflow works:

PROCUREMENT OFFICER
    ↓
Create RFQ
    ↓
Invite Vendors
    ↓
VENDOR
    ↓
Receive RFQ
    ↓
Submit Quotation
    ↓
PROCUREMENT OFFICER
    ↓
Compare Quotations
    ↓
Shortlist
    ↓
MANAGER
    ↓
Approve / Reject
    ↓
If Approved
    ↓
PURCHASE ORDER
    ↓
INVOICE
    ↓
PDF / PRINT / EMAIL
    ↓
ACTIVITY LOG
    ↓
DASHBOARD / REPORTS

Every transition must:

- enforce RBAC
- validate business state
- persist correct database state
- generate appropriate activity logs
- trigger appropriate notifications
- preserve historical procurement data

============================================================
33. FINAL OUTPUT
============================================================

After implementation, provide a concise implementation report containing:

1. Modules implemented.
2. Files created.
3. Files modified.
4. Prisma schema changes.
5. API endpoints.
6. Frontend routes.
7. RBAC rules.
8. Workflow states.
9. Notification events.
10. Activity events.
11. PDF/email implementation.
12. Reports implemented.
13. Tests added.
14. Commands required to run migrations.
15. Commands required to run tests.
16. Any remaining limitations.

IMPORTANT:

Do not claim a feature is implemented unless it actually works end-to-end.

Run:

- TypeScript checks
- Lint
- Prisma validation
- Prisma migration checks
- Backend tests
- Frontend build

Fix errors before declaring the implementation complete.

The final system must satisfy the official VendorBridge Problem Statement while preserving the existing architecture and RFQ implementation.
# Here are your Instructions

Action: file_editor view /app/memory/PRD.md
Observation: /app/memory/PRD.md:
1|# Renergizr Industries - B2B Energy Trading Platform
2|
3|## Problem Statement
4|Build a B2B energy trading marketplace for Renergizr Industries Private Limited (per MOU). Platform connects energy buyers (clients) posting RFQs with verified energy vendors. AI-powered bid ranking, carbon credits tracking, and regulatory compliance.
5|
6|## Architecture
7|- **Frontend**: React + Tailwind CSS + Recharts (dark industrial theme)
8|- **Backend**: FastAPI + MongoDB (motor async driver)
9|- **Auth**: JWT sessions (email/password) + Emergent Google OAuth
10|- **AI Engine**: Gemini 2.0 Flash via emergentintegrations (bid ranking + gap analysis)
11|- **Email**: Resend (configured, requires RESEND_API_KEY in backend/.env)
12|- **Design**: Dark navy (#020617) + Sky blue (#0EA5E9) accent + Chivo/Inter fonts
13|
14|## User Personas
15|1. **Energy Buyers (Client role)**: Post RFQs, review bids, use AI analysis, award contracts
16|2. **Energy Vendors (Vendor role)**: Bid on RFQs, manage profile + certifications, accept/decline contracts
17|3. **Platform Admin (Admin role)**: Verify vendors, manage users, platform oversight, contracts oversight
18|
19|## Core Features Implemented ✅
20|
21|### Landing Page (Company Website)
22|- Live energy market ticker (Solar, Wind, CCTS Carbon, EU CBAM)
23|- Hero section with live market data widget
24|- About Renergizr (company story, INR 3.8L invested)
25|- 6-feature bento grid (RFQ, AI Ranking, Vendor Verification, Carbon Credits, Market Intelligence, CBAM Compliance)
26|- How It Works (3 steps)
27|- Carbon Credits & CCTS section (India ₹20,000 Cr CCTS, EU CBAM context)
28|- For Clients + For Vendors sections
29|- News & Insights (Finshots, LiveMint article links)
30|- Compliance badges (CCTS, MNRE, CEA, CBAM, ISO 14001, GreenPro)
31|- Contact form
32|- SEO meta tags (title, description, OG tags)
33|- Comprehensive footer
34|
35|### Authentication
36|- JWT email/password login + registration
37|- Google OAuth (Emergent-managed)
38|- Role selection: Client / Vendor
39|- Session management (7-day cookies)
40|
41|### Client Module
42|- Dashboard with stats (RFQs, bids, awarded)
43|- Energy price trend chart (6-month)
44|- Carbon market widget
45|- 4-step RFQ creation (Basic → Technical Specs → Logistics → Financial)
46|- RFQ detail with bid price comparison chart
47|- AI ranking (Gemini Flash) with gap analysis
48|- Close Bidding button (transitions RFQ to bidding_closed)
49|- Shortlist bids (toggle shortlisting)
50|- Award Contract modal (with contract terms + payment schedule customization)
51|- Auto-reject all other bids when contract awarded
52|- Contract management page (/client/contracts) with expand/collapse details
53|- Workflow steps visualization (4 steps shown in sidebar)
54|
55|### Vendor Module
56|- Dashboard with profile completion tracker
57|- Carbon Credits widget (balance + market value at CCTS rate)
58|- CCTS Carbon Price trend chart
59|- Marketplace with search + filter by energy type
60|- 3-tab vendor profile (Company Info / Energy & Capacity / Compliance & Docs)
61|- Real document upload (base64, per doc type, PDF/JPG/PNG up to 10MB)
62|- Uploaded docs list with status
63|- Carbon credits section with market value calculator
64|- Regulatory document management (7 doc types)
65|- Green certifications (7 certification types)
66|- Bid submission with price, quantity, timeline, notes
67|- Bid status tracking (submitted → shortlisted → accepted → contract_signed)
68|- Contract acceptance/decline UI with notes
69|- Vendor contracts page (/vendor/contracts)
70|
71|### Admin Dashboard
72|- Overview: stats + platform bar chart + energy price charts + CCTS carbon chart
73|- Users tab: role management, activate/deactivate
74|- Vendors tab: CCTS verification (verify/reject workflow)
75|- RFQs tab: all RFQs oversight
76|- Admin contracts overview (/api/admin/contracts)
77|
78|### Notification System ✅ (Real, Database-backed)
79|- In-app notifications (MongoDB `notifications` collection)
80|- Navbar bell icon with unread count badge (live refresh every 30s)
81|- Notification dropdown with emoji type icons + timestamps
82|- Mark single notification as read (on click)
83|- Mark all as read button
84|- Triggered on: new bid, bid shortlisted, contract awarded, contract accepted/declined, vendor verified/rejected, bidding closed
85|
86|### Email Notifications ✅ (Ready - needs RESEND_API_KEY)
87|- Resend integration implemented (graceful degradation if key not set)
88|- HTML emails sent for: new bid, contract awarded, contract accepted/declined, vendor verified
89|- Configure: add `RESEND_API_KEY=re_xxx` to /app/backend/.env + `SENDER_EMAIL=your@domain.com`
90|
91|### Document Upload ✅ (Real)
92|- Base64 file upload stored in MongoDB `vendor_documents` collection
93|- One document per type per vendor (upsert)
94|- Admin can access documents for verification workflow
95|- Supported: PDF, JPG, PNG up to 10MB
96|
97|### Full Trading Workflow ✅
98|State Machine:
99|- RFQ: `open` → `bidding_closed` → `awarded` → `completed` | `cancelled`
100|- Bid: `submitted` → `shortlisted` → `accepted` | `rejected` → `contract_signed` | `contract_declined`
101|- Contract: `pending_vendor_acceptance` → `active` | `vendor_declined`
102|
103|### API Endpoints
104|- Auth: register, login, google/session, me, logout
105|- RFQs: CRUD, status update, close-bidding, award/{bid_id}
106|- Bids: submit, list, status update, shortlist, AI ranking
107|- Contracts: list, get, respond (vendor accept/decline)
108|- Vendor: profile CRUD, documents upload/list, my bids
109|- Admin: users, vendors (with notifications), analytics, rfqs, contracts
110|- Market: /api/market/insights (public, simulated data)
111|- Notifications: get, mark-read, read-all
112|
113|## Seed Data (Test Credentials)
114|- **Admin**: admin@renergizr.com / Admin@123
115|- **Client 1**: buyer1@acme.com / Client@123
116|- **Client 2**: buyer2@tatapower.com / Client@123
117|- **Vendor 1**: vendor1@greensun.com / Vendor@123 (CCTS Verified, 12,500 tCO2e)
118|- **Vendor 2**: vendor2@windpower.com / Vendor@123 (Pending verification)
119|
120|## Dates
121|- Jan 2026: Platform MVP (auth, RFQ, bids, AI ranking)
122|- Feb 2026: Major update (carbon credits, market data, comprehensive landing page, compliance docs)
123|- Feb 2026 v2: Deep trading workflow, notification system, document upload, contract management, email notifications
124|
125|## Prioritized Backlog
126|
127|### P0 (Critical for Production)
128|- Real payment integration (Stripe/Razorpay) for platform fees + transaction fees
129|- Configure RESEND_API_KEY for actual email delivery
130|- Real carbon credit API integration (registry data)
131|- Push notifications (browser/mobile)
132|
133|### P1 (High Value)
134|- RFQ templates by energy type
135|- Vendor shortlisting (client can invite specific vendors to bid)
136|- Bid negotiation workflow (counter-offers)
137|- Multi-language support (Hindi, Marathi)
138|- Mobile app (React Native)
139|- Analytics dashboard for vendors (win rate, pricing benchmark)
140|- Admin document viewer (read uploaded vendor docs for verification)
141|
142|### P2 (Future)
143|- Carbon trading marketplace (buy/sell credits between vendors)
144|- Energy price alerts (push + email when market moves)
145|- Integration with MNRE/CEA API for real regulatory verification
146|- Invoice & PO generation post-award (PDF generation)
147|- Enterprise SSO (SAML)
148|- White-label version for large energy companies
149|- Live data feed for market prices (replace simulation)
150|- API documentation (Swagger/OpenAPI export)
151|- Deployment guide (Docker + Kubernetes)
152|
153|## Tech Debt / Known Issues
154|- Market insights data is simulated (not live feed)
155|- Document data stored as base64 in MongoDB (should use cloud storage for production scale)
156|- Email not delivered (RESEND_API_KEY needs to be configured)
157|- No email verification on registration
158|- server.py is monolithic (~1000 lines) - should split into routers for scale
159|

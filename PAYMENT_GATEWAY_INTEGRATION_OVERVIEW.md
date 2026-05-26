# FitTrack Payment Gateway Integration Overview

**Document Version:** 1.0  
**Last Updated:** May 25, 2026  
**Purpose:** Complete overview for integrating payment gateway into FitTrack gym management system

---

## 1. PROJECT OVERVIEW

### Application Name
**FitTrack** - Automated Gym Management Application

### Project Type
- Full-stack web application
- Gym/Fitness center management system
- Multi-user role-based system

### Tech Stack
- **Backend:** Node.js + Express.js + MongoDB (Mongoose ODM)
- **Frontend:** React 19 + Vite + Tailwind CSS
- **Authentication:** JWT (JSON Web Tokens) + bcryptjs
- **Hosting:** Local development (Node backend on port 5000, React on port 5173)

### Project Goals
- Automate gym operations and bookings
- Handle member subscriptions/memberships
- Trainer booking and management
- Real-time crowd monitoring
- Payment processing for memberships and services

---

## 2. CURRENT ARCHITECTURE

### Backend Structure
```
backend/
├── src/
│   ├── server.js                 # Main Express app entry
│   ├── config/
│   │   └── db.js                 # MongoDB connection config
│   ├── controllers/
│   │   ├── auth.controller.js    # Authentication logic
│   │   ├── booking.controller.js # Booking management
│   │   ├── membership.controller.js  # Membership management
│   │   ├── crowd.controller.js   # Crowd monitoring
│   │   └── alert.controller.js   # Alerts
│   ├── models/
│   │   ├── User.js               # User schema (Admin/Trainer/Member)
│   │   ├── Booking.js            # Booking schema
│   │   └── Membership.js         # Membership schema
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── booking.routes.js
│   │   ├── membership.routes.js
│   │   ├── crowd.routes.js
│   │   └── alert.routes.js
│   ├── middleware/
│   │   └── auth.middleware.js    # JWT authentication
│   └── seed/
│       └── seedAdmin.js          # Create default admin
├── package.json
└── .env                          # Environment variables
```

### Frontend Structure
```
frontend/
├── src/
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── SignUp.jsx
│   │   ├── MemberDashboard.jsx
│   │   ├── TrainerDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── BookingPage.jsx
│   │   ├── MembershipPlanSelection.jsx
│   │   ├── PaymentPage.jsx        # ⭐ Payment page (needs enhancement)
│   │   ├── MembershipPayments.jsx # Payment history page
│   │   ├── AdminLogin.jsx
│   │   └── Profile.jsx
│   ├── components/
│   │   ├── Navigation.jsx
│   │   ├── StatCard.jsx
│   │   ├── CrowdLevel.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       └── Select.jsx
│   └── App.jsx
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

### Database Models

#### **User Model**
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: enum ['admin', 'trainer', 'member'],
  ageRange: String,
  gender: String,
  phone: String,
  membershipId: ObjectId (reference to Membership),
  createdAt: Date
}
```

#### **Membership Model** ⭐ KEY FOR PAYMENTS
```javascript
{
  user: ObjectId (User reference),
  plan: enum ['basic', 'premium', 'elite'],
  startDate: Date,
  endDate: Date,
  status: enum ['active', 'expired', 'cancelled'],
  price: Number (in INR),
  paymentStatus: enum ['paid', 'pending', 'failed'],  // ⭐ Payment field
  createdAt: Date
}
```

#### **Booking Model**
```javascript
{
  user: ObjectId (User reference),
  type: enum ['workout', 'trainer'],
  date: Date,
  timeSlot: String,
  trainer: ObjectId (User reference, optional),
  status: enum ['processing', 'confirmed', 'cancelled', 'completed'],
  cancelReason: String,
  cancelledBy: enum ['trainer', 'member', 'admin'],
  createdAt: Date
}
```

---

## 3. CURRENT PAYMENT STATUS

### ✅ Already Implemented
1. **Payment Status Field** in Membership model
   - Fields: `paymentStatus: ['paid', 'pending', 'failed']`
   
2. **Update Payment Status Endpoint**
   - Route: `PUT /api/memberships/:id/payment`
   - Updates payment status manually

3. **Frontend Payment Page**
   - `PaymentPage.jsx` exists with form for:
     - Card number
     - Card holder name
     - Expiry date
     - CVV
     - Amount

4. **Membership Payment Plans**
   - Basic: ₹5,000/month (1 month duration)
   - Premium: ₹10,000/month (6 months duration)
   - Elite: ₹100,000/year (12 months duration)

### ❌ NOT YET Implemented
1. **Actual Payment Gateway Integration** (Stripe, Razorpay, etc.)
2. **Transaction Records/Logs** in database
3. **Payment Verification & Webhooks**
4. **Refund Processing**
5. **Invoice Generation**
6. **Payment Analytics/Reports**
7. **Error Handling for Failed Payments**
8. **Retry Mechanisms**
9. **PCI Compliance**

---

## 4. PAYMENT FLOW REQUIREMENTS

### Current User Flow
```
User Registration
    ↓
Member Dashboard
    ↓
Select Membership Plan (MembershipPlanSelection.jsx)
    ↓
Go to Payment (PaymentPage.jsx)
    ↓
Enter Card Details
    ↓
Process Payment ⭐ (MISSING)
    ↓
Create Membership Record
    ↓
Update Payment Status to "paid"
    ↓
Activate Membership
    ↓
Access Gym Services
```

### Booking Payment Flow (Trainer Sessions)
```
User Books Trainer Session (Booking.jsx)
    ↓
Session Confirmation Required ⭐ (Payment needed?)
    ↓
Process Payment for Session ⭐ (MISSING)
    ↓
Trainer Confirmation
    ↓
Booking Confirmed
    ↓
Session Completion
```

---

## 5. RECOMMENDED PAYMENT GATEWAYS FOR INDIA

### Option 1: **Razorpay** ⭐ RECOMMENDED
**Best for Indian startups & SMBs**

**Pros:**
- Most popular in India
- Supports UPI, Cards, NetBanking, Wallets
- Excellent documentation
- Webhook support for webhooks
- Dashboard analytics
- Lowest per-transaction fees (~2.36% for cards)
- Best developer experience

**Cons:**
- Limited international reach

**Integration Points:**
- Client-side: `Razorpay Checkout`
- Server-side: API for verification & refunds
- Webhooks for payment status updates

**Package:** `npm install razorpay`

---

### Option 2: **Stripe**
**Best for international scalability**

**Pros:**
- Works globally
- Excellent developer documentation
- Powerful dashboard
- Complete payment suite

**Cons:**
- Higher fees (~3.5% + fixed fee)
- May be overkill for India-focused app
- More complex setup

**Package:** `npm install stripe`

---

### Option 3: **PayU**
**Alternative for Indian market**

**Pros:**
- Established in India
- Multi-payment options
- Competitive fees

**Cons:**
- Older documentation
- Not as developer-friendly as Razorpay

---

## 6. RECOMMENDED PAYMENT FLOW ARCHITECTURE

### Selected Gateway: **Razorpay** (Recommended)

### Component Interaction Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ PaymentPage.jsx / Checkout Component                    │  │
│  │ - Show order details                                    │  │
│  │ - Razorpay.Checkout() integration                       │  │
│  │ - Handle payment response                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────────┐
│                BACKEND (Express.js)                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Payment Routes (/api/payments/*)                        │  │
│  │                                                          │  │
│  │ POST /api/payments/create-order                         │  │
│  │   → Create Razorpay Order                               │  │
│  │                                                          │  │
│  │ POST /api/payments/verify-payment                       │  │
│  │   → Verify payment signature                            │  │
│  │   → Update Membership/Booking                           │  │
│  │                                                          │  │
│  │ POST /api/payments/webhook                              │  │
│  │   → Handle Razorpay webhook events                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Database Models                                         │  │
│  │ - Membership (existing, update paymentStatus)           │  │
│  │ - NEW: Transaction/Payment record                       │  │
│  │ - NEW: Invoice record                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │ API
┌──────────────────────▼──────────────────────────────────────────┐
│                    RAZORPAY API                                 │
│  - Create Order                                                │
│  - Capture Payment                                             │
│  - Process Refunds                                             │
│  - Send Webhooks                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. DATABASE SCHEMA ADDITIONS NEEDED

### New Model: **Transaction/Payment**
```javascript
const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Link to what user is paying for
  membershipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Membership'
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Razorpay Details
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['created', 'pending', 'captured', 'failed', 'refunded'],
    default: 'created'
  },
  
  // Metadata
  paymentMethod: String,        // 'card', 'upi', 'netbanking', etc.
  description: String,
  notes: {},
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for better query performance
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ status: 1 });
```

### Updated Membership Model
```javascript
// Add these fields to existing Membership model:
{
  // Existing fields...
  
  // Payment reference
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  
  // Payment details
  paymentDate: Date,
  paymentMethod: String,
  
  // Renewal
  renewalDueDate: Date,
  autoRenewal: {
    type: Boolean,
    default: false
  },
  
  // Cancellation
  cancellationDate: Date,
  cancellationReason: String
}
```

---

## 8. BACKEND API ENDPOINTS TO CREATE/MODIFY

### New Payment Routes

#### 1. **Create Payment Order**
```
POST /api/payments/create-order
Headers: Authorization: Bearer {token}
Body: {
  membershipId?: string,  // For membership payments
  bookingId?: string,     // For booking payments
  amount: number,
  description: string
}
Response: {
  orderId: string,        // Razorpay Order ID
  amount: number,
  currency: string,
  key: string            // Razorpay Key for frontend
}
```

#### 2. **Verify Payment**
```
POST /api/payments/verify-payment
Headers: Authorization: Bearer {token}
Body: {
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
}
Response: {
  success: boolean,
  message: string,
  paymentId: string,
  membership: {membership_object}  // Updated membership
}
```

#### 3. **Webhook Handler**
```
POST /api/payments/webhook
Headers: X-Razorpay-Signature: {signature}
Body: Razorpay webhook payload
Response: { success: true }

Events handled:
- payment.authorized
- payment.failed
- payment.captured
- refund.created
```

#### 4. **Get Payment History**
```
GET /api/payments/history
Query: page=1&limit=10
Headers: Authorization: Bearer {token}
Response: {
  payments: [{payment_object}],
  total: number,
  pages: number
}
```

#### 5. **Refund Payment**
```
POST /api/payments/:paymentId/refund
Headers: Authorization: Bearer {token}
Body: {
  amount?: number,  // Partial refund
  reason: string
}
Response: {
  refundId: string,
  amount: number,
  status: string
}
```

#### 6. **Get Invoice**
```
GET /api/payments/:paymentId/invoice
Headers: Authorization: Bearer {token}
Response: PDF or JSON invoice data
```

---

## 9. FRONTEND COMPONENTS TO CREATE/MODIFY

### Files to Modify
1. **PaymentPage.jsx** (Enhanced)
   - Integrate Razorpay Checkout
   - Remove manual card form (security risk)
   - Handle payment response
   - Show loading states and errors

2. **MembershipPayments.jsx** (Enhanced)
   - Show payment history from backend
   - Add download invoice functionality
   - Add refund request button
   - Show payment status with badges

### Files to Create
1. **CheckoutModal.jsx**
   - Reusable checkout component
   - Handles Razorpay integration

2. **PaymentStatus.jsx**
   - Shows order details
   - Payment processing status
   - Success/failure messages

3. **InvoiceViewer.jsx**
   - Display invoice details
   - Download as PDF

---

## 10. ENVIRONMENT VARIABLES NEEDED

### Backend .env file additions
```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Webhook Secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Application URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Email Configuration (for receipts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# PDF Generation
PDF_GENERATION_SERVICE=your_service_url  # Optional
```

---

## 11. IMPLEMENTATION PLAN (STEP-BY-STEP)

### Phase 1: Setup & Configuration
- [ ] Create Razorpay account (₹0 setup cost)
- [ ] Get API keys from Razorpay dashboard
- [ ] Add environment variables to .env
- [ ] Install required packages: `npm install razorpay crypto`

### Phase 2: Backend Implementation
- [ ] Create Payment model in MongoDB
- [ ] Create Payment controller with all CRUD operations
- [ ] Create Payment routes
- [ ] Implement webhook handler for Razorpay events
- [ ] Update Membership controller to create Payment records
- [ ] Add error handling and logging

### Phase 3: Frontend Implementation
- [ ] Install Razorpay script in index.html
- [ ] Create CheckoutModal component
- [ ] Enhance PaymentPage.jsx to use Razorpay
- [ ] Create PaymentStatus component
- [ ] Add payment history UI
- [ ] Add invoice download functionality

### Phase 4: Testing & Validation
- [ ] Test with Razorpay test mode
- [ ] Test all payment scenarios (success, failure, etc.)
- [ ] Test webhook handling
- [ ] Security testing (PCI compliance check)
- [ ] User acceptance testing

### Phase 5: Deployment
- [ ] Move to Razorpay production mode
- [ ] Update environment variables
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Monitor payment transactions
- [ ] Setup support for payment failures

---

## 12. SECURITY CONSIDERATIONS

### ✅ Must Implement
1. **Never expose Razorpay Key Secret on frontend**
   - Always verify signatures on backend only
   
2. **Use HTTPS/TLS** for all payment communications
   
3. **Validate & Verify Payment Signatures**
   ```javascript
   const crypto = require('crypto');
   
   const validateSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
     const body = razorpayOrderId + '|' + razorpayPaymentId;
     const expectedSignature = crypto
       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
       .update(body.toString())
       .digest('hex');
     
     return expectedSignature === razorpaySignature;
   };
   ```

4. **PCI DSS Compliance**
   - Store only Razorpay order/payment IDs, never full card details
   - Use tokenization for recurring payments
   - Never log sensitive payment data

5. **Rate Limiting**
   - Implement rate limiting on payment endpoints
   - Prevent brute force attacks

6. **Database Encryption**
   - Encrypt sensitive payment metadata at rest
   - Use MongoDB encryption at database level

7. **Audit Logging**
   - Log all payment transactions
   - Log webhook events
   - Track refunds and disputes

---

## 13. TESTING STRATEGY

### Razorpay Test Mode Credentials
- Use test API keys (provided by Razorpay)
- Test cards provided by Razorpay:
  - **Success:** 4111111111111111 (CVV: any 3 digits, Date: any future date)
  - **Failure:** 4444444444444002
  - **Amount Limit:** 4444333344443333

### Test Scenarios
1. ✅ Successful payment flow
2. ❌ Failed payment handling
3. 🔄 Timeout/Retry scenarios
4. 🔐 Invalid signature handling
5. 🔄 Webhook delivery verification
6. ♻️ Refund processing
7. 📊 Payment history retrieval
8. 🧾 Invoice generation

---

## 14. RECOMMENDED TECH STACK FOR PAYMENT MODULE

### Backend Packages
```json
{
  "razorpay": "^2.9.2",           // Razorpay SDK
  "crypto": "built-in",            // Signature verification
  "nodemailer": "^6.9.7",          // Send payment receipts
  "pdfkit": "^0.13.0",             // Generate PDFs
  "joi": "^17.11.1",               // Request validation
  "helmet": "^7.1.0",              // Security headers
  "express-rate-limit": "^7.1.5"   // Rate limiting
}
```

### Frontend Packages
```json
{
  "react-toastify": "^10.0.0",     // Toast notifications
  "axios": "^1.6.0",               // API calls
  "date-fns": "^2.30.0"            // Date formatting
}
```

---

## 15. QUICK START CHECKLIST FOR CLAUDE

When sharing with Claude AI for implementation advice, provide:

- [ ] Project structure (✅ Done)
- [ ] Current data models (✅ Done)
- [ ] Current payment status (✅ Done)
- [ ] Required payment flows (✅ Done)
- [ ] Selected payment gateway (Razorpay - Recommended)
- [ ] Database schema additions (✅ Done)
- [ ] API endpoints needed (✅ Done)
- [ ] Frontend components needed (✅ Done)
- [ ] Environment configuration (✅ Done)
- [ ] Implementation steps (✅ Done)
- [ ] Security requirements (✅ Done)

---

## 16. ESTIMATED EFFORT & TIMELINE

| Phase | Task | Effort | Days |
|-------|------|--------|------|
| 1 | Setup & Configuration | 1-2 hours | 1 |
| 2 | Backend Implementation | 8-10 hours | 2-3 |
| 3 | Frontend Implementation | 6-8 hours | 2 |
| 4 | Testing & Validation | 4-6 hours | 1-2 |
| 5 | Deployment | 2-3 hours | 1 |
| **Total** | **Full Implementation** | **21-29 hours** | **7-9 days** |

---

## 17. COST BREAKDOWN

| Item | Cost | Notes |
|------|------|-------|
| Razorpay Account | FREE | No setup fee |
| Transaction Fees | 2.36% + GST | For card payments |
| Domain/Hosting | Varies | Not included |
| SSL Certificate | FREE | (if using Let's Encrypt) |
| **Total Setup** | **₹0** | Costs start after payments |

---

## 18. NEXT STEPS

1. ✅ Review this document with your team
2. ✅ Decide on payment gateway (Razorpay recommended)
3. ✅ Create Razorpay account
4. ✅ Get API credentials
5. ✅ Start Phase 1 (Backend setup)
6. ✅ Begin Phase 2 (Backend implementation)
7. ✅ Move to Phase 3 (Frontend implementation)
8. ✅ Test thoroughly in Phase 4
9. ✅ Deploy to production in Phase 5

---

## 19. ADDITIONAL RESOURCES

- **Razorpay Documentation:** https://razorpay.com/docs
- **Razorpay Integration Guide:** https://razorpay.com/docs/payments/integration-guide
- **Razorpay Node.js SDK:** https://github.com/razorpay/razorpay-node
- **PCI DSS Compliance:** https://www.pcisecuritystandards.org
- **Express.js Best Practices:** https://expressjs.com/en/advanced/best-practice-security.html

---

## 20. FREQUENTLY ASKED QUESTIONS (FAQ)

### Q: Why Razorpay over Stripe?
**A:** Razorpay is optimized for Indian market with lower fees, UPI support, and better developer experience for startups.

### Q: Can I store credit cards directly?
**A:** NO - This requires PCI DSS compliance. Always use Razorpay's tokenization for recurring payments.

### Q: What about refunds?
**A:** Razorpay API handles refunds. Processing takes 3-5 working days depending on bank.

### Q: How to handle webhook failures?
**A:** Implement retry logic, queue processing (Bull/BullMQ), and manual verification dashboard.

### Q: Can users save payment methods?
**A:** Yes, via Razorpay's token system for recurring payments. Saves user details securely with Razorpay.

### Q: What about GST/Tax?
**A:** Calculate and display separately. Razorpay returns net amount; you manage tax separately in your system.

---

**Document prepared for Claude AI integration consultation**  
**Contact:** [Your Contact Info]  
**Status:** Ready for implementation

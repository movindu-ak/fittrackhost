# FitTrack Payment Integration - Quick Reference Guide

**For Claude AI Integration Consultation**

---

## 🎯 PROJECT AT A GLANCE

**App:** FitTrack (Gym Management)  
**Stack:** React + Express + MongoDB  
**Payment Needs:** Membership subscriptions + Trainer session bookings  
**Target Market:** India (INR pricing)  
**Recommended Gateway:** Razorpay

---

## 💳 CURRENT PAYMENT MODELS

### Membership Plans (in INR)
- **Basic:** ₹5,000/month (1-month duration)
- **Premium:** ₹10,000/month (6-month duration)  
- **Elite:** ₹100,000/year (12-month duration)

### User Roles
- **Admin** - Full system access
- **Member** - Can book sessions, buy memberships
- **Trainer** - Can accept/confirm bookings

---

## 📊 DATA MODELS INVOLVED

### User
- Uses JWT authentication
- Has membershipId reference
- Roles: admin, trainer, member

### Membership
- Linked to user
- Has `paymentStatus` field (paid/pending/failed)
- Has start/end dates
- Plans: basic, premium, elite

### Booking
- For gym equipment/trainer sessions
- Has status: processing/confirmed/cancelled/completed
- May need payment processing

---

## 🔄 PAYMENT FLOW TO IMPLEMENT

```
User → Select Plan → Payment Page → Razorpay Checkout
                                        ↓
                                    Pay & Get Signature
                                        ↓
                        Backend Verify Signature
                                        ↓
                    Create Payment Record in DB
                                        ↓
                    Update Membership (paymentStatus='paid')
                                        ↓
                    Send Receipt Email
                                        ↓
                    Activate Membership
```

---

## 🛠️ WHAT NEEDS TO BE BUILT

### Backend
1. **Payment Model** (new)
   - Store: Razorpay order ID, payment ID, signature
   - Track: status, payment method, timestamps

2. **Payment Controller** (new)
   - `createOrder()` - Create Razorpay order
   - `verifyPayment()` - Verify signature
   - `handleWebhook()` - Process Razorpay webhooks
   - `getPaymentHistory()` - User payment records
   - `refundPayment()` - Handle refunds

3. **Payment Routes** (new)
   - POST `/api/payments/create-order`
   - POST `/api/payments/verify-payment`
   - POST `/api/payments/webhook`
   - GET `/api/payments/history`
   - POST `/api/payments/:id/refund`

4. **Update Membership Controller**
   - Link payments to memberships
   - Update paymentStatus on verification

### Frontend
1. **PaymentPage.jsx** (enhance)
   - Remove manual card form
   - Add Razorpay Checkout integration
   - Show order summary
   - Handle payment response

2. **CheckoutModal.jsx** (create)
   - Reusable payment component
   - Show loading states
   - Error handling

3. **MembershipPayments.jsx** (enhance)
   - Fetch payment history from backend
   - Show payment status
   - Add invoice download
   - Add refund request

4. **PaymentStatus.jsx** (create)
   - Display transaction details
   - Success/failure messages
   - Retry options

---

## 🔐 SECURITY CHECKLIST

- ✅ Never expose Razorpay Secret Key on frontend
- ✅ Always verify payment signatures on backend
- ✅ Store only order IDs, never full card details
- ✅ Use HTTPS for all payment routes
- ✅ Implement rate limiting on payment endpoints
- ✅ Log all payment transactions
- ✅ Validate webhook signatures
- ✅ Use environment variables for API keys

---

## 📦 PACKAGES TO INSTALL

### Backend
```bash
npm install razorpay crypto nodemailer
```

### Frontend (Optional)
```bash
npm install axios react-toastify
```

---

## 🔑 ENVIRONMENT VARIABLES

### Backend .env
```
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

### Get these from: https://dashboard.razorpay.com/app/keys

---

## 🧪 RAZORPAY TEST CARDS

**Success Payment:**
- Card: 4111111111111111
- CVV: Any 3 digits
- Expiry: Any future date

**Failed Payment:**
- Card: 4444444444444002

---

## 📱 KEY ENDPOINTS SUMMARY

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/payments/create-order` | Create payment order |
| POST | `/api/payments/verify-payment` | Verify & process payment |
| POST | `/api/payments/webhook` | Razorpay webhooks |
| GET | `/api/payments/history` | Payment history |
| POST | `/api/payments/:id/refund` | Request refund |

---

## ⏱️ TYPICAL IMPLEMENTATION TIME

- Backend setup: 2-3 days
- Frontend implementation: 1-2 days
- Testing & QA: 1-2 days
- **Total:** ~5-7 days

---

## 🎓 HOW TO USE THIS WITH CLAUDE AI

1. **For Architecture Advice:**
   - Share PAYMENT_GATEWAY_INTEGRATION_OVERVIEW.md (Section 6-8)

2. **For Backend Implementation:**
   - Ask Claude to create the Payment model
   - Ask Claude to create payment controller functions
   - Ask Claude for webhook handler code

3. **For Frontend Components:**
   - Ask Claude to create CheckoutModal component
   - Ask Claude to enhance PaymentPage with Razorpay

4. **For Security Review:**
   - Ask Claude to review signature verification code
   - Ask Claude for security best practices

5. **For Database Schema:**
   - Ask Claude to create payment transaction model
   - Ask Claude for proper indexing

---

## 📝 CLAUDE AI PROMPT TEMPLATES

### For Backend Payment Model
```
Create a Mongoose schema for payments in FitTrack gym app with fields:
- user reference
- membership reference (optional)
- booking reference (optional)
- amount (in INR)
- Razorpay order/payment/signature IDs
- payment status (created/pending/captured/failed/refunded)
- payment method
- timestamps
Include indexes for better queries
```

### For Payment Verification
```
Write a function to verify Razorpay payment signature using:
- razorpayOrderId
- razorpayPaymentId
- razorpaySignature
- RAZORPAY_KEY_SECRET from env
Use HMAC-SHA256 for verification
```

### For Checkout Component
```
Create a React component that:
1. Shows order summary (membership plan, amount)
2. Integrates Razorpay Checkout script
3. Handles success callback
4. Handles error/failure cases
5. Sends verified payment data to backend
```

---

## 🚀 QUICK START STEPS

1. Create Razorpay account (free): https://razorpay.com
2. Go to Settings → API Keys
3. Copy Key ID and Key Secret
4. Add to .env file
5. Install packages: `npm install razorpay crypto`
6. Ask Claude AI to implement payment controller
7. Ask Claude AI to implement frontend checkout
8. Test with test cards
9. Deploy to production

---

## 💡 TIPS FOR SUCCESS

1. **Start with test mode** - Use Razorpay test keys first
2. **Test all scenarios** - success, failure, timeout
3. **Implement webhooks** - For async payment status updates
4. **Handle errors gracefully** - Show user-friendly messages
5. **Log everything** - Keep audit trail of transactions
6. **Rate limit** - Prevent abuse on payment endpoints
7. **Use transactions** - MongoDB transactions for consistency

---

## ⚠️ COMMON PITFALLS TO AVOID

- ❌ Storing full card details (use Razorpay)
- ❌ Trusting client-side payment verification
- ❌ Not verifying webhook signatures
- ❌ Ignoring failed payment scenarios
- ❌ Missing rate limiting
- ❌ No error handling in payment flow
- ❌ Exposing API secrets in frontend code

---

## 📞 SUPPORT RESOURCES

- Razorpay Docs: https://razorpay.com/docs/payments/
- Razorpay Node SDK: https://github.com/razorpay/razorpay-node
- Razorpay Test Credentials: https://razorpay.com/docs/payments/payments/test-mode
- Community: https://razorpay.com/support/

---

**Last Updated:** May 25, 2026  
**Status:** Ready for Claude AI Implementation

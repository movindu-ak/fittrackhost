import Membership from '../models/Membership.js';
import User from '../models/User.js';

// ─────────────────────────────────────────────────────────
// Plan duration in months
// ─────────────────────────────────────────────────────────
const PLAN_DURATION_MONTHS = { basic: 1, premium: 6, elite: 12 };

// ─────────────────────────────────────────────────────────
// HELPER: Lazy-promote queued memberships whose startDate
//         has arrived. Called before any membership operation.
// ─────────────────────────────────────────────────────────
const promoteQueuedMemberships = async (userId) => {
  const now = new Date();

  const queued = await Membership.findOne({
    user: userId,
    status: 'queued',
    startDate: { $lte: now }
  });

  if (!queued) return;

  // Expire current active memberships
  await Membership.updateMany(
    { user: userId, status: 'active' },
    { $set: { status: 'expired' } }
  );

  // Promote the queued one to active
  queued.status = 'active';
  await queued.save();

  // Update user's membershipId pointer
  await User.findByIdAndUpdate(userId, { membershipId: queued._id });
};

// ─────────────────────────────────────────────────────────
// @desc    Create new membership
//          activationMode = 'immediate' | 'after_expiry'
//          (only relevant when an active membership exists)
// @route   POST /api/memberships
// @access  Private
// ─────────────────────────────────────────────────────────
export const createMembership = async (req, res) => {
  try {
    const { plan, price, activationMode } = req.body;
    const userId = req.user._id;

    // Validate plan
    if (!PLAN_DURATION_MONTHS[plan]) {
      return res.status(400).json({
        message: `Invalid plan. Must be one of: ${Object.keys(PLAN_DURATION_MONTHS).join(', ')}`
      });
    }

    // Lazy-promote any pending queued memberships first
    await promoteQueuedMemberships(userId);

    const now = new Date();

    // Find current active membership (not yet expired)
    const activeMembership = await Membership.findOne({
      user: userId,
      status: 'active',
      endDate: { $gte: now }
    }).sort({ startDate: -1 });

    // Block if a queued membership already exists (prevent stacking)
    const queuedMembership = await Membership.findOne({
      user: userId,
      status: 'queued'
    });

    if (queuedMembership) {
      return res.status(400).json({
        message: 'You already have a membership queued to activate after your current plan. Please wait for it to start before purchasing another.',
        queuedPlan: queuedMembership.plan,
        queuedStartDate: queuedMembership.startDate
      });
    }

    // ── Determine startDate and status ──────────────────────
    let startDate;
    let membershipStatus;
    let previousMembershipId = null;

    if (!activeMembership) {
      // No existing plan → always activate immediately (no choice needed)
      startDate = now;
      membershipStatus = 'active';
    } else {
      // User has an active plan — respect their activation choice
      const chosenMode = activationMode === 'after_expiry' ? 'after_expiry' : 'immediate';

      if (chosenMode === 'immediate') {
        // Expire the current active membership and activate new one now
        activeMembership.status = 'expired';
        await activeMembership.save();

        startDate = now;
        membershipStatus = 'active';
        previousMembershipId = activeMembership._id;
      } else {
        // Queue the new membership to start the day after current expires
        const queueStart = new Date(activeMembership.endDate);
        queueStart.setDate(queueStart.getDate() + 1);
        queueStart.setHours(0, 0, 0, 0);

        startDate = queueStart;
        membershipStatus = 'queued';
        previousMembershipId = activeMembership._id;
      }
    }

    // Calculate end date from the resolved startDate
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (PLAN_DURATION_MONTHS[plan] || 1));

    // Create the membership record
    const membership = await Membership.create({
      user: userId,
      plan,
      startDate,
      endDate,
      price,
      status: membershipStatus,
      previousMembershipId
    });

    // Point user's membershipId to the new one only if it's immediately active
    if (membershipStatus === 'active') {
      await User.findByIdAndUpdate(userId, { membershipId: membership._id });
    }

    res.status(201).json({
      ...membership.toObject(),
      isQueued: membershipStatus === 'queued',
      activatesAfter: membershipStatus === 'queued' ? activeMembership?.endDate : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Get current membership status (active + queued)
// @route   GET /api/memberships/status
// @access  Private
// ─────────────────────────────────────────────────────────
export const getMembershipStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    // Lazy-promote first
    await promoteQueuedMemberships(userId);

    const now = new Date();

    const [active, queued] = await Promise.all([
      Membership.findOne({
        user: userId,
        status: 'active',
        endDate: { $gte: now }
      }).sort({ startDate: -1 }),
      Membership.findOne({ user: userId, status: 'queued' })
    ]);

    res.json({ active: active || null, queued: queued || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Get user's most recent membership
// @route   GET /api/memberships/my
// @access  Private
// ─────────────────────────────────────────────────────────
export const getUserMembership = async (req, res) => {
  try {
    await promoteQueuedMemberships(req.user._id);

    const membership = await Membership.findOne({ user: req.user._id })
      .sort({ createdAt: -1 });

    if (!membership) {
      return res.status(404).json({ message: 'No membership found' });
    }

    res.json(membership);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Get all memberships (Admin)
// @route   GET /api/memberships
// @access  Private/Admin
// ─────────────────────────────────────────────────────────
export const getAllMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find()
      .populate('user', 'name email phone')
      .populate('previousMembershipId', 'plan startDate endDate status')
      .sort({ createdAt: -1 });
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Update payment status
// @route   PUT /api/memberships/:id/payment
// @access  Private
// ─────────────────────────────────────────────────────────
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const membership = await Membership.findById(req.params.id);

    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }

    membership.paymentStatus = paymentStatus;
    await membership.save();

    res.json(membership);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

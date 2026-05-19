// usage-tracker.js - Track AI usage events and deduct message credits

import {
  calculateMessagesUsed,
  calculateProviderCost,
  estimateRevenue,
  usdToMessages,
} from './pricing.js';

let _prisma = null;

function getPrisma() {
  if (_prisma) return _prisma;
  // Lazy-import the same shared prisma from bot-routes
  return _prisma;
}

export function setTrackerPrisma(prismaInstance) {
  _prisma = prismaInstance;
}

/**
 * Track a single AI usage event.
 * Deducts messages from user balance and records all data.
 */
export async function trackUsage({ userId, botId, provider, model, inputTokens, outputTokens }) {
  if (!_prisma) {
    console.error('[UsageTracker] Prisma not initialized');
    return null;
  }

  const totalTokens = inputTokens + outputTokens;
  const messagesUsed = calculateMessagesUsed(totalTokens);
  const providerCost = calculateProviderCost(inputTokens, outputTokens);
  const revenue = estimateRevenue(messagesUsed);

  try {
    // Create AIUsage record
    const usageRecord = await _prisma.aIUsage.create({
      data: {
        userId,
        botId,
        provider,
        model,
        inputTokens,
        outputTokens,
        totalTokens,
        messagesUsed,
        providerCost,
        estimatedRevenue: revenue,
      },
    });

    // Update user message balance atomically
    await _prisma.user.update({
      where: { id: userId },
      data: {
        messagesRemaining: { decrement: messagesUsed },
        totalMessagesUsed: { increment: messagesUsed },
      },
    });

    // Create a transaction record
    await _prisma.messageTransaction.create({
      data: {
        userId,
        amount: -messagesUsed,
        type: 'usage',
        description: `AI response via ${provider} (${model})`,
        model,
        inputTokens,
        outputTokens,
        totalTokens,
        messagesUsed,
        providerCost,
        estimatedRevenue: revenue,
      },
    });

    console.log(`[UsageTracker] userId=${userId} botId=${botId} tokens=${totalTokens} messages=${messagesUsed} cost=$${providerCost.toFixed(6)}`);
    return { messagesUsed, providerCost, estimatedRevenue: revenue };
  } catch (err) {
    console.error('[UsageTracker] Error tracking usage:', err);
    return null;
  }
}

/**
 * Check if user has enough messages to make a request.
 */
export async function hasEnoughMessages(userId) {
  if (!_prisma) return true; // fail open if not initialized
  try {
    const user = await _prisma.user.findUnique({
      where: { id: userId },
      select: { messagesRemaining: true },
    });
    return user ? user.messagesRemaining > 0 : false;
  } catch {
    return true; // fail open
  }
}

/**
 * Add messages to a user's balance (purchases, bonuses, refunds).
 */
export async function addMessages(userId, amount, description = 'Message top-up', type = 'purchase') {
  if (!_prisma) return null;
  try {
    await _prisma.user.update({
      where: { id: userId },
      data: { messagesRemaining: { increment: amount } },
    });

    await _prisma.messageTransaction.create({
      data: {
        userId,
        amount,
        type,
        description,
      },
    });

    return { success: true };
  } catch (err) {
    console.error('[UsageTracker] Error adding messages:', err);
    return null;
  }
}

// pricing.js - Message-based billing configuration

const TOKENS_PER_MESSAGE = 10_000;
const MESSAGES_PER_DOLLAR = 100; // $10 = 1,000 messages
const PLATFORM_MARKUP = 2.0;

// Gemini 3.1 Flash-Lite pricing (per million tokens)
const INPUT_COST_PER_MILLION = 0.25;
const OUTPUT_COST_PER_MILLION = 1.50;

/**
 * Calculate how many messages are consumed based on total tokens.
 * 1 message = up to 10,000 tokens.
 */
export function calculateMessagesUsed(totalTokens) {
  return Math.ceil(totalTokens / TOKENS_PER_MESSAGE);
}

/**
 * Calculate the raw provider cost in USD.
 */
export function calculateProviderCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
  return inputCost + outputCost;
}

/**
 * Convert USD amount to number of messages purchased.
 */
export function usdToMessages(usd) {
  return Math.floor(usd * MESSAGES_PER_DOLLAR);
}

/**
 * Estimate platform revenue from messages used.
 * $1 = 100 messages, so each message = $0.01 revenue.
 */
export function estimateRevenue(messagesUsed) {
  return messagesUsed / MESSAGES_PER_DOLLAR;
}

export const PRICING_CONFIG = {
  TOKENS_PER_MESSAGE,
  MESSAGES_PER_DOLLAR,
  PLATFORM_MARKUP,
  INPUT_COST_PER_MILLION,
  OUTPUT_COST_PER_MILLION,
};

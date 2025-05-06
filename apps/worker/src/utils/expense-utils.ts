/**
 * Extract expense information from text
 * @param text Text containing expense information
 * @returns Extracted expense details
 */
export async function extractExpenseInfoFromText(
  text: string
): Promise<{
  title?: string;
  totalAmount: number;
  participants: string[];
  items?: Array<{
    name: string;
    amount: number;
  }>;
}> {
  // Extract title
  const titleMatch = text.match(/タイトル[:：]?\s*(.+?)(?:\n|$)/i) ||
                     text.match(/イベント名[:：]?\s*(.+?)(?:\n|$)/i) ||
                     text.match(/名称[:：]?\s*(.+?)(?:\n|$)/i);
  
  const title = titleMatch ? titleMatch[1].trim() : undefined;
  
  // Extract total amount
  const amountMatches = text.match(/(?:合計|総額|金額|全額|支払い)[:：]?\s*(\d{1,3}(?:,\d{3})*|\d+)円/) ||
                        text.match(/(\d{1,3}(?:,\d{3})*|\d+)円/) ||
                        text.match(/金額[:：]?\s*(\d{1,3}(?:,\d{3})*|\d+)/);
  
  let totalAmount = 0;
  if (amountMatches) {
    // Remove commas before parsing
    totalAmount = parseInt(amountMatches[1].replace(/,/g, ''));
  }
  
  // Extract participants
  const participantsMatch = text.match(/(?:参加者|メンバー|人)[:：]?\s*(.+?)(?:\n|$)/i);
  
  let participants: string[] = [];
  if (participantsMatch) {
    // Split by various delimiters (comma, space, Japanese commas, etc.)
    participants = participantsMatch[1]
      .split(/[,、\s]/)
      .map(p => p.trim())
      .filter(p => p && p !== '、' && p !== ',');
  } else {
    // Try extracting names directly
    const nameMatches = text.match(/[ぁ-んァ-ン一-龥]\s*(?:さん|君|くん|ちゃん|様|氏)/g);
    if (nameMatches) {
      participants = nameMatches.map(name => name.trim());
    }
  }
  
  // If no participants found, use a default
  if (participants.length === 0) {
    participants = ['自分'];
  }
  
  // Extract individual expense items
  const itemRegex = /(.+?)[:：]?\s*(\d{1,3}(?:,\d{3})*|\d+)円/g;
  const items: Array<{ name: string; amount: number }> = [];
  
  let itemMatch;
  while ((itemMatch = itemRegex.exec(text)) !== null) {
    const itemName = itemMatch[1].trim();
    const itemAmount = parseInt(itemMatch[2].replace(/,/g, ''));
    
    // Skip if we mistakenly matched the total amount again
    if (itemName.match(/合計|総額|金額|全額|支払い/i)) {
      continue;
    }
    
    items.push({
      name: itemName,
      amount: itemAmount
    });
  }
  
  // If items were found but total amount wasn't, calculate it
  if (items.length > 0 && totalAmount === 0) {
    totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  }
  
  // Ensure we have a reasonable total amount
  if (totalAmount === 0) {
    // This is just a fallback to ensure we don't have a zero amount
    totalAmount = 1000;
  }
  
  return {
    title,
    totalAmount,
    participants,
    items: items.length > 0 ? items : undefined
  };
}

/**
 * Calculate even split of expenses
 * @param totalAmount Total amount to split
 * @param participantCount Number of participants
 * @returns Individual amount
 */
export function calculateEvenSplit(totalAmount: number, participantCount: number): number {
  // Round up to ensure we're not undercollecting
  return Math.ceil(totalAmount / participantCount);
}

/**
 * Calculate weighted split of expenses
 * @param totalAmount Total amount to split
 * @param weights Weight for each participant (can be percentages or ratios)
 * @returns Amount for each participant
 */
export function calculateWeightedSplit(
  totalAmount: number,
  weights: number[]
): number[] {
  // Calculate the sum of all weights
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  // Calculate individual amounts based on weights
  return weights.map(weight => {
    const ratio = weight / totalWeight;
    return Math.ceil(totalAmount * ratio);
  });
}

/**
 * Calculate item-based split of expenses
 * @param items Array of expense items
 * @param participantItems Map of participants to the items they consume
 * @returns Amount for each participant
 */
export function calculateItemBasedSplit(
  items: Array<{ name: string; amount: number }>,
  participantItems: Record<string, string[]>
): Record<string, number> {
  const result: Record<string, number> = {};
  
  // Initialize result with zero amounts
  Object.keys(participantItems).forEach(participant => {
    result[participant] = 0;
  });
  
  // Process each item
  items.forEach(item => {
    // Find participants who consume this item
    const consumingParticipants = Object.entries(participantItems)
      .filter(([_, itemList]) => itemList.includes(item.name))
      .map(([participant]) => participant);
    
    if (consumingParticipants.length === 0) {
      // If no specific participants found, split evenly among all
      const perPersonAmount = Math.ceil(item.amount / Object.keys(participantItems).length);
      Object.keys(participantItems).forEach(participant => {
        result[participant] += perPersonAmount;
      });
    } else {
      // Split among consuming participants
      const perPersonAmount = Math.ceil(item.amount / consumingParticipants.length);
      consumingParticipants.forEach(participant => {
        result[participant] += perPersonAmount;
      });
    }
  });
  
  return result;
}

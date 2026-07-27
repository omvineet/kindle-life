/**
 * Inventory engine — collectible "keepsakes" a Seeker gathers along the way.
 * Deliberately no equipment slots, stat bonuses, or rarity tiers: items are
 * mementos of the journey, never mechanical power.
 */

import type { CollectibleItem, ContentPack, PlayerState } from "../types";

export interface AddItemResult {
  state: PlayerState;
  /** False when the item was already held — adding is idempotent. */
  gained: boolean;
}

export function addItem(state: PlayerState, itemId: string): AddItemResult {
  if (state.inventory.includes(itemId)) {
    return { state, gained: false };
  }
  return { state: { ...state, inventory: [...state.inventory, itemId] }, gained: true };
}

export function hasItem(state: PlayerState, itemId: string): boolean {
  return state.inventory.includes(itemId);
}

export function listInventory(pack: ContentPack, state: PlayerState): CollectibleItem[] {
  return pack.items.filter((item) => state.inventory.includes(item.id));
}

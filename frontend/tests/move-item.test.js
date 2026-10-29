import { describe, expect, it } from 'vitest';
import { moveItem } from '../src/utils/move-item.js';

describe('moveItem', () => {
  it('move o item para a nova posição sem alterar a lista original', () => {
    const items = ['a', 'b', 'c'];

    expect(moveItem(items, 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveItem(items, 2, 1)).toEqual(['a', 'c', 'b']);
    expect(items).toEqual(['a', 'b', 'c']);
  });

  it('ignora movimentos para fora da lista', () => {
    const items = ['a', 'b'];

    expect(moveItem(items, 0, -1)).toBe(items);
    expect(moveItem(items, 1, 2)).toBe(items);
  });
});

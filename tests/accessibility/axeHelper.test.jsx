import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { getViolations, formatViolations } from './axeHelper.js';

describe('axe harness', () => {
  it('detects a deliberate violation', async () => {
    const { container } = render(
      <div>
        <img src="/photo.png" />
      </div>
    );

    const violations = await getViolations(container);
    expect(violations.map((v) => v.id)).toContain('image-alt');
  });

  it('reports nothing for a correctly marked up element', async () => {
    const { container } = render(
      <div>
        <img src="/photo.png" alt="A city skyline at dusk" />
      </div>
    );

    const violations = await getViolations(container);
    expect(violations, formatViolations(violations)).toEqual([]);
  });
});

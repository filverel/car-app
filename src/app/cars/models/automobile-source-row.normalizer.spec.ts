import type { AutomobileSourceRow } from './automobile-source-row.model';
import { normalizeAutomobileSourceRow } from './automobile-source-row.normalizer';

describe('normalizeAutomobileSourceRow', () => {
  const validRow: AutomobileSourceRow = {
    Name: ' chevrolet chevelle malibu ',
    MPG: '18',
    Cylinders: '8',
    Displacement: '307',
    Horsepower: '130',
    Weight: '3504',
    Acceleration: '12',
    'Model Year': '70',
    Origin: '1',
  };

  it('normalizes a valid source row', () => {
    const result = normalizeAutomobileSourceRow(validRow);

    expect(result).toEqual({
      ok: true,
      value: {
        name: 'chevrolet chevelle malibu',
        mpg: 18,
        cylinders: 8,
        displacement: 307,
        horsepower: 130,
        weight: 3504,
        acceleration: 12,
        modelYear: 1970,
        origin: 'usa',
      },
    });
  });

  it('represents missing horsepower as null', () => {
    const result = normalizeAutomobileSourceRow({
      ...validRow,
      Horsepower: '?',
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error('Expected normalization to succeed');
    }

    expect(result.value.horsepower).toBeNull();
  });

  it.each([
    ['1', 'usa'],
    ['USA', 'usa'],
    ['2', 'europe'],
    ['Europe', 'europe'],
    ['3', 'japan'],
    ['Japan', 'japan'],
    ['unexpected', 'other'],
  ])('maps origin %s to %s', (sourceOrigin, expectedOrigin) => {
    const result = normalizeAutomobileSourceRow({
      ...validRow,
      Origin: sourceOrigin,
    });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error('Expected normalization to succeed');
    }

    expect(result.value.origin).toBe(expectedOrigin);
  });

  it('rejects malformed optional numeric values', () => {
    const result = normalizeAutomobileSourceRow({
      ...validRow,
      Horsepower: 'strong',
    });

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error('Expected normalization to fail');
    }

    expect(result.errors).toContain('Horsepower must be a number or a missing value');
  });

  it('returns all errors for invalid required values', () => {
    const result = normalizeAutomobileSourceRow({
      ...validRow,
      Name: '   ',
      Cylinders: 'many',
      'Model Year': 'unknown',
    });

    expect(result.ok).toBe(false);

    if (result.ok) {
      throw new Error('Expected normalization to fail');
    }

    expect(result.errors).toEqual([
      'Name is required',
      'Cylinders must be a number',
      'Model Year must be a number',
    ]);
  });
});

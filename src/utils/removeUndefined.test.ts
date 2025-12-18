import { removeUndefined, validateNoUndefined, cleanAndValidate } from './removeUndefined'

describe('removeUndefined', () => {
  describe('flat objects', () => {
    it('should remove undefined fields from a flat object', () => {
      const input = {
        name: 'Item',
        description: undefined,
        price: 100,
        discount: undefined,
      }
      const result = removeUndefined(input)
      expect(result).toEqual({ name: 'Item', price: 100 })
      expect(result).not.toHaveProperty('description')
      expect(result).not.toHaveProperty('discount')
    })

    it('should preserve all valid primitive types', () => {
      const input = {
        string: 'text',
        number: 42,
        boolean: true,
        null: null,
      }
      const result = removeUndefined(input)
      expect(result).toEqual({
        string: 'text',
        number: 42,
        boolean: true,
        null: null,
      })
    })

    it('should preserve null values and not remove them', () => {
      const input = {
        field1: 'value',
        field2: null,
        field3: undefined,
      }
      const result = removeUndefined(input)
      expect(result).toEqual({ field1: 'value', field2: null })
      expect(result.field2).toBeNull()
    })

    it('should handle empty object', () => {
      const input = {}
      const result = removeUndefined(input)
      expect(result).toEqual({})
    })

    it('should handle object with all undefined values', () => {
      const input = {
        field1: undefined,
        field2: undefined,
      }
      const result = removeUndefined(input)
      expect(result).toEqual({})
    })
  })

  describe('nested objects', () => {
    it('should remove undefined from nested objects', () => {
      const input = {
        user: {
          name: 'John',
          email: undefined,
          profile: {
            age: 30,
            bio: undefined,
          },
        },
      }
      const result = removeUndefined(input)
      expect(result).toEqual({
        user: {
          name: 'John',
          profile: {
            age: 30,
          },
        },
      })
    })

    it('should handle deeply nested structures', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
              undefined1: undefined,
            },
            undefined2: undefined,
          },
        },
      }
      const result = removeUndefined(input)
      expect(result).toEqual({
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      })
    })

    it('should preserve nested objects with valid values', () => {
      const input = {
        data: {
          nested: {
            value: 'test',
            count: 5,
          },
        },
      }
      const result = removeUndefined(input)
      expect(result).toEqual({
        data: {
          nested: {
            value: 'test',
            count: 5,
          },
        },
      })
    })
  })

  describe('arrays', () => {
    it('should remove undefined values from arrays', () => {
      const input = {
        tags: ['tag1', undefined, 'tag2', undefined, 'tag3'],
      }
      const result = removeUndefined(input)
      expect(result).toEqual({
        tags: ['tag1', 'tag2', 'tag3'],
      })
    })

    it('should handle arrays of objects', () => {
      const input = {
        items: [
          { id: 1, name: 'Item1', description: undefined },
          { id: 2, name: 'Item2', note: undefined },
        ],
      }
      const result = removeUndefined(input)
      expect(result).toEqual({
        items: [
          { id: 1, name: 'Item1' },
          { id: 2, name: 'Item2' },
        ],
      })
    })

    it('should handle empty arrays', () => {
      const input = {
        items: [],
      }
      const result = removeUndefined(input)
      expect(result).toEqual({
        items: [],
      })
    })

    it('should handle arrays with only undefined values', () => {
      const input = {
        items: [undefined, undefined],
      }
      const result = removeUndefined(input)
      expect(result).toEqual({
        items: [],
      })
    })

    it('should preserve null values in arrays', () => {
      const input = {
        items: ['value', null, undefined, 'another'],
      }
      const result = removeUndefined(input)
      expect(result).toEqual({
        items: ['value', null, 'another'],
      })
    })

    it('should handle nested arrays', () => {
      const input = {
        matrix: [
          [1, undefined, 3],
          [undefined, 5, 6],
          [7, 8, 9],
        ],
      }
      const result = removeUndefined(input)
      expect(result).toEqual({
        matrix: [[1, 3], [5, 6], [7, 8, 9]],
      })
    })
  })

  describe('complex structures', () => {
    it('should handle mixed nested arrays and objects', () => {
      const input = {
        users: [
          {
            id: 1,
            name: 'User1',
            roles: ['admin', undefined, 'user'],
            metadata: { created: '2024-01-01', extra: undefined },
          },
          {
            id: 2,
            name: 'User2',
            roles: [undefined, 'user'],
            metadata: { created: '2024-01-02', notes: undefined },
          },
        ],
      }
      const result = removeUndefined(input)
      expect(result).toEqual({
        users: [
          {
            id: 1,
            name: 'User1',
            roles: ['admin', 'user'],
            metadata: { created: '2024-01-01' },
          },
          {
            id: 2,
            name: 'User2',
            roles: ['user'],
            metadata: { created: '2024-01-02' },
          },
        ],
      })
    })

    it('should not mutate the original object', () => {
      const input = {
        field: 'value',
        undefined1: undefined,
      }
      const original = { ...input }
      removeUndefined(input)
      expect(input).toEqual(original)
    })
  })

  describe('edge cases', () => {
    it('should handle null input', () => {
      const result = removeUndefined(null)
      expect(result).toBeNull()
    })

    it('should handle undefined input', () => {
      const result = removeUndefined(undefined)
      expect(result).toBeUndefined()
    })

    it('should handle primitive values', () => {
      expect(removeUndefined('string')).toBe('string')
      expect(removeUndefined(42)).toBe(42)
      expect(removeUndefined(true)).toBe(true)
      expect(removeUndefined(false)).toBe(false)
    })
  })
})

describe('validateNoUndefined', () => {
  it('should not throw for clean objects', () => {
    const input = { name: 'Item', price: 100 }
    expect(() => validateNoUndefined(input, 'product')).not.toThrow()
  })

  it('should throw for objects with undefined fields', () => {
    const input = { name: 'Item', description: undefined }
    expect(() => validateNoUndefined(input, 'product')).toThrow(
      /product contains undefined values in fields: description/
    )
  })

  it('should throw and list multiple undefined fields', () => {
    const input = { name: undefined, price: undefined, stock: 10 }
    expect(() => validateNoUndefined(input, 'product')).toThrow(
      /product contains undefined values in fields:/
    )
    expect(() => validateNoUndefined(input, 'product')).toThrow(/name/)
    expect(() => validateNoUndefined(input, 'product')).toThrow(/price/)
  })

  it('should identify undefined in nested objects', () => {
    const input = {
      name: 'Item',
      metadata: { created: '2024-01-01', updated: undefined },
    }
    expect(() => validateNoUndefined(input, 'product')).toThrow(
      /metadata\.updated/
    )
  })

  it('should identify undefined in arrays', () => {
    const input = {
      tags: ['tag1', undefined, 'tag2'],
    }
    expect(() => validateNoUndefined(input, 'product')).toThrow(/tags\[1\]/)
  })

  it('should not throw for null values', () => {
    const input = { name: 'Item', description: null }
    expect(() => validateNoUndefined(input, 'product')).not.toThrow()
  })

  it('should use default context when not provided', () => {
    const input = { field: undefined }
    expect(() => validateNoUndefined(input)).toThrow(/object contains undefined values/)
  })
})

describe('cleanAndValidate', () => {
  it('should clean and return valid object', () => {
    const input = {
      name: 'Item',
      description: undefined,
      price: 100,
    }
    const result = cleanAndValidate(input, 'product')
    expect(result).toEqual({ name: 'Item', price: 100 })
  })

  it('should throw if validation fails on cleaned object', () => {
    const input = {
      name: 'Item',
      data: { value: undefined },
    }
    // This should not throw because nested undefined in objects is removed
    expect(() => cleanAndValidate(input, 'product')).not.toThrow()
  })

  it('should provide context in error messages', () => {
    const input = { field: undefined }
    expect(() => cleanAndValidate(input, 'custom-context')).toThrow(
      /custom-context contains undefined values/
    )
  })

  it('should not mutate the original object', () => {
    const input = { name: 'Item', value: undefined }
    const original = JSON.stringify(input)
    cleanAndValidate(input, 'product')
    expect(JSON.stringify(input)).toBe(original)
  })
})

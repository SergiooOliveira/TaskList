import { TYPE_COLORS, typeColor } from './typeColor'

it('gives a palette colour that ignores case and surrounding spaces', () => {
  expect(TYPE_COLORS).toContain(typeColor('Vinyls'))
  expect(typeColor('Vinyls')).toBe(typeColor(' vinyls '))
})

it('spreads common names over several colours', () => {
  const names = ['Books', 'Vinyls', 'Games', 'Comics', 'Plants', 'Kitchen', 'Camera', 'Clothes', 'Shoes', 'Lego']
  expect(new Set(names.map(typeColor)).size).toBeGreaterThanOrEqual(5)
})

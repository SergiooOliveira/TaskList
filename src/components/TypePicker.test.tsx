import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import TypePicker from './TypePicker'

const types = ['Books', 'Games', 'Vinyls']
function Harness({ start = '' }: { start?: string }) {
  const [v, setV] = useState(start)
  return <><TypePicker value={v} onChange={setV} types={types} /><output>{v}</output></>
}
const input = () => screen.getByRole('combobox')
const optionNames = () => screen.queryAllByRole('option').map((o) => o.textContent)

it('opens with every type on focus', () => {
  render(<Harness />)
  expect(screen.queryByRole('listbox')).toBeNull()
  fireEvent.focus(input())
  expect(optionNames()).toEqual(types)
})

it('filters as you type, ignoring case', () => {
  render(<Harness />)
  fireEvent.change(input(), { target: { value: 'IN' } })
  expect(optionNames()).toEqual(['Vinyls', 'Create “IN”'])
})

it('offers Create for a new name and assigns it', () => {
  render(<Harness />)
  fireEvent.change(input(), { target: { value: ' Comics ' } })
  expect(optionNames()).toEqual(['Create “Comics”'])
  fireEvent.click(screen.getByRole('option', { name: 'Create “Comics”' }))
  expect(input()).toHaveValue('Comics')
  expect(screen.queryByRole('listbox')).toBeNull()
})

it('does not offer Create when the name already exists in another case', () => {
  render(<Harness />)
  fireEvent.change(input(), { target: { value: 'vinyls' } })
  expect(optionNames()).toEqual(['Vinyls'])
})

it('picks with arrow keys and Enter, and Escape closes only the list', () => {
  render(<Harness />)
  fireEvent.focus(input())
  fireEvent.keyDown(input(), { key: 'ArrowDown' })
  const enter = fireEvent.keyDown(input(), { key: 'Enter' })
  expect(enter).toBe(false) // default prevented, so the form is not submitted
  expect(input()).toHaveValue('Games')
  fireEvent.focus(input())
  expect(fireEvent.keyDown(input(), { key: 'Escape' })).toBe(false)
  expect(screen.queryByRole('listbox')).toBeNull()
})

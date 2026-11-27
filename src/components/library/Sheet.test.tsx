import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Sheet, { SheetHead } from './Sheet'

afterEach(cleanup)

const setup = () => {
  const onClose = vi.fn()
  render(
    <Sheet label="Panel" onClose={onClose}>
      <SheetHead title="Series" sub="Author" onClose={onClose} />
      <div className="sheet-list"><a href="#/item/a">Book A</a></div>
    </Sheet>,
  )
  return onClose
}
const drag = (el: Element, dy: number, ms = 300) => {
  const now = vi.spyOn(performance, 'now').mockReturnValue(1000)
  fireEvent.pointerDown(el, { clientY: 100, pointerId: 1 })
  now.mockReturnValue(1000 + ms / 2)
  fireEvent.pointerMove(el, { clientY: 100 + dy / 2, pointerId: 1 })
  now.mockReturnValue(1000 + ms)
  fireEvent.pointerMove(el, { clientY: 100 + dy, pointerId: 1 })
  fireEvent.pointerUp(el, { clientY: 100 + dy, pointerId: 1 })
  now.mockRestore()
}

it('dragging the header down past the threshold closes the sheet', () => {
  const onClose = setup()
  drag(screen.getByText('Series'), 120)
  expect(onClose).toHaveBeenCalled()
})

it('a short slow drag springs back instead of closing', () => {
  const onClose = setup()
  drag(screen.getByText('Series'), 30)
  expect(onClose).not.toHaveBeenCalled()
  expect(screen.getByRole('dialog').style.transform).toBe('')
})

it('a fast flick closes even when short', () => {
  const onClose = setup()
  drag(screen.getByText('Series'), 40, 40)
  expect(onClose).toHaveBeenCalled()
})

it('dragging the list does not move the sheet', () => {
  const onClose = setup()
  drag(screen.getByText('Book A'), 200)
  expect(onClose).not.toHaveBeenCalled()
})

it('following a link inside closes the sheet', () => {
  const onClose = setup()
  fireEvent.click(screen.getByRole('link', { name: 'Book A' }))
  expect(onClose).toHaveBeenCalled()
})

it('closes when the route changes', () => {
  const onClose = setup()
  window.dispatchEvent(new HashChangeEvent('hashchange'))
  expect(onClose).toHaveBeenCalled()
})

it('the click that ends a short drag does not count as a backdrop tap', () => {
  const onClose = setup()
  drag(screen.getByText('Series'), 30)
  fireEvent.click(screen.getByRole('dialog'))
  expect(onClose).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('dialog')) // a real backdrop tap afterwards still closes
  expect(onClose).toHaveBeenCalled()
})

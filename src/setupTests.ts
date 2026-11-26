import '@testing-library/jest-dom/vitest'

// jsdom has no <dialog> modal support yet.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.setAttribute('open', '') }
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.removeAttribute('open'); this.dispatchEvent(new Event('close')) }
// jsdom doesn't implement scrolling.
window.scrollTo = () => {}

import { render, screen } from '@testing-library/react'
import App from './App'
import { expect, test } from 'vitest'

test('renders Vite + React heading', () => {
  render(<App />)
  const headingElement = screen.getByText(/Vite \+ React/i)
  expect(headingElement).toBeInTheDocument()
})

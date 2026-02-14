import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { expect, test } from 'vitest'

test('renders Header title', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  )
  const titleElement = screen.getByRole('heading', { name: /wwe2kHub/i, level: 1 })
  expect(titleElement).toBeInTheDocument()
})

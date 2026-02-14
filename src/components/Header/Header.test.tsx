import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Header from './Header'

describe('Header Component', () => {
  it('renders the title', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    expect(screen.getByText(/wwe2kHub/i)).toBeInTheDocument()
  })

  it('renders navigation buttons', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument()
  })

  it('is fixed to the top', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    const headerElement = screen.getByRole('banner')
    expect(headerElement).toHaveStyle({ position: 'fixed', top: '0' })
  })
})

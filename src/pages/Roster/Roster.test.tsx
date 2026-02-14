import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import Roster from './Roster'
import { db } from '../../db/db'

describe('Roster Page', () => {
  beforeEach(async () => {
    await db.brands.clear();
    await db.wrestlers.clear();
    await db.championships.clear();
  });

  it('renders the three brand columns after loading', async () => {
    render(
      <MemoryRouter>
        <Roster />
      </MemoryRouter>
    )

    // Check for RAW, SMACKDOWN, NXT (using exact match for alt text)
    await waitFor(() => {
      expect(screen.getByAltText("RAW")).toBeInTheDocument();
      expect(screen.getByAltText("SMACKDOWN")).toBeInTheDocument();
      expect(screen.getByAltText("NXT")).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders dummy wrestlers in their columns', async () => {
    render(
      <MemoryRouter>
        <Roster />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Seth Rollins/i)).toBeInTheDocument();
      expect(screen.getByText(/Cody Rhodes/i)).toBeInTheDocument();
    });
  });

  it('prevents duplicate brands from rendering even if they exist in DB', async () => {
    // Manually inject TWO duplicate brand entries before rendering
    await db.brands.add({ 
      name: 'RAW', 
      primaryColor: '#ff0000', 
      secondaryColor: '#000000', 
      logo: 'fake-logo-1' 
    });
    await db.brands.add({ 
      name: 'RAW', 
      primaryColor: '#ff0000', 
      secondaryColor: '#000000', 
      logo: 'fake-logo-2' 
    });
    
    render(
      <MemoryRouter>
        <Roster />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Should find exactly 1, but without consolidation it will find 2
      const rawColumns = screen.getAllByAltText("RAW");
      expect(rawColumns).toHaveLength(1);
    }, { timeout: 3000 });
  });
})

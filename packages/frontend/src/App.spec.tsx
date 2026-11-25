import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import * as service from './lib/lunch-service';
import { teamDay } from './lib/lunch';

vi.mock('./lib/lunch-service', () => ({
  readLunch: vi.fn(), savePlace: vi.fn(), deletePlace: vi.fn(),
  saveVote: vi.fn(), deleteVote: vi.fn(),
}));

const place = { id: 'place-1', name: 'Corner Kitchen', cuisine: 'Brazilian', budget: '$$', note: 'Around the corner', owner_id: 'me' };
const secondPlace = { ...place, id: 'place-2', name: 'Garden Cafe', cuisine: 'Cafe', owner_id: 'teammate' };
const snapshot = () => ({ places: [place, secondPlace], ballots: [], myBallot: null, userId: 'me' });

describe('Lunch Picker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    Element.prototype.scrollIntoView = vi.fn();
    vi.mocked(service.readLunch).mockResolvedValue(snapshot());
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('starts honestly empty and saves the first suggestion', async () => {
    vi.mocked(service.readLunch).mockResolvedValue({ ...snapshot(), places: [] });
    vi.mocked(service.savePlace).mockResolvedValue(place);
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Suggest the first spot' }));
    fireEvent.change(screen.getByLabelText(/Place name/), { target: { value: '  Corner Kitchen  ' } });
    fireEvent.submit(screen.getByRole('form'));
    await screen.findByText('New spot on the menu. Nice find!');
    expect(screen.getByRole('heading', { name: place.name })).toBeVisible();
    expect(service.savePlace).toHaveBeenCalledWith(
      { name: place.name, cuisine: 'Anything tasty', budget: '$$', note: '' }, undefined,
    );
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    expect(screen.getByText('0 teammates have voted today')).toBeVisible();
  });

  it('keeps form input and removes the optimistic suggestion when saving fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(service.savePlace).mockRejectedValue(new Error('Network failed'));
    render(<App />);
    await screen.findByRole('heading', { name: place.name });
    fireEvent.click(screen.getByRole('button', { name: 'Suggest a spot' }));
    fireEvent.change(screen.getByLabelText(/Place name/), { target: { value: 'Not Saved' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(await screen.findByRole('alert')).toHaveTextContent('not saved');
    expect(screen.getByLabelText(/Place name/)).toHaveValue('Not Saved');
    expect(screen.queryByRole('heading', { name: 'Not Saved' })).not.toBeInTheDocument();
    vi.mocked(console.error).mockRestore();
  });

  it('changes the existing daily vote instead of adding a second vote', async () => {
    const ballot = { id: 'ballot-1', owner_id: 'me', day: teamDay(), place_id: place.id };
    vi.mocked(service.readLunch).mockResolvedValue({ ...snapshot(), ballots: [ballot], myBallot: ballot });
    vi.mocked(service.saveVote).mockResolvedValue({ ...ballot, place_id: secondPlace.id });
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: `Vote for ${secondPlace.name}` }));
    await waitFor(() => expect(service.saveVote).toHaveBeenCalledWith(teamDay(), secondPlace.id, ballot));
    expect(await screen.findByText('Vote saved! Good taste, by the way.')).toBeVisible();
    expect(screen.getByText('1 teammate has voted today')).toBeVisible();
    expect(screen.getByRole('button', { name: `Voted for ${secondPlace.name}` })).toBeDisabled();
    expect(screen.getByRole('button', { name: `Vote for ${place.name}` })).toBeEnabled();
  });

  it('rolls a failed vote back and offers an explicit refresh', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(service.saveVote).mockRejectedValue(new Error('Denied'));
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: `Vote for ${place.name}` }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Your previous choice is safe');
    expect(screen.getByText('0 teammates have voted today')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Refresh the board' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: `Vote for ${place.name}` })).toBeEnabled();
    vi.mocked(console.error).mockRestore();
  });

  it('shows a real tie and filters suggestions without changing the winner', async () => {
    vi.mocked(service.readLunch).mockResolvedValue({
      ...snapshot(),
      ballots: [
        { id: 'a', owner_id: 'me', day: teamDay(), place_id: place.id },
        { id: 'b', owner_id: 'them', day: teamDay(), place_id: secondPlace.id },
      ],
    });
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'It’s a tie!' })).toBeVisible();
    fireEvent.change(screen.getByLabelText('Search lunch spots'), { target: { value: 'Garden' } });
    expect(screen.queryByRole('heading', { name: place.name })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: secondPlace.name })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'It’s a tie!' })).toBeVisible();
  });

  it('edits saved suggestions and confirms deletion by name', async () => {
    vi.mocked(service.savePlace).mockResolvedValue({ ...place, name: 'New Kitchen' });
    vi.mocked(service.deletePlace).mockResolvedValue(undefined);
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: `Edit ${place.name}` }));
    fireEvent.change(screen.getByLabelText(/Place name/), { target: { value: 'New Kitchen' } });
    fireEvent.submit(screen.getByRole('form'));
    expect(await screen.findByRole('heading', { name: 'New Kitchen' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Delete New Kitchen' }));
    const confirmation = screen.getByRole('alert');
    expect(confirmation).toHaveTextContent('New Kitchen');
    await act(async () => fireEvent.click(within(confirmation).getByRole('button', { name: 'Remove' })));
    expect(service.deletePlace).toHaveBeenCalledWith(place.id);
    expect(screen.queryByRole('heading', { name: 'New Kitchen' })).not.toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import Page from './page';

test('renders hello world', () => {
  render(<Page />);
  const linkElement = screen.getByText(/hello world/i);
  expect(linkElement).toBeInTheDocument();
});
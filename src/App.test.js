import { render, screen } from '@testing-library/react';
import App from './App';

test('renders library management heading and issue action', () => {
  render(<App />);

  expect(
    screen.getByRole('heading', { name: /library management system/i })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /issue selected book/i })
  ).toBeInTheDocument();
});

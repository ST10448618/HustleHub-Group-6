import { describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));

import axios from 'axios';

// test/setup.js replaces sessionService with a mock for every test;
// this file is the one place that tests the real thing.
const { revokeSession } = await vi.importActual('../services/sessionService.js');

describe('revokeSession', () => {
  it('sends the token to the logout endpoint as a Bearer header', async () => {
    axios.post.mockResolvedValue({});

    await revokeSession('tok123');

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/logout$/),
      null,
      { headers: { Authorization: 'Bearer tok123' } }
    );
  });

  it('does nothing when there is no token', async () => {
    await revokeSession(null);

    expect(axios.post).not.toHaveBeenCalled();
  });

  it('never throws, even when the server is unreachable', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'));

    await expect(revokeSession('tok123')).resolves.toBeUndefined();
  });
});
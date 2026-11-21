export async function runTrackerWrite(write: () => Promise<unknown>, refresh: () => Promise<unknown>) {
  try {
    await write();
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status && status >= 400 && status < 500 && status !== 408) throw error;
    return 'unconfirmed';
  }

  try {
    await refresh();
    return 'saved';
  } catch {
    return 'saved-stale';
  }
}

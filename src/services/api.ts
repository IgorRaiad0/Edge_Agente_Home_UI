/**
 * API service – placeholder functions ready for backend integration.
 */

export interface Automation {
  id: string;
  label: string;
  icon?: string;
}

/**
 * Send a chat message to the assistant (Jarvis).
 * TODO: Replace with axios.post('/chat', { message }) to your backend.
 */
export async function sendMessage(message: string): Promise<string> {
  return new Promise((resolve) =>
    setTimeout(() => resolve('Resposta do Jarvis'), 1000),
  );
}

/**
 * Fetch the list of automations.
 * TODO: Replace with axios.get('/automations') from your backend.
 */
export async function fetchAutomations(): Promise<Automation[]> {
  const items: Automation[] = Array.from({ length: 32 }, (_, i) => ({
    id: String(i + 1),
    label: `Auto ${i + 1}`,
  }));

  return new Promise((resolve) => setTimeout(() => resolve(items), 800));
}

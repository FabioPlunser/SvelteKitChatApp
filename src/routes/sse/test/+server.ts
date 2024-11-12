import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types';

// Create a Map to store client connections with their controllers and cleanup functions
const clients = new Map<string, {
  controller: ReadableStreamDefaultController;
  closeTimeout: NodeJS.Timeout;
}>();

let messages: any[] = [];

// Helper function to broadcast to all connected clients
function broadcast() {
  for (const [clientId, client] of clients) {
    try {
      client.controller.enqueue(`data: ${JSON.stringify(messages)}\n\n`);
    } catch (error) {
      // If we can't send to this client, remove them
      console.log(`Removing disconnected client ${clientId}`);
      clearTimeout(client.closeTimeout);
      clients.delete(clientId);
    }
  }
}

// Helper to generate unique client IDs
function generateClientId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const GET: RequestHandler = ({ setHeaders }) => {
  const clientId = generateClientId();

  const stream = new ReadableStream({
    start(controller) {
      // Set up SSE headers
      setHeaders({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        Connection: 'keep-alive',
      });

      // Send initial messages
      controller.enqueue(`data: ${JSON.stringify(messages)}\n\n`);

      // Set up ping interval to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(': ping\n\n');
        } catch (error) {
          // If ping fails, clean up this client
          clearInterval(pingInterval);
          if (clients.has(clientId)) {
            clearTimeout(clients.get(clientId)!.closeTimeout);
            clients.delete(clientId);
          }
        }
      }, 30000);

      // Add this controller to our Map with a timeout
      const closeTimeout = setTimeout(() => {
        controller.close();
        clients.delete(clientId);
        clearInterval(pingInterval);
      }, 24 * 60 * 60 * 1000); // 24 hour timeout

      clients.set(clientId, {
        controller,
        closeTimeout
      });

      // Clean up when the stream ends
      return () => {
        clearInterval(pingInterval);
        clearTimeout(closeTimeout);
        clients.delete(clientId);
      };
    }
  });

  return new Response(stream);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  messages.push(body);

  // Broadcast the update to all connected clients
  broadcast();

  return json({ success: true, messageCount: messages.length });
};
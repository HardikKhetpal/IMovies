import { Response } from 'express';

type Client = {
  id: string;
  showId: string;
  res: Response;
};

class SeatBroadcaster {
  private clients: Client[] = [];

  public addClient(showId: string, res: Response): string {
    const id = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.clients.push({ id, showId, res });

    // Send initial handshake
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', showId })}\n\n`);

    return id;
  }

  public removeClient(id: string) {
    this.clients = this.clients.filter((c) => c.id !== id);
  }

  public broadcast(showId: string, event: { type: string; payload?: any }) {
    const targetClients = this.clients.filter((c) => c.showId === showId);
    const message = `data: ${JSON.stringify(event)}\n\n`;

    targetClients.forEach((client) => {
      try {
        client.res.write(message);
      } catch (err) {
        this.removeClient(client.id);
      }
    });
  }
}

export const seatBroadcaster = new SeatBroadcaster();

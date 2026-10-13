import Peer, { type DataConnection } from 'peerjs';

// Sanitize session ID to ensure valid PeerJS ID (alphanumeric and dashes only)
function toPeerId(sessionId: string): string {
  const sanitized = sessionId.replace(/[^a-zA-Z0-9]/g, '');
  return `watheq-pos-${sanitized}`;
}

export type P2PConnectionStatus = 'disconnected' | 'connecting' | 'connected';

class ScannerP2PService {
  private hostPeer: Peer | null = null;
  private clientPeer: Peer | null = null;
  private activeConnection: DataConnection | null = null;
  private statusListeners = new Set<(status: P2PConnectionStatus) => void>();
  private status: P2PConnectionStatus = 'disconnected';

  getStatus(): P2PConnectionStatus {
    return this.status;
  }

  private setStatus(newStatus: P2PConnectionStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((fn) => fn(newStatus));
  }

  subscribeStatus(listener: (status: P2PConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Called on Desktop POS (Host) to listen for incoming mobile scanner connections
   */
  startHost(
    sessionId: string,
    onBarcodeReceived: (barcode: string) => void,
    onConnected?: () => void
  ): void {
    this.stopHost();

    const peerId = toPeerId(sessionId);
    this.setStatus('connecting');

    try {
      const peer = new Peer(peerId, {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });

      this.hostPeer = peer;

      peer.on('open', (id) => {
        console.info('[P2P] Host peer ready with ID:', id);
      });

      peer.on('connection', (conn) => {
        console.info('[P2P] Incoming connection from mobile scanner');
        this.activeConnection = conn;

        conn.on('open', () => {
          console.info('[P2P] DataChannel open with mobile scanner');
          this.setStatus('connected');
          onConnected?.();
        });

        conn.on('data', (data: unknown) => {
          console.info('[P2P] Data received on host:', data);
          if (data && typeof data === 'object') {
            const payload = data as { type?: string; barcode?: string };
            if (payload.barcode) {
              onBarcodeReceived(payload.barcode);
            }
          } else if (typeof data === 'string') {
            onBarcodeReceived(data);
          }
        });

        conn.on('close', () => {
          console.info('[P2P] Mobile connection closed');
          this.setStatus('disconnected');
          this.activeConnection = null;
        });

        conn.on('error', (err) => {
          console.warn('[P2P] Connection error on host:', err);
        });
      });

      peer.on('error', (err) => {
        console.warn('[P2P] Host peer error:', err);
      });
    } catch (err) {
      console.warn('[P2P] Failed to initialize host peer:', err);
    }
  }

  stopHost(): void {
    if (this.activeConnection) {
      try {
        this.activeConnection.close();
      } catch {
        // ignore
      }
      this.activeConnection = null;
    }
    if (this.hostPeer) {
      try {
        this.hostPeer.destroy();
      } catch {
        // ignore
      }
      this.hostPeer = null;
    }
    this.setStatus('disconnected');
  }

  /**
   * Called on Mobile Phone (Client) to connect to the Desktop POS host
   */
  connectToHost(sessionId: string, onConnected?: () => void): void {
    this.stopClient();

    const targetPeerId = toPeerId(sessionId);
    this.setStatus('connecting');

    try {
      const peer = new Peer({
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });

      this.clientPeer = peer;
      let retryCount = 0;

      const tryConnect = () => {
        if (!this.clientPeer || this.clientPeer.destroyed) return;
        console.info('[P2P] Connecting to host peer:', targetPeerId);
        const conn = peer.connect(targetPeerId, {
          reliable: true,
        });

        this.activeConnection = conn;

        conn.on('open', () => {
          console.info('[P2P] Mobile connected to desktop host via DataChannel!');
          this.setStatus('connected');
          onConnected?.();
        });

        conn.on('close', () => {
          console.info('[P2P] DataChannel closed on mobile');
          this.setStatus('disconnected');
          this.activeConnection = null;
        });

        conn.on('error', (err) => {
          console.warn('[P2P] Connection error on mobile:', err);
        });
      };

      peer.on('open', () => {
        console.info('[P2P] Mobile client peer ready with ID:', peer.id);
        tryConnect();
      });

      peer.on('error', (err: any) => {
        console.warn('[P2P] Mobile peer error:', err);
        // If host isn't ready yet on signaling server, retry connecting
        if ((err?.type === 'peer-unavailable' || err?.message?.includes('Could not connect to peer')) && retryCount < 8) {
          retryCount++;
          console.info(`[P2P] Host peer not yet reachable, retrying (${retryCount}/8)...`);
          setTimeout(() => {
            if (this.clientPeer && !this.activeConnection?.open) {
              tryConnect();
            }
          }, 1500);
        }
      });
    } catch (err) {
      console.warn('[P2P] Failed to initialize mobile peer:', err);
    }
  }

  /**
   * Sends scanned barcode directly from mobile to desktop over P2P DataChannel
   */
  sendBarcode(barcode: string): boolean {
    if (this.activeConnection && this.activeConnection.open) {
      try {
        this.activeConnection.send({
          type: 'BARCODE_SCANNED',
          barcode: barcode.trim(),
          timestamp: Date.now(),
        });
        console.info('[P2P] Barcode successfully sent to host:', barcode);
        return true;
      } catch (err) {
        console.warn('[P2P] Error sending barcode:', err);
      }
    }
    return false;
  }

  stopClient(): void {
    if (this.activeConnection) {
      try {
        this.activeConnection.close();
      } catch {
        // ignore
      }
      this.activeConnection = null;
    }
    if (this.clientPeer) {
      try {
        this.clientPeer.destroy();
      } catch {
        // ignore
      }
      this.clientPeer = null;
    }
    this.setStatus('disconnected');
  }
}

export const scannerP2PService = new ScannerP2PService();

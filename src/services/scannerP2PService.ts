import Peer, { type DataConnection } from 'peerjs';

// Sanitize session ID to ensure valid PeerJS ID (alphanumeric and dashes only)
function toPeerId(sessionId: string): string {
  const sanitized = sessionId.replace(/[^a-zA-Z0-9]/g, '');
  return `watheq-pos-${sanitized}`;
}

export type P2PConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface P2PCartItem {
  id: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
}

export interface P2PMessage {
  type: 'BARCODE_SCANNED' | 'UPDATE_QTY' | 'CART_SYNC';
  barcode?: string;
  productId?: string;
  delta?: number;
  cart?: P2PCartItem[];
  totalAmount?: number;
  totalCount?: number;
  timestamp?: number;
}

class ScannerP2PService {
  private hostPeer: Peer | null = null;
  private clientPeer: Peer | null = null;
  private activeConnection: DataConnection | null = null;
  private statusListeners = new Set<(status: P2PConnectionStatus) => void>();
  private cartSyncListeners = new Set<(cart: P2PCartItem[], totalAmount: number, totalCount: number) => void>();
  private updateQtyListeners = new Set<(idOrBarcode: string, delta: number) => void>();
  private onBarcodeReceivedCallback: ((barcode: string) => void) | null = null;
  private status: P2PConnectionStatus = 'disconnected';

  getStatus(): P2PConnectionStatus {
    return this.status;
  }

  private setStatus(newStatus: P2PConnectionStatus) {
    if (this.status === newStatus) return;
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

  subscribeCartSync(listener: (cart: P2PCartItem[], totalAmount: number, totalCount: number) => void): () => void {
    this.cartSyncListeners.add(listener);
    return () => {
      this.cartSyncListeners.delete(listener);
    };
  }

  subscribeUpdateQty(listener: (idOrBarcode: string, delta: number) => void): () => void {
    this.updateQtyListeners.add(listener);
    return () => {
      this.updateQtyListeners.delete(listener);
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
    this.onBarcodeReceivedCallback = onBarcodeReceived;

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
            const payload = data as P2PMessage;
            if (payload.type === 'BARCODE_SCANNED' && payload.barcode) {
              this.onBarcodeReceivedCallback?.(payload.barcode);
            } else if (payload.type === 'UPDATE_QTY' && (payload.productId || payload.barcode) && payload.delta) {
              const target = payload.productId || payload.barcode || '';
              this.updateQtyListeners.forEach((fn) => fn(target, payload.delta!));
            } else if (payload.barcode) {
              this.onBarcodeReceivedCallback?.(payload.barcode);
            }
          } else if (typeof data === 'string') {
            this.onBarcodeReceivedCallback?.(data);
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

  /**
   * Host sends full cart state to the mobile phone
   */
  sendCartSync(cart: P2PCartItem[], totalAmount: number, totalCount: number): boolean {
    if (this.activeConnection && this.activeConnection.open) {
      try {
        const payload: P2PMessage = {
          type: 'CART_SYNC',
          cart,
          totalAmount,
          totalCount,
          timestamp: Date.now(),
        };
        this.activeConnection.send(payload);
        return true;
      } catch (err) {
        console.warn('[P2P] Error sending cart sync to mobile:', err);
      }
    }
    return false;
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

        conn.on('data', (data: unknown) => {
          console.info('[P2P] Data received on mobile:', data);
          if (data && typeof data === 'object') {
            const payload = data as P2PMessage;
            if (payload.type === 'CART_SYNC' && Array.isArray(payload.cart)) {
              this.cartSyncListeners.forEach((fn) =>
                fn(payload.cart!, payload.totalAmount || 0, payload.totalCount || 0)
              );
            }
          }
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
        const payload: P2PMessage = {
          type: 'BARCODE_SCANNED',
          barcode: barcode.trim(),
          timestamp: Date.now(),
        };
        this.activeConnection.send(payload);
        console.info('[P2P] Barcode successfully sent to host:', barcode);
        return true;
      } catch (err) {
        console.warn('[P2P] Error sending barcode:', err);
      }
    }
    return false;
  }

  /**
   * Sends item quantity change (+1 or -1) from mobile to desktop
   */
  sendUpdateQty(productIdOrBarcode: string, delta: number): boolean {
    if (this.activeConnection && this.activeConnection.open) {
      try {
        const payload: P2PMessage = {
          type: 'UPDATE_QTY',
          productId: productIdOrBarcode,
          delta,
          timestamp: Date.now(),
        };
        this.activeConnection.send(payload);
        console.info('[P2P] Update qty sent to host:', productIdOrBarcode, delta);
        return true;
      } catch (err) {
        console.warn('[P2P] Error sending update qty to host:', err);
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

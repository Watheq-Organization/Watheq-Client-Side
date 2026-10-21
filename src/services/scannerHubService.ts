import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '../config/env';
import { getStoredToken } from '../lib/authToken';
import { scannerP2PService } from './scannerP2PService';

// ============================================================================
// DTOs & Types for ScannerHub
// ============================================================================

export interface ScannedProductDto {
  productId: number;
  barcode: string; // Preserves leading zeros as string
  productName: string;
  salePrice: number;
  stockQuantity: number;
  category?: string;
  unit?: string;
}

export interface ScannerErrorDto {
  code:
    | 'ProductNotFound'
    | 'ProductInactive'
    | 'ScanThrottled'
    | 'ScannerSessionExpired'
    | 'ScannerSessionRevoked'
    | string;
  message: string;
}

export interface SessionJoinedDto {
  sessionId: string;
}

export interface ScannerPairedDto {
  sessionId: string;
}

export interface ScannerConnectedDto {
  sessionId: string;
}

export interface ScannerDisconnectedDto {
  sessionId: string;
}

export interface BarcodeScannedEventDto {
  barcode: string;
  product?: ScannedProductDto;
}

export interface ScannerHubCallbacks {
  onSessionJoined?: (data: SessionJoinedDto) => void;
  onScannerPaired?: (data: ScannerPairedDto) => void;
  onScannerConnected?: (data: ScannerConnectedDto) => void;
  onScannerDisconnected?: (data: ScannerDisconnectedDto) => void;
  onProductScanned?: (product: ScannedProductDto) => void;
  onBarcodeScanned?: (data: BarcodeScannedEventDto) => void;
  onScannerError?: (error: ScannerErrorDto) => void;
  onReconnecting?: (error?: Error) => void;
  onReconnected?: (connectionId?: string) => void;
  onClose?: (error?: Error) => void;
}

export type CashierScannerStatus = 'idle' | 'connecting' | 'paired' | 'connected' | 'disconnected';

/**
 * Resolves the Hub URL from API_BASE_URL or default backend domain.
 */
export function getScannerHubUrl(): string {
  // If in browser during local development, use relative path so Vite proxy handles WebSockets & HTTP
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return '/hubs/scanner';
    }
  }
  if (API_BASE_URL) {
    const base = API_BASE_URL.replace(/\/api\/?$/, '');
    return `${base}/hubs/scanner`;
  }
  return 'https://whateq.runasp.net/hubs/scanner';
}

/**
 * Creates and configures a SignalR HubConnection for ScannerHub.
 *
 * NOTE: Explicitly sets withCredentials: false because the backend uses
 * AllowAnyOrigin() which conflicts with credentials in browser CORS.
 * Auth is passed strictly via accessTokenFactory.
 */
export function createScannerHubConnection(
  tokenProvider: () => string | Promise<string>,
  callbacks: ScannerHubCallbacks
): signalR.HubConnection {
  const hubUrl = getScannerHubUrl();

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: async () => {
        const token = await tokenProvider();
        return token || '';
      },
      withCredentials: false,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  // Register event listeners
  if (callbacks.onSessionJoined) {
    connection.on('SessionJoined', callbacks.onSessionJoined);
  }

  if (callbacks.onScannerPaired) {
    connection.on('ScannerPaired', callbacks.onScannerPaired);
  }

  if (callbacks.onScannerConnected) {
    connection.on('ScannerConnected', callbacks.onScannerConnected);
  }

  if (callbacks.onScannerDisconnected) {
    connection.on('ScannerDisconnected', callbacks.onScannerDisconnected);
  }

  if (callbacks.onProductScanned) {
    connection.on('ProductScanned', callbacks.onProductScanned);
  }

  if (callbacks.onBarcodeScanned) {
    connection.on('BarcodeScanned', (data: BarcodeScannedEventDto) => {
      callbacks.onBarcodeScanned?.(data);
      if (data?.product && callbacks.onProductScanned) {
        callbacks.onProductScanned(data.product);
      }
    });
  }

  if (callbacks.onScannerError) {
    connection.on('ScannerError', callbacks.onScannerError);
  }

  // Lifecycle listeners
  if (callbacks.onReconnecting) {
    connection.onreconnecting(callbacks.onReconnecting);
  }

  if (callbacks.onReconnected) {
    connection.onreconnected(callbacks.onReconnected);
  }

  if (callbacks.onClose) {
    connection.onclose(callbacks.onClose);
  }

  return connection;
}

/**
 * Cashier invocation: Join session group on the Hub
 */
export async function joinScannerSession(
  connection: signalR.HubConnection,
  sessionId: string
): Promise<void> {
  if (connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke('JoinSession', sessionId);
  } else {
    throw new Error('HubConnection is not connected. Current state: ' + connection.state);
  }
}

/**
 * Mobile scanner invocation: Send scanned barcode to the Hub
 */
export async function scanBarcodeOnHub(
  connection: signalR.HubConnection,
  barcode: string
): Promise<void> {
  if (connection.state === signalR.HubConnectionState.Connected) {
    await connection.invoke('ScanBarcode', barcode);
  } else {
    throw new Error('HubConnection is not connected. Current state: ' + connection.state);
  }
}

// ============================================================================
// Central Cashier Scanner Hub Manager
// Keeps the desktop cashier connected in the background even when modal is closed
// ============================================================================

class CashierScannerHubManager {
  private connection: signalR.HubConnection | null = null;
  private sessionId: string | null = null;
  private status: CashierScannerStatus = 'idle';
  private statusListeners = new Set<(status: CashierScannerStatus) => void>();
  private barcodeListeners = new Set<(data: BarcodeScannedEventDto) => void>();
  private productListeners = new Set<(product: ScannedProductDto) => void>();
  private onProductScannedCallback: ((product: ScannedProductDto) => void) | null = null;
  private onBarcodeScannedCallback: ((data: BarcodeScannedEventDto) => void) | null = null;
  private onScannerErrorCallback: ((error: ScannerErrorDto) => void) | null = null;

  getStatus(): CashierScannerStatus {
    return this.status;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getConnection(): signalR.HubConnection | null {
    return this.connection;
  }

  subscribeStatus(listener: (status: CashierScannerStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  subscribeBarcode(listener: (data: BarcodeScannedEventDto) => void): () => void {
    this.barcodeListeners.add(listener);
    return () => {
      this.barcodeListeners.delete(listener);
    };
  }

  subscribeProduct(listener: (product: ScannedProductDto) => void): () => void {
    this.productListeners.add(listener);
    return () => {
      this.productListeners.delete(listener);
    };
  }

  private setStatus(newStatus: CashierScannerStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    this.statusListeners.forEach((cb) => {
      try {
        cb(newStatus);
      } catch (err) {
        console.error('[CashierScannerManager] Listener error:', err);
      }
    });
  }

  public setManualStatus(newStatus: CashierScannerStatus) {
    this.setStatus(newStatus);
  }

  public dispatchBarcode(barcode: string, product?: ScannedProductDto) {
    if (product) {
      this.productListeners.forEach((fn) => fn(product));
      this.onProductScannedCallback?.(product);
    }
    const evt = { barcode, product };
    this.barcodeListeners.forEach((fn) => fn(evt));
    this.onBarcodeScannedCallback?.(evt);
  }

  setCallbacks(callbacks: {
    onProductScanned?: (product: ScannedProductDto) => void;
    onBarcodeScanned?: (data: BarcodeScannedEventDto) => void;
    onScannerError?: (error: ScannerErrorDto) => void;
  }) {
    if (callbacks.onProductScanned) this.onProductScannedCallback = callbacks.onProductScanned;
    if (callbacks.onBarcodeScanned) this.onBarcodeScannedCallback = callbacks.onBarcodeScanned;
    if (callbacks.onScannerError) this.onScannerErrorCallback = callbacks.onScannerError;
  }

  async startSession(sessionId: string): Promise<signalR.HubConnection | null> {
    // If already connected to the same session, reuse
    if (this.connection && this.sessionId === sessionId && this.connection.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    // Otherwise clean up existing connection
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch {
        // ignore
      }
      this.connection = null;
    }

    this.sessionId = sessionId;
    this.setStatus('connecting');

    // 1. Start WebRTC P2P Host in parallel for zero-latency, cross-network scanner transport
    try {
      scannerP2PService.startHost(
        sessionId,
        (barcode) => {
          console.info('[CashierScannerManager] Received barcode via direct P2P:', barcode);
          this.setStatus('connected');
          this.dispatchBarcode(barcode);
        },
        () => {
          console.info('[CashierScannerManager] Mobile paired & connected via P2P');
          this.setStatus('connected');
        }
      );
    } catch (p2pErr) {
      console.warn('[CashierScannerManager] P2P Host init error:', p2pErr);
    }

    // 2. Start SignalR Hub connection
    const conn = createScannerHubConnection(
      () => getStoredToken() || '',
      {
        onSessionJoined: (data) => {
          console.info('[ScannerHub] Desktop session joined:', data.sessionId);
        },
        onScannerPaired: (data) => {
          console.info('[ScannerHub] Mobile scanner paired:', data.sessionId);
          this.setStatus('paired');
        },
        onScannerConnected: (data) => {
          console.info('[ScannerHub] Mobile scanner connected:', data.sessionId);
          this.setStatus('connected');
        },
        onScannerDisconnected: (data) => {
          console.info('[ScannerHub] Mobile scanner disconnected:', data.sessionId);
          // Only mark disconnected if P2P is not connected
          if (scannerP2PService.getStatus() !== 'connected') {
            this.setStatus('disconnected');
          }
        },
        onProductScanned: (product) => {
          this.productListeners.forEach((fn) => fn(product));
          this.onProductScannedCallback?.(product);
        },
        onBarcodeScanned: (data) => {
          this.barcodeListeners.forEach((fn) => fn(data));
          this.onBarcodeScannedCallback?.(data);
        },
        onScannerError: (err) => {
          this.onScannerErrorCallback?.(err);
        },
        onReconnecting: () => {
          if (scannerP2PService.getStatus() !== 'connected') {
            this.setStatus('connecting');
          }
        },
        onReconnected: () => {
          this.setStatus('connected');
        },
        onClose: () => {
          // If P2P is connected, do not mark disconnected
          if (scannerP2PService.getStatus() !== 'connected') {
            if (this.status === 'connected' || this.status === 'paired') {
              this.setStatus('disconnected');
            }
          }
        },
      }
    );

    this.connection = conn;

    try {
      await conn.start();
      await joinScannerSession(conn, sessionId);
      return conn;
    } catch (err) {
      console.warn('[ScannerHub] SignalR connection not available or closed, using P2P DataChannel transport:', err);
      // Keep connecting or connected status so P2P continues running without interruption
      if (scannerP2PService.getStatus() === 'connected') {
        this.setStatus('connected');
      }
      return conn;
    }
  }

  async stopSession() {
    this.sessionId = null;
    scannerP2PService.stopHost();
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch {
        // ignore
      }
      this.connection = null;
    }
    this.setStatus('idle');
  }
}

export const cashierScannerManager = new CashierScannerHubManager();

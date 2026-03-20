// WebSocket client to connect to the local ANT+ Bridge
// Default address: ws://localhost:8080

export type AntMessage = {
    type: 'hr';
    source: 'ant';
    deviceId: string;
    bpm: number;
    rssi?: number;
    batteryLevel?: number;
} | {
    type: 'info';
    message: string;
    hostname?: string;
};

export class AntBridgeClient {
    private ws: WebSocket | null = null;
    private url: string;
    private onMessage: (msg: AntMessage) => void;
    private onStatusChange: (connected: boolean) => void;
    private reconnectTimer: number | null = null;

    constructor(
        onMessage: (msg: AntMessage) => void,
        onStatusChange: (connected: boolean) => void,
        url: string = 'ws://localhost:8081'
    ) {
        this.url = url;
        this.onMessage = onMessage;
        this.onStatusChange = onStatusChange;
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('Connected to ANT+ Bridge');
                this.onStatusChange(true);
                if (this.reconnectTimer) {
                    clearInterval(this.reconnectTimer);
                    this.reconnectTimer = null;
                }
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.onMessage(data);
                } catch (e) {
                    console.error('Error parsing ANT+ message', e);
                }
            };

            this.ws.onclose = () => {
                console.log('Disconnected from ANT+ Bridge, retrying...');
                this.onStatusChange(false);
                this.scheduleReconnect();
            };

            this.ws.onerror = (err) => {
                console.log('ANT+ Bridge WebSocket error', err);
                this.ws?.close();
            };
        } catch (e) {
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect() {
        if (!this.reconnectTimer) {
            this.reconnectTimer = window.setInterval(() => this.connect(), 5000);
        }
    }

    disconnect() {
        if (this.reconnectTimer) {
            clearInterval(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.ws?.close();
    }
}

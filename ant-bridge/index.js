const Ant = require('ant-plus-next');
const { WebSocketServer } = require('ws');
const os = require('os');

// Configuration
const WS_PORT = 8081;
const HOSTNAME = os.hostname();

// Initialize ANT+ stick
const stick = new Ant.GarminStick3();
const hrSensor = new Ant.HeartRateScanner(stick);

// WebSocket Server
const wss = new WebSocketServer({ port: WS_PORT });
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('Client connected to ANT+ Bridge');
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));

    // Welcome message with machine identity
    ws.send(JSON.stringify({ 
        type: 'info', 
        message: 'Connected to ANT+ Bridge',
        hostname: HOSTNAME 
    }));
});

function broadcast(data) {
    const message = JSON.stringify(data);
    for (const client of clients) {
        if (client.readyState === 1) { // OPEN
            client.send(message);
        }
    }
}

// ANT+ Events
hrSensor.on('heartRateData', (data) => {
    // data contains: DeviceId, ComputedHeartRate, etc.
    // Attempt to find DeviceID in various possible property names
    const deviceId = data.DeviceId || data.DeviceID || data.deviceId || data.id;

    if (deviceId === undefined || deviceId === null) {
        return;
    }

    console.log(`Sensor ${deviceId}: ${data.ComputedHeartRate} BPM`);
    broadcast({
        type: 'hr',
        source: 'ant',
        deviceId: deviceId.toString(),
        bpm: data.ComputedHeartRate
    });
});

stick.on('startup', () => {
    console.log('ANT+ Stick started');
    hrSensor.scan();
});

// Start the stick
if (!stick.open()) {
    console.error('Failed to open ANT+ Stick. Is it plugged in? Are drivers correct (WinUSB)?');
    process.exit(1);
}

process.on('SIGINT', () => {
    console.log('Shutting down ANT+ Bridge...');
    stick.close();
    process.exit();
});

console.log(`ANT+ Bridge running on ws://localhost:${WS_PORT}`);

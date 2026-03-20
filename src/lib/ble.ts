// Web Bluetooth API integration for Coospo HW706 heart rate sensors
// Heart Rate Service UUID: 0x180D
// Heart Rate Measurement Characteristic: 0x2A37

const HR_SERVICE_UUID = 0x180d;
const HR_MEASUREMENT_UUID = 0x2a37;
const BATTERY_SERVICE_UUID = 0x180f;
const BATTERY_LEVEL_UUID = 0x2a19;

export interface BleConnection {
  device: any;
  server: any;
  characteristic: any;
  batteryCharacteristic: any | null;
}

export function isBleSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in (navigator as any);
}

export async function connectToHrSensor(onDisconnected?: () => void): Promise<BleConnection> {
  if (!isBleSupported()) {
    throw new Error("Web Bluetooth API não suportada neste navegador.");
  }

  const nav = navigator as any;
  const device = await nav.bluetooth.requestDevice({
    filters: [{ services: [HR_SERVICE_UUID] }],
    optionalServices: [HR_SERVICE_UUID, BATTERY_SERVICE_UUID],
  });

  if (onDisconnected) {
    device.addEventListener("gattserverdisconnected", onDisconnected);
  }

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(HR_SERVICE_UUID);
  const characteristic = await service.getCharacteristic(HR_MEASUREMENT_UUID);

  // Try to get battery characteristic (optional)
  let batteryCharacteristic: any = null;
  try {
    const batteryService = await server.getPrimaryService(BATTERY_SERVICE_UUID);
    batteryCharacteristic = await batteryService.getCharacteristic(BATTERY_LEVEL_UUID);
  } catch {
    // Battery service not available on this sensor
  }

  return { device, server, characteristic, batteryCharacteristic };
}

export function parseHeartRate(value: DataView): number {
  const flags = value.getUint8(0);
  if (flags & 0x01) {
    return value.getUint16(1, true);
  }
  return value.getUint8(1);
}

export function startHeartRateNotifications(
  characteristic: any,
  onHeartRate: (bpm: number) => void
): void {
  characteristic.addEventListener("characteristicvaluechanged", (event: Event) => {
    const target = event.target as any;
    if (target.value) {
      const bpm = parseHeartRate(target.value);
      onHeartRate(bpm);
    }
  });
  characteristic.startNotifications();
}

export async function readBatteryLevel(connection: BleConnection): Promise<number | null> {
  if (!connection.batteryCharacteristic) return null;
  try {
    const value = await connection.batteryCharacteristic.readValue();
    return value.getUint8(0);
  } catch {
    return null;
  }
}

export function disconnectDevice(connection: BleConnection): void {
  try {
    connection.server.disconnect();
  } catch {
    // already disconnected
  }
}

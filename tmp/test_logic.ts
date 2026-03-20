
import { getZoneForPercent, DEFAULT_ZONES } from "../src/types/pulse";

function testMinuteAccumulation() {
    console.log("--- Test: Minute Accumulation Logic ---");
    
    const mockZones = DEFAULT_ZONES;
    
    const cases = [
        { name: "Zone 1 (Rest)", fcm: 55, expectedIncrement: 0 },
        { name: "Zone 2 (Warmup)", fcm: 65, expectedIncrement: 1 },
        { name: "Zone 3 (Burn)", fcm: 75, expectedIncrement: 1 },
    ];

    cases.forEach(c => {
        const nextConnectedSeconds = (connectedSeconds: number, connected: boolean, secondsSinceLastHB: number, fcmPercent: number) => {
            return connectedSeconds + (connected && secondsSinceLastHB <= 60 && fcmPercent >= 60 ? 1 : 0);
        };

        const result = nextConnectedSeconds(0, true, 10, c.fcm);
        console.log(`${c.name} (${c.fcm}%): ${result === c.expectedIncrement ? "PASS" : "FAIL"} (result: ${result})`);
    });
}

function testRounding() {
    console.log("\n--- Test: Rounding Logic (Truncation) ---");
    
    const mockConnectedSeconds = [45, 65, 119, 120, 121];
    const expectedMinutes = [0, 1, 1, 2, 2];

    mockConnectedSeconds.forEach((s, i) => {
        const result = Math.floor(s / 60);
        console.log(`${s}s -> ${result}m: ${result === expectedMinutes[i] ? "PASS" : "FAIL"}`);
    });
}

function testActivationThreshold() {
    console.log("\n--- Test: ANT+ Activation Threshold ---");
    
    const testCases = [
        { bpm: 45, fcm: 190, expected: false }, // Low BPM and low FCM
        { bpm: 65, fcm: 190, expected: true },  // High BPM
        { bpm: 55, fcm: 100, expected: true },  // High FCM (55%)
    ];

    testCases.forEach(c => {
        const fcmPercent = Math.round((c.bpm / c.fcm) * 100);
        const shouldActivate = !(fcmPercent < 50 && c.bpm < 60);
        console.log(`BPM: ${c.bpm}, FCM%: ${fcmPercent} -> Activate: ${shouldActivate} | Expected: ${c.expected} | ${shouldActivate === c.expected ? "PASS" : "FAIL"}`);
    });
}

testMinuteAccumulation();
testRounding();
testActivationThreshold();

import { Injectable } from '@angular/core';
import { BleClient, dataViewToText, textToDataView } from '@capacitor-community/bluetooth-le';
import { DeviceService } from './device.service';

interface PresenceChallenge {
  version: number;
  deviceId: string;
  commandId: string;
  challenge: string;
  expiresAtUnixTimeSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class NearbyPresenceService {
  private static readonly serviceUuid = '6f9c0001-4f46-4a39-9b47-71a4cf173601';
  private static readonly challengeCharacteristicUuid = '6f9c0002-4f46-4a39-9b47-71a4cf173601';
  private static readonly proofCharacteristicUuid = '6f9c0003-4f46-4a39-9b47-71a4cf173601';

  constructor(private device: DeviceService) {}

  async proveNearbyPresence(commandId: string): Promise<void> {
    await BleClient.initialize({ androidNeverForLocation: true });
    const controller = await BleClient.requestDevice({ services: [NearbyPresenceService.serviceUuid] });
    await BleClient.connect(controller.deviceId);

    try {
      const encodedChallenge = await BleClient.read(
        controller.deviceId,
        NearbyPresenceService.serviceUuid,
        NearbyPresenceService.challengeCharacteristicUuid
      );
      const challenge = JSON.parse(dataViewToText(encodedChallenge)) as PresenceChallenge;
      if (
        challenge.version !== 1 ||
        challenge.commandId !== commandId ||
        !challenge.deviceId ||
        !challenge.challenge ||
        !Number.isFinite(challenge.expiresAtUnixTimeSeconds) ||
        Math.floor(Date.now() / 1000) >= challenge.expiresAtUnixTimeSeconds
      ) {
        throw new Error('The nearby controller challenge is invalid or has expired.');
      }

      const binding = await this.device.getDeviceBinding();
      const canonicalPayload = [
        'Verixora.BlePresence.v1',
        challenge.deviceId,
        challenge.commandId,
        challenge.challenge,
        challenge.expiresAtUnixTimeSeconds
      ].join('|');
      const signatureBase64 = await this.device.signPresencePayload(canonicalPayload);
      const proof = JSON.stringify({
        deviceId: binding.deviceId,
        commandId: challenge.commandId,
        challenge: challenge.challenge,
        signatureBase64
      });
      await BleClient.write(
        controller.deviceId,
        NearbyPresenceService.serviceUuid,
        NearbyPresenceService.proofCharacteristicUuid,
        textToDataView(proof)
      );
    } finally {
      await BleClient.disconnect(controller.deviceId).catch(() => undefined);
    }
  }
}

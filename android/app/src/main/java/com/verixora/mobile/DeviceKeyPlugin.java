package com.verixora.mobile;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyInfo;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.Signature;
import java.security.cert.Certificate;
import java.security.spec.ECGenParameterSpec;

/** Android Keystore-backed P-256 key. The private key never enters WebView storage. */
@CapacitorPlugin(name = "VerixoraDeviceKey")
public class DeviceKeyPlugin extends Plugin {
    private static final String KEY_ALIAS = "verixora.mobile.device.binding.v1";

    @PluginMethod
    public void getOrCreateKey(PluginCall call) {
        try {
            PublicKey publicKey = getOrCreatePublicKey();
            JSObject result = new JSObject();
            result.put("publicKeySpkiBase64", Base64.encodeToString(publicKey.getEncoded(), Base64.NO_WRAP));
            result.put("fingerprint", base64Url(MessageDigest.getInstance("SHA-256").digest(publicKey.getEncoded())));
            result.put("hardwareBacked", isHardwareBacked());
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("Android Keystore device key could not be created.", "DEVICE_KEY_UNAVAILABLE", exception);
        }
    }

    @PluginMethod
    public void sign(PluginCall call) {
        String payload = call.getString("payload");
        if (payload == null || payload.isEmpty() || payload.length() > 4096) {
            call.reject("A non-empty signing payload up to 4096 characters is required.", "INVALID_PAYLOAD");
            return;
        }
        try {
            getOrCreatePublicKey();
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            PrivateKey privateKey = (PrivateKey) keyStore.getKey(KEY_ALIAS, null);
            if (privateKey == null) throw new IllegalStateException("Device key is unavailable.");
            Signature signer = Signature.getInstance("SHA256withECDSA");
            signer.initSign(privateKey);
            signer.update(payload.getBytes(StandardCharsets.UTF_8));
            JSObject result = new JSObject();
            result.put("signatureBase64", Base64.encodeToString(signer.sign(), Base64.NO_WRAP));
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("Android Keystore could not sign the presence proof.", "DEVICE_KEY_SIGNING_FAILED", exception);
        }
    }

    private PublicKey getOrCreatePublicKey() throws Exception {
        KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        Certificate existingCertificate = keyStore.getCertificate(KEY_ALIAS);
        if (existingCertificate != null) return existingCertificate.getPublicKey();

        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore");
        keyPairGenerator.initialize(new KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY)
                .setAlgorithmParameterSpec(new ECGenParameterSpec("secp256r1"))
                .setDigests(KeyProperties.DIGEST_SHA256)
                .build());
        return keyPairGenerator.generateKeyPair().getPublic();
    }

    private boolean isHardwareBacked() {
        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            PrivateKey privateKey = (PrivateKey) keyStore.getKey(KEY_ALIAS, null);
            if (privateKey == null) return false;
            KeyInfo keyInfo = KeyFactory.getInstance(privateKey.getAlgorithm(), "AndroidKeyStore").getKeySpec(privateKey, KeyInfo.class);
            return keyInfo.isInsideSecureHardware();
        } catch (Exception ignored) {
            return false;
        }
    }

    @NonNull
    private static String base64Url(byte[] value) {
        return Base64.encodeToString(value, Base64.NO_WRAP | Base64.URL_SAFE | Base64.NO_PADDING);
    }
}

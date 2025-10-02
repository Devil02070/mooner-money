function dec2hex(dec: number) {
  return ('0' + dec.toString(16)).substr(-2)
}

const generateCodeVerifier = () => {
    const array = new Uint32Array(56/2);
    crypto.getRandomValues(array);
    return Array.from(
        array,
        dec2hex
    ).join("")
};

function sha256(plain: string) { // returns promise ArrayBuffer
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(a: ArrayBuffer) {
    let str = "";
    const bytes = new Uint8Array(a);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const generateChallengeFromVerifier = async(v: string) => {
    const hashed = await sha256(v);
    const base64encoded = base64urlencode(hashed);
    return base64encoded;
}

export const pkce = {
    generateCodeVerifier,
    generateChallengeFromVerifier
}

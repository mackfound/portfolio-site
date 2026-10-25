// OpenSSH randomart ("drunken bishop"), as `ssh-keygen -lv` draws it for a
// SHA256 fingerprint. Port of sshkey.c's fingerprint_randomart(). The input is
// the public fingerprint only; no key material is involved.
const W = 17, H = 9;
const SYMBOLS = " .o+=*BOX@%&#/^SE";

const frame = (label) => {
  const pad = Math.floor((W - label.length) / 2);
  return "+" + "-".repeat(pad) + label + "-".repeat(W - pad - label.length) + "+";
};

// fingerprint: "SHA256:<base64>" (padding optional); type and bits label the box.
export function randomart(fingerprint, type = "ED25519", bits = 256) {
  const bytes = Buffer.from(fingerprint.replace(/^SHA256:/, ""), "base64");
  const field = Array.from({ length: W }, () => new Array(H).fill(0));
  const last = SYMBOLS.length - 1;
  let x = W >> 1, y = H >> 1;
  for (const byte of bytes) {
    let b = byte;
    for (let i = 0; i < 4; i++) {
      x = Math.max(0, Math.min(W - 1, x + (b & 1 ? 1 : -1)));
      y = Math.max(0, Math.min(H - 1, y + (b & 2 ? 1 : -1)));
      if (field[x][y] < last - 2) field[x][y]++;
      b >>= 2;
    }
  }
  field[W >> 1][H >> 1] = last - 1;
  field[x][y] = last;
  const rows = [];
  for (let r = 0; r < H; r++) rows.push("|" + field.map((col) => SYMBOLS[col[r]]).join("") + "|");
  return [frame(`[${type} ${bits}]`), ...rows, frame("[SHA256]")].join("\n");
}

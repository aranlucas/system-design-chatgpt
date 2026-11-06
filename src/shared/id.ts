const ID_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-";

export function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(21));
  let s = "";

  for (let i = 0; i < 21; i++) {
    s += ID_CHARS[bytes[i] & 63];
  }

  return s;
}

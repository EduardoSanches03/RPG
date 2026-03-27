export function isCharacterV1DualWriteEnabled() {
  return String(import.meta.env.VITE_FEATURE_CHARACTER_V1_DUAL_WRITE ?? "")
    .trim()
    .toLowerCase() === "true";
}

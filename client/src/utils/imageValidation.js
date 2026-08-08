

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGES = 5;

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

async function looksLikeDeclaredImageType(file) {
  try {
    const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (header.length < 4) return false;

    if (file.type === "image/jpeg") {
      return JPEG_SIGNATURE.every((b, i) => header[i] === b);
    }
    if (file.type === "image/png") {
      return PNG_SIGNATURE.every((b, i) => header[i] === b);
    }
    if (file.type === "image/webp") {
      const isRiff = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46;
      const isWebp = header.length >= 12 &&
        header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50;
      return isRiff && isWebp;
    }
    return true;
  } catch {
   
    return true;
  }
}

function isDuplicateOf(file, otherFile) {
  return (
    !!otherFile &&
    otherFile.name === file.name &&
    otherFile.size === file.size &&
    otherFile.lastModified === file.lastModified
  );
}

export async function validateDonationImage(file, existingFiles = []) {
  if (!file) return "לא נבחר קובץ";

  if (file.size === 0) {
    return "הקובץ ריק או פגום";
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "ניתן להעלות תמונות מסוג JPG, PNG או WEBP בלבד";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "גודל התמונה לא יכול לעלות על 5MB";
  }

  if (existingFiles.some((f) => isDuplicateOf(file, f))) {
    return "התמונה הזו כבר נוספה";
  }

  const looksValid = await looksLikeDeclaredImageType(file);
  if (!looksValid) {
    return "הקובץ נראה פגום או שאינו תמונה תקינה";
  }

  return null;
}

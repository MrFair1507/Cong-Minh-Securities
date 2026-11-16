// Bỏ dấu tiếng Việt và viết thường để tìm kiếm: "Sữa Việt Nam" -> "sua viet nam"
export function foldText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

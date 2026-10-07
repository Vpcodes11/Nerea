export function progressAt(scroll, chapters) {
  if (!chapters.length) return 0;
  let index = 0;
  while (index < chapters.length - 1 && scroll >= chapters[index + 1].top) index++;
  return Math.max(0, Math.min(chapters.length - 1, index + (scroll - chapters[index].top) / chapters[index].height));
}

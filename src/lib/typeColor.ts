// Soft hues that read well on the dark Emerald Night background.
export const TYPE_COLORS = ['#9FE0B8', '#7DD3C8', '#8EC5E8', '#B9A8E8', '#E8A8C0', '#EDB48E', '#E3CC7A', '#B8CC8E']

// The same name (any capitalisation) always gets the same colour, with nothing stored.
export function typeColor(name: string): string {
  let h = 0
  for (const ch of name.trim().toLowerCase()) h = (h * 31 + ch.codePointAt(0)!) >>> 0
  return TYPE_COLORS[h % TYPE_COLORS.length]
}

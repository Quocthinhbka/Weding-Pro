type Plain = Record<string, unknown>;
const isPlain = (v: unknown): v is Plain => typeof v === "object" && v !== null && !Array.isArray(v);

/** Ghép dữ liệu đã lưu lên giá trị mặc định, để trường mới thêm sau này vẫn có giá trị. */
export function mergeDefaults<T>(defaults: T, stored: unknown): T {
  if (!isPlain(defaults) || !isPlain(stored)) return (stored === undefined ? defaults : stored) as T;
  const out: Plain = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (key in stored) out[key] = mergeDefaults((defaults as Plain)[key], stored[key]);
  }
  return out as T;
}

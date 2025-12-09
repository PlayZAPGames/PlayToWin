export function replaceBigInt(obj){
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(replaceBigInt);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, replaceBigInt(v)])
    );
  }
  return obj;
}

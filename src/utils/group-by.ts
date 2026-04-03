export function groupBy<T, K>(list: T[], getKey: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of list) {
    const key = getKey(item);
    const value = map.get(key);
    if (value) {
      value.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

export function bigIntSerializer(payload: any): string {
    return JSON.stringify(payload, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    });
}
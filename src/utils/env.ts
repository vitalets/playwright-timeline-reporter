/** Read boolean environment variables, preserving unset values unless a default is provided. */
export function readBooleanEnvVar(name: string, defaultValue?: boolean): boolean | undefined {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value !== '' && value !== 'false' && value !== '0';
}

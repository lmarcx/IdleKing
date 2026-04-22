function parseBooleanEnv(value: string | undefined): boolean {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
}

export const DEV_MODE: boolean = parseBooleanEnv(process.env.NEXT_PUBLIC_DEV_MODE);

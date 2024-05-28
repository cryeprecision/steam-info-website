type SkipZeroOpts = {
  years?: boolean;
  days?: boolean;
  hours?: boolean;
  minutes?: boolean;
  seconds?: boolean;
};
type FormatDurationOpts = {
  padding?: boolean;
  skipZero?: boolean | SkipZeroOpts;
};

const SKIP_ZERO_DEFAULT: Required<SkipZeroOpts> = {
  years: true,
  days: true,
  hours: true,
  minutes: false,
  seconds: false
};

export function formatDuration(millisOrDate: number | Date, opts?: FormatDurationOpts) {
  // do it yourself function overloading
  if (millisOrDate instanceof Date) {
    const date = millisOrDate;
    return formatDuration(new Date().getTime() - date.getTime(), opts);
  }
  const millis = millisOrDate;

  const seconds = Math.floor(millis / 1000);
  const remainingSeconds = seconds % 60;

  const minutes = Math.floor(seconds / 60);
  const remainingMinutes = minutes % 60;

  const hours = Math.floor(minutes / 60);
  const remainingHours = hours % 24;

  const days = Math.floor(hours / 24);
  const remainingDays = days % 365;

  const years = Math.floor(days / 365);

  const padding = opts?.padding ?? false;

  function skipZero<Key extends keyof SkipZeroOpts>(key: Key): boolean {
    if (opts?.skipZero === undefined) {
      return SKIP_ZERO_DEFAULT[key];
    }
    if (typeof opts.skipZero === 'boolean') {
      return opts.skipZero;
    }
    const defaultValue: boolean = SKIP_ZERO_DEFAULT[key];
    const optValue: boolean | undefined = opts.skipZero[key];
    return optValue !== undefined ? optValue : defaultValue;
  }

  const format = padding
    ? (num: number, suffix: string, padMaxLength: number = 2) =>
        num.toFixed(0).padStart(padMaxLength, '0') + suffix
    : (num: number, suffix: string) => num.toFixed(0) + suffix;

  let result = '';

  if (!skipZero('years') || years !== 0) {
    result += format(years, 'y');
  }

  if (!skipZero('days') || remainingDays !== 0) {
    if (result.length !== 0) {
      result += ' ';
    }
    result += format(remainingDays, 'd', 3);
  }
  if (!skipZero('hours') || remainingHours !== 0) {
    if (result.length !== 0) {
      result += ' ';
    }
    result += format(remainingHours, 'h');
  }
  if (!skipZero('minutes') || remainingMinutes !== 0) {
    if (result.length !== 0) {
      result += ' ';
    }
    result += format(remainingMinutes, 'm');
  }
  if (!skipZero('seconds') || remainingSeconds !== 0) {
    if (result.length !== 0) {
      result += ' ';
    }
    result += format(remainingSeconds, 's');
  }

  return result;
}

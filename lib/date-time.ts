import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/** Fuso usado para agrupar jogos por dia e sincronizar com a API. */
export const APP_TIMEZONE = "America/Sao_Paulo";

/** Data de hoje (início do dia) no fuso da aplicação. */
export function getTodayStart(): Date {
  return dayjs().tz(APP_TIMEZONE).startOf("day").toDate();
}

/** Converte instante UTC da API para o dia civil no fuso da aplicação (Date @db.Date). */
export function getMatchDayFromUtc(utcInstant: Date | string): Date {
  return dayjs(utcInstant).tz(APP_TIMEZONE).startOf("day").toDate();
}

/** Formata YYYY-MM-DD no fuso da aplicação (para API e query string). */
export function formatDateKey(date?: Date | string): string {
  const d = date ? dayjs(date) : dayjs();
  return d.tz(APP_TIMEZONE).format("YYYY-MM-DD");
}

/** Interpreta YYYY-MM-DD como início do dia no fuso da aplicação. */
export function parseDateKey(dateKey: string): Date {
  return dayjs.tz(dateKey, APP_TIMEZONE).startOf("day").toDate();
}

/** Horário local (HH:mm) no fuso da aplicação. */
export function formatMatchTime(utcInstant: Date | string): string {
  return dayjs(utcInstant).tz(APP_TIMEZONE).format("HH:mm");
}

/** Normaliza Date do cliente para início do dia no fuso da aplicação. */
export function normalizeSelectedDate(date: Date): Date {
  const key = dayjs(date).tz(APP_TIMEZONE).format("YYYY-MM-DD");
  return parseDateKey(key);
}

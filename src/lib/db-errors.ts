import { toast } from "sonner";

interface DbErrorLike {
  code?: string;
  message?: string;
  details?: string;
}

/** Traduz erros do banco para mensagens claras em português. */
export function translateDbError(err: unknown): string {
  const e = (err ?? {}) as DbErrorLike;
  const text = `${e.message ?? ""} ${e.details ?? ""}`;
  if (e.code === "23505") return "Esse Parcel ID já existe neste condado.";
  if (text.includes("chk_rejection")) return "Informe o motivo da rejeição antes de salvar.";
  if (e.code === "42501") return "Sem permissão para esta operação. Entre novamente.";
  if (/failed to fetch|network/i.test(text)) return "Falha de conexão. Verifique sua internet.";
  return e.message || "Ocorreu um erro inesperado.";
}

export function toastDbError(err: unknown, context?: string) {
  const msg = translateDbError(err);
  toast.error(context ? `${context}: ${msg}` : msg);
}

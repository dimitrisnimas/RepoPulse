type LogFields = Record<string, string | number | boolean | undefined>;
export function logInfo(event: string, fields: LogFields) { console.info(JSON.stringify({ level: "info", event, ...fields })); }
export function logError(event: string, fields: LogFields) { console.error(JSON.stringify({ level: "error", event, ...fields })); }

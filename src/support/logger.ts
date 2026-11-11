import pino from 'pino';

/*
 * Flux pino-pretty partagé au niveau du module.
 *
 * pino.transport() démarre un worker thread. Le créer à chaque createLogger()
 * (un logger par scénario dans ConductorWorld) produisait N workers jamais
 * fermés, d'où des OOM sur les grosses suites. On le crée donc une seule fois,
 * paresseusement, et tous les loggers y écrivent. thread-stream vide et ferme
 * le worker à la sortie du process.
 */
let sharedPrettyStream: ReturnType<typeof pino.transport> | undefined;

/*
 * Retourne le flux pino-pretty partagé, créé au premier appel.
 *
 * @returns le flux unique du process (un seul worker thread)
 */
function getPrettyStream(): ReturnType<typeof pino.transport> {
  sharedPrettyStream ??= pino.transport({ target: 'pino-pretty', options: { colorize: true } });
  return sharedPrettyStream;
}

/*
 * Crée un logger pino.
 *
 * En production : JSON brut sur stdout, aucun worker. Hors production : sortie
 * lisible via le flux pino-pretty partagé (au plus un worker par process,
 * quel que soit le nombre de loggers).
 *
 * @param name nom du logger (champ "name" des lignes de log)
 * @returns le logger configuré (niveau LOG_LEVEL, "info" par défaut)
 */
export function createLogger(name: string) {
  const isDev = process.env.NODE_ENV !== 'production';
  const options = { name, level: process.env.LOG_LEVEL ?? 'info' };
  return isDev ? pino(options, getPrettyStream()) : pino(options);
}

export type ToolStatus = 'available' | 'next' | 'planned';

export interface OdinTool {
  id: string;
  order: number;
  slug: string;
  name: string;
  description: string;
  category: 'Tiempo' | 'Conexión' | 'Productividad' | 'Creación' | 'Cálculo';
  icon: string;
  status: ToolStatus;
  featured: boolean;
}

export const tools: OdinTool[] = [
  { id: 'U01', order: 1, slug: 'reloj-negro', name: 'Reloj negro', description: 'Hora limpia a pantalla completa, con movimiento protector y controles.', category: 'Tiempo', icon: '◷', status: 'available', featured: true },
  { id: 'U02', order: 2, slug: 'mi-ip', name: 'Mi IP', description: 'Comprende tu dirección pública y los datos disponibles de tu conexión.', category: 'Conexión', icon: '◎', status: 'next', featured: true },
  { id: 'U03', order: 3, slug: 'relojes-del-mundo', name: 'Relojes del mundo', description: 'Compara ciudades respetando sus zonas horarias y cambios estacionales.', category: 'Tiempo', icon: '◉', status: 'next', featured: true },
  { id: 'U06', order: 4, slug: 'cronometro-temporizador', name: 'Cronómetro y temporizador', description: 'Mide, pausa y recupera sesiones mediante tiempo real.', category: 'Tiempo', icon: '⌁', status: 'next', featured: true },
  { id: 'U10', order: 5, slug: 'alarmas', name: 'Alarmas', description: 'Programa avisos web y recupera los que vencieron mientras estabas fuera.', category: 'Tiempo', icon: '◇', status: 'next', featured: true },
  { id: 'U04', order: 6, slug: 'concentracion', name: 'Concentración', description: 'Ciclos de trabajo y descanso ajustables.', category: 'Productividad', icon: '◐', status: 'planned', featured: false },
  { id: 'U05', order: 7, slug: 'cuenta-atras', name: 'Cuenta atrás', description: 'Sigue el tiempo restante hasta tus acontecimientos.', category: 'Tiempo', icon: '△', status: 'planned', featured: false },
  { id: 'U07', order: 8, slug: 'generador-qr', name: 'Generador QR', description: 'Crea códigos QR localmente, sin enviar el contenido.', category: 'Creación', icon: '▦', status: 'planned', featured: false },
  { id: 'U08', order: 9, slug: 'calculadora-fechas', name: 'Calculadora de fechas', description: 'Suma días y calcula periodos entre fechas.', category: 'Cálculo', icon: '⌗', status: 'planned', featured: false },
  { id: 'U09', order: 10, slug: 'conversor-universal', name: 'Conversor universal', description: 'Convierte unidades habituales con claridad.', category: 'Cálculo', icon: '⇄', status: 'planned', featured: false },
];

const ipTool = tools.find((tool) => tool.id === 'U02');
if (ipTool) ipTool.status = 'available';
const worldClockTool = tools.find((tool) => tool.id === 'U03');
if (worldClockTool) worldClockTool.status = 'available';
const timerTool = tools.find((tool) => tool.id === 'U06');
if (timerTool) {
  timerTool.status = 'available';
  timerTool.name = 'Temporizador y cronómetro';
  timerTool.description = 'Programa una cuenta atrás o mide el tiempo transcurrido.';
}
const alarmsTool = tools.find((tool) => tool.id === 'U10');
if (alarmsTool) alarmsTool.status = 'available';
const focusTool = tools.find((tool) => tool.id === 'U04');
if (focusTool) {
  focusTool.status = 'available';
  focusTool.name = 'Concentración · Pomodoro';
  focusTool.description = 'Alterna sesiones de concentración y descanso configurables.';
}
const datesTool = tools.find((tool) => tool.id === 'U08');
if (datesTool) datesTool.status = 'available';
const converterTool = tools.find((tool) => tool.id === 'U09');
if (converterTool) converterTool.status = 'available';
const qrTool = tools.find((tool) => tool.id === 'U07');
if (qrTool) qrTool.status = 'available';
tools.push({ id: 'U12', order: 12, slug: 'calendario', name: 'Calendario', description: 'Consulta calendarios mensuales o anuales con sus festivos.', category: 'Tiempo', icon: '▦', status: 'planned', featured: false });
tools.push({ id: 'U11', order: 11, slug: 'fases-lunares', name: 'Fases lunares', description: 'Consulta la fase actual de la Luna y sus próximos cambios.', category: 'Tiempo', icon: '◐', status: 'planned', featured: false });
tools.push({ id: 'U13', order: 13, slug: 'html-a-texto', name: 'HTML a texto', description: 'Extrae el texto legible de un documento HTML sin ejecutarlo.', category: 'Creación', icon: 'Aa', status: 'available', featured: false });

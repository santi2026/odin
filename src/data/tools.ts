import catalog from '../../catalog-data.json';

export type ToolStatus = 'available' | 'next' | 'planned';
export type ToolCategory = 'Tiempo' | 'Cálculo' | 'Texto y datos' | 'Seguridad' | 'Creación' | 'Conexión' | 'Productividad';

export interface OdinTool {
  id: string;
  order: number;
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  status: ToolStatus;
  featured: boolean;
  href: string;
  cover: string;
  preview: string;
}

export const tools = catalog.tools as OdinTool[];
export const categoryOrder = catalog.categoryOrder as ToolCategory[];

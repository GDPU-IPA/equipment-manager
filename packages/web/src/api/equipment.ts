import axios, { type AxiosInstance } from 'axios';

export interface Equipment {
  id: number;
  name: string;
  category_id: number;
  description: string | null;
  total_stock: number;
  available_stock: number;
  status: number;
  category: { name: string } | null;
  created_at?: string;
  updated_at?: string;
}
export interface Category { id: number; parent_id: number | null; name: string }
export interface EquipmentPage { list: Equipment[]; total: number; page: number; pageSize: number }
export interface EquipmentQuery { page: number; pageSize: number; name?: string; category_id?: number }

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';
const integer = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0;
function validEquipment(v: unknown): v is Equipment {
  return object(v) && integer(v.id) && v.id > 0 && typeof v.name === 'string'
    && integer(v.category_id) && integer(v.total_stock) && integer(v.available_stock)
    && typeof v.status === 'number' && (v.description === null || typeof v.description === 'string')
    && (v.category === null || (object(v.category) && typeof v.category.name === 'string'));
}
function unwrap(v: unknown): unknown {
  if (!object(v) || v.code !== 200 || !('data' in v)) throw new Error('接口返回格式不符合约定，请联系后端同学检查。');
  return v.data;
}
export function equipmentError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401 || status === 403) return '后端要求登录或访问权限。当前体验账号不是后端账号，请先完成真实登录接口对接。';
    if (status === 404) return '未找到这件器材，或后端尚未提供此接口。';
    if (error.code === 'ECONNABORTED') return '请求超时，请稍后重试。';
    return '暂时无法读取后端数据，请确认新版后端已启动，再点击重试。';
  }
  return error instanceof Error ? error.message : '读取失败，请重试。';
}

// 仅请求器材只读接口；本地演示身份不会作为真实登录凭据发送。
export function createEquipmentApi(client: AxiosInstance = axios.create({ baseURL: '/api', timeout: 12000 })) {
  return {
    async list(params: EquipmentQuery, signal?: AbortSignal): Promise<EquipmentPage> {
      const data = unwrap((await client.get('/equipments', { params, signal })).data);
      if (!object(data) || !Array.isArray(data.list) || !data.list.every(validEquipment)
        || !integer(data.total) || !integer(data.page) || data.page < 1
        || !integer(data.pageSize) || data.pageSize < 1) throw new Error('器材列表格式不正确，请检查后端接口。');
      return data as unknown as EquipmentPage;
    },
    async categories(signal?: AbortSignal): Promise<Category[]> {
      const data = unwrap((await client.get('/categories', { signal })).data);
      if (!Array.isArray(data) || !data.every(v => object(v) && integer(v.id) && v.id > 0
        && typeof v.name === 'string' && (v.parent_id === null || integer(v.parent_id)))) {
        throw new Error('分类格式不正确，请检查后端接口。');
      }
      return data as Category[];
    },
    async detail(id: number, signal?: AbortSignal): Promise<Equipment> {
      if (!Number.isSafeInteger(id) || id <= 0) throw new Error('器材编号无效。');
      const data = unwrap((await client.get(`/equipments/${id}`, { signal })).data);
      if (!validEquipment(data)) throw new Error('器材详情格式不正确，请检查后端接口。');
      return data;
    },
  };
}

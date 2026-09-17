import { z } from 'zod';

// 1. 共享类型
export interface User {
  id: number;
  username: string;
  email: string;
}

// 2. 共享校验规则 (前后端复用)
export const CreateUserSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符'),
  email: z.string().email('请输入正确的邮箱'),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
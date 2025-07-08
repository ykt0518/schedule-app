import {z} from "zod";

export const validationSchema = z.object({
  email: z
    .string()
    .nonempty("メールアドレスを入力してください")
    .email("正確なメールアドレスを入力してください"),
    password: z
    .string()
    .nonempty("パスワードを入力してください")
    .min(6, "6文字以上のパスワードにしてください"),
});
// import {jsonwebtoken} from 'jsonwebtoken'
// import {bcrypt} from 'bcrypt'
import { Router } from 'express';
import type { Request, Response } from 'express';
// import type { Prisma } from '../db.js';
import { prisma } from '../db.js';

const router: Router = Router();

router.post('/', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.send({ code: 402, msg: '请输入用户名或密码' });
    }
    try {
        const accountInfo = await prisma.user.findUnique({
            where: { username:username }
        })
        if (!accountInfo) { return res.send({ code: 401, msg: '用户名或密码错误' }) }
        res.send({
            code: 200,
            msg: '登录成功',
            data: {
                token: 'temp-token',
                role: accountInfo.role,
                profile:accountInfo.profile
            }
        })
    } catch (err) {
        console.log(err)
        res.status(500).send({ code: 500, msg: '服务器错误' })
    }
})



export default router;

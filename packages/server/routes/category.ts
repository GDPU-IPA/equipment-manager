import express, { Router } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';


const router:Router=express.Router()
const prisma=new PrismaClient()


router.get('/',(req:any,res:any)=>{
    res.send("404")
})

router.get('/categories',async(req:any,res:any)=>{
    const categories=await prisma.itemCategory.findMany();
    res.send(categories)
})







export default router
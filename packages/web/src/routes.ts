import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [

    {
        path: '/',
        component: () => import('./components/Items.vue')
    },
    {
        path: '/borrows',
        component: () => import('./components/Borrows.vue')
    }






]


export default routes
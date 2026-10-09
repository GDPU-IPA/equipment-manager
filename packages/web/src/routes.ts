import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [

    {
        path: '/login',
        name: 'login',
        component: () => import('./components/Login.vue'),
        meta: { layout: 'auth' }
    },

    {
        path: '/',
        component: () => import('./components/Items.vue')
    },
    {
        path: '/item',
        component: () => import('./components/Items.vue')
    },
    {
        path: '/borrows',
        component: () => import('./components/Borrows.vue')
    }


]


export default routes

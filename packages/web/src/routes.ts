import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [

    {
        path: '/login',
        name: 'login',
        component: () => import('./components/Login.vue'),
        meta: { layout: 'auth' }
    },

    {
        path: '/account',
        component: () => import('./components/Account.vue')
    },
    {
        path: '/users',
        component: () => import('./components/Users.vue'),
        meta: { admin: true }
    },
    {
        path: '/',
        component: () => import('./components/Dashboard.vue')
    },
    {
        path: '/item',
        component: () => import('./components/Items.vue'),
        meta: { admin: true }
    },
    {
        path: '/borrows',
        component: () => import('./components/Borrows.vue')
    },
    {
        path: '/categories',
        component: () => import('./components/Categories.vue')
    }



]


export default routes

import { createRouter, createWebHistory } from 'vue-router'
import routes from '../routes'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { errorMessage } from '../api'
import { clearSession, loadCurrentUser } from '../session'


const router = createRouter({
    history:createWebHistory(),
    routes,
})

router.beforeEach(async to => {
    if (to.meta.layout === 'auth') return true
    if (!localStorage.getItem('token')) return '/login'
    try {
        const user = await loadCurrentUser()
        if (to.meta.admin && user.role !== 'admin') return '/'
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            clearSession()
            return '/login'
        }
        ElMessage.error(errorMessage(error))
        return false
    }
    return true
})

export default router

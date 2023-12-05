import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MultiMech from '../views/MultiMech.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/links',
            name: 'links',
            component: () => import('../views/LinksView.vue')
        },
        {
            path: '/mm',
            name: 'multimech',
            component: () => import('../views/MultiMech.vue')
        },
        {
            path: '/mechs',
            name: 'mechs',
            component: () => import('../views/Mechs.vue'),
        },
        {
            path: '/mech-details/:mech',
            name: 'mech-details',
            component: () => import('../views/MechDetails.vue'),
        },
        {
            path: '/build-planner',
            name: 'build-planner',
            component: () => import('../views/BuildPlanner.vue'),
        },
        {
            path: '/map',
            name: 'map',
            component: () => import('../views/MapView.vue'),
        },
        {
            path: '/openings',
            name: 'opening',
            component: () => import('../views/Openings.vue'),
        },
        {
            path: '/replay',
            name: 'replay',
            component: () => import('../views/Replay.vue'),
        },
        {
            path: '/replay-shortener',
            name: 'replay-shortener',
            component: () => import('../views/FixReplay.vue'),
        },
    ]
})

export default router

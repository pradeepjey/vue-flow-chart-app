import { createRouter, createWebHistory, type Router, type RouteRecordRaw, type RouterHistory } from 'vue-router'
import FlowView from '@/views/FlowView.vue'
import NodeDetailsDrawer from '@/components/drawer/NodeDetailsDrawer.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: FlowView,
    children: [
      { path: '', name: 'flow', component: { render: () => null } },
      {
        // Details drawer is addressable by node id: /nodes/b6a0c1
        path: 'nodes/:nodeId',
        name: 'node',
        component: NodeDetailsDrawer,
        props: true,
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: { name: 'flow' } },
]

export function createAppRouter(history: RouterHistory = createWebHistory(import.meta.env.BASE_URL)): Router {
  return createRouter({ history, routes })
}

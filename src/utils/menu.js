// 侧边栏菜单从路由表派生（SSOT）。
//
// 路由在 meta.menu 上声明菜单元数据，这里按当前角色过滤、排序，交给
// MainLayout 渲染。此前四个角色各维护一份硬编码模板块（约 170 行），新增
// 页面要记得改菜单还得防四个块漂移；现在菜单项与路由声明在同一处，路由
// 表就是菜单的唯一事实来源。
//
// meta.menu 字段：
//   icon   Element Plus 图标组件名（@element-plus/icons-vue 的导出名）
//   label  菜单文案；缺省用 meta.title。两者允许不同：title 进面包屑和
//          浏览器标签页，label 是侧边栏短文案（如「论文工作台」vs「学生仪表盘」）
//   group  分组子标签（如「查重管理」）；缺省/null 表示无分组
//   order  在该角色菜单中的排序位置（必填，缺了沉底）
//   roles  覆盖「谁能看到这一项」；缺省依次继承路由自身 meta.roles、
//          父路由 meta.roles
//   hidden true 表示该路由刻意不进菜单（详情页、容器路由等），仅作文档标注
//   spacer 在这一项之前渲染一段留白（各角色菜单尾部设置项前）
//   badge  角标数据源标识；目前支持 'chat'（聊天未读，由 messageStore.chatUnread
//          供给），MainLayout 据此渲染 el-badge，菜单数据本身不含计数
//   top    顶栏导航声明 { order, label?, match?, exact? }；缺省不进顶栏。
//          order 顶栏内排序；label 顶栏短文案（常与菜单 label 不同，如
//          「工作台」vs「论文工作台」），缺省用菜单 label/meta.title；
//          match 高亮前缀数组，缺省 [path]——一项要覆盖多个路径族时显式给
//          （如「论文管理」match: ['/student/paper', '/student/my-papers']）；
//          exact: true 只精确匹配（一级路径上的工作台项用，否则前缀匹配
//          会在所有下属页常亮）
//
// 同一路由出现在多个角色菜单的不同位置时（如「查重配置」：ADMIN 归
// 「系统管理」组、超管归「系统运维」组），用角色名作 key 写覆盖块：
//   menu: { icon: 'Operation', ADMIN: { group: '系统管理', order: 8 }, SUPER_ADMIN: { group: '系统运维', order: 8 } }

// 菜单图标登记表：全局图标注册已移除（main.js 不再全量 app.component），
// 菜单的字符串图标名在这里显式解析。只登记菜单实际用到的图标，打包器
// 可以 tree-shake 掉 @element-plus/icons-vue 的其余 260+ 个组件。
// 新增菜单项若用了登记表外的图标，在这里补一行即可。
import {
  DataAnalysis, DataBoard, UploadFilled, FolderOpened, Trophy, Star,
  ChatDotRound, Folder, Setting, Service, Histogram, Document, Notebook,
  UserFilled, Clock, TrendCharts, Microphone, Odometer, Connection, Tools,
  Monitor, Calendar, Files, Collection, Operation, Bell, SetUp, Message
} from '@element-plus/icons-vue'

const ElIcons = {
  DataAnalysis, DataBoard, UploadFilled, FolderOpened, Trophy, Star,
  ChatDotRound, Folder, Setting, Service, Histogram, Document, Notebook,
  UserFilled, Clock, TrendCharts, Microphone, Odometer, Connection, Tools,
  Monitor, Calendar, Files, Collection, Operation, Bell, SetUp, Message
}

// 侧边栏顶部大标题按角色固定。导出供面包屑复用：角色分区父路由的父级标题
// 与这里的分区名保持一致（如超管访问 /admin/* 时父级显示「系统管理」）。
export const SECTION_LABELS = {
  STUDENT: '学生',
  TEACHER: '教师',
  ADMIN: '业务管理',
  SUPER_ADMIN: '系统管理',
}

// 应用角色覆盖块：menu[role] 的字段覆盖同名字段。
const resolve = (menu, role) => ({ ...menu, ...(menu[role] || {}) })

const joinPath = (parent, child) => {
  if (!child) return parent
  if (child.startsWith('/')) return child
  return `${parent.replace(/\/+$/, '')}/${child}`
}

function collect(records, inheritedRoles, basePath, role, out) {
  for (const record of records) {
    const meta = record.meta || {}
    const path = joinPath(basePath, record.path)
    const menu = meta.menu ? resolve(meta.menu, role) : null
    // 生效角色：menu.roles 优先（把共用路由限定给某个角色的菜单，如超管的
    // 「系统配置」），其次路由自身 meta.roles，最后父路由的。
    const roles = (menu && menu.roles) || meta.roles || inheritedRoles
    if (menu && !menu.hidden && roles.includes(role)) {
      out.push({
        path,
        label: menu.label || meta.title || path,
        icon: menu.icon ? ElIcons[menu.icon] : null,
        group: menu.group || null,
        order: typeof menu.order === 'number' ? menu.order : Number.MAX_SAFE_INTEGER,
        spacer: Boolean(menu.spacer),
        badge: menu.badge || null,
      })
    }
    if (record.children?.length) {
      collect(record.children, roles, path, role, out)
    }
  }
}

// 从路由表构建指定角色的侧边栏菜单。
// 返回 { label: 顶部大标题, items: [{ path, label, icon, groupLabel, spacer }] }，
// items 已按 order 排序；groupLabel 是显示在本项之上的分组子标签，只在
// group 相对上一项发生变化且非空时给出，模板无需自己跟踪分组状态。
export function buildMenus(routes, role) {
  const items = []
  collect(routes, [], '/', role, items)
  items.sort((a, b) => a.order - b.order)
  return {
    label: SECTION_LABELS[role] || '菜单',
    items: items.map((item, index) => ({
      ...item,
      groupLabel: item.group && item.group !== items[index - 1]?.group ? item.group : null,
    })),
  }
}

function collectTop(records, inheritedRoles, basePath, role, out) {
  for (const record of records) {
    const meta = record.meta || {}
    const path = joinPath(basePath, record.path)
    const menu = meta.menu ? resolve(meta.menu, role) : null
    // 与侧边栏同一套 roles 解析：顶栏项也能用 menu.roles 限定角色
    // （如「论文管理」只进 ADMIN 顶栏、不进超管顶栏）
    const roles = (menu && menu.roles) || meta.roles || inheritedRoles
    if (menu?.top && roles.includes(role)) {
      out.push({
        path,
        label: menu.top.label || menu.label || meta.title || path,
        order: typeof menu.top.order === 'number' ? menu.top.order : Number.MAX_SAFE_INTEGER,
        match: menu.top.match || [path],
        exact: Boolean(menu.top.exact),
      })
    }
    if (record.children?.length) {
      collectTop(record.children, roles, path, role, out)
    }
  }
}

// 从路由表构建指定角色的顶栏导航。返回 [{ path, label, match, exact }]，
// 已按 top.order 排序；高亮逻辑（match 前缀/exact）在 MainLayout。
export function buildTopNav(routes, role) {
  const items = []
  collectTop(routes, [], '/', role, items)
  items.sort((a, b) => a.order - b.order)
  return items
}

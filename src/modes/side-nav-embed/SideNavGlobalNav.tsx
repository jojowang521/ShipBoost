import {
  Bell,
  CircleDollarSign,
  FileCog,
  Headphones,
  Landmark,
  MoreHorizontal,
  Settings,
  Store,
} from 'lucide-react'
import type { ReactNode } from 'react'

const MINGYUAN_LOGO_SRC = '/aui-native/brand/mingyuanyun-white.svg'
const SIDE_NAV_ICON_SIZE = 16

function AssistantNavIcon() {
  return (
    <svg width={SIDE_NAV_ICON_SIZE} height={SIDE_NAV_ICON_SIZE} viewBox="0 0 16 16" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.60631 10.3624C6.54604 10.1288 6.42429 9.91566 6.25371 9.74508C6.08312 9.5745 5.86995 9.45274 5.63636 9.39248L1.49534 8.32466C1.42469 8.3046 1.36251 8.26205 1.31823 8.20346C1.27396 8.14487 1.25 8.07343 1.25 7.99999C1.25 7.92655 1.27396 7.85511 1.31823 7.79652C1.36251 7.73793 1.42469 7.69538 1.49534 7.67532L5.63636 6.60683C5.86987 6.54662 6.08299 6.42497 6.25356 6.25451C6.42414 6.08406 6.54594 5.87102 6.60631 5.63755L7.67413 1.49654C7.69398 1.42561 7.73648 1.36312 7.79517 1.31861C7.85385 1.27409 7.92548 1.25 7.99913 1.25C8.07278 1.25 8.14442 1.27409 8.2031 1.31861C8.26178 1.36312 8.30429 1.42561 8.32414 1.49654L9.39128 5.63755C9.45154 5.87115 9.5733 6.08432 9.74388 6.2549C9.91446 6.42549 10.1276 6.54724 10.3612 6.6075L14.5022 7.67465C14.5735 7.69429 14.6363 7.73675 14.681 7.79552C14.7258 7.85429 14.75 7.92612 14.75 7.99999C14.75 8.07386 14.7258 8.14569 14.681 8.20446C14.6363 8.26323 14.5735 8.30569 14.5022 8.32533L10.3612 9.39248C10.1276 9.45274 9.91446 9.5745 9.74388 9.74508C9.5733 9.91566 9.45154 10.1288 9.39128 10.3624L8.32346 14.5034C8.30361 14.5744 8.2611 14.6369 8.20242 14.6814C8.14374 14.7259 8.07211 14.75 7.99846 14.75C7.9248 14.75 7.85317 14.7259 7.79449 14.6814C7.73581 14.6369 7.6933 14.5744 7.67345 14.5034L6.60631 10.3624Z" fill="currentColor" />
      <path d="M12.9838 3.37498C12.9615 3.28846 12.9164 3.20951 12.8532 3.14633C12.79 3.08315 12.7111 3.03806 12.6246 3.01574L11.0909 2.62025C11.0647 2.61282 11.0417 2.59706 11.0253 2.57536C11.0089 2.55366 11 2.5272 11 2.5C11 2.4728 11.0089 2.44634 11.0253 2.42464C11.0417 2.40294 11.0647 2.38718 11.0909 2.37975L12.6246 1.98401C12.7111 1.96171 12.79 1.91666 12.8532 1.85353C12.9163 1.79039 12.9615 1.71149 12.9838 1.62502L13.3793 0.09131C13.3867 0.0650403 13.4024 0.0418967 13.4241 0.0254103C13.4459 0.00892392 13.4724 0 13.4997 0C13.527 0 13.5535 0.00892392 13.5752 0.0254103C13.597 0.0418967 13.6127 0.0650403 13.6201 0.09131L14.0153 1.62502C14.0376 1.71154 14.0827 1.79049 14.1459 1.85367C14.2091 1.91685 14.288 1.96194 14.3745 1.98426L15.9082 2.3795C15.9346 2.38678 15.9579 2.4025 15.9745 2.42427C15.991 2.44604 16 2.47264 16 2.5C16 2.52736 15.991 2.55396 15.9745 2.57573C15.9579 2.5975 15.9346 2.61322 15.9082 2.6205L14.3745 3.01574C14.288 3.03806 14.2091 3.08315 14.1459 3.14633C14.0827 3.20951 14.0376 3.28846 14.0153 3.37498L13.6198 4.90869C13.6125 4.93496 13.5967 4.9581 13.575 4.97459C13.5532 4.99108 13.5267 5 13.4994 5C13.4722 5 13.4456 4.99108 13.4239 4.97459C13.4022 4.9581 13.3864 4.93496 13.3791 4.90869L12.9838 3.37498Z" fill="currentColor" />
    </svg>
  )
}

export function SideNavGlobalNav({
  settingsSlot,
  onAssistantClick,
  onFinanceClick,
  activeItem = 'finance',
}: {
  settingsSlot?: ReactNode
  onAssistantClick?: () => void
  onFinanceClick?: () => void
  activeItem?: 'assistant' | 'finance'
}) {
  const navItems = [
    { label: 'AI 助手', icon: <AssistantNavIcon />, active: activeItem === 'assistant', onClick: onAssistantClick },
    { label: '财务管理', icon: <Landmark size={SIDE_NAV_ICON_SIZE} />, active: activeItem === 'finance', onClick: onFinanceClick },
    { label: '成本投资', icon: <CircleDollarSign size={SIDE_NAV_ICON_SIZE} /> },
    { label: '资管中心', icon: <FileCog size={SIDE_NAV_ICON_SIZE} /> },
    { label: '租赁中心', icon: <Store size={SIDE_NAV_ICON_SIZE} /> },
    { label: '更多', icon: <MoreHorizontal size={SIDE_NAV_ICON_SIZE} /> },
  ]

  return (
    <aside className="side-nav-global" aria-label="全局侧边导航">
      <div className="side-nav-global__logo" aria-label="明源云">
        <img src={MINGYUAN_LOGO_SRC} alt="明源云" draggable={false} />
      </div>
      <nav className="side-nav-global__menu" aria-label="产品模块导航">
        {navItems.map(item => (
          <button
            type="button"
            key={item.label}
            className={`side-nav-global__item${item.active ? ' side-nav-global__item--active' : ''}`}
            aria-current={item.active ? 'page' : undefined}
            onClick={item.onClick}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="side-nav-global__tools" aria-label="全局操作">
        <button type="button" aria-label="服务支持" title="服务支持"><Headphones size={SIDE_NAV_ICON_SIZE} /></button>
        <button type="button" className="side-nav-global__badge" aria-label="通知" title="通知">
          <Bell size={SIDE_NAV_ICON_SIZE} />
        </button>
        {settingsSlot ?? <button type="button" aria-label="设置" title="设置"><Settings size={SIDE_NAV_ICON_SIZE} /></button>}
        <button type="button" className="side-nav-global__avatar" aria-label="系统管理员" title="系统管理员">
          <span aria-hidden="true">系</span>
        </button>
      </div>
    </aside>
  )
}

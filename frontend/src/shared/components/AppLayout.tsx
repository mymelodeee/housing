import { NavLink, Outlet } from 'react-router-dom'
import './AppLayout.css'

export function AppLayout() {
  return (
    <div className="app-layout">
      <header className="app-layout__header">
        <NavLink to="/" className="app-layout__logo">
          housing
        </NavLink>
        <nav className="app-layout__nav">
          <NavLink
            to="/favorites"
            className={({ isActive }) =>
              isActive ? 'app-layout__nav-link app-layout__nav-link--active' : 'app-layout__nav-link'
            }
          >
            즐겨찾기
          </NavLink>
          <NavLink
            to="/comparison-sets"
            className={({ isActive }) =>
              isActive ? 'app-layout__nav-link app-layout__nav-link--active' : 'app-layout__nav-link'
            }
          >
            비교셋
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              isActive ? 'app-layout__nav-link app-layout__nav-link--active' : 'app-layout__nav-link'
            }
          >
            내 정보
          </NavLink>
        </nav>
      </header>
      <main className="app-layout__content">
        <Outlet />
      </main>
    </div>
  )
}

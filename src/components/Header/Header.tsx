import { NavLink } from 'react-router-dom'
import styles from './Header.module.scss'

const Header = () => {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>wwe2kHub</h1>
      <nav className={styles.nav}>
        <NavLink 
          to="/" 
          className={({ isActive }) => isActive ? `${styles.navButton} ${styles.active}` : styles.navButton}
        >
          Home
        </NavLink>
        <NavLink 
          to="/about" 
          className={({ isActive }) => isActive ? `${styles.navButton} ${styles.active}` : styles.navButton}
        >
          About
        </NavLink>
        <NavLink 
          to="/roster" 
          className={({ isActive }) => isActive ? `${styles.navButton} ${styles.active}` : styles.navButton}
        >
          Roster
        </NavLink>
      </nav>
    </header>
  )
}

export default Header

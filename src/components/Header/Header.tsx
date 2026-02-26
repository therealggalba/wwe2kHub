import { NavLink, Link } from 'react-router-dom'
import styles from './Header.module.scss'

const Header = () => {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.titleLink}>
        <h1 className={styles.title}>wwe2kHub</h1>
      </Link>
      <nav className={styles.nav}>
        <NavLink 
          to="/" 
          className={({ isActive }) => isActive ? `${styles.navButton} ${styles.active}` : styles.navButton}
        >
          Home
        </NavLink>
        <NavLink 
          to="/roster" 
          className={({ isActive }) => isActive ? `${styles.navButton} ${styles.active}` : styles.navButton}
        >
          Roster
        </NavLink>
        <NavLink 
          to="/archive" 
          className={({ isActive }) => isActive ? `${styles.navButton} ${styles.active}` : styles.navButton}
        >
          Archive
        </NavLink>
        <NavLink 
          to="/options" 
          className={({ isActive }) => isActive ? `${styles.navButton} ${styles.active}` : styles.navButton}
        >
          Options
        </NavLink>
      </nav>
    </header>
  )
}

export default Header

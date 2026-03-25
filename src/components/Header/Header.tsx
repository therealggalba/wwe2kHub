import { NavLink, Link } from 'react-router-dom'
import styles from './Header.module.scss'
import { useTranslation } from 'react-i18next'

const Header = () => {
  const { t } = useTranslation();
  return (
    <header className={styles.header}>
      <Link to="/home" className={styles.titleLink}>
        <h1 className={styles.title}>ELITE<span>BOOKER</span></h1>
      </Link>
      <nav className={styles.nav}>
        <NavLink 
          to="/home" 
          className={({ isActive }) => isActive ? `${styles.navButton} ${styles.active}` : styles.navButton}
        >
          {t('common.home')}
        </NavLink>
        <NavLink 
          id="nav-roster"
          to="/roster" 
          className={({ isActive }) => isActive ? `${styles.navButton} ${styles.active}` : styles.navButton}
        >
          {t('common.roster')}
        </NavLink>
        <NavLink 
          to="/archive" 
          className={({ isActive }) => isActive ? `${styles.navButton} ${styles.active}` : styles.navButton}
        >
          {t('common.archive')}
        </NavLink>
        <NavLink 
          id="nav-options"
          to="/options" 
          className={({ isActive }) => isActive ? `${styles.navButton} ${styles.active}` : styles.navButton}
        >
          {t('common.options')}
        </NavLink>
      </nav>
    </header>
  )
}

export default Header

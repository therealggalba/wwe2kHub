import React from 'react'
import Header from '../Header/Header'
import styles from './Layout.module.scss'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  )
}

export default Layout

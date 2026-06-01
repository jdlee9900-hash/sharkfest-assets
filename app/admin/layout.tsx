import Image from 'next/image'
import Link from 'next/link'
import { AdminNav } from '@/components/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="adm-header">
        <div className="adm-header-top">
          <div className="adm-header-brand">
            <Link href="/" className="rc-header-logo" aria-label="SharkFest home">
              <Image src="/logo.png" alt="Torbay Sharks RFC" width={32} height={32} />
              <span>SharkFest</span>
            </Link>
            <span className="adm-header-badge">Admin</span>
          </div>
          <Link href="/" className="adm-header-home">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to site
          </Link>
        </div>
        <AdminNav />
      </header>
      {children}
    </>
  )
}

import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { appUrl } from './appUrl'

// Marketing deployment only serves /. Deep links and bookmarked app paths
// should land on the app subdomain with the same path preserved.
export default function RedirectToApp() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    window.location.replace(`${appUrl(pathname)}${search}${hash}`)
  }, [pathname, search, hash])

  return null
}

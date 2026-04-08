import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <span className="text-[70px] leading-none font-semibold tracking-tight text-foreground select-none">
        404 :(
      </span>
      <Button variant="outline" asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}

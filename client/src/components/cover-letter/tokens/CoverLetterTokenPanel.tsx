import { useEffect, useLayoutEffect, useRef } from 'react'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { UpgradeCTA } from '@/components/billing/UpgradeCTA'
import { Input } from '@/components/ui/input'
import { PersistentScrollArea } from '@/components/ui/persistent-scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  type EditableCoverLetterToken,
  formatToken,
  getDuplicateTokenKeyIds,
  normalizeTokenKey,
} from './tokenUtils'
import { UnresolvedTokensIndicator } from './UnresolvedTokensIndicator'

interface CoverLetterTokenPanelProps {
  tokens: EditableCoverLetterToken[]
  unresolvedTokens?: string[]
  isLoading?: boolean
  className?: string
  variant?: 'card' | 'section'
  // Max token definitions the plan allows (null = unlimited, Pro). When the cap
  // is hit and `onUpgrade` is set (Free), the add button becomes an upgrade CTA.
  tokenLimit?: number | null
  // Tokens archived by a downgrade — surfaced as a small notice when > 0.
  hiddenCount?: number
  onUpgrade?: () => void
  onTokenChange: (
    id: string,
    patch: Partial<Pick<EditableCoverLetterToken, 'key' | 'value'>>,
  ) => void
  onTokenDelete: (id: string) => void
  onTokenAdd: () => void
  onTokenBlur: () => void
  focusTokenKey?: string | null
  onFocusTokenKeyHandled?: () => void
}

export function CoverLetterTokenPanel({
  tokens,
  unresolvedTokens = [],
  isLoading = false,
  className,
  variant = 'card',
  tokenLimit = null,
  hiddenCount = 0,
  onUpgrade,
  onTokenChange,
  onTokenDelete,
  onTokenAdd,
  onTokenBlur,
  focusTokenKey = null,
  onFocusTokenKeyHandled,
}: CoverLetterTokenPanelProps) {
  const unresolvedKeys = new Set(
    unresolvedTokens.map((token) => normalizeTokenKey(token)),
  )
  const duplicateKeyIds = getDuplicateTokenKeyIds(tokens)
  const isSection = variant === 'section'
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const keyInputRefs = useRef(new Map<string, HTMLInputElement>())
  const valueInputRefs = useRef(new Map<string, HTMLInputElement>())
  const tokenRowRefs = useRef(new Map<string, HTMLDivElement>())
  const pendingNewTokenRef = useRef(false)
  const onFocusTokenKeyHandledRef = useRef(onFocusTokenKeyHandled)

  useEffect(() => {
    onFocusTokenKeyHandledRef.current = onFocusTokenKeyHandled
  }, [onFocusTokenKeyHandled])

  useLayoutEffect(() => {
    if (!focusTokenKey) return

    const normalized = normalizeTokenKey(focusTokenKey)
    const token = tokens.find(
      (item) => normalizeTokenKey(item.key) === normalized,
    )
    if (!token) return

    const tokenId = token.id
    const viewport = scrollViewportRef.current
    const row = tokenRowRefs.current.get(token.id)
    if (row && viewport) {
      const rowRect = row.getBoundingClientRect()
      const viewportRect = viewport.getBoundingClientRect()

      if (rowRect.top < viewportRect.top) {
        viewport.scrollBy({
          top: rowRect.top - viewportRect.top,
          behavior: 'smooth',
        })
      } else if (rowRect.bottom > viewportRect.bottom) {
        viewport.scrollBy({
          top: rowRect.bottom - viewportRect.bottom,
          behavior: 'smooth',
        })
      }
    }

    let cancelled = false

    function tryFocus() {
      if (cancelled) return false

      const input = valueInputRefs.current.get(tokenId)
      if (!input) return false

      input.focus({ preventScroll: true })
      onFocusTokenKeyHandledRef.current?.()
      return true
    }

    // Defer past editor canvas click handlers that would steal focus back.
    const timer = window.setTimeout(() => {
      if (!tryFocus()) {
        requestAnimationFrame(() => tryFocus())
      }
    }, 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [focusTokenKey, tokens])

  useLayoutEffect(() => {
    if (!pendingNewTokenRef.current) return
    pendingNewTokenRef.current = false

    const viewport = scrollViewportRef.current
    const lastToken = tokens.at(-1)

    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight - viewport.clientHeight,
        behavior: 'smooth',
      })
    }

    if (lastToken) {
      keyInputRefs.current.get(lastToken.id)?.focus()
    }
  }, [tokens])

  const atTokenLimit = tokenLimit !== null && tokens.length >= tokenLimit

  function handleTokenAdd() {
    // Free users at their token cap get an upgrade prompt instead of a new row.
    if (atTokenLimit) {
      onUpgrade?.()
      return
    }
    pendingNewTokenRef.current = true
    onTokenAdd()
  }

  return (
    <section
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden',
        isSection
          ? 'bg-transparent'
          : 'rounded-lg border border-border bg-secondary',
        className,
      )}
    >
      {!isSection && (
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2 text-[12px] font-semibold tracking-[0.06em] text-text-faint uppercase">
            <Tag size={13} />
            Tokens
            {tokenLimit !== null && (
              <div
                className={cn(
                  'rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[11px] leading-none tracking-normal text-muted-foreground normal-case',
                  atTokenLimit &&
                    'border-brand-border bg-brand-soft text-brand',
                )}
              >
                {tokens.length}/{tokenLimit}
              </div>
            )}
          </div>
          <UnresolvedTokensIndicator
            unresolvedTokens={unresolvedTokens}
            isLoading={isLoading}
          />
        </header>
      )}

      {isLoading ? (
        <div className={cn('flex flex-1 flex-col gap-3', !isSection && 'p-3')}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <Skeleton className="h-[16px] w-24" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <PersistentScrollArea
            scrollViewportRef={scrollViewportRef}
            className="flex min-h-0 flex-1"
            viewportClassName="min-h-0 flex-1"
            contentClassName={cn(
              'flex flex-col gap-2.5',
              isSection ? 'pb-2.5 pr-0' : 'pt-3 pl-3 pb-2.5 pr-0',
            )}
            fadeEdges
          >
            {tokens.map((token) => {
              const key = normalizeTokenKey(token.key)
              const isDuplicateKey = duplicateKeyIds.has(token.id)
              const unresolved =
                key.length > 0 &&
                unresolvedKeys.has(key) &&
                token.value.trim().length === 0

              return (
                <div
                  key={token.id}
                  ref={(element) => {
                    if (element) {
                      tokenRowRefs.current.set(token.id, element)
                    } else {
                      tokenRowRefs.current.delete(token.id)
                    }
                  }}
                  className="flex flex-col gap-1.5"
                >
                  <label
                    className={cn(
                      'flex w-fit max-w-full min-w-0 items-center gap-0 rounded-[5px] pt-[3px] pr-[3px] pb-[2px] pl-[3px] font-mono text-[12.35px] leading-none font-medium',
                      isDuplicateKey
                        ? 'bg-danger-soft text-danger'
                        : unresolved
                          ? 'bg-token-unresolved-soft text-token-unresolved'
                          : 'bg-brand-soft text-brand',
                    )}
                  >
                    <span className="select-none">{'{{'}</span>
                    <input
                      ref={(element) => {
                        if (element) {
                          keyInputRefs.current.set(token.id, element)
                        } else {
                          keyInputRefs.current.delete(token.id)
                        }
                      }}
                      value={token.key}
                      aria-label="Token key"
                      aria-invalid={isDuplicateKey}
                      autoComplete="off"
                      placeholder="token"
                      size={Math.max(5, token.key.length || 5)}
                      onChange={(event) =>
                        onTokenChange(token.id, { key: event.target.value })
                      }
                      onBlur={onTokenBlur}
                      className={cn(
                        'relative -top-px [field-sizing:content] min-w-[1ch] bg-transparent px-[3px] py-0 outline-none',
                        isDuplicateKey
                          ? 'text-danger placeholder:text-danger-muted'
                          : unresolved
                            ? 'text-token-unresolved placeholder:text-token-unresolved/50'
                            : 'text-brand placeholder:text-brand/50',
                      )}
                    />
                    <span className="select-none">{'}}'}</span>
                  </label>
                  {isDuplicateKey && (
                    <p className="text-[11px] text-danger">
                      Duplicate key — the first value is kept
                    </p>
                  )}

                  <div className="flex min-w-0 items-center gap-1.5">
                    <Input
                      ref={(element) => {
                        if (element) {
                          valueInputRefs.current.set(token.id, element)
                        } else {
                          valueInputRefs.current.delete(token.id)
                        }
                      }}
                      value={token.value}
                      aria-label={`Value for ${formatToken(key)}`}
                      aria-invalid={unresolved}
                      autoComplete="off"
                      placeholder="Replacement text"
                      onChange={(event) =>
                        onTokenChange(token.id, { value: event.target.value })
                      }
                      onBlur={onTokenBlur}
                      className={cn(
                        'h-8 bg-background text-[13px] focus-visible:shadow-[inset_0_0_0_1px_var(--brand-border)] focus-visible:ring-0',
                        unresolved &&
                          'border-token-unresolved-border bg-token-unresolved-soft text-foreground placeholder:text-token-unresolved-muted focus-visible:border-token-unresolved-border focus-visible:shadow-[inset_0_0_0_1px_var(--token-unresolved-border)] aria-invalid:border-token-unresolved-border aria-invalid:ring-0',
                      )}
                    />
                    <button
                      type="button"
                      aria-label="Remove token"
                      onClick={() => onTokenDelete(token.id)}
                      className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-text-faint transition-colors hover:bg-danger-soft-fill hover:text-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}

            {tokens.length === 0 && (
              <div className="flex min-h-[120px] items-center justify-center px-3 text-center text-[12px] text-text-faint">
                Add a token to substitute values into your cover letter.
              </div>
            )}
          </PersistentScrollArea>

          {hiddenCount > 0 && (
            <p className="shrink-0 px-3 pt-2 text-[11px] text-text-faint">
              {hiddenCount} more {hiddenCount === 1 ? 'token is' : 'tokens are'}{' '}
              safely saved from Pro. Upgrade to use{' '}
              {hiddenCount === 1 ? 'it' : 'them'} again.
            </p>
          )}

          <footer
            className={cn(
              'mt-auto shrink-0 px-2 pt-2 pb-2',
              !isSection && 'border-t border-border',
            )}
          >
            {atTokenLimit && onUpgrade ? (
              <UpgradeCTA label="Upgrade for more tokens" onClick={onUpgrade} />
            ) : (
              <button
                type="button"
                onClick={handleTokenAdd}
                disabled={atTokenLimit}
                className="flex h-[41px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-transparent px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:border-brand-border hover:bg-brand-soft hover:text-brand disabled:pointer-events-none disabled:opacity-60"
              >
                <Plus size={13} />
                Add token
              </button>
            )}
          </footer>
        </>
      )}
    </section>
  )
}

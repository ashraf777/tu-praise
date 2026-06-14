'use client'

import { useEffect, useState } from 'react'
import { goalsApi } from '@/lib/api'
import { getEmployee } from '@/lib/auth'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

export function CommentThread({ goalNo }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState(null)

  useEffect(() => {
    setCurrentEmployee(getEmployee())
    fetchComments()
  }, [goalNo])

  const fetchComments = async () => {
    try {
      const res = await goalsApi.getComments(goalNo)
      setComments(res.data?.data?.comments || res.data?.comments || res.data?.data || (Array.isArray(res.data) ? res.data : []))
    } catch {}
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    setSubmitting(true)
    try {
      await goalsApi.addComment(goalNo, message.trim())
      setMessage('')
      toast.success('Comment added')
      fetchComments()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentNo) => {
    try {
      await goalsApi.deleteComment(goalNo, commentNo)
      setComments((c) => c.filter((cm) => cm.comment_no !== commentNo))
      toast.success('Comment deleted')
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-600" />
          Comments
          {!loading && (
            <span className="text-xs font-normal text-slate-400">({comments.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => {
              const isOwn = (c.author || c.employee)?.employee_no === currentEmployee?.employee_no
              return (
                <div key={c.comment_no} className="flex gap-3 group">
                  <Avatar className="h-8 w-8 shrink-0 bg-indigo-100">
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                      {getInitials((c.author || c.employee)?.employee_name || (c.author || c.employee)?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-800">{(c.author || c.employee)?.employee_name || (c.author || c.employee)?.name || 'Unknown'}</span>
                      <span className="text-xs text-slate-400">
                        {c.created_at
                          ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true })
                          : ''}
                      </span>
                    </div>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{c.message}</p>
                    </div>
                  </div>
                  {isOwn && (
                    <button
                      onClick={() => handleDelete(c.comment_no)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 self-start mt-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add comment form */}
        <form onSubmit={handleSubmit} className="flex gap-3 items-end border-t border-slate-100 pt-4">
          <Avatar className="h-8 w-8 shrink-0 bg-indigo-600 self-start mt-0.5">
            <AvatarFallback className="bg-indigo-600 text-white text-xs font-semibold">
              {getInitials((currentEmployee?.employee_name || currentEmployee?.name))}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Write a comment…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) handleSubmit(e)
              }}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={submitting || !message.trim()}
              >
                {submitting
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <><Send className="h-3.5 w-3.5 mr-1.5" /> Send</>
                }
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

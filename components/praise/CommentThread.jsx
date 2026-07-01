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
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Trash2, Loader2, ShieldCheck } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

export function CommentThread({ goalNo, readOnly }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState(null)

  async function fetchComments() {
    try {
      const res = await goalsApi.getComments(goalNo)
      setComments(res.data?.data?.comments || res.data?.comments || res.data?.data || (Array.isArray(res.data) ? res.data : []))
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => {
    const init = () => {
      setCurrentEmployee(getEmployee())
      fetchComments()
    }
    init()
  }, [goalNo])

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
      setComments((c) => c.filter((cm) => cm.goal_comment_no !== commentNo))
      toast.success('Comment deleted')
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return ''
    try {
      let formattedStr = dateStr
      if (typeof dateStr === 'string' && !dateStr.includes('T') && !dateStr.includes('Z') && !dateStr.includes('+')) {
        formattedStr = dateStr.replace(' ', 'T') + 'Z'
      }
      const d = new Date(formattedStr)
      return `${format(d, 'MMM d, yyyy HH:mm')} (${formatDistanceToNow(d, { addSuffix: true })})`
    } catch {
      return ''
    }
  }

  return (
    <Card className="border border-slate-200 border-t-[3px] border-t-primary shadow-sm rounded-none bg-white font-sans">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
          <MessageSquare className="h-4 w-4 text-primary" />
          Comments
          {!loading && (
            <span className="text-xs font-normal text-slate-400">({comments.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Comment list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-10 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => {
              const author = c.author || c.employee
              const isAdmin = author?.role === 'hr_admin'
              const isOwn = !readOnly && author?.employee_no === currentEmployee?.employee_no
              // Use `created` field (no timestamps on this model)
              const timestamp = formatTimestamp(c.created || c.created_at)

              return (
                <div
                  key={c.goal_comment_no}
                  className={`flex gap-3 group rounded-lg p-2 -mx-2 transition-colors ${isAdmin ? 'bg-indigo-50/60 border border-indigo-100' : ''}`}
                >
                  <Avatar className={`h-8 w-8 shrink-0 border ${isAdmin ? 'bg-indigo-100 border-indigo-200' : 'bg-slate-100 border-slate-200'}`}>
                    <AvatarFallback className={`text-xs font-semibold ${isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                      {isAdmin ? <ShieldCheck className="h-4 w-4" /> : getInitials(author?.employee_name || author?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-semibold ${isAdmin ? 'text-indigo-800' : 'text-slate-800'}`}>
                        {author?.employee_name || author?.name || 'Unknown'}
                      </span>
                      {isAdmin && (
                        <Badge className="bg-indigo-600 text-white text-[10px] px-1.5 py-0 h-4 font-semibold">
                          Admin
                        </Badge>
                      )}
                      <span className="text-[10px] text-slate-400">{timestamp}</span>
                    </div>
                    <div className={`rounded px-3 py-2 ${isAdmin ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50 border border-slate-100'}`}>
                      <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isAdmin ? 'text-indigo-900' : 'text-slate-700'}`}>{c.message}</p>
                    </div>
                  </div>
                  {isOwn && (
                    <button
                      onClick={() => handleDelete(c.goal_comment_no)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 self-start mt-1 cursor-pointer"
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
        {!readOnly && (
          <form onSubmit={handleSubmit} className="flex gap-3 items-end border-t border-slate-100 pt-4">
            <Avatar className="h-8 w-8 shrink-0 bg-slate-100 border border-slate-200 self-start mt-0.5">
              <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-semibold">
                {getInitials((currentEmployee?.employee_name || currentEmployee?.name))}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Write a comment…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="resize-none text-xs rounded-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey) handleSubmit(e)
                }}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-none cursor-pointer text-xs h-8"
                  disabled={submitting || !message.trim()}
                >
                  {submitting
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <><Send className="h-3 w-3 mr-1.5" /> Send</>
                  }
                </Button>
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

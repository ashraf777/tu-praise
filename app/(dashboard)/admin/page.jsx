'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target, Users, RefreshCw, ShieldCheck, ChevronRight } from 'lucide-react'

const ADMIN_SECTIONS = [
  {
    href: '/admin/employees',
    title: 'Employees',
    description: 'Manage employee accounts and roles',
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    href: '/admin/cycles',
    title: 'Performance Cycles',
    description: 'Manage appraisal cycles and periods',
    icon: RefreshCw,
    color: 'bg-green-50 text-green-600',
  },
  {
    href: '/admin/goals',
    title: 'All Goals',
    description: 'View and comment on employee goals',
    icon: Target,
    color: 'bg-indigo-50 text-indigo-600',
  },
]

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Admin Panel</h2>
        </div>
        <p className="text-sm text-slate-500">Manage your organization&apos;s performance system</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {ADMIN_SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href}>
              <Card className="border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${section.color} group-hover:scale-105 transition-transform`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-400 transition-colors mt-1" />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                    {section.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{section.description}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

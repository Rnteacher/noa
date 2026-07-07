import { t } from "@/lib/i18n";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/ui";
import {
  Bell,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Users,
  CalendarDays,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: isSuperAdmin } = await supabase.rpc("current_user_is_super_admin");

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col border-x border-line bg-surface-raised">
      <AppHeader
        title={t("app.title")}
        trailing={
          <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <Bell aria-hidden="true" className="h-5 w-5" />
            <span className="absolute top-2 end-2 h-2 w-2 rounded-full bg-status-critical ring-2 ring-surface-raised" />
          </button>
        }
      />

      {/* Scrollable Dashboard Area */}
      <main className="flex-1 p-4 space-y-6">
          
          {/* Welcome Dashboard Section */}
          <section className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 shadow-lg shadow-emerald-600/10">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold mb-1 tracking-tight">
                  {t("dashboard.welcome")}
                </h1>
                <p className="text-emerald-100 text-xs font-medium">
                  {t("dashboard.title")}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/10 text-center">
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-lg font-bold">3</div>
                <div className="text-[10px] text-emerald-100">{t("sections.followedStudents")}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-lg font-bold">2</div>
                <div className="text-[10px] text-emerald-100">{t("sections.announcements")}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <div className="text-lg font-bold">11:30</div>
                <div className="text-[10px] text-emerald-100">{t("nav.today")}</div>
              </div>
            </div>
          </section>

          {/* Search Mockup */}
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              readOnly
              placeholder={t("common.searchPlaceholder")}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 pr-10 pl-4 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-colors"
            />
          </div>

          {isSuperAdmin ? (
            <Link
              href="/admin/access-grants"
              className="flex items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-emerald-900 dark:text-emerald-100 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold">
                    {t("admin.accessGrants.shortLink")}
                  </span>
                  <span className="block text-xs text-emerald-700 dark:text-emerald-300">
                    {t("admin.accessGrants.shortDescription")}
                  </span>
                </span>
              </span>
            </Link>
          ) : null}

          {/* Today at Chamama */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                {t("sections.today")}
              </h2>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className="p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded">08:30</span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{t("mock.today.morningMeeting")}</span>
                </div>
                <span className="text-xs text-zinc-400">{t("mock.location.staffRoom")}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded">11:30</span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{t("mock.today.learningGroup")}</span>
                </div>
                <span className="text-xs text-zinc-400">{t("mock.location.room102")}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded">13:30</span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{t("mock.today.lunch")}</span>
                </div>
                <span className="text-xs text-zinc-400">{t("mock.location.diningRoom")}</span>
              </div>
            </div>
          </section>

          {/* Announcements */}
          <section className="space-y-3">
            <h2 className="font-bold text-zinc-950 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              {t("sections.announcements")}
            </h2>
            <div className="space-y-3">
              {/* Announcement 1 */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-150 dark:border-zinc-800 p-4 shadow-sm space-y-3 relative overflow-hidden ring-1 ring-rose-500/10">
                <div className="absolute top-0 right-0 left-0 h-1 bg-rose-500" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold">
                    {t("announcements.requiredAcknowledge")}
                  </span>
                  <span className="text-xs text-zinc-400">10:00</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 mb-1">
                    {t("mock.announcement.title1")}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {t("mock.announcement.body1")}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs text-zinc-400 font-medium">{t("mock.author.management")}</span>
                  <button className="text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-rose-500/10">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t("announcements.acknowledge")}
                  </button>
                </div>
              </div>

              {/* Announcement 2 */}
              <div className="bg-zinc-50 dark:bg-zinc-800/20 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-semibold">
                    {t("announcements.acknowledged")}
                  </span>
                  <span className="text-xs text-zinc-400">{t("mock.time.yesterday")}</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 mb-1">
                    {t("mock.announcement.title2")}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {t("mock.announcement.body2")}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-100/60 dark:border-zinc-800/60">
                  <span className="text-xs text-zinc-400">{t("mock.author.sysadmin")}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Followed Students */}
          <section className="space-y-3">
            <h2 className="font-bold text-zinc-950 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              {t("sections.followedStudents")}
            </h2>
            <div className="grid gap-3">
              {/* Student 1 */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-150 dark:border-zinc-800 p-3.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center font-bold">
                    {t("mock.student.initial1")}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                      {t("mock.student.name1")}
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {t("mock.student.project1")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-[10px] font-bold" title={t("student.projectStatus")}>
                    P
                  </span>
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-[10px] font-bold" title={t("student.emotionalStatus")}>
                    E
                  </span>
                </div>
              </div>

              {/* Student 2 */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-150 dark:border-zinc-800 p-3.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-600 flex items-center justify-center font-bold">
                    {t("mock.student.initial2")}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                      {t("mock.student.name2")}
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {t("mock.student.project2")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 text-[10px] font-bold" title={t("student.projectStatus")}>
                    P
                  </span>
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-[10px] font-bold" title={t("student.emotionalStatus")}>
                    E
                  </span>
                </div>
              </div>

              {/* Student 3 */}
              <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-150 dark:border-zinc-800 p-3.5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 flex items-center justify-center font-bold">
                    {t("mock.student.initial3")}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">
                      {t("mock.student.name3")}
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {t("mock.student.project3")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 text-[10px] font-bold" title={t("student.projectStatus")}>
                    P
                  </span>
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 text-[10px] font-bold" title={t("student.emotionalStatus")}>
                    E
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Weekly Events */}
          <section className="space-y-3">
            <h2 className="font-bold text-zinc-950 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              {t("sections.weeklyEvents")}
            </h2>
            <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className="p-3.5 flex items-start gap-3">
                <div className="text-center bg-zinc-200/60 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg min-w-[44px]">
                  <div className="text-[10px] text-zinc-500 font-bold leading-none">{t("mock.day.monday")}</div>
                  <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-1">14:00</div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{t("mock.weekly.event1")}</h4>
                  <p className="text-xs text-zinc-400">{t("mock.location.meetingRoom")}</p>
                </div>
              </div>

              <div className="p-3.5 flex items-start gap-3">
                <div className="text-center bg-zinc-200/60 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg min-w-[44px]">
                  <div className="text-[10px] text-zinc-500 font-bold leading-none">{t("mock.day.wednesday")}</div>
                  <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-1">09:00</div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{t("mock.weekly.event2")}</h4>
                  <p className="text-xs text-zinc-400">{t("mock.location.zoom")}</p>
                </div>
              </div>

              <div className="p-3.5 flex items-start gap-3">
                <div className="text-center bg-zinc-200/60 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg min-w-[44px]">
                  <div className="text-[10px] text-zinc-500 font-bold leading-none">{t("mock.day.thursday")}</div>
                  <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-1">12:00</div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{t("mock.weekly.event3")}</h4>
                  <p className="text-xs text-zinc-400">{t("mock.location.library")}</p>
                </div>
              </div>
            </div>
          </section>

        </main>
    </div>
  );
}

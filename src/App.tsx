import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppStateProvider, useAppState } from '@/state/AppState'
import { Layout } from '@/components/Layout'
import { LotusOnboarding } from '@/components/onboarding/LotusOnboarding'
import { PageTransition } from '@/motion/PageTransition'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const BaZiPage = lazy(() => import('@/pages/BaZiPage').then((m) => ({ default: m.BaZiPage })))
const PublishPage = lazy(() => import('@/pages/PublishPage').then((m) => ({ default: m.PublishPage })))
const ResultPage = lazy(() => import('@/pages/ResultPage').then((m) => ({ default: m.ResultPage })))
const SchedulePage = lazy(() => import('@/pages/SchedulePage').then((m) => ({ default: m.SchedulePage })))
const CalendarPage = lazy(() => import('@/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })))
const TalentPage = lazy(() => import('@/pages/TalentPage').then((m) => ({ default: m.TalentPage })))
const MePage = lazy(() => import('@/pages/MePage').then((m) => ({ default: m.MePage })))
const HistoryPage = lazy(() => import('@/pages/HistoryPage').then((m) => ({ default: m.HistoryPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const AboutPage = lazy(() => import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })))

function RouteFallback() {
  return <div className="min-h-[60dvh] bg-transparent" aria-hidden />
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <PageTransition locationKey={location.pathname}>
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/lotus" element={<LotusOnboarding mode="edit" />} />
          <Route path="/bazi" element={<BaZiPage />} />
          <Route path="/publish" element={<PublishPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/talent" element={<TalentPage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </PageTransition>
  )
}

function Shell() {
  const { ready, baziInput } = useAppState()
  if (!ready) return <div className="min-h-dvh bg-ru" />
  if (!baziInput) return <LotusOnboarding />
  return (
    <Layout>
      <AnimatedRoutes />
    </Layout>
  )
}

export default function App() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  )
}

'use client';

import Image from 'next/image';
import React from 'react';
import { ArrowRight, Check, ExternalLink, Eye, EyeOff, KeyRound, Mail, ShieldCheck, X } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { companyLinks, loginCopy, type LoginLanguage } from '@/features/auth/loginContent';
import { isDemoLocalMode } from '@/lib/runtimeExecutionMode';
import { useAuthStore } from '@/store/authStore';

type RecoveryMode = 'id' | 'password' | null;

export function LoginExperience() {
  const { users, loginAs, loginWithCredentials, loginError, isAuthenticating, clearLoginError, rememberLogin, setRememberLogin } = useAuthStore();
  const [identifier, setIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [language, setLanguage] = React.useState<LoginLanguage>('ko');
  const [recoveryMode, setRecoveryMode] = React.useState<RecoveryMode>(null);
  const [attempted, setAttempted] = React.useState(false);
  const t = loginCopy[language];
  const demoLocal = isDemoLocalMode();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/workspace';
  const asset = (path: string) => `${basePath}${path}`;

  React.useEffect(() => { document.documentElement.lang = language; }, [language]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    clearLoginError();
    if (!identifier.includes('@') || password.length < 8) return;
    await loginWithCredentials(identifier, password);
  };

  const invalidForm = Boolean(identifier || password) && (!identifier.includes('@') || password.length < 8);
  const demoUsers = users.filter((user) => ['SUPER_ADMIN', 'DEPARTMENT_MANAGER', 'WORKER'].includes(user.role)).slice(0, 3);

  return (
    <main className="min-h-screen bg-[#e9edf2] lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(480px,.92fr)]">
      <section className="relative flex min-h-[410px] overflow-hidden bg-[#071326] text-white lg:min-h-screen" aria-labelledby="login-hero-title">
        <Image src={asset('/brand/con-cost-login-hero.png')} alt="" fill priority className="object-cover object-center" sizes="(min-width: 1024px) 56vw, 100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,20,.04)_0%,rgba(2,8,20,.1)_38%,rgba(2,8,20,.88)_100%)]" />
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[#f36b10]" />
        <div className="relative flex w-full flex-col justify-end px-7 pb-7 pt-12 sm:px-10 sm:pb-10 lg:px-14 lg:pb-12 xl:px-20">
          <div className="max-w-[760px]">
            <p className="mb-4 text-xs font-black tracking-[.2em] text-[#ff9c5c]">CONCOST GROUP · ERP</p>
            <h1 id="login-hero-title" className="text-[clamp(22px,3.2vw,56px)] font-black leading-[1.12] tracking-[0] text-white">
              {t.headlineLines.map((line) => <span key={line} className="block whitespace-nowrap">{line}</span>)}
            </h1>
            <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-200 sm:text-base lg:text-lg">{t.subheadline}</p>
          </div>
          <div className="mt-7 border-t border-white/30 pt-5">
            <p className="mb-3 text-[10px] font-black tracking-[.18em] text-white/65">{t.brandLinks}</p>
            <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
              {companyLinks.map((link) => (
                <a key={link.id} href={link.href} target="_blank" rel="noreferrer" className="group min-w-0 border-b border-white/25 pb-3 transition hover:-translate-y-0.5 hover:border-[#ff8a3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a3d]">
                  <span className="flex h-12 w-full items-center"><Image src={asset(link.image)} alt="" width={180} height={64} className={`${link.imageClassName} max-h-12 max-w-full object-contain object-left drop-shadow-[0_2px_8px_rgba(255,255,255,.28)]`} /></span>
                  <span className="mt-2 flex items-center gap-1.5 text-[11px] font-black leading-4 text-white"><span className="min-w-0 flex-1">{link.label}</span><ExternalLink className="h-3.5 w-3.5 shrink-0 text-white/60 transition group-hover:text-[#ff9c5c]" /></span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center bg-white px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="absolute right-6 top-6 flex border border-[#dfe4ec] bg-[#f5f7fa] p-1" aria-label="Language">
          {(['ko', 'en', 'vi'] as const).map((code) => <button key={code} type="button" onClick={() => setLanguage(code)} aria-pressed={language === code} className={`min-h-8 min-w-10 px-2 text-[11px] font-black uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300] ${language === code ? 'bg-[#172554] text-white' : 'text-[#657189] hover:bg-white'}`}>{code}</button>)}
        </div>
        <div className="w-full max-w-[470px] pt-12 lg:pt-0">
          <BrandLogo className="h-[58px] w-[250px] max-w-[68vw]" />
          <div className="mt-10 border-l-4 border-[#eb6300] pl-5">
            <p className="text-[11px] font-black tracking-[.16em] text-[#eb6300]">{t.loginEyebrow}</p>
            <h2 className="mt-2 text-[34px] font-black leading-tight tracking-[0] text-[#111827] sm:text-[40px]">{t.loginTitle}</h2>
            <p className="mt-3 text-sm font-medium text-[#667085]">{t.loginBody}</p>
          </div>
          <div className="mt-7 inline-flex items-center gap-2 bg-[#f3f6fa] px-3 py-2 text-[11px] font-black text-[#4d5e78]"><ShieldCheck className="h-4 w-4 text-[#eb6300]" /> {t.secure}</div>

          <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
            <label className="block"><span className="mb-2 block text-sm font-black text-[#202938]">{t.email}</span><span className="flex min-h-14 items-center border border-[#cfd6e2] bg-white px-4 focus-within:border-[#eb6300] focus-within:ring-4 focus-within:ring-[#eb6300]/10"><Mail className="mr-3 h-5 w-5 text-[#7c8aa3]" /><input value={identifier} onChange={(event) => { setIdentifier(event.target.value); clearLoginError(); }} type="email" inputMode="email" autoComplete="username" className="w-full bg-transparent py-3 text-sm font-semibold text-[#111827] outline-none" placeholder={t.emailPlaceholder} required /></span></label>
            <label className="block"><span className="mb-2 block text-sm font-black text-[#202938]">{t.password}</span><span className="flex min-h-14 items-center border border-[#cfd6e2] bg-white px-4 focus-within:border-[#eb6300] focus-within:ring-4 focus-within:ring-[#eb6300]/10"><KeyRound className="mr-3 h-5 w-5 text-[#7c8aa3]" /><input value={password} onChange={(event) => { setPassword(event.target.value); clearLoginError(); }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="w-full bg-transparent py-3 text-sm font-semibold text-[#111827] outline-none" placeholder={t.passwordPlaceholder} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? t.hidePassword : t.showPassword} className="p-2 text-[#667085] hover:bg-[#f3f5f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
              <label className="flex cursor-pointer items-center gap-2 text-[#344054]"><span className={`flex h-5 w-5 items-center justify-center border ${rememberLogin ? 'border-[#eb6300] bg-[#eb6300] text-white' : 'border-[#cfd6e2] bg-white'}`}>{rememberLogin && <Check className="h-3.5 w-3.5" />}</span><input type="checkbox" checked={rememberLogin} onChange={(event) => setRememberLogin(event.target.checked)} className="sr-only" />{t.remember}</label>
              <span className="flex items-center gap-3 text-[#4d5e78]"><button type="button" onClick={() => setRecoveryMode('id')} className="hover:text-[#eb6300] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300]">{t.findId}</button><span className="h-3 w-px bg-[#d6dce5]" /><button type="button" onClick={() => setRecoveryMode('password')} className="hover:text-[#eb6300] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300]">{t.findPassword}</button></span>
            </div>
            {((attempted && (!identifier.includes('@') || password.length < 8)) || loginError) && <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{invalidForm || !identifier || !password ? t.invalidInput : t.authFailed}</p>}
            <button type="submit" disabled={isAuthenticating} className="group flex min-h-14 w-full items-center justify-center gap-2 bg-[#111827] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(17,24,39,.18)] transition hover:bg-[#eb6300] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f7a56b] disabled:cursor-wait disabled:opacity-60">{isAuthenticating ? t.authenticating : t.login}{!isAuthenticating && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}</button>
          </form>

          {demoLocal && demoUsers.length > 0 && <details className="mt-6 border border-dashed border-[#cfd6e2] bg-[#f8fafc] p-4"><summary className="cursor-pointer text-[11px] font-black uppercase tracking-[.12em] text-[#667085]">{t.demoAccounts}</summary><div className="mt-3 flex flex-wrap gap-2">{demoUsers.map((user) => <button key={user.id} type="button" onClick={() => loginAs(user.id)} className="border border-[#d7dde7] bg-white px-3 py-2 text-xs font-bold text-[#273e7a] hover:border-[#eb6300] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300]">{user.displayName ?? user.name}</button>)}</div></details>}
        </div>
      </section>

      {recoveryMode && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07152f]/75 p-4" role="presentation" onMouseDown={() => setRecoveryMode(null)}><section role="dialog" aria-modal="true" aria-labelledby="recovery-title" className="w-full max-w-md border border-[#dce2eb] bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><span className="flex h-10 w-10 items-center justify-center bg-[#fff0e6] text-[#eb6300]"><ShieldCheck className="h-5 w-5" /></span><h3 id="recovery-title" className="mt-4 text-xl font-black text-[#111827]">{recoveryMode === 'id' ? t.recoveryTitleId : t.recoveryTitlePassword}</h3></div><button type="button" onClick={() => setRecoveryMode(null)} aria-label={t.close} className="p-2 text-[#667085] hover:bg-[#f3f5f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300]"><X className="h-5 w-5" /></button></div><p className="mt-4 text-sm leading-6 text-[#667085]">{t.recoveryBody}</p><button type="button" onClick={() => setRecoveryMode(null)} className="mt-6 w-full bg-[#172554] px-5 py-3 text-xs font-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300]">{t.close}</button></section></div>}
    </main>
  );
}

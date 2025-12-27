
import React from 'react';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  ExternalLink, 
  Globe, 
  ShieldCheck, 
  Clock,
  ArrowRight
} from 'lucide-react';

export const Support: React.FC = () => {
  const contactData = [
    {
      label: 'Instant Support Link',
      title: 'WhatsApp Business',
      value: '+91 7972065231',
      link: 'https://wa.me/917972065231',
      icon: <MessageCircle className="text-emerald-500" size={28} />,
      color: 'bg-emerald-50',
      action: 'Open Chat'
    },
    {
      label: 'Technical Helpline',
      title: 'Direct Voice Link',
      value: '+91 7972065231',
      link: 'tel:+917972065231',
      icon: <Phone className="text-brand-navy" size={28} />,
      color: 'bg-blue-50',
      action: 'Call Now'
    },
    {
      label: 'Official Correspondence',
      title: 'System Support Email',
      value: 'admin@advedasolutions.in',
      link: 'mailto:admin@advedasolutions.in',
      icon: <Mail className="text-rose-500" size={28} />,
      color: 'bg-rose-50',
      action: 'Send Email'
    }
  ];

  return (
    <div className="min-h-screen lg:min-h-[80vh] flex flex-col items-center justify-start lg:justify-center p-4 md:p-8 animate-fade-in">
      <div className="w-full max-w-2xl space-y-10 lg:space-y-16">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-navy text-brand-accent text-[10px] font-black uppercase tracking-[0.2em] shadow-xl border border-brand-accent/20">
            <ShieldCheck size={14} /> Tier-3 Infrastructure Support
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-brand-navy tracking-tighter uppercase leading-none">
            Technical <span className="text-brand-accent">Hub.</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm lg:text-base max-w-md mx-auto">
            High-priority communication channels for Zinic enterprise administrators.
          </p>
        </div>
        
        {/* Contact Grid */}
        <div className="grid grid-cols-1 gap-4 lg:gap-6">
          {contactData.map((contact, idx) => (
            <a 
              key={idx} 
              href={contact.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,10,18,0.05)] border border-slate-100 hover:border-brand-accent hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex items-center gap-6 relative overflow-hidden"
            >
              {/* Decorative accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-brand-accent/5 transition-colors"></div>
              
              <div className={`w-16 h-16 lg:w-20 lg:h-20 ${contact.color} rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner`}>
                {contact.icon}
              </div>

              <div className="flex-1 min-w-0 relative z-10">
                <p className="text-[10px] lg:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <Clock size={12} className="text-brand-accent" /> {contact.label}
                </p>
                <h4 className="text-[10px] font-black text-brand-navy/30 uppercase tracking-widest mb-0.5">{contact.title}</h4>
                <p className="font-black text-brand-navy text-lg lg:text-2xl truncate tracking-tight">
                  {contact.value}
                </p>
              </div>

              <div className="hidden sm:flex flex-col items-end gap-2 shrink-0 relative z-10">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-brand-accent transition-colors">
                  {contact.action}
                </span>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-navy group-hover:text-brand-accent group-hover:rotate-45 transition-all">
                  <ArrowRight size={20} />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Developer Branding - Redesigned for Logo Visibility */}
        <div className="pt-16 pb-20 lg:pb-0 flex flex-col items-center text-center space-y-10">
          <div className="flex items-center gap-6 w-full">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-200"></div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] whitespace-nowrap">Core Architecture</p>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-200"></div>
          </div>
          
          <div className="flex flex-col items-center space-y-8 w-full">
            <div className="space-y-2">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Developed and Designed by</p>
            </div>
            
            <a 
              href="https://www.advedasolutions.in" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-6 transition-all duration-500"
            >
              {/* High-visibility logo container */}
              <div className="relative">
                <div className="absolute inset-0 bg-brand-accent/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-10 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 group-hover:border-brand-accent/30 transition-all flex items-center justify-center">
                  <img 
                    src="https://advedasolutions.in/logo.png" 
                    alt="Adveda Solutions" 
                    className="h-16 w-auto object-contain transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-xl font-black text-brand-navy tracking-tighter group-hover:text-brand-accent transition-colors flex items-center gap-3">
                   ADVEDA SOLUTIONS <ExternalLink size={16} className="opacity-20 group-hover:opacity-100" />
                </div>
                <div className="flex items-center justify-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg">
                    <Globe size={12} className="text-brand-accent" /> www.advedasolutions.in
                  </span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
